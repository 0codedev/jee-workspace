import { Variants } from 'framer-motion';

export const snappySpring = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 30
};

export const fadeSwap: Variants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.15, ease: [0.25, 0.1, 0.25, 1] } }
};

export const fadeRise: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, y: 8, transition: { duration: 0.2 } }
};

export const popIn: Variants = {
  initial: { opacity: 0, scale: 0.92 },
  animate: { opacity: 1, scale: 1, transition: snappySpring },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.15 } }
};

export const slideFromRight: Variants = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0, transition: snappySpring },
  exit: { opacity: 0, x: 24, transition: { duration: 0.15 } }
};

export const blurBackdrop: Variants = {
  initial: { opacity: 0, backdropFilter: 'blur(0px)' },
  animate: { opacity: 1, backdropFilter: 'blur(12px)', transition: { duration: 0.2 } },
  exit: { opacity: 0, backdropFilter: 'blur(0px)', transition: { duration: 0.15 } }
};

export const staggerParent: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.02
    }
  }
};

export const staggerChild: Variants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25 } }
};

export const tactileHover = {
  whileHover: { scale: 1.02, transition: { duration: 0.15 } },
  whileTap: { scale: 0.97, transition: { duration: 0.1 } }
};