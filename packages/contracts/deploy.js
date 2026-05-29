/**
 * Deploy the Only One Survives contract.
 *
 * IMPORTANT — YOU deploy this with YOUR OWN wallet.
 * ------------------------------------------------------------------
 * This script reads your private key from the environment variable
 * DEPLOYER_PRIVATE_KEY. NEVER hard-code a key here and NEVER commit it.
 * Put it in a local `.env` file (already gitignored) or export it in your
 * shell only for the duration of the deploy:
 *
 *     export DEPLOYER_PRIVATE_KEY=0xyourkey
 *     export TRUSTED_SERVER_ADDRESS=0xyourServerWalletAddress
 *     node deploy.js
 *
 * Alternatively, deploy from the GenLayer CLI which manages the wallet for you:
 *     genlayer deploy --contract only_one_survives.py
 * See: https://docs.genlayer.com/developers/intelligent-contracts/deploying
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient, createAccount } from "genlayer-js";
import { simulator } from "genlayer-js/chains"; // swap for testnet/mainnet when ready

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const pk = process.env.DEPLOYER_PRIVATE_KEY;
  const trustedServer = process.env.TRUSTED_SERVER_ADDRESS;

  if (!pk) throw new Error("Set DEPLOYER_PRIVATE_KEY in your environment (your wallet).");
  if (!trustedServer) throw new Error("Set TRUSTED_SERVER_ADDRESS (the game server's wallet).");

  const account = createAccount(pk);
  const client = createClient({ chain: simulator, account });

  const code = fs.readFileSync(
    path.join(__dirname, "only_one_survives.py"),
    "utf8"
  );

  console.log("Deploying Only One Survives as", account.address, "...");

  const txHash = await client.deployContract({
    code,
    args: [trustedServer], // constructor: trusted_server
  });

  console.log("Deploy tx:", txHash);
  const receipt = await client.waitForTransactionReceipt({ hash: txHash, status: "FINALIZED" });
  console.log("Deployed! Contract address:", receipt.data?.contract_address ?? receipt);
  console.log("\nSave that address into your client/server .env as CONTRACT_ADDRESS.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
