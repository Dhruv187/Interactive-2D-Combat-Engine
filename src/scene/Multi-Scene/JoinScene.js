import { ContextHandler } from "../../engine/contextHandler.js";
import { gameState } from "../../states/gameState.js";
import { playSound, stopSound } from "../../engine/soundHandler.js";
import { setCurrentScene } from "../../mobileControls.js";
import { TransitionScene } from "./TransitionScene.js";
import { connectSocket, socket } from "../../engine/socket.js";

export class JoinScene {
  image = document.getElementById("roomScene");
  music = document.getElementById("versus-screen");
  frames = new Map([["background", [1536, 1024, 0, 0]]]);

  constructor(changeScene) {
    playSound(this.music, 0.3);
    this.changeScene = changeScene;
    this.contextHandler = new ContextHandler();
    this.isTransitioning = false;
    this.contextHandler.brightness = 0;
    this.contextHandler.startGlowUp();

    this.setupEventListeners();
    this.createUI();
    this.setupSocketListeners();
    setCurrentScene(this);
  }

  // ─── Socket listeners ────────────────────────────────────────────────────────

  setupSocketListeners() {
    connectSocket();

    // Both players have joined → we now know our playerId and which stage to load
    this.onBothJoined = ({ roomId, mapping, selectedStage }) => {
      console.log("[JOIN] ✅ bothJoined received", {
        roomId,
        mapping,
        selectedStage,
      });
      gameState.roomId = String(roomId);
      gameState.playerId = mapping[socket.id]; // 0 or 1
      gameState.mode = "multi";
      // Use the stage the host selected (broadcasted by server)
      gameState.selectedStage = selectedStage || "ken";
      console.log(
        `[JOIN] 🎮 I am player ${gameState.playerId} in room ${gameState.roomId}, stage: ${gameState.selectedStage}`,
      );
      this.doTransition();
    };

    // Error from server (room not found, full, etc.)
    this.onErrMessage = (msg) => {
      console.warn("[JOIN] ❌ Server error:", msg);
      this.showError(msg);
      this.submitBtn.disabled = false;
      this.submitBtn.innerText = "Submit";
    };

    socket.on("bothJoined", this.onBothJoined);
    socket.on("errMessage", this.onErrMessage);
  }

  cleanupSocketListeners() {
    socket.off("bothJoined", this.onBothJoined);
    socket.off("errMessage", this.onErrMessage);
  }

  // ─── UI ──────────────────────────────────────────────────────────────────────

  setupEventListeners() {
    this.canvas = document.querySelector("canvas");
    this.canvas.style.pointerEvents = "none";
    this.canvas.style.zIndex = "0";

    this.clickHandler = this.handleClick.bind(this);
    this.keyHandler = this.handleKeyDown.bind(this);
    this.canvas.addEventListener("click", this.clickHandler);
    window.addEventListener("keydown", this.keyHandler);
  }

  createUI() {
    this.uiContainer = document.createElement("div");
    Object.assign(this.uiContainer.style, {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100vw",
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      zIndex: "999999",
      pointerEvents: "auto",
      textAlign: "center",
      color: "white",
      fontFamily: "serif",
    });

    // Title
    const title = document.createElement("h1");
    title.innerText = "JOIN";
    Object.assign(title.style, {
      fontSize: "80px",
      fontWeight: "bold",
      textShadow: "3px 3px 0 gold",
      marginBottom: "30px",
      color: "gold",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
      filter: "drop-shadow(0 0 10px #FF4500)",
    });

    // Label
    const label = document.createElement("div");
    label.innerText = "ROOM ID";
    Object.assign(label.style, {
      fontSize: "28px",
      marginBottom: "10px",
      color: "#fff",
      textShadow: "2px 2px 0 #000",
    });

    // Input
    this.input = document.createElement("input");
    Object.assign(this.input.style, {
      width: "300px",
      height: "40px",
      textAlign: "center",
      fontSize: "20px",
      border: "3px solid #FFD700",
      backgroundColor: "rgba(255,255,255,0.95)",
      borderRadius: "6px",
      marginBottom: "8px",
      outline: "none",
      boxShadow: "0 0 10px #FF4500 inset",
    });
    this.input.placeholder = "Enter Room ID";
    this.input.type = "number";
    setTimeout(() => this.input.focus(), 50);
    this.input.addEventListener("keydown", (e) => e.stopPropagation());

    // Error text
    this.errorDiv = document.createElement("div");
    Object.assign(this.errorDiv.style, {
      color: "#FF4444",
      fontSize: "16px",
      marginBottom: "14px",
      minHeight: "20px",
      textShadow: "1px 1px 0 #000",
    });

    // Waiting text (shown after submit, while server responds)
    this.waitingDiv = document.createElement("div");
    Object.assign(this.waitingDiv.style, {
      color: "#FFD700",
      fontSize: "18px",
      marginBottom: "14px",
      minHeight: "22px",
      textShadow: "1px 1px 0 #000",
    });

    // Submit button
    this.submitBtn = document.createElement("button");
    this.submitBtn.innerText = "Submit";
    Object.assign(this.submitBtn.style, {
      background: "linear-gradient(180deg, #FF4500, #B22222)",
      color: "white",
      border: "2px solid #FFD700",
      padding: "10px 30px",
      fontSize: "20px",
      borderRadius: "8px",
      cursor: "pointer",
      textShadow: "1px 1px 0 black",
    });
    this.submitBtn.onclick = () => this.handleJoin();

    this.uiContainer.append(
      title,
      label,
      this.input,
      this.errorDiv,
      this.waitingDiv,
      this.submitBtn,
    );
    document.body.appendChild(this.uiContainer);
  }

  showError(msg) {
    this.errorDiv.innerText = "⚠️ " + msg;
    this.waitingDiv.innerText = "";
  }

  clearError() {
    this.errorDiv.innerText = "";
  }

  // ─── Input handling ───────────────────────────────────────────────────────────

  handleClick(event) {
    // canvas click — do nothing in Join scene
  }

  handleMobileInput(key, code) {
    if (this.isTransitioning) return;
    if (key === "Enter") this.handleJoin();
  }

  handleKeyDown(event) {
    if (document.activeElement === this.input) return;
    if (this.isTransitioning) return;
    if (event.key === "Enter") this.handleJoin();
  }

  // ─── Core action: emit joinRoom ───────────────────────────────────────────────

  handleJoin() {
    if (this.isTransitioning) return;

    const roomId = this.input.value.trim();
    if (!roomId) {
      this.showError("Please enter a Room ID first!");
      return;
    }

    this.clearError();
    this.submitBtn.disabled = true;
    this.submitBtn.innerText = "Joining...";
    this.waitingDiv.innerText = "⏳ Connecting...";

    console.log(`[JOIN] 🚀 Emitting joinRoom with ID: ${roomId}`);
    socket.emit("joinRoom", roomId);
    // Response handled in setupSocketListeners → onBothJoined / onErrMessage
  }

  // ─── Transition (called AFTER server confirms bothJoined) ─────────────────────

  doTransition() {
    if (this.isTransitioning) return;
    this.isTransitioning = true;
    this.contextHandler.startDimDown();

    if (this.uiContainer) this.uiContainer.remove();
    this.canvas.style.pointerEvents = "auto";

    setTimeout(() => {
      this.canvas.removeEventListener("click", this.clickHandler);
      window.removeEventListener("keydown", this.keyHandler);
      this.cleanupSocketListeners();
      stopSound(this.music);
      this.changeScene(new TransitionScene(this.changeScene));
    }, 1000);
  }

  update(time) {
    this.contextHandler.update(time);
  }

  draw(context) {
    context.imageSmoothingEnabled = false;
    context.fillStyle = "#111";
    context.fillRect(0, 0, context.canvas.width, context.canvas.height);

    context.drawImage(
      this.image,
      0,
      0,
      1536,
      1024,
      0,
      0,
      context.canvas.width,
      context.canvas.height,
    );

    if (this.isTransitioning) {
      context.fillStyle = `rgba(0, 0, 0, ${1 - this.contextHandler.brightness})`;
      context.fillRect(0, 0, context.canvas.width, context.canvas.height);
    }
  }
}
