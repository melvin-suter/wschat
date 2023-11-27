import * as socketio from "socket.io";

export class Sender {

  io:socketio.Server;
  socket:socketio.Socket;

  constructor(io:socketio.Server, socket:socketio.Socket){
    this.io = io;
    this.socket = socket;
  }



  directMessage(message:string, from?:string, to?:string){

    if(from && to){

      let payload = {
        message: message,
        scope: 'user',
        room: 'Direct Message',
        username: from
      };

      this.io.to("user-" + to).emit('message', payload);

    } else {
      let payload = {
        message: message,
        scope: 'user',
        room: 'Direct Message',
        username: "Server"
      };

      this.socket.emit('message', payload);
    }
  }


  roomAnnouncement(message:string, room?:string){
    if(room){
      let payload = {
        message: message,
        scope: 'server',
        room: room,
        username: "Server"
      };
  
      this.io.to('room-' + room).emit('message', payload); 
    } else {
      let payload = {
        message: message,
        scope: 'server',
        room: 'Server',
        username: "Server"
      };
  
      this.io.to('room-Global').emit('message', payload); 
    }
  }

  sendRoom(message:string, room:string, username:string) {
    this.io.to("room-" + room).emit('message',{
      message: message,
      scope: 'room',
      room: room,
      username: username
    });
  }


}