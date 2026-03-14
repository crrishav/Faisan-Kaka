import React, { useEffect, useRef, useState } from 'react';
import './DeliverySection.css';
import indiaMap from '../assets/in.svg';

const DeliverySection = () => {
  const sectionRef = useRef(null);
  const svgRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [svgLoaded, setSvgLoaded] = useState(false);
  const mapDataRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        } else {
          setIsVisible(false);
          setSvgLoaded(false);
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -10% 0px' }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Load and inject SVG
  useEffect(() => {
    if (isVisible && svgRef.current) {
      const injectSVG = (svgContent) => {
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
        const svgElement = svgDoc.querySelector('svg');
        
        if (svgElement && svgRef.current) {
          svgElement.classList.add('india-map-svg');
          svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet');
          svgElement.removeAttribute('width');
          svgElement.removeAttribute('height');
          
          svgRef.current.innerHTML = '';
          svgRef.current.appendChild(svgElement);
          
          // Use requestAnimationFrame for smoother timing
          requestAnimationFrame(() => {
            const paths = svgRef.current.querySelectorAll('path');
            paths.forEach((path, index) => {
              path.classList.add('map-path');
              path.style.animationDelay = `${index * 0.015}s`;
            });
            
            // Minimal delay to ensure browser processed the classes
            setTimeout(() => setSvgLoaded(true), 50);
          });
        }
      };

      if (mapDataRef.current) {
        injectSVG(mapDataRef.current);
      } else {
        fetch(indiaMap)
          .then(response => response.text())
          .then(svgContent => {
            mapDataRef.current = svgContent;
            injectSVG(svgContent);
          })
          .catch(error => console.error('Error loading SVG:', error));
      }
    }
  }, [isVisible]);

  return (
    <section 
      ref={sectionRef} 
      className={`delivery-section ${isVisible ? 'visible' : ''} ${svgLoaded ? 'svg-loaded' : ''}`}
    >
      <div className="delivery-container">
        <h2 className="delivery-title">Delivery All Across India</h2>
        <div className="map-wrapper">
          <div 
            ref={svgRef} 
            className="svg-container"
            aria-label="Map of India showing delivery coverage"
          />
        </div>
      </div>
    </section>
  );
};

export default DeliverySection;
