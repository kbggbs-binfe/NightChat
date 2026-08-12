const http = require("http");
const fs = require("fs");
const path = require("path");
const WebSocket = require("ws");

const PORT = process.env.PORT || 8080;
const publicDir = path.join(__dirname, "public");

const STATS_FILE = path.join(
  __dirname,
  "bovarea_stats.json"
);

const STATS_ROOM = "userdata_bovarea";

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};


/* =========================
   HTTP SERVER
========================= */

const server = http.createServer((req, res) => {

  let requestedPath = decodeURIComponent(
    req.url.split("?")[0]
  );

  if (requestedPath === "/") {
    requestedPath = "/index.html";
  }

  const safePath = path
    .normalize(requestedPath)
    .replace(/^(\.\.[/\\])+/, "");

  const filePath = path.join(
    publicDir,
    safePath
  );

  if (!filePath.startsWith(publicDir)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }

  fs.readFile(filePath, (err, data) => {

    if (err) {

      res.writeHead(404, {
        "Content-Type":
          "text/plain; charset=utf-8"
      });

      return res.end("Not found");
    }

    const ext = path
      .extname(filePath)
      .toLowerCase();

    res.writeHead(200, {
      "Content-Type":
        mimeTypes[ext] ||
        "application/octet-stream"
    });

    res.end(data);
  });
});


/* =========================
   WEBSOCKET SERVER
========================= */

const wss =
  new WebSocket.Server({
    server
  });


/* =========================
   CLIENTS & ROOMS
========================= */

const clients = new Map();

const rooms = new Map();

const HISTORY_DURATION =
  60 * 1000;


/* =========================
   STATISTICS
========================= */

/*
 * These statistics are deliberately
 * simple and privacy-friendly.
 *
 * We do NOT store:
 * - IP addresses
 * - device IDs
 * - phone numbers
 * - emails
 * - locations
 */

let statistics = {
  uniqueUsers: [],
  totalSessions: 0,
  totalMessages: 0,
  uniqueRooms: []
};


/*
 * Load previous statistics.
 */

function loadStatistics() {

  try {

    if (!fs.existsSync(STATS_FILE)) {
      return;
    }

    const data =
      fs.readFileSync(
        STATS_FILE,
        "utf8"
      );

    const parsed =
      JSON.parse(data);

    if (
      parsed &&
      typeof parsed === "object"
    ) {

      statistics = {

        uniqueUsers:
          Array.isArray(
            parsed.uniqueUsers
          )
            ? parsed.uniqueUsers
            : [],

        totalSessions:
          Number(
            parsed.totalSessions
          ) || 0,

        totalMessages:
          Number(
            parsed.totalMessages
          ) || 0,

        uniqueRooms:
          Array.isArray(
            parsed.uniqueRooms
          )
            ? parsed.uniqueRooms
            : []
      };
    }

  } catch (error) {

    console.error(
      "Could not load statistics:",
      error.message
    );
  }
}


/*
 * Save statistics.
 */

function saveStatistics() {

  try {

    fs.writeFileSync(
      STATS_FILE,
      JSON.stringify(
        statistics,
        null,
        2
      ),
      "utf8"
    );

  } catch (error) {

    console.error(
      "Could not save statistics:",
      error.message
    );
  }
}


loadStatistics();


/*
 * Record a user.
 *
 * The username is used only as a
 * simple anonymous-ish unique marker.
 */

function recordUser(username) {

  if (
    !username ||
    username === "Anonymous"
  ) {
    return;
  }

  if (
    !statistics.uniqueUsers.includes(
      username
    )
  ) {

    statistics.uniqueUsers.push(
      username
    );

    saveStatistics();
  }
}


/*
 * Record a successful session.
 */

function recordSession() {

  statistics.totalSessions++;

  saveStatistics();
}


/*
 * Record a message.
 */

function recordMessage() {

  statistics.totalMessages++;

  saveStatistics();
}


/*
 * Record a room.
 */

function recordRoom(roomCode) {

  if (
    !roomCode ||
    roomCode === STATS_ROOM
  ) {
    return;
  }

  if (
    !statistics.uniqueRooms.includes(
      roomCode
    )
  ) {

    statistics.uniqueRooms.push(
      roomCode
    );

    saveStatistics();
  }
}


/*
 * Send the hidden statistics
 * to one client.
 */

function sendStatistics(socket) {

  const uniqueUsers =
    statistics.uniqueUsers.length;

  const totalSessions =
    statistics.totalSessions;

  const totalMessages =
    statistics.totalMessages;

  const uniqueRooms =
    statistics.uniqueRooms.length;


  /*
   * The existing app.js already
   * knows how to display system
   * messages, so no client-side
   * changes are required.
   */

  const lines = [

    "╔════════════════════════════╗",

    "        BOVAREA DATA",

    "╚════════════════════════════╝",

    "",

    `People who have used Bovarea: ${uniqueUsers}`,

    `Total sessions: ${totalSessions}`,

    `Total messages sent: ${totalMessages}`,

    `Rooms used: ${uniqueRooms}`,

    "",

    "The little machine is alive.",

    "",

    "╔════════════════════════════╗"

  ];


  socket.send(
    JSON.stringify({
      type: "system",
      message:
        lines.join("\n")
    })
  );
}


/* =========================
   REACTIONS
========================= */

const allowedReactions = [
  "👍",
  "❤️",
  "😂",
  "😭",
  "🙏",
  "🥀"
];


/* =========================
   ROOM CODE
========================= */

function normalizeRoomCode(code) {

  let roomCode =
    String(code || "")
      .trim()
      .slice(0, 100)
      .toLowerCase();


  if (!roomCode) {
    roomCode = "default";
  }


  return roomCode;
}


function getOrCreateRoom(roomCode) {

  if (!rooms.has(roomCode)) {

    rooms.set(
      roomCode,
      {
        clients: new Set(),
        messages: []
      }
    );
  }


  return rooms.get(
    roomCode
  );
}


function removeEmptyRoom(roomCode) {

  const room =
    rooms.get(roomCode);

  if (!room) return;


  if (
    room.clients.size === 0
  ) {

    rooms.delete(
      roomCode
    );
  }
}


/* =========================
   ROOM BROADCAST
========================= */

function broadcastToRoom(
  roomCode,
  payload,
  except = null
) {

  const room =
    rooms.get(roomCode);

  if (!room) return;


  const message =
    JSON.stringify(payload);


  for (
    const socket of room.clients
  ) {

    if (
      socket.readyState ===
        WebSocket.OPEN &&
      socket !== except
    ) {

      socket.send(message);
    }
  }
}


/* =========================
   ONLINE USERS
========================= */

function getOnlineUsers(
  roomCode
) {

  const room =
    rooms.get(roomCode);

  if (!room) return [];


  const users = [];


  for (
    const socket of room.clients
  ) {

    const client =
      clients.get(socket);


    if (
      client &&
      client.username !==
        "Anonymous"
    ) {

      users.push(
        client.username
      );
    }
  }


  return users;
}


function broadcastUserList(
  roomCode
) {

  const users =
    getOnlineUsers(
      roomCode
    );


  broadcastToRoom(
    roomCode,
    {
      type: "users",
      count: users.length,
      users
    }
  );
}


/* =========================
   MESSAGE HISTORY
========================= */

function cleanOldMessages(
  roomCode
) {

  const room =
    rooms.get(roomCode);

  if (!room) return;


  const cutoff =
    Date.now() -
    HISTORY_DURATION;


  while (
    room.messages.length > 0 &&
    new Date(
      room.messages[0].time
    ).getTime() < cutoff
  ) {

    room.messages.shift();
  }
}


function addRecentMessage(
  roomCode,
  sender,
  message,
  time,
  replyTo = null
) {

  const room =
    getOrCreateRoom(
      roomCode
    );


  cleanOldMessages(
    roomCode
  );


  const chatMessage = {

    id:
      `${time}-${Math.random()
        .toString(36)
        .slice(2, 10)}`,

    sender,

    message,

    time:
      new Date(time)
        .toISOString(),

    reactions: {},

    replyTo
  };


  room.messages.push(
    chatMessage
  );


  return chatMessage;
}


function sendRecentMessages(
  socket,
  roomCode
) {

  const room =
    rooms.get(roomCode);

  if (!room) return;


  cleanOldMessages(
    roomCode
  );


  if (
    room.messages.length === 0
  ) {
    return;
  }


  socket.send(
    JSON.stringify({
      type: "history",
      messages:
        room.messages
    })
  );
}


/* =========================
   CONNECTION
========================= */

wss.on(
  "connection",
  (socket) => {

    clients.set(
      socket,
      {
        username: "Anonymous",
        roomCode: null
      }
    );


    socket.send(
      JSON.stringify({
        type: "system",
        message:
          "Connected to the server."
      })
    );


    /* =========================
       INCOMING MESSAGE
    ========================= */

    socket.on(
      "message",
      (raw) => {

        let data;


        try {

          data =
            JSON.parse(
              raw.toString()
            );

        } catch {

          return;
        }


        /* =========================
           JOIN ROOM
        ========================= */

        if (
          data.type === "join"
        ) {

          const name =
            String(
              data.name ||
                "Anonymous"
            )
              .trim()
              .slice(0, 24);


          const username =
            name ||
            "Anonymous";


          const roomCode =
            normalizeRoomCode(
              data.roomCode
            );


          /*
           * Hidden statistics room.
           *
           * It does NOT become a normal
           * chat room and nobody else
           * gets added to it.
           */

          if (
            roomCode ===
            STATS_ROOM
          ) {

            /*
             * Count the person as a user
             * if they have not appeared
             * before.
             */

            recordUser(
              username
            );


            socket.send(
              JSON.stringify({
                type: "room",
                roomCode:
                  STATS_ROOM
              })
            );


            socket.send(
              JSON.stringify({
                type: "system",
                message:
                  `Welcome to the hidden Bovarea data room, ${username}.`
              })
            );


            sendStatistics(
              socket
            );


            return;
          }


          const previousClient =
            clients.get(socket);


          /*
           * Leave previous room first.
           */

          if (
            previousClient &&
            previousClient.roomCode
          ) {

            const oldRoom =
              rooms.get(
                previousClient.roomCode
              );


            if (oldRoom) {

              oldRoom.clients.delete(
                socket
              );


              broadcastToRoom(
                previousClient.roomCode,
                {
                  type: "system",
                  message:
                    `${previousClient.username} left the chat.`
                }
              );


              broadcastUserList(
                previousClient.roomCode
              );


              removeEmptyRoom(
                previousClient.roomCode
              );
            }
          }


          /*
           * Get or create room.
           */

          const room =
            getOrCreateRoom(
              roomCode
            );


          room.clients.add(
            socket
          );


          clients.set(
            socket,
            {
              username,
              roomCode
            }
          );


          /*
           * Record statistics.
           */

          recordUser(
            username
          );

          recordSession();

          recordRoom(
            roomCode
          );


          /*
           * Tell user which room
           * they entered.
           */

          socket.send(
            JSON.stringify({
              type: "room",
              roomCode
            })
          );


          socket.send(
            JSON.stringify({
              type: "system",
              message:
                `Welcome, ${username}.`
            })
          );


          /*
           * Send history.
           */

          sendRecentMessages(
            socket,
            roomCode
          );


          /*
           * Tell everyone else.
           */

          broadcastToRoom(
            roomCode,
            {
              type: "system",
              message:
                `${username} joined the chat.`
            },
            socket
          );


          broadcastUserList(
            roomCode
          );


          return;
        }


        /* =========================
           CHAT MESSAGE
        ========================= */

        if (
          data.type === "chat"
        ) {

          const client =
            clients.get(socket);


          if (
            !client ||
            !client.roomCode
          ) {
            return;
          }


          /*
           * Do not allow the hidden
           * statistics room to become
           * a normal chat.
           */

          if (
            client.roomCode ===
            STATS_ROOM
          ) {

            sendStatistics(
              socket
            );

            return;
          }


          const message =
            String(
              data.message || ""
            )
              .trim()
              .slice(0, 500);


          if (!message) {
            return;
          }


          const {
            username,
            roomCode
          } = client;


          const time =
            Date.now();


          let replyTo = null;


          /*
           * Replies can only reference
           * messages from this room.
           */

          if (data.replyTo) {

            const room =
              rooms.get(
                roomCode
              );


            if (room) {

              const repliedMessage =
                room.messages.find(
                  (item) =>
                    item.id ===
                    data.replyTo
                );


              if (repliedMessage) {

                replyTo = {

                  id:
                    repliedMessage.id,

                  sender:
                    repliedMessage.sender,

                  message:
                    repliedMessage.message
                };
              }
            }
          }


          const chatMessage =
            addRecentMessage(
              roomCode,
              username,
              message,
              time,
              replyTo
            );


          recordMessage();


          /*
           * Send to everyone ELSE.
           */

          broadcastToRoom(
            roomCode,
            {
              type: "chat",

              id:
                chatMessage.id,

              sender:
                chatMessage.sender,

              message:
                chatMessage.message,

              time:
                chatMessage.time,

              reactions:
                chatMessage.reactions,

              replyTo:
                chatMessage.replyTo

            },
            socket
          );


          /*
           * Send back to sender.
           */

          socket.send(
            JSON.stringify({

              type: "chat",

              id:
                chatMessage.id,

              sender:
                chatMessage.sender,

              message:
                chatMessage.message,

              time:
                chatMessage.time,

              reactions:
                chatMessage.reactions,

              replyTo:
                chatMessage.replyTo,

              self: true
            })
          );


          return;
        }


        /* =========================
           REACTION
        ========================= */

        if (
          data.type === "reaction"
        ) {

          const client =
            clients.get(socket);


          if (
            !client ||
            !client.roomCode
          ) {
            return;
          }


          /*
           * Statistics room does not
           * support reactions.
           */

          if (
            client.roomCode ===
            STATS_ROOM
          ) {
            return;
          }


          const {
            username,
            roomCode
          } = client;


          cleanOldMessages(
            roomCode
          );


          const room =
            rooms.get(
              roomCode
            );


          if (!room) {
            return;
          }


          const message =
            room.messages.find(
              (item) =>
                item.id ===
                data.messageId
            );


          if (!message) {
            return;
          }


          const reaction =
            String(
              data.reaction || ""
            );


          if (
            !allowedReactions.includes(
              reaction
            )
          ) {
            return;
          }


          if (
            !message.reactions[
              reaction
            ]
          ) {

            message.reactions[
              reaction
            ] = [];
          }


          const users =
            message.reactions[
              reaction
            ];


          const existingIndex =
            users.indexOf(
              username
            );


          if (
            existingIndex !== -1
          ) {

            users.splice(
              existingIndex,
              1
            );


            if (
              users.length === 0
            ) {

              delete message
                .reactions[
                  reaction
                ];
            }

          } else {

            users.push(
              username
            );
          }


          broadcastToRoom(
            roomCode,
            {
              type: "reaction",

              messageId:
                message.id,

              reactions:
                message.reactions
            }
          );


          return;
        }
      }
    );


    /* =========================
       CONNECTION CLOSED
    ========================= */

    socket.on(
      "close",
      () => {

        const client =
          clients.get(socket);


        clients.delete(
          socket
        );


        if (
          !client ||
          !client.roomCode
        ) {
          return;
        }


        /*
         * Statistics room isn't a
         * real persistent room.
         */

        if (
          client.roomCode ===
          STATS_ROOM
        ) {
          return;
        }


        const {
          username,
          roomCode
        } = client;


        const room =
          rooms.get(
            roomCode
          );


        if (!room) {
          return;
        }


        room.clients.delete(
          socket
        );


        if (
          username !==
          "Anonymous"
        ) {

          broadcastToRoom(
            roomCode,
            {
              type: "system",
              message:
                `${username} left the chat.`
            }
          );


          broadcastUserList(
            roomCode
          );
        }


        removeEmptyRoom(
          roomCode
        );
      }
    );


    socket.on(
      "error",
      (error) => {

        console.error(
          "WebSocket error:",
          error.message
        );
      }
    );
  }
);


/* =========================
   START SERVER
========================= */

server.listen(
  PORT,
  "0.0.0.0",
  () => {

    console.log(
      `Chat server running at http://localhost:${PORT}`
    );
  }
);
