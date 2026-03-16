import React, { createContext, useContext, useRef, useState } from 'react';

const PrintContext = createContext(null);

export const PrintProvider = ({ children }) => {
  const [pendingFile, setPendingFile] = useState(null);

  // Use a ref so PrintStudioPage can consume and clear atomically
  const consumeFile = () => {
    const file = pendingFile;
    setPendingFile(null);
    return file;
  };

  return (
    <PrintContext.Provider value={{ pendingFile, setPendingFile, consumeFile }}>
      {children}
    </PrintContext.Provider>
  );
};

export const usePrintContext = () => {
  const ctx = useContext(PrintContext);
  if (!ctx) throw new Error('usePrintContext must be used inside PrintProvider');
  return ctx;
};
