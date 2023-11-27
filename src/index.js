"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const express = __importStar(require("express"));
const http = __importStar(require("http"));
const socketio = __importStar(require("socket.io"));
dotenv_1.default.config();
const port = process.env.PORT ? process.env.PORT : 8001;
const app = express.default();
const sharedFiles = [
    'css/bootstrap.min.css',
    'js/bootstrap.min.js',
    'js/app.js',
    'js/socket.io.min.js'
];
sharedFiles.forEach((item) => {
    app.get('/' + item, (req, res) => {
        res.sendFile(__dirname + '/frontend/' + item);
    });
});
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/frontend/index.html');
});
function convertRooms(socketRooms) {
    let rooms = [];
    for (let room of socketRooms) {
        rooms.push(room.substring(5));
    }
    return rooms.slice(2);
}
let users = new Map();
const server = http.createServer(app);
const io = new socketio.Server(server);
io.on('connection', (socket) => {
    /*onst userId = crypto.randomUUID();
    socket.join(userId);*/
    const username = socket.handshake.query.username ? socket.handshake.query.username : 'no one';
    socket.join("user-" + username);
    users.set(socket.id, username);
    socket.join("room-Global");
    // Send Init Data
    socket.emit('room-list', { rooms: convertRooms(socket.rooms) });
    socket.emit('userid', { userid: socket.id });
    // Send local greeting
    socket.emit('message', {
        message: 'Hello ' + username,
        scope: 'user',
        room: 'Direct Message',
        userid: 0,
        username: "Server"
    });
    // Announcements
    io.to('Global').emit('message', {
        message: 'User ' + username + ' has joined',
        scope: 'server',
        room: 'Server',
        userid: 0,
        username: "Server"
    });
    socket.on('disconnect', () => {
        users.delete(socket.id);
        io.to('Global').emit('message', {
            message: 'User ' + username + ' left',
            scope: 'server',
            room: 'Server',
            userid: 0,
            username: "Server"
        });
    });
    // Room management
    socket.on('room-list', () => {
        socket.emit('room-list', { rooms: convertRooms(socket.rooms) });
    });
    socket.on('join-room', (data) => {
        socket.join("room-" + data.room);
        socket.emit('room-list', { rooms: convertRooms(socket.rooms) });
        socket.to(data.room).emit('message', {
            message: 'User ' + username + ' has joined the room ' + data.room,
            scope: 'server',
            room: data.room,
            userid: 0,
            username: "Server"
        });
    });
    // Handle Messaging
    socket.on('message', (data) => {
        if (data.message.trim() == '/rooms') {
            let text = "Current Rooms:\n";
            for (let [room] of io.sockets.adapter.rooms) {
                if (room.substring(0, 4) == "room") {
                    text += "- " + room.substring(5) + "\n";
                }
            }
            socket.emit('message', {
                message: text,
                scope: 'user',
                room: 'Direct Message',
                userid: socket.id,
                username: "Server"
            });
            return;
        }
        if (data.message.trim() == '/users') {
            let text = "Current Users:\n";
            for (let user of users.values()) {
                text += "- " + user + "\n";
            }
            socket.emit('message', {
                message: text,
                scope: 'user',
                room: 'Direct Message',
                userid: socket.id,
                username: "Server"
            });
            return;
        }
        if (data.message.trim().toLowerCase().split(' ')[0] == '/send') {
            try {
                let receiverUsername = data.message.trim().toLowerCase().split(' ')[1];
                let text = data.message.trim().toLowerCase().split(' ').slice(2).join(' ');
                io.to(receiverUsername).emit('message', {
                    message: text,
                    scope: 'user',
                    room: 'Direct Message',
                    userid: socket.id,
                    username: username
                });
            }
            catch { }
            return;
        }
        io.to(data.room).emit('message', {
            message: data.message,
            scope: 'room',
            room: data.room,
            userid: socket.id,
            username: username
        });
    });
});
server.listen(port, () => {
    console.log(`Running at localhost:${port}`);
});
