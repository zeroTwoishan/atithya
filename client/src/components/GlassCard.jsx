// GlassCard — reusable frosted-glass card primitive
// variant: 'warm' | 'dark' | 'green' | 'navy'
import { motion } from "motion/react";
import { clsx } from "clsx";

const variants = {
  warm:  "glass",
  dark:  "glass-dark",
  green: "glass-green",
  navy:  "glass-dark",
};

export function GlassCard({
  children,
  variant = "warm",
  className = "",
  animate = true,
  delay = 0,
  onClick,
  ...props
}) {
  const Comp = animate ? motion.div : "div";
  const animProps = animate
    ? {
        initial: { opacity: 0, y: 18, scale: 0.97 },
        animate: { opacity: 1, y: 0, scale: 1 },
        transition: { duration: 0.38, delay, ease: [0.22, 1, 0.36, 1] },
      }
    : {};

  return (
    <Comp
      className={clsx(
        variants[variant],
        "rounded-[16px]",
        onClick && "cursor-pointer active:scale-[0.98] transition-transform",
        className
      )}
      onClick={onClick}
      {...animProps}
      {...props}
    >
      {children}
    </Comp>
  );
}
