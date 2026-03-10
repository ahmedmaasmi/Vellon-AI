'use client';

import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import {
  revealVariants,
  staggerContainerVariants,
  staggerItemVariants,
  viewportOnce,
} from '@/lib/motion';

type SectionRevealProps = {
  children: React.ReactNode;
  className?: string;
};

/** Wraps content and reveals it on scroll (fade + y). Respects reduced motion. */
export function SectionReveal({ children, className }: SectionRevealProps) {
  const reducedMotion = useReducedMotion();
  const variants = revealVariants(!!reducedMotion);

  return (
    <motion.div
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      className={className}
    >
      {children}
    </motion.div>
  );
}

type StaggerRevealProps = {
  children: React.ReactNode;
  className?: string;
};

/** Container that reveals children with stagger. Use with StaggerRevealItem. */
export function StaggerReveal({ children, className }: StaggerRevealProps) {
  const reducedMotion = useReducedMotion();
  const container = staggerContainerVariants(!!reducedMotion);

  return (
    <motion.div
      variants={container}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      className={className}
    >
      {children}
    </motion.div>
  );
}

type StaggerRevealItemProps = {
  children: React.ReactNode;
  className?: string;
};

/** Single item inside StaggerReveal. */
export function StaggerRevealItem({ children, className }: StaggerRevealItemProps) {
  const reducedMotion = useReducedMotion();
  const variants = staggerItemVariants(!!reducedMotion);

  return (
    <motion.div variants={variants} className={className}>
      {children}
    </motion.div>
  );
}
