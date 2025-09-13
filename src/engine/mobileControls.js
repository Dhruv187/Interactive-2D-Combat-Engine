import { Control, controls } from "../constants/control.js";
import { simulateKeyDown, simulateKeyUp } from "./inputHandler.js";

const playerId = 0; // Mobile controls → Player 0
let currentScene = null;

// Mapping button IDs to event.code values from control.js
const mapping = {
  "up-btn": { code: controls[playerId].keyboard[Control.UP] },
  "down-btn": { code: controls[playerId].keyboard[Control.DOWN] },
  "left-btn": { code: controls[playerId].keyboard[Control.LEFT] },
  "right-btn": { code: controls[playerId].keyboard[Control.RIGHT] },

  "start-game": { code: "Enter" },

  "attack-LP": { code: controls[playerId].keyboard[Control.LIGHT_PUNCH] },
  "attack-MP": { code: controls[playerId].keyboard[Control.MEDIUM_PUNCH] },
  "attack-HP": { code: controls[playerId].keyboard[Control.HEAVY_PUNCH] },
  "attack-LK": { code: controls[playerId].keyboard[Control.LIGHT_KICK] },
  "attack-MK": { code: controls[playerId].keyboard[Control.MEDIUM_KICK] },
  "attack-HK": { code: controls[playerId].keyboard[Control.HEAVY_KICK] },
};

export function setCurrentScene(scene) {
  currentScene = scene;
  console.log("Current scene set to:", scene?.constructor?.name || "null");
}

function handleButtonPress(code, id) {
  console.log(`Pressed: ${id} (code=${code})`);

  if (currentScene?.handleMobileInput) {
    currentScene.handleMobileInput(code, "down"); // 👈 add flag
  }

  simulateKeyDown(code, code);
}

function handleButtonRelease(code) {
  console.log(`Released: (code=${code})`);

  if (currentScene?.handleMobileInput) {
    currentScene.handleMobileInput(code, "up"); // 👈 add flag
  }

  simulateKeyUp(code, code);
}

// Attach unified pointer events
Object.keys(mapping).forEach((id) => {
  const btn = document.getElementById(id);
  if (!btn) return;

  btn.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    const { code } = mapping[id];
    handleButtonPress(code, id);
  });

  btn.addEventListener("pointerup", (e) => {
    e.preventDefault();
    const { code } = mapping[id];
    handleButtonRelease(code);
  });

  btn.addEventListener("pointercancel", (e) => {
    e.preventDefault();
    const { code } = mapping[id];
    handleButtonRelease(code);
  });
});
