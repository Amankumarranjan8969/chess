import { useState, useRef, useCallback } from 'react';
import { ChessAI, GameSnapshot } from '@chess/core';

export type AIDifficulty = 'easy' | 'medium' | 'hard';

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

      // Realistic thinking time (1.2s - 2.5s) so the computer's clock visibly ticks down
      const delay = difficulty === 'easy' ? 1000 : difficulty === 'medium' ? 1800 : 2500;
      await new Promise((res) => setTimeout(res, delay));

      if (abortControllerRef.current || snapshot.status !== 'active') {
        setIsThinking(false);
        return null;
      }

      const depth = difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3;
      const result = aiRef.current.findBestMove(snapshot.fen, { depth });

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
