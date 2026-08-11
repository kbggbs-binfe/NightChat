const http = require("http");
const fs = require("fs");
const path = require("path");
const WebSocket = require("ws");

const PORT = process.env.PORT || 8080;
const publicDir = path.join(__dirname, "public");

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

const server = http.createServer((req, res) => {
  let requestedPath = decodeURIComponent(req.url.split("?")[0]);

  if (requestedPath === "/") requestedPath = "/index.html";

  // Prevent path traversal.
  const safePath = path.normalize(requestedPath).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(publicDir, safePath);

  if (!filePath.startsWith(publicDir)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      return res.end("Not found");
    }

    const ext = path.extname(filePath).toLowerCase();

    res.writeHead(200, {
      "Content-Type": mimeTypes[ext] || "application/octet-stream"
    });

    res.end(data);
  });
});

const wss = new WebSocket.Server({ server });
const clients = new Map();

function broadcast(payload, except = null) {
  const message = JSON.stringify(payload);

  for (const [socket] of clients) {
    if (socket.readyState === WebSocket.OPEN && socket !== except) {
      socket.send(message);
    }
  }
}

function getOnlineUsers() {
  return Array.from(clients.values())
    .filter((username) => username !== "Anonymous");
}

function broadcastUserList() {
  const users = getOnlineUsers();

  broadcast({
    type: "users",
    count: users.length,
    users
  });
}

wss.on("connection", (socket) => {
  clients.set(socket, "Anonymous");

  socket.send(JSON.stringify({
    type: "system",
    message: "Connected to the server."
  }));

  socket.on("message", (raw) => {
    let data;

    try {
      data = JSON.parse(raw.toString());
    } catch {
      return;
    }

    if (data.type === "join") {
      const name = String(data.name || "Anonymous")
        .trim()
        .slice(0, 24);

      const username = name || "Anonymous";

      clients.set(socket, username);

      socket.send(JSON.stringify({
        type: "system",
        message: `Welcome, ${username}.`
      }));

      broadcast({
        type: "system",
        message: `${username} joined the chat.`
      }, socket);

      broadcastUserList();

      return;
    }

    if (data.type === "chat") {
      const message = String(data.message || "")
        .trim()
        .slice(0, 500);

      if (!message) return;

      const sender = clients.get(socket) || "Anonymous";

      broadcast({
        type: "chat",
        sender,
        message,
        time: new Date().toISOString()
      }, socket);

      // Echo back to the sender too.
      socket.send(JSON.stringify({
        type: "chat",
        sender,
        message,
        time: new Date().toISOString(),
        self: true
      }));
    }
  });

  socket.on("close", () => {
    const username = clients.get(socket);

    clients.delete(socket);

    if (username && username !== "Anonymous") {
      broadcast({
        type: "system",
        message: `${username} left the chat.`
      });

      broadcastUserList();
    }
  });

  socket.on("error", (error) => {
    console.error("WebSocket error:", error.message);
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Chat server running at http://localhost:${PORT}`);
});
