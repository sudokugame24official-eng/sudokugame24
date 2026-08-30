import React from "react";
import { User } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  avatarUrl?: string | null;
  username?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
  isOnline?: boolean;
  borderClassName?: string;
}

export function UserAvatar({
  avatarUrl,
  username,
  size = "md",
  className,
  isOnline,
  borderClassName,
}: UserAvatarProps) {
  const sizeClasses = {
    xs: "w-6 h-6 text-[10px]",
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-14 h-14 text-lg",
    xl: "w-20 h-20 text-2xl",
    "2xl": "w-28 h-28 text-4xl",
  };

  const initial = username ? username.charAt(0).toUpperCase() : "U";

  return (
    <div className="relative inline-block shrink-0">
      <div
        className={cn(
          "rounded-full overflow-hidden flex items-center justify-center bg-gradient-to-br from-[#0A2A5C] to-[#041E42] border-2 border-brand-gold/40 shadow-md",
          sizeClasses[size],
          borderClassName,
          className,
        )}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={username || "Avatar"}
            className="w-full h-full object-contain p-0.5 rounded-full"
            onError={(e) => {
              // Gracefully switch to fallback initial on broken image
              const target = e.currentTarget;
              target.style.display = "none";
              if (target.parentElement) {
                target.parentElement.innerHTML = `<span class="font-black text-brand-gold">${initial}</span>`;
              }
            }}
          />
        ) : (
          <span className="font-black text-brand-gold select-none">
            {initial}
          </span>
        )}
      </div>

      {isOnline !== undefined && (
        <span
          className={cn(
            "absolute bottom-0 right-0 rounded-full ring-2 ring-brand-navy shrink-0",
            isOnline ? "bg-green-500 shadow-[0_0_8px_#22c55e]" : "bg-gray-500",
            size === "xs" || size === "sm" ? "w-2 h-2" : "w-3 h-3",
          )}
          title={isOnline ? "En ligne" : "Hors ligne"}
        />
      )}
    </div>
  );
}
