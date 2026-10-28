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
  const strokeColor = '#1e293b';
  const strokeWidth = '1.5';
  const fillWhite = '#ffffff';
  const fillBlack = '#292524'; // Classic chess.com charcoal
  const accentWhite = '#ffffff';

  return (
    <div
      className={`${className} flex items-center justify-center select-none transition-transform duration-100 filter drop-shadow-[0_2px_3px_rgba(0,0,0,0.28)]`}
    >
      <svg
        viewBox="0 0 45 45"
        className="w-full h-full pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* ======================================================== */}
        {/* WHITE PIECES - AUTHENTIC CHESS.COM NEO STYLE             */}
        {/* ======================================================== */}

        {/* WHITE PAWN */}
        {isWhite && type === 'p' && (
          <path
            d="m 22.5,9 c -2.21,0 -4,1.79 -4,4 0,0.89 0.29,1.71 0.78,2.38 C 17.33,16.5 16,18.59 16,21 c 0,2.03 0.94,3.84 2.41,5.03 C 15.41,27.09 11,31.58 11,39.5 l 23,0 c 0,-7.92 -4.41,-12.41 -7.41,-13.47 C 28.06,24.84 29,23.03 29,21 29,18.59 27.67,16.5 25.72,15.38 26.21,14.71 26.5,13.89 26.5,13 c 0,-2.21 -1.79,-4 -4,-4 z"
            fill={fillWhite}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        )}

        {/* WHITE KNIGHT (HORSE) - SIMPLE & AUTHENTIC CHESS.COM STYLE */}
        {isWhite && type === 'n' && (
          <g fill={fillWhite} stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
            <path
              d="m 22,10 c 10.5,1 16.5,8 16,29 L 15,39 C 15,30 14,25 8,24 12,24 16,21 16,16 16,10 20,9 22,10 z"
            />
            <path
              d="m 24,18 c 0.38,2.91 -5.55,7.37 -8,9 -3,2 -2.82,4.34 -5,4 -1.04,-0.94 -1.45,-4.45 2,-6 3.5,-1.5 6,-4 6,-7"
              fill="none"
            />
            <circle cx="14" cy="15" r="1.1" fill={strokeColor} stroke="none" />
            <circle cx="9.5" cy="25" r="0.8" fill={strokeColor} stroke="none" />
          </g>
        )}

        {/* WHITE BISHOP */}
        {isWhite && type === 'b' && (
          <g fill={fillWhite} stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
            <path d="M 9,36 C 12.39,35.03 19.11,36.43 22.5,34 C 25.89,36.43 32.61,35.03 36,36 C 36,36 37.65,36.54 39,38 C 38.32,38.97 37.35,38.99 36,38.5 C 32.61,37.53 25.89,38.96 22.5,37.5 C 19.11,38.96 12.39,37.53 9,38.5 C 7.646,38.99 6.677,38.97 6,38 C 7.354,36.54 9,36 9,36 z" />
            <path d="M 15,32 C 17.5,34.5 27.5,34.5 30,32 C 30.5,30.5 30,30 30,30 C 30,27.5 27.5,26 27.5,23.5 C 27.5,21 29,19 29,16 C 29,11 25.5,8 22.5,8 C 19.5,8 16,11 16,16 C 16,19 17.5,21 17.5,23.5 C 17.5,26 15,27.5 15,30 C 15,30 14.5,30.5 15,32 z" />
            <circle cx="22.5" cy="5.5" r="2.5" />
            <path d="m 17.5,26 h 10 M 15,30 h 15 m -7.5,-14.5 v 5 m -2.5,-2.5 h 5" fill="none" />
          </g>
        )}

        {/* WHITE ROOK */}
        {isWhite && type === 'r' && (
          <g fill={fillWhite} stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
            <path d="M 9,39 L 36,39 L 36,36 L 9,36 z" />
            <path d="M 12,36 L 12,32 L 33,32 L 33,36 z" />
            <path d="M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14 z" />
            <path d="M 34,14 L 31,17 L 14,17 L 11,14" />
            <path d="M 31,17 L 31,29.5 L 14,29.5 L 14,17" />
            <path d="M 31,29.5 L 32.5,32 L 12.5,32 L 14,29.5" />
            <path d="M 11,14 L 34,14" fill="none" />
            <path d="M 12,32 L 33,32" fill="none" />
          </g>
        )}

        {/* WHITE QUEEN */}
        {isWhite && type === 'q' && (
          <g fill={fillWhite} stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
            <path d="M 9,26 C 17.5,24.5 30,24.5 36,26 L 38.5,13.5 L 31,25 L 22.5,10 L 14,25 L 6.5,13.5 z" />
            <path d="M 9,26 C 9,28 10.5,28 11.5,30 C 12.5,31.5 12.5,31 12,33.5 C 10.5,34.5 11,36 11,36 C 9.5,37.5 11,38.5 11,38.5 L 34,38.5 C 34,38.5 35.5,37.5 34,36 C 34,36 34.5,34.5 33,33.5 C 32.5,31 32.5,31.5 33.5,30 C 34.5,28 36,28 36,26 z" />
            <circle cx="6" cy="12" r="2" />
            <circle cx="14" cy="9" r="2" />
            <circle cx="22.5" cy="8" r="2" />
            <circle cx="31" cy="9" r="2" />
            <circle cx="39" cy="12" r="2" />
            <path d="M 11,38.5 A 35,35 1 0 0 34,38.5" fill="none" />
            <path d="M 11,29 A 35,35 1 0 1 34,29" fill="none" />
            <path d="M 12.5,31.5 A 35,35 1 0 1 32.5,31.5" fill="none" />
            <path d="M 11.5,34.5 A 35,35 1 0 1 33.5,34.5" fill="none" />
            <path d="M 10.5,36.5 A 35,35 1 0 1 34.5,36.5" fill="none" />
          </g>
        )}

        {/* WHITE KING */}
        {isWhite && type === 'k' && (
          <g fill={fillWhite} stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
            <path d="M 22.5,11.63 L 22.5,6" fill="none" />
            <path d="M 20,8 L 25,8" fill="none" />
            <path d="M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 24,11.5 21,11.5 19.5,14.5 C 18,17.5 22.5,25 22.5,25 z" />
            <path d="M 12.5,37 C 15,40.5 30,40.5 32.5,37 C 33.5,35.5 33,35 32.5,34 C 31.5,32 30.5,31.5 31,29.5 C 31.5,27.5 30,26 29.5,25 C 29,24 28,23 27,22.5 C 26,22 25,22 22.5,23.5 C 20,22 19,22 18,22.5 C 17,23 16,24 15.5,25 C 15,26 13.5,27.5 14,29.5 C 14.5,31.5 13.5,32 12.5,34 C 12,35 11.5,35.5 12.5,37 z" />
            <circle cx="22.5" cy="15.5" r="1.5" fill={strokeColor} stroke="none" />
            <path d="M 12,36 C 16,35 29,35 33,36" fill="none" />
            <path d="M 11.5,39 C 16,38 29,38 33.5,39" fill="none" />
          </g>
        )}

        {/* ======================================================== */}
        {/* BLACK PIECES - AUTHENTIC CHESS.COM NEO STYLE             */}
        {/* ======================================================== */}

        {/* BLACK PAWN */}
        {!isWhite && type === 'p' && (
          <path
            d="m 22.5,9 c -2.21,0 -4,1.79 -4,4 0,0.89 0.29,1.71 0.78,2.38 C 17.33,16.5 16,18.59 16,21 c 0,2.03 0.94,3.84 2.41,5.03 C 15.41,27.09 11,31.58 11,39.5 l 23,0 c 0,-7.92 -4.41,-12.41 -7.41,-13.47 C 28.06,24.84 29,23.03 29,21 29,18.59 27.67,16.5 25.72,15.38 26.21,14.71 26.5,13.89 26.5,13 c 0,-2.21 -1.79,-4 -4,-4 z"
            fill={fillBlack}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
        )}

        {/* BLACK KNIGHT (HORSE) - SIMPLE & AUTHENTIC CHESS.COM STYLE */}
        {!isWhite && type === 'n' && (
          <g stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
            <path
              d="m 22,10 c 10.5,1 16.5,8 16,29 L 15,39 C 15,30 14,25 8,24 12,24 16,21 16,16 16,10 20,9 22,10 z"
              fill={fillBlack}
            />
            <path
              d="m 24,18 c 0.38,2.91 -5.55,7.37 -8,9 -3,2 -2.82,4.34 -5,4 -1.04,-0.94 -1.45,-4.45 2,-6 3.5,-1.5 6,-4 6,-7"
              fill="none"
              stroke={accentWhite}
              strokeWidth="1.5"
            />
            <circle cx="14" cy="15" r="1.1" fill={accentWhite} stroke="none" />
            <circle cx="9.5" cy="25" r="0.8" fill={accentWhite} stroke="none" />
            <path
              d="m 24.55,10.4 a 14.9,14.9 0 0 1 3.25,4.1"
              fill="none"
              stroke={accentWhite}
              strokeWidth="1.3"
              strokeLinecap="round"
            />
            <path
              d="m 28.5,15 a 14.9,14.9 0 0 1 2.3,4.6"
              fill="none"
              stroke={accentWhite}
              strokeWidth="1.3"
              strokeLinecap="round"
            />
            <path
              d="m 31,21 a 14.9,14.9 0 0 1 1,5.2"
              fill="none"
              stroke={accentWhite}
              strokeWidth="1.3"
              strokeLinecap="round"
            />
          </g>
        )}

        {/* BLACK BISHOP */}
        {!isWhite && type === 'b' && (
          <g stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
            <path
              d="M 9,36 C 12.39,35.03 19.11,36.43 22.5,34 C 25.89,36.43 32.61,35.03 36,36 C 36,36 37.65,36.54 39,38 C 38.32,38.97 37.35,38.99 36,38.5 C 32.61,37.53 25.89,38.96 22.5,37.5 C 19.11,38.96 12.39,37.53 9,38.5 C 7.646,38.99 6.677,38.97 6,38 C 7.354,36.54 9,36 9,36 z"
              fill={fillBlack}
            />
            <path
              d="M 15,32 C 17.5,34.5 27.5,34.5 30,32 C 30.5,30.5 30,30 30,30 C 30,27.5 27.5,26 27.5,23.5 C 27.5,21 29,19 29,16 C 29,11 25.5,8 22.5,8 C 19.5,8 16,11 16,16 C 16,19 17.5,21 17.5,23.5 C 17.5,26 15,27.5 15,30 C 15,30 14.5,30.5 15,32 z"
              fill={fillBlack}
            />
            <circle cx="22.5" cy="5.5" r="2.5" fill={fillBlack} />
            <path
              d="m 17.5,26 h 10 M 15,30 h 15 m -7.5,-14.5 v 5 m -2.5,-2.5 h 5"
              fill="none"
              stroke={accentWhite}
              strokeWidth="1.5"
            />
          </g>
        )}

        {/* BLACK ROOK */}
        {!isWhite && type === 'r' && (
          <g fill={fillBlack} stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
            <path d="M 9,39 L 36,39 L 36,36 L 9,36 z" />
            <path d="M 12,36 L 12,32 L 33,32 L 33,36 z" />
            <path d="M 11,14 L 11,9 L 15,9 L 15,11 L 20,11 L 20,9 L 25,9 L 25,11 L 30,11 L 30,9 L 34,9 L 34,14 z" />
            <path d="M 34,14 L 31,17 L 14,17 L 11,14" />
            <path d="M 31,17 L 31,29.5 L 14,29.5 L 14,17" />
            <path d="M 31,29.5 L 32.5,32 L 12.5,32 L 14,29.5" />
            <path d="M 11,14 L 34,14" fill="none" stroke={accentWhite} strokeWidth="1.4" />
            <path d="M 12,32 L 33,32" fill="none" stroke={accentWhite} strokeWidth="1.4" />
            <path d="M 14,29.5 L 31,29.5" fill="none" stroke={accentWhite} strokeWidth="1.4" />
            <path d="M 14,17 L 31,17" fill="none" stroke={accentWhite} strokeWidth="1.4" />
          </g>
        )}

        {/* BLACK QUEEN */}
        {!isWhite && type === 'q' && (
          <g fill={fillBlack} stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
            <path d="M 9,26 C 17.5,24.5 30,24.5 36,26 L 38.5,13.5 L 31,25 L 22.5,10 L 14,25 L 6.5,13.5 z" />
            <path d="M 9,26 C 9,28 10.5,28 11.5,30 C 12.5,31.5 12.5,31 12,33.5 C 10.5,34.5 11,36 11,36 C 9.5,37.5 11,38.5 11,38.5 L 34,38.5 C 34,38.5 35.5,37.5 34,36 C 34,36 34.5,34.5 33,33.5 C 32.5,31 32.5,31.5 33.5,30 C 34.5,28 36,28 36,26 z" />
            <circle cx="6" cy="12" r="2" />
            <circle cx="14" cy="9" r="2" />
            <circle cx="22.5" cy="8" r="2" />
            <circle cx="31" cy="9" r="2" />
            <circle cx="39" cy="12" r="2" />
            <path d="M 11,38.5 A 35,35 1 0 0 34,38.5" fill="none" stroke={accentWhite} strokeWidth="1.4" />
            <path d="M 11,29 A 35,35 1 0 1 34,29" fill="none" stroke={accentWhite} strokeWidth="1.4" />
            <path d="M 12.5,31.5 A 35,35 1 0 1 32.5,31.5" fill="none" stroke={accentWhite} strokeWidth="1.4" />
            <path d="M 11.5,34.5 A 35,35 1 0 1 33.5,34.5" fill="none" stroke={accentWhite} strokeWidth="1.4" />
            <path d="M 10.5,36.5 A 35,35 1 0 1 34.5,36.5" fill="none" stroke={accentWhite} strokeWidth="1.4" />
          </g>
        )}

        {/* BLACK KING */}
        {!isWhite && type === 'k' && (
          <g fill={fillBlack} stroke={strokeColor} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
            <path d="M 22.5,11.63 L 22.5,6" fill="none" stroke={accentWhite} strokeWidth="1.5" />
            <path d="M 20,8 L 25,8" fill="none" stroke={accentWhite} strokeWidth="1.5" />
            <path d="M 22.5,25 C 22.5,25 27,17.5 25.5,14.5 C 24,11.5 21,11.5 19.5,14.5 C 18,17.5 22.5,25 22.5,25 z" />
            <path d="M 12.5,37 C 15,40.5 30,40.5 32.5,37 C 33.5,35.5 33,35 32.5,34 C 31.5,32 30.5,31.5 31,29.5 C 31.5,27.5 30,26 29.5,25 C 29,24 28,23 27,22.5 C 26,22 25,22 22.5,23.5 C 20,22 19,22 18,22.5 C 17,23 16,24 15.5,25 C 15,26 13.5,27.5 14,29.5 C 14.5,31.5 13.5,32 12.5,34 C 12,35 11.5,35.5 12.5,37 z" />
            <circle cx="22.5" cy="15.5" r="1.5" fill={accentWhite} stroke="none" />
            <path d="M 12,36 C 16,35 29,35 33,36" fill="none" stroke={accentWhite} strokeWidth="1.4" />
            <path d="M 11.5,39 C 16,38 29,38 33.5,39" fill="none" stroke={accentWhite} strokeWidth="1.4" />
          </g>
        )}
      </svg>
    </div>
  );
};
