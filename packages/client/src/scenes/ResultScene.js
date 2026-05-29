import Phaser from "phaser";
import { session } from "../main.js";

export class ResultScene extends Phaser.Scene {
  constructor() {
    super("ResultScene");
  }

  init(data) {
    this.room = data.room;
    this.result = data.result; // { winner, order }
  }

  create() {
    const won = this.result.winner &&
      this.result.winner.toLowerCase() === (session.address || "").toLowerCase();

    this.add
      .text(300, 230, won ? "YOU SURVIVED" : "ELIMINATED", {
        fontFamily: "monospace",
        fontSize: "32px",
        color: won ? "#6ad19b" : "#d16a9b",
      })
      .setOrigin(0.5);

    const short = this.result.winner
      ? this.result.winner.slice(0, 6) + "…" + this.result.winner.slice(-4)
      : "nobody";
    this.add
      .text(300, 280, `winner: ${short}`, {
        fontFamily: "monospace",
        fontSize: "14px",
        color: "#8a8a93",
      })
      .setOrigin(0.5);

    this.txText = this.add
      .text(300, 320, "writing result to chain…", {
        fontFamily: "monospace",
        fontSize: "12px",
        color: "#8a8a93",
      })
      .setOrigin(0.5);

    this.room.onMessage("result_onchain", ({ txHash }) => {
      this.txText.setText("on-chain: " + txHash.slice(0, 10) + "…");
    });

    this.add
      .text(300, 380, "[ next round starts automatically ]", {
        fontFamily: "monospace",
        fontSize: "12px",
        color: "#5a5a66",
      })
      .setOrigin(0.5);

    // server loops back to lobby; when it does, rejoin the lobby view
    this.room.onStateChange((state) => {
      if (state.phase === "lobby" || state.phase === "countdown") {
        this.scene.start("LobbyScene");
      }
    });
  }
}
