import { useEffect } from 'react'
import {Routes, Route, useNavigate } from "react-router-dom"
import Room from "./Room.jsx"
import Game from "./Game.jsx"
import './styles/App.css'
import './styles/input.css'
import './styles/modal.css'
import { socket, join } from './client.js'


function App() {

  console.log(socket.id)
  const navigate = useNavigate();

  

  useEffect(() => {
            socket.on('roomsDisplay', (activeRooms) =>{
                let li;
                let roomList = document.getElementById("roomList");
                roomList.innerHTML="";
                for (const roomID in activeRooms){
                    li = document.createElement('li');
                    li.innerHTML = "Id : "+activeRooms[roomID].id;
                    li.innerHTML+= "<br>";
                    li.innerHTML+= "\n Status : "+ activeRooms[roomID].gameState.status;
                    if (activeRooms[roomID].gameState.status === "waiting_for_load") li.backgroundColor = "green";
                    li.addEventListener('click', () =>{
                        let username = document.getElementById('usernameInput').value;
                        if (!username || username.trim() ===""){
                            document.getElementById('error').textContent = "Entrer un pseudo."
                        }
                        else{
                            join(socket, roomID, username);
                        }
                    });
                    roomList.appendChild(li);
                }
            });


            socket.on('roomInfo', (room) =>{
              navigate("/room", { state : room });
            });


            return () => {
            socket.off("roomDisplay"); //ok
            socket.off("roomInfo");//ok
            };

        }, []);
  return (
    <>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/room" element={<Room />} />
            <Route path="/game" element={<Game />} />
          </Routes>
          
    </>
  )
}

function Home() {
  return (
    <>
      <h1>Monopoly</h1>
      <p>Edit src/App.jsx and save to test HMR</p>
      <a href="/room">Aller a la room</a>

      <input id="usernameInput" type="text" placeholder="Votre pseudo" />
      <button id="createRoom" onClick={createRoom} >Creer une partie</button>
      <h2>Liste des parties :</h2>
      <span id="error"></span>
      <ul id="roomList">

      </ul>
    </>
  );
}

function createRoom(){
  let username = document.getElementById('usernameInput').value;
  if (!username || username.trim() ===""){
    document.getElementById('error').textContent = "Entrer un pseudo.";
  }
  else{
    socket.emit("createRoom", username);
  }
  
}

export default App
