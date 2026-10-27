export type Color = 'w' | 'b';

export type PieceSymbol = 'p' | 'n' | 'b' | 'r' | 'q' | 'k';

export type Square =
  | 'a8' | 'b8' | 'c8' | 'd8' | 'e8' | 'f8' | 'g8' | 'h8'
  | 'a7' | 'b7' | 'c7' | 'd7' | 'e7' | 'f7' | 'g7' | 'h7'
  | 'a6' | 'b6' | 'c6' | 'd6' | 'e6' | 'f6' | 'g6' | 'h6'
  | 'a5' | 'b5' | 'c5' | 'd5' | 'e5' | 'f5' | 'g5' | 'h5'
  | 'a4' | 'b4' | 'c4' | 'd4' | 'e4' | 'f4' | 'g4' | 'h4'
  | 'a3' | 'b3' | 'c3' | 'd3' | 'e3' | 'f3' | 'g3' | 'h3'
  | 'a2' | 'b2' | 'c2' | 'd2' | 'e2' | 'f2' | 'g2' | 'h2'
  | 'a1' | 'b1' | 'c1' | 'd1' | 'e1' | 'f1' | 'g1' | 'h1';

export interface Piece {
  type: PieceSymbol;
  color: Color;
}

export type CastlingRights = {
  w: { k: boolean; q: boolean };
  b: { k: boolean; q: boolean };
};

export type GameStatus = 'waiting' | 'active' | 'finished' | 'aborted';

export type GameResult = '1-0' | '0-1' | '1/2-1/2' | null;

export type EndReason =
  | 'checkmate'
  | 'stalemate'
  | 'resignation'
  | 'timeout'
  | 'threefold_repetition'
  | 'fivefold_repetition'
  | 'fifty_move_rule'
  | 'seventy_five_move_rule'
  | 'insufficient_material'
  | 'agreement'
  | 'abandoned';

export interface TimeControl {
  initialMs: number;
  incrementMs: number;
}

export interface ClockState {
  whiteRemainingMs: number;
  blackRemainingMs: number;
  activeColor: Color | null;
  turnStartedAtMs: number | null;
  isPaused: boolean;
  flagFallen: boolean;
  clockVersion: number;
}

export interface MoveInput {
  from: Square;
  to: Square;
  promotion?: PieceSymbol;
}

export interface DetailedMove {
  from: Square;
  to: Square;
  piece: PieceSymbol;
  color: Color;
  san: string;
  uci: string;
  captured?: PieceSymbol;
  promotion?: PieceSymbol;
  isCheck: boolean;
  isCheckmate: boolean;
  isCastling: boolean;
  isEnPassant: boolean;
  fenAfter: string;
  ply: number;
  timestamp: number;
  whiteRemainingMs?: number;
  blackRemainingMs?: number;
}

export interface GameSnapshot {
  fen: string;
  sideToMove: Color;
  castlingRights: CastlingRights;
  enPassantSquare: Square | null;
  halfmoveClock: number;
  fullmoveNumber: number;
  status: GameStatus;
  result: GameResult;
  endReason: EndReason | null;
  isCheck: boolean;
  isCheckmate: boolean;
  isStalemate: boolean;
  isDraw: boolean;
  canClaimThreefold: boolean;
  canClaimFiftyMoves: boolean;
  isFivefoldRepetition: boolean;
  isSeventyFiveMoves: boolean;
  isInsufficientMaterial: boolean;
  gameVersion: number;
  moveHistory: DetailedMove[];
  lastMove: DetailedMove | null;
  clocks?: ClockState;
}
