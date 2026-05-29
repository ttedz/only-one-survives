import { Client } from "colyseus.js";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "ws://localhost:2567";

let client;
function getClient() {
  if (!client) client = new Client(SERVER_URL);
  return client;
}

/**
 * Join (or create) an arena room. Colyseus handles matchmaking — players are
 * grouped into the same room automatically.
 */
export async function joinArena(options) {
  return getClient().joinOrCreate("arena", options);
}
