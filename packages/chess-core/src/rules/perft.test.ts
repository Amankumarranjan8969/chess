import test from 'node:test';
import assert from 'node:assert/strict';
import { Chess } from 'chess.js';

function perft(chess: Chess, depth: number): number {
  if (depth === 0) return 1;

  const moves = chess.moves({ verbose: true });
  let nodes = 0;

  for (const move of moves) {
    chess.move(move);
    nodes += perft(chess, depth - 1);
    chess.undo();
  }

  return nodes;
}

test('Perft - Starting position legal move tree', () => {
  const chess = new Chess();
  assert.equal(perft(chess, 1), 20);
  assert.equal(perft(chess, 2), 400);
  assert.equal(perft(chess, 3), 8902);
});

test('Perft - Position 2 (KiwiPete - tests castling & en passant complexities)', () => {
  const kiwiPete = 'r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1';
  const chess = new Chess(kiwiPete);
  assert.equal(perft(chess, 1), 48);
  assert.equal(perft(chess, 2), 2039);
});
