console.log("✅ chat.js loaded");
let selectedUser = null;

const socket = io("http://localhost:3000");

const currentUser = JSON.parse(localStorage.getItem("user"));
socket.emit("join", currentUser.username);

console.log("Current User:", currentUser);

const sendBtn = document.getElementById("sendBtn");
const messageInput = document.getElementById("messageInput");
const chatBody = document.getElementById("chatBody");

// Load everything
loadMessages();
loadUsers();

// Send button
sendBtn.addEventListener("click", sendMessage);

// Enter key
messageInput.addEventListener("keypress", function (event) {

    if (event.key === "Enter") {

        sendMessage();

    }

});

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

    const response = await fetch("http://localhost:3000/messages");

    const messages = await response.json();

    chatBody.innerHTML = "";

    messages.forEach(msg => {

        if (msg.sender === currentUser.username) {

            addMessage(msg.message, "sent");

        } else {

            addMessage(msg.message, "received");

        }

    });

}

// ==========================
// Load Users
// ==========================
async function loadUsers() {

    console.log("Loading Users...");

    const response = await fetch("http://localhost:3000/users");

    const users = await response.json();

    console.log(users);

    const userList = document.getElementById("userList");

    userList.innerHTML = "";

    users.forEach(user => {

        if (user.username === currentUser.username) return;

        const div = document.createElement("div");

        div.className = "user-card";

        div.innerHTML = "😊 " + user.username;

        div.onclick = () => {

            selectedUser = user;

            document.getElementById("chatUser").textContent =
                "😊 " + user.username;

            loadConversation();

        };

        userList.appendChild(div);

    });

}

// ==========================
// Load Conversation
// ==========================
async function loadConversation() {

    if (!selectedUser) return;

    const response = await fetch(
        `http://localhost:3000/messages/${currentUser.username}/${selectedUser.username}`
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

}