import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 5173,
  },
  // expose VITE_* vars to the client (server URL, contract address, chain)
  envPrefix: "VITE_",
});
