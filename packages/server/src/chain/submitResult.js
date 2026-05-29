/**
 * GenLayer writes for the lean, free-to-play version.
 *
 * The SERVER signs these with the server wallet (TRUSTED_SERVER_ADDRESS) using
 * SERVER_PRIVATE_KEY from the server environment only — never the client, never
 * committed. Because the server pays gas here, PLAYERS need no tokens at all.
 */

import crypto from "node:crypto";
import { createClient, createAccount } from "genlayer-js";
import { simulator } from "genlayer-js/chains";

const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const SERVER_PRIVATE_KEY = process.env.SERVER_PRIVATE_KEY;

let client;
function getClient() {
  if (!CONTRACT_ADDRESS) throw new Error("CONTRACT_ADDRESS not set");
  if (!SERVER_PRIVATE_KEY) throw new Error("SERVER_PRIVATE_KEY not set");
  if (!client) {
    const account = createAccount(SERVER_PRIVATE_KEY);
    client = createClient({ chain: simulator, account });
  }
  return client;
}

export function hashLog(log) {
  const json = typeof log === "string" ? log : JSON.stringify(log);
  return "0x" + crypto.createHash("sha256").update(json).digest("hex");
}

/**
 * Record a finished match on-chain and update the leaderboard.
 * @param {string} winnerAddress
 * @param {{addr:string,name:string}[]} players
 * @param {string} roundName
 */
export async function submitResult(winnerAddress, players, roundName) {
  const c = getClient();
  const logHash = hashLog({ winner: winnerAddress, players, round: roundName });

  const txHash = await c.writeContract({
    address: CONTRACT_ADDRESS,
    functionName: "report_result",
    args: [winnerAddress, JSON.stringify(players), roundName, logHash],
    value: 0n,
  });
  await c.waitForTransactionReceipt({ hash: txHash, status: "ACCEPTED" });
  return txHash;
}

/**
 * Ask the contract's LLM to pick the next round + taunt.
 * Returns { round, taunt }. Throws if the chain is unreachable — callers should
 * fall back to a local random round so gameplay never blocks.
 */
export async function pickNextRound() {
  const c = getClient();
  const txHash = await c.writeContract({
    address: CONTRACT_ADDRESS,
    functionName: "pick_next_round",
    args: [],
    value: 0n,
  });
  await c.waitForTransactionReceipt({ hash: txHash, status: "ACCEPTED" });

  // read the stored result
  const raw = await c.readContract({
    address: CONTRACT_ADDRESS,
    functionName: "get_last_round",
    args: [],
  });
  return JSON.parse(raw);
}
