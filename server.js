import {Game} from './game.js';

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
//const { start } = require('repl');

// --- Configuration ---
const app = express();
app.use(express.static("public"));

const server = http.createServer(app);
const PORT = 3000;
const ROOM_SIZE = 4; 

const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});
let activeRooms = {};      // Stockage des rooms actives
let roomCounter = 0;
let playersLoaded = {};


io.on('connection', (socket) => {
    console.log("Quelqu'un s'est connecté : "+ socket.id);

    const safeRooms = {};

    for (const roomID in activeRooms) {
        const room = activeRooms[roomID];

        safeRooms[roomID] = {
            id: room.id,
            gameState: {
                status: room.gameState.status,
                playersCount: room.players.usernames.length,
            }
        };
    }

    socket.emit("roomsDisplay", safeRooms);
    
    socket.on('createRoom', (username) => {
            
            let roomID = createRoom(socket, username);
            socket.roomID = roomID;
            socket.emit('roomInfo', sanitizeRoom(activeRooms[roomID]));
    });
 

    socket.on('join', (data) => {
    const roomID = data[1];
    const username = data[2];

    const room = activeRooms[roomID];
    if (!room) return;

    if (room.players.ids.length >= ROOM_SIZE) return;

    if (room.gameState.status !== 'waiting_for_load') return;

    if (room.players.usernames.includes(username)) return;

    // 🔥 Toujours socket.id, JAMAIS data[0]
    room.players.ids.push(socket.id);
    room.players.usernames.push(username);

    socket.roomID = roomID;
    socket.join(roomID);

    io.to(roomID).emit('roomInfo', sanitizeRoom(room));
    });

    socket.on("disconnect", () => {
        const roomID = socket.roomID;
        if (!roomID || !activeRooms[roomID]) return;
        if (!activeRooms[roomID] || !activeRooms[roomID].players.ids.includes(socket.id)) {
            return; // ignorer l'action
        }

        const room = activeRooms[roomID];


        const index = room.players.ids.indexOf(socket.id);
        if (index !== -1) {
            room.players.ids.splice(index, 1);
            room.players.usernames.splice(index, 1);
        }


        io.to(roomID).emit('roomUpdate', sanitizeRoom(activeRooms[roomID]));
        if (room.players.ids.length === 0) {
            delete activeRooms[roomID];
            console.log("Room supprimée :", roomID);
        }
    });

    socket.on('clientLoaded', (roomData) =>{

        const room = activeRooms[roomData.roomID];
        if (!room) return; 

        
        playersLoaded[socket.id] = true;

        
        if (room.players.ids.every(id => playersLoaded[id])){
            console.log(`[${roomID}`);
        }
        activeRooms[roomID].gameState.status = 'playing';

        io.to(roomID).emit('start', { message: 'GO!' });
    });

    socket.on('startClick', (roomID)=>{
        activeRooms[roomID].gameState.status = 'started';
        console.log(activeRooms[roomID] + "a lancé la partie");
        console.log(activeRooms[roomID].gameState.status);

        activeRooms[roomID].game = new Game(io, activeRooms[roomID], activeRooms[roomID].players.usernames);
        activeRooms[roomID].game.init();
        io.to(roomID).emit('start', roomID);
    });


    socket.on('actionClick', (roomID) =>{
        safeAction(socket, roomID, (game) => {
            activeRooms[roomID].game.playTurn();
            io.to(roomID).emit("data", game.getData());
        });   
    });

    socket.on('popUpClick', (roomID) =>{
        safeAction(socket, roomID, (game) => {
            activeRooms[roomID].game.popUpClick();
            io.to(roomID).emit("data", game.getData());
        });  
            
        });
        
    socket.on('endTurnClick', (roomID) =>{
        safeAction(socket, roomID, (game) => {
            activeRooms[roomID].game.endTurn();
            io.to(roomID).emit("data", game.getData());
        });  
            
        });
    
    socket.on('freeClick', (roomID) =>{
        safeAction(socket, roomID, (game) => {
            activeRooms[roomID].game.free();
            io.to(roomID).emit("data", game.getData());
        });
    });
    
    socket.on('sendEmote', (data) => {
        io.to(data.roomID).emit('displayEmote', {
            emote: data.emote,
            playerId: data.playerId
        });
    });
});


function createRoom(socket, username) {
    const newRoomID = "ROOM_"+roomCounter;
    const matchedPlayers = [socket];
    const playerIDs = matchedPlayers.map(p => p.id);

    activeRooms[newRoomID] = {
        id: newRoomID,
        players: {  
                    ids: playerIDs,
                    usernames: new Array(username)
                },
        owner: socket.id,
        gameState: { status: 'waiting_for_load' },
        game: null
    };
    roomCounter++;


    matchedPlayers.forEach(player => {

        player.join(newRoomID); 
        
        socket.emit('matchFound', { 
            roomID: newRoomID, 
            players: playerIDs 
        });
    });

    io.to(newRoomID).emit('roomUpdate', activeRooms[newRoomID]);

    return newRoomID;
}


function sanitizeRoom(room) {
    return {
        id: room.id,
        players: room.players,
        owner: room.owner,
        gameState: room.gameState
    };
}


function safeAction(socket, roomID, callback) {
    if (!roomID || !activeRooms[roomID]) return;
    const room = activeRooms[roomID];

    if (!room.players.ids.includes(socket.id)) return;
    if (!room.game) return;

    callback(room.game);
}



server.listen(PORT,() =>{
    console.log(`Server launched on port : ${PORT}`);
});