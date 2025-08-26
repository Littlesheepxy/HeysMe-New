import React, { useState } from 'react';

export function Button({ children, onClick }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = () => {
    setIsAnimating(true);
    onClick?.();
    setTimeout(() => setIsAnimating(false), 300);
  };

  return (
    <button
      onClick={handleClick}
      className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded"
    >
      {children}
    </button>
  );
}