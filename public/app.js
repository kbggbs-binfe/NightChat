const chatWindow = document.getElementById("chat-window");
const messageInput = document.getElementById("message-input");
const sendButton = document.getElementById("send-button");
const chatForm = document.getElementById("chatForm");

const namePanel = document.getElementById("namePanel");
const nameInput = document.getElementById("nameInput");
const joinButton = document.getElementById("joinButton");

const changeNameButton = document.getElementById("changeNameButton");
const nameChangePanel = document.getElementById("nameChangePanel");
const newNameInput = document.getElementById("newNameInput");
const cancelNameButton = document.getElementById("cancelNameButton");
const saveNameButton = document.getElementById("saveNameButton");

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
    wrapper.classList.add("reactions-open
