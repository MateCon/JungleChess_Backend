import { Socket } from "socket.io";
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

interface User {
  client?: string;
  id: number | string;
  name: number;
  elo: number;
}

interface WaitQueue {
  [key: string]: User[];
}

const queue: WaitQueue = {
  ["10M"]: []
};

io.on('connection', (socket: Socket) => {
    console.log('a user connected');

    socket.on('chat message', (msg: String) => {
      console.log('message: ' + msg);
    });

    socket.on('disconnect', () => {
      console.log('user disconnected');
    });

    socket.on('join_queue', (user: User, mode: string) => {
      user.client = socket.id;
      queue[mode].push(user);
      console.log(queue);
    });
});

export default server;
