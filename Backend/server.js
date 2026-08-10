require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
const User = require("./models/User");
const Message = require("./models/Message");

const app = express();
const server = http.createServer(app);

// Render provides PORT automatically
const PORT = process.env.PORT || 3000;

// ==============================
// MongoDB
// ==============================

connectDB();

// ==============================
// Middleware
// ==============================

app.use(cors());
app.use(express.json());

// ==============================
// Frontend
// ==============================

const frontendPath = path.join(__dirname, "Frontend");

app.use(express.static(frontendPath));

app.get("/", (req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
});

// ==============================
// Socket.IO
// ==============================

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

io.on("connection", (socket) => {

    console.log("🟢 User connected:", socket.id);

    // ==========================
    // Join user room
    // ==========================

    socket.on("join", (username) => {

        if (!username) return;

        socket.join(username);

        console.log(`👤 ${username} joined room`);

    });

    // ==========================
    // Send message
    // ==========================

    socket.on("send-message", async (data) => {

        try {

            console.log("💬 Message received:", data);

            if (
                !data ||
                !data.sender ||
                !data.receiver ||
                !data.message
            ) {
                return;
            }

            // Save message to MongoDB

            const newMessage = new Message({
                sender: data.sender,
                receiver: data.receiver,
                message: data.message
            });

            await newMessage.save();

            console.log("✅ Message saved");

            // Send to receiver

            io.to(data.receiver).emit(
                "receive-message",
                data
            );

            // Send back to sender

            io.to(data.sender).emit(
                "receive-message",
                data
            );

        } catch (error) {

            console.error(
                "❌ Socket Message Error:",
                error
            );

        }

    });

    // ==========================
    // Disconnect
    // ==========================

    socket.on("disconnect", () => {

        console.log(
            "🔴 User disconnected:",
            socket.id
        );

    });

});

// ==============================
// REGISTER
// ==============================

app.post("/register", async (req, res) => {

    try {

        const {
            name,
            username,
            email,
            password
        } = req.body;

        if (
            !name ||
            !username ||
            !email ||
            !password
        ) {

            return res.status(400).json({
                success: false,
                message: "All fields are required"
            });

        }

        // Check email

        const existingEmail = await User.findOne({
            email
        });

        if (existingEmail) {

            return res.status(400).json({
                success: false,
                message: "Email already exists!"
            });

        }

        // Check username

        const existingUsername = await User.findOne({
            username
        });

        if (existingUsername) {

            return res.status(400).json({
                success: false,
                message: "Username already exists!"
            });

        }

        // Hash password

        const hashedPassword =
            await bcrypt.hash(password, 10);

        // Create user

        const newUser = new User({

            name,
            username,
            email,
            password: hashedPassword

        });

        await newUser.save();

        res.status(201).json({

            success: true,

            message:
                "User registered successfully 🎉"

        });

    } catch (error) {

        console.error(
            "❌ Registration Error:",
            error
        );

        res.status(500).json({

            success: false,

            message: "Server Error"

        });

    }

});

// ==============================
// LOGIN
// ==============================

app.post("/login", async (req, res) => {

    try {

        const {
            email,
            password
        } = req.body;

        const user = await User.findOne({
            email
        });

        if (!user) {

            return res.status(400).json({

                success: false,

                message: "User not found!"

            });

        }

        const isMatch =
            await bcrypt.compare(
                password,
                user.password
            );

        if (!isMatch) {

            return res.status(400).json({

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

        console.error(
            "❌ Login Error:",
            error
        );

        res.status(500).json({

            success: false,

            message: "Server Error"

        });

    }

});

// ==============================
// GET USERS
// ==============================

app.get("/users", async (req, res) => {

    try {

        const users = await User.find(
            {},
            "-password"
        );

        res.json(users);

    } catch (error) {

        console.error(
            "❌ Get Users Error:",
            error
        );

        res.status(500).json({

            message: "Server Error"

        });

    }

});

// ==============================
// GET ALL MESSAGES
// ==============================

app.get("/messages", async (req, res) => {

    try {

        const messages =
            await Message
                .find()
                .sort({ createdAt: 1 });

        res.json(messages);

    } catch (error) {

        console.error(
            "❌ Get Messages Error:",
            error
        );

        res.status(500).json({

            message: "Server Error"

        });

    }

});

// ==============================
// GET CONVERSATION
// ==============================

app.get(
    "/messages/:sender/:receiver",
    async (req, res) => {

        try {

            const {
                sender,
                receiver
            } = req.params;

            const messages =
                await Message.find({

                    $or: [

                        {
                            sender: sender,
                            receiver: receiver
                        },

                        {
                            sender: receiver,
                            receiver: sender
                        }

                    ]

                }).sort({
                    createdAt: 1
                });

            res.json(messages);

        } catch (error) {

            console.error(
                "❌ Conversation Error:",
                error
            );

            res.status(500).json({

                message: "Server Error"

            });

        }

    }
);

// ==============================
// Frontend fallback
// ==============================

app.use((req, res) => {

    res.sendFile(
        path.join(
            frontendPath,
            "index.html"
        )
    );

});

// ==============================
// START SERVER
// ==============================

server.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            `🚀 Server running on port ${PORT}`
        );

    }
);