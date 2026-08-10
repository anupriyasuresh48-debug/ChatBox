console.log("✅ chat.js loaded");
let selectedUser = null;

// Dynamic backend URL configuration for local and deployed environments
// REPLACE 'YOUR-ACTUAL-RENDER-BACKEND-NAME' with your real backend service link on Render
const API_BASE_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:3000"
    : "https://chatbox-jibs.onrender.com";

// Socket.io connection configured to use dynamic base URL
const socket = io(API_BASE_URL, {
    transports: ["websocket", "polling"],
    withCredentials: true
});

const currentUser = JSON.parse(localStorage.getItem("user")) || { username: "Guest" };
socket.emit("join", currentUser.username);

console.log("Current User:", currentUser);

const sendBtn = document.getElementById("sendBtn");
const messageInput = document.getElementById("messageInput");
const chatBody = document.getElementById("chatBody");

// Load initial data
loadMessages();
loadUsers();

// Send button handler
if (sendBtn) {
    sendBtn.addEventListener("click", sendMessage);
}

// Enter key handler
if (messageInput) {
    messageInput.addEventListener("keypress", function (event) {
        if (event.key === "Enter") {
            sendMessage();
        }
    });
}

// ==========================
// Send Message
// ==========================
async function sendMessage() {
    const message = messageInput.value.trim();

    if (message === "") return;

    if (!selectedUser) {
        alert("Please select a user first.");
        return;
    }

    const data = {
        sender: currentUser.username,
        receiver: selectedUser.username,
        message: message
    };

    addMessage(message, "sent");

    socket.emit("send-message", data);

    messageInput.value = "";
}

// ==========================
// Receive Message
// ==========================
socket.on("receive-message", (data) => {
    if (
        data.sender === selectedUser?.username ||
        data.sender === currentUser.username
    ) {
        addMessage(data.message, "received");
    }
});

// ==========================
// Add Message
// ==========================
function addMessage(text, type) {
    const div = document.createElement("div");
    div.className = "message " + type;
    div.innerText = text;

    chatBody.appendChild(div);
    chatBody.scrollTop = chatBody.scrollHeight;
}

// ==========================
// Load All Messages
// ==========================
async function loadMessages() {
    try {
        const response = await fetch(`${API_BASE_URL}/messages`);
        const messages = await response.json();

        chatBody.innerHTML = "";

        messages.forEach(msg => {
            if (msg.sender === currentUser.username) {
                addMessage(msg.message, "sent");
            } else {
                addMessage(msg.message, "received");
            }
        });
    } catch (error) {
        console.error("Error loading messages:", error);
    }
}

// ==========================
// Load Users
// ==========================
async function loadUsers() {
    console.log("Loading Users...");

    try {
        const response = await fetch(`${API_BASE_URL}/users`);
        const users = await response.json();

        console.log(users);

        const userList = document.getElementById("userList");
        if (!userList) return;

        userList.innerHTML = "";

        users.forEach(user => {
            if (user.username === currentUser.username) return;

            const div = document.createElement("div");
            div.className = "user-card";
            div.innerHTML = "😊 " + user.username;

            div.onclick = () => {
                selectedUser = user;

                const chatUserElem = document.getElementById("chatUser");
                if (chatUserElem) {
                    chatUserElem.textContent = "😊 " + user.username;
                }

                loadConversation();
            };

            userList.appendChild(div);
        });
    } catch (error) {
        console.error("Error loading users:", error);
    }
}

// ==========================
// Load Conversation
// ==========================
async function loadConversation() {
    if (!selectedUser) return;

    try {
        const response = await fetch(
            `${API_BASE_URL}/messages/${currentUser.username}/${selectedUser.username}`
        );

        const messages = await response.json();

        chatBody.innerHTML = "";

        messages.forEach(msg => {
            if (msg.sender === currentUser.username) {
                addMessage(msg.message, "sent");
            } else {
                addMessage(msg.message, "received");
            }
        });
    } catch (error) {
        console.error("Error loading conversation:", error);
    }
}