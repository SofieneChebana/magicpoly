import {Player} from './Player.js';

/**
 * Pour chaque tour, on envoie via socekt.emit() l'etat du jeu
 * Le client se charge d'afficher la data récupérer via socket.on(data).
 */

var status="";

export class Game{

    constructor(io,room, usernames){
        this.io = io;
        this.roomID = room.id;
        this.players = [];
        this.playersID = [];

        for (let i=0; i<usernames.length; i++){
            var player = new Player(usernames[i], room.players.ids[i]);
            this.players.push(player);
            //this.playersID.push(room.players.ids[i]);
            this.playersID.push(player.id);
        }

        this.currentPlayer = null;
        this.dices = [1,1];
        this.turn = 0;
        this.MAX_TURN = 100;

        this.caseSize = 110;
        this.size = this.caseSize * 10;

        this.properties = {
        0:  { name: "Départ", price: 0 },

        1:  { name: "Boulevard de Belleville", price: 60 },
        2:  { name: "Rue Lecourbe", price: 60 },

        3:  { name: "Caisse de communauté", price: 0 },

        4:  { name: "Rue de Vaugirard", price: 100 },
        5:  { name: "Rue de Courcelles", price: 100 },
        6:  { name: "Avenue de la République", price: 120 },

        7:  { name: "Impôt sur le revenu", price: 200 },

        8:  { name: "Gare Montparnasse", price: 200 },

        9:  { name: "Boulevard de la Villette", price: 140 },
        10: { name: "Chance", price: 0 },
        11: { name: "Avenue de Neuilly", price: 140 },
        12: { name: "Rue de Paradis", price: 160 },

        13: { name: "Prison / Simple visite", price: 0 },

        14: { name: "Avenue Mozart", price: 180 },
        15: { name: "Boulevard Saint-Michel", price: 180 },
        16: { name: "Place Pigalle", price: 200 },

        17: { name: "Gare de Lyon", price: 200 },

        18: { name: "Caisse de communauté", price: 0 },

        19: { name: "Avenue Matignon", price: 220 },
        20: { name: "Boulevard Malesherbes", price: 220 },
        21: { name: "Avenue Henri-Martin", price: 240 },

        22: { name: "Faubourg Saint-Honoré", price: 260 },
        23: { name: "Place de la Bourse", price: 260 },

        24: { name: "Compagnie d’électricité", price: 150 },

        25: { name: "Rue La Fayette", price: 280 },
        26: { name: "Avenue de Breteuil", price: 300 },
        27: { name: "Aller en prison", price: 0 }, 

        28: { name: "Gare du Nord", price: 200 },

        29: { name: "Chance", price: 0 },

        30: { name: "Avenue Foch", price: 300 },
        31: { name: "Boulevard des Capucines", price: 320 },
        32: { name: "Avenue des Champs-Élysées", price: 350 },

        33: { name: "Taxe de luxe", price: 100 },

        34: { name: "Rue de la Paix", price: 400 },

        35: { name: "Gare Saint-Lazare", price: 200 },

        36: { name: "Chance", price: 0 },            
        37: { name: "Avenue de Breteuil", price: 300 }, 
        38: { name: "Taxe supplémentaire", price: 100 },
        39: { name: "Rue de la Paix", price: 400 }       
        };

        this.owners = {};

        this.keys = Object.keys(this.properties);
        this.values = Object.values(this.properties);
        
        // Couleurs de pions (autant que de joueurs)
        const baseColors = ["red", "blue", "green", "purple", "orange", "teal"];
        this.playerColors = usernames.map((_, i) => baseColors[i % baseColors.length]);
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
            status:     status,
            dices:      this.dices
        };

        return data;
    }

    init(){
        var max = Math.floor(3);
        this.currentPlayerIndex = Math.floor(Math.random() * max) % this.players.length;
        this.currentPlayer = this.players[this.currentPlayerIndex];

        status= this.currentPlayer.getName()+" commence ! <br> La partie se termine dans "+this.MAX_TURN + "tour.";

        this.io.to(this.roomID).emit('data', this.getData());
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
                this.currentPlayer.money += 200;
            }
            /*
            if (this.properties[this.currentPlayer.case].name === "Aller en prison"){
                this.currentPlayer.case = 13;
                this.currentPlayer.jailed = true;
                this.currentPlayer.nbJailed++;
            }
            */
            this.checkOwner(this.currentPlayer.case);

            status = "TOUR "+this.turn+ " : "+this.currentPlayer.getName() + " a lancé les dés : "+this.dices[0]+" "+this.dices[1];
            this.currentPlayer.replay = false;
            this.io.to(this.roomID).emit('data', this.getData());
            status= null;
        }
    }

    
    popUpClick(){
        console.log(this.dices[0], this.dices[1])
        if (!this.currentPlayer) return;
        //Si le joueur courant a pris sa décision:
        this.currentPlayer.buying = true;
        var owner = this.checkOwner(this.currentPlayer.case);

        if(this.currentPlayer.buying){
            if (!owner && !(this.properties[this.currentPlayer.case].price == 0)){
                this.currentPlayer.buy(this.properties, this.currentPlayer.case);
                this.owners[this.currentPlayer.case] = this.currentPlayerIndex;
                status = this.currentPlayer.getName() + " a acheté " + this.properties[this.currentPlayer.case].name;
            }
            else{
                status = "Cette propriété appartient à quelqu'un d'autre.";
            }
        }

        this.eliminate();
        let winner = this.getWinner();
        if(winner !== null){
            status = winner + " a gagné la partie !";
            //this.currentPlayer.id = null;
            //this.currentPlayer = null;
            //this.currentPlayerIndex = null;
        }


        if (this.dices[0] != this.dices[1]){// Si le joueur n'a pas fait de double:  
            this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
            this.currentPlayer = this.players[this.currentPlayerIndex];
        }
        else if(this.dices[0] == this.dices[1]){
            this.currentPlayer.replay = true;
        }
        this.dices = null;
        
        
        this.turn++;
        this.io.to(this.roomID).emit('data', this.getData());
        status = null;
        this.currentPlayer.replay = false;
        
    }
    

    endTurn(){
        console.log(this.dices[0], this.dices[1])
        if (!this.currentPlayer) return;
        this.eliminate();
        let winner = this.getWinner();
        if(winner !== null){
            status = winner + " a gagné la partie !";
            //this.currentPlayer.id = null;
            //this.currentPlayer = null;
            //this.currentPlayerIndex = null;
            
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

        this.currentPlayer.buying = null;
        this.turn++;
        console.log(this.currentPlayer.name);
        this.io.to(this.roomID).emit('data', this.getData());
    }


    checkOwner(caseIndex) {
        for (let p of this.players) {
            if (p !== this.currentPlayer) {
                if (p.properties[caseIndex]) {
                    // Le joueur p est propriétaire
                    const rent = this.properties[caseIndex].price;
                    this.currentPlayer.money -= rent;
                    p.money += rent;

                    return true;
                }
            }
        }
        return false;
    }

    eliminate(){
        for (const player of this.players){
            if (player.getMoney() <=0){
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
            if (player.money > maxi){
                maxi = player.money;
                winner = player;
            }
        }

        return winner.getName();
    }

    // On garde seulement les joueurs encore en jeu
    const alivePlayers = this.players.filter(p => p.money > 0);

    // S'il ne reste qu'un joueur, c'est le gagnant
    if (alivePlayers.length === 1) {
        return alivePlayers[0].getName();
    }

    // Sinon, pas encore de gagnant
    return null;
    }

    free(){
        this.currentPlayer.jailed = false;
        this.currentPlayer.money -= 50 * this.currentPlayer.nbJailed;
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