import { createDefaultFighterState } from "./fighterState.js";
import { FighterId } from "../constants/fighter.js";

export const gameState = {
  fighters: [
    createDefaultFighterState(FighterId.RYU),
    createDefaultFighterState(FighterId.KEN),
  ],
  mode: "pvp", // "pvp" | "ai" | "multi"
  roomId: null, // socket.io room ID (set when hosting/joining)
  playerId: null, // local player index: 0 = host, 1 = joiner
  selectedStage: "ken", // stage chosen by host, synced to joiner
};
