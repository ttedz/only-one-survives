# Getting Started — Only One Survives

A complete, from-zero guide. Follow it top to bottom. You can stop after Part 3
(the game runs and is playable), then come back for Part 4+ when you want the
GenLayer features on.

Each `[ ]` is a checkbox — tick them off as you go.

> **You never need to install Node.js.** Everything runs in the cloud (GitHub
> Codespaces). The only things on your own machine are a browser and MetaMask.

---

## Part 0 — One-time accounts (~10 min)

### 0.1 GitHub account
- [ ] Go to https://github.com and sign up (free) if you don't have an account.

### 0.2 MetaMask wallet
- [ ] Install the MetaMask extension: https://metamask.io → "Download".
- [ ] Create a new wallet. **Write down your Secret Recovery Phrase on paper and
      keep it private.** Anyone with it controls your wallet. Nobody — not me,
      not GenLayer — will ever ask for it.
- [ ] This wallet is your identity in the game and your deployer wallet later.

> 🔐 **Safety:** For this project, consider creating a **fresh wallet used only
> for development**. It will only ever hold worthless test tokens, and later one
> of its keys goes into a config file. Never use a wallet that holds anything
> real.

---

## Part 1 — Put the code on GitHub (~5 min)

### 1.1 Create an empty repo
- [ ] Go to https://github.com/new
- [ ] Repository name: `only-one-survives`
- [ ] Leave everything else default. **Do not** add a README or .gitignore.
- [ ] Click **Create repository**. Keep this page open.

### 1.2 Upload the code (easiest: web upload)
- [ ] Unzip the `only-one-survives.zip` you were given.
- [ ] On your new repo page, click **uploading an existing file**.
- [ ] Open the unzipped folder, select **all files inside it** (including the
      hidden `.devcontainer`, `.gitpod.yml`, `.gitignore`, `.env.example`), and
      drag them into the browser.
- [ ] Scroll down, click **Commit changes**.

> If hidden files (the ones starting with `.`) are awkward to drag on your OS,
> you can do the push from inside the Codespace terminal in Part 2 instead —
> ask and I'll give you the exact `git` commands.

---

## Part 2 — Open it in a Codespace (~3 min)

This is your cloud coding environment. Same workspace from work or home.

- [ ] On the repo page, click the green **Code** button.
- [ ] Choose the **Codespaces** tab → **Create codespace on main**.
- [ ] Wait ~1 minute while it builds. It automatically installs Node, Python,
      and all dependencies (`npm install`).
- [ ] You now have VS Code running in your browser. 🎉

---

## Part 3 — Run the game (no blockchain yet) (~3 min)

The game is fully playable offline first. The on-chain bits stay dormant until
Part 4, so this is a safe place to confirm everything works.

In the Codespace, open a terminal (top menu → Terminal → New Terminal), then:

- [ ] Start the server:
  ```bash
  npm run dev:server
  ```
  You should see: `Only One Survives server listening on ws://localhost:2567`

- [ ] Open a **second** terminal (the `+` icon in the terminal panel) and start
      the client:
  ```bash
  npm run dev:client
  ```

- [ ] A popup says a port was opened (5173). Click **Open in Browser**.
- [ ] You'll see the game. Type a name and click **Connect wallet** (MetaMask
      pops up — approve). You're in the lobby.

### Test multiplayer
The game needs 2 players to start. To test alone:
- [ ] Copy the game URL and open it in a **second browser tab** (or an incognito
      window). Connect there too.
- [ ] With 2 tabs connected, the countdown starts and Floor Drops begins. Use
      **arrow keys** to move. Don't be on a tile when it drops!

If you got here: the game works. You can stop and come back anytime for the
GenLayer part below.

---

## Part 4 — Turn on GenLayer (the on-chain leaderboard + AI rounds)

This connects the game to GenLayer's **Testnet Asimov** — the live network where
validators run real LLMs (needed for the AI round-picker). Everything here is
**free**; test tokens come from a faucet.

### 4.1 Add Testnet Asimov to MetaMask
- [ ] Open the GenLayer networks page:
      https://docs.genlayer.com/developers/networks
- [ ] Add the Testnet Asimov RPC details to MetaMask (Settings → Networks → Add
      network → enter the RPC URL, chain ID, and currency symbol from that page).

### 4.2 Get free test GEN
- [ ] Open the faucet: https://testnet-faucet.genlayer.foundation/
- [ ] Connect/paste your wallet address and claim. You get 100 free GEN (once
      every 7 days). This covers all the gas you'll need.

### 4.3 Deploy the contract — with YOUR wallet
You deploy it; this project never handles your keys.

- [ ] In the Codespace terminal:
  ```bash
  cd packages/contracts
  ```
- [ ] You need your wallet's private key for the deploy script. In MetaMask:
      account menu → **Account details** → **Show private key** (enter your
      password). Copy it.

  > 🔐 Only ever do this with the **dedicated dev wallet** from Part 0. Never
  > export the key of a wallet holding anything real.

- [ ] Set the environment variables for the deploy (these live only in this
      terminal session, not in any file):
  ```bash
  export DEPLOYER_PRIVATE_KEY=0xYOUR_DEV_WALLET_KEY
  export TRUSTED_SERVER_ADDRESS=0xYOUR_DEV_WALLET_ADDRESS
  ```
  For development, using the **same wallet** for both is fine.

- [ ] Deploy:
  ```bash
  node deploy.js
  ```
- [ ] It prints a **contract address**. Copy it.

### 4.4 Tell the server and client about the contract

Create two small `.env` files (copy from the template):

- [ ] Server env:
  ```bash
  cd ../server
  cp ../../.env.example .env
  ```
  Open `packages/server/.env` and set:
  - `CONTRACT_ADDRESS` = the address you copied
  - `SERVER_PRIVATE_KEY` = your dev wallet's private key (same one)

- [ ] Client env:
  ```bash
  cd ../client
  cp ../../.env.example .env
  ```
  Open `packages/client/.env` and set:
  - `VITE_CONTRACT_ADDRESS` = the same contract address

> The `.env` files are gitignored, so your keys never get committed. ✅

### 4.5 Run it again, now on-chain
- [ ] Stop both dev servers (Ctrl+C in each terminal) and restart them:
  ```bash
  npm run dev:server
  ```
  ```bash
  npm run dev:client
  ```
- [ ] Play a match. When it ends, the server records the result on GenLayer, and
      before each round you'll see the **AI-picked round + taunt** appear in the
      lobby. Your wins now persist on the on-chain leaderboard.

---

## Part 5 — Let your Discord friends play

For others to join, your Codespace ports need to be reachable:

- [ ] In the Codespace **Ports** tab, find port **5173** (client) and **2567**
      (server). Right-click each → **Port Visibility** → **Public**.
- [ ] Copy the public URL for **2567** (it'll be `https://...-2567.app.github.dev`).
      In `packages/client/.env`, set `VITE_SERVER_URL` to the **wss** version of
      it (replace `https` with `wss`). Restart the client.
- [ ] Share the public **5173** URL in your Discord. Friends open it, connect a
      wallet, and join your arena.

> This is fine for casual sessions. For an always-on public game, the proper
> next step is hosting the client on Vercel and the server on a Node host
> (Railway/Render/Fly). Ask when you're ready and I'll walk you through it.

---

## Troubleshooting

- **"Could not reach server"** in the game → the server terminal isn't running,
  or the client's `VITE_SERVER_URL` is wrong.
- **Countdown never starts** → you need 2 connected players (use a second tab).
- **AI round/taunt doesn't show** → the chain call failed or timed out; the game
  falls back to a local round automatically. Check the server terminal logs and
  that `CONTRACT_ADDRESS` + `SERVER_PRIVATE_KEY` are set and the wallet has GEN.
- **Deploy fails** → confirm the wallet has test GEN (Part 4.2) and that
  `DEPLOYER_PRIVATE_KEY` / `TRUSTED_SERVER_ADDRESS` are exported in that terminal.
- A couple of GenLayer SDK calls in the contract are marked `# VERIFY:` — if the
  contract errors on deploy, those method names may differ in your installed SDK
  version; check the linked docs in `only_one_survives.py`.

---

## What to build next

- Make Floor Drops feel great (movement smoothing, warning flashes, sound).
- Add the next round (Laser Spin) — one server file + one client file.
- Live leaderboard overlay for streaming.

Ask me for any of these and we'll do it step by step.
