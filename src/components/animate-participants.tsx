"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/utils/cn";
import { Participant } from "@/types/types";

interface AnimateParticipantsProps {
  participants: Participant[];
  children: React.ReactNode;
  className?: string;
  triggered: boolean;
}

export const AnimateParticipants: React.FC<AnimateParticipantsProps> = ({
  participants,
  children,
  className,
  triggered
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [key, setKey] = useState(0); // Add a key to force re-render

  // When triggered changes or participants length changes, start animation
  useEffect(() => {
    if (triggered) {
      // Force a re-render of the animation by changing the key
      setKey(prevKey => prevKey + 1);
      setIsVisible(true);
    } else {
      // When not triggered, we still want to show content but not animate it
      setIsVisible(true);
    }
  }, [triggered, participants.length]);

  const container = {
    hidden: { opacity: 0, height: 0, scale: 0.95 },
    show: {
      opacity: 1,
      height: "auto",
      scale: 1,
      transition: {
        opacity: { duration: 0.4 },
        height: { duration: 0.4 },
        scale: { duration: 0.3, type: "spring", stiffness: 150 }
      }
    },
    exit: {
      opacity: 0,
      height: 0,
      scale: 0.95,
      transition: {
        opacity: { duration: 0.3 },
        height: { duration: 0.3 },
        scale: { duration: 0.2 }
      }
    }
  };

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          key={key} // Use the key to force re-render and re-trigger animation
          className={cn("overflow-hidden", className)}
          variants={container}
          initial="hidden"
          animate="show"
          exit="exit"
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}; 