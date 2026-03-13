import React, { useEffect, useRef, useState } from 'react';
import './DeliverySection.css';
import indiaMap from '../assets/in.svg';

const DeliverySection = () => {
  const sectionRef = useRef(null);
  const svgRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [svgLoaded, setSvgLoaded] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Load and inject SVG for animation
  useEffect(() => {
    if (isVisible && svgRef.current) {
      fetch(indiaMap)
        .then(response => response.text())
        .then(svgContent => {
          // Parse the SVG and inject it
          const parser = new DOMParser();
          const svgDoc = parser.parseFromString(svgContent, 'image/svg+xml');
          const svgElement = svgDoc.querySelector('svg');
          
          if (svgElement && svgRef.current) {
            // Add classes for styling and animation
            svgElement.classList.add('india-map-svg');
            svgElement.setAttribute('preserveAspectRatio', 'xMidYMid meet');
            svgElement.setAttribute('viewBox', '0 0 1000 1000');
            
            // Clear and inject
            svgRef.current.innerHTML = '';
            svgRef.current.appendChild(svgElement);
            
            // Add animation classes to paths after injection
            setTimeout(() => {
              const paths = svgRef.current.querySelectorAll('path');
              paths.forEach((path, index) => {
                path.classList.add('map-path');
                path.style.animationDelay = `${index * 0.02}s`;
              });
              setSvgLoaded(true);
            }, 100);
          }
        })
        .catch(error => console.error('Error loading SVG:', error));
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
