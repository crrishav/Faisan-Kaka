import React, { useState, useCallback, useRef } from 'react';
import './PrintSection.css';

const ACCEPTED_TYPES = [
  'image/png',
  'image/svg+xml',
  'image/jpeg',
  'image/jpg',
  'application/pdf'
];

const ACCEPTED_EXTENSIONS = ['.png', '.svg', '.jpg', '.jpeg', '.pdf'];

const PrintSection = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const isValidFileType = (file) => {
    const extension = '.' + file.name.split('.').pop().toLowerCase();
    return ACCEPTED_TYPES.includes(file.type) || 
           ACCEPTED_EXTENSIONS.includes(extension);
  };

  const handleDragEnter = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    setError(null);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (isValidFileType(file)) {
        setUploadedFile(file);
      } else {
        setError('Please upload only PNG, SVG, JPG, or PDF files.');
      }
    }
  }, []);

  const handleFileInput = useCallback((e) => {
    const files = e.target.files;
    if (files.length > 0) {
      const file = files[0];
      if (isValidFileType(file)) {
        setUploadedFile(file);
        setError(null);
      } else {
        setError('Please upload only PNG, SVG, JPG, or PDF files.');
      }
    }
  }, []);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const clearFile = () => {
    setUploadedFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <section className="print-section">
      <div className="print-container">
        <h2 className="print-title">Got a Design? We'll Print It.</h2>
        
        <div
          className={`upload-area ${isDragging ? 'dragging' : ''} ${uploadedFile ? 'has-file' : ''}`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={handleClick}
          role="button"
          tabIndex={0}
          aria-label="Drag and drop file upload area"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".png,.svg,.jpg,.jpeg,.pdf"
            onChange={handleFileInput}
            className="file-input"
            aria-hidden="true"
          />
          
          {uploadedFile ? (
            <div className="file-info">
              <div className="file-icon">✓</div>
              <p className="file-name">{uploadedFile.name}</p>
              <p className="file-size">({(uploadedFile.size / 1024).toFixed(1)} KB)</p>
              <button 
                className="clear-file-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  clearFile();
                }}
              >
                Remove
              </button>
            </div>
          ) : (
            <div className="upload-prompt">
              <div className="upload-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17,8 12,3 7,8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              </div>
              <p className="upload-text">
                <span className="upload-highlight">Drag & drop</span> your design here
              </p>
              <p className="upload-subtext">or click to browse</p>
              <p className="upload-formats">PNG, SVG, JPG, PDF</p>
            </div>
          )}
        </div>

        {error && (
          <div className="error-message" role="alert">
            {error}
          </div>
        )}

        {uploadedFile && (
          <button className="submit-btn">
            Submit Design
          </button>
        )}
      </div>
    </section>
  );
};

export default PrintSection;
