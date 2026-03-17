import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CurrencyContext = createContext(null);

const STORAGE_KEY = 'fk_currency_detection';
const CACHE_TTL_MS = 12 * 60 * 60 * 1000;
const DEFAULT_COUNTRY_CODE = 'IN';

const getCachedDetection = () => {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed?.countryCode || !parsed?.detectedAt) return null;

    if (Date.now() - parsed.detectedAt > CACHE_TTL_MS) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
};

const saveCachedDetection = (countryCode, source) => {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        countryCode,
        source,
        detectedAt: Date.now(),
      })
    );
  } catch {
    // Ignore storage failures.
  }
};

const getHeuristicCountryCode = () => {
  if (typeof window === 'undefined') return DEFAULT_COUNTRY_CODE;

  try {
    const languages = navigator.languages || [navigator.language || ''];
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const localeRegion = (() => {
      try {
        const locale = new Intl.Locale(navigator.language || 'en-IN');
        return locale.region || '';
      } catch {
        return '';
      }
    })();

    if (languages.some((language) => /-NP$/i.test(language))) return 'NP';
    if (/Asia\/Kathmandu/i.test(timeZone)) return 'NP';
    if (/^NP$/i.test(localeRegion)) return 'NP';
  } catch {
    return DEFAULT_COUNTRY_CODE;
  }

  return DEFAULT_COUNTRY_CODE;
};

const fetchCountryCode = async (url, reader) => {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), 2500);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) return null;

    const payload = await response.json();
    return reader(payload);
  } catch {
    return null;
  } finally {
    window.clearTimeout(timeoutId);
  }
};

const detectCountryCode = async () => {
  const detectors = [
    {
      url: 'https://ipwho.is/',
      reader: (payload) => (payload?.success === false ? null : payload?.country_code || null),
    },
    {
      url: 'https://ipapi.co/json/',
      reader: (payload) => payload?.country_code || null,
    },
  ];

  for (const detector of detectors) {
    const countryCode = await fetchCountryCode(detector.url, detector.reader);
    if (countryCode) {
      return { countryCode: countryCode.toUpperCase(), source: detector.url };
    }
  }

  return null;
};

export const CurrencyProvider = ({ children }) => {
  const cached = getCachedDetection();
  const [countryCode, setCountryCode] = useState(
    cached?.countryCode || getHeuristicCountryCode()
  );
  const [detectionSource, setDetectionSource] = useState(
    cached?.source || 'heuristic'
  );
  const [isDetecting, setIsDetecting] = useState(!cached);

  useEffect(() => {
    let active = true;

    const detect = async () => {
      const result = await detectCountryCode();
      if (!active) return;

      if (result?.countryCode) {
        setCountryCode(result.countryCode);
        setDetectionSource(result.source);
        saveCachedDetection(result.countryCode, result.source);
      }

      setIsDetecting(false);
    };

    detect();

    return () => {
      active = false;
    };
  }, []);

  const value = useMemo(() => {
    const isNepal = countryCode === 'NP';
    return {
      countryCode,
      currency: isNepal ? 'NPR' : 'INR',
      isNepal,
      detectionSource,
      isDetecting,
    };
  }, [countryCode, detectionSource, isDetecting]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
};

const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within CurrencyProvider');
  }
  return context;
};

export default useCurrency;