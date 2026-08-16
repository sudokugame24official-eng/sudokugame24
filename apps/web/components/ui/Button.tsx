import React from "react";
import { Loader2 } from "lucide-react";
import { motion, HTMLMotionProps } from "framer-motion";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface ButtonProps extends Omit<HTMLMotionProps<"button">, "ref"> {
  variant?: "primary" | "secondary" | "ghost" | "outline" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center rounded-xl font-bold uppercase tracking-widest transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold disabled:pointer-events-none disabled:opacity-50 select-none";

    const variants = {
      primary:
        "bg-brand-orange text-white shadow-[0_4px_0_#CC3700] hover:bg-brand-orange-light active:shadow-[0_0px_0_#CC3700] active:translate-y-1",
      secondary:
        "bg-brand-navy-light text-brand-gold hover:bg-brand-navy-lighter shadow-[0_4px_0_#05152F] active:shadow-[0_0px_0_#05152F] active:translate-y-1 border border-brand-gold/20",
      outline:
        "border-2 border-brand-orange text-brand-orange hover:bg-brand-orange hover:text-white active:translate-y-0.5",
      ghost:
        "bg-transparent hover:bg-white/10 text-white active:translate-y-0.5",
      danger:
        "bg-red-600 text-white shadow-[0_4px_0_#990000] hover:bg-red-500 active:shadow-[0_0px_0_#990000] active:translate-y-1",
    };

    const sizes = {
      sm: "h-9 px-4 text-xs",
      md: "h-11 px-6 text-sm",
      lg: "h-14 px-8 text-base",
      icon: "h-11 w-11",
    };

    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: disabled || isLoading ? 1 : 0.97 }}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </motion.button>
    );
  },
);

Button.displayName = "Button";
