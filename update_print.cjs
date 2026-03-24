const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'Pages', 'PrintStudioPage.jsx');
let content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

const newMobileLayout = `          {/* ═══ MOBILE LAYOUT (APP-LIKE) ═════════════════════════════════ */}
          <motion.div variants={panelIn} className="mt-4 lg:hidden flex flex-col">
            {/* Minimal Top Nav */}
            <div className="flex flex-col gap-2.5 mb-2">
              <div className="flex items-center justify-between">
                <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                  {['tshirt','hoodie','jeans'].map((g) => (
                    <button key={g} onClick={() => setGarment(g)} 
                      className={\`shrink-0 px-3.5 h-8 rounded-full text-xs font-bold transition-all \${garment === g ? 'bg-black text-white shadow-md' : 'bg-black/5 text-black hover:bg-black/10'}\`}>
                      {GARMENT_LABELS[g]}
                    </button>
                  ))}
                </div>
                <div className="flex gap-1 bg-black/5 p-1 rounded-full shrink-0">
                  {['front','back'].map((s) => (
                    <button key={s} onClick={() => setActiveSide(s)} 
                      className={\`px-3 h-6 rounded-full text-[10px] uppercase tracking-wide font-black transition-all \${activeSide === s ? 'bg-white text-black shadow-sm' : 'text-black/40'}\`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              {isJeans && (
                <div className="flex gap-1.5 animate-in fade-in slide-in-from-top-1">
                  <PillBtn active={jeansType === 'default'} onClick={() => setJeansType('default')} className="h-7 text-[11px] px-3">Default</PillBtn>
                  <PillBtn active={jeansType === 'blue'} onClick={() => setJeansType('blue')} className={\`h-7 text-[11px] px-3 \${jeansType === 'blue' ? '!bg-blue-700 !text-white' : ''}\`}>Blue Wash</PillBtn>
                </div>
              )}
            </div>

            {/* Canvas container: Maximized height */}
            <div className="rounded-[24px] shadow-[0_12px_32px_rgba(0,0,0,0.08)] bg-[#ececec] border border-black/10 overflow-hidden relative isolate">
              
              {/* Top tools on canvas */}
              <div className="absolute top-3 right-3 z-[40] flex gap-2">
                {activeArtworkOnThisSide && (
                  <button onClick={() => { removeArtworkFromSide(activeArtworkOnThisSide.id, activeSide); showToast(\`Removed from \${activeSide}\`); }} 
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
            className={\`flex-1 h-full rounded-2xl flex flex-col items-center justify-center transition-all \${mobileTab === 'designs' ? 'bg-black text-white shadow-lg scale-105' : 'bg-black/4 text-black/50 hover:bg-black/8 hover:text-black active:scale-95'}\`}>
            {artworks.length > 0 && mobileTab !== 'designs' && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
            )}
            <Icons.Upload />
            <span className="text-[9px] font-black mt-1">Design</span>
          </button>
          
          {!isJeans && (
            <button onClick={() => setMobileTab('color')}
              className={\`flex-1 h-full rounded-2xl flex flex-col items-center justify-center transition-all \${mobileTab === 'color' ? 'bg-black text-white shadow-lg scale-105' : 'bg-black/4 text-black/50 hover:bg-black/8 hover:text-black active:scale-95'}\`}>
              <div className="w-[14px] h-[14px] rounded-sm ring-1 ring-black/20" style={{ background: garmentColor }} />
              <span className="text-[9px] font-black mt-1">Color</span>
            </button>
          )}

          <button onClick={() => setMobileTab('adjust')}
            className={\`flex-1 h-full rounded-2xl flex flex-col items-center justify-center transition-all \${mobileTab === 'adjust' ? 'bg-black text-white shadow-lg scale-105' : 'bg-black/4 text-black/50 hover:bg-black/8 hover:text-black active:scale-95'}\`}>
            <Icons.Center />
            <span className="text-[9px] font-black mt-1">Adjust</span>
          </button>

          <button onClick={() => setMobileTab('layers')}
            className={\`flex-1 h-full rounded-2xl flex flex-col items-center justify-center transition-all \${mobileTab === 'layers' ? 'bg-black text-white shadow-lg scale-105' : 'bg-black/4 text-black/50 hover:bg-black/8 hover:text-black active:scale-95'}\`}>
            <Icons.LayerDn />
            <span className="text-[9px] font-black mt-1">Layers</span>
          </button>

          <button disabled={!hasUploads} onClick={() => setShowOrder(true)}
            className={\`flex-[1.5] h-full rounded-2xl flex flex-col items-center justify-center transition-all shadow-md \${hasUploads ? 'bg-[#ff3b30] text-white active:scale-95 hover:bg-[#ff2b20]' : 'bg-black/10 text-black/30 cursor-not-allowed'}\`}>
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
                      className={\`rounded-2xl border-2 border-dashed h-20 flex items-center justify-center gap-4 cursor-pointer transition-all active:scale-[0.98]
                        \${dragOver ? 'border-black/50 bg-black/4' : 'border-black/15 bg-black/2'}\`}>
                      <div className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center text-black/40"><Icons.Upload /></div>
                      <div>
                        <p className="text-sm font-bold text-black leading-tight">Upload new design</p>
                        <p className="text-[10px] text-black/40 mt-0.5">PNG · SVG · JPG · PDF</p>
                      </div>
                      <span className="ml-auto mr-1 text-xs font-black bg-black/10 px-2 py-0.5 rounded-md text-black/50">{artworks.length}/{MAX_UPLOADS}</span>
                    </div>
                    {uploadError && <p className="text-xs text-red-600 font-semibold">{uploadError}</p>}

                    <div className="flex flex-col gap-2">
                      {artworks.length === 0 && <p className="text-xs text-black/35 text-center py-5">No designs yet</p>}
                      {artworks.map((aw, i) => {
                        const isAct = aw.id === activeArtworkId;
                        const onFront = !aw.visible || aw.visible.front !== false;
                        const onBack  = !aw.visible || aw.visible.back  !== false;
                        return (
                          <div key={aw.id} onClick={() => setActiveArtworkId(aw.id)}
                            className={\`flex items-center gap-3 rounded-2xl border p-2 cursor-pointer transition-all active:scale-[0.99]
                              \${isAct ? 'border-black shadow-md bg-white' : 'border-black/5 bg-black/[0.02]'}\`}>
                            {aw.previewUrl
                              ? <img src={aw.previewUrl} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0 border border-black/5 shadow-sm" />
                              : <div className="w-12 h-12 rounded-xl shrink-0 flex items-center justify-center bg-black/10"><span className="text-[10px] font-black text-black/40">PDF</span></div>
                            }
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold truncate text-black">{aw.name}</p>
                              <div className="flex gap-1.5 mt-1.5">
                                {[['Front', onFront], ['Back', onBack]].map(([label, active]) => (
                                  <span key={label} className={\`text-[9px] font-black uppercase tracking-wide px-1.5 py-0.5 rounded
                                    \${active ? 'bg-black/10 text-black/70' : 'bg-black/4 text-black/20 line-through'}\`}>
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
                              <button onClick={(e) => { e.stopPropagation(); removeArtworkFromSide(aw.id, activeSide); showToast(\`Removed from \${activeSide}\`); }}
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
                          className={\`aspect-square w-full rounded-2xl border-2 transition-all active:scale-90 relative
                            \${garmentColor === hex ? 'border-black scale-105 shadow-md' : 'border-black/5 shadow-sm'}\`}
                          style={{ background: hex }}>
                          {garmentColor === hex && (
                            <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <span className={\`text-xs font-black \${['#FFFFFF','#D9D9D9'].includes(hex) ? 'text-black' : 'text-white'}\`}>✓</span>
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
                            <span className="text-xs font-black bg-white px-2 py-0.5 rounded-md shadow-sm">{Math.round((activeArtworkOnThisSide.opacity ?? 1) * 100)}%</span>
                          </div>
                          <input type="range" min={10} max={100} step={5}
                            value={Math.round((activeArtworkOnThisSide.opacity ?? 1) * 100)}
                            onChange={(e) => setOpacity(activeArtworkOnThisSide.id, Number(e.target.value) / 100)}
                            className="w-full accent-black h-2.5 cursor-pointer rounded-full bg-black/10" />
                        </div>
                        
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
                              className={\`flex items-center gap-3 p-2 rounded-2xl border cursor-pointer transition-all active:scale-[0.99]
                                \${isAct ? 'bg-black border-black shadow-lg text-white' : onThisSide ? 'bg-white border-black/10' : 'bg-black/4 border-black/5 opacity-60'}\`}>
                              {aw.previewUrl
                                ? <img src={aw.previewUrl} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0 bg-white/10" />
                                : <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-black/20"><span className="text-[10px] font-black">PDF</span></div>
                              }
                              <p className={\`flex-1 text-sm font-bold truncate \${isAct ? 'text-white' : 'text-black'}\`}>{aw.name}</p>
                              
                              <button onClick={(e) => {
                                  e.stopPropagation();
                                  if (!onThisSide) {
                                    setArtworks((p) => p.map((a) => a.id !== aw.id ? a : { ...a, visible: { ...a.visible, [activeSide]: true } }));
                                  } else {
                                    removeArtworkFromSide(aw.id, activeSide);
                                  }
                                }}
                                className={\`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black transition active:scale-90
                                  \${isAct ? 'bg-white/15 hover:bg-white/25 text-white' : 'bg-black/5 hover:bg-black/10 text-black/40'}\`}>
                                {onThisSide ? 'ON' : 'OFF'}
                              </button>
                              
                              <div className="flex flex-col gap-1 pr-1">
                                <button onClick={(e) => { e.stopPropagation(); moveLayer(aw.id, 'up'); }} disabled={realIdx === artworks.length - 1}
                                  className={\`w-8 h-5 rounded-md flex items-center justify-center transition active:bg-black/10 disabled:opacity-20
                                    \${isAct ? 'bg-white/10' : 'bg-black/5'}\`}><Icons.LayerUp /></button>
                                <button onClick={(e) => { e.stopPropagation(); moveLayer(aw.id, 'down'); }} disabled={realIdx === 0}
                                  className={\`w-8 h-5 rounded-md flex items-center justify-center transition active:bg-black/10 disabled:opacity-20
                                    \${isAct ? 'bg-white/10' : 'bg-black/5'}\`}><Icons.LayerDn /></button>
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
`;

content = content.replace(
  /\{\/\* ═══ MOBILE LAYOUT ════════════════════════════════════════════ \*\/\}([\s\S]*?)\{\/\* ── Mobile sticky bottom bar ── \*\/\}([\s\S]*?)<\/div>\s*<Footer \/>/g,
  newMobileLayout + '\\n\\n      <Footer />'
);

// Apply recolor accurate fix: Remove transform from inline, add scaleClass to class string.
content = content.replace(
  /className="absolute inset-0 pointer-events-none"\\n\\s*style={maskStyle}/g,
  'className={`absolute inset-0 pointer-events-none \${scaleClass}`}\\n              style={maskStyle}'
);

content = content.replace(
  /mixBlendMode: 'multiply',\\n\\s*transform: 'scale\\(0\\.95\\)',\\n\\s*transformOrigin: 'center center',/g,
  "mixBlendMode: 'multiply',"
);

fs.writeFileSync(filePath, content, 'utf8');
console.log("Rewrite complete.");
