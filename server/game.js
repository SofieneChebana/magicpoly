import {Player} from './Player.js';
import {classic, chancesClassic} from './data/classic.js';



/**
 * Pour chaque tour, on envoie via socket.emit() l'etat du jeu
 * Le client se charge d'afficher la data récupérer via socket.on(data).
 */

var status="";
const ROOM_SIZE = 4;

export class Game{

    constructor(io,room, usernames,map="classic",ai){
        this.io = io;
        this.roomID = room.id;
        this.players = [];
        this.playersID = [];

        for (let i=0; i<usernames.length; i++){
            var player = new Player(usernames[i], room.players.ids[i]);
            player.type = 0;
            this.players.push(player);
            this.playersID.push(player.id);
        }

        if (ai === true){
            if (this.players.length < ROOM_SIZE){ //Adding AI players.
                var n = ROOM_SIZE - this.players.length;
                for(let i=0; i< n; i++){
                    var ai = new Player("AI " + (this.players.length + 1), this.playersID.length);
                    ai.type = 1;
                    this.players.push(ai);
                    this.playersID.push(ai.id)
                }
            }
        }

        this.currentPlayer = null;
        this.dices = [1,1];
        this.turn = 0;
        this.MAX_TURN = 100;

        this.caseSize = 110;
        this.size = this.caseSize * 10;
        if (map == "classic") {  this.properties = classic;  this.chances = chancesClassic;}
        
        

        this.owners = {};
        this.chanceText = null;
        this.keys = Object.keys(this.properties);
        this.values = Object.values(this.properties);
        
        // Couleurs de pions (autant que de joueurs)
        const baseColors = ["red", "blue", "green", "purple", "orange", "teal"];
        this.playerColors = this.players.map((_, i) => baseColors[i % baseColors.length]);
    }

    getPlayersId(){
        return this.playersID;
    }
    
    getData(){
        let data = {
            players:    this.players,
            currentPlayer:  this.currentPlayer,
            size:       this.size,
            caseSize:   this.caseSize,
            properties: this.properties,
            owners:     this.owners,
            playerColors:this.playerColors,
            dices:      this.dices,
            status:     status,
            chanceText: this.chanceText
            
        };

        return data;
    }

    init(){
        var max = Math.floor(3);
        this.currentPlayerIndex = Math.floor(Math.random() * max) % this.players.length;
        this.currentPlayer = this.players[this.currentPlayerIndex];

        status= this.currentPlayer.getName()+" commence ! <br> La partie se termine dans "+this.MAX_TURN + "tour.";

        this.io.to(this.roomID).emit('data', this.getData());

        if (this.currentPlayer.type == 1){
            this.playTurn();
        }
    }


    playTurn(){
        if (!this.currentPlayer) return;
            this.dices = this.currentPlayer.throw();
            let oldcase = this.currentPlayer.case;

        if (this.currentPlayer.jailed){
            if (this.dices[0] == this.dices[1]){
                this.currentPlayer.jailed = false;
            }
        }

        if(!this.currentPlayer.jailed){
            this.currentPlayer.case = (this.currentPlayer.case + this.dices[0] + this.dices[1]) % 36;

            if (this.currentPlayer.case < oldcase){
                /*
                let r = Math.floor(Math.random() * 4);
                if (r == 1) {
                    for (const player of this.players){
                        player.mahmoud = false;
                    }
                    this.currentPlayer.mahmoud = true;
                }
                    */

                this.currentPlayer.changeMoney(200);
                
            }
            
            if (this.properties[this.currentPlayer.case].name === "Aller en prison"){
                this.currentPlayer.case = 13;
                this.currentPlayer.jailed = true;
                this.currentPlayer.nbJailed++;
            }
            
           if (this.properties[this.currentPlayer.case].name === "Chance" || this.properties[this.currentPlayer.case].name === "Caisse de communauté" ){

                let r = Math.floor(Math.random() * this.chances.length);
                var chance = this.chances[r];

                this.chanceText =  chance[0];
                var price = chance[1];

                if (price == "Mahmoud"){
                    for (const player of this.players){
                        player.mahmoud = false;
                    }
                    this.currentPlayer.mahmoud = true;
                }
                else{
                    if (price ==200){
                        this.currentPlayer.case = 0;
                    }
                    this.currentPlayer.changeMoney(price);
                }
           }

            this.checkOwner(this.currentPlayer.case);

            status = "TOUR "+this.turn+ " : "+this.currentPlayer.getName() + " a lancé les dés : "+this.dices[0]+" "+this.dices[1];
            this.currentPlayer.replay = false;
            this.io.to(this.roomID).emit('data', this.getData());
            status= null;
            this.chanceText = null;
        }

        if (this.currentPlayer.type == 1){
            
            if (Math.random() < 0.5){
                this.popUpClick();
            }
            this.endTurn();
        }
    }

    
    popUpClick(){
        if (!this.currentPlayer) return;
        //var owner = this.checkOwner(this.currentPlayer.case);

        const owner = this.owners[this.currentPlayer.case] !== undefined;
        const price = this.properties[this.currentPlayer.case].price;
        

        if (!owner && !(price === 0)){
            this.currentPlayer.buy(this.properties, this.currentPlayer.case);
            this.owners[this.currentPlayer.case] = this.currentPlayerIndex;
            status = this.currentPlayer.getName() + " a acheté " + this.properties[this.currentPlayer.case].name;
        }
        else{
            status = "Cette propriété appartient à quelqu'un d'autre.";
        }
        
        
        this.io.to(this.roomID).emit('data', this.getData());
        status = null;
        if (this.currentPlayer.type == 0){
            this.endTurn();
        }
    }
    

    async endTurn(){
        if (!this.currentPlayer) return;
        this.eliminate();
        let winner = this.getWinner();
        if(winner !== null){
            status = winner + " a gagné la partie !";
            this.eliminate();
            this.io.to(this.roomID).emit('data', this.getData());
            return;

        }

        const isDouble = this.dices[0] === this.dices[1];
        if (isDouble) {
            // Le joueur rejoue
            this.currentPlayer.replay = true;
        } 
        else {
            this.currentPlayer.replay = false;
            this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
            this.currentPlayer = this.players[this.currentPlayerIndex];
        }
        
        this.dices = null;
        this.turn++;
        
        this.io.to(this.roomID).emit('data', this.getData());

        if (this.currentPlayer.type == 1){
            const sleep = ms => new Promise(r => setTimeout(r, ms));
            await sleep(700);
            this.playTurn();
        }
        else{
            return;
        }
    }


    checkOwner(caseIndex, status) {
        for (let p of this.players) {
            if (p !== this.currentPlayer) {
                if (p.properties[caseIndex]) {
                    // Le joueur p est propriétaire
                    const rent = this.properties[caseIndex].price;
                    this.currentPlayer.changeMoney(-rent);
                    p.changeMoney(rent);
                    //status+= this.currentPlayer +" a payé " + rent + "€ à " + p.getName(); 
                    return true;
                }
            }
        }
        return false;
    }

    eliminate(){
        for (const player of this.players){
            if (player.getMoney() <=0){
                this.io.to(player.id).emit("eliminated");
                remove(this.players, player);
                remove(this.playersID, player.id);
            }
        }
    }

    getWinner() {
    if (this.turn >= this.MAX_TURN){
        var maxi = 0;
        let winner = null;
        for (const player of this.players){
            if (player.getMoney() > maxi){
                maxi = player.getMoney();
                winner = player;
            }
        }

        return winner.getName();
    }

    // On garde seulement les joueurs encore en jeu
    const alivePlayers = this.players.filter(p => p.money > 0);

    // S'il ne reste qu'un joueur, c'est le gagnant
    if (alivePlayers.length === 1) {
        let winner = alivePlayers[0];
        winner.money = -1;
        return winner.getName();
    }

    // Sinon, pas encore de gagnant
    return null;
    }

    free(){
        this.currentPlayer.jailed = false;
        this.currentPlayer.changeMoney(-(50 * this.currentPlayer.nbJailed));
    }
}


export function updatePlayersList(players) {
    const ul = document.getElementById("lb");
    ul.innerHTML = ""; // on vide la liste avant de la remplir

    players.forEach(player => {
        const li = document.createElement("li");
        li.textContent = `${player.name} — Money: ${player.money}`;
        ul.appendChild(li);
    });
}

function remove(array, element){
    let index = array.indexOf(element);
    if (index > -1){
        array.splice(index,1);
    }
}