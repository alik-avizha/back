require('dotenv').config()
const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const cors = require("cors");

const corsOptions = {
    credentials: true,
    origin: (origin, callback) => {
        if (origin === "http://localhost:3000") {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
};


app.use(cors(corsOptions));

const socket = require("socket.io");
const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
    apiKey: process.env.API_KEY,
});
const openai = new OpenAIApi(configuration);

const io = new socket.Server(server, {
    path: "/api/socket.io",
    cookie: false,
    cors: { credentials: true, origin: true },
});

const chatHistory = [];
io.on("connection", (socket) => {
    socket.on("sendMessage", async (data) => {
        chatHistory.push({ role: "user", content: data.message });
        const chatCompletion = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: chatHistory,
        });

        socket.emit("receiveMessage", {
            message: `${chatCompletion.data.choices[0].message.content}`,
        });
        chatHistory.push(chatCompletion.data.choices[0].message);
    });

    socket.on("disconnect", () => {
        console.log("Disconnected");
    });
});

let port = process.env.PORT || 5000

server.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
});
