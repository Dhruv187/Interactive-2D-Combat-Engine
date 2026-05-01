import { ContextHandler } from "../../engine/contextHandler.js";
import { gameState } from "../../states/gameState.js";
import { playSound, stopSound } from "../../engine/soundHandler.js";
import { setCurrentScene } from "../../mobileControls.js";
import { TransitionScene } from "./TransitionScene.js";
import { socket } from "../../engine/socket.js";

export class HostScene {
  image = document.getElementById("roomScene");
  kenStageImg = document.getElementById("kenStagePre");
  ryuStageImg = document.getElementById("ryuStagePre");
  sagatStageImg = document.getElementById("sagatStagePre");
  vegasStageImg = document.getElementById("vegasStagePre");
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
    // Server confirmed room was created → wait for joiner (bothJoined)
    this.onRoomCreated = ({ roomId, playerId }) => {
      console.log(`[HOST] ✅ Room created: ${roomId}, I am player ${playerId}`);
      gameState.roomId = String(roomId);
      gameState.playerId = playerId; // always 0 for host
      gameState.mode = "multi";

      // Register bothJoined listener IMMEDIATELY — before any delay — so we
      // never miss it even if the joiner connects during the 1-second fade-out.
      this.onBothJoined = ({ roomId: rid, mapping, selectedStage }) => {
        console.log("[HOST] ✅ bothJoined received in HostScene", mapping);
        if (selectedStage) gameState.selectedStage = selectedStage;
        // Mark that we already received bothJoined so TransitionScene
        // doesn't have to wait for it again.
        gameState._bothJoinedReceived = true;
      };
      socket.on("bothJoined", this.onBothJoined);

      this.doTransition();
    };

    // Server sent an error (e.g. room already exists)
    this.onErrMessage = (msg) => {
      console.warn("[HOST] ❌ Server error:", msg);
      this.showError(msg);
      // Re-enable the button so player can try again
      this.submitBtn.disabled = false;
      this.submitBtn.innerText = "Generate";
    };

    socket.on("roomCreated", this.onRoomCreated);
    socket.on("errMessage", this.onErrMessage);
  }

  cleanupSocketListeners() {
    socket.off("roomCreated", this.onRoomCreated);
    socket.off("errMessage", this.onErrMessage);
    // NOTE: we intentionally do NOT remove the bothJoined listener here.
    // TransitionScene will inherit it and clean it up after use.
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
    title.innerText = "HOST";
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

    // Input box
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
    this.input.placeholder = "Enter Room ID (numbers only)";
    this.input.type = "number";
    setTimeout(() => this.input.focus(), 50);
    this.input.addEventListener("keydown", (e) => e.stopPropagation());

    // Error text (hidden by default)
    this.errorDiv = document.createElement("div");
    Object.assign(this.errorDiv.style, {
      color: "#FF4444",
      fontSize: "16px",
      marginBottom: "14px",
      minHeight: "20px",
      textShadow: "1px 1px 0 #000",
    });

    // Stage label
    const selectStage = document.createElement("div");
    selectStage.innerText = "SELECT STAGE";
    Object.assign(selectStage.style, {
      fontSize: "28px",
      marginBottom: "10px",
      color: "#fff",
      textShadow: "2px 2px 0 #000",
    });

    // Stage container
    const stageContainer = document.createElement("div");
    Object.assign(stageContainer.style, {
      display: "flex",
      gap: "15px",
      justifyContent: "center",
      marginBottom: "20px",
    });

    const stages = [
      { id: "ken", img: this.kenStageImg },
      { id: "ryu", img: this.ryuStageImg },
      { id: "sagat", img: this.sagatStageImg },
      { id: "vegas", img: this.vegasStageImg },
    ];

    stages.forEach((stage) => {
      const stageDiv = document.createElement("div");
      Object.assign(stageDiv.style, {
        border: "3px solid #444",
        borderRadius: "10px",
        overflow: "hidden",
        cursor: "pointer",
        transition: "all 0.2s ease",
      });
      const img = stage.img.cloneNode(true);
      Object.assign(img.style, {
        width: "140px",
        height: "90px",
        display: "block",
      });
      stageDiv.appendChild(img);
      stageContainer.appendChild(stageDiv);

      stageDiv.addEventListener("click", () => {
        gameState.selectedStage = stage.id;
        [...stageContainer.children].forEach((el) => {
          el.style.border = "3px solid #444";
          el.style.transform = "scale(1)";
        });
        stageDiv.style.border = "3px solid gold";
        stageDiv.style.transform = "scale(1.1)";
      });
    });

    // Generate button
    this.submitBtn = document.createElement("button");
    this.submitBtn.innerText = "Generate";
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
    this.submitBtn.onclick = () => this.handleGenerate();

    this.uiContainer.append(
      title,
      label,
      this.input,
      this.errorDiv,
      selectStage,
      stageContainer,
      this.submitBtn,
    );
    document.body.appendChild(this.uiContainer);
  }

  showError(msg) {
    this.errorDiv.innerText = "⚠️ " + msg;
  }

  clearError() {
    this.errorDiv.innerText = "";
  }

  // ─── Input handling ───────────────────────────────────────────────────────────

  handleClick(event) {
    // canvas click — do nothing in Host scene
  }

  handleMobileInput(key, code) {
    if (this.isTransitioning) return;
    if (key === "Enter") this.handleGenerate();
  }

  handleKeyDown(event) {
    if (document.activeElement === this.input) return;
    if (this.isTransitioning) return;
    if (event.key === "Enter") this.handleGenerate();
  }

  // ─── Core action: emit createRoom ─────────────────────────────────────────────

  handleGenerate() {
    if (this.isTransitioning) return;

    const roomId = this.input.value.trim();

    // Validation
    if (!roomId) {
      this.showError("Please enter a Room ID first!");
      return;
    }

    // Default to "ken" if no stage selected
    if (!gameState.selectedStage) {
      gameState.selectedStage = "ken";
    }

    this.clearError();
    this.submitBtn.disabled = true;
    this.submitBtn.innerText = "Creating...";

    console.log(`[HOST] 🚀 Emitting createRoom with ID: ${roomId}, stage: ${gameState.selectedStage}`);
    socket.emit("createRoom", { roomId, selectedStage: gameState.selectedStage });
    // Response is handled in setupSocketListeners → onRoomCreated / onErrMessage
  }

  // ─── Transition (called AFTER server confirms room) ───────────────────────────

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
