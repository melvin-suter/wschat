import dotenv from 'dotenv';
import * as express from "express";
import * as http from "http";
import * as socketio from "socket.io";
import * as crypto from 'crypto';
import {Sender} from './sender';
import { Lib } from './lib';

dotenv.config();
const port = process.env.PORT ? process.env.PORT : 8001;
const app: express.Express = express.default();

/***********************
 *     Static Files
 ***********************/

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



/***********************
 *     Functions
 ***********************/



function convertRooms(socketRooms:any) {
  let rooms:string[] = [];
  for (let room of socketRooms) {
    rooms.push(room.substring(5));
  }
  return rooms.slice(2);
}



/***********************
 *     Initialize
 ***********************/


let users = new Map();
const server = http.createServer(app);
const io = new socketio.Server(server);


/***********************
 *     Socket Events
 ***********************/


io.on('connection', (socket) => {

  // Start Helper Classes
  let sender = new Sender(io,socket);
  let lib = new Lib(io,socket);


  // Username List
  const username:string = socket.handshake.query.username ? socket.handshake.query.username as string : 'no one';
  socket.join("user-" + username);
  users.set(socket.id, username);
 

  // Default Joins
  socket.join("room-Global");


  // Send Init Data
  lib.updateRooms();
  socket.emit('userid',{userid: socket.id});

  // Send local greeting
  sender.directMessage('Hello ' + username);

  // Announcements
  sender.roomAnnouncement('User ' + username + ' has joined');

  socket.on('disconnect', () => {
    users.delete(socket.id);
    sender.roomAnnouncement('User ' + username + ' left');
  });



  ///////////////
  // Room management
  ///////////////

  socket.on('room-list', () => {
    lib.updateRooms();
  });

  socket.on('join-room', (data) => {
    lib.joinRoom(data.room, username);
   });

  

  ///////////////
  // Messaging
  ///////////////

  socket.on('message', (data) => {
    if(data.message.trim() == '/rooms') {

      let text = "Current Rooms:\n";

      for(let [room] of io.sockets.adapter.rooms) {
        if(room.substring(0,4) == "room"){
          text += "- " +room.substring(5) + "\n";
        }
      }
        
      sender.directMessage(text);

      return;
    }

    if(data.message.trim() == '/users') {

      let text = "Current Users:\n";

      for(let user of users.values()) {
        text += "- " +user + "\n";
      }
        
        sender.directMessage(text);

      return;
    }

    if(data.message.trim().toLowerCase().split(' ')[0] == '/help') {

      let text = "Available Commands:\n";
      text += "- /help - This\n";
      text += "- /users - Shows all logged in users\n";
      text += "- /rooms - Shows all active rooms\n";
      text += "- /join [room-name] - Join or create a room\n";
      text += "- /send [username] [message] - Send a direct message to a user\n";
    
      sender.directMessage(text);
      
      return;
    }

    if(data.message.trim().toLowerCase().split(' ')[0] == '/send') {

      try{

        let receiverUsername = data.message.trim().toLowerCase().split(' ')[1];
        let text = data.message.trim().toLowerCase().split(' ').slice(2).join(' ');
        
        sender.directMessage(text, username, receiverUsername);

      }catch{}
      
      return;
    }
    if(data.message.trim().toLowerCase().split(' ')[0] == '/join') {

      try{
        let roomName = data.message.trim().toLowerCase().split(' ').slice(1).join(' ');
        lib.joinRoom(roomName, username);
      }catch{}
      
      return;
    }

    sender.sendRoom(data.message,data.room,username);
  })

});


server.listen(port, () => {
  console.log(`Running at localhost:${port}`);
});