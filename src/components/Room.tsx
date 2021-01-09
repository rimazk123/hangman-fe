import React, { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { gameStateInterface } from "../hangman";
import Game from "./Game";
import Wait from "./Wait";
import NewWord from "./NewWord";
import axios from "axios";

import { socket } from "../modules";

function Room({ username, mute }: { username: string; mute: boolean }) {
  const [gameState, setGameState] = useState<gameStateInterface>();
  const [user, setUser] = useState(username);
  const { roomID }: { roomID: string } = useParams();
  const [err, setErr] = useState(false);

  const [source, setSource] = useState("");
  const audioRef = useRef<HTMLAudioElement>(null);

  const updateSong = () => {
    setSource("http://localhost:5000/audio/leave.wav");
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.load();
      audioRef.current.play();
    }
  };

  const handleLeave = (newState: gameStateInterface) => {
    if (newState!.players.length === 0) setErr(true);
    setGameState(Object.assign({}, newState));
    updateSong();
  };

  useEffect(() => {
    const getGameState = async () => {
      let res = null;
      try {
        res = await axios.get<gameStateInterface>(
          `http://localhost:5000/?roomID=${roomID}`
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
  }, [roomID]);

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
    } else if (
      (gameState && user === "") ||
      (gameState && !gameState.gameStart)
    ) {
      return (
        <>
          <Wait
            user={user}
            roomID={roomID}
            gameState={gameState!}
            setGameState={setGameState}
            setUser={setUser}
            mute={mute}
          />

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
    } else if (gameState && gameState.gameStart && gameState.category !== "") {
      return (
        <Game
          username={user}
          roomID={roomID}
          gameState={gameState}
          setGameState={setGameState}
          mute={mute}
        />
      );
    } else if (gameState && gameState.category === "") {
      return (
        <NewWord
          gameState={gameState}
          setGameState={setGameState}
          user={user}
          roomID={roomID}
          mute={mute}
        />
      );
    } else {
      return <p>Loading..</p>;
    }
  };

  return <div>{render()}</div>;
}

export default Room;
