import { motion, type MotionProps } from "framer-motion";
import { useInView } from "react-intersection-observer";
import type { ReactNode, CSSProperties } from "react";

interface FadeInProps extends MotionProps {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: "div" | "section" | "article" | "header" | "li";
  style?: CSSProperties;
}

export function FadeIn({ children, delay = 0, y = 24, className, as = "div", ...rest }: FadeInProps) {
  const { ref, inView } = useInView({ triggerOnce: true, rootMargin: "-50px 0px" });
  const Comp = motion[as] as any;
  return (
    <Comp
      ref={ref}
      initial={{ opacity: 0, y }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
      {...rest}
    >
      {children}
    </Comp>
  );
}
