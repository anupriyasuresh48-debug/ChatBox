require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const http = require("http");
const path = require("path");
const fs = require("fs");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
const User = require("./models/User");
const Message = require("./models/Message");

const app = express();
const server = http.createServer(app);

// ======================
// PORT
// ======================
const PORT = process.env.PORT || 3000;

// ======================
// CONNECT DATABASE
// ======================
connectDB();

// ======================
// MIDDLEWARE
// ======================
app.use(cors());
app.use(express.json());

// ======================
// FIND FRONTEND
// ======================

const possibleFrontendPaths = [
    path.join(__dirname, "../Frontend"),
    path.join(__dirname, "Frontend"),
    path.join(process.cwd(), "Frontend"),
    path.join(process.cwd(), "../Frontend")
];

const frontendPath = possibleFrontendPaths.find((folderPath) =>
    fs.existsSync(folderPath)
);

if (!frontendPath) {
    console.error("❌ Frontend folder not found!");
    console.error("Checked these locations:");

    possibleFrontendPaths.forEach((folderPath) => {
        console.error("   " + folderPath);
    });

    process.exit(1);
}

console.log("✅ Frontend found at:");
console.log(frontendPath);

// ======================
// SERVE FRONTEND
// ======================

app.use(express.static(frontendPath));

app.get("/", (req, res) => {

    const indexPath = path.join(frontendPath, "index.html");

    if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
    } else {
        res.status(404).send("❌ index.html not found");
    }

});

// ======================
// SOCKET.IO
// ======================

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

io.on("connection", (socket) => {

    console.log("🟢 User Connected:", socket.id);

    // ======================
    // JOIN USER ROOM
    // ======================

    socket.on("join", (username) => {

        if (!username) return;

        socket.join(username);

        console.log(`👤 ${username} joined room`);

    });

    // ======================
    // SEND MESSAGE
    // ======================

    socket.on("send-message", async (data) => {

        try {

            console.log("💬 Message received:", data);

            if (
                !data.sender ||
                !data.receiver ||
                !data.message
            ) {
                console.log("❌ Invalid message data");
                return;
            }

            const newMessage = new Message({

                sender: data.sender,

                receiver: data.receiver,

                message: data.message

            });

            await newMessage.save();

            // Send to receiver
            io.to(data.receiver).emit(
                "receive-message",
                data
            );

            // Send to sender
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

    // ======================
    // DISCONNECT
    // ======================

    socket.on("disconnect", () => {

        console.log(
            "🔴 User Disconnected:",
            socket.id
        );

    });

});

// ======================
// REGISTER
// ======================

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
                message: "All fields are required!"
            });

        }

        const existingUser = await User.findOne({
            email
        });

        if (existingUser) {

            return res.status(400).json({

                success: false,

                message: "Email already exists!"

            });

        }

        const existingUsername =
            await User.findOne({ username });

        if (existingUsername) {

            return res.status(400).json({

                success: false,

                message: "Username already exists!"

            });

        }

        const hashedPassword =
            await bcrypt.hash(password, 10);

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

// ======================
// LOGIN
// ======================

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

// ======================
// GET USERS
// ======================

app.get("/users", async (req, res) => {

    try {

        const users =
            await User.find({}, "-password");

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

// ======================
// GET ALL MESSAGES
// ======================

app.get("/messages", async (req, res) => {

    try {

        const messages =
            await Message.find()
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

// ======================
// GET CONVERSATION
// ======================

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
                "❌ Get Conversation Error:",
                error
            );

            res.status(500).json({

                message: "Server Error"

            });

        }

    }
);

// ======================
// FRONTEND FALLBACK
// ======================

app.use((req, res) => {

    const indexPath =
        path.join(frontendPath, "index.html");

    if (fs.existsSync(indexPath)) {

        res.sendFile(indexPath);

    } else {

        res.status(404).send(
            "Frontend index.html not found."
        );

    }

});

// ======================
// START SERVER
// ======================

server.listen(
    PORT,
    "0.0.0.0",
    () => {

        console.log(
            `🚀 Server running on port ${PORT}`
        );

    }
);