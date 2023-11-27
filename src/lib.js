"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Lib = void 0;
class Lib {
    constructor(io, socket) {
        this.io = io;
        this.socket = socket;
    }
    convertRooms(socketRooms) {
        let rooms = [];
        for (let room of socketRooms) {
            rooms.push(room.substring(5));
        }
        return rooms.slice(2);
    }
    updateRooms() {
        this.socket.emit('room-list', { rooms: this.convertRooms(this.socket.rooms) });
    }
    joinRoom(room, username) {
        this.socket.join("room-" + room);
        this.updateRooms();
        this.socket.to(room).emit('message', {
            message: 'User ' + username + ' has joined the room ' + room,
            scope: 'server',
            room: room,
            userid: 0,
            username: "Server"
        });
    }
}
exports.Lib = Lib;
