"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/utils/cn";

interface TextGenerateEffectProps {
  words: string;
  className?: string;
  containerClassName?: string;
}

export const TextGenerateEffect: React.FC<TextGenerateEffectProps> = ({
  words,
  className,
  containerClassName,
}) => {
  const [wordArray, setWordArray] = useState<string[]>([]);
  
  useEffect(() => {
    setWordArray(words.split(" "));
  }, [words]);

  const container = {
    hidden: { opacity: 0 },
    visible: (i = 1) => ({
      opacity: 1,
      transition: { staggerChildren: 0.12, delayChildren: 0.04 * i },
    }),
  };

  const child = {
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 100,
      },
    },
    hidden: {
      opacity: 0,
      x: 20,
      transition: {
        type: "spring",
        damping: 12,
        stiffness: 100,
      },
    },
  };

  return (
    <div className={containerClassName}>
      <motion.div
        className={cn("", className)}
        variants={container}
        initial="hidden"
        animate="visible"
      >
        {wordArray.map((word, index) => (
          <motion.span
            variants={child}
            key={index}
            className="mr-1"
          >
            {word}
          </motion.span>
        ))}
      </motion.div>
    </div>
  );
}; 