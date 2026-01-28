export class Player{
    constructor(name, id){
        this.name = name;
        this.money = 1500;
        this.properties = {};
        this.case = 0;
        this.buying = null;
        this.id = id;
        this.replay = false;
        this.jailed = false;
        this.nbJailed = 0;
    }

    getName(){
        return this.name;
    }

    getMoney(){
        return this.money;
    }

    getProperties(){
        return this.properties;
    }

    throw(){
        var min = Math.ceil(1);
        var max = Math.floor(6);
        var dice1 = Math.floor(Math.random() * (max - min + 1)) + min;
        var dice2 = Math.floor(Math.random() * (max - min + 1)) + min;

        return [dice1, dice2];
    }

    buy(properties, caseIndex){
        const prop = properties[caseIndex]
        
        this.money -= prop.price;
        this.properties[caseIndex] = prop

        this.buying = null;
    }


}