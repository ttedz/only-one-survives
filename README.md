import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene.js";
import { LobbyScene } from "./scenes/LobbyScene.js";
import { ArenaScene } from "./scenes/ArenaScene.js";
import { ResultScene } from "./scenes/ResultScene.js";
import { connectWallet, getAddress } from "./chain/genlayer.js";

const config = {
  type: Phaser.AUTO,
  parent: "game",
  width: 600,
  height: 600,
  backgroundColor: "#0d0d12",
  pixelArt: true,
  scene: [BootScene, LobbyScene, ArenaScene, ResultScene],
};

export const game = new Phaser.Game(config);

// shared, mutable session object the scenes read from
export const session = {
  address: null,
  name: "",
};

// --- overlay wiring -------------------------------------------------------
const nameInput = document.getElementById("name");
const connectBtn = document.getElementById("connect");
const statusEl = document.getElementById("wallet-status");

connectBtn.addEventListener("click", async () => {
  try {
    await connectWallet();
    session.address = getAddress();
    session.name = nameInput.value.trim() || "anon";
    statusEl.textContent = session.address.slice(0, 6) + "…" + session.address.slice(-4);
    connectBtn.textContent = "Connected";
    // hand off to the lobby once we have an identity
    game.scene.start("LobbyScene");
  } catch (e) {
    statusEl.textContent = e.message || "wallet error";
  }
});
