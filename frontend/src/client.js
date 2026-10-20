import { io } from "socket.io-client";

export const socket = io("http://localhost:3000", {
  autoConnect: true
});



export function join(socket, roomID, username){
    let data = [socket.id, roomID, username];
    socket.emit('join', data);
}