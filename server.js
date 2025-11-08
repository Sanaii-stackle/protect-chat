const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve files from the "public" folder, using an absolute path
app.use(express.static(path.join(__dirname, "public")));

// Explicitly send index.html on "/"
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("chatMessage", (msgData) => {
    // msgData: { user, cipherText, ranger }
    console.log("Encrypted message received:", msgData);
    io.emit("chatMessage", msgData);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

const PORT = 3000; // or 3001 if 3000 is busy
server.listen(PORT, () => {
  console.log(`Secure chat server running on http://localhost:${PORT}`);
});
