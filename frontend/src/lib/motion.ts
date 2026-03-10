'use client';

import { Variants } from 'framer-motion';

const duration = 0.5;
const staggerDelay = 0.08;

/** Base reveal: fade + y. When reduced motion: opacity only, no transform. */
export function revealVariants(reducedMotion: boolean): Variants {
  return {
    hidden: {
      opacity: 0,
      ...(reducedMotion ? {} : { y: 24 }),
    },
    visible: {
      opacity: 1,
      ...(reducedMotion ? {} : { y: 0 }),
      transition: { duration: reducedMotion ? 0.2 : duration, ease: [0.25, 0.46, 0.45, 0.94] },
    },
  };
}

/** Slight rotate for sticky-note feel. Reduced motion: no rotate. */
export function revealWithRotateVariants(reducedMotion: boolean, rotateDeg = 2): Variants {
  return {
    hidden: {
      opacity: 0,
      ...(reducedMotion ? {} : { y: 20, rotate: rotateDeg }),
    },
    visible: {
      opacity: 1,
      ...(reducedMotion ? {} : { y: 0, rotate: 0 }),
      transition: { duration: reducedMotion ? 0.2 : duration, ease: [0.25, 0.46, 0.45, 0.94] },
    },
  };
}

/** Container for staggered children. */
export function staggerContainerVariants(reducedMotion: boolean): Variants {
  return {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: reducedMotion ? 0 : staggerDelay,
        delayChildren: reducedMotion ? 0 : 0.1,
      },
    },
  };
}

/** Child of stagger container: fade + y. */
export function staggerItemVariants(reducedMotion: boolean): Variants {
  return {
    hidden: {
      opacity: 0,
      ...(reducedMotion ? {} : { y: 16 }),
    },
    visible: {
      opacity: 1,
      ...(reducedMotion ? {} : { y: 0 }),
      transition: { duration: reducedMotion ? 0.15 : 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
    },
  };
}

/** Path draw: pathLength 0 -> 1. Reduced motion: show immediately. */
export function pathDrawVariants(reducedMotion: boolean, pathDuration = 0.6): Variants {
  return {
    hidden: {
      pathLength: reducedMotion ? 1 : 0,
      opacity: reducedMotion ? 1 : 0.6,
    },
    visible: {
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: { duration: reducedMotion ? 0 : pathDuration, ease: [0.25, 0.46, 0.45, 0.94] },
        opacity: { duration: 0.2 },
      },
    },
  };
}

/** Viewport options: trigger once, 20% visible. */
export const viewportOnce = { once: true, amount: 0.2 };
