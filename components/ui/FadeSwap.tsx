import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeSwap } from './motion/variants';

interface FadeSwapProps {
  currentKey: string;
  children: React.ReactNode;
  className?: string;
}

export const FadeSwap: React.FC<FadeSwapProps> = ({ currentKey, children, className = '' }) => {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentKey}
        variants={fadeSwap}
        initial="initial"
        animate="animate"
        exit="exit"
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};