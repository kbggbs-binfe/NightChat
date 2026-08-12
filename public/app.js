const chatWindow = document.getElementById("chat-window");
const messageInput = document.getElementById("message-input");
const sendButton = document.getElementById("send-button");
const chatForm = document.getElementById("chatForm");

const namePanel = document.getElementById("namePanel");
const nameInput = document.getElementById("nameInput");
const joinButton = document.getElementById("joinButton");

const status = document.getElementById("status");
const onlineDot = document.getElementById("onlineDot");

const protocol = location.protocol === "https:" ? "wss" : "ws";
const serverUrl = `${protocol}://${location.host}`;

const socket = new WebSocket(serverUrl);

let joined = false;

const savedUsername = localStorage.getItem("bovarea_username");

const reactionOptions = ["👍", "❤️", "😂", "😭", "🙏", "🥀"];

function formatTime(timestamp) {
  if (!timestamp) return "";

  const date = new Date(timestamp);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit"
  });
}

function createReactionBar(messageId) {
  const bar = document.createElement("div");
  bar.className = "reaction-bar";

  reactionOptions.forEach((reaction) => {
    const button = document.createElement("button");

    button.className = "reaction-button";
    button.type = "button";
    button.textContent = reaction;

    button.addEventListener("click", (event) => {
      event.stopPropagation();

      if (!joined || socket.readyState !== WebSocket.OPEN) return;

      socket.send(JSON.stringify({
        type: "reaction",
        messageId,
        reaction
      }));
    });

    bar.appendChild(button);
  });

  return bar;
}

function updateReactionDisplay(wrapper, reactions) {
  let reactionsElement = wrapper.querySelector(".reactions");

  if (!reactionsElement) {
    reactionsElement = document.createElement("div");
    reactionsElement.className = "reactions";
    wrapper.appendChild(reactionsElement);
  }

  reactionsElement.innerHTML = "";

  Object.entries(reactions || {}).forEach(([reaction, users]) => {
    if (!Array.isArray(users) || users.length === 0) return;

    const reactionElement = document.createElement("button");

    reactionElement.className = "reaction";
    reactionElement.type = "button";
    reactionElement.textContent = `${reaction} ${users.length}`;

    reactionElement.addEventListener("click", () => {
      if (!joined || socket.readyState !== WebSocket.OPEN) return;

      socket.send(JSON.stringify({
        type: "reaction",
        messageId: wrapper.dataset.messageId,
        reaction
      }));
    });

    reactionsElement.appendChild(reactionElement);
  });

  if (Object.keys(reactions || {}).length === 0) {
    reactionsElement.remove();
  }
}

function addMessageToChat(
  sender,
  message,
  time,
  self = false,
  messageId = "",
  reactions = {}
) {
  const wrapper = document.createElement("div");

  wrapper.className = self ? "message self" : "message";

  if (messageId) {
    wrapper.dataset.messageId = messageId;
  }

  const senderElement = document.createElement("div");
  senderElement.className = "sender";
  senderElement.textContent = sender;

  const textElement = document.createElement("div");
  textElement.className = "text";
  textElement.textContent = message;

  wrapper.appendChild(senderElement);
  wrapper.appendChild(textElement);

  if (time) {
    const timeElement = document.createElement("div");
    timeElement.className = "message-time";
    timeElement.textContent = formatTime(time);
    wrapper.appendChild(timeElement);
  }

  if (messageId) {
    const reactionBar = createReactionBar(messageId);
    wrapper.appendChild(reactionBar);
  }

  if (reactions) {
    updateReactionDisplay(wrapper, reactions);
  }

  chatWindow.appendChild(wrapper);

  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function addSystemMessage(message) {
  const element = document.createElement("div");
  element.className = "system";
  element.textContent = message;

  chatWindow.appendChild(element);
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function addHistoryDivider() {
  const element = document.createElement("div");
  element.className = "history-divider";
  element.textContent = "While you were away";

  chatWindow.appendChild(element);
}

function setConnected(connected) {
  onlineDot.classList.toggle("connected", connected);
  status.textContent = connected ? "Connected" : "Disconnected";
}

function updateOnlineUsers(users, count) {
  let onlinePanel = document.getElementById("onlinePanel");

  if (!onlinePanel) {
    onlinePanel = document.createElement("div");
    onlinePanel.id = "onlinePanel";
    onlinePanel.className = "online-panel";

    document.querySelector(".header").appendChild(onlinePanel);
  }

  onlinePanel.innerHTML = "";

  const countElement = document.createElement("div");
  countElement.className = "online-count";
  countElement.textContent = `${count} online`;

  onlinePanel.appendChild(countElement);

  if (count > 0) {
    const usersElement = document.createElement("div");
    usersElement.className = "online-users";

    users.forEach((username) => {
      const userElement = document.createElement("div");
      userElement.className = "online-user";
      userElement.textContent = `● ${username}`;
      usersElement.appendChild(userElement);
    });

    onlinePanel.appendChild(usersElement);
  }
}

function joinChat(name) {
  const username = String(name || "").trim().slice(0, 24);

  if (!username || socket.readyState !== WebSocket.OPEN) return;

  localStorage.setItem("bovarea_username", username);

  socket.send(JSON.stringify({
    type: "join",
    name: username
  }));

  joined = true;
  namePanel.style.display = "none";
  messageInput.disabled = false;
  sendButton.disabled = false;
  messageInput.focus();
}

joinButton.addEventListener("click", () => {
  joinChat(nameInput.value);
});

nameInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    joinButton.click();
  }
});

chatForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const message = messageInput.value.trim();

  if (!message || !joined || socket.readyState !== WebSocket.OPEN) return;

  socket.send(JSON.stringify({
    type: "chat",
    message
  }));

  messageInput.value = "";
  messageInput.focus();
});

socket.addEventListener("open", () => {
  setConnected(true);

  if (savedUsername) {
    nameInput.value = savedUsername;
    joinChat(savedUsername);
  }
});

socket.addEventListener("message", (event) => {
  let data;

  try {
    data = JSON.parse(event.data);
  } catch {
    addSystemMessage(event.data);
    return;
  }

  if (data.type === "system") {
    addSystemMessage(data.message);
  }

  if (data.type === "users") {
    updateOnlineUsers(data.users, data.count);
  }

  if (data.type === "history") {
    if (Array.isArray(data.messages) && data.messages.length > 0) {
      addHistoryDivider();

      data.messages.forEach((message) => {
        addMessageToChat(
          message.sender,
          message.message,
          message.time,
          message.sender === savedUsername,
          message.id,
          message.reactions
        );
      });
    }
  }

  if (data.type === "chat") {
    addMessageToChat(
      data.sender,
      data.message,
      data.time,
      Boolean(data.self),
      data.id,
      data.reactions
    );
  }

  if (data.type === "reaction") {
    const messageElement = document.querySelector(
      `[data-message-id="${CSS.escape(data.messageId)}"]`
    );

    if (messageElement) {
      updateReactionDisplay(
        messageElement,
        data.reactions
      );
    }
  }
});

socket.addEventListener("close", () => {
  setConnected(false);
  messageInput.disabled = true;
  sendButton.disabled = true;

  const onlinePanel = document.getElementById("onlinePanel");

  if (onlinePanel) {
    onlinePanel.remove();
  }

  addSystemMessage("Connection closed.");
});

socket.addEventListener("error", (error) => {
  console.error("WebSocket error:", error);
  setConnected(false);
  addSystemMessage("A connection error occurred.");
});
