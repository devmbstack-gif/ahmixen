'use client';

import { motion, useReducedMotion } from 'framer-motion';

export function AdminStub({ title }: { title: string }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.35 }}
      className="admin-card max-w-xl"
    >
      <h2 className="text-lg font-bold text-[var(--text-main)]">{title}</h2>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">Coming next</p>
    </motion.div>
  );
}
