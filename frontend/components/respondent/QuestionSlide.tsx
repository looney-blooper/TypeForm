"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ReactNode } from "react";

export function QuestionSlide({
  slideKey,
  direction,
  children,
}: {
  slideKey: string | number;
  direction: 1 | -1;
  children: ReactNode;
}) {
  return (
    <AnimatePresence mode="wait" custom={direction}>
      <motion.div
        key={slideKey}
        custom={direction}
        initial={{ opacity: 0, y: direction > 0 ? 24 : -24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: direction > 0 ? -24 : 24 }}
        transition={{ duration: 0.26, ease: [0.4, 0, 0.2, 1] }}
        className="w-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
