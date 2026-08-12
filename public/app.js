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
let replyTarget = null;

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

function setReplyTarget(replyData) {
  replyTarget = replyData;

  let replyPreview = document.getElementById("replyPreview");

  if (!replyPreview) {
    replyPreview = document.createElement("div");
    replyPreview.id = "replyPreview";
    replyPreview.className = "reply-preview";

    const composer = document.querySelector(".composer");
    composer.insertBefore(replyPreview, composer.firstChild);
  }

  replyPreview.innerHTML = "";

  const content = document.createElement("div");
  content.className = "reply-preview-content";

  const title = document.createElement("div");
  title.className = "reply-preview-title";
  title.textContent = `Replying to ${replyData.sender}`;

  const message = document.createElement("div");
  message.className = "reply-preview-message";
  message.textContent = replyData.message;

  content.appendChild(title);
  content.appendChild(message);

  const cancelButton = document.createElement("button");
  cancelButton.type = "button";
  cancelButton.className = "reply-cancel";
  cancelButton.textContent = "×";

  cancelButton.addEventListener("click", cancelReply);

  replyPreview.appendChild(content);
  replyPreview.appendChild(cancelButton);

  messageInput.focus();
}

function cancelReply() {
  replyTarget = null;

  const replyPreview = document.getElementById("replyPreview");

  if (replyPreview) {
    replyPreview.remove();
  }
}

function addReplyPreview(wrapper, replyTo) {
  if (!replyTo) return;

  const replyElement = document.createElement("div");
  replyElement.className = "message-reply";

  const replySender = document.createElement("div");
  replySender.className = "message-reply-sender";
  replySender.textContent = replyTo.sender;

  const replyText = document.createElement("div");
  replyText.className = "message-reply-text";
  replyText.textContent = replyTo.message;

  replyElement.appendChild(replySender);
  replyElement.appendChild(replyText);

  wrapper.appendChild(replyElement);
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

function createActionMenu(wrapper, messageId, sender, message) {
  const actionMenu = document.createElement("div");
  actionMenu.className = "message-actions";

  const replyButton = document.createElement("button");
  replyButton.type = "button";
  replyButton.className = "message-action";
  replyButton.textContent = "↩ Reply";

  replyButton.addEventListener("click", (event) => {
    event.stopPropagation();

    setReplyTarget({
      id: messageId,
      sender,
      message
    });

    wrapper.classList.remove("actions-open");
  });

  const reactButton = document.createElement("button");
  reactButton.type = "button";
  reactButton.className = "message-action";
  reactButton.textContent = "React";

  reactButton.addEventListener("click", (event) => {
    event.stopPropagation();

    wrapper.classList.remove("actions-open");
    wrapper.classList.add("reactions-open");
  });

  actionMenu.appendChild(replyButton);
  actionMenu.appendChild(reactButton);

  return actionMenu;
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

    reactionElement.addEventListener("click", (event) => {
      event.stopPropagation();

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
  reactions = {},
  replyTo = null
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

  addReplyPreview(wrapper, replyTo);

  wrapper.appendChild(textElement);

  if (time) {
    const timeElement = document.createElement("div");
    timeElement.className = "message-time";
    timeElement.textContent = formatTime(time);
    wrapper.appendChild(timeElement);
  }

  if (messageId) {
    const actionMenu = createActionMenu(
      wrapper,
      messageId,
      sender,
      message
    );

    const reactionBar = createReactionBar(messageId);

    wrapper.appendChild(actionMenu);
    wrapper.appendChild(reactionBar);

    wrapper.addEventListener("click", (event) => {
      if (event.target.closest(".message-actions")) return;
      if (event.target.closest(".reaction-bar")) return;
      if (event.target.closest(".reactions")) return;

      const allMessages = document.querySelectorAll(".message");

      allMessages.forEach((otherMessage) => {
        if (otherMessage !== wrapper) {
          otherMessage.classList.remove("actions-open");
          otherMessage.classList.remove("reactions-open");
        }
      });

      wrapper.classList.toggle("actions-open");
    });
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
    message,
    replyTo: replyTarget ? replyTarget.id : null
  }));

  messageInput.value = "";
  cancelReply();
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
          message.reactions,
          message.replyTo
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
      data.reactions,
      data.replyTo
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
