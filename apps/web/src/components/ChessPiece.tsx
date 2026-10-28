import React from 'react';
import { Color, PieceSymbol } from '@chess/core';

interface PieceProps {
  type: PieceSymbol;
  color: Color;
  className?: string;
}

export const ChessPiece: React.FC<PieceProps> = ({
  type,
  color,
  className = 'w-full h-full',
}) => {
  const isWhite = color === 'w';
  const strokeColor = '#1a1917';
  const strokeWidth = '1.7';
  const fillWhite = '#fdfdfd';
  const fillBlack = '#2b2723';
  const accentWhite = '#ffffff';

  return (
    <div
      className={`${className} flex items-center justify-center select-none transition-transform duration-100 filter drop-shadow-[0_5px_4px_rgba(0,0,0,0.45)]`}
    >
      <svg
        viewBox="0 0 45 45"
        className="w-full h-full pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* ======================================================== */}
        {/* WHITE PIECES                                             */}
        {/* ======================================================== */}

        {/* WHITE PAWN */}
        {isWhite && type === 'p' && (
          <g fill={fillWhite} stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
            <path d="M 22.5,9 C 20,9 18,11 18,13.5 C 18,14.8 18.6,16 19.5,16.8 C 17.5,18.5 16,21 16,24 C 16,26.5 17.2,28.5 19,29.8 C 15.5,31.2 12,34.5 12,39.5 L 33,39.5 C 33,34.5 29.5,31.2 26,29.8 C 27.8,28.5 29,26.5 29,24 C 29,21 27.5,18.5 25.5,16.8 C 26.4,16 27,14.8 27,13.5 C 27,11 25,9 22.5,9 Z" />
            <path d="M 17,36 L 28,36" fill="none" />
            <path d="M 15.5,39.5 L 29.5,39.5" fill="none" />
          </g>
        )}

        {/* WHITE KNIGHT (HORSE) - HIGH VISIBILITY & DEFINED STYLING */}
        {isWhite && type === 'n' && (
          <g fill={fillWhite} stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
            {/* Main Horse Head & Neck Contour */}
            <path
              d="M 22,7 C 23.5,7 25,8.2 25.5,10 C 27.5,9.5 29.5,10.5 30,12 C 30.5,13.5 29,15 28.5,16 C 31,18 33.5,21 34,24.5 C 34.8,30 32,36 31,39.5 L 14,39.5 C 14.5,34 14,29 10,26 C 8.5,25 7.5,23 8,21 C 8.5,19 10.5,18.5 12,19 C 13,19.3 14,20 14.5,21 C 15,21.5 16,21.5 16.5,20.5 C 16.5,18 16,14.5 17,11.5 C 18,8.5 20,7 22,7 Z"
            />
            {/* Mane Detail Arches */}
            <path d="M 24,10 C 27,13 29,17 29.5,22" fill="none" />
            <path d="M 28,15 C 30.5,18 32,22 32.5,27" fill="none" />
            {/* Snout, Nostril, Jaw & Expressive Eye */}
            <circle cx="12.5" cy="22" r="1.3" fill={strokeColor} stroke="none" />
            <circle cx="18" cy="14" r="1.8" fill={strokeColor} stroke="none" />
            <circle cx="18.5" cy="13.5" r="0.6" fill={fillWhite} stroke="none" />
            <path d="M 12,23.5 C 14.5,24.5 16,23 17.5,22" fill="none" strokeWidth="1.5" />
            <path d="M 16,36 L 29,36" fill="none" />
          </g>
        )}

        {/* WHITE BISHOP */}
        {isWhite && type === 'b' && (
          <g fill={fillWhite} stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
            <path d="M 9,37 C 12,36 19,37 22.5,35 C 26,37 33,36 36,37 C 36,37 37.5,38 39,39.5 L 6,39.5 C 7.5,38 9,37 9,37 Z" />
            <path d="M 15,33 C 17.5,35 27.5,35 30,33 C 30.5,31 30,30 30,30 C 30,27 27.5,25.5 27.5,23 C 27.5,20.5 29,18.5 29,15.5 C 29,10.5 25.5,7.5 22.5,7.5 C 19.5,7.5 16,10.5 16,15.5 C 16,18.5 17.5,20.5 17.5,23 C 17.5,25.5 15,27 15,30 C 15,30 14.5,31 15,33 Z" />
            <circle cx="22.5" cy="5" r="2.3" />
            <path d="M 17,25 L 28,25" fill="none" />
            <path d="M 15.5,29 L 29.5,29" fill="none" />
            <path d="M 22.5,12 L 22.5,18" fill="none" />
            <path d="M 19.5,14.5 L 25.5,14.5" fill="none" />
          </g>
        )}

        {/* WHITE ROOK */}
        {isWhite && type === 'r' && (
          <g fill={fillWhite} stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
            <path d="M 9,39.5 L 36,39.5 L 36,36 L 9,36 Z" />
            <path d="M 12,36 L 12,32 L 33,32 L 33,36 Z" />
            <path d="M 11,14 L 11,8.5 L 15.5,8.5 L 15.5,11 L 20.5,11 L 20.5,8.5 L 24.5,8.5 L 24.5,11 L 29.5,11 L 29.5,8.5 L 34,8.5 L 34,14 Z" />
            <path d="M 34,14 L 31,17 L 14,17 L 11,14" />
            <path d="M 31,17 L 31,29.5 L 14,29.5 L 14,17" />
            <path d="M 31,29.5 L 33,32 L 12,32 L 14,29.5" />
            <path d="M 11,14 L 34,14" fill="none" />
            <path d="M 14,29.5 L 31,29.5" fill="none" />
          </g>
        )}

        {/* WHITE QUEEN */}
        {isWhite && type === 'q' && (
          <g fill={fillWhite} stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
            <path d="M 9,26 C 17.5,24.5 30,24.5 36,26 L 38.5,13.5 L 31,25 L 22.5,9.5 L 14,25 L 6.5,13.5 Z" />
            <path d="M 9,26 C 9,28 10.5,28 11.5,30 C 12.5,31.5 12.5,31 12,33.5 C 10.5,34.5 11,36 11,36 C 9.5,37.5 11,38.5 11,38.5 L 34,38.5 C 34,38.5 35.5,37.5 34,36 C 34,36 34.5,34.5 33,33.5 C 32.5,31 32.5,31.5 33.5,30 C 34.5,28 36,28 36,26 Z" />
            <circle cx="6" cy="12" r="2.2" />
            <circle cx="14" cy="8.5" r="2.2" />
            <circle cx="22.5" cy="7.5" r="2.2" />
            <circle cx="31" cy="8.5" r="2.2" />
            <circle cx="39" cy="12" r="2.2" />
            <path d="M 12,32 L 33,32" fill="none" />
            <path d="M 11,36 L 34,36" fill="none" />
          </g>
        )}

        {/* WHITE KING */}
        {isWhite && type === 'k' && (
          <g fill={fillWhite} stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
            {/* Apex Cross */}
            <path d="M 22.5,11.5 L 22.5,5" fill="none" strokeWidth="2" />
            <path d="M 19,8 L 26,8" fill="none" strokeWidth="2" />
            {/* Crown & Arches */}
            <path d="M 22.5,25 C 22.5,25 27,17.5 25.5,14 C 24,11 21,11 19.5,14 C 18,17.5 22.5,25 22.5,25 Z" />
            <path d="M 12.5,37 C 15,40.5 30,40.5 32.5,37 C 33.5,35.5 33,35 32.5,34 C 31.5,32 30.5,31.5 31,29.5 C 31.5,27.5 30,26 29.5,25 C 29,24 28,23 27,22.5 C 26,22 25,22 22.5,23.5 C 20,22 19,22 18,22.5 C 17,23 16,24 15.5,25 C 15,26 13.5,27.5 14,29.5 C 14.5,31.5 13.5,32 12.5,34 C 12,35 11.5,35.5 12.5,37 Z" />
            <circle cx="22.5" cy="15" r="1.7" fill={strokeColor} stroke="none" />
            <path d="M 12,36 C 16,35 29,35 33,36" fill="none" />
            <path d="M 11.5,39.5 C 16,38.5 29,38.5 33.5,39.5" fill="none" />
          </g>
        )}

        {/* ======================================================== */}
        {/* BLACK PIECES - WITH CRISP HIGH-CONTRAST CONTOURS         */}
        {/* ======================================================== */}

        {/* BLACK PAWN */}
        {!isWhite && type === 'p' && (
          <g fill={fillBlack} stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
            <path d="M 22.5,9 C 20,9 18,11 18,13.5 C 18,14.8 18.6,16 19.5,16.8 C 17.5,18.5 16,21 16,24 C 16,26.5 17.2,28.5 19,29.8 C 15.5,31.2 12,34.5 12,39.5 L 33,39.5 C 33,34.5 29.5,31.2 26,29.8 C 27.8,28.5 29,26.5 29,24 C 29,21 27.5,18.5 25.5,16.8 C 26.4,16 27,14.8 27,13.5 C 27,11 25,9 22.5,9 Z" />
            <path d="M 20,11.5 C 21,10.5 23,10.5 24,11.5" fill="none" stroke={accentWhite} strokeWidth="1.3" />
            <path d="M 16,36 L 29,36" fill="none" stroke={accentWhite} strokeWidth="1.3" />
          </g>
        )}

        {/* BLACK KNIGHT (HORSE) - MASTERWORK VISIBILITY & CHARISMA */}
        {!isWhite && type === 'n' && (
          <g fill={fillBlack} stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
            {/* Solid Horse Silhouette */}
            <path
              d="M 22,7 C 23.5,7 25,8.2 25.5,10 C 27.5,9.5 29.5,10.5 30,12 C 30.5,13.5 29,15 28.5,16 C 31,18 33.5,21 34,24.5 C 34.8,30 32,36 31,39.5 L 14,39.5 C 14.5,34 14,29 10,26 C 8.5,25 7.5,23 8,21 C 8.5,19 10.5,18.5 12,19 C 13,19.3 14,20 14.5,21 C 15,21.5 16,21.5 16.5,20.5 C 16.5,18 16,14.5 17,11.5 C 18,8.5 20,7 22,7 Z"
            />
            {/* High-Contrast White Inner Details */}
            {/* Eye: Bright White with Dark Pupil */}
            <circle cx="18" cy="14" r="1.9" fill={accentWhite} stroke="none" />
            <circle cx="18.3" cy="14.2" r="0.9" fill={strokeColor} stroke="none" />
            {/* Nostril */}
            <circle cx="12.5" cy="22" r="1.3" fill={accentWhite} stroke="none" />
            {/* Cheek & Jaw Contour */}
            <path
              d="M 12.5,23.5 C 15,24.5 16.5,23 18,22 C 19.5,21 21.5,18 21,15"
              fill="none"
              stroke={accentWhite}
              strokeWidth="1.6"
            />
            {/* Distinct Mane Arches */}
            <path d="M 24,10 C 27,13 29,17 29.5,22" fill="none" stroke={accentWhite} strokeWidth="1.6" />
            <path d="M 28,15 C 30.5,18 32,22 32.5,27" fill="none" stroke={accentWhite} strokeWidth="1.6" />
            <path d="M 16,36 L 29,36" fill="none" stroke={accentWhite} strokeWidth="1.4" />
          </g>
        )}

        {/* BLACK BISHOP */}
        {!isWhite && type === 'b' && (
          <g fill={fillBlack} stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
            <path d="M 9,37 C 12,36 19,37 22.5,35 C 26,37 33,36 36,37 C 36,37 37.5,38 39,39.5 L 6,39.5 C 7.5,38 9,37 9,37 Z" />
            <path d="M 15,33 C 17.5,35 27.5,35 30,33 C 30.5,31 30,30 30,30 C 30,27 27.5,25.5 27.5,23 C 27.5,20.5 29,18.5 29,15.5 C 29,10.5 25.5,7.5 22.5,7.5 C 19.5,7.5 16,10.5 16,15.5 C 16,18.5 17.5,20.5 17.5,23 C 17.5,25.5 15,27 15,30 C 15,30 14.5,31 15,33 Z" />
            <circle cx="22.5" cy="5" r="2.3" />
            <path d="M 17,25 L 28,25" fill="none" stroke={accentWhite} strokeWidth="1.4" />
            <path d="M 15.5,29 L 29.5,29" fill="none" stroke={accentWhite} strokeWidth="1.4" />
            <path d="M 22.5,12 L 22.5,18" fill="none" stroke={accentWhite} strokeWidth="1.5" />
            <path d="M 19.5,14.5 L 25.5,14.5" fill="none" stroke={accentWhite} strokeWidth="1.5" />
          </g>
        )}

        {/* BLACK ROOK */}
        {!isWhite && type === 'r' && (
          <g fill={fillBlack} stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
            <path d="M 9,39.5 L 36,39.5 L 36,36 L 9,36 Z" />
            <path d="M 12,36 L 12,32 L 33,32 L 33,36 Z" />
            <path d="M 11,14 L 11,8.5 L 15.5,8.5 L 15.5,11 L 20.5,11 L 20.5,8.5 L 24.5,8.5 L 24.5,11 L 29.5,11 L 29.5,8.5 L 34,8.5 L 34,14 Z" />
            <path d="M 34,14 L 31,17 L 14,17 L 11,14" />
            <path d="M 31,17 L 31,29.5 L 14,29.5 L 14,17" />
            <path d="M 31,29.5 L 33,32 L 12,32 L 14,29.5" />
            <path d="M 11,14 L 34,14" fill="none" stroke={accentWhite} strokeWidth="1.4" />
            <path d="M 14,29.5 L 31,29.5" fill="none" stroke={accentWhite} strokeWidth="1.4" />
            <path d="M 12,36 L 33,36" fill="none" stroke={accentWhite} strokeWidth="1.4" />
          </g>
        )}

        {/* BLACK QUEEN */}
        {!isWhite && type === 'q' && (
          <g fill={fillBlack} stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
            <path d="M 9,26 C 17.5,24.5 30,24.5 36,26 L 38.5,13.5 L 31,25 L 22.5,9.5 L 14,25 L 6.5,13.5 Z" />
            <path d="M 9,26 C 9,28 10.5,28 11.5,30 C 12.5,31.5 12.5,31 12,33.5 C 10.5,34.5 11,36 11,36 C 9.5,37.5 11,38.5 11,38.5 L 34,38.5 C 34,38.5 35.5,37.5 34,36 C 34,36 34.5,34.5 33,33.5 C 32.5,31 32.5,31.5 33.5,30 C 34.5,28 36,28 36,26 Z" />
            <circle cx="6" cy="12" r="2.2" />
            <circle cx="14" cy="8.5" r="2.2" />
            <circle cx="22.5" cy="7.5" r="2.2" />
            <circle cx="31" cy="8.5" r="2.2" />
            <circle cx="39" cy="12" r="2.2" />
            <path d="M 12,32 L 33,32" fill="none" stroke={accentWhite} strokeWidth="1.4" />
            <path d="M 11,36 L 34,36" fill="none" stroke={accentWhite} strokeWidth="1.4" />
          </g>
        )}

        {/* BLACK KING */}
        {!isWhite && type === 'k' && (
          <g fill={fillBlack} stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
            <path d="M 22.5,11.5 L 22.5,5" fill="none" stroke={accentWhite} strokeWidth="2" />
            <path d="M 19,8 L 26,8" fill="none" stroke={accentWhite} strokeWidth="2" />
            <path d="M 22.5,25 C 22.5,25 27,17.5 25.5,14 C 24,11 21,11 19.5,14 C 18,17.5 22.5,25 22.5,25 Z" />
            <path d="M 12.5,37 C 15,40.5 30,40.5 32.5,37 C 33.5,35.5 33,35 32.5,34 C 31.5,32 30.5,31.5 31,29.5 C 31.5,27.5 30,26 29.5,25 C 29,24 28,23 27,22.5 C 26,22 25,22 22.5,23.5 C 20,22 19,22 18,22.5 C 17,23 16,24 15.5,25 C 15,26 13.5,27.5 14,29.5 C 14.5,31.5 13.5,32 12.5,34 C 12,35 11.5,35.5 12.5,37 Z" />
            <circle cx="22.5" cy="15" r="1.7" fill={accentWhite} stroke="none" />
            <path d="M 12,36 C 16,35 29,35 33,36" fill="none" stroke={accentWhite} strokeWidth="1.4" />
            <path d="M 11.5,39.5 C 16,38.5 29,38.5 33.5,39.5" fill="none" stroke={accentWhite} strokeWidth="1.4" />
          </g>
        )}
      </svg>
    </div>
  );
};
