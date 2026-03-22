import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
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
  jeans_default: {
    front: jeansFrontMock,
    back: jeansBackMock,
  },
  jeans_blue: {
    front: jeansFrontBlueMock,
    back: jeansBackBlueMock,
  },
};

const DEFAULT_TRANSFORM = { x: 0, y: 0, scale: 1, rotation: 0 };
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

const ArtworkNode = ({ artwork, isSelected, onSelect, onChange, activeSide, centerX, centerY, onContextMenu }) => {
  const transform = artwork.transforms[activeSide];
  const [img] = useImage(artwork.previewUrl);
  const shapeRef = useRef(null);
  const trRef = useRef(null);

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected, img, artwork.isPdf]);

  const absX = centerX + transform.x;
  const absY = centerY + transform.y;

  const handleDragEnd = (e) => {
    onChange({
      ...transform,
      x: e.target.x() - centerX,
      y: e.target.y() - centerY,
    });
  };

  const handleTransformEnd = (e) => {
    const node = shapeRef.current;
    if (!node) return;
    onChange({
      ...transform,
      x: node.x() - centerX,
      y: node.y() - centerY,
      scale: node.scaleX(),
      rotation: node.rotation(),
    });
  };

  return (
    <React.Fragment>
      {artwork.isPdf ? (
        <Group
          ref={shapeRef}
          x={absX}
          y={absY}
          offsetX={48}
          offsetY={48}
          scaleX={transform.scale}
          scaleY={transform.scale}
          rotation={transform.rotation || 0}
          draggable
          onClick={onSelect}
          onTap={onSelect}
          onDragEnd={handleDragEnd}
          onTransformEnd={handleTransformEnd}
          onContextMenu={onContextMenu}
        >
          <Rect width={96} height={96} fill="black" cornerRadius={12} stroke="rgba(255,255,255,0.2)" strokeWidth={1} shadowColor="black" shadowBlur={10} shadowOpacity={0.25} shadowOffsetY={10} />
          <Text text="PDF" width={96} height={96} fill="white" fontStyle="900" fontSize={12} align="center" verticalAlign="middle" />
        </Group>
      ) : (img && (
        <KonvaImage
          image={img}
          ref={shapeRef}
          x={absX}
          y={absY}
          offsetX={img ? img.width / 2 : 0}
          offsetY={img ? img.height / 2 : 0}
          scaleX={transform.scale}
          scaleY={transform.scale}
          rotation={transform.rotation || 0}
          draggable
          onClick={onSelect}
          onTap={onSelect}
          onDragEnd={handleDragEnd}
          onTransformEnd={handleTransformEnd}
          onContextMenu={onContextMenu}
        />
      ))}
      {isSelected && (
        <Transformer
          ref={trRef}
          boundBoxFunc={(oldBox, newBox) => {
            if (Math.abs(newBox.width) < 10 || Math.abs(newBox.height) < 10) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </React.Fragment>
  );
};

const MockupStage = ({
  activeMockup,
  garmentColor,
  artworks,
  activeArtworkId,
  activeSide,
  updateArtworkTransform,
  onSelectArtwork,
  onStagePointerDown,
  onStagePointerMove,
  onStagePointerUp,
  onStageWheel,
  stageZoom,
  stagePan,
  emptyLabel,
  heightClassName,
  isJeans,
  onContextMenu
}) => {
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const lastCenter = useRef(null);
  const lastDist = useRef(0);

  const handleTouchMove = (e) => {
    if (e.evt.touches.length !== 2) return;
    e.evt.preventDefault();
    const touch1 = e.evt.touches[0];
    const touch2 = e.evt.touches[1];

    if (touch1 && touch2) {
      const dist = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + Math.pow(touch2.clientY - touch1.clientY, 2)
      );

      if (!lastCenter.current) {
        lastCenter.current = {
          x: (touch1.clientX + touch2.clientX) / 2,
          y: (touch1.clientY + touch2.clientY) / 2,
        };
        lastDist.current = dist;
        return;
      }

      const scaleFactor = dist / lastDist.current;
      
      if (activeArtworkId) {
        const artwork = artworks.find(a => a.id === activeArtworkId);
        if (artwork) {
          const transform = artwork.transforms[activeSide];
          updateArtworkTransform(activeArtworkId, activeSide, (t) => ({
            ...t,
            scale: Math.max(0.1, t.scale * scaleFactor)
          }));
        }
      }

      lastDist.current = dist;
    }
  };

  const handleTouchEnd = () => {
    lastCenter.current = null;
    lastDist.current = 0;
  };

  const checkDeselect = (e) => {
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      onSelectArtwork(null);
    }
  };

  return (
    <div
      className={`relative rounded-2xl bg-[#e8e8e8] border border-black/10 overflow-hidden ${heightClassName}`}
      ref={containerRef}
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
        <div className="absolute inset-2 sm:inset-3 rounded-xl overflow-hidden isolate" onPointerDown={onStagePointerDown} >
          <img
            src={mockBackground}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover object-center pointer-events-none select-none"
            draggable={false}
          />
          <img
            src={activeMockup}
            alt="Garment mockup"
            className={`absolute inset-0 h-full w-full pointer-events-none select-none ${isJeans ? 'object-contain scale-[0.85]' : 'object-contain object-center scale-[0.95]'}`}
            style={{ filter: !isJeans ? 'grayscale(1) contrast(1.32) brightness(1.03)' : 'none' }}
            draggable={false}
          />
          {!isJeans && (
            <div
              className={`absolute inset-0 pointer-events-none h-full w-full object-contain object-center scale-[0.95]`}
              style={{
                backgroundColor: garmentColor,
                WebkitMaskImage: `url("${activeMockup}")`,
                maskImage: `url("${activeMockup}")`,
                WebkitMaskSize: 'contain',
                maskSize: 'contain',
                WebkitMaskRepeat: 'no-repeat',
                maskRepeat: 'no-repeat',
                WebkitMaskPosition: 'center',
                maskPosition: 'center',
                mixBlendMode: 'multiply',
              }}
            />
          )}
          {!isJeans && (
            <img
              src={activeMockup}
              alt=""
              aria-hidden="true"
              className={`absolute inset-0 h-full w-full pointer-events-none select-none object-contain object-center scale-[0.95]`}
              style={{ filter: 'grayscale(1) contrast(1.2) brightness(1.18)', opacity: 0.18, mixBlendMode: 'screen' }}
              draggable={false}
            />
          )}
        </div>

        {artworks.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <p className="text-xs font-semibold tracking-wide uppercase text-black/35 bg-white/70 px-3 py-1.5 rounded-full border border-black/10">
              {emptyLabel}
            </p>
          </div>
        )}

        <div className="absolute inset-0 z-20">
          <Stage
            width={dimensions.width}
            height={dimensions.height}
            onMouseDown={checkDeselect}
            onTouchStart={checkDeselect}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{ position: 'absolute', top: 0, left: 0 }}
          >
            <Layer>
              {artworks.map((artwork) => {
                return (
                  <ArtworkNode
                    key={artwork.id}
                    artwork={artwork}
                    isSelected={artwork.id === activeArtworkId}
                    onSelect={() => onSelectArtwork(artwork.id)}
                    onChange={(newProps) => updateArtworkTransform(artwork.id, activeSide, () => newProps)}
                    activeSide={activeSide}
                    centerX={dimensions.width / 2}
                    centerY={dimensions.height * 0.46}
                    onContextMenu={(e) => onContextMenu && onContextMenu(e, artwork.id)}
                  />
                );
              })}
            </Layer>
          </Stage>
        </div>
      </div>
    </div>
  );
};

const PrintStudioPage = () => {
  const location = useLocation();
  const { consumeFile } = usePrintContext();
  const inputRef = useRef(null);
  const routeFileHydratedRef = useRef(false);
  const artworksRef = useRef([]);
  const [garment, setGarment] = useState('tshirt');
  const [jeansType, setJeansType] = useState('default');
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
  const [contextMenu, setContextMenu] = useState(null);

  const isJeans = garment === 'jeans';
  const activeMockupKey = isJeans ? (jeansType === 'default' ? 'jeans_default' : 'jeans_blue') : garment;
  const activeMockup = MOCK_IMAGE_MAP[activeMockupKey][activeSide];
  const activeArtwork = useMemo(
    () => artworks.find((artwork) => artwork.id === activeArtworkId) || artworks[0] || null,
    [artworks, activeArtworkId]
  );

  useEffect(() => {
    const mockups = [...Object.values(MOCK_IMAGE_MAP).flatMap((entry) => Object.values(entry)), mockBackground];
    mockups.forEach((src) => {
      const image = new Image();
      image.src = src;
    });
  }, []);

  useEffect(() => {
    if (routeFileHydratedRef.current) return;
    routeFileHydratedRef.current = true;

    // Prefer file from context (works on Vercel / all hosts)
    const contextFile = consumeFile();
    const fileToLoad = contextFile instanceof File
      ? contextFile
      : (location.state?.uploadedFile instanceof File ? location.state.uploadedFile : null);

    if (fileToLoad) {
      const nextArtwork = createArtworkEntry(fileToLoad);
      setArtworks([nextArtwork]);
      setActiveArtworkId(nextArtwork.id);
      setError('');
    }
  }, []);

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

  useEffect(() => {
    const handleGlobalClick = () => setContextMenu(null);
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

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

  const handleStagePointerMove = (e) => {
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

  const handleStageContextMenu = useCallback((e, artworkId) => {
    e.evt.preventDefault();
    setActiveArtworkId(artworkId);
    setContextMenu({ 
      x: e.evt.clientX, 
      y: e.evt.clientY, 
      artworkId 
    });
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#f5f5f5] overflow-x-hidden">

      {/* ── Context Menu ── */}
      {contextMenu && (
        <div
          className="fixed z-[300] bg-white rounded-xl shadow-2xl border border-black/10 py-1.5 w-40 flex flex-col overflow-hidden"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
          onContextMenu={(e) => e.preventDefault()}
        >
          <button onClick={() => { removeArtwork(contextMenu.artworkId); setContextMenu(null); }} className="text-left px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors flex items-center justify-between">
            Delete Artwork
          </button>
        </div>
      )}

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
                <button
                  type="button"
                  onClick={() => setGarment('jeans')}
                  className={`px-4 h-10 rounded-full text-sm font-bold transition-colors cursor-pointer ${
                    garment === 'jeans' ? 'bg-black text-white' : 'bg-black/10 text-black hover:bg-black/20'
                  }`}
                >
                  Jeans
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
                  <p className="mt-1 text-xs text-black/50">Now editing: {garment === 'hoodie' ? 'Hoodie' : garment === 'jeans' ? 'Jeans' : 'T-Shirt'} {activeSide}</p>
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
                  updateArtworkTransform={updateArtworkTransform}
                  onSelectArtwork={setActiveArtworkId}
                  onStagePointerDown={() => {}}
                  onStagePointerMove={handleStagePointerMove}
                  onStagePointerUp={stopPointerInteractions}
                  onStageWheel={() => {}}
                  stageZoom={1}
                  stagePan={{ x: 0, y: 0 }}
                  emptyLabel="Upload artwork to preview"
                  heightClassName="h-[540px] sm:h-[580px]"
                  isJeans={isJeans}
                  onContextMenu={handleStageContextMenu}
                />
              </div>

              <div className="mt-4">
                {isJeans ? (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-black/55">Jeans Wash</p>
                    <div className="mt-3 flex gap-4">
                       <button onClick={() => setJeansType('default')} className={`px-4 h-10 rounded-full text-sm font-bold transition-colors cursor-pointer ${jeansType === 'default' ? 'bg-black text-white' : 'bg-black/10 text-black hover:bg-black/20'}`}>Default</button>
                       <button onClick={() => setJeansType('blue')} className={`px-4 h-10 rounded-full text-sm font-bold transition-colors cursor-pointer ${jeansType === 'blue' ? 'bg-blue-600 text-white' : 'bg-blue-600/10 text-blue-600 hover:bg-blue-600/20'}`}>Blue Wash</button>
                    </div>
                  </div>
                ) : (
                  <>
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
                  </>
                )}
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
              updateArtworkTransform={updateArtworkTransform}
              onSelectArtwork={setActiveArtworkId}
              onStagePointerDown={handleStagePointerDown}
              onStagePointerMove={handleStagePointerMove}
              onStagePointerUp={stopPointerInteractions}
              onStageWheel={handleStageWheel}
              stageZoom={stageZoom}
              stagePan={stagePan}
              emptyLabel="Upload artwork to preview"
              heightClassName="h-[78vh]"
              isJeans={isJeans}
              onContextMenu={handleStageContextMenu}
            />
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default PrintStudioPage;
