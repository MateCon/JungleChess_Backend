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

interface Room {
  id: string
  users: User[]
}

const rooms: Room[] = [];

let queue: WaitQueue = {
  ["10M"]: []
};

io.on('connection', (socket: Socket) => {
    socket.on('chat message', (msg: String) => {
      console.log('message: ' + msg);
    });

    socket.on('join_queue', (user: User, mode: string) => {
      user.client = socket.id;
      queue[mode].push(user);
    });

    socket.on('move', (user: User, roomId: number, moveData: [string, [number, number]]) => {
      console.log(`${user.name} moved in room ${roomId}`)
      const room = rooms.find(room => room.id === roomId.toString());
      if (!room) return;
      const users = room.users.filter(other => other.id !== user.id);
      console.log(users, users[0].client)
      // io.to(users[0].client).emit("move", moveData);
      socket.to(users[0].client!).emit("move", moveData);
    });
});

const match = (player1: User, player2: User, io: any, rooms: Room[]) => {
  const newRoom: Room = {
    id: Math.floor(Math.random() * 100).toString(),
    users: [player1, player2]
  }
  io.to(player1.client!).emit("joined_room", newRoom);
  io.to(player2.client!).emit("joined_room", newRoom);
  rooms.push(newRoom);
}

const updateQueue = (queue: WaitQueue, io: any, rooms: Room[]) => {
  for (let mode of Object.values(queue)) {
    while (mode.length > 1) {
      match(mode[0], mode[1], io, rooms);
      mode.splice(0, 2);
    }
  }
}

// update wait queue every two seconds
setInterval(() => {
  updateQueue(queue, io, rooms);
}, 1000);

export default server;
