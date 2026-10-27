import { Chess, Move as ChessJsMove } from 'chess.js';
import { Color, PieceSymbol, Square } from '../types/index.js';
import { PIECE_VALUES } from '../constants/index.js';

// Piece-Square Tables (from White's perspective; flipped for Black)
// Values adapted from PeSTO / simplified evaluation functions
const PAWN_TABLE: number[] = [
  0,  0,  0,  0,  0,  0,  0,  0,
  50, 50, 50, 50, 50, 50, 50, 50,
  10, 10, 20, 30, 30, 20, 10, 10,
   5,  5, 10, 25, 25, 10,  5,  5,
   0,  0,  0, 20, 20,  0,  0,  0,
   5, -5,-10,  0,  0,-10, -5,  5,
   5, 10, 10,-20,-20, 10, 10,  5,
   0,  0,  0,  0,  0,  0,  0,  0,
];

const KNIGHT_TABLE: number[] = [
 -50,-40,-30,-30,-30,-30,-40,-50,
 -40,-20,  0,  0,  0,  0,-20,-40,
 -30,  0, 10, 15, 15, 10,  0,-30,
 -30,  5, 15, 20, 20, 15,  5,-30,
 -30,  0, 15, 20, 20, 15,  0,-30,
 -30,  5, 10, 15, 15, 10,  5,-30,
 -40,-20,  0,  5,  5,  0,-20,-40,
 -50,-40,-30,-30,-30,-30,-40,-50,
];

const BISHOP_TABLE: number[] = [
 -20,-10,-10,-10,-10,-10,-10,-20,
 -10,  0,  0,  0,  0,  0,  0,-10,
 -10,  0,  5, 10, 10,  5,  0,-10,
 -10,  5,  5, 10, 10,  5,  5,-10,
 -10,  0, 10, 10, 10, 10,  0,-10,
 -10, 10, 10, 10, 10, 10, 10,-10,
 -10,  5,  0,  0,  0,  0,  5,-10,
 -20,-10,-10,-10,-10,-10,-10,-20,
];

const ROOK_TABLE: number[] = [
   0,  0,  0,  0,  0,  0,  0,  0,
   5, 10, 10, 10, 10, 10, 10,  5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
  -5,  0,  0,  0,  0,  0,  0, -5,
   0,  0,  0,  5,  5,  0,  0,  0,
];

const QUEEN_TABLE: number[] = [
 -20,-10,-10, -5, -5,-10,-10,-20,
 -10,  0,  0,  0,  0,  0,  0,-10,
 -10,  0,  5,  5,  5,  5,  0,-10,
  -5,  0,  5,  5,  5,  5,  0, -5,
   0,  0,  5,  5,  5,  5,  0, -5,
 -10,  5,  5,  5,  5,  5,  0,-10,
 -10,  0,  5,  0,  0,  0,  0,-10,
 -20,-10,-10, -5, -5,-10,-10,-20,
];

const KING_TABLE_MIDDLEGAME: number[] = [
 -30,-40,-40,-50,-50,-40,-40,-30,
 -30,-40,-40,-50,-50,-40,-40,-30,
 -30,-40,-40,-50,-50,-40,-40,-30,
 -30,-40,-40,-50,-50,-40,-40,-30,
 -20,-30,-30,-40,-40,-30,-30,-20,
 -10,-20,-20,-20,-20,-20,-20,-10,
  20, 20,  0,  0,  0,  0, 20, 20,
  20, 30, 10,  0,  0, 10, 30, 20,
];

export interface SearchOptions {
  depth: number;
  timeLimitMs?: number;
}

export interface SearchResult {
  bestMove: ChessJsMove | null;
  evaluation: number; // in centipawns from White's perspective
  nodesSearched: number;
  depthReached: number;
}

export class ChessAI {
  private startTime: number = 0;
  private timeLimit: number = Infinity;
  private nodesCount: number = 0;
  private searchAborted: boolean = false;

  public findBestMove(
    fen: string,
    options: SearchOptions = { depth: 3 }
  ): SearchResult {
    const chess = new Chess(fen);
    this.startTime = Date.now();
    this.timeLimit = options.timeLimitMs ?? Infinity;
    this.nodesCount = 0;
    this.searchAborted = false;

    const sideToMove = chess.turn() as Color;
    const isMaximizing = sideToMove === 'w';

    const legalMoves = chess.moves({ verbose: true });
    if (legalMoves.length === 0) {
      return {
        bestMove: null,
        evaluation: chess.inCheck() ? (isMaximizing ? -20000 : 20000) : 0,
        nodesSearched: 0,
        depthReached: 0,
      };
    }

    // Move ordering
    this.orderMoves(legalMoves);

    let bestMove: ChessJsMove = legalMoves[0];
    let bestScore = isMaximizing ? -Infinity : Infinity;

    for (const move of legalMoves) {
      chess.move(move);
      const score = this.minimax(
        chess,
        options.depth - 1,
        -Infinity,
        Infinity,
        !isMaximizing
      );
      chess.undo();

      if (this.searchAborted) break;

      if (isMaximizing) {
        if (score > bestScore) {
          bestScore = score;
          bestMove = move;
        }
      } else {
        if (score < bestScore) {
          bestScore = score;
          bestMove = move;
        }
      }
    }

    return {
      bestMove,
      evaluation: bestScore,
      nodesSearched: this.nodesCount,
      depthReached: options.depth,
    };
  }

  private minimax(
    chess: Chess,
    depth: number,
    alpha: number,
    beta: number,
    isMaximizing: boolean
  ): number {
    this.nodesCount++;

    if (Date.now() - this.startTime > this.timeLimit) {
      this.searchAborted = true;
      return isMaximizing ? -Infinity : Infinity;
    }

    if (depth <= 0) {
      return this.evaluatePosition(chess);
    }

    if (chess.isGameOver()) {
      if (chess.isCheckmate()) {
        // Prefer quicker checkmates by factoring depth
        return isMaximizing ? -20000 - depth : 20000 + depth;
      }
      return 0; // Stalemate / draw
    }

    const legalMoves = chess.moves({ verbose: true });
    this.orderMoves(legalMoves);

    if (isMaximizing) {
      let maxEval = -Infinity;
      for (const move of legalMoves) {
        chess.move(move);
        const evalScore = this.minimax(chess, depth - 1, alpha, beta, false);
        chess.undo();

        if (this.searchAborted) return maxEval;

        maxEval = Math.max(maxEval, evalScore);
        alpha = Math.max(alpha, evalScore);
        if (beta <= alpha) break; // Beta cutoff
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const move of legalMoves) {
        chess.move(move);
        const evalScore = this.minimax(chess, depth - 1, alpha, beta, true);
        chess.undo();

        if (this.searchAborted) return minEval;

        minEval = Math.min(minEval, evalScore);
        beta = Math.min(beta, evalScore);
        if (beta <= alpha) break; // Alpha cutoff
      }
      return minEval;
    }
  }

  public evaluatePosition(chess: Chess): number {
    if (chess.isCheckmate()) {
      return chess.turn() === 'w' ? -20000 : 20000;
    }
    if (chess.isDraw() || chess.isStalemate()) {
      return 0;
    }

    let score = 0;
    const board = chess.board();

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (!piece) continue;

        const val = PIECE_VALUES[piece.type as PieceSymbol] ?? 0;
        const squareIndex = r * 8 + c;
        const positionalVal = this.getPositionalScore(
          piece.type as PieceSymbol,
          squareIndex,
          piece.color as Color
        );

        if (piece.color === 'w') {
          score += val + positionalVal;
        } else {
          score -= val + positionalVal;
        }
      }
    }

    return score;
  }

  private getPositionalScore(
    type: PieceSymbol,
    index: number,
    color: Color
  ): number {
    const tableIndex = color === 'w' ? index : 63 - index;
    switch (type) {
      case 'p':
        return PAWN_TABLE[tableIndex] ?? 0;
      case 'n':
        return KNIGHT_TABLE[tableIndex] ?? 0;
      case 'b':
        return BISHOP_TABLE[tableIndex] ?? 0;
      case 'r':
        return ROOK_TABLE[tableIndex] ?? 0;
      case 'q':
        return QUEEN_TABLE[tableIndex] ?? 0;
      case 'k':
        return KING_TABLE_MIDDLEGAME[tableIndex] ?? 0;
      default:
        return 0;
    }
  }

  private orderMoves(moves: ChessJsMove[]): void {
    moves.sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;

      // MVV-LVA: Most Valuable Victim - Least Valuable Attacker
      if (a.captured) {
        scoreA += (PIECE_VALUES[a.captured as PieceSymbol] ?? 0) * 10 -
          (PIECE_VALUES[a.piece as PieceSymbol] ?? 0);
      }
      if (b.captured) {
        scoreB += (PIECE_VALUES[b.captured as PieceSymbol] ?? 0) * 10 -
          (PIECE_VALUES[b.piece as PieceSymbol] ?? 0);
      }

      if (a.promotion) scoreA += 900;
      if (b.promotion) scoreB += 900;

      return scoreB - scoreA;
    });
  }
}
