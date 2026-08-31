"use client";
import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SudokuValue } from "@repo/sudoku-engine";
import { cn } from "@/lib/utils";
import { BattleBar } from "./BattleBar";
import { Flame } from "lucide-react";

interface SharedDuelBoardProps {
  board: number[][];
  ownersBoard: (string | null)[][];
  player1: { id: string; username: string; score: number; level?: number; avatarUrl?: string | null };
  player2: { id: string; username: string; score: number; level?: number; avatarUrl?: string | null };
  userId: string;
  onMove: (row: number, col: number, value: number) => void;
  combo: number;
  onPlayerClick?: (e: React.MouseEvent, user: { id: string; username: string }) => void;
}

export const SharedDuelBoard: React.FC<SharedDuelBoardProps> = ({
  board,
  ownersBoard,
  player1,
  player2,
  userId,
  onMove,
  combo,
  onPlayerClick,
}) => {
  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(
    null,
  );

  // We can track the opponent's last move for a quick highlight animation
  const [lastMoveCell, setLastMoveCell] = useState<[number, number] | null>(
    null,
  );

  useEffect(() => {
    // Whenever board changes, we could potentially highlight the difference
    // For now, we rely on the ownersBoard to color the cells.
  }, [board, ownersBoard]);

  const handleCellClick = (row: number, col: number) => {
    // Can only select empty cells
    if (board[row]?.[col] === 0) {
      if (selectedCell?.[0] === row && selectedCell?.[1] === col) {
        setSelectedCell(null);
      } else {
        setSelectedCell([row, col]);
      }
    }
  };

  const insertValue = useCallback(
    (val: number) => {
      if (!selectedCell || val === 0) return;
      const [row, col] = selectedCell;

      // Cannot edit already filled cells
      if (board[row]?.[col] !== 0) return;

      onMove(row, col, val);

      // Optimistically clear selection so user can move on
      setSelectedCell(null);
    },
    [selectedCell, board, onMove],
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const key = e.key;
      if (key >= "1" && key <= "9") {
        insertValue(parseInt(key));
      } else if (selectedCell) {
        const [row, col] = selectedCell;
        if (key === "ArrowUp" && row > 0) setSelectedCell([row - 1, col]);
        else if (key === "ArrowDown" && row < 8)
          setSelectedCell([row + 1, col]);
        else if (key === "ArrowLeft" && col > 0)
          setSelectedCell([row, col - 1]);
        else if (key === "ArrowRight" && col < 8)
          setSelectedCell([row, col + 1]);
      }
    },
    [insertValue, selectedCell],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!board || board.length !== 9) return null;

  return (
    <div className="flex flex-col items-center select-none w-full max-w-[600px] mx-auto z-10">
      {/* Battle Bar */}
      <BattleBar player1={player1} player2={player2} onPlayerClick={onPlayerClick} />

      {/* Combo Indicator */}
      <div className="h-10 w-full flex justify-center items-center mb-2">
        <AnimatePresence>
          {combo >= 2 && (
            <motion.div
              initial={{ scale: 0, y: 10, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white font-black px-4 py-1.5 rounded-full shadow-[0_0_15px_rgba(239,68,68,0.6)] border border-orange-300/30"
            >
              <Flame className="w-5 h-5 animate-pulse" />
              COMBO x{combo}
              {combo >= 5 && (
                <span className="ml-1 uppercase text-[10px] tracking-widest text-orange-200">
                  Amazing
                </span>
              )}
              {combo >= 10 && (
                <span className="ml-1 uppercase text-[10px] tracking-widest text-yellow-200">
                  Unstoppable
                </span>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Grid Container */}
      <div className="relative p-1 sm:p-2 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] w-full max-w-[500px]">
        {/* The Grid */}
        <div className="grid grid-cols-9 grid-rows-9 gap-0 bg-brand-navy-light border-2 sm:border-4 border-brand-navy-light rounded-lg overflow-hidden w-full mx-auto shadow-2xl">
          {board.map((row, rIdx) =>
            row.map((cell, cIdx) => {
              const isSelected =
                selectedCell?.[0] === rIdx && selectedCell?.[1] === cIdx;
              const ownerId = ownersBoard[rIdx]?.[cIdx];

              const isP1 = ownerId === player1.id;
              const isP2 = ownerId === player2.id;
              const isInitial = cell !== 0 && !ownerId; // If filled but no owner, it was an initial clue

              // Smart Highlighting Logic
              const isSameRow = selectedCell?.[0] === rIdx;
              const isSameCol = selectedCell?.[1] === cIdx;
              const isSameBox =
                selectedCell &&
                Math.floor(rIdx / 3) === Math.floor(selectedCell[0] / 3) &&
                Math.floor(cIdx / 3) === Math.floor(selectedCell[1] / 3);
              const isHighlightZone =
                (isSameRow || isSameCol || isSameBox) && !isSelected;

              const borderRight =
                cIdx % 3 === 2 && cIdx !== 8
                  ? "border-r-[1px] sm:border-r-[2px] border-r-white/20"
                  : "border-r-[0.5px] border-r-white/5";
              const borderBottom =
                rIdx % 3 === 2 && rIdx !== 8
                  ? "border-b-[1px] sm:border-b-[2px] border-b-white/20"
                  : "border-b-[0.5px] border-b-white/5";

              let ariaLabel = `Empty cell row ${rIdx + 1} column ${cIdx + 1}`;
              if (cell !== 0) {
                if (isInitial) {
                  ariaLabel = `Given value ${cell} at row ${rIdx + 1} column ${cIdx + 1}`;
                } else if (isP1) {
                  ariaLabel = `Value ${cell} at row ${rIdx + 1} column ${cIdx + 1} solved by ${player1.username}`;
                } else if (isP2) {
                  ariaLabel = `Value ${cell} at row ${rIdx + 1} column ${cIdx + 1} solved by ${player2.username}`;
                }
              }

              return (
                <div
                  key={`${rIdx}-${cIdx}`}
                  onPointerDown={(e) => { e.preventDefault(); handleCellClick(rIdx, cIdx); }}
                  onClick={() => handleCellClick(rIdx, cIdx)}
                  role="button"
                  tabIndex={0}
                  aria-label={ariaLabel}
                  className={cn(
                    "relative aspect-square flex items-center justify-center text-lg sm:text-2xl md:text-3xl font-black cursor-pointer transition-all duration-200",
                    isInitial && "text-white",
                    isP1 && "text-red-500 bg-red-500/10 font-bold",
                    isP2 && "text-blue-500 bg-blue-500/10 font-bold",
                    isSelected
                      ? "bg-brand-gold/40 shadow-[inset_0_0_20px_rgba(255,204,0,0.6)] ring-2 ring-brand-gold z-10"
                      : !isP1 && !isP2 && "bg-[#112240]",
                    isHighlightZone && cell === 0 ? "bg-white/10" : "",
                    borderRight,
                    borderBottom,
                    rIdx === 0 && cIdx === 0 && "rounded-tl-lg",
                    rIdx === 0 && cIdx === 8 && "rounded-tr-lg",
                    rIdx === 8 && cIdx === 0 && "rounded-bl-lg",
                    rIdx === 8 && cIdx === 8 && "rounded-br-lg",
                    !ownerId && cell === 0 && "hover:bg-white/15",
                  )}
                >
                  {cell !== 0 && (
                    <motion.span
                      initial={{
                        scale: isInitial ? 1 : 0.5,
                        opacity: isInitial ? 1 : 0,
                      }}
                      animate={{ scale: isInitial ? 1 : [1.2, 1], opacity: 1 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className={cn(
                        isP1 && "drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]",
                        isP2 && "drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]",
                      )}
                    >
                      {cell}
                    </motion.span>
                  )}
                </div>
              );
            }),
          )}
        </div>
      </div>

      {/* Numpad */}
      <div className="w-full max-w-[500px] mt-4 sm:mt-8 px-2">
        <div className="grid grid-cols-5 md:grid-cols-9 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onPointerDown={(e) => { e.preventDefault(); insertValue(num); }}
              onClick={() => insertValue(num)}
              className="aspect-square bg-white/5 backdrop-blur-md border border-white/10 text-white rounded-xl font-black text-xl sm:text-2xl md:text-3xl hover:bg-brand-gold hover:text-black hover:border-brand-gold hover:scale-105 active:scale-95 transition-all flex items-center justify-center shadow-lg"
            >
              {num}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
