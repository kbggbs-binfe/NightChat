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

function addMessageToChat(sender, message, self = false) {
  const wrapper = document.createElement("div");
  wrapper.className = self ? "message self" : "message";

  const senderElement = document.createElement("div");
  senderElement.className = "sender";
  senderElement.textContent = sender;

  const textElement = document.createElement("div");
  textElement.className = "text";
  textElement.textContent = message;

  wrapper.appendChild(senderElement);
  wrapper.appendChild(textElement);
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

joinButton.addEventListener("click", () => {
  const name = nameInput.value.trim();

  if (!name || socket.readyState !== WebSocket.OPEN) return;

  socket.send(JSON.stringify({
    type: "join",
    name
  }));

  joined = true;
  namePanel.style.display = "none";
  messageInput.disabled = false;
  sendButton.disabled = false;
  messageInput.focus();
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

  if (data.type === "chat") {
    addMessageToChat(data.sender, data.message, Boolean(data.self));
  }
});

socket.addEventListener("close", () => {
  setConnected(false);
  messageInput.disabled = true;
  sendButton.disabled = true;
  addSystemMessage("Connection closed.");
});

socket.addEventListener("error", (error) => {
  console.error("WebSocket error:", error);
  setConnected(false);
  addSystemMessage("A connection error occurred.");
});
