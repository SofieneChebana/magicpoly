import { useRef, useEffect } from "react";
import { sendEmote, drawBoard } from "./utils.js"

function Game() {
    const boardRef = useRef(null);

  useEffect(() => {
    const canvas = boardRef.current;
    const ctx = canvas.getContext("2d");
    drawBoard(canvas, ctx);
  }, []);


    return (
    <>
        <h2>Page Game</h2>

        <canvas id="canvas" ref={boardRef} width="1100" height="1100"></canvas>
        

        <div className="emote-menu">
            <button onClick={() => sendEmote("finger")}> <img src="../public/assets/emotes/finger.png" width="50px" height="50px"/></button>
            <button onClick={() => sendEmote("tié1tigre")} ><img src="../public/assets/emotes/tié1tigre.png" width="50px" height="50px"/></button>
            <button onClick={() => sendEmote("allosalam")}><img src="../public/assets/emotes/allosalam.png" width="50px" height="50px"/></button>
            <button onClick={() => sendEmote("autruche")}><img src="../public/assets/emotes/autruche.png" width="50px" height="50px"/></button>
            <button onClick={() => sendEmote("mamanayo")}><img src="../public/assets/emotes/mamanayo.png" width="50px" height="50px"/></button>
        </div>
            <button id="startMusic">♫</button>
            <button id="action" >Lancer les dés</button>
            <button id="popUp" >Acheter?</button>
            <button id="endTurn" >Finir le tour</button>
            <button id="free">Payer 50€ pour sortir ?</button>

                <div id="log" ></div>
                    <ul id="lb"></ul>


        <div id="popupOverlay" className="popup-overlay">
            <div className="popup-content">
                <span className="close-btn" id="closePopupBtn">&times;</span>
                <h2>Chance/Caisse de communauté</h2>
                <p id="chanceText"></p>
            </div>
        </div>
        <button id="quit"> Quitter ⇨</button>


    </>
  )
}

export default Game