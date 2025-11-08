// public/chat.js

const socket = io(); // connect to server

const chatDiv = document.getElementById("chat");
const usernameInput = document.getElementById("username");
const keyInput = document.getElementById("key");
const messageInput = document.getElementById("message");
const sendBtn = document.getElementById("sendBtn");
const rangerSelect = document.getElementById("ranger");

// ===== Theme handling =====
function applyTheme(ranger) {
  document.body.setAttribute("data-ranger", ranger);
}

// set initial theme
applyTheme(rangerSelect.value);

// update theme when user changes ranger
rangerSelect.addEventListener("change", () => {
  applyTheme(rangerSelect.value);
});

// ===== Encryption functions (custom cipher) =====
function encrypt(plainText, key) {
  if (!key || key.length === 0) {
    alert("Key cannot be empty");
    return "";
  }
  const keyCodes = [...key].map(ch => ch.charCodeAt(0));
  let cipherHex = "";

  for (let i = 0; i < plainText.length; i++) {
    const p = plainText.charCodeAt(i);
    const k = keyCodes[i % keyCodes.length];
    const c = (p + k) % 256;
    cipherHex += c.toString(16).padStart(2, "0");
  }

  return cipherHex;
}

function decrypt(cipherHex, key) {
  if (!key || key.length === 0) return "";

  const keyCodes = [...key].map(ch => ch.charCodeAt(0));
  let plainText = "";

  for (let i = 0; i < cipherHex.length; i += 2) {
    const c = parseInt(cipherHex.substr(i, 2), 16);
    const k = keyCodes[(i / 2) % keyCodes.length];
    const p = (c - k + 256) % 256;
    plainText += String.fromCharCode(p);
  }

  return plainText;
}

// ===== UI helpers =====
function addMessage(user, cipherText, ranger, isMe) {
  const key = keyInput.value;
  const plainText = decrypt(cipherText, key);

  const msgDiv = document.createElement("div");
  msgDiv.className = "msg";
  if (isMe) msgDiv.classList.add("me");
  if (ranger) msgDiv.dataset.ranger = ranger;

  // Header: username + ranger pill
  const headerDiv = document.createElement("div");
  headerDiv.className = "msg-header";

  const userSpan = document.createElement("span");
  userSpan.textContent = user + " ";

  const pillSpan = document.createElement("span");
  pillSpan.className = "ranger-pill";

  const rangerLabel = (ranger || "red") + " ranger";
  pillSpan.textContent =
    rangerLabel.charAt(0).toUpperCase() + rangerLabel.slice(1);

  const dotSpan = document.createElement("span");
  dotSpan.className = "ranger-dot";

  pillSpan.prepend(dotSpan);
  headerDiv.appendChild(userSpan);
  headerDiv.appendChild(pillSpan);

  const plainSpan = document.createElement("span");
  plainSpan.className = "plain";
  plainSpan.textContent = plainText;

  const cipherSpan = document.createElement("div");
  cipherSpan.className = "cipher";
  cipherSpan.textContent = "Cipher: " + cipherText;

  msgDiv.appendChild(headerDiv);
  msgDiv.appendChild(plainSpan);
  msgDiv.appendChild(cipherSpan);

  chatDiv.appendChild(msgDiv);
  chatDiv.scrollTop = chatDiv.scrollHeight;
}

// ===== Event handlers =====

// Send message
sendBtn.addEventListener("click", () => {
  const user = usernameInput.value.trim() || "Anonymous";
  const msg = messageInput.value;
  const key = keyInput.value;
  const ranger = rangerSelect.value || "red";

  if (!msg) return;
  if (!key) {
    alert("Enter a key for encryption first.");
    return;
  }

  const cipherText = encrypt(msg, key);
  if (!cipherText) return;

  // Send ciphertext + username + ranger to server
  socket.emit("chatMessage", { user, cipherText, ranger });

  // Show immediately in this window as "me"
  addMessage(user, cipherText, ranger, true);

  messageInput.value = "";
  messageInput.focus();
});

// Allow Enter key to send
messageInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    sendBtn.click();
  }
});

// Receive message from server
socket.on("chatMessage", (data) => {
  const myName = (usernameInput.value.trim() || "Anonymous");
  const isMe = data.user === myName;

  // We already added our own message locally, so skip duplicates
  if (isMe) return;

  addMessage(data.user, data.cipherText, data.ranger || "red", false);
});
