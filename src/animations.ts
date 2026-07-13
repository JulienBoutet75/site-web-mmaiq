import { Variants } from 'motion/react';

/* Grammaire motion commune MMA IQ — sobre et athlétique :
   durées 200–400 ms, une seule courbe signature, reveals fade + slide courts.
   Les filter (blur/brightness) animés sont proscrits : repaint complet de
   l'élément à chaque frame, et l'effet « impact » lisait gimmick sur des
   sections entières. */
export const EASE_SIGNATURE: [number, number, number, number] = [0.25, 1, 0.5, 1];

export const powerUpVariant: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: EASE_SIGNATURE }
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
  hidden: { opacity: 0, x: -24 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.45, ease: EASE_SIGNATURE }
  }
};

export const speedImpactRightVariant: Variants = {
  hidden: { opacity: 0, x: 24 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.45, ease: EASE_SIGNATURE }
  }
};

export const textRevealVariant: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: EASE_SIGNATURE }
  }
};
