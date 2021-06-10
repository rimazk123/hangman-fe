import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useContext,
} from "react";
import { gameStateInterface } from "../hangman";
import gameStateContext from "../context/gameContext";
import { socket } from "../modules";
import { InputLabel, TextField, Button, Typography } from "@material-ui/core";

function Wait({
  user,
  roomID,
  setUser,
  mute,
}: {
  user: string;
  roomID: string;
  setUser: React.Dispatch<React.SetStateAction<string>>;
  mute: boolean;
}) {
  const { gameState, setGameState } = useContext(gameStateContext);
  const [formUser, setFormUser] = useState("");
  const [copy, setCopy] = useState("Copy Link");
  const [play, setPlay] = useState(false);
  const timerRef = useRef<number>();
  const audioRef = useRef<HTMLAudioElement>(null);
  const url = window.location.href;

  const handleUpdate = useCallback((newState: gameStateInterface) => {
    updateSong();
    setGameState(Object.assign({}, newState));
    // eslint-disable-next-line
  }, []);

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
    setFormUser("");
    socket.emit("join", credentials);

    let message = `${formUser} has joined`;
    let info = {
      roomID: roomID,
      user: "join",
      message: message,
      effects: true,
    };
    socket.emit("chat", info);
  };

  const validateUsername = () => {
    let username = document.getElementById("username") as HTMLInputElement;
    if (gameState.players.includes(username.value)) {
      username.setCustomValidity("Username is already taken");
    } else if (!/^[^\s]+(\s+[^\s]+)*$/.test(username.value)) {
      username.setCustomValidity(
        "Guess cannot have leading or trailing spaces"
      );
    } else if (username.value.length > 20) {
      username.setCustomValidity("Username cannot be more than 20 characters");
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
  }, [roomID, handleUpdate]);

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
          {play && gameState.players[gameState.players.length - 1] !== user && (
            <audio
              autoPlay
              onEnded={() => setPlay(false)}
              muted={mute}
              ref={audioRef}
            >
              <source src={`${process.env.REACT_APP_SERVER}/audio/join.mp3`} />
            </audio>
          )}

          <Typography variant="h4" paragraph>
            Players
          </Typography>
          {gameState.players.map((player) => (
            <Typography key={player} variant="h6">
              {player}
            </Typography>
          ))}

          <br />

          {user === gameState.hanger && gameState.players.length >= 2 && (
            <Button variant="contained" color="primary" onClick={onButtonClick}>
              Start game!
            </Button>
          )}

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
                  required
                />
              </form>
            </div>
          )}

          <br />
          <br />

          <Typography paragraph>
            Share this link with your friends:
            <br />
            {url}{" "}
            <Button onClick={copyLink} color="primary">
              {copy}
            </Button>
          </Typography>
        </>
      );
    }
  };

  return <div>{render()}</div>;
}

export default Wait;
