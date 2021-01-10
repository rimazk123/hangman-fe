import React, { useState, useEffect, useRef } from "react";
import { gameStateInterface } from "../hangman";
import { socket } from "../modules";
import { InputLabel, TextField, Button, Typography } from "@material-ui/core";

function Wait({
  user,
  roomID,
  gameState,
  setGameState,
  setUser,
  mute,
}: {
  user: string;
  roomID: string;
  gameState: gameStateInterface;
  setGameState: React.Dispatch<
    React.SetStateAction<gameStateInterface | undefined>
  >;
  setUser: React.Dispatch<React.SetStateAction<string>>;
  mute: boolean;
}) {
  const [formUser, setFormUser] = useState("");
  const [copy, setCopy] = useState("Copy Link");
  const [play, setPlay] = useState(false);
  const timerRef = useRef<number>();
  const audioRef = useRef<HTMLAudioElement>(null);
  const url = `http://localhost:3000/${roomID}`;

  const handleUpdate = (newState: gameStateInterface) => {
    updateSong();
    setGameState(Object.assign({}, newState));
  };

  const updateSong = () => {
    setPlay(true);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.load();
      audioRef.current.play();
    }
  };

  const handleSubmitJoin = (e: React.FormEvent) => {
    e.preventDefault();
    let credentials = {
      roomID: roomID,
      user: formUser,
    };
    setUser(formUser);
    socket.emit("join", credentials);
  };

  const validateUsername = () => {
    let username = document.getElementById("username") as HTMLInputElement;
    if (gameState.players.includes(username.value)) {
      username.setCustomValidity("Username is already taken");
    } else if (!/^[^\s]+(\s+[^\s]+)*$/.test(username.value)) {
      username.setCustomValidity(
        "Guess cannot have leading or trailing spaces"
      );
    } else {
      username.setCustomValidity("");
    }
  };

  const onButtonClick = () => {
    socket.emit("start", roomID);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(url).then(
      () => {
        clearTimeout(timerRef.current);
        setCopy("Copied!");
        timerRef.current = window.setTimeout(() => setCopy("Copy Link"), 5000);
      },
      () => {
        clearTimeout(timerRef.current);
        setCopy("Failed to Copy");
        timerRef.current = window.setTimeout(() => setCopy("Copy Link"), 5000);
      }
    );
  };

  useEffect(() => {
    socket.on("update", handleUpdate);
    socket.emit("joinRoom", roomID);
    return () => {
      socket.off("update", handleUpdate);
    };
  }, []);

  const render = () => {
    if (
      gameState &&
      gameState.players.length >= gameState!.cap &&
      user === ""
    ) {
      return <p>Sorry, Room is full </p>;
    } else {
      return (
        <>
          <Typography variant="h4" paragraph>
            Players
          </Typography>
          {gameState.players.map((player) => (
            <Typography key={player} paragraph>
              {player}
            </Typography>
          ))}

          {play && gameState.players[gameState.players.length - 1] !== user && (
            <audio
              autoPlay
              onEnded={() => setPlay(false)}
              muted={mute}
              ref={audioRef}
            >
              <source src="http://localhost:5000/audio/join.mp3" />
            </audio>
          )}

          {user === gameState.hanger && (
            <>
              <Typography paragraph>
                Share this link with your friends:
                <br />
                {url}{" "}
                <Button variant="contained" onClick={copyLink}>
                  {copy}
                </Button>
              </Typography>
            </>
          )}

          {user === gameState.hanger && gameState.players.length >= 2 && (
            <Button variant="contained" onClick={onButtonClick}>
              Start game!
            </Button>
          )}
          {/* Add functionality for changing username */}
          {!gameState.players.includes(user) && (
            <div id="wait">
              <form onSubmit={handleSubmitJoin}>
                <InputLabel htmlFor="username">Username</InputLabel>
                <TextField
                  type="text"
                  value={formUser}
                  onChange={(e) => setFormUser(e.target.value)}
                  onInput={(e) => validateUsername()}
                  id="username"
                  name="username"
                />
              </form>
            </div>
          )}
        </>
      );
    }
  };

  return <div>{render()}</div>;
}

export default Wait;
