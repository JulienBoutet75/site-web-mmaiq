import { Variants } from 'motion/react';

export const powerUpVariant: Variants = {
  hidden: { opacity: 0, scale: 0.3, filter: "brightness(2) blur(10px)" },
  visible: { 
    opacity: 1, 
    scale: [0.3, 1.05, 1], 
    filter: "brightness(1) blur(0px)",
    transition: { 
      duration: 0.6, 
      ease: [0.25, 1, 0.5, 1],
      times: [0, 0.6, 1]
    } 
  }
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08
    }
  }
};

export const speedImpactVariant: Variants = {
  hidden: { opacity: 0, x: -200, filter: "blur(20px)" },
  visible: { 
    opacity: 1, 
    x: 0, 
    filter: "blur(0px)",
    transition: { 
      type: "spring", 
      stiffness: 100, 
      damping: 15,
      duration: 0.5 
    } 
  }
};

export const speedImpactRightVariant: Variants = {
  hidden: { opacity: 0, x: 200, filter: "blur(20px)" },
  visible: { 
    opacity: 1, 
    x: 0, 
    filter: "blur(0px)",
    transition: { 
      type: "spring", 
      stiffness: 100, 
      damping: 15,
      duration: 0.5 
    } 
  }
};

export const textRevealVariant: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" }
  }
};
