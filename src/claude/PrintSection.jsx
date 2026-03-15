import React, { useState, useCallback, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import './PrintSection.css';

const ACCEPTED_TYPES = [
  'image/png',
  'image/svg+xml',
  'image/jpeg',
  'image/jpg',
  'application/pdf',
];
const ACCEPTED_EXTENSIONS = ['.png', '.svg', '.jpg', '.jpeg', '.pdf'];

/* ─── Variants (mirror DeliverySection style) ──────────────────── */

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

const uploadPanelVariants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1], delay: 0.05 },
  },
};

// Inner content swap (prompt ↔ file-info)
const innerVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.97,
    transition: { duration: 0.22, ease: 'easeIn' },
  },
};

const errorVariants = {
  hidden: { opacity: 0, y: -6 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.2 } },
};

const submitVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
  },
  exit: { opacity: 0, y: 14, transition: { duration: 0.2 } },
};

/* ─── UploadIcon SVG ───────────────────────────────────────────── */

const UploadIcon = () => (
  <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17,8 12,3 7,8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

const CheckIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20,6 9,17 4,12" />
  </svg>
);

/* ─── Component ────────────────────────────────────────────────── */

const PrintSection = () => {
  const sectionRef = useRef(null);
  const fileInputRef = useRef(null);

  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [error, setError] = useState(null);

  const isInView = useInView(sectionRef, { amount: 0.15, once: false });

  const isValidFileType = (file) => {
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    return ACCEPTED_TYPES.includes(file.type) || ACCEPTED_EXTENSIONS.includes(ext);
  };

  const handleDragEnter = useCallback((e) => { e.preventDefault(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback((e) => { e.preventDefault(); setIsDragging(false); }, []);
  const handleDragOver = useCallback((e) => { e.preventDefault(); }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    setError(null);
    const file = e.dataTransfer.files[0];
    if (file) {
      isValidFileType(file) ? setUploadedFile(file) : setError('Please upload only PNG, SVG, JPG, or PDF files.');
    }
  }, []);

  const handleFileInput = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      isValidFileType(file) ? (setUploadedFile(file), setError(null)) : setError('Please upload only PNG, SVG, JPG, or PDF files.');
    }
  }, []);

  const clearFile = () => {
    setUploadedFile(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <motion.section
      ref={sectionRef}
      className="print-section"
      variants={sectionVariants}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
    >
      <div className="print-container">

        {/* ── Left: text ── */}
        <motion.div
          className="print-text"
          variants={textContainerVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
        >
          <motion.p className="print-eyebrow" variants={textItemVariants}>
            Custom Printing
          </motion.p>
          <motion.h2 className="print-title" variants={textItemVariants}>
            Got a<br />Design?<br />We'll<br />Print It.
          </motion.h2>
          <motion.p className="print-sub" variants={textItemVariants}>
            Upload your artwork and we'll handle the rest — high-fidelity prints, fast turnaround.
          </motion.p>
          <motion.div className="print-badge" variants={textItemVariants}>
            <span className="print-badge-dot" />
            PNG · SVG · JPG · PDF
          </motion.div>
        </motion.div>

        {/* ── Right: upload panel ── */}
        <motion.div
          className="print-panel-wrapper"
          variants={uploadPanelVariants}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
        >
          {/* Drop zone */}
          <motion.div
            className={`upload-area ${isDragging ? 'dragging' : ''} ${uploadedFile ? 'has-file' : ''}`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            aria-label="Drag and drop file upload area"
            animate={
              isDragging
                ? { scale: 1.025, borderColor: '#2563eb' }
                : { scale: 1, borderColor: uploadedFile ? '#16a34a' : '#d1d5db' }
            }
            transition={{ duration: 0.2 }}
            whileHover={!uploadedFile ? { borderColor: '#9ca3af', backgroundColor: '#f9fafb' } : {}}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".png,.svg,.jpg,.jpeg,.pdf"
              onChange={handleFileInput}
              className="file-input"
              aria-hidden="true"
            />

            <AnimatePresence mode="wait">
              {uploadedFile ? (
                <motion.div
                  key="file-info"
                  className="file-info"
                  variants={innerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <motion.div
                    className="file-icon"
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 18, delay: 0.05 }}
                  >
                    <CheckIcon />
                  </motion.div>
                  <p className="file-name">{uploadedFile.name}</p>
                  <p className="file-size">{(uploadedFile.size / 1024).toFixed(1)} KB</p>
                  <motion.button
                    className="clear-file-btn"
                    onClick={(e) => { e.stopPropagation(); clearFile(); }}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    Remove
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div
                  key="upload-prompt"
                  className="upload-prompt"
                  variants={innerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  <motion.div
                    className="upload-icon"
                    animate={isDragging
                      ? { y: -6, color: '#2563eb' }
                      : { y: 0, color: '#9ca3af' }
                    }
                    transition={{ duration: 0.25 }}
                  >
                    <UploadIcon />
                  </motion.div>
                  <p className="upload-text">
                    <span className="upload-highlight">Drag & drop</span> your design
                  </p>
                  <p className="upload-subtext">or click to browse</p>
                  <p className="upload-formats">PNG · SVG · JPG · PDF</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                className="error-message"
                role="alert"
                variants={errorVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit */}
          <AnimatePresence>
            {uploadedFile && (
              <motion.button
                className="submit-btn"
                variants={submitVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                whileHover={{ scale: 1.03, backgroundColor: '#1a1a1a' }}
                whileTap={{ scale: 0.97 }}
              >
                Submit Design →
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>

      </div>
    </motion.section>
  );
};

export default PrintSection;
