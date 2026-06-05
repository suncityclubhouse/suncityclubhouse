"use client";

import { type ReactNode } from "react";
import {
  motion,
  type Variants,
  type HTMLMotionProps,
} from "framer-motion";

/* ─── Shared easing ────────────────────────────────────── */
const smoothEase = [0.16, 1, 0.3, 1] as const;

/* ─── Fade-in-up (most common) ─────────────────────────── */
const fadeUpVariants: Variants = {
  hidden: { opacity: 0, y: 32 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: smoothEase },
  },
};

const fadeUpSmallVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: smoothEase },
  },
};

/* ─── Scale-in (for cards, badges) ─────────────────────── */
const scaleInVariants: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: smoothEase },
  },
};

/* ─── Fade only ────────────────────────────────────────── */
const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.6, ease: smoothEase },
  },
};

/* ─── Slide-in from left ───────────────────────────────── */
const slideLeftVariants: Variants = {
  hidden: { opacity: 0, x: -40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.65, ease: smoothEase },
  },
};

/* ─── Slide-in from right ──────────────────────────────── */
const slideRightVariants: Variants = {
  hidden: { opacity: 0, x: 40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.65, ease: smoothEase },
  },
};

/* ─── Variant map ──────────────────────────────────────── */
const variantMap = {
  "fade-up": fadeUpVariants,
  "fade-up-small": fadeUpSmallVariants,
  "scale-in": scaleInVariants,
  fade: fadeVariants,
  "slide-left": slideLeftVariants,
  "slide-right": slideRightVariants,
} as const;

type AnimationType = keyof typeof variantMap;

/* ════════════════════════════════════════════════════════
   FadeIn — scroll-triggered reveal
   ════════════════════════════════════════════════════════ */
interface FadeInProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: ReactNode;
  animation?: AnimationType;
  delay?: number;
  /** viewport threshold — 0 to 1 */
  threshold?: number;
  className?: string;
}

export function FadeIn({
  children,
  animation = "fade-up",
  delay = 0,
  threshold = 0.15,
  className,
  ...rest
}: FadeInProps) {
  const base = variantMap[animation];
  const variants: Variants = {
    hidden: base.hidden,
    visible: {
      ...(base.visible as object),
      transition: {
        ...((base.visible as any).transition as object),
        delay,
      },
    },
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: threshold }}
      variants={variants}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════
   StaggerContainer — staggers child FadeIn items
   ════════════════════════════════════════════════════════ */
interface StaggerContainerProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: ReactNode;
  stagger?: number;
  delay?: number;
  threshold?: number;
  className?: string;
}

const containerVariants = (stagger: number, delay: number): Variants => ({
  hidden: {},
  visible: {
    transition: {
      staggerChildren: stagger,
      delayChildren: delay,
    },
  },
});

export function StaggerContainer({
  children,
  stagger = 0.12,
  delay = 0,
  threshold = 0.1,
  className,
  ...rest
}: StaggerContainerProps) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: threshold }}
      variants={containerVariants(stagger, delay)}
      className={className}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════
   StaggerItem — child of StaggerContainer
   ════════════════════════════════════════════════════════ */
interface StaggerItemProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: ReactNode;
  animation?: AnimationType;
  className?: string;
}

export function StaggerItem({
  children,
  animation = "fade-up",
  className,
  ...rest
}: StaggerItemProps) {
  return (
    <motion.div variants={variantMap[animation]} className={className} {...rest}>
      {children}
    </motion.div>
  );
}

/* ════════════════════════════════════════════════════════
   AnimatedCounter — counts up a number on scroll
   ════════════════════════════════════════════════════════ */
interface AnimatedCounterProps {
  value: string;
  className?: string;
}

export function AnimatedCounter({ value, className }: AnimatedCounterProps) {
  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.5 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: smoothEase }}
      className={className}
    >
      {value}
    </motion.span>
  );
}

/* ════════════════════════════════════════════════════════
   FloatingElement — subtle continuous float effect
   ════════════════════════════════════════════════════════ */
interface FloatingProps {
  children: ReactNode;
  y?: number;
  duration?: number;
  delay?: number;
  className?: string;
}

export function FloatingElement({
  children,
  y = 12,
  duration = 4,
  delay = 0,
  className,
}: FloatingProps) {
  return (
    <motion.div
      animate={{ y: [0, -y, 0] }}
      transition={{
        duration,
        repeat: Infinity,
        repeatType: "loop",
        ease: "easeInOut",
        delay,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
