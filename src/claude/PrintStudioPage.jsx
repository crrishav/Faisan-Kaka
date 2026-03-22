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

const MOCK_IMAGE_MAP = {
  tshirt:        { front: tshirtFrontMock,    back: tshirtBackMock    },
  hoodie:        { front: hoodieFrontMock,    back: hoodieBackMock    },
  jeans_default: { front: jeansFrontMock,     back: jeansBackMock     },
  jeans_blue:    { front: jeansFrontBlueMock, back: jeansBackBlueMock },
};

const GARMENT_LABELS = { tshirt: 'T-Shirt', hoodie: 'Hoodie', jeans: 'Jeans' };

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
  file, name: file.name, size: file.size,
  isPdf: file.type === 'application/pdf' || String(file.name).toLowerCase().endsWith('.pdf'),
  previewUrl: file.type.startsWith('image/') || String(file.name).toLowerCase().endsWith('.svg')
    ? URL.createObjectURL(file) : '',
  transforms: { front: { ...DEFAULT_TRANSFORM }, back: { ...DEFAULT_TRANSFORM } },
  opacity: 1,
});

const clampZoom = (v) => Math.min(3.5, Math.max(1, v));

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
const ArtworkNode = ({ artwork, isSelected, onSelect, onChange, activeSide, centerX, centerY, onContextMenu }) => {
  const transform = artwork.transforms[activeSide];
  const [img] = useImage(artwork.previewUrl);
  const shapeRef = useRef(null);
  const trRef    = useRef(null);

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected, img, artwork.isPdf]);

  const absX = centerX + transform.x;
  const absY = centerY + transform.y;

  const handleDragEnd    = (e) => onChange({ ...transform, x: e.target.x() - centerX, y: e.target.y() - centerY });
  const handleTransformEnd = () => {
    const node = shapeRef.current;
    if (!node) return;
    onChange({ 
      ...transform, 
      x: node.x() - centerX, 
      y: node.y() - centerY, 
      scale: node.scaleX(), 
      rotation: node.rotation() 
    });
  };

  const common = {
    ref: shapeRef, x: absX, y: absY,
    scaleX: transform.scale, scaleY: transform.scale,
    rotation: transform.rotation || 0,
    opacity: artwork.opacity ?? 1,
    draggable: true, onClick: onSelect, onTap: onSelect,
    onDragEnd: handleDragEnd, onTransformEnd: handleTransformEnd, onContextMenu,
  };

  return (
    <React.Fragment>
      {artwork.isPdf ? (
        <Group {...common} offsetX={48} offsetY={48}>
          <Rect width={96} height={96} fill="#111" cornerRadius={12}
            stroke="rgba(255,255,255,0.15)" strokeWidth={1}
            shadowColor="black" shadowBlur={12} shadowOpacity={0.3} shadowOffsetY={4} />
          <Text text="PDF" width={96} height={96} fill="white" fontStyle="700" fontSize={13} align="center" verticalAlign="middle" />
        </Group>
      ) : img ? (
        <KonvaImage {...common} image={img} offsetX={img.width / 2} offsetY={img.height / 2} />
      ) : null}

      {isSelected && (
        <Transformer ref={trRef} keepRatio
          enabledAnchors={['top-left','top-right','bottom-left','bottom-right']}
          rotateEnabled rotateAnchorOffset={28}
          borderStroke="rgba(255,255,255,0.9)" borderStrokeWidth={1.5}
          anchorFill="white" anchorStroke="#333" anchorStrokeWidth={1} anchorSize={10} anchorCornerRadius={3}
          boundBoxFunc={(old, n) => (Math.abs(n.width) < 20 || Math.abs(n.height) < 20) ? old : n}
        />
      )}
    </React.Fragment>
  );
};

// ─── MockupCanvas ─────────────────────────────────────────────────────────────
const MockupCanvas = ({
  activeMockup, garmentColor, artworks, activeArtworkId, activeSide,
  updateArtworkTransform, onSelectArtwork,
  stageZoom, stagePan,
  onStagePointerDown, onStagePointerMove, onStagePointerUp, onStageWheel,
  heightClass, emptyLabel, isJeans, onContextMenu,
}) => {
  const containerRef = useRef(null);
  const [dim, setDim] = useState({ width: 0, height: 0 });
  const lastDist = useRef(0);
  const lastCenter = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(([e]) => setDim({ width: e.contentRect.width, height: e.contentRect.height }));
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const handleTouchMove = (e) => {
    if (e.evt.touches.length !== 2) return;
    e.evt.preventDefault();
    const [t1, t2] = [e.evt.touches[0], e.evt.touches[1]];
    const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
    if (!lastCenter.current) { lastCenter.current = true; lastDist.current = dist; return; }
    const factor = dist / lastDist.current;
    if (activeArtworkId) {
      updateArtworkTransform(activeArtworkId, activeSide, (t) => ({
        ...t, scale: Math.max(0.05, t.scale * factor),
      }));
    }
    lastDist.current = dist;
  };
  const handleTouchEnd = () => { lastCenter.current = null; lastDist.current = 0; };
  const checkDeselect  = (e) => { if (e.target === e.target.getStage()) onSelectArtwork(null); };

  const scaleClass = isJeans
    ? 'object-contain scale-[0.85]'
    : 'object-contain object-center scale-[0.95]';

  const maskScaleClass = isJeans ? '' : 'scale-[0.95]';

  return (
    <div ref={containerRef}
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
        <div className="absolute inset-2 sm:inset-3 rounded-xl overflow-hidden isolate" onPointerDown={onStagePointerDown}>
          {/* background */}
          <img src={mockBackground} alt="" aria-hidden
            className="absolute inset-0 h-full w-full object-cover object-center pointer-events-none select-none" draggable={false} />

          {/* greyscale garment */}
          <img src={activeMockup} alt="Garment mockup"
            className={`absolute inset-0 h-full w-full pointer-events-none select-none ${scaleClass}`}
            style={!isJeans ? { filter: 'grayscale(1) contrast(1.32) brightness(1.03)' } : {}}
            draggable={false} />

          {/* color overlay — masked to garment cutout only */}
          {!isJeans && (
            <div className="absolute inset-0 pointer-events-none" style={{ mixBlendMode: 'multiply' }}>
              <div className={`absolute inset-0 ${maskScaleClass}`}
                style={{
                  backgroundColor: garmentColor,
                  WebkitMaskImage: `url("${activeMockup}")`,
                  maskImage: `url("${activeMockup}")`,
                  WebkitMaskSize: 'contain', maskSize: 'contain',
                  WebkitMaskRepeat: 'no-repeat', maskRepeat: 'no-repeat',
                  WebkitMaskPosition: 'center', maskPosition: 'center',
                }} />
            </div>
          )}

          {/* highlight sheen */}
          {!isJeans && (
            <img src={activeMockup} alt="" aria-hidden
              className={`absolute inset-0 h-full w-full pointer-events-none select-none ${scaleClass}`}
              style={{ filter: 'grayscale(1) contrast(1.2) brightness(1.18)', opacity: 0.18, mixBlendMode: 'screen' }}
              draggable={false} />
          )}
        </div>

        {artworks.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <p className="text-xs font-semibold tracking-wide uppercase text-black/35 bg-white/75 px-4 py-2 rounded-full border border-black/10">
              {emptyLabel}
            </p>
          </div>
        )}

        <div className="absolute inset-0 z-20">
          <Stage width={dim.width} height={dim.height}
            onMouseDown={checkDeselect} onTouchStart={checkDeselect}
            onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}
            style={{ position: 'absolute', top: 0, left: 0 }}>
            <Layer>
              {artworks.map((aw) => (
                <ArtworkNode key={aw.id} artwork={aw}
                  isSelected={aw.id === activeArtworkId}
                  onSelect={() => onSelectArtwork(aw.id)}
                  onChange={(t) => updateArtworkTransform(aw.id, activeSide, () => t)}
                  activeSide={activeSide}
                  centerX={dim.width / 2}
                  centerY={dim.height * 0.46}
                  onContextMenu={(e) => onContextMenu && onContextMenu(e, aw.id)}
                />
              ))}
            </Layer>
          </Stage>
        </div>
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
  const activeMockup = MOCK_IMAGE_MAP[mockKey][activeSide];
  const activeArtwork = useMemo(() => artworks.find((a) => a.id === activeArtworkId) || null, [artworks, activeArtworkId]);
  const hasUploads   = artworks.length > 0;

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2600); };

  // ── Preload mockup images ──
  useEffect(() => {
    [...Object.values(MOCK_IMAGE_MAP).flatMap((e) => Object.values(e)), mockBackground]
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

  const removeArtwork = useCallback((id) => {
    setArtworks((p) => { const t = p.find((a) => a.id === id); if (t?.previewUrl) URL.revokeObjectURL(t.previewUrl); return p.filter((a) => a.id !== id); });
  }, []);

  const duplicateArtwork = useCallback((id) => {
    setArtworks((p) => {
      if (p.length >= MAX_UPLOADS) { showToast('Max 5 designs'); return p; }
      const src = p.find((a) => a.id === id); if (!src) return p;
      const copy = { ...src, id: `${id}-copy-${Math.random().toString(36).slice(2,6)}`,
        transforms: {
          front: { ...src.transforms.front, x: src.transforms.front.x + 8, y: src.transforms.front.y + 8 },
          back:  { ...src.transforms.back,  x: src.transforms.back.x  + 8, y: src.transforms.back.y  + 8 },
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

  const upActive = (fn) => { if (!activeArtwork) return; updateArtworkTransform(activeArtwork.id, activeSide, fn); };
  const centerArtwork  = () => upActive((t) => ({ ...t, x: 0, y: 0 }));
  const scaleUp        = () => upActive((t) => ({ ...t, scale: Math.min(4, +(t.scale + 0.05).toFixed(3)) }));
  const scaleDown      = () => upActive((t) => ({ ...t, scale: Math.max(0.05, +(t.scale - 0.05).toFixed(3)) }));
  const rotateCW       = () => upActive((t) => ({ ...t, rotation: ((t.rotation || 0) + 15) % 360 }));
  const rotateCCW      = () => upActive((t) => ({ ...t, rotation: ((t.rotation || 0) - 15 + 360) % 360 }));
  const resetTransform = () => upActive(() => ({ ...DEFAULT_TRANSFORM }));
  const setOpacity     = (id, v) => setArtworks((p) => p.map((a) => a.id !== id ? a : { ...a, opacity: v }));

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
  const resetView = () => { setStageZoom(1); setStagePan({ x: 0, y: 0 }); stopPan(); };

  // ── Shared canvas props ──
  const canvasProps = {
    activeMockup, garmentColor, artworks, activeArtworkId, activeSide,
    updateArtworkTransform, onSelectArtwork: setActiveArtworkId, isJeans,
    onContextMenu: useCallback((e, id) => {
      e.evt.preventDefault();
      setActiveArtworkId(id);
      setContextMenu({ x: e.evt.clientX, y: e.evt.clientY, artworkId: id });
    }, []),
  };

  const garmentName = GARMENT_LABELS[garment];

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
            <button onClick={() => { removeArtwork(contextMenu.artworkId); setContextMenu(null); }} className="text-left px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors flex items-center justify-between">Delete <Icons.Trash /></button>
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
                  ['Designs', `${artworks.length} file${artworks.length !== 1 ? 's' : ''}`],
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

      {/* ── Fullscreen Editor ── */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div className="fixed inset-0 z-[130] bg-black/93 flex flex-col"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* toolbar */}
            <div className="flex items-center justify-between gap-2 px-4 py-3 flex-wrap shrink-0">
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
              {/* garment + side switchers in fullscreen */}
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
              {/* artwork controls */}
              {activeArtwork && (
                <div className="flex items-center gap-2 flex-wrap">
                  <button onClick={centerArtwork}  className="px-3 h-8 rounded-full bg-white/12 text-white text-xs font-bold hover:bg-white/20 transition cursor-pointer">Center</button>
                  <button onClick={rotateCCW}       className="w-8 h-8 rounded-full bg-white/12 text-white flex items-center justify-center hover:bg-white/20 transition cursor-pointer"><Icons.RotateCW /></button>
                  <button onClick={rotateCW}        className="w-8 h-8 rounded-full bg-white/12 text-white flex items-center justify-center hover:bg-white/20 transition cursor-pointer" style={{ transform: 'scaleX(-1)' }}><Icons.RotateCW /></button>
                  <button onClick={scaleDown}       className="px-3 h-8 rounded-full bg-white/12 text-white text-xs font-bold hover:bg-white/20 transition cursor-pointer">−</button>
                  <button onClick={scaleUp}         className="px-3 h-8 rounded-full bg-white/12 text-white text-xs font-bold hover:bg-white/20 transition cursor-pointer">+</button>
                  <button onClick={resetTransform}  className="px-3 h-8 rounded-full bg-white/12 text-white text-xs font-bold hover:bg-white/20 transition cursor-pointer">Reset</button>
                  <div className="w-px h-5 bg-white/15 mx-1" />
                  <div className="flex items-center gap-1.5 px-3 h-8 rounded-full bg-white/12 text-white text-xs font-bold">
                    <Icons.Opacity />
                    <input type="range" min="0.1" max="1" step="0.05"
                      value={activeArtwork.opacity ?? 1}
                      onChange={(e) => setOpacity(activeArtwork.id, parseFloat(e.target.value))}
                      className="w-16 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white" />
                  </div>
                </div>
              )}
            </div>

            {/* canvas area */}
            <div className="flex-1 px-4 pb-4">
              <MockupCanvas {...canvasProps}
                stageZoom={stageZoom} stagePan={stagePan}
                onStagePointerDown={handlePointerDown}
                onStagePointerMove={handlePointerMove}
                onStagePointerUp={stopPan}
                onStageWheel={handleWheel}
                heightClass="h-full"
                emptyLabel="Upload artwork to preview"
              />
            </div>

            <p className="text-center text-white/25 text-[11px] font-medium pb-3 shrink-0">
              Scroll to zoom · Drag to pan · Corner anchors to resize · Esc to exit
            </p>
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
                          : <div className="w-8 h-8 rounded-lg bg-black/25 flex items-center justify-center shrink-0"><span className={`text-[9px] font-black ${isAct ? 'text-white/60' : 'text-black/50'}`}>PDF</span></div>
                        }
                        <div className="flex-1 min-w-0">
                          <p className={`text-[10px] font-black uppercase tracking-wide ${isAct ? 'text-white/45' : 'text-black/35'}`}>Design {i + 1}</p>
                          <p className="text-xs font-bold truncate">{aw.name}</p>
                          <p className={`text-[10px] ${isAct ? 'text-white/40' : 'text-black/35'}`}>{formatFileSize(aw.size)}</p>
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
                        {Math.round((activeArtwork.opacity ?? 1) * 100)}%
                      </span>
                    </div>
                    <input type="range" min={10} max={100} step={5}
                      value={Math.round((activeArtwork.opacity ?? 1) * 100)}
                      onChange={(e) => setOpacity(activeArtwork.id, Number(e.target.value) / 100)}
                      className="w-full accent-black h-1.5 cursor-pointer" />
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
            </div>
          </motion.div>

          {/* ═══ MOBILE LAYOUT ════════════════════════════════════════════ */}
          <motion.div variants={panelIn} className="mt-5 lg:hidden flex flex-col gap-3">

            {/* Garment + side pill row */}
            <div className="flex flex-wrap gap-2">
              {['tshirt','hoodie','jeans'].map((g) => (
                <PillBtn key={g} active={garment === g} onClick={() => setGarment(g)}>{GARMENT_LABELS[g]}</PillBtn>
              ))}
              <div className="ml-auto flex gap-1.5">
                <PillBtn active={activeSide === 'front'} onClick={() => setActiveSide('front')}>Front</PillBtn>
                <PillBtn active={activeSide === 'back'}  onClick={() => setActiveSide('back')}>Back</PillBtn>
              </div>
            </div>
            {isJeans && (
              <div className="flex gap-2">
                <PillBtn active={jeansType === 'default'} onClick={() => setJeansType('default')}>Default</PillBtn>
                <PillBtn active={jeansType === 'blue'} onClick={() => setJeansType('blue')}
                  className={jeansType === 'blue' ? '!bg-blue-700 !text-white' : ''}>Blue Wash</PillBtn>
              </div>
            )}

            {/* Canvas */}
            <div className="rounded-[20px] border border-black/10 bg-[#ececec] p-3 shadow-[0_8px_22px_rgba(0,0,0,0.07)]">
              <div className="flex items-center justify-between mb-2.5">
                <p className="text-xs font-black text-black/60">
                  {garmentName} · {activeSide}{!isJeans ? ` · ${garmentColor.toUpperCase()}` : ''}
                </p>
                <button onClick={() => { resetView(); setIsFullscreen(true); }}
                  className="flex items-center gap-1 px-3 h-8 rounded-xl bg-black text-white text-[11px] font-black cursor-pointer">
                  <Icons.Maximize /> Fullscreen
                </button>
              </div>
              <MockupCanvas {...canvasProps}
                stageZoom={1} stagePan={{ x: 0, y: 0 }}
                onStagePointerDown={() => {}}
                onStagePointerMove={handlePointerMove}
                onStagePointerUp={stopPan}
                onStageWheel={() => {}}
                heightClass="h-[360px] xs:h-[400px] sm:h-[450px]"
                emptyLabel="Upload artwork to preview"
              />
            </div>

            {/* Mobile tabbed panel */}
            <div className="rounded-[20px] border border-black/10 bg-white/85 backdrop-blur-sm shadow-[0_8px_22px_rgba(0,0,0,0.07)] overflow-hidden">
              {/* tab bar */}
              <div className="flex border-b border-black/8">
                {[{ id: 'designs', label: 'Designs' }, { id: 'color', label: 'Color' }, { id: 'adjust', label: 'Adjust' }].map(({ id, label }) => (
                  <button key={id} onClick={() => setMobileTab(id)}
                    className={`flex-1 py-3 text-xs font-black uppercase tracking-[0.1em] transition cursor-pointer
                      ${mobileTab === id ? 'text-black border-b-2 border-black -mb-px bg-white' : 'text-black/38 hover:text-black/65'}`}>
                    {label}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {mobileTab === 'designs' && (
                  <motion.div key="designs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-4">
                    <div
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={handleDrop}
                      onClick={() => inputRef.current?.click()}
                      className={`rounded-xl border-2 border-dashed h-20 flex items-center justify-center gap-3 cursor-pointer transition-all
                        ${dragOver ? 'border-black/50 bg-black/4' : 'border-black/15 bg-black/2 hover:border-black/28'}`}>
                      <div className="text-black/25 scale-75"><Icons.Upload /></div>
                      <div>
                        <p className="text-sm font-bold text-black">Tap to upload</p>
                        <p className="text-[11px] text-black/40">PNG · SVG · JPG · PDF</p>
                      </div>
                    </div>
                    {uploadError && <p className="mt-2 text-xs text-red-600 font-semibold">{uploadError}</p>}

                    <div className="mt-3 flex flex-col gap-1.5 max-h-40 overflow-y-auto">
                      {artworks.length === 0 && (
                        <p className="text-xs text-black/35 text-center py-4">No designs yet</p>
                      )}
                      {artworks.map((aw, i) => {
                        const isAct = aw.id === activeArtworkId;
                        return (
                          <div key={aw.id} onClick={() => setActiveArtworkId(aw.id)}
                            className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 cursor-pointer transition-all
                              ${isAct ? 'border-black bg-black text-white' : 'border-black/10 bg-white'}`}>
                            {aw.previewUrl
                              ? <img src={aw.previewUrl} alt="" className="w-7 h-7 rounded-lg object-cover shrink-0 bg-black/8" />
                              : <div className="w-7 h-7 rounded-lg bg-black/20 flex items-center justify-center shrink-0"><span className="text-[8px] font-black text-white/70">PDF</span></div>
                            }
                            <p className="flex-1 text-xs font-bold truncate">D{i + 1} · {aw.name}</p>
                            <button onClick={(e) => { e.stopPropagation(); duplicateArtwork(aw.id); }}
                              className={`w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer transition ${isAct ? 'text-white/50 hover:text-white' : 'text-black/25 hover:text-black'}`}>
                              <Icons.Copy />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); removeArtwork(aw.id); }}
                              className={`w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer transition ${isAct ? 'text-white/50 hover:text-red-300' : 'text-black/25 hover:text-red-500'}`}>
                              <Icons.Trash />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}

                {mobileTab === 'color' && (
                  <motion.div key="color" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-4">
                    {isJeans ? (
                      <p className="text-xs text-black/40 text-center py-6">Jeans color is fixed — use wash selector above.</p>
                    ) : (
                      <>
                        <div className="grid grid-cols-[1fr_auto_auto] gap-2 items-center">
                          <input type="text" value={colorInput}
                            onChange={(e) => { setColorInput(e.target.value); setColorError(''); }}
                            onBlur={() => commitColor(colorInput.trim())}
                            onKeyDown={(e) => e.key === 'Enter' && commitColor(colorInput.trim())}
                            placeholder="#111111"
                            className="h-9 rounded-xl border border-black/16 bg-white px-3 text-sm font-bold outline-none focus:border-black/45" />
                          <input type="color" value={garmentColor}
                            onChange={(e) => applyPreset(colord(e.target.value).toHex())}
                            className="h-9 w-11 rounded-xl border border-black/16 bg-white p-1 cursor-pointer" />
                          <span className="w-9 h-9 rounded-xl border border-black/10 block" style={{ background: garmentColor }} />
                        </div>
                        {colorError && <p className="mt-1.5 text-xs text-red-600 font-semibold">{colorError}</p>}
                        <div className="mt-3 grid grid-cols-6 gap-2">
                          {COLOR_PRESETS.map(({ hex, label }) => (
                            <button key={hex} type="button" title={label} onClick={() => applyPreset(hex)}
                              className={`aspect-square rounded-xl border-2 transition-all cursor-pointer relative
                                ${garmentColor === hex ? 'border-black scale-105' : 'border-transparent'}`}
                              style={{ background: hex, boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }}>
                              {garmentColor === hex && (
                                <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                  <span className={`text-[9px] font-black ${['#FFFFFF','#D9D9D9'].includes(hex) ? 'text-black' : 'text-white'}`}>✓</span>
                                </span>
                              )}
                            </button>
                          ))}
                        </div>
                        <button onClick={() => applyPreset('#111111')}
                          className="mt-3 text-xs font-bold text-black/35 hover:text-black transition cursor-pointer">
                          Reset to default
                        </button>
                      </>
                    )}
                  </motion.div>
                )}

                {mobileTab === 'adjust' && (
                  <motion.div key="adjust" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="p-4">
                    {!activeArtwork ? (
                      <p className="text-xs text-black/40 text-center py-6">Upload and select a design to adjust it</p>
                    ) : (
                      <>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { label: 'Center',   onClick: centerArtwork,  icon: <Icons.Center /> },
                            { label: 'Scale +',  onClick: scaleUp },
                            { label: 'Scale −',  onClick: scaleDown },
                            { label: '↺ CCW',   onClick: rotateCCW },
                            { label: '↻ CW',    onClick: rotateCW },
                            { label: '↺ Reset', onClick: resetTransform },
                          ].map(({ label, onClick, icon }) => (
                            <CtrlBtn key={label} onClick={onClick} className="text-[11px]">{icon}{label}</CtrlBtn>
                          ))}
                        </div>
                        {artworks.length > 1 && (
                          <div className="mt-2 grid grid-cols-2 gap-2">
                            <CtrlBtn onClick={() => moveLayer(activeArtwork.id, 'up')}><Icons.LayerUp /> Layer ↑</CtrlBtn>
                            <CtrlBtn onClick={() => moveLayer(activeArtwork.id, 'down')}><Icons.LayerDn /> Layer ↓</CtrlBtn>
                          </div>
                        )}
                        <div className="mt-3">
                          <div className="flex justify-between mb-1.5">
                            <p className="text-[11px] font-black uppercase tracking-wide text-black/45">Opacity</p>
                            <span className="text-xs font-bold text-black/55">{Math.round((activeArtwork.opacity ?? 1) * 100)}%</span>
                          </div>
                          <input type="range" min={10} max={100} step={5}
                            value={Math.round((activeArtwork.opacity ?? 1) * 100)}
                            onChange={(e) => setOpacity(activeArtwork.id, Number(e.target.value) / 100)}
                            className="w-full accent-black h-1.5 cursor-pointer" />
                        </div>
                        <button onClick={() => duplicateArtwork(activeArtwork.id)}
                          className="mt-3 w-full h-9 rounded-xl bg-black/6 text-black text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-black/12 transition cursor-pointer">
                          <Icons.Copy /> Duplicate Design
                        </button>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      </main>

      {/* ── Mobile sticky bottom bar ── */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-50 bg-white/92 backdrop-blur-xl border-t border-black/8 px-4 py-3 flex gap-2.5 shadow-[0_-6px_20px_rgba(0,0,0,0.06)]">
        <button onClick={() => inputRef.current?.click()}
          className="flex-1 h-10 rounded-xl bg-black/7 text-black text-xs font-black flex items-center justify-center gap-1.5 hover:bg-black/12 transition cursor-pointer">
          <Icons.Upload /> Upload
        </button>
        <button onClick={() => { resetView(); setIsFullscreen(true); }}
          className="flex-1 h-10 rounded-xl bg-black/7 text-black text-xs font-black flex items-center justify-center gap-1.5 hover:bg-black/12 transition cursor-pointer">
          <Icons.Maximize /> Full Edit
        </button>
        <button disabled={!hasUploads} onClick={() => setShowOrder(true)}
          className={`flex-1 h-10 rounded-xl text-xs font-black transition
            ${hasUploads ? 'bg-black text-white hover:opacity-85 cursor-pointer' : 'bg-black/10 text-black/30 cursor-not-allowed'}`}>
          Order →
        </button>
      </div>

      <Footer />
    </div>
  );
};

export default PrintStudioPage;
