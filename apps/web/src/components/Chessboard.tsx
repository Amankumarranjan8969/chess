import React, { useState } from 'react';
import { Color, DetailedMove, GameSnapshot, PieceSymbol, Square } from '@chess/core';
import { ChessPiece } from './ChessPiece.js';

export type BoardTheme = 'green' | 'wood' | 'ocean' | 'classic' | 'dark';

export interface BoardThemeColors {
  light: string;
  dark: string;
  lightCoord: string;
  darkCoord: string;
}

export const BOARD_THEMES: Record<BoardTheme, BoardThemeColors> = {
  green: {
    light: '#ebecd0',
    dark: '#739552',
    lightCoord: '#739552',
    darkCoord: '#ebecd0',
  },
  wood: {
    light: '#f0d9b5',
    dark: '#b58863',
    lightCoord: '#b58863',
    darkCoord: '#f0d9b5',
  },
  ocean: {
    light: '#dee3e6',
    dark: '#5d8aa8',
    lightCoord: '#5d8aa8',
    darkCoord: '#dee3e6',
  },
  classic: {
    light: '#e0e0e0',
    dark: '#708090',
    lightCoord: '#708090',
    darkCoord: '#e0e0e0',
  },
  dark: {
    light: '#4a5568',
    dark: '#2d3748',
    lightCoord: '#2d3748',
    darkCoord: '#e2e8f0',
  },
};

export interface Arrow {
  from: Square;
  to: Square;
  color?: string;
}

interface ChessboardProps {
  snapshot: GameSnapshot;
  legalMoves: DetailedMove[];
  orientation: Color;
  interactive: boolean;
  theme?: BoardTheme;
  hintMove?: { from: Square; to: Square } | null;
  onMove?: (from: Square, to: Square, promotion?: PieceSymbol) => void;
}

export const Chessboard: React.FC<ChessboardProps> = ({
  snapshot,
  legalMoves,
  orientation,
  interactive,
  theme = 'green',
  hintMove,
  onMove,
}) => {
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<{ from: Square; to: Square } | null>(null);
  const [draggedSquare, setDraggedSquare] = useState<Square | null>(null);

  // Right-click arrows and highlights
  const [arrows, setArrows] = useState<Arrow[]>([]);
  const [highlightedSquares, setHighlightedSquares] = useState<Set<Square>>(new Set());
  const [rightClickStart, setRightClickStart] = useState<Square | null>(null);

  const colors = BOARD_THEMES[theme];

  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  const displayFiles = orientation === 'w' ? files : [...files].reverse();
  const displayRanks = orientation === 'w' ? ranks : [...ranks].reverse();

  // Find king square if in check
  let checkSquare: Square | null = null;
  if (snapshot.isCheck) {
    const turn = snapshot.sideToMove;
    const board = snapshot.fen.split(' ')[0];
    const rows = board.split('/');
    for (let r = 0; r < 8; r++) {
      let f = 0;
      for (const char of rows[r]) {
        if (!isNaN(parseInt(char, 10))) {
          f += parseInt(char, 10);
        } else {
          const pieceColor = char === char.toUpperCase() ? 'w' : 'b';
          const pieceType = char.toLowerCase();
          if (pieceType === 'k' && pieceColor === turn) {
            checkSquare = `${files[f]}${ranks[r]}` as Square;
          }
          f++;
        }
      }
    }
  }

  // Legal moves for selected square
  const activeLegalTargets = selectedSquare
    ? legalMoves
        .filter((m) => m.from === selectedSquare)
        .map((m) => m.to)
    : [];

  const handleSquareClick = (square: Square) => {
    // Clear tactical arrows on left click
    if (arrows.length > 0 || highlightedSquares.size > 0) {
      setArrows([]);
      setHighlightedSquares(new Set());
    }

    if (!interactive) return;

    if (selectedSquare && activeLegalTargets.includes(square)) {
      triggerMove(selectedSquare, square);
      return;
    }

    const movesFromHere = legalMoves.filter((m) => m.from === square);
    if (movesFromHere.length > 0) {
      setSelectedSquare(square);
    } else {
      setSelectedSquare(null);
    }
  };

  const triggerMove = (from: Square, to: Square) => {
    const isPromo = legalMoves.some(
      (m) => m.from === from && m.to === to && m.promotion
    );

    if (isPromo) {
      setPendingPromotion({ from, to });
    } else {
      onMove?.(from, to);
      setSelectedSquare(null);
      setArrows([]);
      setHighlightedSquares(new Set());
    }
  };

  const handlePromotionSelect = (piece: PieceSymbol) => {
    if (!pendingPromotion) return;
    onMove?.(pendingPromotion.from, pendingPromotion.to, piece);
    setPendingPromotion(null);
    setSelectedSquare(null);
  };

  // Drag and Drop
  const handleDragStart = (e: React.DragEvent, square: Square) => {
    if (!interactive) return;
    const movesFromHere = legalMoves.filter((m) => m.from === square);
    if (movesFromHere.length === 0) {
      e.preventDefault();
      return;
    }
    setDraggedSquare(square);
    setSelectedSquare(square);
    e.dataTransfer.setData('text/plain', square);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetSquare: Square) => {
    e.preventDefault();
    const source = draggedSquare || (e.dataTransfer.getData('text/plain') as Square);
    if (source && source !== targetSquare) {
      const isLegal = legalMoves.some(
        (m) => m.from === source && m.to === targetSquare
      );
      if (isLegal) {
        triggerMove(source, targetSquare);
      }
    }
    setDraggedSquare(null);
  };

  // Right-click Tactical Arrows
  const handleMouseDown = (e: React.MouseEvent, square: Square) => {
    if (e.button === 2) {
      // Right click
      e.preventDefault();
      setRightClickStart(square);
    }
  };

  const handleMouseUp = (e: React.MouseEvent, square: Square) => {
    if (e.button === 2) {
      e.preventDefault();
      if (rightClickStart) {
        if (rightClickStart === square) {
          // Toggle square highlight
          setHighlightedSquares((prev) => {
            const next = new Set(prev);
            if (next.has(square)) {
              next.delete(square);
            } else {
              next.add(square);
            }
            return next;
          });
        } else {
          // Add or remove arrow
          setArrows((prev) => {
            const exists = prev.some(
              (a) => a.from === rightClickStart && a.to === square
            );
            if (exists) {
              return prev.filter(
                (a) => !(a.from === rightClickStart && a.to === square)
              );
            }
            return [...prev, { from: rightClickStart, to: square, color: '#f59e0b' }];
          });
        }
      }
      setRightClickStart(null);
    }
  };

  const getPieceOnSquare = (sq: Square): { type: PieceSymbol; color: Color } | null => {
    const fIdx = files.indexOf(sq[0]);
    const rIdx = ranks.indexOf(sq[1]);
    const fenRows = snapshot.fen.split(' ')[0].split('/');
    const row = fenRows[rIdx];

    let currentFile = 0;
    for (const char of row) {
      if (!isNaN(parseInt(char, 10))) {
        currentFile += parseInt(char, 10);
      } else {
        if (currentFile === fIdx) {
          return {
            type: char.toLowerCase() as PieceSymbol,
            color: char === char.toUpperCase() ? 'w' : 'b',
          };
        }
        currentFile++;
      }
    }
    return null;
  };

  // Helper to get SVG coordinates (0-800 scale)
  const getSquareCoordinates = (sq: Square): { x: number; y: number } => {
    const fIdx = displayFiles.indexOf(sq[0]);
    const rIdx = displayRanks.indexOf(sq[1]);
    return {
      x: fIdx * 100 + 50,
      y: rIdx * 100 + 50,
    };
  };

  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      className="relative aspect-square w-full h-full max-w-full rounded-2xl shadow-2xl overflow-hidden border-2 border-stone-800/80 dark:border-stone-700/80 select-none"
    >
      {/* 8x8 Board Grid */}
      <div className="grid grid-cols-8 grid-rows-8 w-full h-full">
        {displayRanks.map((rank, rIdx) =>
          displayFiles.map((file, fIdx) => {
            const square = `${file}${rank}` as Square;
            const isLight = (fIdx + rIdx) % 2 === 0;
            const piece = getPieceOnSquare(square);
            const isSelected = selectedSquare === square;
            const isTarget = activeLegalTargets.includes(square);
            const isCheck = checkSquare === square;
            const isLastMoveFrom = snapshot.lastMove?.from === square;
            const isLastMoveTo = snapshot.lastMove?.to === square;
            const isRightClickHighlight = highlightedSquares.has(square);

            return (
              <div
                key={square}
                onClick={() => handleSquareClick(square)}
                onMouseDown={(e) => handleMouseDown(e, square)}
                onMouseUp={(e) => handleMouseUp(e, square)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, square)}
                style={{
                  backgroundColor: isLight ? colors.light : colors.dark,
                }}
                className="relative flex items-center justify-center cursor-pointer transition-colors"
              >
                {/* Last move highlight (Chess.com signature #bbcb43) */}
                {(isLastMoveFrom || isLastMoveTo) && (
                  <div className="absolute inset-0 bg-[#bbcb43]/60 pointer-events-none" />
                )}

                {/* Selected square highlight */}
                {isSelected && (
                  <div className="absolute inset-0 bg-[#bbcb43]/85 pointer-events-none ring-2 ring-inset ring-amber-400" />
                )}

                {/* King in Check indicator */}
                {isCheck && (
                  <div className="absolute inset-0 bg-red-600/70 rounded-full animate-pulse pointer-events-none filter blur-[1px]" />
                )}

                {/* Right-click square highlight */}
                {isRightClickHighlight && (
                  <div className="absolute inset-0 bg-amber-500/50 rounded-md pointer-events-none" />
                )}

                {/* Legal destination marker */}
                {isTarget && (
                  <div className="absolute z-10 flex items-center justify-center pointer-events-none">
                    {piece ? (
                      <div className="w-[58px] h-[58px] rounded-full border-[5px] border-black/20" />
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-black/20" />
                    )}
                  </div>
                )}

                {/* Piece Rendering */}
                {piece && (
                  <div
                    draggable={interactive && piece.color === snapshot.sideToMove}
                    onDragStart={(e) => handleDragStart(e, square)}
                    className="w-full h-full p-1 cursor-grab active:cursor-grabbing hover:scale-[1.05] transition-transform duration-100 flex items-center justify-center"
                  >
                    <ChessPiece type={piece.type} color={piece.color} />
                  </div>
                )}

                {/* Corner Coordinates */}
                {fIdx === 0 && (
                  <span
                    style={{ color: isLight ? colors.lightCoord : colors.darkCoord }}
                    className="absolute top-0.5 left-1 text-[11px] font-bold pointer-events-none"
                  >
                    {rank}
                  </span>
                )}
                {rIdx === 7 && (
                  <span
                    style={{ color: isLight ? colors.lightCoord : colors.darkCoord }}
                    className="absolute bottom-0.5 right-1 text-[11px] font-bold pointer-events-none"
                  >
                    {file}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* SVG Layer for Tactical Arrows & Hint Arrow */}
      <svg
        viewBox="0 0 800 800"
        className="absolute inset-0 w-full h-full pointer-events-none z-20"
      >
        <defs>
          {/* Custom Orange Right-Click Arrow Marker */}
          <marker
            id="arrowhead-orange"
            markerWidth="6"
            markerHeight="6"
            refX="4"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 6 3, 0 6" fill="#f59e0b" opacity="0.85" />
          </marker>

          {/* Engine Hint Arrow Marker */}
          <marker
            id="arrowhead-hint"
            markerWidth="6"
            markerHeight="6"
            refX="4"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 6 3, 0 6" fill="#10b981" opacity="0.9" />
          </marker>
        </defs>

        {/* User Right-Click Arrows */}
        {arrows.map((arr, i) => {
          const from = getSquareCoordinates(arr.from);
          const to = getSquareCoordinates(arr.to);
          const dx = to.x - from.x;
          const dy = to.y - from.y;
          const dist = Math.hypot(dx, dy);
          if (dist === 0) return null;
          // Shorten slightly so arrow head points at center
          const targetX = to.x - (dx / dist) * 20;
          const targetY = to.y - (dy / dist) * 20;

          return (
            <line
              key={i}
              x1={from.x}
              y1={from.y}
              x2={targetX}
              y2={targetY}
              stroke="#f59e0b"
              strokeWidth="14"
              strokeLinecap="round"
              opacity="0.85"
              markerEnd="url(#arrowhead-orange)"
            />
          );
        })}

        {/* Engine Suggested Best Move Arrow */}
        {hintMove && (
          (() => {
            const from = getSquareCoordinates(hintMove.from);
            const to = getSquareCoordinates(hintMove.to);
            const dx = to.x - from.x;
            const dy = to.y - from.y;
            const dist = Math.hypot(dx, dy);
            if (dist === 0) return null;
            const targetX = to.x - (dx / dist) * 22;
            const targetY = to.y - (dy / dist) * 22;

            return (
              <line
                x1={from.x}
                y1={from.y}
                x2={targetX}
                y2={targetY}
                stroke="#10b981"
                strokeWidth="16"
                strokeLinecap="round"
                opacity="0.9"
                markerEnd="url(#arrowhead-hint)"
              />
            );
          })()
        )}
      </svg>

      {/* Promotion Dialog Modal */}
      {pendingPromotion && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-md">
          <div className="bg-[#21201d] border border-[#33302a] rounded-2xl p-6 shadow-2xl flex flex-col items-center">
            <h3 className="text-sm font-bold text-white mb-4 tracking-wider uppercase">
              Choose Promotion Piece
            </h3>
            <div className="flex gap-4">
              {(['q', 'r', 'b', 'n'] as PieceSymbol[]).map((p) => (
                <button
                  key={p}
                  onClick={() => handlePromotionSelect(p)}
                  className="w-16 h-16 bg-[#262421] hover:bg-[#739552] p-2 rounded-xl border border-[#38342e] transition-all hover:scale-110 flex items-center justify-center shadow-lg"
                >
                  <ChessPiece type={p} color={snapshot.sideToMove} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
