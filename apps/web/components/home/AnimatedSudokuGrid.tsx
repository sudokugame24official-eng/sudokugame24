"use client";
import React, { useState, useEffect } from "react";
import { m } from "framer-motion";
import { useTranslations } from "next-intl";

const DEMO_BOARD = [
  [5, 3, 0, 0, 7, 0, 0, 0, 0],
  [6, 0, 0, 1, 9, 5, 0, 0, 0],
  [0, 9, 8, 0, 0, 0, 0, 6, 0],
  [8, 0, 0, 0, 6, 0, 0, 0, 3],
  [4, 0, 0, 8, 0, 3, 0, 0, 1],
  [7, 0, 0, 0, 2, 0, 0, 0, 6],
  [0, 6, 0, 0, 0, 0, 2, 8, 0],
  [0, 0, 0, 4, 1, 9, 0, 0, 5],
  [0, 0, 0, 0, 8, 0, 0, 7, 9],
];

const DEMO_SOLUTION = [
  [5, 3, 4, 6, 7, 8, 9, 1, 2],
  [6, 7, 2, 1, 9, 5, 3, 4, 8],
  [1, 9, 8, 3, 4, 2, 5, 6, 7],
  [8, 5, 9, 7, 6, 1, 4, 2, 3],
  [4, 2, 6, 8, 5, 3, 7, 9, 1],
  [7, 1, 3, 9, 2, 4, 8, 5, 6],
  [9, 6, 1, 5, 3, 7, 2, 8, 4],
  [2, 8, 7, 4, 1, 9, 6, 3, 5],
  [3, 4, 5, 2, 8, 6, 1, 7, 9],
];

const CELL_COLORS: Record<number, string> = {
  1: "#FF6B35",
  2: "#4ECDC4",
  3: "#FFE66D",
  4: "#A8E6CF",
  5: "#FF8B94",
  6: "#C7B3FF",
  7: "#87CEEB",
  8: "#FFA07A",
  9: "#98FB98",
};

export default function AnimatedSudokuGrid() {
  const t = useTranslations("home");
  const [highlighted, setHighlighted] = useState<{ r: number; c: number } | null>(null);
  const [filledCells, setFilledCells] = useState<Set<string>>(new Set());

  useEffect(() => {
    const empties: { r: number; c: number }[] = [];
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const row = DEMO_BOARD[r];
        if (row && row[c] === 0) {
          empties.push({ r, c });
        }
      }
    }

    let iv: NodeJS.Timeout;
    const timeout = setTimeout(() => {
      let idx = 0;
      iv = setInterval(() => {
        if (idx >= empties.length) {
          idx = 0;
          setFilledCells(new Set());
          setHighlighted(null);
          return;
        }
        const cell = empties[idx++];
        if (cell) {
          setHighlighted(cell);
          setFilledCells((prev) => new Set([...prev, `${cell.r}-${cell.c}`]));
        }
      }, 400);
    }, 2500);

    return () => {
      clearTimeout(timeout);
      if (iv) clearInterval(iv);
    };
  }, []);

  return (
    <div className="relative">
      <div className="relative bg-[#041E42]/90 border border-brand-gold/30 rounded-2xl p-3.5 shadow-2xl backdrop-blur-md">
        <div
          className="grid gap-0.5"
          style={{ display: "grid", gridTemplateColumns: "repeat(9, 1fr)", gap: "2px" }}
        >
          {DEMO_BOARD.map((row, r) =>
            row.map((val, c) => {
              const isBox = (Math.floor(r / 3) + Math.floor(c / 3)) % 2 === 0;
              const isHighlighted = highlighted?.r === r && highlighted?.c === c;
              const isFilled = filledCells.has(`${r}-${c}`);
              const solvedVal = DEMO_SOLUTION[r]?.[c] ?? 1;
              const displayVal = val !== 0 ? val : isFilled ? solvedVal : "";
              const isPreset = val !== 0;

              const borderTop = r % 3 === 0 && r !== 0 ? "border-t-2 border-t-white/30" : "";
              const borderLeft = c % 3 === 0 && c !== 0 ? "border-l-2 border-l-white/30" : "";

              return (
                <m.div
                  key={`${r}-${c}`}
                  animate={isHighlighted ? { scale: 1.15 } : { scale: 1 }}
                  transition={{ duration: 0.15 }}
                  className={[
                    "w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded text-xs font-black transition-colors select-none",
                    isBox ? "bg-white/6" : "bg-white/2",
                    borderTop,
                    borderLeft,
                    isHighlighted ? "ring-2 ring-brand-cyan ring-opacity-90 z-10" : "",
                  ].join(" ")}
                  style={{
                    color: isPreset
                      ? "#FFFFFF"
                      : isFilled
                      ? CELL_COLORS[solvedVal] || "#00BFFF"
                      : "transparent",
                    backgroundColor: isHighlighted ? "rgba(0,191,255,0.3)" : undefined,
                  }}
                >
                  {displayVal}
                </m.div>
              );
            })
          )}
        </div>
        <div className="flex items-center gap-2 mt-2.5 px-1">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_#4ade80]" />
          <span className="text-[11px] text-gray-300 font-bold uppercase tracking-wider">{t("gridLiveLabel")}</span>
          <span className="ml-auto text-[11px] text-brand-gold font-black">01:48</span>
        </div>
      </div>
    </div>
  );
}

