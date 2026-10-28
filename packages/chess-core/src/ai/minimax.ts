import { Chess, Move as ChessJsMove } from 'chess.js';
import { Color, PieceSymbol } from '../types/index.js';
import { PIECE_VALUES } from '../constants/index.js';

// Piece-Square Tables (from White's perspective; flipped for Black)
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

const KING_TABLE_ENDGAME: number[] = [
 -20,-10,-10,-10,-10,-10,-10,-20,
 -10,  0,  0,  0,  0,  0,  0,-10,
 -10,  0, 20, 25, 25, 20,  0,-10,
 -10,  0, 25, 35, 35, 25,  0,-10,
 -10,  0, 25, 35, 35, 25,  0,-10,
 -10,  0, 20, 25, 25, 20,  0,-10,
 -10,-10,  0,  0,  0,  0,-10,-10,
 -20,-30,-10,-10,-10,-10,-30,-20,
];

export interface SearchOptions {
  depth: number;
  quiescenceDepth?: number;
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
  private maxQuiescenceDepth: number = 4;

  public findBestMove(
    fen: string,
    options: SearchOptions = { depth: 3 }
  ): SearchResult {
    const chess = new Chess(fen);
    this.startTime = Date.now();
    this.timeLimit = options.timeLimitMs ?? 4000;
    this.nodesCount = 0;
    this.searchAborted = false;
    this.maxQuiescenceDepth = options.quiescenceDepth ?? (options.depth >= 4 ? 4 : 3);

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

    // Move ordering for root
    this.orderMoves(legalMoves);

    let bestMove: ChessJsMove = legalMoves[0];
    let bestScore = isMaximizing ? -Infinity : Infinity;
    let alpha = -Infinity;
    let beta = Infinity;

    for (const move of legalMoves) {
      chess.move(move);
      const score = this.minimax(
        chess,
        options.depth - 1,
        alpha,
        beta,
        !isMaximizing
      );
      chess.undo();

      if (this.searchAborted) break;

      if (isMaximizing) {
        if (score > bestScore) {
          bestScore = score;
          bestMove = move;
        }
        alpha = Math.max(alpha, bestScore);
      } else {
        if (score < bestScore) {
          bestScore = score;
          bestMove = move;
        }
        beta = Math.min(beta, bestScore);
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

    // At leaf node, run Quiescence Search to resolve hanging captures and horizon traps
    if (depth <= 0) {
      return this.quiesce(chess, alpha, beta, isMaximizing, this.maxQuiescenceDepth);
    }

    const legalMoves = chess.moves({ verbose: true });
    if (legalMoves.length === 0) {
      if (chess.inCheck()) {
        return isMaximizing ? -20000 - depth : 20000 + depth;
      }
      return 0; // Stalemate
    }

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

  /**
   * Quiescence search: explores captures only at leaf nodes to eliminate horizon blunders
   */
  private quiesce(
    chess: Chess,
    alpha: number,
    beta: number,
    isMaximizing: boolean,
    qDepth: number
  ): number {
    this.nodesCount++;

    if (Date.now() - this.startTime > this.timeLimit) {
      this.searchAborted = true;
      return isMaximizing ? -Infinity : Infinity;
    }

    const standPat = this.evaluatePosition(chess);

    if (qDepth <= 0) {
      return standPat;
    }

    if (isMaximizing) {
      if (standPat >= beta) return beta;
      if (standPat > alpha) alpha = standPat;

      const captures = chess
        .moves({ verbose: true })
        .filter((m) => m.captured || m.promotion);

      if (captures.length === 0) return standPat;
      this.orderMoves(captures);

      for (const move of captures) {
        // Delta pruning: skip captures that cannot possibly raise alpha
        const victimVal = move.captured ? (PIECE_VALUES[move.captured as PieceSymbol] ?? 100) : 0;
        if (standPat + victimVal + 200 < alpha && !move.promotion) {
          continue;
        }

        chess.move(move);
        const score = this.quiesce(chess, alpha, beta, false, qDepth - 1);
        chess.undo();

        if (this.searchAborted) return alpha;
        if (score >= beta) return beta;
        if (score > alpha) alpha = score;
      }
      return alpha;
    } else {
      if (standPat <= alpha) return alpha;
      if (standPat < beta) beta = standPat;

      const captures = chess
        .moves({ verbose: true })
        .filter((m) => m.captured || m.promotion);

      if (captures.length === 0) return standPat;
      this.orderMoves(captures);

      for (const move of captures) {
        const victimVal = move.captured ? (PIECE_VALUES[move.captured as PieceSymbol] ?? 100) : 0;
        if (standPat - victimVal - 200 > beta && !move.promotion) {
          continue;
        }

        chess.move(move);
        const score = this.quiesce(chess, alpha, beta, true, qDepth - 1);
        chess.undo();

        if (this.searchAborted) return beta;
        if (score <= alpha) return alpha;
        if (score < beta) beta = score;
      }
      return beta;
    }
  }

  /**
   * Fast, accurate positional evaluation function:
   * Material + PST + Endgame King Transition + Bishop Pair + Pawn Structure + Rook Open Files
   */
  public evaluatePosition(chess: Chess): number {
    let score = 0;
    const board = chess.board();

    let whiteNonPawnMaterial = 0;
    let blackNonPawnMaterial = 0;
    let whiteBishops = 0;
    let blackBishops = 0;

    const whitePawnFiles: number[] = [0, 0, 0, 0, 0, 0, 0, 0];
    const blackPawnFiles: number[] = [0, 0, 0, 0, 0, 0, 0, 0];
    const whiteRookCols: number[] = [];
    const blackRookCols: number[] = [];

    // Single fast 8x8 sweep
    for (let r = 0; r < 8; r++) {
      const row = board[r];
      for (let c = 0; c < 8; c++) {
        const piece = row[c];
        if (!piece) continue;

        const val = PIECE_VALUES[piece.type as PieceSymbol] ?? 0;
        const squareIndex = r * 8 + c;

        if (piece.color === 'w') {
          score += val;
          if (piece.type === 'b') whiteBishops++;
          else if (piece.type === 'r') whiteRookCols.push(c);
          else if (piece.type === 'p') whitePawnFiles[c]++;
          if (piece.type !== 'p' && piece.type !== 'k') whiteNonPawnMaterial += val;
        } else {
          score -= val;
          if (piece.type === 'b') blackBishops++;
          else if (piece.type === 'r') blackRookCols.push(c);
          else if (piece.type === 'p') blackPawnFiles[c]++;
          if (piece.type !== 'p' && piece.type !== 'k') blackNonPawnMaterial += val;
        }

        // Positional PST score
        const positionalVal = this.getPositionalScore(
          piece.type as PieceSymbol,
          squareIndex,
          piece.color as Color,
          whiteNonPawnMaterial + blackNonPawnMaterial
        );

        if (piece.color === 'w') {
          score += positionalVal;
        } else {
          score -= positionalVal;
        }
      }
    }

    // Bishop Pair Bonus (+35 cp)
    if (whiteBishops >= 2) score += 35;
    if (blackBishops >= 2) score -= 35;

    // Pawn Structure (Doubled & Isolated Pawns)
    for (let col = 0; col < 8; col++) {
      if (whitePawnFiles[col] > 1) score -= (whitePawnFiles[col] - 1) * 20;
      if (blackPawnFiles[col] > 1) score += (blackPawnFiles[col] - 1) * 20;

      const hasWNeigh = (col > 0 && whitePawnFiles[col - 1] > 0) || (col < 7 && whitePawnFiles[col + 1] > 0);
      if (whitePawnFiles[col] > 0 && !hasWNeigh) score -= 15;

      const hasBNeigh = (col > 0 && blackPawnFiles[col - 1] > 0) || (col < 7 && blackPawnFiles[col + 1] > 0);
      if (blackPawnFiles[col] > 0 && !hasBNeigh) score += 15;
    }

    // Rook Open & Semi-open Files
    for (let i = 0; i < whiteRookCols.length; i++) {
      const c = whiteRookCols[i];
      if (whitePawnFiles[c] === 0) {
        score += blackPawnFiles[c] === 0 ? 25 : 15;
      }
    }
    for (let i = 0; i < blackRookCols.length; i++) {
      const c = blackRookCols[i];
      if (blackPawnFiles[c] === 0) {
        score -= whitePawnFiles[c] === 0 ? 25 : 15;
      }
    }

    return score;
  }

  private getPositionalScore(
    type: PieceSymbol,
    index: number,
    color: Color,
    totalMajorMinorMaterial: number
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
      case 'k': {
        if (totalMajorMinorMaterial < 1600) {
          return KING_TABLE_ENDGAME[tableIndex] ?? 0;
        }
        return KING_TABLE_MIDDLEGAME[tableIndex] ?? 0;
      }
      default:
        return 0;
    }
  }

  public orderMoves(moves: ChessJsMove[]): void {
    moves.sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;

      // 1. MVV-LVA: Most Valuable Victim - Least Valuable Attacker
      if (a.captured) {
        scoreA +=
          (PIECE_VALUES[a.captured as PieceSymbol] ?? 100) * 10 -
          (PIECE_VALUES[a.piece as PieceSymbol] ?? 100);
      }
      if (b.captured) {
        scoreB +=
          (PIECE_VALUES[b.captured as PieceSymbol] ?? 100) * 10 -
          (PIECE_VALUES[b.piece as PieceSymbol] ?? 100);
      }

      // 2. Promotions
      if (a.promotion) {
        scoreA += a.promotion === 'q' ? 900 : 400;
      }
      if (b.promotion) {
        scoreB += b.promotion === 'q' ? 900 : 400;
      }

      // 3. Checks
      if (a.san.includes('+')) scoreA += 80;
      if (b.san.includes('+')) scoreB += 80;

      return scoreB - scoreA;
    });
  }
}
