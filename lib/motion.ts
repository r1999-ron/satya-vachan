import type { Transition, Variants } from "motion/react";

/**
 * Shared motion vocabulary. Components import these instead of inventing
 * durations, so the whole app eases the same way.
 *
 * Reduced-motion is handled globally by the <MotionConfig reducedMotion="user">
 * in AppShell — individual components do not need to branch on it.
 */

export const transitions = {
  /** Default for entrances: settles without visible bounce. */
  soft: { type: "spring", stiffness: 260, damping: 30, mass: 0.9 },
  /** Direct manipulation — taps, toggles, selection. */
  snappy: { type: "spring", stiffness: 480, damping: 32 },
  /** A little overshoot, for celebratory or "popped in" elements. */
  bouncy: { type: "spring", stiffness: 420, damping: 18 },
  /** Non-spatial changes: colour, opacity, cross-fades. */
  fade: { duration: 0.24, ease: [0.4, 0, 0.2, 1] },
} satisfies Record<string, Transition>;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: transitions.soft },
  exit: { opacity: 0, y: -8, transition: transitions.fade },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: transitions.fade },
  exit: { opacity: 0, transition: transitions.fade },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: transitions.soft },
  exit: { opacity: 0, scale: 0.97, transition: transitions.fade },
};

export const popIn: Variants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { opacity: 1, scale: 1, transition: transitions.bouncy },
  exit: { opacity: 0, scale: 0.85, transition: transitions.fade },
};

/** Slides content in from the direction it was navigated (-1 back, 1 forward). */
export const slideSwap: Variants = {
  hidden: (direction: number) => ({ opacity: 0, x: direction * 24 }),
  visible: { opacity: 1, x: 0, transition: transitions.soft },
  exit: (direction: number) => ({
    opacity: 0,
    x: direction * -24,
    transition: transitions.fade,
  }),
};

/**
 * Parent wrapper that reveals children in sequence. Pair with `fadeUp` (or any
 * variant using the same "hidden"/"visible" names) on each child.
 */
export function stagger(step = 0.06, delay = 0): Variants {
  return {
    hidden: {},
    visible: {
      transition: { staggerChildren: step, delayChildren: delay },
    },
  };
}

/** Standard press feedback for tappable surfaces. */
export const pressable = {
  whileHover: { y: -2 },
  whileTap: { scale: 0.97, y: 0 },
  transition: transitions.snappy,
} as const;
