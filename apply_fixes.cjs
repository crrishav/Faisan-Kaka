const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'Pages', 'PrintStudioPage.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add Delete / Backspace listener to the useEffect that already adds global listeners
const globalClickEffect = `  useEffect(() => {
    const handleGlobalClick = () => setContextMenu(null);
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);`;

const keydownEffect = `  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if ((e.key === 'Backspace' || e.key === 'Delete') && activeArtworkId) {
        removeArtwork(activeArtworkId);
        showToast('Design deleted');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeArtworkId, removeArtwork]);`;

content = content.replace(globalClickEffect, globalClickEffect + '\\n\\n' + keydownEffect);

// 2. Add Mobile Toolbar to Fullscreen Editor
const desktopToolbarStart = `{/* desktop toolbar */}`;
const mobileToolbar = `            {/* ── Mobile fullscreen toolbar ── */}
            <div className="flex lg:hidden items-center justify-between gap-2 px-3 py-3 border-b border-white/10 shrink-0 bg-black">
              <div className="flex items-center gap-2">
                <button onClick={() => { setIsFullscreen(false); stopPan(); }}
                  className="w-9 h-9 rounded-full bg-white/10 text-white flex items-center justify-center active:scale-95 transition">
                  <Icons.X />
                </button>
                {activeArtworkOnThisSide && (
                  <>
                    <button onClick={scaleDown} className="px-3 h-9 rounded-full bg-white/10 text-white text-xs font-bold active:bg-white/20 transition">−</button>
                    <button onClick={scaleUp} className="px-3 h-9 rounded-full bg-white/10 text-white text-xs font-bold active:bg-white/20 transition">+</button>
                  </>
                )}
              </div>
              {activeArtworkOnThisSide && (
                <div className="flex items-center gap-2">
                  <button onClick={centerArtwork} className="px-3 h-9 rounded-full bg-white/10 text-white text-xs font-bold active:bg-white/20 transition">Center</button>
                  <button onClick={() => { removeArtwork(activeArtworkOnThisSide.id); showToast('Deleted'); }}
                    className="w-9 h-9 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center active:bg-red-500/40 transition">
                    <Icons.Trash />
                  </button>
                </div>
              )}
            </div>

            `;

content = content.replace(desktopToolbarStart, mobileToolbar + desktopToolbarStart);

// 3. Update the fullscreen MockupCanvas to ONLY trigger stage zooming on desktop.
// On mobile, onStagePinch is undefined so the artwork scales.
const oldCanvasCall = `              <MockupCanvas {...canvasProps}
                stageZoom={stageZoom} stagePan={stagePan}
                onStagePointerDown={handlePointerDown}
                onStagePointerMove={handlePointerMove}
                onStagePointerUp={stopPan}
                onStageWheel={handleWheel}
                onStagePinch={handleStagePinch}
                heightClass="h-full"`;

const newCanvasCall = `              <MockupCanvas {...canvasProps}
                stageZoom={stageZoom} stagePan={stagePan}
                onStagePointerDown={handlePointerDown}
                onStagePointerMove={handlePointerMove}
                onStagePointerUp={stopPan}
                onStageWheel={handleWheel}
                // Only pass handleStagePinch on desktop. On mobile, let pinch zoom the design!
                onStagePinch={typeof window !== 'undefined' && window.innerWidth >= 1024 ? handleStagePinch : undefined}
                heightClass="h-full"`;

content = content.replace(oldCanvasCall, newCanvasCall);

// 4. Improve the pinch logic in MockupCanvas to ensure it works smoothly
const oldPinch = `    if (onStagePinch) {
      onStagePinch(factor);
    } else if (activeArtworkId) {
      updateArtworkTransform(activeArtworkId, activeSide, (t) => ({
        ...t, scale: Math.max(0.05, t.scale * factor),
      }));
    }`;

const newPinch = `    if (onStagePinch) {
      onStagePinch(factor);
    } else if (activeArtworkId) {
      updateArtworkTransform(activeArtworkId, activeSide, (t) => {
        // dampen the factor slightly so pinch to zoom is more controlled
        const dampedFactor = 1 + (factor - 1) * 0.6;
        return { ...t, scale: Math.max(0.05, t.scale * dampedFactor) };
      });
    }`;

content = content.replace(oldPinch, newPinch);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Update successful!');
