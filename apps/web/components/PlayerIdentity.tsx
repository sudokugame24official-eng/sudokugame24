import React from "react";
import { getLevelTier } from "@/lib/level-config";
import { cn } from "@/lib/utils";
import { UserAvatar } from "./UserAvatar";

interface PlayerIdentityProps {
  username: string;
  avatarUrl?: string | null;
  level?: number;
  className?: string;
  iconOnly?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
}

export const PlayerIdentity: React.FC<PlayerIdentityProps> = ({
  username,
  avatarUrl,
  level = 1,
  className,
  iconOnly = false,
  size = "md",
}) => {
  const tier = getLevelTier(level);

  const sizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
    xl: "text-xl font-bold",
  };

  const avatarSizes: Record<"sm" | "md" | "lg" | "xl", "xs" | "sm" | "md" | "lg"> = {
    sm: "xs",
    md: "sm",
    lg: "md",
    xl: "lg",
  };

  const badgeSizeClasses = {
    sm: "text-[10px]",
    md: "text-xs",
    lg: "text-sm",
    xl: "text-lg",
  };

  const content = (
    <div
      className={cn(
        "flex items-center gap-2 font-medium whitespace-nowrap",
        sizeClasses[size],
        className,
      )}
    >
      {avatarUrl !== undefined && (
        <UserAvatar
          avatarUrl={avatarUrl}
          username={username}
          size={avatarSizes[size]}
        />
      )}
      <span
        className={cn(
          "select-none flex items-center justify-center font-black",
          tier.badgeColor,
          badgeSizeClasses[size],
        )}
      >
        {tier.badge}
      </span>
      {!iconOnly && (
        <span className={cn("truncate max-w-[200px]", tier.textColor)}>
          {username}
        </span>
      )}
    </div>
  );

  return (
    <div className="group relative inline-block cursor-help">
      {content}

      {/* Custom Tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-3 py-2 bg-slate-900 border border-slate-700 text-white text-xs rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-[100]">
        <p className="font-bold">
          <span className={tier.badgeColor}>{tier.badge}</span> {tier.title}
        </p>
        <p className="text-slate-400">Level {level}</p>
        {/* Triangle */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-700"></div>
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900 -mt-px"></div>
      </div>
    </div>
  );
};
