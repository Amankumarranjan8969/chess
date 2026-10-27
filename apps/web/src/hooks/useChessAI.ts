import { useState, useRef, useCallback } from 'react';
import { ChessAI, DetailedMove, GameSnapshot } from '@chess/core';

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

      // Small natural delay so user sees opponent "thinking"
      const delay = difficulty === 'easy' ? 400 : difficulty === 'medium' ? 700 : 1000;
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
