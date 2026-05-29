# Only One Survives

A minimalistic, real-time multiplayer elimination game — last player standing on
a tile wins. **Free to play**, with an on-chain leaderboard and AI-picked rounds
powered by [GenLayer](https://www.genlayer.com).

Think *Fall Guys*, stripped down. Players connect a wallet only for identity (it's
free, and they never need any tokens); the server records results to GenLayer and
pays the gas. Before each round, the contract's LLM picks the round and writes a
playful taunt — something a normal blockchain can't do.

> First round: **Floor Drops** — tiles disappear over time, don't be standing on
> one when it goes. Lasers, shrinking zones, and jump-timing rounds drop into the
> same skeleton later.

## Monorepo layout

```
packages/
  client/      browser game        — Vite + Phaser 3
  server/      realtime authority   — Colyseus (Node)
  contracts/   on-chain logic       — GenLayer Intelligent Contract (Python)
docs/
  architecture.md
```

See [docs/architecture.md](docs/architecture.md) for how the three layers fit
together and the trust model.

## Run in the cloud — recommended, no install

You don't need to install anything locally. This repo ships with a dev container
and a Gitpod config, so the whole environment (Node, Python, dependencies) spins
up in your browser. Same workspace from any machine — work, home, anywhere.

**GitHub Codespaces:** push this repo to GitHub → green **Code** button →
**Codespaces** → **Create codespace**. It builds, runs `npm install`, and you're
ready. Dependencies and ports (5173 client, 2567 server) are preconfigured.

**Gitpod:** open `https://gitpod.io/#<your-repo-url>`.

Then just run the dev servers (steps 3 and 4 below) inside the cloud terminal.
Only your wallet (MetaMask) stays in your local browser for signing.

## Prerequisites (only if running locally)

- Node.js 18+
- A wallet (MetaMask) for playing
- The [GenLayer CLI](https://docs.genlayer.com/developers/intelligent-contracts/tools/genlayer-cli)
  or `genlayer-js` for deploying

## 1. Install

```bash
npm install
```

## 2. Deploy the contract — with YOUR wallet

You deploy the contract yourself; this project never handles your keys.

```bash
cd packages/contracts
cp ../../.env.example .env        # then fill in DEPLOYER_PRIVATE_KEY + TRUSTED_SERVER_ADDRESS
node deploy.js
```

`DEPLOYER_PRIVATE_KEY` is read from your local environment only and is
gitignored. Never paste a private key into source or commit a `.env` file.
Prefer the CLI? `genlayer deploy --contract only_one_survives.py` manages the
wallet for you.

Copy the printed contract address into the server and client `.env` files.

## 3. Run the server

```bash
cd packages/server
cp ../../.env.example .env         # set CONTRACT_ADDRESS + SERVER_PRIVATE_KEY + PORT
npm run dev
```

The server wallet (`SERVER_PRIVATE_KEY`) must match the `TRUSTED_SERVER_ADDRESS`
you deployed with — that's the only address the contract trusts to report
results.

## 4. Run the client

```bash
cd packages/client
cp ../../.env.example .env         # set VITE_SERVER_URL + VITE_CONTRACT_ADDRESS
npm run dev
```

Open the printed URL in two browser tabs, connect a wallet in each, and you'll
be matched into the same arena.

## How it plays

1. Connect wallet (free — just your identity), pick a display name.
2. Get matched into an arena (2–16 players).
3. The GenLayer contract's LLM picks the round and taunts you. Survive Floor
   Drops — move with arrow keys, stay on solid tiles.
4. Last one alive wins; the result is written to GenLayer and the on-chain
   leaderboard updates. No tokens, no staking — pure play.

## Security notes

- Wallet keys live only in local `.env` files (deployer/server); `.gitignore`
  blocks them. Players never expose a key — they only connect for identity.
- Players send zero transactions and need zero tokens; the server records
  results and pays the small gas cost.
- Only the trusted server address can report results to the contract.

## Roadmap

- [ ] Laser Spin, Shrink Zone, Jump Timing, Wind Push, Blackout rounds
- [ ] Spectator mode + live on-chain leaderboard overlay for streaming
- [ ] Richer AI flavor (per-player taunts, dynamic difficulty)
- [ ] Optional ranked seasons

## License

MIT
