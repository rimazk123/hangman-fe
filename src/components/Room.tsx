import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useContext,
} from "react";
import { useParams } from "react-router-dom";
import { gameStateInterface } from "../hangman";
import Game from "./Game";
import Wait from "./Wait";
import Chat from "./Chat";
import NewWord from "./NewWord";
import gameStateContext, { defaultGameState } from "../context/gameContext";
import axios from "axios";
import "../css/Room.scss";

import { socket } from "../modules";

function Room({ username, mute }: { username: string; mute: boolean }) {
  const [gameState, setGameState] = useState<gameStateInterface>(
    defaultGameState
  );
  const [user, setUser] = useState(username);
  const { roomID }: { roomID: string } = useParams();
  const [err, setErr] = useState(false);

  const [source, setSource] = useState("");
  const audioRef = useRef<HTMLAudioElement>(null);

  const updateSong = () => {
    setSource(`${process.env.REACT_APP_SERVER}/audio/leave.mp3`);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.load();
      audioRef.current.play();
    }
  };

  const handleLeave = useCallback((newState: gameStateInterface) => {
    if (newState!.players.length === 0) setErr(true);
    setGameState(Object.assign({}, newState));
    updateSong();
  }, []);

  useEffect(() => {
    const getGameState = async () => {
      let res = null;
      try {
        res = await axios.get<gameStateInterface>(
          `${process.env.REACT_APP_SERVER}/?roomID=${roomID}`
        );
      } catch (err) {
        setErr(true);
      } finally {
        if (res && res.status === 200) {
          setGameState(res.data);
        }
      }
    };

    socket.on("leave", handleLeave);
    getGameState();
  }, [roomID, handleLeave]);

  useEffect(() => {
    const cleanup = (e: Event) => {
      e.preventDefault();
      socket.emit("leave", { user: user, roomID: roomID });
    };
    window.addEventListener("unload", cleanup);
    return () => window.removeEventListener("unload", cleanup);
  }, [user, roomID]);

  const render = () => {
    if (err) {
      return <p>Room does not exist</p>;
    } else if (user === "" || !gameState.gameStart) {
      return (
        <>
          <Wait user={user} roomID={roomID} setUser={setUser} mute={mute} />
          {source !== "" && (
            <audio
              autoPlay
              onEnded={() => setSource("")}
              muted={mute}
              ref={audioRef}
            >
              <source src={source} />
            </audio>
          )}
        </>
      );
    } else if (gameState.gameStart && gameState.category !== "") {
      return <Game username={user} roomID={roomID} mute={mute} />;
    } else if (gameState.category === "") {
      return <NewWord user={user} roomID={roomID} mute={mute} />;
    } else {
      return <p>Loading..</p>;
    }
  };

  const show_chat = () => {
    if (
      !err &&
      gameState.players.includes(user) &&
      gameState.players.length > 1
    ) {
      return <Chat user={user} roomID={roomID} />;
    }
  };

  return (
    <div className="room-container">
      <gameStateContext.Provider value={{ gameState, setGameState }}>
        {render()}
        {show_chat()}
      </gameStateContext.Provider>
    </div>
  );
}

export default Room;
