"use client";
import React from "react";
import { usePathname } from "next/navigation";
import { Header } from "./Header";
import { GameHeader } from "./GameHeader";

export const GlobalHeaderWrapper = () => {
  const pathname = usePathname();

  // Game routes that should use the minimal GameHeader
  const isGameRoute =
    pathname.includes("/play") ||
    pathname.includes("/daily") ||
    pathname.includes("/duel/");

  if (isGameRoute) {
    let mode: "solo" | "daily" | "duel" = "solo";
    if (pathname.includes("/daily")) mode = "daily";
    if (pathname.includes("/duel/")) mode = "duel";

    // We could pass dynamic props via a context or state manager, but for now we render the shell
    return (
      <GameHeader
        mode={mode}
        onPause={() => console.log("pause")}
        onSettings={() => console.log("settings")}
      />
    );
  }

  return <Header />;
};
