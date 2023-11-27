import dotenv from 'dotenv';
import * as express from "express";
import * as http from "http";
import * as socketio from "socket.io";
import * as crypto from 'crypto';

dotenv.config();
const port = process.env.PORT ? process.env.PORT : 8001;
const app: express.Express = express.default();



const sharedFiles = [
  'css/bootstrap.min.css',
  'js/bootstrap.min.js',
  'js/app.js',
  'js/socket.io.min.js'
]


sharedFiles.forEach((item:string) => {

  app.get('/' + item, (req:express.Request, res:express.Response) => {
    res.sendFile(__dirname + '/frontend/' + item);
  });

});

app.get('/', (req:express.Request, res:express.Response) => {
  res.sendFile(__dirname + '/frontend/index.html');
});



function convertRooms(socketRooms:any) {
  let rooms:string[] = [];
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

  const username:string = socket.handshake.query.username ? socket.handshake.query.username as string : 'no one';
  socket.join("user-" + username);
  users.set(socket.id, username);
 
  socket.join("room-Global");

  // Send Init Data
  socket.emit('room-list',{rooms: convertRooms(socket.rooms)});
  socket.emit('userid',{userid: socket.id});

  // Send local greeting
  socket.emit('message',{
    message: 'Hello ' + username,
    scope: 'user',
    room: 'Direct Message',
    userid: 0,
    username: "Server"
  });

  // Announcements
  io.to('Global').emit('message',{
    message: 'User ' + username + ' has joined',
    scope: 'server',
      room: 'Server',
      userid: 0,
    username: "Server"
  });

  socket.on('disconnect', () => {
    
    users.delete(socket.id);
    
    io.to('Global').emit('message',{
      message: 'User ' + username + ' left',
      scope: 'server',
      room: 'Server',
      userid: 0,
      username: "Server"
    });
  });

  // Room management
  socket.on('room-list', () => {
    socket.emit('room-list',{rooms: convertRooms(socket.rooms)});
  });
  socket.on('join-room', (data) => {
    socket.join("room-" + data.room);
    socket.emit('room-list',{rooms: convertRooms(socket.rooms)});
    socket.to(data.room).emit('message',{
      message: 'User ' + username + ' has joined the room '+ data.room,
      scope: 'server',
      room: data.room,
      userid: 0,
      username: "Server"
    });
  });

  // Handle Messaging
  socket.on('message', (data) => {
    if(data.message.trim() == '/rooms') {

      let text = "Current Rooms:\n";

      for(let [room] of io.sockets.adapter.rooms) {
        if(room.substring(0,4) == "room"){
          text += "- " +room.substring(5) + "\n";
        }
      }
        
      socket.emit('message',{
        message: text,
        scope: 'user',
        room: 'Direct Message',
        userid: socket.id,
        username: "Server"
      });
      
      return;
    }

    if(data.message.trim() == '/users') {

      let text = "Current Users:\n";

      for(let user of users.values()) {
        text += "- " +user + "\n";
      }
        
      socket.emit('message',{
        message: text,
        scope: 'user',
        room: 'Direct Message',
        userid: socket.id,
        username: "Server"
      });
      
      return;
    }

    if(data.message.trim().toLowerCase().split(' ')[0] == '/send') {

      try{

        let receiverUsername = data.message.trim().toLowerCase().split(' ')[1];
        let text = data.message.trim().toLowerCase().split(' ').slice(2).join(' ');
        
        io.to(receiverUsername).emit('message',{
          message: text,
          scope: 'user',
          room: 'Direct Message',
          userid: socket.id,
          username: username
        });
      }catch{}
      
      return;
    }

    io.to(data.room).emit('message',{
      message: data.message,
      scope: 'room',
      room: data.room,
      userid: socket.id,
      username: username
    });
  })

});


server.listen(port, () => {
  console.log(`Running at localhost:${port}`);
});