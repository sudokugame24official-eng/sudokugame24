import React from "react";
import { cn } from "./Button";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "standard" | "featured" | "compact";
}

export function Card({
  className,
  variant = "standard",
  children,
  ...props
}: CardProps) {
  const baseStyles = "rounded-2xl border flex flex-col";

  const variants = {
    standard: "bg-brand-navy-light border-white/10 shadow-lg",
    featured:
      "bg-gradient-to-br from-brand-navy-light to-brand-navy border-brand-gold/40 shadow-[0_0_30px_rgba(255,204,0,0.1)] relative overflow-hidden",
    compact: "bg-white/5 border-white/5 p-4",
  };

  return (
    <div className={cn(baseStyles, variants[variant], className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col space-y-1.5 p-6", className)}
      {...props}
    />
  );
}

export function CardTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "text-xl font-black uppercase tracking-tight text-white",
        className,
      )}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-gray-400", className)} {...props} />;
}

export function CardContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-6 pt-0 flex-1", className)} {...props} />;
}

export function CardFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex items-center p-6 pt-0", className)} {...props} />
  );
}
