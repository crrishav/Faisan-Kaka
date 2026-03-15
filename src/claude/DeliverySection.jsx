import React, { useEffect, useRef, useState } from 'react';
import './DeliverySection.css';
import indiaMap from '../assets/in.svg';

const DeliverySection = () => {
  const sectionRef = useRef(null);
  const svgRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [svgLoaded, setSvgLoaded] = useState(false);
  const mapDataRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        } else {
          setIsVisible(false);
          setSvgLoaded(false);
          // Reset all path animations when section leaves view
          if (svgRef.current) {
            const paths = svgRef.current.querySelectorAll('path, circle');
            paths.forEach(el => {
              el.classList.remove('map-path--revealed');
            });
          }
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -5% 0px' }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  // Load and inject SVG inline
  useEffect(() => {
    if (!isVisible || !svgRef.current) return;

    const injectSVG = (svgContent) => {
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
      const svgElement = svgDoc.querySelector('svg');
      if (!svgElement || !svgRef.current) return;

      // Clean up SVG attributes
      svgElement.removeAttribute('width');
      svgElement.removeAttribute('height');
      svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet');
      svgElement.classList.add('india-map-svg');

      svgRef.current.innerHTML = '';
      svgRef.current.appendChild(svgElement);

      // Grab all paths and circles
      const elements = Array.from(svgRef.current.querySelectorAll('path, circle'));
      elements.forEach(el => {
        el.classList.add('map-el');
      });

      // Stagger-reveal each state sequentially using JS timeouts
      // This gives precise control over the wave animation
      requestAnimationFrame(() => {
        setSvgLoaded(true);

        // Shuffle elements slightly to simulate a "spreading" reveal
        const shuffled = [...elements].sort(() => Math.random() * 0.4 - 0.2);

        shuffled.forEach((el, i) => {
          const delay = 80 + i * 22; // ~22ms between each state
          setTimeout(() => {
            el.classList.add('map-el--revealed');
          }, delay);
        });
      });
    };

    if (mapDataRef.current) {
      injectSVG(mapDataRef.current);
    } else {
      fetch(indiaMap)
        .then(r => r.text())
        .then(svgContent => {
          mapDataRef.current = svgContent;
          injectSVG(svgContent);
        })
        .catch(err => console.error('SVG load error:', err));
    }
  }, [isVisible]);

  return (
    <section
      ref={sectionRef}
      className={`delivery-section ${isVisible ? 'delivery-section--visible' : ''} ${svgLoaded ? 'delivery-section--loaded' : ''}`}
    >
      <div className="delivery-container">
        <div className="delivery-text">
          <p className="delivery-eyebrow">Pan-India Reach</p>
          <h2 className="delivery-title">We Deliver<br />Everywhere</h2>
          <p className="delivery-sub">From Leh to Kanyakumari, every pin code covered.</p>
        </div>
        <div className="map-wrapper">
          <div
            ref={svgRef}
            className="svg-container"
            aria-label="Map of India showing delivery coverage"
          />
          {!svgLoaded && isVisible && (
            <div className="map-placeholder" aria-hidden="true" />
          )}
        </div>
      </div>
    </section>
  );
};

export default DeliverySection;
