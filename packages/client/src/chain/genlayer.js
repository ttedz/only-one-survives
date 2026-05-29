/**
 * Wallet + GenLayer reads for the lean, free-to-play version.
 *
 * Players connect their OWN wallet (MetaMask) purely for IDENTITY — their
 * address is their leaderboard entry. They never sign a game transaction and
 * need NO tokens: the server records results and pays the gas.
 *
 * We never see or store the player's key. Reads are free and need no wallet.
 */

import { createClient } from "genlayer-js";
import { simulator } from "genlayer-js/chains";

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;

let address = null;

export function getAddress() {
  return address;
}

export async function connectWallet() {
  if (!window.ethereum) {
    throw new Error("No wallet found. Install MetaMask.");
  }
  const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
  address = accounts[0];
  return address;
}

/** Read a player's leaderboard stats (free, no wallet needed). */
export async function getPlayerStats(playerAddress) {
  if (!CONTRACT_ADDRESS) throw new Error("VITE_CONTRACT_ADDRESS not set");
  const client = createClient({ chain: simulator });
  const raw = await client.readContract({
    address: CONTRACT_ADDRESS,
    functionName: "get_player",
    args: [playerAddress],
  });
  return JSON.parse(raw);
}

/** Read total matches played (free). */
export async function getTotalMatches() {
  if (!CONTRACT_ADDRESS) throw new Error("VITE_CONTRACT_ADDRESS not set");
  const client = createClient({ chain: simulator });
  return client.readContract({
    address: CONTRACT_ADDRESS,
    functionName: "total_matches",
    args: [],
  });
}
