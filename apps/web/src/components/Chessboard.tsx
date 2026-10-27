import React, { useState } from 'react';
import { Color, DetailedMove, GameSnapshot, PieceSymbol, Square } from '@chess/core';
import { ChessPiece } from './ChessPiece.js';

interface ChessboardProps {
  snapshot: GameSnapshot;
  legalMoves: DetailedMove[];
  orientation: Color;
  interactive: boolean;
  onMove: (from: Square, to: Square, promotion?: PieceSymbol) => void;
}

export const Chessboard: React.FC<ChessboardProps> = ({
  snapshot,
  legalMoves,
  orientation,
  interactive,
  onMove,
}) => {
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [pendingPromotion, setPendingPromotion] = useState<{ from: Square; to: Square } | null>(null);
  const [draggedSquare, setDraggedSquare] = useState<Square | null>(null);

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
    if (!interactive) return;

    // If already selecting a square and clicked a legal target
    if (selectedSquare && activeLegalTargets.includes(square)) {
      triggerMove(selectedSquare, square);
      return;
    }

    // Otherwise, select piece if it matches active side
    const movesFromHere = legalMoves.filter((m) => m.from === square);
    if (movesFromHere.length > 0) {
      setSelectedSquare(square);
    } else {
      setSelectedSquare(null);
    }
  };

  const triggerMove = (from: Square, to: Square) => {
    // Check if move is a promotion
    const isPromo = legalMoves.some(
      (m) => m.from === from && m.to === to && m.promotion
    );

    if (isPromo) {
      setPendingPromotion({ from, to });
    } else {
      onMove(from, to);
      setSelectedSquare(null);
    }
  };

  const handlePromotionSelect = (piece: PieceSymbol) => {
    if (!pendingPromotion) return;
    onMove(pendingPromotion.from, pendingPromotion.to, piece);
    setPendingPromotion(null);
    setSelectedSquare(null);
  };

  // Drag and Drop handlers
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

  // Extract piece on a square from FEN
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

  return (
    <div className="relative aspect-square w-full max-w-[560px] rounded-lg shadow-2xl overflow-hidden border border-slate-700 select-none">
      {/* 8x8 Board Grid */}
      <div className="grid grid-cols-8 grid-rows-8 w-full h-full">
        {displayRanks.map((rank, rIdx) =>
          displayFiles.map((file, fIdx) => {
            const square = `${file}${rank}` as Square;
            const isLight = (fIdx + rIdx) % 2 === (orientation === 'w' ? 0 : 0);
            const piece = getPieceOnSquare(square);
            const isSelected = selectedSquare === square;
            const isTarget = activeLegalTargets.includes(square);
            const isCheck = checkSquare === square;
            const isLastMoveFrom = snapshot.lastMove?.from === square;
            const isLastMoveTo = snapshot.lastMove?.to === square;

            return (
              <div
                key={square}
                onClick={() => handleSquareClick(square)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, square)}
                className={`relative flex items-center justify-center cursor-pointer transition-colors ${
                  isLight ? 'bg-[#f0d9b5]' : 'bg-[#b58863]'
                }`}
              >
                {/* Last move highlight */}
                {(isLastMoveFrom || isLastMoveTo) && (
                  <div className="absolute inset-0 bg-amber-400/35 pointer-events-none" />
                )}

                {/* Selected square highlight */}
                {isSelected && (
                  <div className="absolute inset-0 bg-emerald-500/50 pointer-events-none" />
                )}

                {/* Check highlight */}
                {isCheck && (
                  <div className="absolute inset-0 bg-rose-600/60 animate-pulse pointer-events-none" />
                )}

                {/* Legal destination marker */}
                {isTarget && (
                  <div className="absolute z-10 flex items-center justify-center pointer-events-none">
                    {piece ? (
                      <div className="w-12 h-12 rounded-full border-4 border-black/30" />
                    ) : (
                      <div className="w-3.5 h-3.5 rounded-full bg-black/25" />
                    )}
                  </div>
                )}

                {/* Piece Rendering */}
                {piece && (
                  <div
                    draggable={interactive && piece.color === snapshot.sideToMove}
                    onDragStart={(e) => handleDragStart(e, square)}
                    className="w-full h-full p-1 cursor-grab active:cursor-grabbing transform transition-transform hover:scale-105"
                  >
                    <ChessPiece type={piece.type} color={piece.color} />
                  </div>
                )}

                {/* Coordinate labels */}
                {fIdx === 0 && (
                  <span
                    className={`absolute top-0.5 left-1 text-[10px] font-bold ${
                      isLight ? 'text-[#b58863]' : 'text-[#f0d9b5]'
                    }`}
                  >
                    {rank}
                  </span>
                )}
                {rIdx === 7 && (
                  <span
                    className={`absolute bottom-0.5 right-1 text-[10px] font-bold ${
                      isLight ? 'text-[#b58863]' : 'text-[#f0d9b5]'
                    }`}
                  >
                    {file}
                  </span>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Promotion Dialog Modal */}
      {pendingPromotion && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-2xl flex flex-col items-center">
            <h3 className="text-lg font-bold text-white mb-4">Promote Pawn</h3>
            <div className="flex gap-4">
              {(['q', 'r', 'b', 'n'] as PieceSymbol[]).map((p) => (
                <button
                  key={p}
                  onClick={() => handlePromotionSelect(p)}
                  className="w-16 h-16 bg-slate-700 hover:bg-amber-600/80 p-2 rounded-lg border border-slate-600 transition-colors flex items-center justify-center"
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
