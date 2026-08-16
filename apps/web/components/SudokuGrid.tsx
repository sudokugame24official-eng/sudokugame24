"use client";
import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  SudokuGenerator,
  Difficulty,
  SudokuGrid as GridType,
  SudokuValue,
  HeuristicSolver,
} from "@repo/sudoku-engine";
import { cn } from "@/lib/utils";
import { RotateCcw, Lightbulb, Eraser, Edit3, Bot, Video } from "lucide-react";
import RewardVideoModal from "./RewardVideoModal";

interface SudokuGridProps {
  difficulty?: Difficulty;
  disabled?: boolean;
  isDaily?: boolean;
  onComplete?: (board: GridType) => void;
  onGameOver?: () => void;
  onBoardChange?: (board: GridType) => void;
  initialBoardProp?: GridType;
  solvedBoardProp?: GridType;
  onCorrectCell?: (coins: number) => void;
}

export const SudokuBoard: React.FC<SudokuGridProps> = ({
  difficulty = Difficulty.EASY,
  disabled = false,
  isDaily = false,
  onComplete,
  onGameOver,
  onBoardChange,
  initialBoardProp,
  solvedBoardProp,
  onCorrectCell,
}) => {
  const [initialBoard, setInitialBoard] = useState<GridType | null>(null);
  const [board, setBoard] = useState<GridType | null>(null);
  const [solvedBoard, setSolvedBoard] = useState<GridType | null>(null);

  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(
    null,
  );
  const [errors, setErrors] = useState<Set<string>>(new Set());
  const [foundCells, setFoundCells] = useState<Set<string>>(new Set());

  // Notes state
  const [notesMode, setNotesMode] = useState(false);
  const [notes, setNotes] = useState<Record<string, Set<number>>>({});

  // History state for Undo
  const [history, setHistory] = useState<GridType[]>([]);

  // AI Coach state
  const [coachMessage, setCoachMessage] = useState<{
    technique: string;
    text: string;
  } | null>(null);

  // Monetization: Hints & Ads
  const [hintsLeft, setHintsLeft] = useState(0); // For demo, start at 0 to show ad
  const [isAdModalOpen, setIsAdModalOpen] = useState(false);

  useEffect(() => {
    let initial, solved;
    if (initialBoardProp && solvedBoardProp) {
      initial = initialBoardProp;
      solved = solvedBoardProp;
    } else {
      const puzzle = SudokuGenerator.generate(difficulty);
      initial = puzzle.initialBoard;
      solved = puzzle.solvedBoard;
    }

    setInitialBoard(initial);
    setBoard(initial.map((row) => [...row]));
    setSolvedBoard(solved);
    setErrors(new Set());
    setFoundCells(new Set());
    setNotes({});
    setSelectedCell(null);
    setHistory([]);
  }, [difficulty, isDaily, initialBoardProp, solvedBoardProp]);

  const handleCellClick = (row: number, col: number) => {
    if (initialBoard && initialBoard[row]?.[col] === 0) {
      // Toggle selection
      if (selectedCell?.[0] === row && selectedCell?.[1] === col) {
        setSelectedCell(null);
      } else {
        setSelectedCell([row, col]);
      }
    } else {
      // If click on initial number, still select it to highlight similar numbers
      if (selectedCell?.[0] === row && selectedCell?.[1] === col) {
        setSelectedCell(null);
      } else {
        setSelectedCell([row, col]);
      }
    }
  };

  const insertValue = useCallback(
    (val: number) => {
      if (disabled || !selectedCell || !board || !solvedBoard) return;
      const [row, col] = selectedCell;

      // Cannot edit initial cells
      if (initialBoard && initialBoard[row]?.[col] !== 0) return;

      if (notesMode) {
        // Handle Notes
        if (val === 0) return;
        const key = `${row}-${col}`;
        const cellNotes = new Set(notes[key] || []);
        if (cellNotes.has(val)) {
          cellNotes.delete(val);
        } else {
          cellNotes.add(val);
        }
        setNotes((prev) => ({ ...prev, [key]: cellNotes }));

        // Clear board value if putting a note
        const newBoard = board.map((r) => [...(r || [])]);
        if (newBoard[row]) newBoard[row][col] = 0;
        setBoard(newBoard);

        const newErrors = new Set(errors);
        newErrors.delete(key);
        setErrors(newErrors);
        return;
      }

      // Save history before modifying
      setHistory((prev) => [...prev, board.map((r) => [...r]) as GridType]);

      // Handle normal insertion
      const newBoard = board.map((r) => [...(r || [])]) as GridType;
      if (newBoard[row]) {
        newBoard[row][col] = val as SudokuValue;
      }
      setBoard(newBoard);
      if (onBoardChange) onBoardChange(newBoard);

      // Clear notes for this cell
      const key = `${row}-${col}`;
      const newNotes = { ...notes };
      delete newNotes[key];
      setNotes(newNotes);

      // Clear AI Coach message when playing a move
      if (coachMessage) setCoachMessage(null);

      const newErrors = new Set(errors);
      if (val !== 0) {
        if (solvedBoard && solvedBoard[row]?.[col] !== val) {
          newErrors.add(key);
        } else {
          newErrors.delete(key);
          // Correct guess logic
          if (!foundCells.has(key)) {
            const newFound = new Set(foundCells);
            newFound.add(key);
            setFoundCells(newFound);
            if (onCorrectCell) onCorrectCell(5);
          }

          // Check if board is complete
          let isComplete = true;
          if (solvedBoard) {
            for (let r = 0; r < 9; r++) {
              for (let c = 0; c < 9; c++) {
                if (
                  newBoard[r]?.[c] === 0 ||
                  newBoard[r]?.[c] !== solvedBoard[r]?.[c]
                ) {
                  isComplete = false;
                  break;
                }
              }
              if (!isComplete) break;
            }
          } else {
            isComplete = false;
          }

          if (isComplete && onComplete) {
            onComplete(newBoard);
          }
        }
      } else {
        newErrors.delete(key);
      }

      setErrors(newErrors);

      if (newErrors.size >= 3 && onGameOver) {
        onGameOver();
      }
    },
    [
      selectedCell,
      board,
      solvedBoard,
      initialBoard,
      notesMode,
      notes,
      errors,
      disabled,
      foundCells,
      onComplete,
      onGameOver,
      onCorrectCell,
    ],
  );

  const handleUndo = useCallback(() => {
    if (history.length === 0 || disabled) return;
    const newHistory = [...history];
    const previousBoard = newHistory.pop();
    if (previousBoard) {
      setBoard(previousBoard);
      setHistory(newHistory);
      // Optional: Re-evaluate errors if necessary, but this keeps it simple
    }
  }, [history, disabled]);

  const handleHint = useCallback(() => {
    if (disabled || !board) return;

    if (hintsLeft <= 0) {
      setIsAdModalOpen(true);
      return;
    }

    const hint = HeuristicSolver.getHint(board);

    if (hint) {
      // Consume a hint
      setHintsLeft((prev) => prev - 1);

      const {
        row: targetRow,
        col: targetCol,
        value: correctValue,
        technique,
        explanation,
      } = hint;

      // Show AI Coach message
      setCoachMessage({ technique, text: explanation });

      // Only fill it automatically if it's not a complex technique (Optional, but let's just highlight it or fill it)
      // Save history
      setHistory((prev) => [...prev, board.map((r) => [...r]) as GridType]);

      const newBoard = board.map((r) => [...r]) as GridType;
      if (newBoard[targetRow]) {
        newBoard[targetRow][targetCol] = correctValue as SudokuValue;
      }
      setBoard(newBoard);
      if (onBoardChange) onBoardChange(newBoard);

      const key = `${targetRow}-${targetCol}`;
      const newFound = new Set(foundCells);
      newFound.add(key);
      setFoundCells(newFound);

      // Clear notes for this cell
      const newNotes = { ...notes };
      delete newNotes[key];
      setNotes(newNotes);

      // Auto-select to draw attention
      setSelectedCell([targetRow, targetCol]);
    } else {
      setCoachMessage({
        technique: "Terminé",
        text: "La grille semble déjà résolue ou je n'arrive pas à trouver d'indice.",
      });
    }
  }, [board, disabled, foundCells, notes, onBoardChange, hintsLeft]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const key = e.key;
      if (key >= "1" && key <= "9") {
        insertValue(parseInt(key));
      } else if (key === "Backspace" || key === "Delete" || key === "0") {
        insertValue(0);
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

  if (!board) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
          <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  // Find the selected value for highlighting
  const selectedValue =
    selectedCell && board[selectedCell[0]]?.[selectedCell[1]];

  return (
    <div className="flex flex-col items-center select-none w-full max-w-[600px] mx-auto z-10 overflow-hidden">
      {/* Top HUD */}
      <div className="mb-6 flex justify-between w-full max-w-[450px] bg-card/40 backdrop-blur-xl border border-white/10 p-3 rounded-2xl shadow-xl">
        <div className="flex flex-col items-center flex-1 border-r border-white/10">
          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">
            Difficulté
          </span>
          <span
            className={cn(
              "text-sm font-black uppercase",
              difficulty === "EASY"
                ? "text-green-400"
                : difficulty === "MEDIUM"
                  ? "text-yellow-400"
                  : difficulty === "HARD"
                    ? "text-orange-500"
                    : "text-red-600",
            )}
          >
            {difficulty}
          </span>
        </div>
        <div className="flex flex-col items-center flex-1 border-r border-white/10">
          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">
            Erreurs
          </span>
          <span className="text-sm font-black text-red-500">
            {errors.size} / 3
          </span>
        </div>
        <div className="flex flex-col items-center flex-1">
          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">
            Score
          </span>
          <span className="text-sm font-black text-[#FFCC00]">2450</span>
        </div>
      </div>

      {/* AI Coach Message Banner */}
      <AnimatePresence>
        {coachMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-[500px] mb-4 bg-brand-navy border border-brand-gold/50 p-4 rounded-2xl shadow-[0_0_30px_rgba(255,204,0,0.15)] flex items-start gap-4"
          >
            <div className="bg-brand-gold/20 p-2 rounded-full text-brand-gold">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-brand-gold font-black uppercase text-sm tracking-widest mb-1">
                IA Coach: {coachMessage.technique}
              </h4>
              <p className="text-white/90 text-sm leading-relaxed">
                {coachMessage.text}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grid Container */}
      <div className="relative p-1 sm:p-2 md:p-3 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] w-full max-w-[500px]">
        {/* The Grid itself */}
        <div className="grid grid-cols-9 grid-rows-9 gap-0 bg-brand-navy-light border-2 sm:border-4 border-brand-navy-light rounded-lg overflow-hidden w-full mx-auto shadow-2xl">
          {board.map((row, rIdx) =>
            row.map((cell, cIdx) => {
              const isInitial =
                initialBoard && initialBoard[rIdx]?.[cIdx] !== 0;
              const isSelected =
                selectedCell?.[0] === rIdx && selectedCell?.[1] === cIdx;
              const isError = errors.has(`${rIdx}-${cIdx}`);

              // Smart Highlighting Logic
              const isSameRow = selectedCell?.[0] === rIdx;
              const isSameCol = selectedCell?.[1] === cIdx;
              const isSameBox =
                selectedCell &&
                Math.floor(rIdx / 3) === Math.floor(selectedCell[0] / 3) &&
                Math.floor(cIdx / 3) === Math.floor(selectedCell[1] / 3);
              const isHighlightZone =
                (isSameRow || isSameCol || isSameBox) && !isSelected;

              const isSameValue =
                selectedValue &&
                Number(selectedValue) !== 0 &&
                cell === selectedValue &&
                !isSelected;

              // Block borders
              const borderRight =
                cIdx % 3 === 2 && cIdx !== 8
                  ? "border-r-[1px] sm:border-r-[2px] border-r-white/20"
                  : "border-r-[0.5px] border-r-white/5";
              const borderBottom =
                rIdx % 3 === 2 && rIdx !== 8
                  ? "border-b-[1px] sm:border-b-[2px] border-b-white/20"
                  : "border-b-[0.5px] border-b-white/5";

              const cellNotes = notes[`${rIdx}-${cIdx}`];

              return (
                <div
                  key={`${rIdx}-${cIdx}`}
                  onClick={() => handleCellClick(rIdx, cIdx)}
                  className={cn(
                    "relative aspect-square flex items-center justify-center text-lg sm:text-2xl md:text-3xl font-black cursor-pointer transition-all duration-200",
                    isInitial ? "text-white" : "text-brand-gold", // Initial white, Player gold
                    isSelected
                      ? "bg-brand-orange/40 shadow-[inset_0_0_20px_rgba(255,69,0,0.6)] ring-2 ring-brand-orange z-10"
                      : "bg-[#112240]", // Selected cell
                    isHighlightZone && !isError ? "bg-brand-orange/10" : "", // Cross highlight
                    isSameValue
                      ? "bg-brand-gold/20 ring-1 ring-brand-gold/50"
                      : "", // Same number highlight
                    isError ? "bg-red-500/30 text-red-500 animate-shake" : "",
                    borderRight,
                    borderBottom,
                    rIdx === 0 && cIdx === 0 && "rounded-tl-lg",
                    rIdx === 0 && cIdx === 8 && "rounded-tr-lg",
                    rIdx === 8 && cIdx === 0 && "rounded-bl-lg",
                    rIdx === 8 && cIdx === 8 && "rounded-br-lg",
                    "hover:bg-white/15",
                  )}
                >
                  {cell !== 0 ? (
                    <motion.span
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: [1.2, 1], opacity: 1 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                    >
                      {cell}
                    </motion.span>
                  ) : cellNotes && cellNotes.size > 0 ? (
                    <div className="grid grid-cols-3 grid-rows-3 w-full h-full p-0.5">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                        <div
                          key={n}
                          className="flex items-center justify-center text-[7px] sm:text-[9px] md:text-[10px] text-white/50 font-bold leading-none"
                        >
                          {cellNotes.has(n) ? n : ""}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            }),
          )}
        </div>
      </div>

      {/* Tools & Numpad */}
      <div className="w-full max-w-[500px] mt-4 sm:mt-8 flex flex-col gap-3 sm:gap-4 px-2">
        {/* Tools */}
        <div className="flex justify-between items-center bg-card/40 backdrop-blur-xl p-2 rounded-2xl border border-white/10">
          <button
            onClick={handleUndo}
            disabled={history.length === 0}
            className={cn(
              "flex-1 flex flex-col items-center gap-1 py-2 transition-colors",
              history.length === 0
                ? "opacity-50 cursor-not-allowed text-muted-foreground"
                : "text-muted-foreground hover:text-white",
            )}
          >
            <RotateCcw className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Undo
            </span>
          </button>
          <button
            onClick={() => insertValue(0)}
            className="flex-1 flex flex-col items-center gap-1 py-2 text-muted-foreground hover:text-red-400 transition-colors"
          >
            <Eraser className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Erase
            </span>
          </button>
          <button
            onClick={() => setNotesMode(!notesMode)}
            className={cn(
              "flex-1 flex flex-col items-center gap-1 py-2 transition-colors",
              notesMode
                ? "text-blue-400 bg-blue-400/10 rounded-xl"
                : "text-muted-foreground hover:text-white",
            )}
          >
            <Edit3 className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Notes {notesMode ? "ON" : "OFF"}
            </span>
          </button>
          <button
            onClick={handleHint}
            className="flex-1 flex flex-col items-center gap-1 py-2 text-muted-foreground hover:text-[#FFCC00] transition-colors relative"
          >
            {hintsLeft <= 0 ? (
              <div className="absolute -top-1 right-2 bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-1 shadow-lg">
                <Video className="w-2 h-2" /> AD
              </div>
            ) : (
              <div className="absolute -top-1 right-2 bg-[#FFCC00] text-black text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-lg">
                {hintsLeft}
              </div>
            )}
            <Lightbulb className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Hint
            </span>
          </button>
        </div>

        {/* Numpad */}
        <div className="grid grid-cols-5 md:grid-cols-9 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              onClick={() => insertValue(num)}
              className="aspect-square bg-white/5 backdrop-blur-md border border-white/10 text-white rounded-xl font-black text-xl sm:text-2xl md:text-3xl hover:bg-brand-orange hover:text-white hover:border-brand-orange hover:scale-105 active:scale-95 transition-all flex items-center justify-center shadow-lg"
            >
              {num}
            </button>
          ))}
        </div>
      </div>

      <RewardVideoModal
        isOpen={isAdModalOpen}
        onClose={() => setIsAdModalOpen(false)}
        onReward={() => {
          setHintsLeft((prev) => prev + 1);
          setIsAdModalOpen(false);
        }}
      />
    </div>
  );
};
