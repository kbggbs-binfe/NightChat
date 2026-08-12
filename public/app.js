const chatWindow = document.getElementById("chat-window");
const messageInput = document.getElementById("message-input");
const sendButton = document.getElementById("send-button");
const chatForm = document.getElementById("chatForm");

const namePanel = document.getElementById("namePanel");
const nameInput = document.getElementById("nameInput");
const joinButton = document.getElementById("joinButton");

const roomPanel = document.getElementById("roomPanel");
const roomInput = document.getElementById("roomInput");
const roomButton = document.getElementById("roomButton");

const changeNameButton = document.getElementById("changeNameButton");
const nameChangePanel = document.getElementById("nameChangePanel");
const newNameInput = document.getElementById("newNameInput");
const cancelNameButton = document.getElementById("cancelNameButton");
const saveNameButton = document.getElementById("saveNameButton");

const status = document.getElementById("status");
const onlineDot = document.getElementById("onlineDot");

const protocol =
  location.protocol === "https:" ? "wss" : "ws";

const serverUrl =
  `${protocol}://${location.host}`;

const socket =
  new WebSocket(serverUrl);

let joined = false;
let roomJoined = false;
let replyTarget = null;

let savedUsername =
  localStorage.getItem("bovarea_username");

let savedRoom =
  localStorage.getItem("bovarea_room");

let currentRoom = null;

/*
 * Special room effect state
 */

const reactionOptions = [
  "👍",
  "❤️",
  "😂",
  "😭",
  "🙏",
  "🥀"
];


/* =========================================================
   SPECIAL ROOM EFFECTS
========================================================= */

let specialEffectsContainer = null;
let specialEffectInterval = null;
let colorThemeStyle = null;


/* =========================================================
   EFFECT CONTAINER
========================================================= */

function createSpecialEffectsContainer() {
  if (specialEffectsContainer) {
    return specialEffectsContainer;
  }

  specialEffectsContainer = document.createElement("div");
  specialEffectsContainer.id = "special-effects";

  document.body.prepend(specialEffectsContainer);

  return specialEffectsContainer;
}


/* =========================================================
   CLEAR ROOM EFFECTS
========================================================= */

function clearSpecialRoomEffects() {
  document.body.classList.remove(
    "night-room",
    "love-room",
    "color-room",

    "dream-room",
    "ocean-room",
    "spring-room",
    "autumn-room",
    "winter-room",
    "cosmos-room",
    "rain-room",
    "mist-room",
    "sunset-room",
    "forest-room",
    "ember-room",
    "candle-room",
    "aurora-room",
    "feather-room",
    "stardust-room",
    "butterfly-room",
    "meadow-room",
    "solitude-room"
  );

  document.body.style.removeProperty("--room-color");
  document.body.style.removeProperty("--room-color-soft");
  document.body.style.removeProperty("--room-color-glow");

  if (specialEffectInterval) {
    clearInterval(specialEffectInterval);
    specialEffectInterval = null;
  }

  if (specialEffectsContainer) {
    specialEffectsContainer.innerHTML = "";
  }

  if (colorThemeStyle) {
    colorThemeStyle.remove();
    colorThemeStyle = null;
  }
}


/* =========================================================
   GENERIC PARTICLE
========================================================= */

function createRoomParticle(
  className,
  content = ""
) {
  const container =
    createSpecialEffectsContainer();

  const particle =
    document.createElement("span");

  particle.className = className;
  particle.textContent = content;

  particle.style.left =
    `${Math.random() * 100}%`;

  particle.style.top =
    `${Math.random() * 100}%`;

  particle.style.setProperty(
    "--random-x",
    `${(Math.random() - 0.5) * 160}px`
  );

  particle.style.setProperty(
    "--random-y",
    `${(Math.random() - 0.5) * 160}px`
  );

  particle.style.setProperty(
    "--random-rotation",
    `${(Math.random() - 0.5) * 80}deg`
  );

  particle.style.setProperty(
    "--random-duration",
    `${6 + Math.random() * 10}s`
  );

  particle.style.setProperty(
    "--random-delay",
    `${Math.random() * -8}s`
  );

  container.appendChild(particle);

  setTimeout(() => {
    particle.remove();
  }, 20000);

  return particle;
}


/* =========================================================
   NIGHT
========================================================= */

function createNightStar() {
  const star =
    createRoomParticle("night-star");

  const size =
    Math.random() * 2.5 + 1;

  star.style.width =
    `${size}px`;

  star.style.height =
    `${size}px`;

  star.style.left =
    `${Math.random() * 100}%`;

  star.style.top =
    `${Math.random() * 100}%`;

  star.style.animationDuration =
    `${Math.random() * 8 + 6}s, ${Math.random() * 3 + 2}s`;

  star.style.animationDelay =
    `${Math.random() * -10}s, ${Math.random() * -4}s`;
}


function startNightRoom() {
  clearSpecialRoomEffects();

  document.body.classList.add("night-room");

  for (let i = 0; i < 90; i++) {
    createNightStar();
  }

  specialEffectInterval =
    setInterval(() => {
      for (let i = 0; i < 3; i++) {
        createNightStar();
      }
    }, 900);
}


/* =========================================================
   LOVE
========================================================= */

function createLoveHeart() {
  const heart =
    createRoomParticle(
      "love-heart",
      Math.random() > 0.5 ? "♥" : "♡"
    );

  heart.style.left =
    `${Math.random() * 100}%`;

  heart.style.bottom =
    `${-5 - Math.random() * 10}%`;

  heart.style.top = "auto";

  heart.style.fontSize =
    `${12 + Math.random() * 16}px`;

  heart.style.animationDuration =
    `${8 + Math.random() * 8}s`;

  heart.style.animationDelay =
    `${Math.random() * 2}s`;
}


function startLoveRoom() {
  clearSpecialRoomEffects();

  document.body.classList.add("love-room");

  for (let i = 0; i < 12; i++) {
    createLoveHeart();
  }

  specialEffectInterval =
    setInterval(() => {
      createLoveHeart();
    }, 1000);
}


/* =========================================================
   DREAM
   Soft clouds drifting slowly
========================================================= */

function createDreamCloud() {
  const cloud =
    createRoomParticle("dream-cloud", "☁");

  cloud.style.left =
    `${-10 + Math.random() * 110}%`;

  cloud.style.top =
    `${5 + Math.random() * 55}%`;

  cloud.style.fontSize =
    `${45 + Math.random() * 55}px`;

  cloud.style.opacity =
    `${0.12 + Math.random() * 0.18}`;
}


function startDreamRoom() {
  clearSpecialRoomEffects();

  document.body.classList.add("dream-room");

  for (let i = 0; i < 10; i++) {
    createDreamCloud();
  }

  specialEffectInterval =
    setInterval(createDreamCloud, 3500);
}


/* =========================================================
   OCEAN
   Bubbles rising upward
========================================================= */

function createOceanBubble() {
  const bubble =
    createRoomParticle("ocean-bubble");

  const size =
    5 + Math.random() * 22;

  bubble.style.width =
    `${size}px`;

  bubble.style.height =
    `${size}px`;

  bubble.style.left =
    `${Math.random() * 100}%`;

  bubble.style.top =
    `${75 + Math.random() * 25}%`;

  bubble.style.animationDuration =
    `${7 + Math.random() * 8}s`;
}


function startOceanRoom() {
  clearSpecialRoomEffects();

  document.body.classList.add("ocean-room");

  for (let i = 0; i < 25; i++) {
    createOceanBubble();
  }

  specialEffectInterval =
    setInterval(createOceanBubble, 500);
}


/* =========================================================
   SPRING
   Flower petals
========================================================= */

function createSpringPetal() {
  const petal =
    createRoomParticle(
      "spring-petal",
      Math.random() > 0.5 ? "✿" : "❀"
    );

  petal.style.left =
    `${Math.random() * 100}%`;

  petal.style.top = "-30px";

  petal.style.fontSize =
    `${10 + Math.random() * 12}px`;

  petal.style.animationDuration =
    `${6 + Math.random() * 7}s`;
}


function startSpringRoom() {
  clearSpecialRoomEffects();

  document.body.classList.add("spring-room");

  for (let i = 0; i < 15; i++) {
    createSpringPetal();
  }

  specialEffectInterval =
    setInterval(createSpringPetal, 700);
}


/* =========================================================
   AUTUMN
   Falling leaves
========================================================= */

function createAutumnLeaf() {
  const leaf =
    createRoomParticle(
      "autumn-leaf",
      Math.random() > 0.5 ? "🍂" : "🍁"
    );

  leaf.style.left =
    `${Math.random() * 100}%`;

  leaf.style.top = "-40px";

  leaf.style.fontSize =
    `${14 + Math.random() * 14}px`;

  leaf.style.animationDuration =
    `${7 + Math.random() * 8}s`;
}


function startAutumnRoom() {
  clearSpecialRoomEffects();

  document.body.classList.add("autumn-room");

  for (let i = 15; i < 25; i++) {
    createAutumnLeaf();
  }

  specialEffectInterval =
    setInterval(createAutumnLeaf, 700);
}


/* =========================================================
   WINTER
   Snowflakes
========================================================= */

function createSnowflake() {
  const snow =
    createRoomParticle(
      "winter-snowflake",
      Math.random() > 0.5 ? "❄" : "•"
    );

  snow.style.left =
    `${Math.random() * 100}%`;

  snow.style.top = "-20px";

  snow.style.fontSize =
    `${7 + Math.random() * 13}px`;

  snow.style.animationDuration =
    `${7 + Math.random() * 8}s`;
}


function startWinterRoom() {
  clearSpecialRoomEffects();

  document.body.classList.add("winter-room");

  for (let i = 0; i < 30; i++) {
    createSnowflake();
  }

  specialEffectInterval =
    setInterval(createSnowflake, 350);
}


/* =========================================================
   COSMOS
========================================================= */

function createCosmosParticle() {
  const particle =
    createRoomParticle(
      "cosmos-particle",
      "✦"
    );

  particle.style.fontSize =
    `${3 + Math.random() * 7}px`;
}


function startCosmosRoom() {
  clearSpecialRoomEffects();

  document.body.classList.add("cosmos-room");

  for (let i = 0; i < 70; i++) {
    createCosmosParticle();
  }

  specialEffectInterval =
    setInterval(createCosmosParticle, 900);
}


/* =========================================================
   RAIN
========================================================= */

function createRainDrop() {
  const drop =
    createRoomParticle("rain-drop");

  drop.style.left =
    `${Math.random() * 100}%`;

  drop.style.top = "-30px";

  drop.style.animationDuration =
    `${0.6 + Math.random() * 0.8}s`;
}


function startRainRoom() {
  clearSpecialRoomEffects();

  document.body.classList.add("rain-room");

  for (let i = 0; i < 60; i++) {
    createRainDrop();
  }

  specialEffectInterval =
    setInterval(createRainDrop, 80);
}


/* =========================================================
   MIST
========================================================= */

function createMistLayer() {
  const mist =
    createRoomParticle("mist-layer");

  mist.style.top =
    `${20 + Math.random() * 60}%`;

  mist.style.width =
    `${35 + Math.random() * 45}%`;

  mist.style.height =
    `${40 + Math.random() * 70}px`;
}


function startMistRoom() {
  clearSpecialRoomEffects();

  document.body.classList.add("mist-room");

  for (let i = 0; i < 8; i++) {
    createMistLayer();
  }

  specialEffectInterval =
    setInterval(createMistLayer, 3000);
}


/* =========================================================
   SUNSET
========================================================= */

function createSunsetParticle() {
  const particle =
    createRoomParticle(
      "sunset-particle",
      "•"
    );

  particle.style.left =
    `${Math.random() * 100}%`;

  particle.style.top =
    `${30 + Math.random() * 65}%`;
}


function startSunsetRoom() {
  clearSpecialRoomEffects();

  document.body.classList.add("sunset-room");

  for (let i = 25; i < 40; i++) {
    createSunsetParticle();
  }

  specialEffectInterval =
    setInterval(createSunsetParticle, 800);
}


/* =========================================================
   FOREST
========================================================= */

function createForestParticle() {
  const particle =
    createRoomParticle(
      "forest-particle",
      Math.random() > 0.5 ? "•" : "❧"
    );

  particle.style.left =
    `${Math.random() * 100}%`;

  particle.style.top =
    `${Math.random() * 100}%`;
}


function startForestRoom() {
  clearSpecialRoomEffects();

  document.body.classList.add("forest-room");

  for (let i = 30; i < 45; i++) {
    createForestParticle();
  }

  specialEffectInterval =
    setInterval(createForestParticle, 900);
}


/* =========================================================
   EMBER
========================================================= */

function createEmber() {
  const ember =
    createRoomParticle("ember-particle");

  ember.style.left =
    `${Math.random() * 100}%`;

  ember.style.top =
    `${85 + Math.random() * 15}%`;

  const size =
    2 + Math.random() * 5;

  ember.style.width =
    `${size}px`;

  ember.style.height =
    `${size}px`;

  ember.style.animationDuration =
    `${4 + Math.random() * 6}s`;
}


function startEmberRoom() {
  clearSpecialRoomEffects();

  document.body.classList.add("ember-room");

  for (let i = 25; i < 35; i++) {
    createEmber();
  }

  specialEffectInterval =
    setInterval(createEmber, 350);
}


/* =========================================================
   CANDLE
========================================================= */

function createCandleParticle() {
  const particle =
    createRoomParticle(
      "candle-particle",
      "•"
    );

  particle.style.left =
    `${Math.random() * 100}%`;

  particle.style.top =
    `${Math.random() * 100}%`;
}


function startCandleRoom() {
  clearSpecialRoomEffects();

  document.body.classList.add("candle-room");

  for (let i = 30; i < 45; i++) {
    createCandleParticle();
  }

  specialEffectInterval =
    setInterval(createCandleParticle, 900);
}


/* =========================================================
   AURORA
========================================================= */

function startAuroraRoom() {
  clearSpecialRoomEffects();

  document.body.classList.add("aurora-room");
}


/* =========================================================
   FEATHER
========================================================= */

function createFeather() {
  const feather =
    createRoomParticle(
      "feather-particle",
      "🪶"
    );

  feather.style.left =
    `${Math.random() * 100}%`;

  feather.style.top = "-50px";

  feather.style.fontSize =
    `${15 + Math.random() * 14}px`;

  feather.style.animationDuration =
    `${8 + Math.random() * 8}s`;
}


function startFeatherRoom() {
  clearSpecialRoomEffects();

  document.body.classList.add("feather-room");

  for (let i = 10; i < 18; i++) {
    createFeather();
  }

  specialEffectInterval =
    setInterval(createFeather, 1100);
}


/* =========================================================
   STARDUST
========================================================= */

function createStardust() {
  const dust =
    createRoomParticle(
      "stardust-particle",
      "✦"
    );

  dust.style.left =
    `${Math.random() * 100}%`;

  dust.style.top =
    `${Math.random() * 100}%`;

  dust.style.fontSize =
    `${3 + Math.random() * 8}px`;
}


function startStardustRoom() {
  clearSpecialRoomEffects();

  document.body.classList.add("stardust-room");

  for (let i = 50; i < 70; i++) {
    createStardust();
  }

  specialEffectInterval =
    setInterval(createStardust, 700);
}


/* =========================================================
   BUTTERFLY
========================================================= */

function createButterfly() {
  const butterfly =
    createRoomParticle(
      "butterfly-particle",
      "🦋"
    );

  butterfly.style.left =
    `${Math.random() * 100}%`;

  butterfly.style.top =
    `${20 + Math.random() * 70}%`;

  butterfly.style.fontSize =
    `${14 + Math.random() * 12}px`;

  butterfly.style.animationDuration =
    `${8 + Math.random() * 8}s`;
}


function startButterflyRoom() {
  clearSpecialRoomEffects();

  document.body.classList.add("butterfly-room");

  for (let i = 8; i < 14; i++) {
    createButterfly();
  }

  specialEffectInterval =
    setInterval(createButterfly, 1500);
}


/* =========================================================
   MEADOW
========================================================= */

function createMeadowParticle() {
  const particle =
    createRoomParticle(
      "meadow-particle",
      Math.random() > 0.5 ? "✿" : "•"
    );

  particle.style.left =
    `${Math.random() * 100}%`;

  particle.style.top =
    `${55 + Math.random() * 35}%`;
}


function startMeadowRoom() {
  clearSpecialRoomEffects();

  document.body.classList.add("meadow-room");

  for (let i = 25; i < 40; i++) {
    createMeadowParticle();
  }

  specialEffectInterval =
    setInterval(createMeadowParticle, 700);
}


/* =========================================================
   SOLITUDE
========================================================= */

function startSolitudeRoom() {
  clearSpecialRoomEffects();

  document.body.classList.add("solitude-room");
}


/* =========================================================
   RANDOM COLOUR ROOM
========================================================= */

function isColorRoom(roomCode) {
  const colorName =
    String(roomCode || "")
      .trim()
      .toLowerCase();

  if (!/^[a-z]+$/.test(colorName)) {
    return false;
  }

  return CSS.supports(
    "color",
    colorName
  );
}


function createColorParticle() {
  const particle =
    createRoomParticle(
      "color-particle"
    );

  particle.style.left =
    `${Math.random() * 100}%`;

  particle.style.bottom =
    `${-10 - Math.random() * 15}%`;

  particle.style.top = "auto";

  const size =
    Math.random() * 5 + 2;

  particle.style.width =
    `${size}px`;

  particle.style.height =
    `${size}px`;

  particle.style.animationDuration =
    `${7 + Math.random() * 9}s`;

  particle.style.animationDelay =
    `${Math.random() * 3}s`;
}


function createColorRoomStyle() {

  if (colorThemeStyle) {
    colorThemeStyle.remove();
  }

  colorThemeStyle =
    document.createElement("style");

  colorThemeStyle.id =
    "dynamic-color-room-style";

  colorThemeStyle.textContent = `
    body.color-room {
      background:
        radial-gradient(
          circle at 50% 15%,
          color-mix(
            in srgb,
            var(--room-color) 18%,
            transparent
          ),
          transparent 55%
        ),
        #000000;

      transition:
        background 1.2s ease,
        color 1.2s ease;
    }

    body.color-room .app {
      background:
        radial-gradient(
          circle at 50% 0%,
          color-mix(
            in srgb,
            var(--room-color) 12%,
            transparent
          ),
          transparent 55%
        ),
        #03070c;

      border-color:
        color-mix(
          in srgb,
          var(--room-color) 30%,
          #172331
        );

      box-shadow:
        0 20px 80px rgba(0, 0, 0, 0.85),
        0 0 50px
        color-mix(
          in srgb,
          var(--room-color) 20%,
          transparent
        );

      transition:
        background 1.2s ease,
        border-color 1.2s ease,
        box-shadow 1.2s ease;
    }

    body.color-room .message {
      background:
        color-mix(
          in srgb,
          var(--room-color) 8%,
          #0a121a
        );

      border-color:
        color-mix(
          in srgb,
          var(--room-color) 18%,
          #14222f
        );
    }

    body.color-room .message.self {
      background:
        color-mix(
          in srgb,
          var(--room-color) 14%,
          #0b1a29
        );

      border-color:
        color-mix(
          in srgb,
          var(--room-color) 30%,
          #17344b
        );
    }

    body.color-room .sender {
      color:
        color-mix(
          in srgb,
          var(--room-color) 50%,
          #9bc9e7
        );
    }

    body.color-room .composer input,
    body.color-room input {
      border-color:
        color-mix(
          in srgb,
          var(--room-color) 22%,
          #172b3d
        );
    }

    .color-particle {
      position: absolute;
      display: block;
      border-radius: 50%;
      pointer-events: none;

      background:
        var(--room-color);

      box-shadow:
        0 0 8px
        color-mix(
          in srgb,
          var(--room-color) 75%,
          transparent
        );

      opacity: 0;

      animation:
        colorParticleFloat linear forwards;
    }

    @keyframes colorParticleFloat {

      0% {
        transform:
          translate3d(0, 0, 0);
        opacity: 0;
      }

      15% {
        opacity: 0.55;
      }

      50% {
        transform:
          translate3d(
            var(--random-x),
            -50vh,
            0
          );

        opacity: 0.35;
      }

      85% {
        opacity: 0.15;
      }

      100% {
        transform:
          translate3d(
            calc(var(--random-x) * 1.8),
            -105vh,
            0
          );

        opacity: 0;
      }
    }
  `;

  document.head.appendChild(
    colorThemeStyle
  );
}


function startColorRoom(colorName) {

  clearSpecialRoomEffects();

  const normalizedColor =
    String(colorName || "")
      .trim()
      .toLowerCase();

  document.body.classList.add(
    "color-room"
  );

  document.body.style.setProperty(
    "--room-color",
    normalizedColor
  );

  createColorRoomStyle();

  for (let i = 0; i < 20; i++) {
    createColorParticle();
  }

  specialEffectInterval =
    setInterval(
      createColorParticle,
      650
    );
}


/* =========================================================
   DECIDE ROOM THEME
========================================================= */

function applyRoomTheme(roomCode) {

  clearSpecialRoomEffects();

  const normalizedRoom =
    String(roomCode || "")
      .trim()
      .toLowerCase();


  const roomEffects = {

    night: startNightRoom,

    love: startLoveRoom,

    dream: startDreamRoom,

    ocean: startOceanRoom,

    spring: startSpringRoom,

    autumn: startAutumnRoom,

    winter: startWinterRoom,

    cosmos: startCosmosRoom,

    rain: startRainRoom,

    mist: startMistRoom,

    sunset: startSunsetRoom,

    forest: startForestRoom,

    ember: startEmberRoom,

    candle: startCandleRoom,

    aurora: startAuroraRoom,

    feather: startFeatherRoom,

    stardust: startStardustRoom,

    butterfly: startButterflyRoom,

    meadow: startMeadowRoom,

    solitude: startSolitudeRoom

  };


  if (roomEffects[normalizedRoom]) {
    roomEffects[normalizedRoom]();
    return;
  }


  /*
   * Any valid CSS colour name
   * still works exactly as before.
   */

  if (isColorRoom(normalizedRoom)) {
    startColorRoom(normalizedRoom);
    return;
  }
}


function formatTime(timestamp) {
  if (!timestamp) return "";

  const date =
    new Date(timestamp);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit"
  });
}


/* =========================================================
   REPLY
========================================================= */

function setReplyTarget(replyData) {
  replyTarget = replyData;

  let replyPreview =
    document.getElementById(
      "replyPreview"
    );

  if (!replyPreview) {
    replyPreview =
      document.createElement("div");

    replyPreview.id =
      "replyPreview";

    replyPreview.className =
      "reply-preview";

    const composer =
      document.querySelector(
        ".composer"
      );

    if (composer) {
      composer.insertBefore(
        replyPreview,
        composer.firstChild
      );
    }
  }

  replyPreview.innerHTML = "";

  const content =
    document.createElement("div");

  content.className =
    "reply-preview-content";

  const title =
    document.createElement("div");

  title.className =
    "reply-preview-title";

  title.textContent =
    `Replying to ${replyData.sender}`;

  const message =
    document.createElement("div");

  message.className =
    "reply-preview-message";

  message.textContent =
    replyData.message;

  content.appendChild(title);
  content.appendChild(message);

  const cancelButton =
    document.createElement("button");

  cancelButton.type = "button";

  cancelButton.className =
    "reply-cancel";

  cancelButton.textContent = "×";

  cancelButton.addEventListener(
    "click",
    cancelReply
  );

  replyPreview.appendChild(content);
  replyPreview.appendChild(cancelButton);

  messageInput.focus();
}


function cancelReply() {
  replyTarget = null;

  const replyPreview =
    document.getElementById(
      "replyPreview"
    );

  if (replyPreview) {
    replyPreview.remove();
  }
}


function addReplyPreview(
  wrapper,
  replyTo
) {
  if (!replyTo) return;

  const replyElement =
    document.createElement("div");

  replyElement.className =
    "message-reply";

  const replySender =
    document.createElement("div");

  replySender.className =
    "message-reply-sender";

  replySender.textContent =
    replyTo.sender;

  const replyText =
    document.createElement("div");

  replyText.className =
    "message-reply-text";

  replyText.textContent =
    replyTo.message;

  replyElement.appendChild(
    replySender
  );

  replyElement.appendChild(
    replyText
  );

  wrapper.appendChild(
    replyElement
  );
}


/* =========================================================
   REACTIONS
========================================================= */

function sendReaction(
  messageId,
  reaction
) {
  if (
    !joined ||
    !roomJoined ||
    socket.readyState !==
      WebSocket.OPEN
  ) {
    return;
  }

  socket.send(
    JSON.stringify({
      type: "reaction",
      messageId,
      reaction
    })
  );
}


function createReactionBar(
  messageId
) {
  const bar =
    document.createElement("div");

  bar.className =
    "reaction-bar";

  reactionOptions.forEach(
    (reaction) => {

      const button =
        document.createElement(
          "button"
        );

      button.className =
        "reaction-button";

      button.type = "button";

      button.textContent =
        reaction;

      button.addEventListener(
        "click",
        (event) => {

          event.stopPropagation();

          sendReaction(
            messageId,
            reaction
          );

          const wrapper =
            button.closest(
              ".message"
            );

          if (wrapper) {
            wrapper.classList.remove(
              "reactions-open"
            );
          }
        }
      );

      bar.appendChild(button);
    }
  );

  return bar;
}


function updateReactionDisplay(
  wrapper,
  reactions
) {
  let reactionsElement =
    wrapper.querySelector(
      ".reactions"
    );

  if (!reactionsElement) {

    reactionsElement =
      document.createElement(
        "div"
      );

    reactionsElement.className =
      "reactions";

    wrapper.appendChild(
      reactionsElement
    );
  }

  reactionsElement.innerHTML =
    "";

  Object.entries(
    reactions || {}
  ).forEach(
    ([reaction, users]) => {

      if (
        !Array.isArray(users) ||
        users.length === 0
      ) {
        return;
      }

      const reactionElement =
        document.createElement(
          "button"
        );

      reactionElement.className =
        "reaction";

      reactionElement.type =
        "button";

      reactionElement.textContent =
        `${reaction} ${users.length}`;

      reactionElement.addEventListener(
        "click",
        (event) => {

          event.stopPropagation();

          sendReaction(
            wrapper.dataset.messageId,
            reaction
          );
        }
      );

      reactionsElement.appendChild(
        reactionElement
      );
    }
  );

  if (
    Object.keys(
      reactions || {}
    ).length === 0
  ) {
    reactionsElement.remove();
  }
}


/* =========================================================
   MESSAGE ACTIONS
========================================================= */

function createActionMenu(
  wrapper,
  messageId,
  sender,
  message
) {
  const actionMenu =
    document.createElement("div");

  actionMenu.className =
    "message-actions";


  const replyButton =
    document.createElement(
      "button"
    );

  replyButton.type = "button";

  replyButton.className =
    "message-action";

  replyButton.textContent =
    "↩ Reply";


  replyButton.addEventListener(
    "click",
    (event) => {

      event.stopPropagation();

      setReplyTarget({
        id: messageId,
        sender,
        message
      });

      wrapper.classList.remove(
        "actions-open"
      );
    }
  );


  const reactButton =
    document.createElement(
      "button"
    );

  reactButton.type = "button";

  reactButton.className =
    "message-action";

  reactButton.textContent =
    "React";


  reactButton.addEventListener(
    "click",
    (event) => {

      event.stopPropagation();

      wrapper.classList.remove(
        "actions-open"
      );

      wrapper.classList.add(
        "reactions-open"
      );
    }
  );


  actionMenu.appendChild(
    replyButton
  );

  actionMenu.appendChild(
    reactButton
  );

  return actionMenu;
}


/* =========================================================
   ADD MESSAGE
========================================================= */

function addMessageToChat(
  sender,
  message,
  time,
  self = false,
  messageId = "",
  reactions = {},
  replyTo = null
) {
  const wrapper =
    document.createElement(
      "div"
    );

  wrapper.className =
    self
      ? "message self"
      : "message";


  if (messageId) {
    wrapper.dataset.messageId =
      messageId;
  }


  const senderElement =
    document.createElement(
      "div"
    );

  senderElement.className =
    "sender";

  senderElement.textContent =
    sender;


  const textElement =
    document.createElement(
      "div"
    );

  textElement.className =
    "text";

  textElement.textContent =
    message;


  wrapper.appendChild(
    senderElement
  );


  addReplyPreview(
    wrapper,
    replyTo
  );


  wrapper.appendChild(
    textElement
  );


  if (time) {

    const timeElement =
      document.createElement(
        "div"
      );

    timeElement.className =
      "message-time";

    timeElement.textContent =
      formatTime(time);

    wrapper.appendChild(
      timeElement
    );
  }


  if (messageId) {

    const actionMenu =
      createActionMenu(
        wrapper,
        messageId,
        sender,
        message
      );

    const reactionBar =
      createReactionBar(
        messageId
      );

    wrapper.appendChild(
      actionMenu
    );

    wrapper.appendChild(
      reactionBar
    );


    wrapper.addEventListener(
      "click",
      (event) => {

        if (
          event.target.closest(
            ".message-actions"
          ) ||
          event.target.closest(
            ".reaction-bar"
          ) ||
          event.target.closest(
            ".reactions"
          )
        ) {
          return;
        }


        const allMessages =
          document.querySelectorAll(
            ".message"
          );


        allMessages.forEach(
          (otherMessage) => {

            if (
              otherMessage !==
              wrapper
            ) {

              otherMessage.classList.remove(
                "actions-open"
              );

              otherMessage.classList.remove(
                "reactions-open"
              );
            }
          }
        );


        wrapper.classList.toggle(
          "actions-open"
        );
      }
    );
  }


  if (reactions) {

    updateReactionDisplay(
      wrapper,
      reactions
    );
  }


  chatWindow.appendChild(
    wrapper
  );

  chatWindow.scrollTop =
    chatWindow.scrollHeight;
}


/* =========================================================
   SYSTEM MESSAGE
========================================================= */

function addSystemMessage(
  message
) {
  const element =
    document.createElement(
      "div"
    );

  element.className =
    "system";

  element.textContent =
    message;

  chatWindow.appendChild(
    element
  );

  chatWindow.scrollTop =
    chatWindow.scrollHeight;
}


function addHistoryDivider() {
  const element =
    document.createElement(
      "div"
    );

  element.className =
    "history-divider";

  element.textContent =
    "While you were away";

  chatWindow.appendChild(
    element
  );
}


/* =========================================================
   CONNECTION
========================================================= */

function setConnected(
  connected
) {
  onlineDot.classList.toggle(
    "connected",
    connected
  );

  status.textContent =
    connected
      ? "Connected"
      : "Disconnected";
}


/* =========================================================
   ONLINE USERS
========================================================= */

function updateOnlineUsers(
  users,
  count
) {
  let onlinePanel =
    document.getElementById(
      "onlinePanel"
    );


  if (!onlinePanel) {

    onlinePanel =
      document.createElement(
        "div"
      );

    onlinePanel.id =
      "onlinePanel";

    onlinePanel.className =
      "online-panel";


    const header =
      document.querySelector(
        ".header"
      );

    if (header) {
      header.appendChild(
        onlinePanel
      );
    }
  }


  onlinePanel.innerHTML =
    "";


  const countElement =
    document.createElement(
      "div"
    );

  countElement.className =
    "online-count";

  countElement.textContent =
    `${count} online`;

  onlinePanel.appendChild(
    countElement
  );


  if (count > 0) {

    const usersElement =
      document.createElement(
        "div"
      );

    usersElement.className =
      "online-users";


    users.forEach(
      (username) => {

        const userElement =
          document.createElement(
            "div"
          );

        userElement.className =
          "online-user";

        userElement.textContent =
          `● ${username}`;

        usersElement.appendChild(
          userElement
        );
      }
    );


    onlinePanel.appendChild(
      usersElement
    );
  }
}


/* =========================================================
   JOIN ROOM
========================================================= */

function enterRoom(
  roomCode
) {

  roomCode =
    String(roomCode || "")
      .trim()
      .slice(0, 100);


  if (!roomCode) {
    roomInput.focus();
    return;
  }


  if (
    socket.readyState !==
    WebSocket.OPEN
  ) {
    return;
  }


  localStorage.setItem(
    "bovarea_room",
    roomCode
  );


  if (savedUsername) {

    joinChat(
      savedUsername,
      roomCode
    );

    return;
  }


  roomJoined = false;

  currentRoom =
    roomCode;

  roomPanel.style.display =
    "none";

  namePanel.style.display =
    "block";

  nameInput.focus();
}


/* =========================================================
   JOIN CHAT
========================================================= */

function joinChat(
  name,
  roomCode = currentRoom
) {

  const username =
    String(name || "")
      .trim()
      .slice(0, 24);


  roomCode =
    String(roomCode || "")
      .trim()
      .slice(0, 100);


  if (
    !username ||
    !roomCode ||
    socket.readyState !==
      WebSocket.OPEN
  ) {
    return;
  }


  localStorage.setItem(
    "bovarea_username",
    username
  );

  localStorage.setItem(
    "bovarea_room",
    roomCode
  );


  savedUsername =
    username;

  currentRoom =
    roomCode;


  socket.send(
    JSON.stringify({
      type: "join",
      name: username,
      roomCode
    })
  );


  joined = true;


  if (namePanel) {
    namePanel.style.display =
      "none";
  }


  if (roomPanel) {
    roomPanel.style.display =
      "none";
  }


  if (nameChangePanel) {
    nameChangePanel.style.display =
      "none";
  }


  messageInput.disabled =
    false;

  sendButton.disabled =
    false;

  messageInput.focus();
}


/* =========================================================
   CHANGE NAME
========================================================= */

function openNameChangePanel() {

  if (!joined) {
    return;
  }


  const currentUsername =
    localStorage.getItem(
      "bovarea_username"
    ) || "";


  newNameInput.value =
    currentUsername;


  nameChangePanel.style.display =
    "block";


  newNameInput.focus();

  newNameInput.select();
}


function closeNameChangePanel() {

  nameChangePanel.style.display =
    "none";

  newNameInput.value =
    "";
}


function saveNewUsername() {

  const username =
    newNameInput.value
      .trim()
      .slice(0, 24);


  if (!username) {
    newNameInput.focus();
    return;
  }


  const currentUsername =
    localStorage.getItem(
      "bovarea_username"
    ) || "";


  if (
    username ===
    currentUsername
  ) {

    closeNameChangePanel();

    return;
  }


  localStorage.setItem(
    "bovarea_username",
    username
  );


  savedUsername =
    username;


  closeNameChangePanel();


  window.location.reload();
}


/* =========================================================
   BUTTON EVENTS
========================================================= */

roomButton.addEventListener(
  "click",
  () => {

    enterRoom(
      roomInput.value
    );
  }
);


roomInput.addEventListener(
  "keydown",
  (event) => {

    if (event.key === "Enter") {

      event.preventDefault();

      roomButton.click();
    }
  }
);


joinButton.addEventListener(
  "click",
  () => {

    joinChat(
      nameInput.value
    );
  }
);


nameInput.addEventListener(
  "keydown",
  (event) => {

    if (event.key === "Enter") {

      event.preventDefault();

      joinButton.click();
    }
  }
);


/* =========================================================
   CHANGE NAME BUTTON
========================================================= */

if (changeNameButton) {

  changeNameButton.addEventListener(
    "click",
    (event) => {

      event.preventDefault();
      event.stopPropagation();

      openNameChangePanel();
    }
  );
}


if (cancelNameButton) {

  cancelNameButton.addEventListener(
    "click",
    (event) => {

      event.preventDefault();

      closeNameChangePanel();
    }
  );
}


if (saveNameButton) {

  saveNameButton.addEventListener(
    "click",
    (event) => {

      event.preventDefault();

      saveNewUsername();
    }
  );
}


if (newNameInput) {

  newNameInput.addEventListener(
    "keydown",
    (event) => {

      if (event.key === "Enter") {

        event.preventDefault();

        saveNewUsername();
      }


      if (event.key === "Escape") {

        event.preventDefault();

        closeNameChangePanel();
      }
    }
  );
}


/* =========================================================
   CHAT FORM
========================================================= */

chatForm.addEventListener(
  "submit",
  (event) => {

    event.preventDefault();


    const message =
      messageInput.value.trim();


    if (
      !message ||
      !joined ||
      !roomJoined ||
      socket.readyState !==
        WebSocket.OPEN
    ) {
      return;
    }


    socket.send(
      JSON.stringify({
        type: "chat",
        message,
        replyTo:
          replyTarget
            ? replyTarget.id
            : null
      })
    );


    messageInput.value =
      "";

    cancelReply();

    messageInput.focus();
  }
);


/* =========================================================
   WEBSOCKET OPEN
========================================================= */

socket.addEventListener(
  "open",
  () => {

    setConnected(true);


    /*
     * Don't automatically join.
     * User chooses the room.
     */

    if (savedRoom) {

      roomInput.value =
        savedRoom;
    }


    if (savedUsername) {

      nameInput.value =
        savedUsername;
    }
  }
);


/* =========================================================
   WEBSOCKET MESSAGES
========================================================= */

socket.addEventListener(
  "message",
  (event) => {

    let data;


    try {

      data =
        JSON.parse(
          event.data
        );

    } catch {

      addSystemMessage(
        event.data
      );

      return;
    }


    /* ROOM CONFIRMATION */

    if (
      data.type === "room"
    ) {

      currentRoom =
        data.roomCode;

      roomJoined =
        true;

      roomPanel.style.display =
        "none";

      namePanel.style.display =
        "none";


      /*
       * Activate any special
       * room atmosphere.
       */

      applyRoomTheme(
        data.roomCode
      );
    }


    /* SYSTEM */

    if (
      data.type === "system"
    ) {

      addSystemMessage(
        data.message
      );
    }


    /* ONLINE USERS */

    if (
      data.type === "users"
    ) {

      updateOnlineUsers(
        data.users,
        data.count
      );
    }


    /* HISTORY */

    if (
      data.type === "history"
    ) {

      if (
        Array.isArray(
          data.messages
        ) &&
        data.messages.length > 0
      ) {

        addHistoryDivider();


        data.messages.forEach(
          (message) => {

            addMessageToChat(
              message.sender,
              message.message,
              message.time,
              message.sender ===
                savedUsername,
              message.id,
              message.reactions,
              message.replyTo
            );
          }
        );
      }
    }


    /* CHAT */

    if (
      data.type === "chat"
    ) {

      addMessageToChat(
        data.sender,
        data.message,
        data.time,
        Boolean(data.self),
        data.id,
        data.reactions,
        data.replyTo
      );
    }


    /* REACTION */

    if (
      data.type === "reaction"
    ) {

      const messageElement =
        document.querySelector(
          `[data-message-id="${CSS.escape(
            data.messageId
          )}"]`
        );


      if (messageElement) {

        updateReactionDisplay(
          messageElement,
          data.reactions
        );
      }
    }
  }
);


/* =========================================================
   CLOSE
========================================================= */

socket.addEventListener(
  "close",
  () => {

    clearSpecialRoomEffects();

    setConnected(false);

    joined = false;
    roomJoined = false;

    messageInput.disabled =
      true;

    sendButton.disabled =
      true;


    const onlinePanel =
      document.getElementById(
        "onlinePanel"
      );


    if (onlinePanel) {
      onlinePanel.remove();
    }


    addSystemMessage(
      "Connection closed."
    );
  }
);


/* =========================================================
   ERROR
========================================================= */

socket.addEventListener(
  "error",
  (error) => {

    console.error(
      "WebSocket error:",
      error
    );

    setConnected(false);

    addSystemMessage(
      "A connection error occurred."
    );
  }
);
