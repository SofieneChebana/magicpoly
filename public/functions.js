
function join(socket, roomID, username){
    data = [socket.id, roomID, username];
    socket.emit('join', data);
}


function updatePlayersList(players) {
    const ul = document.getElementById("lb");
    ul.innerHTML = ""; // on vide la liste avant de la remplir

    players.forEach(player => {
        const li = document.createElement("li");
        li.textContent = `${player.name} — Argent: ${player.money} €`;
        ul.appendChild(li);
    });
}

function drawBoard(size, caseSize, properties, owners, playerColors){
        var canvas = document.getElementById("board");
        var ctx = canvas.getContext("2d");
        const baseColors = ["red", "blue", "green", "purple", "orange", "teal"];
        // Dimensions du plateau
        var nbCases = size / caseSize; // nombre de cases par côté (11 ici)

        ctx.strokeStyle = "black";
        ctx.lineWidth = 2;
        ctx.font = "16px Arial"; // police pour le texte
        ctx.textAlign = "center"; 
        ctx.textBaseline = "middle";

        let index = 0;
        // Dessiner les cases autour du plateau


        //Haut
        for (let i = 0; i < nbCases; i++) {
            
            const owner = owners[index];
            const name = properties[index].name;
            
            ctx.fillStyle = "white";
            ctx.fillRect(i * caseSize, 0, caseSize, caseSize);
            if (owner !== undefined) {
                ctx.fillStyle = playerColors[owner];
                ctx.fillRect(i * caseSize, 0, caseSize, caseSize);
            }

            ctx.strokeStyle = "black";
            ctx.strokeRect(i * caseSize, 0, caseSize, caseSize);
            ctx.fillStyle = "black";
            if (name.length >= 10){ 
                ctx.font = "12px Arial";
            }
            ctx.fillText(name, i * caseSize + caseSize/2, caseSize/2);

            ctx.font = "bold 14px Arial";
            ctx.fillText(properties[index].price + "€", i * caseSize + caseSize/2, caseSize - 10);
            ctx.font = "16px Arial";

            index++;
        }

        // Droite
        for (let i = 1; i < nbCases; i++) {

            const owner = owners[index];
            const name = properties[index].name;
            
            ctx.fillStyle = "white";
            ctx.fillRect(size - caseSize, i * caseSize, caseSize, caseSize);
            if (owner !== undefined) {
                ctx.fillStyle = playerColors[owner];
                ctx.fillRect(size - caseSize, i * caseSize, caseSize, caseSize);
            }

            ctx.strokeStyle = "black";
            ctx.strokeRect(size - caseSize, i * caseSize, caseSize, caseSize);
            ctx.fillStyle = "black";
            if (name.length >= 10){ 
                ctx.font = "12px Arial";
            }
            ctx.fillText(name, size - caseSize/2, i * caseSize + caseSize/2);
            ctx.font = "bold 14px Arial";
            ctx.fillText(properties[index].price + "€", size - caseSize/2, i * caseSize + caseSize - 12);
            ctx.font = "16px Arial";

            index++;
        }

        //Bas
        for (let i = nbCases - 2; i >= 0; i--) {

            const owner = owners[index];
            const name = properties[index].name;
            
            ctx.fillStyle = "white";
            ctx.fillRect(i * caseSize, size - caseSize, caseSize, caseSize);
            if (owner !== undefined) {
                ctx.fillStyle = playerColors[owner];
                ctx.fillRect(i * caseSize, size - caseSize, caseSize, caseSize);

            }

            ctx.strokeStyle = "black";
            ctx.strokeRect(i * caseSize, size - caseSize, caseSize, caseSize);
            ctx.fillStyle = "black";
            if (name.length >= 10){ 
                ctx.font = "12px Arial";
            }
            ctx.fillText(name, i * caseSize + caseSize/2, size - caseSize/2);
            ctx.font = "bold 14px Arial";
            ctx.fillText(properties[index].price + "€", i * caseSize + caseSize/2, size - 10);
            ctx.font = "16px Arial";

            drawPrison(index, i, ctx, name, size, caseSize, properties);
            index++;
        }

        // Gauche
        for (let i = nbCases - 2; i > 0; i--) {

            const owner = owners[index];
            const name = properties[index].name;
            
            ctx.fillStyle = "white";
            ctx.fillRect(0, i * caseSize, caseSize, caseSize);
            if (owner !== undefined) {
                ctx.fillStyle = playerColors[owner];
                ctx.fillRect(0, i * caseSize, caseSize, caseSize);
                

            }
            
            ctx.strokeStyle = "black";
            ctx.strokeRect(0, i * caseSize, caseSize, caseSize);
            ctx.fillStyle = "black";
            if (name.length >= 10){ 
                ctx.font = "12px Arial";
            }
            ctx.fillText(name, caseSize/2, i * caseSize + caseSize/2);
            ctx.font = "bold 14px Arial";
            ctx.fillText(properties[index].price + "€", caseSize/2, i * caseSize + caseSize - 12);
            ctx.font = "16px Arial";
            index++;
        }

        

        
    }

function drawPrison(index, i, ctx, name, size, caseSize, properties){
    if (properties[index].name === "Aller en prison"){
        ctx.fillStyle = "black";
        ctx.fillRect(i * caseSize, size - caseSize, caseSize, caseSize);
        ctx.fillStyle = "white";
        ctx.fillText(name, i * caseSize + caseSize/2, size - caseSize/2);
        ctx.font = "bold 14px Arial";
        ctx.fillText(properties[index].price + "€", i * caseSize + caseSize/2, size - 10);
        ctx.font = "16px Arial";

            }
}
function getCellCenter(index, size, caseSize){
        let x, y;

        if (index >= 0 && index <= 9) {
            // Haut: (col = index, row = 0)
            x = index * caseSize + caseSize / 2;
            y = caseSize / 2;
        } else if (index >= 10 && index <= 18) {
            // Droite: (col = 9, row = index-9)
            x = size - caseSize / 2;
            y = (index - 9) * caseSize + caseSize / 2;
        } else if (index >= 19 && index <= 27) {
            // Bas: (col = 27-index, row = 9)
            x = (27 - index) * caseSize + caseSize / 2;
            y = size - caseSize / 2;
        } else if (index >= 28 && index <= 35) {
            // Gauche: (col = 0, row = 36-index)
            x = caseSize / 2;
            y = (36 - index) * caseSize + caseSize / 2;
        } else {
            // Défaut si hors bornes
            x = caseSize / 2;
            y = caseSize / 2;
        }

        return { x, y };
    }


async function drawTokens(size, caseSize, players, properties, owners, playerColors){
        drawBoard(size, caseSize, properties, owners, playerColors); // Voir méthode ci-dessous
        const sleep = ms => new Promise(r => setTimeout(r, ms));
        await sleep(700);
        var canvas = document.getElementById("tokens");
        var ctx = canvas.getContext("2d");

        // Effacer les anciens pions sans effacer le plateau:
        // Option simple: effacer tout et redessiner le plateau + pions.
        // Option rapide: effacer seulement des petits rectangles autour des positions
        // Ici, pour la clarté, on refait tout (plateau + pions) — sinon, garde un second canvas.

        // Redessine le plateau (tu peux extraire la logique de dessin dans une méthode drawBoard())
        ctx.clearRect(0, 0, size, size);
        // Puis dessine les pions
        const radius = 14;
        const offsets = [
            {dx: -18, dy: -18},
            {dx: 18,  dy: -18},
            {dx: -18, dy: 18},
            {dx: 18,  dy: 18},
            {dx: 0,   dy: -28},
            {dx: 0,   dy: 28}
        ];

        players.forEach((player, i) => {
            const { x, y } = getCellCenter(player.case, size, caseSize);
            const { dx, dy } = offsets[i % offsets.length];

            ctx.beginPath();
            ctx.arc(x + dx, y + dy, radius, 0, Math.PI * 2);
            ctx.fillStyle = playerColors[i];
            if (player.mahmoud == true) ctx.fillStyle = "yellow";
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = "black";
            ctx.stroke();

            // Initiales du joueur pour lisibilité
            ctx.fillStyle = "white";
            ctx.font = "bold 12px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            
            const initials = player.name.slice(0, 2).toUpperCase();
            ctx.fillText(initials, x + dx, y + dy);
        });
    }


async function showEmoteOnScreen(emoji, player) {
  const container = document.getElementById('emote-display-container');
  const div = document.createElement('div');

  
  const canvas = document.getElementById("tokens");
  const rect = canvas.getBoundingClientRect();

  // Positions exprimées en pourcentage du canvas
  const POSITIONS = [
    [0.05, 0.10],   // joueur 0
    [0.80, 0.10],   // joueur 1
    [0.05, 0.80],   // joueur 2
    [0.80, 0.80]    // joueur 3
  ]; 
  const COLORS = [
    "red",
    "blue",
    "green",
    "purple"
  ]
  const [x, y] = POSITIONS[player];

  const screenX = rect.left + rect.width * x;
  const screenY = rect.top + rect.height * y;

  
  
  div.innerHTML = emoji;
  div.className = 'floating-emote';
  container.appendChild(div);

  // Nettoyage du DOM après l'animation
  setTimeout(() => {
    img.remove();
  }, 2000);
}


function addLog(message) {
    const log = document.getElementById("log");
    const p = document.createElement("p");
    p.innerHTML = message;
    log.appendChild(p);

    // scroll automatique vers le bas
    log.scrollTop = log.scrollHeight;
}

function displayChance(chanceText){
    document.getElementById("popupOverlay").style.display = "block";
    document.getElementById("chanceText").innerHTML = chanceText;
}

function playMusic(audio){
    const playlist = ["assets/musics/jazz-for-parmesan.mp3", "assets/musics/midnight-sidewalk.mp3" ];

    audio.src = playlist[Math.floor(Math.random() * 2) % playlist.length];

    audio.addEventListener('ended', ()=>{
        audio.src = playlist[Math.floor(Math.random() * 2) % playlist.length];
        audio.play();
    });

    audio.play();
}