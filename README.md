# ♟️ Grandmaster Arena: Production Chess Platform

A production-grade, authoritative full-stack chess platform with an enterprise security model, real-time multiplayer over WebSockets, tournament evaluation engine, tactical puzzles database, progressive learning academy, and a Super Admin management command center.

---

## 🏛️ Architecture & Separation of Concerns

* **Chess Rules Authority (`packages/chess-core`)**: Pure FIDE-compliant chess engine handling valid move generation, check/checkmate detection, castling rights, en passant, promotion, and FIDE draw claims (threefold, 50-move rule, insufficient material).
* **Computer AI Opponent (`packages/chess-core/src/ai`)**: Search-based minimax engine with alpha-beta pruning, quiescence search, piece-square tables, and 4 difficulty tiers (Easy, Medium, Hard, and Grandmaster 2400+).
* **Authoritative Multiplayer Server (`apps/server`)**: Real-time Node.js + Express + Socket.IO server enforcing server-side clock tracking, seat-key reconnections, sliding-window rate limiting, and scrypt password hashing.
* **Modern Web Frontend (`apps/web`)**: React 19 + TypeScript + Vite + Tailwind CSS featuring responsive daylight/night mode, vector SVG pieces, live evaluation bar, interactive tactical puzzles, game review with blunder classification, and PGN export.

---

## 🔒 Security Architecture

1. **Zero Secret Leakage**: No hardcoded passwords, private keys, or credentials in client bundles.
2. **Server-Authoritative Clock**: Clocks run entirely on server time (`Date.now()`); client timestamps are ignored to prevent time manipulation.
3. **Password Security**: Passwords hashed using Node.js `crypto.scrypt` with random 16-byte salts and `timingSafeEqual` comparison.
4. **Token Security**: Session authorization verified via HMAC-SHA256 signed bearer tokens with session epoch invalidation on logout.
5. **Denial-of-Service Protection**: Sliding-window rate limiters across socket events, room creation, authentication endpoints, and concurrent connection caps per IP.
6. **Origin Isolation**: CORS and WebSocket access restricted to local LAN and authorized origins.

---

## 🚀 Quick Start

### 1. Prerequisites
* **Node.js**: v18.0.0 or higher
* **npm**: v9.0.0 or higher

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env` and set your secrets:
```bash
cp .env.example .env
```

### 4. Run Test Suites
```bash
npm run test --workspace=@chess/core
npm run test --workspace=@chess/server
```

### 5. Launch Development Servers
* **Authoritative Server** (`http://localhost:4000`):
  ```bash
  npm run dev --workspace=@chess/server
  ```
* **React Web Application** (`http://localhost:3000`):
  ```bash
  npm run dev --workspace=@chess/web
  ```

---

## 📦 Production Build

```bash
# Build core, server, and web workspaces
npm run build --workspace=@chess/core
npm run build --workspace=@chess/server
npm run build --workspace=@chess/web
```

---

## 🛡️ License

MIT License. Designed and engineered for chess enthusiasts, coaches, and competitive players.
