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

const reactionOptions = [
  "👍",
  "❤️",
  "😂",
  "😭",
  "🙏",
  "🥀"
];


/* =========================
   TIME
========================= */

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


/* =========================
   REPLY
========================= */

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


/* =========================
   REACTIONS
========================= */

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


/* =========================
   MESSAGE ACTIONS
========================= */

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


/* =========================
   ADD MESSAGE
========================= */

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


/* =========================
   SYSTEM MESSAGE
========================= */

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


/* =========================
   CONNECTION
========================= */

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


/* =========================
   ONLINE USERS
========================= */

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


/* =========================
   JOIN ROOM
========================= */

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


  /*
   * If the user already has a
   * username, enter immediately.
   */

  if (savedUsername) {

    joinChat(
      savedUsername,
      roomCode
    );

    return;
  }


  /*
   * Otherwise remember the room
   * and show the username panel.
   */

  roomJoined = false;

  currentRoom =
    roomCode;

  roomPanel.style.display =
    "none";

  namePanel.style.display =
    "block";

  nameInput.focus();
}


/* =========================
   JOIN CHAT
========================= */

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


/* =========================
   CHANGE NAME
========================= */

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


  /*
   * Reloading reconnects using
   * the new username and same room.
   */

  window.location.reload();
}


/* =========================
   BUTTON EVENTS
========================= */

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


/* =========================
   CHANGE NAME BUTTON
========================= */

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


/* =========================
   CHAT FORM
========================= */

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


/* =========================
   WEBSOCKET OPEN
========================= */

socket.addEventListener(
  "open",
  () => {

    setConnected(true);


    /*
     * Don't automatically join yet.
     *
     * We want the user to choose
     * a room first.
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


/* =========================
   WEBSOCKET MESSAGES
========================= */

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


/* =========================
   CLOSE
========================= */

socket.addEventListener(
  "close",
  () => {

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


/* =========================
   ERROR
========================= */

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
