import { Chess, Move as ChessJsMove, Square as ChessJsSquare } from 'chess.js';
import {
  CastlingRights,
  Color,
  DetailedMove,
  EndReason,
  GameResult,
  GameSnapshot,
  GameStatus,
  MoveInput,
  Piece,
  PieceSymbol,
  Square,
  TimeControl,
} from '../types/index.js';
import { STARTING_FEN } from '../constants/index.js';
import { ChessClock } from '../clock/index.js';

export class ChessGame {
  private engine: Chess;
  private status: GameStatus = 'waiting';
  private result: GameResult = null;
  private endReason: EndReason | null = null;
  private gameVersion: number = 0;
  private positionHistory: Map<string, number> = new Map();
  private moveHistory: DetailedMove[] = [];
  private clock?: ChessClock;

  constructor(
    initialFen: string = STARTING_FEN,
    options?: { timeControl?: TimeControl }
  ) {
    this.engine = new Chess(initialFen);
    this.status = 'active';
    this.recordPosition(initialFen);

    if (options?.timeControl) {
      this.clock = new ChessClock(options.timeControl);
      this.clock.start(this.engine.turn() as Color);
    }

    this.checkTerminalConditions();
  }

  public getFen(): string {
    return this.engine.fen();
  }

  public getSideToMove(): Color {
    return this.engine.turn() as Color;
  }

  public getLegalMoves(square?: Square): DetailedMove[] {
    if (this.status !== 'active') return [];

    const moves = this.engine.moves({
      square: square as ChessJsSquare | undefined,
      verbose: true,
    }) as ChessJsMove[];

    return moves.map((m) => this.toDetailedMove(m, false));
  }

  public isLegalMove(from: Square, to: Square, promotion?: PieceSymbol): boolean {
    if (this.status !== 'active') return false;
    const moves = this.engine.moves({ verbose: true }) as ChessJsMove[];
    return moves.some((m) => {
      const match = m.from === from && m.to === to;
      if (!match) return false;
      if (promotion) return m.promotion === promotion;
      return true;
    });
  }

  public makeMove(
    input: MoveInput | string,
    clientTimestamp: number = Date.now()
  ): { success: boolean; move?: DetailedMove; error?: string } {
    if (this.status !== 'active') {
      return { success: false, error: 'Game is not active' };
    }

    // Check clock flag before move
    if (this.clock) {
      const flag = this.clock.checkFlagFall(clientTimestamp);
      if (flag.hasFlagFallen && flag.fallenColor) {
        this.handleTimeout(flag.fallenColor);
        return { success: false, error: 'Time expired' };
      }
    }

    let executedMove: ChessJsMove | null = null;
    try {
      if (typeof input === 'string') {
        executedMove = this.engine.move(input);
      } else {
        executedMove = this.engine.move({
          from: input.from as ChessJsSquare,
          to: input.to as ChessJsSquare,
          promotion: input.promotion,
        });
      }
    } catch {
      return { success: false, error: 'Illegal move' };
    }

    if (!executedMove) {
      return { success: false, error: 'Illegal move' };
    }

    this.gameVersion++;
    const fenAfter = this.engine.fen();
    this.recordPosition(fenAfter);

    // Switch clock turn and add increment
    if (this.clock) {
      this.clock.switchTurn(this.engine.turn() as Color, clientTimestamp);
    }

    const clockState = this.clock?.getState(clientTimestamp);

    const detailed = this.toDetailedMove(executedMove, true, {
      fenAfter,
      ply: this.moveHistory.length + 1,
      timestamp: clientTimestamp,
      whiteRemainingMs: clockState?.whiteRemainingMs,
      blackRemainingMs: clockState?.blackRemainingMs,
    });

    this.moveHistory.push(detailed);

    this.checkTerminalConditions();

    return { success: true, move: detailed };
  }

  public claimDraw(type: 'threefold' | 'fifty_moves'): { success: boolean; error?: string } {
    if (this.status !== 'active') {
      return { success: false, error: 'Game is not active' };
    }

    if (type === 'threefold') {
      const currentPosKey = this.normalizeFenForRepetition(this.engine.fen());
      const count = this.positionHistory.get(currentPosKey) ?? 0;
      if (count >= 3 || this.engine.isThreefoldRepetition()) {
        this.status = 'finished';
        this.result = '1/2-1/2';
        this.endReason = 'threefold_repetition';
        this.clock?.pause();
        this.gameVersion++;
        return { success: true };
      }
      return { success: false, error: 'Threefold repetition condition not met' };
    }

    if (type === 'fifty_moves') {
      const halfmove = this.getHalfmoveClock();
      if (halfmove >= 100) {
        this.status = 'finished';
        this.result = '1/2-1/2';
        this.endReason = 'fifty_move_rule';
        this.clock?.pause();
        this.gameVersion++;
        return { success: true };
      }
      return { success: false, error: 'Fifty-move rule condition not met' };
    }

    return { success: false, error: 'Invalid draw claim type' };
  }

  public resign(resigningColor: Color): void {
    if (this.status !== 'active') return;
    this.status = 'finished';
    this.result = resigningColor === 'w' ? '0-1' : '1-0';
    this.endReason = 'resignation';
    this.clock?.pause();
    this.gameVersion++;
  }

  public agreeDraw(): void {
    if (this.status !== 'active') return;
    this.status = 'finished';
    this.result = '1/2-1/2';
    this.endReason = 'agreement';
    this.clock?.pause();
    this.gameVersion++;
  }

  public handleTimeout(fallenColor: Color): void {
    if (this.status !== 'active') return;
    this.status = 'finished';

    // FIDE rule: timeout is a draw if opponent does not have sufficient mating material
    const winningColor = fallenColor === 'w' ? 'b' : 'w';
    if (this.hasInsufficientMaterialForColor(winningColor)) {
      this.result = '1/2-1/2';
      this.endReason = 'insufficient_material';
    } else {
      this.result = winningColor === 'w' ? '1-0' : '0-1';
      this.endReason = 'timeout';
    }

    this.clock?.pause();
    this.gameVersion++;
  }

  public getBoard(): (Piece | null)[][] {
    const rawBoard = this.engine.board();
    return rawBoard.map((row) =>
      row.map((cell) => {
        if (!cell) return null;
        return {
          type: cell.type as PieceSymbol,
          color: cell.color as Color,
        };
      })
    );
  }

  public getSnapshot(now: number = Date.now()): GameSnapshot {
    if (this.clock && this.status === 'active') {
      const flag = this.clock.checkFlagFall(now);
      if (flag.hasFlagFallen && flag.fallenColor) {
        this.handleTimeout(flag.fallenColor);
      }
    }

    const currentPosKey = this.normalizeFenForRepetition(this.engine.fen());
    const repetitionCount = this.positionHistory.get(currentPosKey) ?? 0;
    const halfmove = this.getHalfmoveClock();

    return {
      fen: this.engine.fen(),
      sideToMove: this.engine.turn() as Color,
      castlingRights: this.getCastlingRights(),
      enPassantSquare: this.getEnPassantSquare(),
      halfmoveClock: halfmove,
      fullmoveNumber: this.getFullmoveNumber(),
      status: this.status,
      result: this.result,
      endReason: this.endReason,
      isCheck: this.engine.inCheck(),
      isCheckmate: this.engine.isCheckmate(),
      isStalemate: this.engine.isStalemate(),
      isDraw: this.engine.isDraw() || this.result === '1/2-1/2',
      canClaimThreefold: repetitionCount >= 3 || this.engine.isThreefoldRepetition(),
      canClaimFiftyMoves: halfmove >= 100,
      isFivefoldRepetition: repetitionCount >= 5,
      isSeventyFiveMoves: halfmove >= 150,
      isInsufficientMaterial: this.engine.isInsufficientMaterial(),
      gameVersion: this.gameVersion,
      moveHistory: [...this.moveHistory],
      lastMove: this.moveHistory.length > 0 ? this.moveHistory[this.moveHistory.length - 1] : null,
      clocks: this.clock?.getState(now),
    };
  }

  public getClock(): ChessClock | undefined {
    return this.clock;
  }

  private checkTerminalConditions(): void {
    if (this.status !== 'active') return;

    if (this.engine.isCheckmate()) {
      this.status = 'finished';
      this.result = this.engine.turn() === 'w' ? '0-1' : '1-0';
      this.endReason = 'checkmate';
      this.clock?.pause();
      return;
    }

    if (this.engine.isStalemate()) {
      this.status = 'finished';
      this.result = '1/2-1/2';
      this.endReason = 'stalemate';
      this.clock?.pause();
      return;
    }

    if (this.engine.isInsufficientMaterial()) {
      this.status = 'finished';
      this.result = '1/2-1/2';
      this.endReason = 'insufficient_material';
      this.clock?.pause();
      return;
    }

    // FIDE 9.6: Fivefold repetition is automatic draw
    const currentPosKey = this.normalizeFenForRepetition(this.engine.fen());
    const count = this.positionHistory.get(currentPosKey) ?? 0;
    if (count >= 5) {
      this.status = 'finished';
      this.result = '1/2-1/2';
      this.endReason = 'fivefold_repetition';
      this.clock?.pause();
      return;
    }

    // FIDE 9.6: Seventy-five-move rule is automatic draw
    if (this.getHalfmoveClock() >= 150) {
      this.status = 'finished';
      this.result = '1/2-1/2';
      this.endReason = 'seventy_five_move_rule';
      this.clock?.pause();
      return;
    }
  }

  private recordPosition(fen: string): void {
    const key = this.normalizeFenForRepetition(fen);
    const count = this.positionHistory.get(key) ?? 0;
    this.positionHistory.set(key, count + 1);
  }

  /**
   * For repetition detection under FIDE rules, we compare board, side to move,
   * castling rights, and valid en passant target.
   * Halfmove clock and fullmove number are ignored.
   */
  private normalizeFenForRepetition(fen: string): string {
    const parts = fen.split(' ');
    return parts.slice(0, 4).join(' ');
  }

  private getCastlingRights(): CastlingRights {
    const parts = this.engine.fen().split(' ');
    const castling = parts[2] || '-';
    return {
      w: {
        k: castling.includes('K'),
        q: castling.includes('Q'),
      },
      b: {
        k: castling.includes('k'),
        q: castling.includes('q'),
      },
    };
  }

  private getEnPassantSquare(): Square | null {
    const parts = this.engine.fen().split(' ');
    const ep = parts[3];
    return ep && ep !== '-' ? (ep as Square) : null;
  }

  private getHalfmoveClock(): number {
    const parts = this.engine.fen().split(' ');
    return parseInt(parts[4] ?? '0', 10);
  }

  private getFullmoveNumber(): number {
    const parts = this.engine.fen().split(' ');
    return parseInt(parts[5] ?? '1', 10);
  }

  private hasInsufficientMaterialForColor(color: Color): boolean {
    const board = this.getBoard();
    const pieces: PieceSymbol[] = [];
    for (const row of board) {
      for (const piece of row) {
        if (piece && piece.color === color) {
          pieces.push(piece.type);
        }
      }
    }

    // If side only has a King, they can never checkmate
    if (pieces.length === 1 && pieces[0] === 'k') return true;

    // If King + 1 minor piece (Knight or Bishop), they cannot checkmate alone
    if (pieces.length === 2 && (pieces.includes('n') || pieces.includes('b'))) {
      return true;
    }

    return false;
  }

  private toDetailedMove(
    m: ChessJsMove,
    isApplied: boolean,
    extra?: {
      fenAfter: string;
      ply: number;
      timestamp: number;
      whiteRemainingMs?: number;
      blackRemainingMs?: number;
    }
  ): DetailedMove {
    const uci = `${m.from}${m.to}${m.promotion ?? ''}`;
    const isCastling = m.flags.includes('k') || m.flags.includes('q');
    const isEnPassant = m.flags.includes('e');
    const isPromotion = Boolean(m.promotion);

    return {
      from: m.from as Square,
      to: m.to as Square,
      piece: m.piece as PieceSymbol,
      color: m.color as Color,
      san: m.san,
      uci,
      captured: m.captured ? (m.captured as PieceSymbol) : undefined,
      promotion: isPromotion ? (m.promotion as PieceSymbol) : undefined,
      isCheck: isApplied ? this.engine.inCheck() : false,
      isCheckmate: isApplied ? this.engine.isCheckmate() : false,
      isCastling,
      isEnPassant,
      fenAfter: extra?.fenAfter ?? '',
      ply: extra?.ply ?? 0,
      timestamp: extra?.timestamp ?? Date.now(),
      whiteRemainingMs: extra?.whiteRemainingMs,
      blackRemainingMs: extra?.blackRemainingMs,
    };
  }
}
