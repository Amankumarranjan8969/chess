import { useState, useRef, useCallback } from 'react';
import { ChessAI, GameSnapshot } from '@chess/core';

export type AIDifficulty = 'easy' | 'medium' | 'hard' | 'grandmaster';

export function useChessAI() {
  const [isThinking, setIsThinking] = useState(false);
  const aiRef = useRef<ChessAI>(new ChessAI());
  const abortControllerRef = useRef<boolean>(false);

  const getMove = useCallback(
    async (
      snapshot: GameSnapshot,
      difficulty: AIDifficulty
    ): Promise<{ from: string; to: string; promotion?: string } | null> => {
      setIsThinking(true);
      abortControllerRef.current = false;

      // Realistic thinking delay so the clock visibly ticks
      const simulatedThinkingMs =
        difficulty === 'easy'
          ? 800
          : difficulty === 'medium'
          ? 1200
          : difficulty === 'hard'
          ? 1800
          : 2200;

      await new Promise((res) => setTimeout(res, simulatedThinkingMs));

      if (abortControllerRef.current || snapshot.status !== 'active') {
        setIsThinking(false);
        return null;
      }

      const searchConfig =
        difficulty === 'easy'
          ? { depth: 1, quiescenceDepth: 0, timeLimitMs: 1500 }
          : difficulty === 'medium'
          ? { depth: 2, quiescenceDepth: 2, timeLimitMs: 2500 }
          : difficulty === 'hard'
          ? { depth: 3, quiescenceDepth: 3, timeLimitMs: 3000 }
          : { depth: 4, quiescenceDepth: 5, timeLimitMs: 4000 };

      const result = aiRef.current.findBestMove(snapshot.fen, searchConfig);

      setIsThinking(false);

      if (!result.bestMove) return null;

      return {
        from: result.bestMove.from,
        to: result.bestMove.to,
        promotion: result.bestMove.promotion,
      };
    },
    []
  );

  const cancelSearch = useCallback(() => {
    abortControllerRef.current = true;
    setIsThinking(false);
  }, []);

  return { getMove, isThinking, cancelSearch };
}
