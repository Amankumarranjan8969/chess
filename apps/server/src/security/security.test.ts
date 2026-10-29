import test from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword } from '../auth/password.js';
import { TokenService } from '../auth/tokens.js';
import { RateLimiter } from './rateLimit.js';
import { parseMove, parseRoomId, parseTimeControl, sanitizeName } from './validation.js';
import { GameRoom } from '../game/GameRoom.js';

test('Password hashing - scrypt salting and verification', async () => {
  const hash = await hashPassword('secretPassword123');
  assert.ok(hash.startsWith('scrypt$'), 'Hash should start with scrypt$');
  const valid = await verifyPassword('secretPassword123', hash);
  assert.equal(valid, true, 'Correct password verifies successfully');
  const invalid = await verifyPassword('wrongPassword', hash);
  assert.equal(invalid, false, 'Wrong password rejected');
});

test('TokenService - Sign and verify HMAC token', () => {
  const secret = Buffer.from('super-secret-key-32-bytes-long!!');
  const service = new TokenService(secret);
  const token = service.sign({ sub: 'user-123', ep: 1, exp: Math.floor(Date.now() / 1000) + 3600 });
  const verified = service.verify(token);
  assert.ok(verified, 'Token should verify');
  assert.equal(verified?.sub, 'user-123');
  assert.equal(verified?.ep, 1);

  // Tampered token
  const tampered = token.slice(0, -4) + 'abcd';
  assert.equal(service.verify(tampered), null, 'Tampered token rejected');
});

test('RateLimiter - Sliding window enforcement', () => {
  const limiter = new RateLimiter(3, 1000);
  assert.equal(limiter.allow('test-ip'), true);
  assert.equal(limiter.allow('test-ip'), true);
  assert.equal(limiter.allow('test-ip'), true);
  assert.equal(limiter.allow('test-ip'), false, 'Exceeded rate limit should be blocked');
});

test('Validation - Sanitization and range limits', () => {
  assert.equal(sanitizeName('<script>alert("xss")</script>', 'default'), 'scriptalert(xss)/script');
  assert.equal(parseRoomId('abc123'), 'ABC123');
  assert.throws(() => parseRoomId('!invalid!'));
  assert.throws(() => parseTimeControl({ initialMs: 100, incrementMs: 0 })); // too small
});

test('GameRoom - Clock uses server authoritative time, ignoring clientTimestamp', () => {
  const room = new GameRoom('SECTEST', { initialMs: 300000, incrementMs: 0 });
  room.addPlayer('w-player', 'Alice', 'w');
  room.addPlayer('b-player', 'Bob', 'b');

  // Client attempts to claim move happened at epoch (clientTimestamp: 1) to burn opponent clock
  const moveRes = room.makeMove('w-player', 'e4', 1);
  assert.equal(moveRes.success, true);

  const state = room.getPublicState();
  // Black's clock should NOT be 0 (flag should not have fallen!)
  assert.ok(state.gameState.clocks!.blackRemainingMs > 290000, 'Black clock was not drained by client forgery');
  assert.equal(state.gameState.status, 'active');
  room.destroy();
});
