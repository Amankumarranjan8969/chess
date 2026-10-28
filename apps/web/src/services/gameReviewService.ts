import { Chess } from 'chess.js';
import { ChessAI, detectOpening } from '@chess/core';
import { StoredGame, AnalyzedMove, GameReviewReport, MoveClassification } from '../types/platform.js';

export class GameReviewService {
  private static ai = new ChessAI();

  /**
   * Performs full analysis of a stored game move-by-move.
   * Generates position evaluations, move classifications, explanations,
   * alternative variations, and accuracy scores.
   */
  public static analyzeGame(game: StoredGame): GameReviewReport {
    const chess = new Chess(game.initialFen || undefined);
    const analyzedMoves: AnalyzedMove[] = [];

    let whiteTotalLoss = 0;
    let whiteCount = 0;
    let blackTotalLoss = 0;
    let blackCount = 0;

    const whiteStats: Record<MoveClassification, number> = {
      book: 0,
      best: 0,
      excellent: 0,
      good: 0,
      inaccuracy: 0,
      mistake: 0,
      blunder: 0,
      missed_win: 0,
    };

    const blackStats: Record<MoveClassification, number> = {
      book: 0,
      best: 0,
      excellent: 0,
      good: 0,
      inaccuracy: 0,
      mistake: 0,
      blunder: 0,
      missed_win: 0,
    };

    let evalBefore = 15; // Starting position is roughly +0.15 for White

    const openingDetection = detectOpening(game.moveHistory.map((m) => m.san));

    for (let i = 0; i < game.moveHistory.length; i++) {
      const move = game.moveHistory[i];
      const fenBefore = chess.fen();
      const isWhite = move.color === 'w';

      // Find best move in the position before making the move
      const bestMoveResult = this.ai.findBestMove(fenBefore, { depth: 2, quiescenceDepth: 2 });
      const bestAlternative = bestMoveResult.bestMove;

      // Execute the actual move played
      chess.move({ from: move.from, to: move.to, promotion: move.promotion });
      const fenAfter = chess.fen();

      // Evaluate the position after the move
      const evalAfterRaw = this.ai.evaluatePosition(chess);
      const evalAfter = chess.inCheck() && chess.isGameOver()
        ? isWhite ? 20000 : -20000
        : evalAfterRaw;

      // Evaluation delta from perspective of moving side
      const evalDelta = isWhite ? evalAfter - evalBefore : evalBefore - evalAfter;

      // Centipawn loss (capped at 700 to prevent skew)
      const cpLoss = Math.min(700, Math.max(0, -evalDelta));

      if (isWhite) {
        whiteTotalLoss += cpLoss;
        whiteCount++;
      } else {
        blackTotalLoss += cpLoss;
        blackCount++;
      }

      // Classification determination
      let classification: MoveClassification;

      if (i < 6) {
        classification = 'book';
      } else if (
        bestAlternative &&
        bestAlternative.from === move.from &&
        bestAlternative.to === move.to
      ) {
        classification = 'best';
      } else if (cpLoss <= 15) {
        classification = 'best';
      } else if (cpLoss <= 45) {
        classification = 'excellent';
      } else if (cpLoss <= 90) {
        classification = 'good';
      } else if (cpLoss <= 160) {
        classification = 'inaccuracy';
      } else if (cpLoss <= 300) {
        classification = 'mistake';
      } else {
        // Blunder or Missed Win
        if (isWhite ? evalBefore > 250 && evalAfter < 100 : evalBefore < -250 && evalAfter > -100) {
          classification = 'missed_win';
        } else {
          classification = 'blunder';
        }
      }

      if (isWhite) {
        whiteStats[classification]++;
      } else {
        blackStats[classification]++;
      }

      // Contextual explanation
      const explanation = this.generateMoveExplanation(
        move.san,
        classification,
        move.captured,
        move.isCheck,
        move.isCheckmate,
        bestAlternative?.san
      );

      // Variation line if alternative existed
      let variationSans: string[] | undefined;
      if (bestAlternative && bestAlternative.san !== move.san) {
        variationSans = [bestAlternative.san];
      }

      analyzedMoves.push({
        moveNumber: Math.floor(i / 2) + 1,
        color: move.color,
        san: move.san,
        uci: move.uci,
        fenBefore,
        fenAfter,
        classification,
        evalBeforeCp: evalBefore,
        evalAfterCp: evalAfter,
        bestAlternativeSan: bestAlternative?.san,
        bestAlternativeUci: bestAlternative ? `${bestAlternative.from}${bestAlternative.to}` : undefined,
        variationSans,
        explanation,
        capturedPiece: move.captured,
        isCheck: move.isCheck,
      });

      evalBefore = evalAfter;
    }

    // Accuracy Calculation (CAPS-like formula)
    const avgWhiteLoss = whiteCount > 0 ? whiteTotalLoss / whiteCount : 25;
    const avgBlackLoss = blackCount > 0 ? blackTotalLoss / blackCount : 25;

    const whiteAccuracy = Math.round(
      Math.max(40, Math.min(99, 100 - 0.65 * Math.pow(avgWhiteLoss, 0.72)))
    );
    const blackAccuracy = Math.round(
      Math.max(40, Math.min(99, 100 - 0.65 * Math.pow(avgBlackLoss, 0.72)))
    );

    // Identify biggest mistake & best move
    let biggestMistake: { moveIndex: number; move: AnalyzedMove } | undefined;
    let worstLoss = -1;

    let bestMoveObj: { moveIndex: number; move: AnalyzedMove } | undefined;

    analyzedMoves.forEach((m, idx) => {
      const isW = m.color === 'w';
      const loss = isW ? m.evalBeforeCp - m.evalAfterCp : m.evalAfterCp - m.evalBeforeCp;
      if (loss > worstLoss && (m.classification === 'blunder' || m.classification === 'mistake')) {
        worstLoss = loss;
        biggestMistake = { moveIndex: idx, move: m };
      }
      if (
        m.classification === 'best' &&
        (!bestMoveObj || Math.abs(m.evalAfterCp) > Math.abs(bestMoveObj.move.evalAfterCp))
      ) {
        bestMoveObj = { moveIndex: idx, move: m };
      }
    });

    const summary = {
      headline:
        game.result === '1-0'
          ? 'White converted an aggressive attack into checkmate.'
          : game.result === '0-1'
          ? 'Black dismantled the defense with precise tactical counter-play.'
          : 'A hard-fought, balanced draw with resilient defensive resourcefulness.',
      keyTakeaways: [
        `White maintained ${whiteAccuracy}% accuracy with ${whiteStats.best + whiteStats.excellent} top-tier moves.`,
        `Black demonstrated ${blackAccuracy}% accuracy in the ${openingDetection?.name || 'Middlegame'}.`,
        biggestMistake
          ? `The turning point arrived on move ${biggestMistake.move.moveNumber} (${biggestMistake.move.san}), swinging the evaluation.`
          : 'Both sides avoided critical blunders throughout the encounter.',
      ],
      recommendedPracticeTopics: [
        'Tactical Pins & Removal of Defender',
        'Rook Endgames & Active Piece Placement',
        'Defending the Back Rank & King Safety',
      ],
    };

    return {
      gameId: game.id,
      analyzedMoves,
      whiteAccuracy,
      blackAccuracy,
      whiteStats,
      blackStats,
      biggestMistake,
      bestMove: bestMoveObj,
      openingInfo: openingDetection ? { eco: openingDetection.eco, name: openingDetection.name } : undefined,
      summary,
    };
  }

  private static generateMoveExplanation(
    san: string,
    classification: MoveClassification,
    captured?: string,
    isCheck?: boolean,
    isCheckmate?: boolean,
    bestSan?: string
  ): { whatHappened: string; whyItMatters: string; tacticalIdea?: string } {
    if (isCheckmate) {
      return {
        whatHappened: `${san} delivers an inescapable checkmate on the king.`,
        whyItMatters: 'The king has no legal squares, no piece can block, and the attacker cannot be captured.',
        tacticalIdea: 'Mating Net Conversion',
      };
    }

    if (classification === 'book') {
      return {
        whatHappened: `${san} follows standard opening repertoire and established chess theory.`,
        whyItMatters: 'Fights for early center control and accelerates piece development.',
        tacticalIdea: 'Opening Principles',
      };
    }

    if (classification === 'best') {
      return {
        whatHappened: `${san} was the strongest move on the board according to deep engine calculation.`,
        whyItMatters: isCheck
          ? 'Applies forcing pressure on the enemy king while consolidating positional superiority.'
          : captured
          ? 'Executes a favorable material exchange while preserving tactical initiative.'
          : 'Optimizes piece coordination and restricts the opponent’s counterplay.',
        tacticalIdea: 'Positional Precision',
      };
    }

    if (classification === 'excellent') {
      return {
        whatHappened: `${san} is an active, aggressive continuation.`,
        whyItMatters: 'Maintains tactical pressure and challenges the opponent to find precise defensive responses.',
        tacticalIdea: 'Initiative Maintenance',
      };
    }

    if (classification === 'good') {
      return {
        whatHappened: `${san} is a solid and playable move, though slightly less forcing than the engine’s top choice.`,
        whyItMatters: bestSan
          ? `Playing ${bestSan} would have offered sharper tactical pressure.`
          : 'Preserves the overall balance of the position.',
        tacticalIdea: 'Solid Development',
      };
    }

    if (classification === 'inaccuracy') {
      return {
        whatHappened: `${san} gives up a slight portion of the initiative.`,
        whyItMatters: bestSan
          ? `Engine strongly favored ${bestSan}, which retained tighter central control.`
          : 'Allows the opponent easier defensive coordination.',
        tacticalIdea: 'Positional Slippage',
      };
    }

    if (classification === 'mistake') {
      return {
        whatHappened: `${san} was a notable tactical or positional mistake.`,
        whyItMatters: bestSan
          ? `Allows the opponent to exploit weak squares. ${bestSan} was required to hold equality.`
          : 'Concedes significant spatial control or tactical tempo.',
        tacticalIdea: 'Defensive Oversight',
      };
    }

    if (classification === 'blunder') {
      return {
        whatHappened: `${san} is a decisive blunder that significantly damages the position.`,
        whyItMatters: bestSan
          ? `Surrenders crucial material or positional safety. ${bestSan} was essential.`
          : 'Gives the opponent an immediate winning tactical sequence.',
        tacticalIdea: 'Tactical Blunder',
      };
    }

    // Missed Win
    return {
      whatHappened: `${san} misses a decisive winning continuation.`,
      whyItMatters: bestSan
        ? `${bestSan} would have sealed an immediate tactical advantage or forced checkmate.`
        : 'Allows the opponent to stay alive in the match.',
      tacticalIdea: 'Missed Tactical Knockout',
    };
  }
}
