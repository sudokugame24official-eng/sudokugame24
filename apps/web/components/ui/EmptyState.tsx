import React from "react";
import { cn } from "./Button";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center p-12 bg-white/5 border border-white/10 rounded-3xl min-h-[300px]",
        className,
      )}
      {...props}
    >
      <div className="w-20 h-20 bg-brand-navy border-2 border-white/10 rounded-full flex items-center justify-center mb-6 shadow-inner">
        <Icon className="w-10 h-10 text-brand-cyan/70" strokeWidth={1.5} />
      </div>
      <h3 className="text-2xl font-black uppercase tracking-tight text-white mb-3">
        {title}
      </h3>
      <p className="text-gray-400 max-w-sm mx-auto mb-8 leading-relaxed">
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
}
