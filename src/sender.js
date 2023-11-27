"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Sender = void 0;
class Sender {
    constructor(io, socket) {
        this.io = io;
        this.socket = socket;
    }
    directMessage(message, from, to) {
        if (from && to) {
            let payload = {
                message: message,
                scope: 'user',
                room: 'Direct Message',
                username: from
            };
            this.io.to("user-" + to).emit('message', payload);
        }
        else {
            let payload = {
                message: message,
                scope: 'user',
                room: 'Direct Message',
                username: "Server"
            };
            this.socket.emit('message', payload);
        }
    }
    roomAnnouncement(message, room) {
        if (room) {
            let payload = {
                message: message,
                scope: 'server',
                room: room,
                username: "Server"
            };
            this.io.to('room-' + room).emit('message', payload);
        }
        else {
            let payload = {
                message: message,
                scope: 'server',
                room: 'Server',
                username: "Server"
            };
            this.io.to('room-Global').emit('message', payload);
        }
    }
    sendRoom(message, room, username) {
        this.io.to("room-" + room).emit('message', {
            message: message,
            scope: 'room',
            room: room,
            username: username
        });
    }
}
exports.Sender = Sender;
