import * as socketio from "socket.io";

export class Lib {

    io:socketio.Server;
    socket:socketio.Socket;
  
    constructor(io:socketio.Server, socket:socketio.Socket){
      this.io = io;
      this.socket = socket;
    }






    convertRooms(socketRooms:any) {
        let rooms:string[] = [];
        for (let room of socketRooms) {
        rooms.push(room.substring(5));
        }
        return rooms.slice(2);
    }
  

  
    updateRooms() {
        this.socket.emit('room-list',{rooms: this.convertRooms(this.socket.rooms)});
    }

    joinRoom(room:string, username:string) {
        this.socket.join("room-" + room);
        
        this.updateRooms();
        
        this.socket.to(room).emit('message',{
          message: 'User ' + username + ' has joined the room '+ room,
          scope: 'server',
          room: room,
          userid: 0,
          username: "Server"
        }); 
    }

}