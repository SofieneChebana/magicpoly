import {Game} from './game.js';

import express from 'express';
import http from 'http';
import { Server } from 'socket.io';

// --- Configuration ---
const app = express();
app.use(express.static("../public"));

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

    socket.emit("roomsDisplay", getSafeRooms());
    
    socket.on('createRoom', (username) => {
            
            let roomID = createRoom(socket, username);
            socket.roomID = roomID;
            socket.emit('roomInfo', sanitizeRoom(activeRooms[roomID]));
            io.emit("roomsDisplay", getSafeRooms());
            
    });
 

    socket.on('join', (data) => {
        const roomID = data[1];
        const username = data[2];

        const room = activeRooms[roomID];
        if (!room) return;

        if (room.players.ids.length >= ROOM_SIZE) return;

        if (room.gameState.status !== 'waiting_for_load') return;

        if (room.players.usernames.includes(username)) return;

        room.players.ids.push(socket.id);
        room.players.usernames.push(username);

        socket.roomID = roomID;
        socket.join(roomID);

        io.to(roomID).emit('roomInfo', sanitizeRoom(room));
    });

    socket.on("disconnect", () => {
        console.log("Joueur déconnecté :", socket.id);

        const roomID = socket.roomID;
        if (!roomID || !activeRooms[roomID]) return;
        if (!activeRooms[roomID] || !activeRooms[roomID].players.ids.includes(socket.id)) {
            return; // ignorer l'action
        }

        const room = activeRooms[roomID];

        // Retirer le joueur de la room
        const index = room.players.ids.indexOf(socket.id);
        if (index !== -1) {
            room.players.ids.splice(index, 1);
            room.players.usernames.splice(index, 1);
        }

        // Notifier les autres joueurs
        io.to(roomID).emit('roomUpdate', sanitizeRoom(activeRooms[roomID]));

        // Si la room est vide → supprimer
        if (room.players.ids.length === 0) {
            delete activeRooms[roomID];
            console.log("Room supprimée :", roomID);
            roomCounter--;
            io.emit("roomsDisplay", getSafeRooms());
        }
    });

    socket.on('startClick', (data)=>{
        let roomID  = data[0];
        let map     = data[1];
        let ai      = data[2];
        activeRooms[roomID].gameState.status = 'started';

        activeRooms[roomID].game = new Game(io, activeRooms[roomID], activeRooms[roomID].players.usernames, map, ai);
        
        activeRooms[roomID].game.init();
        io.to(roomID).emit('start', data);
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
        const playersId = activeRooms[data.roomID].game.getPlayersId();

        var player_number = null;
        for (let i=0; i < playersId.length; i++){
            if (data.playerId === playersId[i]){
                player_number = i;
            }
        }
            

        io.to(data.roomID).emit('displayEmote', {
            emote: data.emote,
            player : player_number
        });
    });
});


function createRoom(socket, username) {
    const newRoomID = "ROOM_"+roomCounter;
    const matchedPlayers = [socket];
    const playerIDs = matchedPlayers.map(p => p.id);

    // 1. Enregistrement de la Room
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
    console.log(`Room créé: ${newRoomID}. Il y a ${roomCounter} rooms`);

    // 2. Assignation et Notification
    matchedPlayers.forEach(player => {
        // Le socket rejoint le canal de diffusion de la Room
        player.join(newRoomID); 
        
        // Envoi au client des informations de connexion (RoomID et joueurs)
        socket.emit('matchFound', { 
            roomID: newRoomID, 
            players: playerIDs 
        });
    });

    // 3. Notifier la Room entière que les joueurs sont prêts à charger
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

function getSafeRooms(){
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
    return safeRooms;
}
server.listen(PORT,() =>{
    console.log(`Serveur démarré sur le port : ${PORT}`);
});