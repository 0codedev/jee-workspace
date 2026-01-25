import React, { useEffect, useState, useRef } from 'react';

interface ValueFlashProps {
  value: number | string;
  children: React.ReactNode;
  className?: string;
}

export const ValueFlash: React.FC<ValueFlashProps> = ({ value, children, className = '' }) => {
  const [flashClass, setFlashClass] = useState('');
  const prevValueRef = useRef(value);

  useEffect(() => {
    if (prevValueRef.current !== value) {
      const prevNum = Number(prevValueRef.current);
      const currNum = Number(value);

      if (!isNaN(prevNum) && !isNaN(currNum)) {
        if (currNum > prevNum) {
          setFlashClass('bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40');
        } else if (currNum < prevNum) {
          setFlashClass('bg-rose-500/20 text-rose-400 ring-1 ring-rose-500/40');
        }
      } else {
        setFlashClass('bg-cyan-500/20 text-cyan-400 ring-1 ring-cyan-500/40');
      }

      prevValueRef.current = value;

      const timer = setTimeout(() => {
        setFlashClass('');
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [value]);

  return (
    <span className={`inline-block transition-all duration-500 rounded px-1 ${flashClass} ${className}`}>
      {children}
    </span>
  );
};
