const mongoose = require("mongoose");

const connectDB = async () => {

    try {

        await mongoose.connect("mongodb://127.0.0.1:27017/chatbox");

        console.log("✅ MongoDB Connected Successfully");

    } catch (error) {

        console.log("❌ MongoDB Connection Failed");

        console.log(error);

        process.exit(1);

    }

};

module.exports = connectDB;