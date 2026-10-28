import React from 'react';
import { Color, PieceSymbol } from '@chess/core';
import { ChessPiece } from './ChessPiece.js';

interface CapturedPiecesProps {
  captured: PieceSymbol[];
  color: Color;
  advantage?: number;
}

const PIECE_ORDER: PieceSymbol[] = ['q', 'r', 'b', 'n', 'p'];

export const CapturedPieces: React.FC<CapturedPiecesProps> = ({
  captured,
  color,
  advantage,
}) => {
  const sorted = [...captured].sort(
    (a, b) => PIECE_ORDER.indexOf(a) - PIECE_ORDER.indexOf(b)
  );

  return (
    <div className="flex items-center gap-1 min-h-[22px] px-1 text-xs">
      <div className="flex items-center -space-x-1">
        {sorted.map((p, idx) => (
          <div key={idx} className="w-5 h-5 flex items-center justify-center">
            <ChessPiece type={p} color={color} className="w-4 h-4" />
          </div>
        ))}
      </div>
      {advantage !== undefined && advantage > 0 && (
        <span className="text-[11px] font-bold text-amber-800 font-mono ml-1 px-1.5 py-0.2 rounded-full bg-amber-100 border border-amber-200">
          +{advantage}
        </span>
      )}
    </div>
  );
};
