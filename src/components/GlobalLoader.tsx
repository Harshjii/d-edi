import React from 'react';

const GlobalLoader = () => {
  return (
    <div className="fixed inset-0 bg-white bg-opacity-75 z-[9999] flex items-center justify-center backdrop-blur-sm">
      <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-accent"></div>
    </div>
  );
};

export default GlobalLoader;