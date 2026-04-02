import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import './DeliverySection.css';
import indiaMap from '../assets/in.svg';

/* ─── Shared variants ──────────────────────────────────────────── */

const sectionVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5, ease: 'easeOut' } },
};

const textContainerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.11, delayChildren: 0.2 } },
};

const textItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};

const mapWrapperVariants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: 0.05 },
  },
};

const tooltipVariants = {
  hidden: { opacity: 0, y: 6, scale: 0.92 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    y: 4,
    scale: 0.94,
    transition: { duration: 0.12, ease: 'easeIn' },
  },
};

/* ─── Component ────────────────────────────────────────────────── */

const DeliverySection = () => {
  const sectionRef = useRef(null);
  const mapDataRef = useRef(null);
  const svgContainerRef = useRef(null);

  const [svgElements, setSvgElements] = useState([]);
  const [svgViewBox, setSvgViewBox] = useState('0 0 1000 1000');
  const [tooltip, setTooltip] = useState({ visible: false, name: '', x: 0, y: 0 });

  const isInView = useInView(sectionRef, { amount: 0.15, once: false });

  /* Parse SVG text → array of { tag, attrs, id, name, revealOrder } */
  const parseSVG = useCallback((svgContent) => {
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
    const svgEl = svgDoc.querySelector('svg');
    if (!svgEl) return;

    const vb =
      svgEl.getAttribute('viewbox') ||
      svgEl.getAttribute('viewBox') ||
      '0 0 1000 1000';
    setSvgViewBox(vb);

    const els = Array.from(svgEl.querySelectorAll('path, circle'));
    const parsed = els.map((el, i) => {
      const attrs = {};
      for (const a of el.attributes) attrs[a.name] = a.value;
      // name comes from `name` attr on paths, or `class` attr on circles
      const stateName = attrs.name || attrs.class || '';
      return {
        tag: el.tagName.toLowerCase(),
        attrs,
        id: attrs.id || `el-${i}`,
        stateName,
        index: i,
      };
    });

    const shuffled = parsed
      .map((el) => ({ el, sort: el.index + (Math.random() - 0.5) * 6 }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ el }, revealOrder) => ({ ...el, revealOrder }));

    setSvgElements(shuffled);
  }, []);

  useEffect(() => {
    if (mapDataRef.current) { parseSVG(mapDataRef.current); return; }
    fetch(indiaMap)
      .then((r) => r.text())
      .then((content) => { mapDataRef.current = content; parseSVG(content); })
      .catch((err) => console.error('SVG load error:', err));
  }, [parseSVG]);

  /* Convert SVG-space coords to container-relative px */
  const handleMouseMove = useCallback((e, stateName) => {
    if (!svgContainerRef.current) return;
    const rect = svgContainerRef.current.getBoundingClientRect();
    setTooltip({
      visible: true,
      name: stateName,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTooltip((t) => ({ ...t, visible: false }));
  }, []);

  /* Per-state variants — delay based on revealOrder */
  const stateVariants = (revealOrder) => ({
    hidden: { opacity: 0, scale: 0.92 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        delay: 0.35 + revealOrder * 0.016,
        duration: 0.38,
        ease: [0.34, 1.3, 0.64, 1],
      },
    },
  });

  return (
    <motion.section
      ref={sectionRef}
      className="delivery-section"
      variants={sectionVariants}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
    >
      <div className="delivery-container">

        {/* ── Text column ── */}
        <motion.div
          className="delivery-text"
          variants={textContainerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
        >
          <motion.p className="delivery-eyebrow" variants={textItemVariants}>
            Pan‑India Reach
          </motion.p>
          <motion.h2 className="delivery-title" variants={textItemVariants}>
            Delivery<br />All Across<br />India
          </motion.h2>
          <motion.p className="delivery-sub" variants={textItemVariants}>
            From Leh to Kanyakumari —<br />every pin code, covered.
          </motion.p>
          <motion.div className="delivery-badge" variants={textItemVariants}>
            <span className="badge-dot" />
            28 states · 8 union territories
          </motion.div>
        </motion.div>

        {/* ── Map column ── */}
        <motion.div
          className="map-wrapper"
          variants={mapWrapperVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
        >
          <div
            ref={svgContainerRef}
            className="svg-container"
            aria-label="Map of India showing delivery coverage"
          >
            {svgElements.length > 0 && (
              <svg
                className="india-map-svg"
                viewBox={svgViewBox}
                preserveAspectRatio="xMidYMid meet"
                xmlns="http://www.w3.org/2000/svg"
              >
                {svgElements.map(({ tag, attrs, id, stateName, revealOrder }) => {
                  const variants = stateVariants(revealOrder);
                  const elementKey = `${tag}-${id}-${revealOrder}`;

                  const sharedProps = {
                    className: 'map-state',
                    variants,
                    initial: 'hidden',
                    animate: isInView ? 'visible' : 'hidden',
                    whileHover: {
                      fill: '#1d4ed8',
                      filter: 'drop-shadow(0 2px 6px rgba(29,78,216,0.45))',
                      scale: 1.022,
                      transition: { duration: 0.15 },
                    },
                    style: { originX: '50%', originY: '50%', cursor: 'pointer' },
                    onMouseMove: stateName ? (e) => handleMouseMove(e, stateName) : undefined,
                    onMouseLeave: stateName ? handleMouseLeave : undefined,
                  };

                  return tag === 'circle' ? (
                    <motion.circle
                      key={elementKey}
                      {...sharedProps}
                      cx={attrs.cx}
                      cy={attrs.cy}
                      r={attrs.r || 4}
                    />
                  ) : (
                    <motion.path
                      key={elementKey}
                      {...sharedProps}
                      d={attrs.d}
                    />
                  );
                })}
              </svg>
            )}

            {/* ── Tooltip ── */}
            <AnimatePresence>
              {tooltip.visible && tooltip.name && (
                <motion.div
                  className="map-tooltip"
                  key="tooltip"
                  variants={tooltipVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  style={{
                    left: tooltip.x,
                    top: tooltip.y,
                  }}
                >
                  <span className="map-tooltip-dot" />
                  {tooltip.name}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

      </div>
    </motion.section>
  );
};

export default DeliverySection;
