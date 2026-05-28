import "dotenv/config";
import { Server } from "@colyseus/core";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { createServer } from "node:http";
import { ArenaRoom } from "./ArenaRoom.js";

const PORT = Number(process.env.PORT || 2567);

const gameServer = new Server({
  transport: new WebSocketTransport({
    server: createServer(),
  }),
});

// One room type: the elimination arena. Colyseus matches players into rooms.
gameServer.define("arena", ArenaRoom);

gameServer.listen(PORT);
console.log(`Only One Survives server listening on ws://localhost:${PORT}`);
