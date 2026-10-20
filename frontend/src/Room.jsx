import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom"
import { socket } from './client.js'

function Room() {

  useEffect(() => {
  const audio = new Audio("../public/assets/sounds/join.mp3");
  audio.play();
}, []);
  const room = useLocation().state;
  const navigate = useNavigate();
  


  socket.on('start', async (data) =>{
    let roomID = data[0];
    let map    = data[1];
    let myRoomID = roomID;
    
    navigate("/game");
});



  socket.on('roomInfo', async (room) =>{
    console.log(room)
    let playerList = document.getElementById("playerList");
    let li;
    for (const username of room.players.usernames){
        console.log(username)
        li = document.createElement('li');
        li.textContent = username;
        playerList.appendChild(li);
    }
  });


  return (
  <>
    <h2>Page Room</h2>

      <p>Waiting Host to start the game.</p>
      <button onClick={() =>{socket.emit("startClick", [room.id, "classic", (document.getElementById("checkbox").checked ? true : false)])}}>Start</button>
      <div>
          <input type="checkbox" id="checkbox" name="checkbox" defaultChecked />
          <label htmlFor="ai">Ajouter IA</label>
      </div>

      <h3>Players List:</h3>
        <ul id="playerList">
          {room?.players?.usernames?.map((username, index) => (
          <li key={index}>{username}</li>
          ))}
        </ul>
  </>
  )
}





export default Room