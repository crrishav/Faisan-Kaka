import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { colord } from 'colord';
import Footer from '../Components/footer.jsx';
import tshirtFrontMock from '../assets/mock images/T-shirt (front).png';
import tshirtBackMock from '../assets/mock images/T-shirt (back).png';
import hoodieFrontMock from '../assets/mock images/hoodie (front).png';
import hoodieBackMock from '../assets/mock images/hoodie (back).png';

const ACCEPTED_TYPES = [
  'image/png',
  'image/svg+xml',
  'image/jpeg',
  'image/jpg',
  'application/pdf',
];

const ACCEPTED_EXTENSIONS = ['.png', '.svg', '.jpg', '.jpeg', '.pdf'];
const MAX_UPLOADS = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.14,
      delayChildren: 0.12,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 22 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};

const panelVariants = {
  hidden: { opacity: 0, y: 18, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.62, ease: [0.22, 1, 0.36, 1] },
  },
};

const MOCK_IMAGE_MAP = {
  tshirt: {
    front: tshirtFrontMock,
    back: tshirtBackMock,
  },
  hoodie: {
    front: hoodieFrontMock,
    back: hoodieBackMock,
  },
};

const DEFAULT_TRANSFORM = { x: 0, y: 0, scale: 1 };
const COLOR_PRESETS = ['#111111', '#2F2F2F', '#545454', '#888888', '#D9D9D9', '#0F3D2E', '#1E3A8A', '#7C2D12', '#7F1D1D', '#5B21B6'];

const isValidFile = (file) => {
  if (!file) return false;
  const ext = `.${String(file.name || '').split('.').pop()?.toLowerCase() || ''}`;
  return ACCEPTED_TYPES.includes(file.type) || ACCEPTED_EXTENSIONS.includes(ext);
};

const formatFileSize = (size) => {
  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
};

const createArtworkEntry = (file) => ({
  id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
  file,
  name: file.name,
  size: file.size,
  isPdf: file.type === 'application/pdf' || String(file.name).toLowerCase().endsWith('.pdf'),
  previewUrl: file.type.startsWith('image/') || String(file.name).toLowerCase().endsWith('.svg') ? URL.createObjectURL(file) : '',
  transforms: {
    front: { ...DEFAULT_TRANSFORM },
    back: { ...DEFAULT_TRANSFORM },
  },
});

const clampStageZoom = (value) => Math.min(3.5, Math.max(1, value));

const MockupStage = ({
  activeMockup,
  garmentColor,
  artworks,
  activeArtworkId,
  activeSide,
  onArtworkPointerDown,
  onStagePointerDown,
  onStagePointerMove,
  onStagePointerUp,
  onStageWheel,
  onSelectArtwork,
  stageZoom,
  stagePan,
  emptyLabel,
  heightClassName,
  artworkClassName,
}) => {
  return (
    <div
      className={`relative rounded-2xl bg-gradient-to-b from-white to-[#e8e8e8] border border-black/10 overflow-hidden ${heightClassName}`}
      onPointerMove={onStagePointerMove}
      onPointerUp={onStagePointerUp}
      onPointerLeave={onStagePointerUp}
      onWheel={onStageWheel}
    >
      <div
        className="absolute inset-0"
        style={{
          transform: `translate(${stagePan.x}px, ${stagePan.y}px) scale(${stageZoom})`,
          transformOrigin: 'center center',
          transition: stageZoom === 1 && stagePan.x === 0 && stagePan.y === 0 ? 'transform 140ms ease-out' : 'none',
        }}
      >
        <div className="absolute inset-2 sm:inset-3 rounded-xl overflow-hidden isolate" onPointerDown={onStagePointerDown}>
          <img
            src={activeMockup}
            alt="Garment mockup"
            className="h-full w-full object-cover object-center scale-[1.24] sm:scale-[1.14] md:scale-[1.08] select-none"
            style={{ filter: 'grayscale(1) contrast(1.45) brightness(0.46)' }}
            draggable={false}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundColor: garmentColor,
              WebkitMaskImage: `url(${activeMockup})`,
              maskImage: `url(${activeMockup})`,
              WebkitMaskSize: 'cover',
              maskSize: 'cover',
              WebkitMaskRepeat: 'no-repeat',
              maskRepeat: 'no-repeat',
              WebkitMaskPosition: 'center',
              maskPosition: 'center',
              opacity: 0.98,
            }}
          />
          <img
            src={activeMockup}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover object-center scale-[1.24] sm:scale-[1.14] md:scale-[1.08] pointer-events-none select-none"
            style={{ filter: 'grayscale(1) contrast(1.45) brightness(1.18)', opacity: 0.34, mixBlendMode: 'screen' }}
            draggable={false}
          />
        </div>

        {artworks.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-xs font-semibold tracking-wide uppercase text-black/35 bg-white/70 px-3 py-1.5 rounded-full border border-black/10">
              {emptyLabel}
            </p>
          </div>
        )}

        {artworks.map((artwork) => {
          const transform = artwork.transforms[activeSide];
          const isActive = artwork.id === activeArtworkId;

          return (
            <div
              key={artwork.id}
              role="button"
              tabIndex={0}
              className="absolute left-1/2 top-[46%] select-none"
              onPointerDown={(e) => onArtworkPointerDown(e, artwork.id)}
              onClick={() => onSelectArtwork(artwork.id)}
              onKeyDown={() => {}}
              style={{
                transform: `translate(calc(-50% + ${transform.x}px), calc(-50% + ${transform.y}px)) scale(${transform.scale})`,
                cursor: isActive ? 'grab' : 'pointer',
                touchAction: 'none',
                zIndex: isActive ? 20 : 10,
              }}
              aria-label={`Move artwork ${artwork.name}`}
            >
              <div className={`relative ${isActive ? 'ring-2 ring-black/30 ring-offset-4 ring-offset-transparent rounded-xl' : ''}`}>
                {artwork.isPdf ? (
                  <div className="min-w-24 h-24 px-3 rounded-xl bg-black text-white text-xs font-black flex items-center justify-center border border-white/20 shadow-lg">
                    PDF
                  </div>
                ) : (
                  <img
                    src={artwork.previewUrl}
                    alt={artwork.name}
                    className={`${artworkClassName} object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.25)]`}
                    draggable={false}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const PrintStudioPage = () => {
  const location = useLocation();
  const inputRef = useRef(null);
  const routeFileHydratedRef = useRef(false);
  const artworksRef = useRef([]);
  const [garment, setGarment] = useState('tshirt');
  const [activeSide, setActiveSide] = useState('front');
  const [error, setError] = useState('');
  const [artworks, setArtworks] = useState([]);
  const [activeArtworkId, setActiveArtworkId] = useState(null);
  const [garmentColor, setGarmentColor] = useState('#111111');
  const [garmentColorInput, setGarmentColorInput] = useState('#111111');
  const [garmentColorError, setGarmentColorError] = useState('');
  const [dragMeta, setDragMeta] = useState(null);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [stageZoom, setStageZoom] = useState(1);
  const [stagePan, setStagePan] = useState({ x: 0, y: 0 });
  const [isStagePanning, setIsStagePanning] = useState(false);
  const [stagePanStart, setStagePanStart] = useState({ x: 0, y: 0 });

  const activeMockup = MOCK_IMAGE_MAP[garment][activeSide];
  const activeArtwork = useMemo(
    () => artworks.find((artwork) => artwork.id === activeArtworkId) || artworks[0] || null,
    [artworks, activeArtworkId]
  );

  useEffect(() => {
    const mockups = Object.values(MOCK_IMAGE_MAP).flatMap((entry) => Object.values(entry));
    mockups.forEach((src) => {
      const image = new Image();
      image.src = src;
    });
  }, []);

  useEffect(() => {
    if (!routeFileHydratedRef.current && location.state?.uploadedFile instanceof File) {
      routeFileHydratedRef.current = true;
      const nextArtwork = createArtworkEntry(location.state.uploadedFile);
      setArtworks([nextArtwork]);
      setActiveArtworkId(nextArtwork.id);
      setError('');
    }
  }, [location.state]);

  useEffect(() => {
    if (artworks.length === 0) {
      setActiveArtworkId(null);
      return;
    }
    if (!artworks.some((artwork) => artwork.id === activeArtworkId)) {
      setActiveArtworkId(artworks[0].id);
    }
  }, [artworks, activeArtworkId]);

  useEffect(() => {
    artworksRef.current = artworks;
  }, [artworks]);

  useEffect(() => {
    return () => {
      artworksRef.current.forEach((artwork) => {
        if (artwork.previewUrl) {
          URL.revokeObjectURL(artwork.previewUrl);
        }
      });
    };
  }, []);

  useEffect(() => {
    if (!isFullscreenOpen) return undefined;
    document.body.style.overflow = 'hidden';
    const onEsc = (e) => {
      if (e.key === 'Escape') {
        setIsFullscreenOpen(false);
        setIsStagePanning(false);
      }
    };
    window.addEventListener('keydown', onEsc);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onEsc);
    };
  }, [isFullscreenOpen]);

  const addFiles = useCallback((fileList) => {
    const incomingFiles = Array.from(fileList || []);
    if (incomingFiles.length === 0) return;

    const nextEntries = [];
    const nextErrors = [];

    incomingFiles.forEach((file) => {
      if (nextEntries.length + artworks.length >= MAX_UPLOADS) {
        nextErrors.push(`You can upload up to ${MAX_UPLOADS} files.`);
        return;
      }
      if (!isValidFile(file)) {
        nextErrors.push(`${file.name}: unsupported file type.`);
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        nextErrors.push(`${file.name}: file must be 10 MB or smaller.`);
        return;
      }
      nextEntries.push(createArtworkEntry(file));
    });

    if (nextEntries.length > 0) {
      setArtworks((prev) => [...prev, ...nextEntries]);
      setActiveArtworkId((prev) => prev || nextEntries[0].id);
    }

    setError(nextErrors.join(' '));
  }, [artworks.length]);

  const removeArtwork = useCallback((artworkId) => {
    setArtworks((prev) => {
      const target = prev.find((artwork) => artwork.id === artworkId);
      if (target?.previewUrl) {
        URL.revokeObjectURL(target.previewUrl);
      }
      return prev.filter((artwork) => artwork.id !== artworkId);
    });
  }, []);

  const handleDrop = (e) => {
    e.preventDefault();
    addFiles(e.dataTransfer.files);
  };

  const handleInputChange = (e) => {
    addFiles(e.target.files);
    e.target.value = '';
  };

  const updateArtworkTransform = useCallback((artworkId, side, updater) => {
    setArtworks((prev) => prev.map((artwork) => {
      if (artwork.id !== artworkId) return artwork;
      return {
        ...artwork,
        transforms: {
          ...artwork.transforms,
          [side]: updater(artwork.transforms[side]),
        },
      };
    }));
  }, []);

  const centerArtwork = () => {
    if (!activeArtwork) return;
    updateArtworkTransform(activeArtwork.id, activeSide, (transform) => ({ ...transform, x: 0, y: 0 }));
  };

  const scaleUp = () => {
    if (!activeArtwork) return;
    updateArtworkTransform(activeArtwork.id, activeSide, (transform) => ({
      ...transform,
      scale: Math.min(3, +(transform.scale + 0.1).toFixed(2)),
    }));
  };

  const scaleDown = () => {
    if (!activeArtwork) return;
    updateArtworkTransform(activeArtwork.id, activeSide, (transform) => ({
      ...transform,
      scale: Math.max(0.2, +(transform.scale - 0.1).toFixed(2)),
    }));
  };

  const handleArtworkPointerDown = (e, artworkId) => {
    const artwork = artworks.find((item) => item.id === artworkId);
    if (!artwork) return;
    e.preventDefault();
    e.stopPropagation();
    const transform = artwork.transforms[activeSide];
    setActiveArtworkId(artworkId);
    setDragMeta({
      artworkId,
      offsetX: e.clientX - transform.x,
      offsetY: e.clientY - transform.y,
    });
  };

  const handleStagePointerMove = (e) => {
    if (dragMeta) {
      updateArtworkTransform(dragMeta.artworkId, activeSide, (transform) => ({
        ...transform,
        x: e.clientX - dragMeta.offsetX,
        y: e.clientY - dragMeta.offsetY,
      }));
      return;
    }

    if (isStagePanning && stageZoom > 1) {
      setStagePan({
        x: e.clientX - stagePanStart.x,
        y: e.clientY - stagePanStart.y,
      });
    }
  };

  const stopPointerInteractions = () => {
    setDragMeta(null);
    setIsStagePanning(false);
  };

  const handleStagePointerDown = (e) => {
    if (stageZoom <= 1) return;
    setIsStagePanning(true);
    setStagePanStart({ x: e.clientX - stagePan.x, y: e.clientY - stagePan.y });
  };

  const resetStageView = () => {
    setStageZoom(1);
    setStagePan({ x: 0, y: 0 });
    setIsStagePanning(false);
  };

  const handleStageWheel = (e) => {
    if (!isFullscreenOpen) return;
    e.preventDefault();
    setStageZoom((prev) => {
      const next = clampStageZoom(prev + (e.deltaY > 0 ? -0.12 : 0.12));
      if (next === 1) {
        setStagePan({ x: 0, y: 0 });
      }
      return next;
    });
  };

  const commitGarmentColor = useCallback((rawValue) => {
    const normalized = rawValue.startsWith('#') ? rawValue : `#${rawValue}`;
    if (!colord(normalized).isValid()) {
      setGarmentColorError('Enter a valid hex color (example: #1a1a1a).');
      return;
    }
    const nextHex = colord(normalized).toHex();
    setGarmentColor(nextHex);
    setGarmentColorInput(nextHex);
    setGarmentColorError('');
  }, []);

  const resetGarmentColor = () => {
    setGarmentColor('#111111');
    setGarmentColorInput('#111111');
    setGarmentColorError('');
  };

  const handleGarmentColorInputChange = (e) => {
    setGarmentColorInput(e.target.value);
    if (garmentColorError) {
      setGarmentColorError('');
    }
  };

  const handleGarmentColorPreset = (hex) => {
    setGarmentColor(hex);
    setGarmentColorInput(hex);
    setGarmentColorError('');
  };

  const hasUploads = artworks.length > 0;

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f5f5] overflow-x-hidden">
      <main className="flex-1 px-4 sm:px-8 pt-28 pb-16">
        <motion.div
          className="max-w-7xl mx-auto"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.p variants={itemVariants} className="text-[0.68rem] sm:text-xs tracking-[0.2em] uppercase text-black/45 font-bold">
            Custom Printing Studio
          </motion.p>
          <motion.h1 variants={itemVariants} className="mt-3 text-2xl sm:text-4xl md:text-5xl font-black text-black leading-tight max-w-4xl">
            Got a Design? We'll Print It.
          </motion.h1>
          <motion.p variants={itemVariants} className="mt-4 text-sm sm:text-base text-black/65 font-medium max-w-2xl">
            Upload up to five designs, switch front or back, recolor the garment, and open the editor fullscreen for precise positioning.
          </motion.p>

          <motion.div variants={panelVariants} className="mt-8 grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6 items-start">
            <div className="rounded-[28px] border border-black/10 bg-white/70 backdrop-blur-sm shadow-[0_18px_38px_rgba(0,0,0,0.08)] p-5 sm:p-6">
              <p className="text-sm font-bold text-black/80">Upload Designs</p>
              <p className="mt-1 text-xs text-black/50">Up to {MAX_UPLOADS} files, max 10 MB each. PNG · SVG · JPG · PDF</p>

              <div
                className="mt-4 rounded-2xl border-2 border-dashed border-black/20 bg-white/65 min-h-40 flex items-center justify-center text-center px-5 cursor-pointer transition-colors hover:border-black/35"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    inputRef.current?.click();
                  }
                }}
                aria-label="Upload design files"
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept=".png,.svg,.jpg,.jpeg,.pdf"
                  multiple
                  className="hidden"
                  onChange={handleInputChange}
                />

                <div>
                  <p className="font-bold text-black">Drag and drop your design files</p>
                  <p className="text-black/55 text-sm mt-1">or click to browse</p>
                </div>
              </div>

              {error && (
                <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>
              )}

              <div className="mt-5">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-black/55">Artwork List</p>
                  <p className="text-[11px] font-semibold text-black/40">{artworks.length}/{MAX_UPLOADS}</p>
                </div>

                <div className="mt-3 flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
                  {artworks.length === 0 && (
                    <div className="rounded-2xl border border-black/10 bg-black/[0.03] px-4 py-5 text-sm text-black/45">
                      Uploaded designs will appear here.
                    </div>
                  )}

                  {artworks.map((artwork, index) => {
                    const isActive = artwork.id === activeArtworkId;
                    return (
                      <button
                        key={artwork.id}
                        type="button"
                        onClick={() => setActiveArtworkId(artwork.id)}
                        className={`w-full rounded-2xl border px-4 py-3 text-left transition-colors cursor-pointer ${
                          isActive ? 'border-black bg-black text-white' : 'border-black/10 bg-white hover:bg-black/[0.03]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className={`text-xs font-bold uppercase tracking-[0.14em] ${isActive ? 'text-white/55' : 'text-black/40'}`}>
                              Design {index + 1}
                            </p>
                            <p className="mt-1 text-sm font-bold truncate">{artwork.name}</p>
                            <p className={`mt-1 text-xs ${isActive ? 'text-white/70' : 'text-black/50'}`}>{formatFileSize(artwork.size)}</p>
                          </div>
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              removeArtwork(artwork.id);
                            }}
                            className={`inline-flex items-center justify-center w-8 h-8 rounded-full border cursor-pointer ${
                              isActive ? 'border-white/20 text-white/80' : 'border-black/10 text-black/55'
                            }`}
                            role="button"
                            tabIndex={0}
                          >
                            ×
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={() => setGarment('tshirt')}
                  className={`px-4 h-10 rounded-full text-sm font-bold transition-colors cursor-pointer ${
                    garment === 'tshirt' ? 'bg-black text-white' : 'bg-black/10 text-black hover:bg-black/20'
                  }`}
                >
                  T-Shirt
                </button>
                <button
                  type="button"
                  onClick={() => setGarment('hoodie')}
                  className={`px-4 h-10 rounded-full text-sm font-bold transition-colors cursor-pointer ${
                    garment === 'hoodie' ? 'bg-black text-white' : 'bg-black/10 text-black hover:bg-black/20'
                  }`}
                >
                  Hoodie
                </button>
              </div>

              <div className="mt-3 flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={() => setActiveSide('front')}
                  className={`px-4 h-10 rounded-full text-sm font-bold transition-colors cursor-pointer ${
                    activeSide === 'front' ? 'bg-black text-white' : 'bg-black/10 text-black hover:bg-black/20'
                  }`}
                >
                  Front
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSide('back')}
                  className={`px-4 h-10 rounded-full text-sm font-bold transition-colors cursor-pointer ${
                    activeSide === 'back' ? 'bg-black text-white' : 'bg-black/10 text-black hover:bg-black/20'
                  }`}
                >
                  Back
                </button>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={centerArtwork}
                  disabled={!activeArtwork}
                  className={`h-10 rounded-full font-bold text-sm transition-opacity ${activeArtwork ? 'bg-black text-white hover:opacity-90 cursor-pointer' : 'bg-black/15 text-black/35 cursor-not-allowed'}`}
                >
                  Center
                </button>
                <button
                  type="button"
                  onClick={scaleUp}
                  disabled={!activeArtwork}
                  className={`h-10 rounded-full font-bold text-sm transition-opacity ${activeArtwork ? 'bg-black text-white hover:opacity-90 cursor-pointer' : 'bg-black/15 text-black/35 cursor-not-allowed'}`}
                >
                  Scale Up
                </button>
                <button
                  type="button"
                  onClick={scaleDown}
                  disabled={!activeArtwork}
                  className={`h-10 rounded-full font-bold text-sm transition-opacity ${activeArtwork ? 'bg-black text-white hover:opacity-90 cursor-pointer' : 'bg-black/15 text-black/35 cursor-not-allowed'}`}
                >
                  Scale Down
                </button>
              </div>

              <button
                type="button"
                disabled={!hasUploads}
                className={`mt-6 w-full h-11 rounded-full font-bold text-sm transition-all ${
                  hasUploads ? 'bg-black text-white hover:opacity-90 cursor-pointer' : 'bg-black/15 text-black/40 cursor-not-allowed'
                }`}
              >
                Proceed to Print
              </button>
            </div>

            <div className="rounded-[28px] border border-black/10 bg-[#ececec] shadow-[0_18px_38px_rgba(0,0,0,0.08)] p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-black/80">Mockup Preview</p>
                  <p className="mt-1 text-xs text-black/50">Now editing: {garment === 'hoodie' ? 'Hoodie' : 'T-Shirt'} {activeSide}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    resetStageView();
                    setIsFullscreenOpen(true);
                  }}
                  className="h-10 px-4 rounded-full bg-black text-white text-sm font-bold hover:opacity-90 transition-opacity cursor-pointer"
                >
                  Fullscreen Editor
                </button>
              </div>

              <div className="mt-4">
                <MockupStage
                  activeMockup={activeMockup}
                  garmentColor={garmentColor}
                  artworks={artworks}
                  activeArtworkId={activeArtworkId}
                  activeSide={activeSide}
                  onArtworkPointerDown={handleArtworkPointerDown}
                  onStagePointerDown={() => {}}
                  onStagePointerMove={handleStagePointerMove}
                  onStagePointerUp={stopPointerInteractions}
                  onStageWheel={() => {}}
                  onSelectArtwork={setActiveArtworkId}
                  stageZoom={1}
                  stagePan={{ x: 0, y: 0 }}
                  emptyLabel="Upload artwork to preview"
                  heightClassName="h-[540px] sm:h-[580px]"
                  artworkClassName="max-w-[180px] max-h-[180px]"
                />
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-black/55">Garment Color</p>
                  <button
                    type="button"
                    onClick={resetGarmentColor}
                    className="text-xs font-bold text-black/55 hover:text-black transition-colors cursor-pointer"
                  >
                    Reset Color
                  </button>
                </div>

                <div className="mt-2 grid grid-cols-[1fr_auto_auto] gap-2.5 items-center">
                  <input
                    type="text"
                    value={garmentColorInput}
                    onChange={handleGarmentColorInputChange}
                    onBlur={() => commitGarmentColor(garmentColorInput.trim())}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        commitGarmentColor(garmentColorInput.trim());
                      }
                    }}
                    placeholder="#111111"
                    className="h-10 rounded-xl border border-black/20 bg-white px-3 text-sm font-semibold text-black outline-none focus:border-black/45"
                    aria-label="Garment color hex code"
                  />
                  <input
                    type="color"
                    value={garmentColor}
                    onChange={(e) => handleGarmentColorPreset(colord(e.target.value).toHex())}
                    className="h-10 w-14 rounded-xl border border-black/20 bg-white p-1 cursor-pointer"
                    aria-label="Pick garment color"
                  />
                  <span className="w-10 h-10 rounded-xl border border-black/20" style={{ backgroundColor: garmentColor }} aria-hidden="true" />
                </div>

                {garmentColorError && (
                  <p className="mt-2 text-xs font-semibold text-red-600">{garmentColorError}</p>
                )}

                <div className="mt-3 grid grid-cols-5 sm:grid-cols-10 gap-2.5">
                  {COLOR_PRESETS.map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => handleGarmentColorPreset(hex)}
                      className={`aspect-square rounded-xl border-2 transition-transform hover:scale-105 cursor-pointer ${
                        garmentColor === hex ? 'border-black' : 'border-white'
                      }`}
                      style={{ backgroundColor: hex }}
                      aria-label={`Set garment color ${hex}`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </main>

      {isFullscreenOpen && (
        <div className="fixed inset-0 z-[130] bg-black/92 flex items-center justify-center p-3 sm:p-5" role="dialog" aria-modal="true">
          <button
            type="button"
            onClick={() => {
              setIsFullscreenOpen(false);
              stopPointerInteractions();
            }}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/15 text-white text-2xl leading-none cursor-pointer"
            aria-label="Close fullscreen editor"
          >
            ×
          </button>

          <div className="absolute top-4 left-4 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setStageZoom((prev) => clampStageZoom(prev - 0.2))}
              className="w-10 h-10 rounded-full bg-white/15 text-white text-xl cursor-pointer"
              aria-label="Zoom out"
            >
              -
            </button>
            <button
              type="button"
              onClick={() => setStageZoom((prev) => clampStageZoom(prev + 0.2))}
              className="w-10 h-10 rounded-full bg-white/15 text-white text-xl cursor-pointer"
              aria-label="Zoom in"
            >
              +
            </button>
            <button
              type="button"
              onClick={resetStageView}
              className="px-3 h-10 rounded-full bg-white/15 text-white text-sm font-semibold cursor-pointer"
            >
              Reset View
            </button>
          </div>

          <div className="w-full max-w-6xl">
            <MockupStage
              activeMockup={activeMockup}
              garmentColor={garmentColor}
              artworks={artworks}
              activeArtworkId={activeArtworkId}
              activeSide={activeSide}
              onArtworkPointerDown={handleArtworkPointerDown}
              onStagePointerDown={handleStagePointerDown}
              onStagePointerMove={handleStagePointerMove}
              onStagePointerUp={stopPointerInteractions}
              onStageWheel={handleStageWheel}
              onSelectArtwork={setActiveArtworkId}
              stageZoom={stageZoom}
              stagePan={stagePan}
              emptyLabel="Upload artwork to preview"
              heightClassName="h-[78vh]"
              artworkClassName="max-w-[260px] max-h-[260px] sm:max-w-[320px] sm:max-h-[320px]"
            />
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default PrintStudioPage;
