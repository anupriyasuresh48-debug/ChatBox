require("dotenv").config();
console.log("MONGO_URI =", process.env.MONGO_URI);
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcrypt");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
const User = require("./models/User");
const Message = require("./models/Message");

// Initialize Express & HTTP Server
const app = express();
const server = http.createServer(app);

// Environment Port (Defaults to 3000 locally, dynamically set by Render in production)
const PORT = process.env.PORT || 3000;

// Connect to Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Serve Static Frontend
app.use(express.static(path.join(__dirname, "../Frontend")));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "../Frontend/index.html"));
});

// Socket.IO Setup
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Socket.IO Connection Handler
io.on("connection", (socket) => {
    console.log("🟢 User Connected:", socket.id);

    // User joins their own room
    socket.on("join", (username) => {
        socket.join(username);
        console.log(`${username} joined room`);
    });

    // Send Message
    socket.on("send-message", async (data) => {
        try {
            console.log("Message received:", data);

            const newMessage = new Message({
                sender: data.sender,
                receiver: data.receiver,
                message: data.message
            });

            await newMessage.save();

            // Send to receiver & sender
            io.to(data.receiver).emit("receive-message", data);
            io.to(data.sender).emit("receive-message", data);

        } catch (error) {
            console.error("Socket Message Error:", error);
        }
    });

    socket.on("disconnect", () => {
        console.log("🔴 User Disconnected");
    });
});

// ======================
// API Routes
// ======================

// Register API
app.post("/register", async (req, res) => {
    try {
        const { name, username, email, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.json({
                success: false,
                message: "Email already exists!"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            name,
            username,
            email,
            password: hashedPassword
        });

        await newUser.save();

        res.json({
            success: true,
            message: "User registered successfully 🎉"
        });

    } catch (error) {
        console.error("Register Error:", error);
        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
});

// Login API
app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.json({
                success: false,
                message: "User not found!"
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.json({
                success: false,
                message: "Incorrect password!"
            });
        }

        res.json({
            success: true,
            message: "Login Successful 🎉",
            user: {
                name: user.name,
                username: user.username,
                email: user.email
            }
        });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({
            success: false,
            message: "Server Error"
        });
    }
});

// Get Users
app.get("/users", async (req, res) => {
    try {
        const users = await User.find({}, "-password");
        res.json(users);
    } catch (error) {
        console.error("Fetch Users Error:", error);
        res.status(500).json({
            message: "Server Error"
        });
    }
});

// Get All Messages
app.get("/messages", async (req, res) => {
    try {
        const messages = await Message.find().sort({ createdAt: 1 });
        res.json(messages);
    } catch (error) {
        console.error("Fetch Messages Error:", error);
        res.status(500).json({
            message: "Server Error"
        });
    }
});

// Get Conversation Between Two Users
app.get("/messages/:sender/:receiver", async (req, res) => {
    try {
        const { sender, receiver } = req.params;

        const messages = await Message.find({
            $or: [
                { sender: sender, receiver: receiver },
                { sender: receiver, receiver: sender }
            ]
        }).sort({ createdAt: 1 });

        res.json(messages);

    } catch (error) {
        console.error("Fetch Conversation Error:", error);
        res.status(500).json({
            message: "Server Error"
        });
    }
});

// Start Server
const PORT = process.env.PORT || 3000;

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});