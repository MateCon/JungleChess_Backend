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
    });

    socket.on('move', (user: User, roomId: number, moveData: [string, [number, number]]) => {
      console.log(rooms);
      console.log(user, roomId, moveData)
      for (let other of rooms.find(room => room.id === roomId.toString())!.users) {
        if (other.id === user.id) return;
        io.to(other.client).emit("move", moveData);
        console.log(other.client);
      }
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
