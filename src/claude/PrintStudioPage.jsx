import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { colord } from 'colord';
import { Stage, Layer, Image as KonvaImage, Transformer, Group, Rect, Text } from 'react-konva';
import useImage from 'use-image';
import Footer from '../Components/footer.jsx';
import { usePrintContext } from '../Components/printContext.jsx';
import tshirtFrontMock from '../assets/mock images/T-shirt (front).png';
import tshirtBackMock from '../assets/mock images/T-shirt (back).png';
import hoodieFrontMock from '../assets/mock images/hoodie (front).png';
import hoodieBackMock from '../assets/mock images/hoodie (back).png';
import jeansFrontMock from '../assets/mock images/Jeans (front).png';
import jeansBackMock from '../assets/mock images/Jeans (back).png';
import jeansFrontBlueMock from '../assets/mock images/Jeans (front) (blue).png';
import jeansBackBlueMock from '../assets/mock images/Jeans (back) (blue).png';
import mockBackground from '../assets/mock images/background.png';

// ─── Constants ────────────────────────────────────────────────────────────────
const ACCEPTED_TYPES      = ['image/png','image/svg+xml','image/jpeg','image/jpg','application/pdf'];
const ACCEPTED_EXTENSIONS = ['.png','.svg','.jpg','.jpeg','.pdf'];
const MAX_UPLOADS         = 5;
const MAX_FILE_SIZE       = 10 * 1024 * 1024;
const DEFAULT_TRANSFORM   = { x: 0, y: 0, scale: 0.28, rotation: 0 };

const COLOR_PRESETS = [
  { hex: '#111111', label: 'Jet Black'  },
  { hex: '#FFFFFF', label: 'White'      },
  { hex: '#D9D9D9', label: 'Ash Grey'   },
  { hex: '#545454', label: 'Graphite'   },
  { hex: '#0F3D2E', label: 'Forest'     },
  { hex: '#1E3A8A', label: 'Navy'       },
  { hex: '#7C2D12', label: 'Burgundy'   },
  { hex: '#7F1D1D', label: 'Crimson'    },
  { hex: '#5B21B6', label: 'Violet'     },
  { hex: '#B45309', label: 'Caramel'    },
  { hex: '#065F46', label: 'Emerald'    },
  { hex: '#1E40AF', label: 'Royal Blue' },
];

const GARMENT_IMAGE_MAP = {
  tshirt:        { front: tshirtFrontMock,    back: tshirtBackMock    },
  hoodie:        { front: hoodieFrontMock,    back: hoodieBackMock    },
  jeans_default: { front: jeansFrontMock,     back: jeansBackMock     },
  jeans_blue:    { front: jeansFrontBlueMock, back: jeansBackBlueMock },
};

// Keep mask assets independently mapped so you can swap dedicated cutout SVGs later.
const GARMENT_MASK_MAP = {
  tshirt:        { front: tshirtFrontMock,    back: tshirtBackMock    },
  hoodie:        { front: hoodieFrontMock,    back: hoodieBackMock    },
  jeans_default: { front: jeansFrontMock,     back: jeansBackMock     },
  jeans_blue:    { front: jeansFrontBlueMock, back: jeansBackBlueMock },
};

const GARMENT_LABELS = { tshirt: 'T-Shirt', hoodie: 'Hoodie', jeans: 'Jeans' };
const DESIGN_ANCHOR_MAP = {
  tshirt: { x: 0.5, y: 0.46 },
  hoodie: { x: 0.5, y: 0.46 },
  jeans:  { x: 0.5, y: 0.5  },
};
const MIN_NORM_SCALE = 0.04;
const MAX_NORM_SCALE = 1.2;
const TEXT_LAYER_MAX_LENGTH = 40;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const isValidFile = (file) => {
  if (!file) return false;
  const ext = `.${String(file.name || '').split('.').pop()?.toLowerCase() || ''}`;
  return ACCEPTED_TYPES.includes(file.type) || ACCEPTED_EXTENSIONS.includes(ext);
};

const formatFileSize = (size) =>
  size < 1024 * 1024 ? `${(size / 1024).toFixed(1)} KB` : `${(size / (1024 * 1024)).toFixed(2)} MB`;

const createArtworkEntry = (file) => ({
  id: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
  type: 'asset',
  file, name: file.name, size: file.size,
  isPdf: file.type === 'application/pdf' || String(file.name).toLowerCase().endsWith('.pdf'),
  previewUrl: file.type.startsWith('image/') || String(file.name).toLowerCase().endsWith('.svg')
    ? URL.createObjectURL(file) : '',
  transforms: { front: { ...DEFAULT_TRANSFORM }, back: { ...DEFAULT_TRANSFORM } },
  // per-side visibility so removing from front doesn't affect back
  visible: { front: true, back: true },
  opacity: { front: 1, back: 1 },
});

const createTextEntry = (text = '') => ({
  id: `text-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  type: 'text',
  file: null,
  name: text || 'Text Layer',
  size: 0,
  isPdf: false,
  previewUrl: '',
  text,
  textColor: '#111111',
  fontFamily: 'Arial',
  fontStyle: 'bold',
  transforms: { front: { ...DEFAULT_TRANSFORM }, back: { ...DEFAULT_TRANSFORM } },
  visible: { front: true, back: true },
  opacity: { front: 1, back: 1 },
});

const clampZoom = (v) => Math.min(3.5, Math.max(1, v));
const clampNormScale = (v) => Math.min(MAX_NORM_SCALE, Math.max(MIN_NORM_SCALE, v));

const parseSvgLength = (raw) => {
  if (!raw) return null;
  const match = String(raw).trim().match(/^([0-9]*\.?[0-9]+)/);
  if (!match) return null;
  const n = Number(match[1]);
  return Number.isFinite(n) && n > 0 ? n : null;
};

const parseSvgIntrinsicSize = (svgText) => {
  const viewBoxMatch = svgText.match(/viewBox\s*=\s*["']([^"']+)["']/i);
  if (viewBoxMatch) {
    const parts = viewBoxMatch[1].trim().split(/[\s,]+/).map(Number);
    if (parts.length === 4 && Number.isFinite(parts[2]) && Number.isFinite(parts[3]) && parts[2] > 0 && parts[3] > 0) {
      return { width: parts[2], height: parts[3] };
    }
  }

  const widthMatch = svgText.match(/width\s*=\s*["']([^"']+)["']/i);
  const heightMatch = svgText.match(/height\s*=\s*["']([^"']+)["']/i);
  const width = parseSvgLength(widthMatch?.[1]);
  const height = parseSvgLength(heightMatch?.[1]);
  if (width && height) return { width, height };

  return null;
};

const loadIntrinsicSize = async (imageSrc) => {
  // SVG files can report default 300x150 natural size on some browsers.
  // Prefer viewBox/width/height for accurate object-contain letterboxing math.
  if (/\.svg(?:$|\?)/i.test(imageSrc)) {
    try {
      const res = await fetch(imageSrc, { credentials: 'same-origin' });
      if (res.ok) {
        const text = await res.text();
        const parsed = parseSvgIntrinsicSize(text);
        if (parsed) return parsed;
      }
    } catch {
      // Fall back to image decode below.
    }
  }

  const img = new Image();
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = imageSrc;
  });
  return { width: img.naturalWidth || 0, height: img.naturalHeight || 0 };
};

const useContainedImageRect = (containerRef, imageSrc) => {
  const [natural, setNatural] = useState({ width: 0, height: 0 });
  const [rect, setRect] = useState(null);

  useEffect(() => {
    let alive = true;
    if (!imageSrc) { setNatural({ width: 0, height: 0 }); return; }

    loadIntrinsicSize(imageSrc)
      .then((size) => {
        if (!alive) return;
        setNatural({ width: size.width || 0, height: size.height || 0 });
      })
      .catch(() => {
        if (!alive) return;
        setNatural({ width: 0, height: 0 });
      });

    return () => { alive = false; };
  }, [imageSrc]);

  const measure = useCallback(() => {
    const wrap = containerRef.current;
    if (!wrap || !natural.width || !natural.height) return;
    const cW = wrap.clientWidth;
    const cH = wrap.clientHeight;
    const scale = Math.min(cW / natural.width, cH / natural.height);
    const rW = natural.width * scale;
    const rH = natural.height * scale;
    setRect({ top: (cH - rH) / 2, left: (cW - rW) / 2, width: rW, height: rH });
  }, [containerRef, natural.width, natural.height]);

  useEffect(() => {
    setRect(null);
    measure();
  }, [measure]);

  useEffect(() => {
    const wrap = containerRef.current;
    if (!wrap) return;
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [containerRef, measure]);

  return rect;
};

// ─── Motion variants ──────────────────────────────────────────────────────────
const fadeUp  = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } } };
const stagger = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.08 } } };
const panelIn = { hidden: { opacity: 0, y: 14, scale: 0.985 }, visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } } };

// ─── Tiny SVG icon factory ────────────────────────────────────────────────────
const Ic = ({ d, size = 16, sw = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const Icons = {
  Upload:   () => <Ic size={22} d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />,
  Trash:    () => <Ic size={14} d="M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2" />,
  Maximize: () => <Ic size={15} d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3" />,
  Minimize: () => <Ic size={15} d="M8 3v3a2 2 0 0 1-2 2H3M21 8h-3a2 2 0 0 1-2-2V3M3 16h3a2 2 0 0 0 2 2v3M16 21v-3a2 2 0 0 1 2-2h3" />,
  RotateCW: () => <Ic size={15} d="M21 2v6h-6M21 13a9 9 0 1 1-3-7.7L21 8" />,
  Center:   () => <Ic size={15} d="M12 2v20M2 12h20" />,
  Opacity:  () => <Ic size={15} d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2zm0 18V4" />,
  LayerUp:  () => <Ic size={14} d="M12 19V5M5 12l7-7 7 7" />,
  LayerDn:  () => <Ic size={14} d="M12 5v14M5 12l7 7 7-7" />,
  X:        () => <Ic size={18} d="M18 6 6 18M6 6l12 12" />,
  Check:    () => <Ic size={14} d="M20 6 9 17l-5-5" />,
  Info:     () => <Ic size={15} d="M12 16v-4M12 8h.01M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z" />,
  Copy:     () => <Ic size={14} d="M8 16H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v2M10 20h8a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-8a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2z" />,
};

// ─── Reusable UI atoms ────────────────────────────────────────────────────────
const PillBtn = ({ onClick, active, disabled, children, className = '' }) => (
  <button type="button" onClick={onClick} disabled={disabled}
    className={`px-4 h-9 rounded-full text-sm font-bold transition-all cursor-pointer select-none
      ${active   ? 'bg-black text-white shadow-sm' : 'bg-black/8 text-black hover:bg-black/15'}
      ${disabled ? 'opacity-35 cursor-not-allowed pointer-events-none' : ''}
      ${className}`}>
    {children}
  </button>
);

const CtrlBtn = ({ onClick, disabled, children, danger = false, className = '' }) => (
  <button type="button" onClick={onClick} disabled={disabled}
    className={`flex items-center justify-center gap-1 h-9 rounded-xl text-xs font-bold transition-all cursor-pointer select-none
      ${danger ? 'text-red-600 hover:bg-red-50' : 'bg-black/6 text-black/70 hover:bg-black/13'}
      ${disabled ? 'opacity-30 cursor-not-allowed pointer-events-none' : ''}
      ${className}`}>
    {children}
  </button>
);

// ─── ArtworkNode (Konva) ──────────────────────────────────────────────────────
const ArtworkNode = ({ artwork, isSelected, onSelect, onChange, activeSide, centerX, centerY, garmentBox, onContextMenu, showTransformer, shapeRefsMap }) => {
  const transform = artwork.transforms[activeSide];
  const isVisible = artwork.visible ? artwork.visible[activeSide] !== false : true;
  const [img] = useImage(artwork.previewUrl);
  const isTextLayer = artwork.type === 'text';
  const textValue = String(artwork.text || 'Your Text');
  const textFontSize = Number.isFinite(artwork.textSize) ? artwork.textSize : 96;
  const textWidthEstimate = Math.max(120, Math.round(textValue.length * textFontSize * 0.62));
  const textHeightEstimate = Math.max(56, Math.round(textFontSize * 1.2));
  const shapeRef = useRef(null);
  const trRef    = useRef(null);
  const boxWidth = Math.max(garmentBox?.width || 1, 1);
  const boxHeight = Math.max(garmentBox?.height || 1, 1);
  const normX = Number.isFinite(transform.x) ? transform.x : 0;
  const normY = Number.isFinite(transform.y) ? transform.y : 0;
  const normScale = clampNormScale(Number.isFinite(transform.scale) ? transform.scale : DEFAULT_TRANSFORM.scale);
  const baseWidth = isTextLayer
    ? textWidthEstimate
    : artwork.isPdf
      ? 96
      : Math.max(img?.width || 0, 1);
  const displayWidth = Math.max(8, boxWidth * normScale);
  const nodeScale = displayWidth / baseWidth;
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;

  const absX = centerX + normX * boxWidth;
  const absY = centerY + normY * boxHeight;

  // Store ref in the shared map (only for the non-transformer layer — the real visible node)
  useEffect(() => {
    if (!showTransformer && shapeRef.current && shapeRefsMap?.current) {
      shapeRefsMap.current.set(artwork.id, shapeRef.current);
    }
  }, [artwork.id, shapeRefsMap, showTransformer]);

  // Attach transformer to the proxy node in this same layer
  useEffect(() => {
    if (!showTransformer || !isSelected || !trRef.current || !shapeRef.current) return;
    trRef.current.nodes([shapeRef.current]);
    trRef.current.getLayer()?.batchDraw();
  }, [isSelected, img, artwork.isPdf, isTextLayer, showTransformer, artwork.id]);

  if (!isVisible) return null;

  const handleDragEnd = (e) => onChange({
    ...transform,
    x: (e.target.x() - centerX) / boxWidth,
    y: (e.target.y() - centerY) / boxHeight,
  });

  const handleTransformEnd = () => {
    // The proxy shapeRef mirrors the transform state — read it for new values
    const node = shapeRef.current;
    if (!node) return;
    const renderedWidth = baseWidth * Math.abs(node.scaleX());
    onChange({ 
      ...transform, 
      x: (node.x() - centerX) / boxWidth,
      y: (node.y() - centerY) / boxHeight,
      scale: clampNormScale(renderedWidth / boxWidth),
      rotation: node.rotation() 
    });
  };

  // ── Masked layer: render actual visible artwork ──
  if (!showTransformer) {
    if (isTextLayer) {
      return (
        <Text
          ref={shapeRef}
          text={textValue}
          x={absX}
          y={absY}
          offsetX={textWidthEstimate / 2}
          offsetY={textHeightEstimate / 2}
          width={textWidthEstimate}
          height={textHeightEstimate}
          fontSize={textFontSize}
          fontFamily={artwork.fontFamily || 'Arial'}
          fontStyle={artwork.fontStyle || 'bold'}
          fill={artwork.textColor || '#111111'}
          align="center"
          verticalAlign="middle"
          scaleX={nodeScale}
          scaleY={nodeScale}
          rotation={transform.rotation || 0}
          opacity={artwork.opacity?.[activeSide] ?? 1}
          draggable={true}
          onClick={onSelect}
          onTap={onSelect}
          onDragEnd={handleDragEnd}
          onTransformEnd={handleTransformEnd}
          onContextMenu={onContextMenu}
        />
      );
    }
    if (artwork.isPdf) {
      return (
        <Group ref={shapeRef} x={absX} y={absY} offsetX={48} offsetY={48}
          scaleX={nodeScale} scaleY={nodeScale}
          rotation={transform.rotation || 0}
          opacity={artwork.opacity?.[activeSide] ?? 1}
          draggable={true} onClick={onSelect} onTap={onSelect}
          onDragEnd={handleDragEnd} onTransformEnd={handleTransformEnd} onContextMenu={onContextMenu}>
          <Rect width={96} height={96} fill="#111" cornerRadius={12}
            stroke="rgba(255,255,255,0.15)" strokeWidth={1}
            shadowColor="black" shadowBlur={12} shadowOpacity={0.3} shadowOffsetY={4} />
          <Text text="PDF" width={96} height={96} fill="white" fontStyle="700" fontSize={13} align="center" verticalAlign="middle" />
        </Group>
      );
    }
    if (!img) return null;
    return (
      <KonvaImage ref={shapeRef} image={img} offsetX={img.width / 2} offsetY={img.height / 2}
        x={absX} y={absY}
        scaleX={nodeScale} scaleY={nodeScale}
        rotation={transform.rotation || 0}
        opacity={artwork.opacity?.[activeSide] ?? 1}
        draggable={true} onClick={onSelect} onTap={onSelect}
        onDragEnd={handleDragEnd} onTransformEnd={handleTransformEnd} onContextMenu={onContextMenu} />
    );
  }

  // ── Control layer: render transformer + an invisible proxy node so Transformer can attach ──
  // We render a transparent hit-area node so the Transformer has a valid Konva node to grip.
  // All transform changes are propagated via handleTransformEnd which reads from shapeRefsMap.
  const proxyWidth = isTextLayer
    ? textWidthEstimate
    : artwork.isPdf
      ? 96
      : Math.max(img?.width || 96, 1);
  const proxyHeight = isTextLayer
    ? textHeightEstimate
    : artwork.isPdf
      ? 96
      : Math.max(img?.height || 96, 1);

  return (
    <React.Fragment>
      {/* Invisible proxy node — Transformer attaches to this in the unmasked layer */}
      {isTextLayer ? (
        <Rect
          ref={shapeRef}
          x={absX}
          y={absY}
          offsetX={proxyWidth / 2}
          offsetY={proxyHeight / 2}
          width={proxyWidth}
          height={proxyHeight}
          scaleX={nodeScale}
          scaleY={nodeScale}
          rotation={transform.rotation || 0}
          opacity={0}
          draggable={true}
          onClick={onSelect}
          onTap={onSelect}
          onDragEnd={handleDragEnd}
          onTransformEnd={handleTransformEnd}
          onContextMenu={onContextMenu}
        />
      ) : (
        <KonvaImage
          ref={shapeRef}
          image={img || undefined}
          offsetX={proxyWidth / 2}
          offsetY={proxyHeight / 2}
          x={absX} y={absY}
          scaleX={nodeScale} scaleY={nodeScale}
          rotation={transform.rotation || 0}
          opacity={0}
          draggable={true}
          onClick={onSelect} onTap={onSelect}
          onDragEnd={handleDragEnd}
          onTransformEnd={handleTransformEnd}
          onContextMenu={onContextMenu}
        />
      )}

      {isSelected && (
        <Transformer ref={trRef} keepRatio
          enabledAnchors={['top-left','top-right','bottom-left','bottom-right']}
          rotateEnabled rotateAnchorOffset={isMobile ? 36 : 28}
          borderStroke="rgba(99,179,237,0.9)" borderStrokeWidth={isMobile ? 2 : 1.5}
          borderDash={[]}
          anchorFill="white"
          anchorStroke="rgba(49,130,206,0.85)"
          anchorStrokeWidth={isMobile ? 2 : 1.5}
          anchorSize={isMobile ? 20 : 13}
          anchorCornerRadius={isMobile ? 5 : 4}
          boundBoxFunc={(old, n) => (Math.abs(n.width) < 20 || Math.abs(n.height) < 20) ? old : n}
          padding={isMobile ? 6 : 2}
        />
      )}
    </React.Fragment>
  );
};

// ─── ResponsiveGarment — renders the background gradient and the garment
//     using a unified SVG viewBox. This ensures that the recolor mask and
//     the garment image scale in perfect unison regardless of screen size.
const ResponsiveGarment = ({ activeGarmentImage, activeMaskImage, garmentColor, isJeans }) => {
  const maskId = useMemo(() => `garment-mask-${Math.random().toString(36).slice(2, 9)}`, [activeGarmentImage]);
  
  return (
    <svg 
      viewBox="0 0 1000 1000" 
      width="100%" height="100%"
      className="absolute inset-0 w-full h-full pointer-events-none select-none"
      preserveAspectRatio="xMidYMid meet"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
    >
      <defs>
        {/* Premium Background Gradient — Soft Studio Lighting */}
        <radialGradient id="studioGradient" cx="50%" cy="45%" r="65%" fx="50%" fy="40%">
          <stop offset="0%"   stopColor="#ffffff" />
          <stop offset="60%"  stopColor="#f2f2f2" />
          <stop offset="100%" stopColor="#e0e0e0" />
        </radialGradient>

        <linearGradient id="softShadow" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(0,0,0,0)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.03)" />
        </linearGradient>

        {/* Mask for recoloring — uses the mockup image alpha channel */}
        {!isJeans && (
          <mask id={maskId} maskUnits="userSpaceOnUse" x="0" y="0" width="1000" height="1000">
            <image 
              href={activeMaskImage} 
              xlinkHref={activeMaskImage}
              x="0" y="0" width="1000" height="1000" 
              preserveAspectRatio="xMidYMid meet"
            />
          </mask>
        )}
      </defs>

      {/* 1. Background Layer */}
      <rect width="1000" height="1000" fill="url(#studioGradient)" />
      <rect width="1000" height="1000" fill="url(#softShadow)" />

      {/* 2. Garment Base Image (Filtered for depth) */}
      <image 
        href={activeGarmentImage} 
        xlinkHref={activeGarmentImage}
        x="0" y="0" width="1000" height="1000" 
        preserveAspectRatio="xMidYMid meet"
        style={!isJeans ? { filter: 'grayscale(1) contrast(1.08) brightness(1.04)' } : undefined}
      />

      {/* 3. Color Overlay — precisely masked to the garment silhouette */}
      {!isJeans && (
        <rect 
          x="0" y="0" width="1000" height="1000" 
          fill={garmentColor} 
          mask={`url(#${maskId})`}
          style={{ mixBlendMode: 'multiply' }}
        />
      )}

      {/* 4. Highlight Sheen — adds depth and texture back on top of the color */}
      {!isJeans && (
        <image 
          href={activeGarmentImage} 
          xlinkHref={activeGarmentImage}
          x="0" y="0" width="1000" height="1000" 
          preserveAspectRatio="xMidYMid meet"
          style={{ 
            filter: 'grayscale(1) contrast(1.2) brightness(1.15)', 
            opacity: 0.16, 
            mixBlendMode: 'screen' 
          }}
        />
      )}
    </svg>
  );
};

// ─── MockupCanvas ─────────────────────────────────────────────────────────────
const MockupCanvas = ({
  activeGarmentImage, activeMaskImage, garmentColor, artworks, activeArtworkId, activeSide,
  updateArtworkTransform, onSelectArtwork,
  stageZoom, stagePan,
  onStagePointerDown, onStagePointerMove, onStagePointerUp, onStageWheel,
  heightClass, emptyLabel, isJeans, onContextMenu, onStagePinch, garmentType,
}) => {
  const frameRef = useRef(null);
  const [dim, setDim] = useState({ width: 0, height: 0 });
  const lastDist = useRef(0);
  const lastCenter = useRef(null);
  const [maskImg] = useImage(activeMaskImage);
  const shapeRefsMap = useRef(new Map()); // Shared ref map for all designs

  useEffect(() => {
    if (!frameRef.current) return;
    const ro = new ResizeObserver(([e]) => setDim({ width: e.contentRect.width, height: e.contentRect.height }));
    ro.observe(frameRef.current);
    return () => ro.disconnect();
  }, []);

  const anchor = DESIGN_ANCHOR_MAP[garmentType] || DESIGN_ANCHOR_MAP.tshirt;
  
  // ResponsiveGarment uses a 1000x1000 viewBox with preserveAspectRatio="xMidYMid meet".
  // We need to calculate the actual rendered rect of this 1000x1000 square within 
  // the dim.width x dim.height container to keep Konva artworks perfectly aligned.
  const garmentBox = useMemo(() => {
    const cW = dim.width;
    const cH = dim.height;
    if (!cW || !cH) return { left: 0, top: 0, width: 0, height: 0 };
    
    // The SVG content is essentially a 1000x1000 square (1:1 aspect ratio)
    const scale = Math.min(cW / 1000, cH / 1000);
    const rW = 1000 * scale;
    const rH = 1000 * scale;
    
    return {
      left: (cW - rW) / 2,
      top: (cH - rH) / 2,
      width: rW,
      height: rH
    };
  }, [dim.width, dim.height]);

  // Match SVG <image preserveAspectRatio="xMidYMid meet"> placement for pixel-perfect masking.
  const maskBox = useMemo(() => {
    if (!maskImg || !garmentBox.width || !garmentBox.height) {
      return garmentBox;
    }

    const targetRatio = garmentBox.width / garmentBox.height;
    const imageRatio = maskImg.width / maskImg.height;

    if (!Number.isFinite(imageRatio) || imageRatio <= 0) {
      return garmentBox;
    }

    let width = garmentBox.width;
    let height = garmentBox.height;

    if (imageRatio > targetRatio) {
      height = garmentBox.width / imageRatio;
    } else {
      width = garmentBox.height * imageRatio;
    }

    return {
      left: garmentBox.left + (garmentBox.width - width) / 2,
      top: garmentBox.top + (garmentBox.height - height) / 2,
      width,
      height,
    };
  }, [garmentBox, maskImg]);

  const designCenter = useMemo(() => ({
    x: garmentBox.left + garmentBox.width * anchor.x,
    y: garmentBox.top + garmentBox.height * anchor.y,
  }), [anchor.x, anchor.y, garmentBox]);

  const handleTouchMove = (e) => {
    if (e.evt.touches.length !== 2) return;
    e.evt.preventDefault();
    const [t1, t2] = [e.evt.touches[0], e.evt.touches[1]];
    const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
    
    const touchCenterX = (t1.clientX + t2.clientX) / 2;
    const touchCenterY = (t1.clientY + t2.clientY) / 2;

    if (!lastCenter.current) { 
      lastCenter.current = { x: touchCenterX, y: touchCenterY }; 
      lastDist.current = dist; 
      return; 
    }
    const factor = dist / lastDist.current;
    
    if (onStagePinch) {
      onStagePinch(factor);
    } else if (activeArtworkId) {
      updateArtworkTransform(activeArtworkId, activeSide, (t) => {
        const dampedFactor = 1 + (factor - 1) * 0.6;
        return { ...t, scale: clampNormScale(t.scale * dampedFactor) };
      });
    }
    lastDist.current = dist;
  };
  const handleTouchEnd = () => { lastCenter.current = null; lastDist.current = 0; };
  const checkDeselect  = (e) => { if (e.target === e.target.getStage()) onSelectArtwork(null); };

  return (
    <div
      className={`relative rounded-2xl overflow-hidden bg-[#e8e8e8] border border-black/10 ${heightClass}`}
      onPointerMove={onStagePointerMove}
      onPointerUp={onStagePointerUp}
      onPointerLeave={onStagePointerUp}
      onWheel={onStageWheel}
    >
      <div className="absolute inset-0"
        style={{
          transform: `translate(${stagePan.x}px,${stagePan.y}px) scale(${stageZoom})`,
          transformOrigin: 'center center',
          transition: stageZoom === 1 && stagePan.x === 0 && stagePan.y === 0 ? 'transform 140ms ease-out' : 'none',
        }}>
        
        <div ref={frameRef} className="absolute inset-2 sm:inset-3 rounded-xl overflow-hidden isolate" onPointerDown={onStagePointerDown}>
          {/* Unified SVG Background + Garment Rendering */}
          <ResponsiveGarment
            activeGarmentImage={activeGarmentImage}
            activeMaskImage={activeMaskImage}
            garmentColor={garmentColor}
            isJeans={isJeans}
          />

          <div className="absolute inset-0 z-20">
            <Stage width={dim.width} height={dim.height}
              onMouseDown={checkDeselect} onTouchStart={checkDeselect}
              onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}
              style={{ position: 'absolute', top: 0, left: 0 }}>
              <Layer>
                {/* 1. Masked Designs Group — Only designs, no transformers */}
                <Group>
                  {artworks.map((aw) => (
                    <ArtworkNode key={aw.id} artwork={aw}
                      isSelected={aw.id === activeArtworkId}
                      onSelect={() => onSelectArtwork(aw.id)}
                      onChange={(t) => updateArtworkTransform(aw.id, activeSide, () => t)}
                      activeSide={activeSide}
                      centerX={designCenter.x}
                      centerY={designCenter.y}
                      garmentBox={garmentBox}
                      onContextMenu={(e) => onContextMenu && onContextMenu(e, aw.id)}
                      showTransformer={false}
                      shapeRefsMap={shapeRefsMap}
                    />
                  ))}
                  
                  {/* The Mask Image — clips everything above in this group */}
                  {maskImg && (
                    <KonvaImage
                      image={maskImg}
                      x={maskBox.left}
                      y={maskBox.top}
                      width={maskBox.width}
                      height={maskBox.height}
                      globalCompositeOperation="destination-in"
                      listening={false}
                    />
                  )}
                </Group>

                {/* 2. Unmasked Control Layer — Only transformers */}
                {artworks.map((aw) => (
                  <ArtworkNode key={`tr-${aw.id}`} artwork={aw}
                    isSelected={aw.id === activeArtworkId}
                    onSelect={() => onSelectArtwork(aw.id)}
                    onChange={(t) => updateArtworkTransform(aw.id, activeSide, () => t)}
                    activeSide={activeSide}
                    centerX={designCenter.x}
                    centerY={designCenter.y}
                    garmentBox={garmentBox}
                    onContextMenu={(e) => onContextMenu && onContextMenu(e, aw.id)}
                    showTransformer={true}
                    shapeRefsMap={shapeRefsMap}
                  />
                ))}
              </Layer>
            </Stage>
          </div>
        </div>

        {artworks.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <p className="text-xs font-semibold tracking-wide uppercase text-black/35 bg-white/75 px-4 py-2 rounded-full border border-black/10">
              {emptyLabel}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
const PrintStudioPage = () => {
  const location = useLocation();
  const { consumeFile } = usePrintContext();
  const inputRef = useRef(null);
  const routeHydrated = useRef(false);
  const artworksRef   = useRef([]);

  // core state
  const [artworks,        setArtworks]        = useState([]);
  const [activeArtworkId, setActiveArtworkId] = useState(null);
  const [garment,         setGarment]         = useState('tshirt');
  const [jeansType,       setJeansType]       = useState('default');
  const [activeSide,      setActiveSide]      = useState('front');
  const [garmentColor,    setGarmentColor]    = useState('#111111');
  const [colorInput,      setColorInput]      = useState('#111111');
  const [colorError,      setColorError]      = useState('');
  const [uploadError,     setUploadError]     = useState('');
  const [dragOver,        setDragOver]        = useState(false);
  const [contextMenu,     setContextMenu]     = useState(null);
  // canvas
  const [isFullscreen,   setIsFullscreen]     = useState(false);
  const [stageZoom,      setStageZoom]        = useState(1);
  const [stagePan,       setStagePan]         = useState({ x: 0, y: 0 });
  const [isPanning,      setIsPanning]        = useState(false);
  const [panStart,       setPanStart]         = useState({ x: 0, y: 0 });
  // UI
  const [mobileTab,      setMobileTab]        = useState('designs');
  const [showOrder,      setShowOrder]        = useState(false);
  const [toast,          setToast]            = useState('');

  // ── Derived ──
  const isJeans      = garment === 'jeans';
  const mockKey      = isJeans ? (jeansType === 'blue' ? 'jeans_blue' : 'jeans_default') : garment;
  const activeGarmentImage = GARMENT_IMAGE_MAP[mockKey][activeSide];
  const activeMaskImage = GARMENT_MASK_MAP[mockKey][activeSide];
  // artworks visible on this side
  const sideArtworks = useMemo(() => artworks.filter((a) => !a.visible || a.visible[activeSide] !== false), [artworks, activeSide]);
  const activeArtwork = useMemo(() => artworks.find((a) => a.id === activeArtworkId) || null, [artworks, activeArtworkId]);
  const activeArtworkOnThisSide = useMemo(() => activeArtwork && (!activeArtwork.visible || activeArtwork.visible[activeSide] !== false) ? activeArtwork : null, [activeArtwork, activeSide]);
  const hasUploads   = artworks.length > 0;

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2600); };

  // ── Preload mockup images ──
  useEffect(() => {
    [...Object.values(GARMENT_IMAGE_MAP).flatMap((e) => Object.values(e)), ...Object.values(GARMENT_MASK_MAP).flatMap((e) => Object.values(e)), mockBackground]
      .forEach((src) => { const i = new Image(); i.src = src; });
  }, []);

  // ── Route / context hydration ──
  useEffect(() => {
    if (routeHydrated.current) return;
    routeHydrated.current = true;
    const ctxFile = consumeFile();
    const file = ctxFile instanceof File ? ctxFile
      : (location.state?.uploadedFile instanceof File ? location.state.uploadedFile : null);
    if (file) {
      const entry = createArtworkEntry(file);
      setArtworks([entry]);
      setActiveArtworkId(entry.id);
    }
  }, []);

  useEffect(() => {
    if (!artworks.some((a) => a.id === activeArtworkId))
      setActiveArtworkId(artworks[0]?.id || null);
  }, [artworks]);

  useEffect(() => { artworksRef.current = artworks; }, [artworks]);

  useEffect(() => () => {
    artworksRef.current.forEach((a) => { if (a.previewUrl) URL.revokeObjectURL(a.previewUrl); });
  }, []);

  useEffect(() => {
    if (!isFullscreen) return;
    document.body.style.overflow = 'hidden';
    const onEsc = (e) => { if (e.key === 'Escape') { setIsFullscreen(false); stopPan(); } };
    window.addEventListener('keydown', onEsc);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onEsc); };
  }, [isFullscreen]);

  useEffect(() => {
    const handleGlobalClick = () => setContextMenu(null);
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);



  // ── File ops ──
  const addFiles = useCallback((fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    const entries = []; const errs = [];
    files.forEach((file) => {
      if (entries.length + artworksRef.current.length >= MAX_UPLOADS) { errs.push(`Max ${MAX_UPLOADS} files.`); return; }
      if (!isValidFile(file)) { errs.push(`${file.name}: unsupported.`); return; }
      if (file.size > MAX_FILE_SIZE) { errs.push(`${file.name}: too large.`); return; }
      entries.push(createArtworkEntry(file));
    });
    if (entries.length) {
      setArtworks((p) => [...p, ...entries]);
      setActiveArtworkId(entries[0].id);
      showToast(`${entries.length} design${entries.length > 1 ? 's' : ''} added`);
    }
    setUploadError(errs.join(' '));
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer?.files);
  }, [addFiles]);

  const handleInputChange = useCallback((e) => {
    addFiles(e.target.files);
    e.target.value = '';
  }, [addFiles]);

  const addTextLayer = useCallback(() => {
    if (artworksRef.current.length >= MAX_UPLOADS) {
      showToast(`Max ${MAX_UPLOADS} layers`);
      return;
    }
    const entry = createTextEntry();
    setArtworks((p) => [...p, entry]);
    setActiveArtworkId(entry.id);
    showToast('Text layer added');
  }, []);

  const removeArtwork = useCallback((id) => {
    setArtworks((p) => { const t = p.find((a) => a.id === id); if (t?.previewUrl) URL.revokeObjectURL(t.previewUrl); return p.filter((a) => a.id !== id); });
  }, []);

  // Remove artwork from just the current side; if both sides removed, delete entirely
  const removeArtworkFromSide = useCallback((id, side) => {
    setArtworks((p) => {
      return p.reduce((acc, a) => {
        if (a.id !== id) { acc.push(a); return acc; }
        const nextVisible = { ...a.visible, [side]: false };
        // if both sides are now false, remove the entry entirely and revoke URL
        if (!nextVisible.front && !nextVisible.back) {
          if (a.previewUrl) URL.revokeObjectURL(a.previewUrl);
          return acc;
        }
        acc.push({ ...a, visible: nextVisible });
        return acc;
      }, []);
    });
  }, []);

  const duplicateArtwork = useCallback((id) => {
    setArtworks((p) => {
      if (p.length >= MAX_UPLOADS) { showToast('Max 5 designs'); return p; }
      const src = p.find((a) => a.id === id); if (!src) return p;
      const copy = { ...src, id: `${id}-copy-${Math.random().toString(36).slice(2,6)}`,
        visible: { front: true, back: true },
        transforms: {
          front: { ...src.transforms.front, x: src.transforms.front.x + 0.015, y: src.transforms.front.y + 0.015 },
          back:  { ...src.transforms.back,  x: src.transforms.back.x  + 0.015, y: src.transforms.back.y  + 0.015 },
        }};
      const idx = p.findIndex((a) => a.id === id);
      const n = [...p]; n.splice(idx + 1, 0, copy);
      setTimeout(() => setActiveArtworkId(copy.id), 0);
      showToast('Design duplicated');
      return n;
    });
  }, []);

  const moveLayer = useCallback((id, dir) => {
    setArtworks((p) => {
      const idx = p.findIndex((a) => a.id === id);
      const t = dir === 'up' ? idx - 1 : idx + 1;
      if (t < 0 || t >= p.length) return p;
      const n = [...p]; [n[idx], n[t]] = [n[t], n[idx]]; return n;
    });
  }, []);

  // ── Transform ops ──
  const updateArtworkTransform = useCallback((id, side, updater) => {
    setArtworks((p) => p.map((a) => a.id !== id ? a : { ...a, transforms: { ...a.transforms, [side]: updater(a.transforms[side]) } }));
  }, []);

  const updateArtworkText = useCallback((id, nextText) => {
    const text = String(nextText || '').slice(0, TEXT_LAYER_MAX_LENGTH);
    setArtworks((p) => p.map((a) => (a.id !== id || a.type !== 'text') ? a : { ...a, text, name: text || 'Text Layer' }));
  }, []);

  const updateArtworkTextColor = useCallback((id, nextColor) => {
    const color = colord(nextColor).isValid() ? colord(nextColor).toHex() : '#111111';
    setArtworks((p) => p.map((a) => (a.id !== id || a.type !== 'text') ? a : { ...a, textColor: color }));
  }, []);

  const upActive = (fn) => { if (!activeArtworkOnThisSide) return; updateArtworkTransform(activeArtworkOnThisSide.id, activeSide, fn); };
  const centerArtwork  = () => upActive((t) => ({ ...t, x: 0, y: 0 }));
  const scaleUp        = () => upActive((t) => ({ ...t, scale: clampNormScale(+(t.scale + 0.03).toFixed(3)) }));
  const scaleDown      = () => upActive((t) => ({ ...t, scale: clampNormScale(+(t.scale - 0.03).toFixed(3)) }));
  const rotateCW       = () => upActive((t) => ({ ...t, rotation: ((t.rotation || 0) + 15) % 360 }));
  const rotateCCW      = () => upActive((t) => ({ ...t, rotation: ((t.rotation || 0) - 15 + 360) % 360 }));
  const resetTransform = () => upActive(() => ({ ...DEFAULT_TRANSFORM }));
  const setOpacity     = (id, v) => setArtworks((p) => p.map((a) => a.id !== id ? a : { ...a, opacity: { ...a.opacity, [activeSide]: v } }));

  // ── Color ops ──
  const commitColor = useCallback((raw) => {
    const norm = raw.startsWith('#') ? raw : `#${raw}`;
    if (!colord(norm).isValid()) { setColorError('Enter a valid hex e.g. #1a1a1a'); return; }
    const hex = colord(norm).toHex();
    setGarmentColor(hex); setColorInput(hex); setColorError('');
  }, []);
  const applyPreset = (hex) => { setGarmentColor(hex); setColorInput(hex); setColorError(''); };

  // ── Stage / pan / zoom ──
  const stopPan = () => setIsPanning(false);
  const handlePointerDown = (e) => { if (stageZoom <= 1) return; setIsPanning(true); setPanStart({ x: e.clientX - stagePan.x, y: e.clientY - stagePan.y }); };
  const handlePointerMove = (e) => { if (!isPanning || stageZoom <= 1) return; setStagePan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y }); };
  const handleWheel = (e) => {
    if (!isFullscreen) return;
    e.preventDefault();
    setStageZoom((p) => { const n = clampZoom(p + (e.deltaY > 0 ? -0.12 : 0.12)); if (n === 1) setStagePan({ x: 0, y: 0 }); return n; });
  };
  const handleStagePinch = useCallback((factor) => {
    if (!isFullscreen) return;
    setStageZoom((p) => clampZoom(p * factor));
  }, [isFullscreen]);
  const resetView = () => { setStageZoom(1); setStagePan({ x: 0, y: 0 }); stopPan(); };

  // ── Shared canvas props ──
  const canvasProps = {
    activeGarmentImage, activeMaskImage, garmentColor, artworks: sideArtworks, activeArtworkId, activeSide,
    updateArtworkTransform, onSelectArtwork: setActiveArtworkId, isJeans,
    garmentType: garment,
    onContextMenu: useCallback((e, id) => {
      e.evt.preventDefault();
      setActiveArtworkId(id);
      setContextMenu({ x: e.evt.clientX, y: e.evt.clientY, artworkId: id });
    }, []),
  };

  const garmentName = GARMENT_LABELS[garment];

  // ── Keyboard ops ──
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if ((e.key === 'Backspace' || e.key === 'Delete') && activeArtworkId) {
        removeArtwork(activeArtworkId);
        showToast('Design deleted');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeArtworkId, removeArtwork]);

  // ────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-[#f5f5f5] overflow-x-hidden">

      {/* ── Context Menu ── */}
      <AnimatePresence>
        {contextMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            className="fixed z-[300] bg-white rounded-xl shadow-2xl border border-black/10 py-1.5 w-40 flex flex-col overflow-hidden"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onClick={(e) => e.stopPropagation()}
            onContextMenu={(e) => e.preventDefault()}
          >
            <button onClick={() => { moveLayer(contextMenu.artworkId, 'up'); setContextMenu(null); }} className="text-left px-4 py-2 text-xs font-bold hover:bg-black/5 transition-colors">Bring Forward</button>
            <button onClick={() => { moveLayer(contextMenu.artworkId, 'down'); setContextMenu(null); }} className="text-left px-4 py-2 text-xs font-bold hover:bg-black/5 transition-colors">Send Backward</button>
            <div className="h-px bg-black/5 my-1" />
            <button onClick={() => { duplicateArtwork(contextMenu.artworkId); setContextMenu(null); }} className="text-left px-4 py-2 text-xs font-bold hover:bg-black/5 transition-colors text-black flex items-center justify-between">Duplicate <Icons.Copy /></button>
            <div className="h-px bg-black/5 my-1" />
            <button onClick={() => { removeArtworkFromSide(contextMenu.artworkId, activeSide); setContextMenu(null); }} className="text-left px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors flex items-center justify-between">Remove from {activeSide} <Icons.Trash /></button>
            <button onClick={() => { removeArtwork(contextMenu.artworkId); setContextMenu(null); }} className="text-left px-4 py-2 text-xs font-bold text-red-600/70 hover:bg-red-50 transition-colors flex items-center justify-between">Delete from all sides <Icons.Trash /></button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Toast ── */}
      <AnimatePresence>
        {toast && (
          <motion.div key="toast"
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-[200] bg-black text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-lg pointer-events-none flex items-center gap-1.5">
            <Icons.Check /> {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Order Modal ── */}
      <AnimatePresence>
        {showOrder && (
          <motion.div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/55 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowOrder(false)}>
            <motion.div
              className="bg-white w-full sm:max-w-md rounded-t-[28px] sm:rounded-[28px] p-6 sm:p-8 shadow-2xl"
              initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
              transition={{ duration: 0.35, ease: [0.22,1,0.36,1] }}
              onClick={(e) => e.stopPropagation()}>
              <div className="w-10 h-1 bg-black/15 rounded-full mx-auto mb-5 sm:hidden" />
              <div className="flex items-start justify-between mb-5">
                <div>
                  <p className="text-xs font-black tracking-[0.18em] uppercase text-black/40">Order Summary</p>
                  <h2 className="mt-1 text-2xl font-black text-black">Ready to Print?</h2>
                </div>
                <button onClick={() => setShowOrder(false)}
                  className="w-9 h-9 rounded-full bg-black/8 flex items-center justify-center hover:bg-black/15 transition cursor-pointer">
                  <Icons.X />
                </button>
              </div>
              <div className="space-y-0 divide-y divide-black/8 text-sm">
                {[
                  ['Garment', garmentName],
                  ...(isJeans ? [['Wash', jeansType === 'blue' ? 'Blue Wash' : 'Default']] : [['Color', garmentColor.toUpperCase()]]),
                  ['Designs', `${artworks.length} layer${artworks.length !== 1 ? 's' : ''}`],
                  ['Sides printed', 'Front & Back'],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between py-3">
                    <span className="text-black/55 font-medium">{k}</span>
                    <span className="font-bold flex items-center gap-2">
                      {k === 'Color' && <span className="w-4 h-4 rounded inline-block border border-black/15" style={{ background: garmentColor }} />}
                      {v}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 rounded-2xl bg-black/4 border border-black/8 p-4 flex gap-2.5">
                <div className="shrink-0 mt-0.5"><Icons.Info /></div>
                <p className="text-xs text-black/55 leading-relaxed">
                  After placing your order, our team will reach out within 24 hours to confirm design placement and finalize your print.
                </p>
              </div>
              <button onClick={() => { setShowOrder(false); showToast("Order sent! We'll be in touch soon."); }}
                className="mt-5 w-full h-12 rounded-2xl bg-black text-white font-black text-sm hover:opacity-85 transition cursor-pointer">
                Confirm Order →
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Fullscreen Editor — DESKTOP only (lg+) ── */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div className="fixed inset-0 z-[130] bg-black/93 flex flex-col"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* ── Mobile fullscreen top toolbar ── */}
            <div className="flex lg:hidden flex-col gap-2 px-3 py-3 border-b border-white/10 shrink-0 bg-black">
              <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => { setIsFullscreen(false); stopPan(); }}
                    className="w-9 h-9 rounded-full bg-white/10 text-white flex items-center justify-center active:scale-95 transition">
                    <Icons.X />
                  </button>
                  <button onClick={resetView}
                    className="px-3 h-9 rounded-full bg-white/10 text-white text-[10px] font-bold active:bg-white/20 transition">Reset View</button>
                </div>
                
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex bg-white/10 rounded-full p-1">
                    {['tshirt','hoodie','jeans'].map((g) => (
                      <button key={g} onClick={() => setGarment(g)}
                        className={`px-2.5 h-6 rounded-full text-[10px] font-bold transition-all ${garment === g ? 'bg-white text-black' : 'text-white/60'}`}>
                        {g === 'tshirt' ? 'Tee' : g === 'hoodie' ? 'Hoodie' : 'Jeans'}
                      </button>
                    ))}
                  </div>
                  <div className="flex bg-white/10 rounded-full p-1">
                    {['front','back'].map((s) => (
                      <button key={s} onClick={() => setActiveSide(s)}
                        className={`px-2.5 h-6 rounded-full text-[10px] font-bold transition-all uppercase ${activeSide === s ? 'bg-white text-black' : 'text-white/60'}`}>
                        {s.charAt(0)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* desktop toolbar */}
            <div className="hidden lg:flex items-center justify-between gap-2 px-4 py-3 flex-wrap shrink-0">
              <div className="flex items-center gap-2">
                <button onClick={() => { setIsFullscreen(false); stopPan(); }}
                  className="w-10 h-10 rounded-full bg-white/12 text-white flex items-center justify-center hover:bg-white/20 transition cursor-pointer">
                  <Icons.Minimize />
                </button>
                <button onClick={() => setStageZoom((p) => clampZoom(p - 0.2))}
                  className="w-10 h-10 rounded-full bg-white/12 text-white flex items-center justify-center hover:bg-white/20 transition cursor-pointer text-lg font-bold">−</button>
                <span className="text-white/60 text-xs font-bold w-10 text-center">{Math.round(stageZoom * 100)}%</span>
                <button onClick={() => setStageZoom((p) => clampZoom(p + 0.2))}
                  className="w-10 h-10 rounded-full bg-white/12 text-white flex items-center justify-center hover:bg-white/20 transition cursor-pointer text-lg font-bold">+</button>
                <button onClick={resetView}
                  className="px-3 h-10 rounded-full bg-white/12 text-white text-xs font-bold hover:bg-white/20 transition cursor-pointer">
                  Reset
                </button>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {['tshirt','hoodie','jeans'].map((g) => (
                  <button key={g} onClick={() => setGarment(g)}
                    className={`px-3 h-8 rounded-full text-xs font-bold transition cursor-pointer
                      ${garment === g ? 'bg-white text-black' : 'bg-white/12 text-white hover:bg-white/20'}`}>
                    {GARMENT_LABELS[g]}
                  </button>
                ))}
                <div className="w-px h-5 bg-white/15 mx-1" />
                {['front','back'].map((s) => (
                  <button key={s} onClick={() => setActiveSide(s)}
                    className={`px-3 h-8 rounded-full text-xs font-bold transition cursor-pointer capitalize
                      ${activeSide === s ? 'bg-white text-black' : 'bg-white/12 text-white hover:bg-white/20'}`}>
                    {s}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {activeArtworkOnThisSide && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button onClick={() => moveLayer(activeArtworkOnThisSide.id, 'up')} className="px-3 h-8 rounded-full bg-white/12 text-white text-xs font-bold hover:bg-white/20 transition cursor-pointer flex items-center gap-1"><Icons.LayerUp /> Up</button>
                    <button onClick={() => moveLayer(activeArtworkOnThisSide.id, 'down')} className="px-3 h-8 rounded-full bg-white/12 text-white text-xs font-bold hover:bg-white/20 transition cursor-pointer flex items-center gap-1"><Icons.LayerDn /> Down</button>
                    <div className="w-px h-5 bg-white/15 mx-1" />
                    <button onClick={centerArtwork} className="px-3 h-8 rounded-full bg-white/12 text-white text-xs font-bold hover:bg-white/20 transition cursor-pointer">Center</button>
                    <button onClick={rotateCCW} className="w-8 h-8 rounded-full bg-white/12 text-white flex items-center justify-center hover:bg-white/20 transition cursor-pointer"><Icons.RotateCW /></button>
                    <button onClick={rotateCW} className="w-8 h-8 rounded-full bg-white/12 text-white flex items-center justify-center hover:bg-white/20 transition cursor-pointer" style={{ transform: 'scaleX(-1)' }}><Icons.RotateCW /></button>
                    <button onClick={scaleDown} className="px-3 h-8 rounded-full bg-white/12 text-white text-xs font-bold hover:bg-white/20 transition cursor-pointer">−</button>
                    <button onClick={scaleUp} className="px-3 h-8 rounded-full bg-white/12 text-white text-xs font-bold hover:bg-white/20 transition cursor-pointer">+</button>
                    <button onClick={resetTransform} className="px-3 h-8 rounded-full bg-white/12 text-white text-xs font-bold hover:bg-white/20 transition cursor-pointer">Reset</button>
                    <div className="w-px h-5 bg-white/15 mx-1" />
                    <div className="flex items-center gap-1.5 px-3 h-8 rounded-full bg-white/12 text-white text-xs font-bold">
                      <Icons.Opacity />
                      <input type="range" min="0.1" max="1" step="0.05"
                        value={activeArtworkOnThisSide.opacity?.[activeSide] ?? 1}
                        onChange={(e) => setOpacity(activeArtworkOnThisSide.id, parseFloat(e.target.value))}
                        className="w-16 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white" />
                    </div>
                    <div className="w-px h-5 bg-white/15 mx-1" />
                  </div>
                )}
                {!isJeans ? (
                  <div className="flex items-center gap-1.5 px-2 h-8 rounded-full bg-white/12 text-white text-xs font-bold">
                    <span className="pl-1">Color</span>
                    <input type="color" value={garmentColor}
                      onChange={(e) => applyPreset(colord(e.target.value).toHex())}
                      className="w-5 h-5 rounded cursor-pointer border-0 p-0 bg-transparent" />
                  </div>
                ) : (
                  <div className="flex items-center gap-1 bg-white/12 rounded-full p-0.5 h-8">
                    <button onClick={() => setJeansType('default')} className={`px-2 h-full rounded-full text-[10px] font-bold ${jeansType === 'default' ? 'bg-white text-black' : 'text-white/60 hover:bg-white/10 transition cursor-pointer'}`}>Default</button>
                    <button onClick={() => setJeansType('blue')} className={`px-2 h-full rounded-full text-[10px] font-bold ${jeansType === 'blue' ? 'bg-white text-black' : 'text-white/60 hover:bg-white/10 transition cursor-pointer'}`}>Blue</button>
                  </div>
                )}
              </div>
            </div>

            {/* canvas area */}
            <div className="flex-1 px-4 pb-4 pt-4 lg:pt-0">
              <MockupCanvas {...canvasProps}
                stageZoom={stageZoom} stagePan={stagePan}
                onStagePointerDown={handlePointerDown}
                onStagePointerMove={handlePointerMove}
                onStagePointerUp={stopPan}
                onStageWheel={handleWheel}
                // Only pass handleStagePinch on desktop. On mobile, let pinch zoom the design!
                onStagePinch={typeof window !== 'undefined' && window.innerWidth >= 1024 ? handleStagePinch : undefined}
                heightClass="h-full"
                emptyLabel="Upload artwork to preview"
              />
              {activeArtworkOnThisSide && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-3 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-center text-xs text-blue-700 font-medium hidden lg:block"
                >
                  🎨 Drag to move · Corner anchors resize & rotate · Or use buttons above
                </motion.div>
              )}
            </div>

            <p className="text-center text-white/25 text-[11px] font-medium pb-3 shrink-0 hidden lg:block">
              Scroll to zoom · Drag to pan · Corner anchors to resize · Esc to exit
            </p>

            {/* ──  Mobile Fullscreen Info Banner ── */}
            {activeArtworkOnThisSide && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex lg:hidden px-3 py-2 mx-3 mb-2 bg-blue-500/20 border border-blue-400/40 rounded-lg text-center text-xs text-blue-200 font-medium"
              >
                ✋ Drag design to move · Press corners to resize & rotate
              </motion.div>
            )}

            {/* ── Mobile Fullscreen Bottom Tools ── */}
            <div className="flex lg:hidden flex-col gap-3 px-3 py-3 pb-6 sm:pb-8 border-t border-white/10 shrink-0 bg-black">
              {/* Transform controls row */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                 <button disabled={!activeArtworkOnThisSide} onClick={() => moveLayer(activeArtworkOnThisSide?.id, 'up')} className="px-3 h-10 shrink-0 rounded-full bg-white/10 text-white text-[11px] font-bold active:bg-white/20 transition disabled:opacity-20 disabled:pointer-events-none flex items-center gap-1"><Icons.LayerUp /> Up</button>
                 <button disabled={!activeArtworkOnThisSide} onClick={() => moveLayer(activeArtworkOnThisSide?.id, 'down')} className="px-3 h-10 shrink-0 rounded-full bg-white/10 text-white text-[11px] font-bold active:bg-white/20 transition disabled:opacity-20 disabled:pointer-events-none flex items-center gap-1"><Icons.LayerDn /> Down</button>
                 <div className="w-px h-6 bg-white/15 shrink-0 mx-0.5" />
                 <button disabled={!activeArtworkOnThisSide} onClick={rotateCCW} className="w-10 h-10 shrink-0 rounded-full bg-white/10 text-white flex items-center justify-center active:bg-white/20 transition disabled:opacity-20 disabled:pointer-events-none"><Icons.RotateCW /></button>
                 <button disabled={!activeArtworkOnThisSide} onClick={rotateCW} className="w-10 h-10 shrink-0 rounded-full bg-white/10 text-white flex items-center justify-center active:bg-white/20 transition disabled:opacity-20 disabled:pointer-events-none" style={{ transform: 'scaleX(-1)' }}><Icons.RotateCW /></button>
                 <button disabled={!activeArtworkOnThisSide} onClick={centerArtwork} className="px-3 h-10 shrink-0 rounded-full bg-white/10 text-white text-[11px] font-bold active:bg-white/20 transition disabled:opacity-20 disabled:pointer-events-none">Center</button>
                 <button disabled={!activeArtworkOnThisSide} onClick={resetTransform} className="px-3 h-10 shrink-0 rounded-full bg-white/10 text-white text-[11px] font-bold active:bg-white/20 transition disabled:opacity-20 disabled:pointer-events-none">Reset</button>
                 <button disabled={!activeArtworkOnThisSide} onClick={scaleDown} className="w-10 h-10 shrink-0 rounded-full bg-white/10 text-white text-base font-bold active:bg-white/20 transition disabled:opacity-20 disabled:pointer-events-none">−</button>
                 <button disabled={!activeArtworkOnThisSide} onClick={scaleUp} className="w-10 h-10 shrink-0 rounded-full bg-white/10 text-white text-base font-bold active:bg-white/20 transition disabled:opacity-20 disabled:pointer-events-none">+</button>
              </div>

              {/* Opacity Row */}
              <div className="flex items-center gap-3 px-2">
                <div className="text-white/60"><Icons.Opacity /></div>
                <input type="range" min="0.1" max="1" step="0.05"
                    disabled={!activeArtworkOnThisSide}
                    value={activeArtworkOnThisSide?.opacity?.[activeSide] ?? 1}
                    onChange={(e) => { if(activeArtworkOnThisSide) setOpacity(activeArtworkOnThisSide.id, parseFloat(e.target.value)) }}
                    className="flex-1 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white disabled:opacity-20" />
                <span className="text-white/60 text-[10px] font-bold w-10 text-right">
                   {activeArtworkOnThisSide ? Math.round((activeArtworkOnThisSide.opacity?.[activeSide] ?? 1) * 100) + '%' : '---'}
                </span>
                <div className="w-px h-6 bg-white/15 mx-1 shrink-0" />
                {!isJeans ? (
                  <div className="flex items-center gap-2 pl-2 pr-1 shrink-0 bg-white/10 rounded-full h-8 cursor-pointer">
                    <span className="text-white text-[10px] font-bold pointer-events-none">Color</span>
                    <input type="color" value={garmentColor} onChange={(e) => applyPreset(colord(e.target.value).toHex())} className="w-6 h-6 rounded-full cursor-pointer border-0 p-0 bg-transparent" />
                  </div>
                ) : (
                  <div className="flex bg-white/10 rounded-full p-0.5 shrink-0 items-center h-8">
                    <button onClick={() => setJeansType('default')} className={`px-2 h-7 rounded-full text-[10px] font-bold ${jeansType === 'default' ? 'bg-white text-black' : 'text-white/60'}`}>Default</button>
                    <button onClick={() => setJeansType('blue')} className={`px-2 h-7 rounded-full text-[10px] font-bold ${jeansType === 'blue' ? 'bg-white text-black' : 'text-white/60'}`}>Blue</button>
                  </div>
                )}
                <button disabled={!activeArtworkOnThisSide} onClick={() => { if(activeArtworkOnThisSide) { removeArtwork(activeArtworkOnThisSide.id); showToast('Deleted'); setIsFullscreen(false); } }}
                    className="w-8 h-8 shrink-0 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center active:bg-red-500/40 transition disabled:opacity-20 disabled:pointer-events-none ml-1">
                    <Icons.Trash />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════════════════════════════════
          PAGE BODY
      ════════════════════════════════════════════════════════════════════ */}
      <main className="flex-1 px-4 sm:px-8 pt-24 sm:pt-28 pb-28 lg:pb-16">
        <motion.div className="max-w-7xl mx-auto" variants={stagger} initial="hidden" animate="visible">

          {/* header */}
          <motion.p variants={fadeUp} className="text-[0.65rem] sm:text-xs tracking-[0.22em] uppercase text-black/40 font-black">
            Custom Printing Studio
          </motion.p>
          <motion.h1 variants={fadeUp} className="mt-2 text-2xl sm:text-4xl md:text-5xl font-black text-black leading-tight max-w-3xl">
            Got a Design?<br className="sm:hidden" /> We'll Print It.
          </motion.h1>
          <motion.p variants={fadeUp} className="mt-3 text-sm sm:text-base text-black/55 font-medium max-w-xl">
            Upload artwork, choose your garment, dial in the color, and position your design with precision.
          </motion.p>

          {/* ═══ DESKTOP LAYOUT ═══════════════════════════════════════════ */}
          <motion.div variants={panelIn} className="mt-8 hidden lg:grid grid-cols-[390px_1fr] gap-5 items-start">

            {/* ── Left sidebar ── */}
            <div className="flex flex-col gap-4">

              {/* Upload */}
              <div className="rounded-[24px] border border-black/10 bg-white/75 backdrop-blur-sm shadow-[0_12px_28px_rgba(0,0,0,0.07)] p-5">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-black text-black">Upload Designs</p>
                  <span className="text-xs font-bold text-black/35">{artworks.length}/{MAX_UPLOADS}</span>
                </div>
                <p className="text-xs text-black/45 mb-4">PNG · SVG · JPG · PDF · max 10 MB</p>

                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                  onClick={() => inputRef.current?.click()}
                  role="button" tabIndex={0}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
                  className={`rounded-2xl border-2 border-dashed min-h-32 flex flex-col items-center justify-center gap-2 text-center px-5 cursor-pointer transition-all
                    ${dragOver ? 'border-black/50 bg-black/5 scale-[0.99]' : 'border-black/16 bg-white/50 hover:border-black/28 hover:bg-black/2'}`}>
                  <input ref={inputRef} type="file" accept=".png,.svg,.jpg,.jpeg,.pdf" multiple className="hidden" onChange={handleInputChange} />
                  <div className="text-black/25"><Icons.Upload /></div>
                  <div>
                    <p className="text-sm font-bold text-black">Drag & drop files here</p>
                    <p className="text-xs text-black/45 mt-0.5">or click to browse</p>
                  </div>
                </div>

                {uploadError && <p className="mt-2 text-xs font-semibold text-red-600">{uploadError}</p>}

                <button
                  type="button"
                  onClick={addTextLayer}
                  className="mt-3 w-full h-10 rounded-xl border border-black/12 bg-black/4 text-black text-xs font-bold hover:bg-black/10 transition cursor-pointer"
                >
                  + Add Text Layer
                </button>

                {/* Artwork list */}
                <div className="mt-4 flex flex-col gap-1.5 max-h-56 overflow-y-auto">
                  {artworks.length === 0 && (
                    <div className="rounded-xl bg-black/3 border border-black/6 px-4 py-4 text-xs text-black/35 text-center">
                      No designs yet — upload above
                    </div>
                  )}
                  {artworks.map((aw, i) => {
                    const isAct = aw.id === activeArtworkId;
                    return (
                      <div key={aw.id} onClick={() => setActiveArtworkId(aw.id)}
                        className={`group rounded-xl border px-3 py-2.5 flex items-center gap-2.5 cursor-pointer transition-all
                          ${isAct ? 'border-black bg-black text-white' : 'border-black/10 bg-white hover:bg-black/2'}`}>
                        {aw.previewUrl
                          ? <img src={aw.previewUrl} alt="" className="w-8 h-8 rounded-lg object-cover shrink-0 bg-black/8" />
                          : <div className="w-8 h-8 rounded-lg bg-black/25 flex items-center justify-center shrink-0"><span className={`text-[9px] font-black ${isAct ? 'text-white/60' : 'text-black/50'}`}>{aw.type === 'text' ? 'TXT' : 'PDF'}</span></div>
                        }
                        <div className="flex-1 min-w-0">
                          <p className={`text-[10px] font-black uppercase tracking-wide ${isAct ? 'text-white/45' : 'text-black/35'}`}>Design {i + 1}</p>
                          <p className="text-xs font-bold truncate">{aw.name}</p>
                          <p className={`text-[10px] ${isAct ? 'text-white/40' : 'text-black/35'}`}>{aw.type === 'text' ? 'Text Layer' : formatFileSize(aw.size)}</p>
                        </div>
                        <div className="flex gap-0.5 shrink-0">
                          <button onClick={(e) => { e.stopPropagation(); duplicateArtwork(aw.id); }} title="Duplicate"
                            className={`w-7 h-7 rounded-lg flex items-center justify-center transition cursor-pointer
                              ${isAct ? 'text-white/50 hover:text-white hover:bg-white/15' : 'text-black/25 hover:text-black hover:bg-black/8'}`}>
                            <Icons.Copy />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); removeArtwork(aw.id); }} title="Remove"
                            className={`w-7 h-7 rounded-lg flex items-center justify-center transition cursor-pointer
                              ${isAct ? 'text-white/50 hover:text-red-300 hover:bg-white/10' : 'text-black/25 hover:text-red-500 hover:bg-red-50'}`}>
                            <Icons.Trash />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Garment + Side */}
              <div className="rounded-[24px] border border-black/10 bg-white/75 backdrop-blur-sm shadow-[0_12px_28px_rgba(0,0,0,0.07)] p-5">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-black/45 mb-3">Garment</p>
                <div className="flex flex-wrap gap-2">
                  {['tshirt','hoodie','jeans'].map((g) => (
                    <PillBtn key={g} active={garment === g} onClick={() => setGarment(g)}>{GARMENT_LABELS[g]}</PillBtn>
                  ))}
                </div>
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-black/45 mb-3 mt-4">Side</p>
                <div className="flex gap-2">
                  <PillBtn active={activeSide === 'front'} onClick={() => setActiveSide('front')}>Front</PillBtn>
                  <PillBtn active={activeSide === 'back'}  onClick={() => setActiveSide('back')}>Back</PillBtn>
                </div>
                {isJeans && (
                  <>
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-black/45 mb-3 mt-4">Jeans Wash</p>
                    <div className="flex gap-2">
                      <PillBtn active={jeansType === 'default'} onClick={() => setJeansType('default')}>Default</PillBtn>
                      <PillBtn active={jeansType === 'blue'} onClick={() => setJeansType('blue')}
                        className={jeansType === 'blue' ? '!bg-blue-700 !text-white' : ''}>Blue Wash</PillBtn>
                    </div>
                  </>
                )}
              </div>

              {/* Color */}
              {!isJeans && (
                <div className="rounded-[24px] border border-black/10 bg-white/75 backdrop-blur-sm shadow-[0_12px_28px_rgba(0,0,0,0.07)] p-5">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-black/45">Garment Color</p>
                    <button onClick={() => applyPreset('#111111')} className="text-[11px] font-bold text-black/40 hover:text-black transition cursor-pointer">Reset</button>
                  </div>
                  <div className="grid grid-cols-[1fr_auto_auto] gap-2 items-center">
                    <input type="text" value={colorInput}
                      onChange={(e) => { setColorInput(e.target.value); setColorError(''); }}
                      onBlur={() => commitColor(colorInput.trim())}
                      onKeyDown={(e) => e.key === 'Enter' && commitColor(colorInput.trim())}
                      placeholder="#111111"
                      className="h-9 rounded-xl border border-black/16 bg-white px-3 text-sm font-bold text-black outline-none focus:border-black/45 transition" />
                    <input type="color" value={garmentColor}
                      onChange={(e) => applyPreset(colord(e.target.value).toHex())}
                      className="h-9 w-12 rounded-xl border border-black/16 bg-white p-1 cursor-pointer" />
                    <span className="w-9 h-9 rounded-xl border border-black/12 shadow-sm block" style={{ background: garmentColor }} />
                  </div>
                  {colorError && <p className="mt-1.5 text-xs text-red-600 font-semibold">{colorError}</p>}

                  <div className="mt-3 grid grid-cols-6 gap-2">
                    {COLOR_PRESETS.map(({ hex, label }) => (
                      <button key={hex} type="button" title={label} onClick={() => applyPreset(hex)}
                        className={`aspect-square rounded-xl border-2 transition-all cursor-pointer relative hover:scale-105
                          ${garmentColor === hex ? 'border-black scale-105' : 'border-white/0 hover:border-black/20'}`}
                        style={{ background: hex, boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }}>
                        {garmentColor === hex && (
                          <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className={`text-[9px] font-black ${['#FFFFFF','#D9D9D9'].includes(hex) ? 'text-black' : 'text-white'}`}>✓</span>
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Design controls */}
              <div className="rounded-[24px] border border-black/10 bg-white/75 backdrop-blur-sm shadow-[0_12px_28px_rgba(0,0,0,0.07)] p-5">
                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-black/45 mb-3">Design Controls</p>

                <div className="grid grid-cols-2 gap-2">
                  <CtrlBtn onClick={centerArtwork}  disabled={!activeArtwork} className="col-span-1"><Icons.Center /> Center</CtrlBtn>
                  <CtrlBtn onClick={resetTransform} disabled={!activeArtwork} className="col-span-1">↺ Reset</CtrlBtn>
                  <CtrlBtn onClick={scaleUp}   disabled={!activeArtwork}>Scale +</CtrlBtn>
                  <CtrlBtn onClick={scaleDown} disabled={!activeArtwork}>Scale −</CtrlBtn>
                  <CtrlBtn onClick={rotateCCW} disabled={!activeArtwork}>↺ CCW</CtrlBtn>
                  <CtrlBtn onClick={rotateCW}  disabled={!activeArtwork}>↻ CW</CtrlBtn>
                </div>

                {artworks.length > 1 && activeArtwork && (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <CtrlBtn onClick={() => moveLayer(activeArtwork.id, 'up')}>
                      <Icons.LayerUp /> Layer ↑
                    </CtrlBtn>
                    <CtrlBtn onClick={() => moveLayer(activeArtwork.id, 'down')}>
                      <Icons.LayerDn /> Layer ↓
                    </CtrlBtn>
                  </div>
                )}

                {activeArtwork && (
                  <div className="mt-3">
                    <div className="flex justify-between mb-1.5">
                      <p className="text-[11px] font-black uppercase tracking-[0.15em] text-black/45 flex items-center gap-1.5">
                        <Icons.Opacity /> Opacity
                      </p>
                      <span className="text-xs font-bold text-black/55">
                        {Math.round((activeArtwork.opacity?.[activeSide] ?? 1) * 100)}%
                      </span>
                    </div>
                    <input type="range" min={10} max={100} step={5}
                      value={Math.round((activeArtwork.opacity?.[activeSide] ?? 1) * 100)}
                      onChange={(e) => setOpacity(activeArtwork.id, Number(e.target.value) / 100)}
                      className="w-full accent-black h-1.5 cursor-pointer" />
                  </div>
                )}

                {activeArtwork?.type === 'text' && (
                  <div className="mt-3 space-y-2.5">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.15em] text-black/45 mb-1.5">Text Content</p>
                      <input
                        type="text"
                        value={activeArtwork.text || ''}
                        maxLength={TEXT_LAYER_MAX_LENGTH}
                        onChange={(e) => updateArtworkText(activeArtwork.id, e.target.value)}
                        className="w-full h-9 rounded-xl border border-black/16 bg-white px-3 text-sm font-bold text-black outline-none focus:border-black/45 transition"
                        placeholder="Your Text"
                      />
                    </div>
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.15em] text-black/45 mb-1.5">Text Color</p>
                      <input
                        type="color"
                        value={activeArtwork.textColor || '#111111'}
                        onChange={(e) => updateArtworkTextColor(activeArtwork.id, e.target.value)}
                        className="h-9 w-14 rounded-xl border border-black/16 bg-white p-1 cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* CTA */}
              <button type="button" disabled={!hasUploads} onClick={() => setShowOrder(true)}
                className={`w-full h-12 rounded-2xl font-black text-sm transition-all
                  ${hasUploads ? 'bg-black text-white hover:opacity-85 cursor-pointer shadow-[0_4px_14px_rgba(0,0,0,0.18)]' : 'bg-black/10 text-black/35 cursor-not-allowed'}`}>
                Proceed to Print →
              </button>
            </div>

            {/* ── Right: Canvas ── */}
            <div className="rounded-[24px] border border-black/10 bg-[#ececec] shadow-[0_12px_28px_rgba(0,0,0,0.07)] p-4 sm:p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm font-black text-black/80">Mockup Preview</p>
                  <p className="text-xs text-black/40 mt-0.5">
                    {garmentName} · {activeSide.charAt(0).toUpperCase() + activeSide.slice(1)}
                    {!isJeans ? ` · ${garmentColor.toUpperCase()}` : ` · ${jeansType === 'blue' ? 'Blue Wash' : 'Default'}`}
                  </p>
                </div>
                <button onClick={() => { resetView(); setIsFullscreen(true); }}
                  className="flex items-center gap-1.5 px-3.5 h-9 rounded-xl bg-black text-white text-xs font-bold hover:opacity-85 transition cursor-pointer">
                  <Icons.Maximize /> Fullscreen Editor
                </button>
              </div>

              <MockupCanvas {...canvasProps}
                stageZoom={1} stagePan={{ x: 0, y: 0 }}
                onStagePointerDown={() => {}}
                onStagePointerMove={handlePointerMove}
                onStagePointerUp={stopPan}
                onStageWheel={() => {}}
                heightClass="h-[500px] xl:h-[580px]"
                emptyLabel="Upload artwork to preview"
              />

              <p className="mt-3 text-center text-[11px] text-black/30 font-medium tracking-wide">
                Click to select · Drag to move · Corner handles to resize · Open Fullscreen for zoom + pan
              </p>
              {activeArtworkOnThisSide && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className="mt-2 text-center text-[10px] bg-blue-50 border border-blue-200 text-blue-700 rounded-lg px-3 py-2 font-semibold"
                >
                  💡 Drag design to move · Use corner handles to resize & rotate
                </motion.div>
              )}
            </div>
          </motion.div>

                    {/* ═══ MOBILE LAYOUT (APP-LIKE) ═════════════════════════════════ */}
          <motion.div variants={panelIn} className="mt-4 lg:hidden flex flex-col">
            {/* Minimal Top Nav */}
            <div className="flex flex-col gap-2.5 mb-2">
              <div className="flex items-center justify-between">
                <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                  {['tshirt','hoodie','jeans'].map((g) => (
                    <button key={g} onClick={() => setGarment(g)} 
                      className={`shrink-0 px-3.5 h-8 rounded-full text-xs font-bold transition-all ${garment === g ? 'bg-black text-white shadow-md' : 'bg-black/5 text-black hover:bg-black/10'}`}>
                      {GARMENT_LABELS[g]}
                    </button>
                  ))}
                </div>
                <div className="flex gap-1 bg-black/5 p-1 rounded-full shrink-0">
                  {['front','back'].map((s) => (
                    <button key={s} onClick={() => setActiveSide(s)} 
                      className={`px-3 h-6 rounded-full text-[10px] uppercase tracking-wide font-black transition-all ${activeSide === s ? 'bg-white text-black shadow-sm' : 'text-black/40'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              {isJeans && (
                <div className="flex gap-1.5 animate-in fade-in slide-in-from-top-1">
                  <PillBtn active={jeansType === 'default'} onClick={() => setJeansType('default')} className="h-7 text-[11px] px-3">Default</PillBtn>
                  <PillBtn active={jeansType === 'blue'} onClick={() => setJeansType('blue')} className={`h-7 text-[11px] px-3 ${jeansType === 'blue' ? '!bg-blue-700 !text-white' : ''}`}>Blue Wash</PillBtn>
                </div>
              )}
            </div>

            {/* Canvas container: Maximized height */}
            <div className="rounded-[24px] shadow-[0_12px_32px_rgba(0,0,0,0.08)] bg-[#ececec] border border-black/10 overflow-hidden relative isolate">
              
              {/* Top tools on canvas */}
              <div className="absolute top-3 right-3 z-[40] flex gap-2">
                {activeArtworkOnThisSide && (
                  <button onClick={() => { removeArtworkFromSide(activeArtworkOnThisSide.id, activeSide); showToast(`Removed from ${activeSide}`); }} 
                    className="w-8 h-8 rounded-full bg-white/90 backdrop-blur shadow-sm flex items-center justify-center text-red-500 active:scale-95 transition">
                    <Icons.Trash />
                  </button>
                )}
                <button onClick={() => { resetView(); setIsFullscreen(true); }}
                  className="px-3 h-8 rounded-full bg-white/90 backdrop-blur shadow-sm text-black text-[11px] font-black flex items-center justify-center gap-1 active:scale-95 transition">
                  <Icons.Maximize /> Edit
                </button>
              </div>

              <MockupCanvas {...canvasProps}
                stageZoom={1} stagePan={{ x: 0, y: 0 }}
                onStagePointerDown={() => {}}
                onStagePointerMove={handlePointerMove}
                onStagePointerUp={stopPan}
                onStageWheel={() => {}}
                heightClass="h-[48vh] min-h-[400px]"
                emptyLabel="Design preview"
              />

              {/* Bottom gradient on canvas to visually cleanly separate floating action bar */}
              <div className="absolute bottom-0 inset-x-0 h-12 bg-gradient-to-t from-black/5 to-transparent pointer-events-none" />
            </div>

          </motion.div>
        </motion.div>
      </main>

      {/* ── Fixed Bottom Actions (Mobile) ── */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-[100] bg-white border-t border-black/5 pb-safe pt-2 px-3 shadow-[0_-12px_40px_rgba(0,0,0,0.08)]">
        <div className="flex gap-2 items-center h-14 pb-2">
          
          <button onClick={() => setMobileTab('designs')}
            className={`flex-1 h-full rounded-2xl flex flex-col items-center justify-center transition-all ${mobileTab === 'designs' ? 'bg-black text-white shadow-lg scale-105' : 'bg-black/4 text-black/50 hover:bg-black/8 hover:text-black active:scale-95'}`}>
            {artworks.length > 0 && mobileTab !== 'designs' && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
            )}
            <Icons.Upload />
            <span className="text-[9px] font-black mt-1">Design</span>
          </button>
          
          {!isJeans && (
            <button onClick={() => setMobileTab('color')}
              className={`flex-1 h-full rounded-2xl flex flex-col items-center justify-center transition-all ${mobileTab === 'color' ? 'bg-black text-white shadow-lg scale-105' : 'bg-black/4 text-black/50 hover:bg-black/8 hover:text-black active:scale-95'}`}>
              <div className="w-[14px] h-[14px] rounded-sm ring-1 ring-black/20" style={{ background: garmentColor }} />
              <span className="text-[9px] font-black mt-1">Color</span>
            </button>
          )}

          <button onClick={() => setMobileTab('adjust')}
            className={`flex-1 h-full rounded-2xl flex flex-col items-center justify-center transition-all ${mobileTab === 'adjust' ? 'bg-black text-white shadow-lg scale-105' : 'bg-black/4 text-black/50 hover:bg-black/8 hover:text-black active:scale-95'}`}>
            <Icons.Center />
            <span className="text-[9px] font-black mt-1">Adjust</span>
          </button>

          <button onClick={() => setMobileTab('layers')}
            className={`flex-1 h-full rounded-2xl flex flex-col items-center justify-center transition-all ${mobileTab === 'layers' ? 'bg-black text-white shadow-lg scale-105' : 'bg-black/4 text-black/50 hover:bg-black/8 hover:text-black active:scale-95'}`}>
            <Icons.LayerDn />
            <span className="text-[9px] font-black mt-1">Layers</span>
          </button>

          <button disabled={!hasUploads} onClick={() => setShowOrder(true)}
            className={`flex-[1.5] h-full rounded-2xl flex flex-col items-center justify-center transition-all shadow-md ${hasUploads ? 'bg-black text-white active:scale-95 hover:bg-black/85' : 'bg-black/10 text-black/30 cursor-not-allowed'}`}>
            <span className="text-[13px] font-black leading-tight">Order</span>
            <span className="text-[9px] font-semibold opacity-80 mt-0.5">Ready →</span>
          </button>

        </div>
      </div>

      {/* ── Mobile Tab Bottom Sheet ── */}
      <AnimatePresence>
        {mobileTab && (
          <React.Fragment key="mobile-sheet">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileTab(null)}
              className="lg:hidden fixed inset-0 z-[110] bg-black/20 backdrop-blur-sm"
            />
            {/* Sheet */}
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 260 }}
              drag="y" dragConstraints={{ top: 0 }} dragElastic={0.2}
              onDragEnd={(_, i) => { if (i.offset.y > 60) setMobileTab(null); }}
              className="lg:hidden fixed bottom-0 inset-x-0 z-[120] bg-white rounded-t-3xl shadow-[0_-20px_40px_rgba(0,0,0,0.1)] pb-safe pt-1 flex flex-col max-h-[75vh]"
            >
              <div className="w-full flex justify-center py-2 cursor-grab active:cursor-grabbing">
                <div className="w-10 h-1.5 rounded-full bg-black/15" />
              </div>
              
              <div className="flex items-center justify-between px-5 pb-2 border-b border-black/5">
                <h3 className="text-base font-black capitalize tracking-wide text-black/80">{mobileTab}</h3>
                <button onClick={() => setMobileTab(null)} className="w-8 h-8 bg-black/5 rounded-full flex items-center justify-center active:scale-90 transition">
                  <Icons.X />
                </button>
              </div>

              <div className="overflow-y-auto px-5 py-4 pb-12">
                {/* ── DESIGNS TAB ── */}
                {mobileTab === 'designs' && (
                  <div className="flex flex-col gap-4">
                    <div
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={handleDrop}
                      onClick={() => inputRef.current?.click()}
                      className={`rounded-2xl border-2 border-dashed h-20 flex items-center justify-center gap-4 cursor-pointer transition-all active:scale-[0.98]
                        ${dragOver ? 'border-black/50 bg-black/4' : 'border-black/15 bg-black/2'}`}>
                      <div className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center text-black/40"><Icons.Upload /></div>
                      <div>
                        <p className="text-sm font-bold text-black leading-tight">Upload new design</p>
                        <p className="text-[10px] text-black/40 mt-0.5">PNG · SVG · JPG · PDF</p>
                      </div>
                      <span className="ml-auto mr-1 text-xs font-black bg-black/10 px-2 py-0.5 rounded-md text-black/50">{artworks.length}/{MAX_UPLOADS}</span>
                    </div>
                    {uploadError && <p className="text-xs text-red-600 font-semibold">{uploadError}</p>}

                    <button
                      type="button"
                      onClick={addTextLayer}
                      className="h-11 rounded-2xl border border-black/10 bg-black/4 text-black text-xs font-black active:scale-[0.98] transition"
                    >
                      + Add Text Layer
                    </button>

                    <div className="flex flex-col gap-2">
                      {artworks.length === 0 && <p className="text-xs text-black/35 text-center py-5">No designs yet</p>}
                      {artworks.map((aw) => {
                        const isAct = aw.id === activeArtworkId;
                        const onFront = !aw.visible || aw.visible.front !== false;
                        const onBack  = !aw.visible || aw.visible.back  !== false;
                        return (
                          <div key={aw.id} onClick={() => setActiveArtworkId(aw.id)}
                            className={`flex items-center gap-3 rounded-2xl border p-2 cursor-pointer transition-all active:scale-[0.99]
                              ${isAct ? 'border-black shadow-md bg-white' : 'border-black/5 bg-black/[0.02]'}`}>
                            {aw.previewUrl
                              ? <img src={aw.previewUrl} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0 border border-black/5 shadow-sm" />
                              : <div className="w-12 h-12 rounded-xl shrink-0 flex items-center justify-center bg-black/10"><span className="text-[10px] font-black text-black/40">{aw.type === 'text' ? 'TXT' : 'PDF'}</span></div>
                            }
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold truncate text-black">{aw.name}</p>
                              <div className="flex gap-1.5 mt-1.5">
                                {[['Front', onFront], ['Back', onBack]].map(([label, active]) => (
                                  <span key={label} className={`text-[9px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded
                                    ${active ? 'bg-black/10 text-black/70' : 'bg-black/4 text-black/20 line-through'}`}>
                                    {label}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <div className="flex flex-col gap-1 shrink-0 p-1">
                              <button onClick={(e) => { e.stopPropagation(); duplicateArtwork(aw.id); }}
                                className="w-7 h-7 rounded-lg bg-black/5 flex items-center justify-center text-black/50 hover:text-black active:scale-90 transition">
                                <Icons.Copy />
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); removeArtworkFromSide(aw.id, activeSide); showToast(`Removed from ${activeSide}`); }}
                                className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center text-red-500 hover:text-red-600 active:scale-90 transition">
                                <Icons.Trash />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ── COLOR TAB ── */}
                {mobileTab === 'color' && (
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3 p-1">
                      <div className="w-14 h-14 rounded-2xl border-2 border-black/10 shadow-inner shrink-0 transition-all" style={{ background: garmentColor }} />
                      <div className="flex-1 relative">
                        <p className="text-[10px] font-black uppercase tracking-wide text-black/40 mb-1.5 ml-1">Custom Hex</p>
                        <input type="text" value={colorInput}
                          onChange={(e) => { setColorInput(e.target.value); setColorError(''); }}
                          onBlur={() => commitColor(colorInput.trim())}
                          onKeyDown={(e) => e.key === 'Enter' && commitColor(colorInput.trim())}
                          className="w-full h-11 rounded-2xl border-2 border-black/10 bg-black/2 px-4 text-sm font-bold uppercase tracking-wider outline-none focus:border-black/50 transition-all" />
                      </div>
                      <input type="color" value={garmentColor}
                        onChange={(e) => applyPreset(colord(e.target.value).toHex())}
                        className="h-14 w-14 rounded-2xl border-2 border-black/10 bg-white p-2 cursor-pointer shrink-0" />
                    </div>
                    {colorError && <p className="mb-2 text-xs text-red-600 font-semibold">{colorError}</p>}
                    
                    <p className="text-[10px] font-black uppercase tracking-wide text-black/40 mt-1">Palette</p>
                    <div className="grid grid-cols-6 gap-2 sm:gap-3">
                      {COLOR_PRESETS.map(({ hex, label }) => (
                        <button key={hex} type="button" title={label} onClick={() => applyPreset(hex)}
                          className={`aspect-square w-full rounded-2xl border-2 transition-all active:scale-90 relative
                            ${garmentColor === hex ? 'border-black scale-105 shadow-md' : 'border-black/5 shadow-sm'}`}
                          style={{ background: hex }}>
                          {garmentColor === hex && (
                            <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <span className={`text-xs font-black ${['#FFFFFF','#D9D9D9'].includes(hex) ? 'text-black' : 'text-white'}`}>✓</span>
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* ── ADJUST TAB ── */}
                {mobileTab === 'adjust' && (
                  <div className="flex flex-col gap-4">
                    {!activeArtworkOnThisSide ? (
                      <div className="py-8 text-center bg-black/4 rounded-2xl border border-black/5">
                        <p className="text-sm font-bold text-black/40 mb-1">No design selected</p>
                        <p className="text-[11px] text-black/30">Select or upload a design on this side</p>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { label: 'Center',   fn: centerArtwork,  icon: <Icons.Center /> },
                            { label: 'Reset',    fn: resetTransform, icon: null },
                            { label: 'Scale +',  fn: scaleUp,        icon: null },
                            { label: 'Scale −',  fn: scaleDown,      icon: null },
                            { label: '↺ Rotate CCw', fn: rotateCCW, icon: null },
                            { label: '↻ Rotate CW',  fn: rotateCW,  icon: null },
                          ].map(({ label, fn, icon }) => (
                            <button key={label} onClick={fn}
                              className="h-12 rounded-xl bg-black/4 border border-black/5 text-black/80 text-[13px] font-bold flex items-center justify-center gap-2 hover:bg-black/8 active:bg-black/10 active:scale-[0.98] transition">
                              {icon}{label}
                            </button>
                          ))}
                        </div>

                        <div className="bg-black/4 border border-black/5 rounded-2xl p-4 mt-2">
                          <div className="flex justify-between items-center mb-3">
                            <p className="text-[11px] font-black uppercase tracking-wide text-black/60 flex items-center gap-1.5"><Icons.Opacity /> Opacity</p>
                            <span className="text-xs font-black bg-white px-2 py-0.5 rounded-md shadow-sm">{Math.round((activeArtworkOnThisSide.opacity?.[activeSide] ?? 1) * 100)}%</span>
                          </div>
                          <input type="range" min={10} max={100} step={5}
                            value={Math.round((activeArtworkOnThisSide.opacity?.[activeSide] ?? 1) * 100)}
                            onChange={(e) => setOpacity(activeArtworkOnThisSide.id, Number(e.target.value) / 100)}
                            className="w-full accent-black h-2.5 cursor-pointer rounded-full bg-black/10" />
                        </div>

                        {activeArtworkOnThisSide.type === 'text' && (
                          <div className="bg-black/4 border border-black/5 rounded-2xl p-4 mt-2 space-y-3">
                            <div>
                              <p className="text-[11px] font-black uppercase tracking-wide text-black/60 mb-2">Text Content</p>
                              <input
                                type="text"
                                value={activeArtworkOnThisSide.text || ''}
                                maxLength={TEXT_LAYER_MAX_LENGTH}
                                onChange={(e) => updateArtworkText(activeArtworkOnThisSide.id, e.target.value)}
                                className="w-full h-11 rounded-2xl border-2 border-black/10 bg-white px-3 text-sm font-bold outline-none focus:border-black/40"
                                placeholder="Your Text"
                              />
                            </div>
                            <div className="flex items-center gap-3">
                              <p className="text-[11px] font-black uppercase tracking-wide text-black/60">Text Color</p>
                              <input
                                type="color"
                                value={activeArtworkOnThisSide.textColor || '#111111'}
                                onChange={(e) => updateArtworkTextColor(activeArtworkOnThisSide.id, e.target.value)}
                                className="h-11 w-14 rounded-xl border border-black/12 bg-white p-1"
                              />
                            </div>
                          </div>
                        )}
                        
                        <button onClick={() => { removeArtwork(activeArtworkOnThisSide.id); showToast('Deleted'); setMobileTab(null); }}
                          className="mt-1 w-full h-12 rounded-xl bg-red-50 text-red-500 text-[13px] font-bold flex items-center justify-center gap-2 active:bg-red-100 active:scale-[0.98] transition">
                          <Icons.Trash /> Delete Design Completely
                        </button>
                      </>
                    )}
                  </div>
                )}

                {/* ── LAYERS TAB ── */}
                {mobileTab === 'layers' && (
                  <div className="flex flex-col gap-2">
                    {artworks.length === 0 ? (
                      <div className="py-8 text-center bg-black/4 rounded-2xl border border-black/5">
                        <p className="text-sm font-bold text-black/40 mb-1">No layers</p>
                      </div>
                    ) : (
                      <>
                        <p className="text-[10px] font-black uppercase tracking-widest text-black/30 mb-1 pl-1">Top Layer</p>
                        {[...artworks].reverse().map((aw, revI) => {
                          const realIdx = artworks.length - 1 - revI;
                          const isAct = aw.id === activeArtworkId;
                          const onThisSide = !aw.visible || aw.visible[activeSide] !== false;
                          return (
                            <div key={aw.id} onClick={() => setActiveArtworkId(aw.id)}
                              className={`flex items-center gap-3 p-2 rounded-2xl border cursor-pointer transition-all active:scale-[0.99]
                                ${isAct ? 'bg-black border-black shadow-lg text-white' : onThisSide ? 'bg-white border-black/10' : 'bg-black/4 border-black/5 opacity-60'}`}>
                              {aw.previewUrl
                                ? <img src={aw.previewUrl} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0 bg-white/10" />
                                : <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-black/20"><span className="text-[10px] font-black">{aw.type === 'text' ? 'TXT' : 'PDF'}</span></div>
                              }
                              <p className={`flex-1 text-sm font-bold truncate ${isAct ? 'text-white' : 'text-black'}`}>{aw.name}</p>
                              
                              <button onClick={(e) => {
                                  e.stopPropagation();
                                  if (!onThisSide) {
                                    setArtworks((p) => p.map((a) => a.id !== aw.id ? a : { ...a, visible: { ...a.visible, [activeSide]: true } }));
                                  } else {
                                    removeArtworkFromSide(aw.id, activeSide);
                                  }
                                }}
                                className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black transition active:scale-90
                                  ${isAct ? 'bg-white/15 hover:bg-white/25 text-white' : 'bg-black/5 hover:bg-black/10 text-black/40'}`}>
                                {onThisSide ? 'ON' : 'OFF'}
                              </button>
                              
                              <div className="flex flex-col gap-1 pr-1">
                                <button onClick={(e) => { e.stopPropagation(); moveLayer(aw.id, 'up'); }} disabled={realIdx === artworks.length - 1}
                                  className={`w-8 h-5 rounded-md flex items-center justify-center transition active:bg-black/10 disabled:opacity-20
                                    ${isAct ? 'bg-white/10' : 'bg-black/5'}`}><Icons.LayerUp /></button>
                                <button onClick={(e) => { e.stopPropagation(); moveLayer(aw.id, 'down'); }} disabled={realIdx === 0}
                                  className={`w-8 h-5 rounded-md flex items-center justify-center transition active:bg-black/10 disabled:opacity-20
                                    ${isAct ? 'bg-white/10' : 'bg-black/5'}`}><Icons.LayerDn /></button>
                              </div>
                            </div>
                          );
                        })}
                        <p className="text-[10px] font-black uppercase tracking-widest text-black/30 mt-1 pl-1">Bottom Layer</p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </React.Fragment>
        )}
      </AnimatePresence>
      <Footer />
    </div>
  );
};

export default PrintStudioPage;
