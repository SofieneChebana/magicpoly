//const socket = io('');
const socket = io('localhost:3000');



var username = null;
var myRoomID = null;
let hasPlayedThisTurn = false;
var dice1Value = 1;
var dice2Value = 1;

socket.on('roomsDisplay', (activeRooms) =>{
    let li;
    let roomList = document.getElementById("roomList");
    for (const roomID in activeRooms){
        li = document.createElement('li');
        li.innerHTML = "Id : "+activeRooms[roomID].id;
        li.innerHTML+= "<br>";
        li.innerHTML+= "\n Status : "+ activeRooms[roomID].gameState.status;
        li.addEventListener('click', () =>{
            username = document.getElementById('usernameInput').value;
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
    document.getElementById("selectionScreen").style.display = "none";
    let roomScreen = document.getElementById("roomScreen");
    roomScreen.style.display = "block";
    let playerList = document.getElementById('playerList');
    playerList.innerHTML = "";

    let li;
    for (const player of room.players.usernames){
        li = document.createElement('li');
        li.textContent = player;
        playerList.appendChild(li);
    }

    
    if (socket.id === room.owner){
       let start = document.getElementById("start");
       console.log(start);
       start.style.display = "block";
        start.addEventListener('click', ()=>{
            socket.emit("startClick", room.id);
        });
    }

    let audio = new Audio("assets/sounds/join.mp3");
    audio.play();
});

socket.on('start', async (roomID) =>{
    myRoomID = roomID;
    document.getElementById("roomScreen").style.display = "none";
    document.getElementById("gameScreen").style.display = "block";
    let audio = new Audio("assets/sounds/start.mp3");
    audio.play();
    //const sleep = ms => new Promise(r => setTimeout(r, ms));
    //await sleep(700);
    //playMusic(audio);
});

socket.off("data");
socket.on('data', (data) =>{
    if (data.status != null){
        addLog(data.status);
    }
    drawTokens(data.size, data.caseSize, data.players, data.properties, data.owners, data.playerColors);
    updatePlayersList(data.players);
    
    if (data.currentPlayer.replay === true && socket.id === data.currentPlayer.id) {
        hasPlayedThisTurn = false;
    }

    if (socket.id == data.currentPlayer.id){
        if(hasPlayedThisTurn == false){
            document.getElementById("action").style.display = "block";
            if(data.currentPlayer.jailed == true){
                document.getElementById("free").textContent = "Payer "+ 50*data.currentPlayer.nbJailed+ "€ pour sortir ?";
                document.getElementById("free").style.display = "block";
            }
        }
    
        else{
            document.getElementById("action").style.display = "none";
            document.getElementById("free").style.display = "none";
        }
    }
    else{
        document.getElementById("action").style.display = "none";
        hasPlayedThisTurn = false;
    }

    if(data.dices !== null){
        dice1Value = data.dices[0];
        dice2Value = data.dices[1];
        startDiceRoll();
    }
});

socket.on('displayEmote', (data) => {
  showEmoteOnScreen(data.emote, data.playerId);
});


function sendEmote(emoji) {
  socket.emit('sendEmote', {
    emote: emoji,
    playerId: socket.id,
    roomID: myRoomID
  });
}


const canvas = document.getElementById("diceCanvas");
const ctx = canvas.getContext("2d");
const rollBtn = document.getElementById("action");


let isRolling = false;
let startTime = 0;
const rollDuration = 700;

function drawDice(value, posX=0, posY=0, shakeX = 0, shakeY = 0) {
    ctx.clearRect(posX - 20, posY - 20, 400, 400);


  const size = 120;
  const x = posX + shakeX;
  const y = posY + shakeY;
  

  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#000000";
  ctx.lineWidth = 4;
  ctx.fillRect(x, y, size, size);
  ctx.strokeRect(x, y, size, size);

  // points
  ctx.fillStyle = "#000";
  const r = 8;
  const cx = x + size / 2;
  const cy = y + size / 2;
  const dx = size / 4;
  const dy = size / 4;

  const dot = (px, py) => {
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();
  };

  if ([1, 3, 5].includes(value)) dot(cx, cy);
  if (value >= 2) { dot(x + dx, y + dy); dot(x + 3 * dx, y + 3 * dy); }
  if (value >= 4) { dot(x + 3 * dx, y + dy); dot(x + dx, y + 3 * dy); }
  if (value === 6) { dot(x + dx, cy); dot(x + 3 * dx, cy); }
}


function animateRoll(timestamp) {
  if (!startTime) startTime = timestamp;
  const elapsed = timestamp - startTime;

  if (elapsed < rollDuration) {
    const shakeX = (Math.random() - 0.5) * 15;
    const shakeY = (Math.random() - 0.5) * 15;

    drawDice(dice1Value, 100, 70, shakeX, shakeY);
    drawDice(dice2Value, 305, 250, shakeX, shakeY);

    requestAnimationFrame(animateRoll);

  } else {
    drawDice(dice1Value, 100, 70);
    drawDice(dice2Value, 305, 250);

    isRolling = false;
    startTime = 0;
  }
}

function startDiceRoll() {
    isRolling = true;
    requestAnimationFrame(animateRoll);
}

drawDice(dice1Value, 100, 70);
drawDice(dice1Value, 350, 250);


// Events:

document.getElementById('createRoom').addEventListener('click', () => {
    
    username = document.getElementById('usernameInput').value;
    if (!username || username.trim() ===" "){
        document.getElementById('error').textContent = "Entrer un pseudo."
    }
    else{
        socket.emit('createRoom', username);
        document.getElementById("selectionScreen").style.display = "none";
        document.getElementById("roomScreen").style.display = "block";
    }
});

document.getElementById('action').addEventListener('click', () => {
    if (!myRoomID) return;
    if(!isRolling){
        startDiceRoll();
        let audio = new Audio("assets/sounds/dice.mp3");
        audio.play();
    }
    hasPlayedThisTurn = true;
    document.getElementById('action').style.display = 'none';
    document.getElementById('popUp').style.display = 'inline-block';
    document.getElementById('endTurn').style.display = 'inline-block';
    
    socket.emit("actionClick", myRoomID);
});
document.getElementById('popUp').addEventListener('click', ()=>{
    if (!myRoomID) return;
    document.getElementById('popUp').style.display = 'none';
    document.getElementById('endTurn').style.display = 'none';
    socket.emit("popUpClick", myRoomID);
});
document.getElementById('endTurn').addEventListener('click', ()=>{
    if (!myRoomID) return;
    document.getElementById('popUp').style.display = 'none';
    document.getElementById('endTurn').style.display = 'none';
    socket.emit("endTurnClick", myRoomID);
});
document.getElementById('free').addEventListener('click', ()=>{
    if (!myRoomID) return;
    document.getElementById('free').style.display = 'none';
    socket.emit("freeClick", myRoomID);

});