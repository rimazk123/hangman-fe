import React, { useCallback, useEffect, useState, useContext } from "react";
import {
  FormGroup,
  FormControl,
  InputLabel,
  TextField,
  Typography,
  MenuItem,
  Select,
  Button,
} from "@material-ui/core";
import { gameStateInterface, gameInitInterface } from "../hangman";
import gameStateContext from "../context/gameContext";
import { socket } from "../modules";

const NewRound = ({ roomID, user }: { roomID: string; user: string }) => {
  const [started, setStarted] = useState(false);
  const { gameState, setGameState } = useContext(gameStateContext);

  let temp: string;
  if (gameState.time === null) {
    temp = "inf";
  } else {
    temp = gameState.time.toString();
  }

  const [state, setState] = useState<gameInitInterface>({
    username: user,
    lives: gameState.lives.toString(),
    numRounds: gameState.numRounds.toString(),
    rotation: gameState.rotation,
    time: temp,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let params = Object.assign({}, state);

    const info = { params: params, roomID: roomID, username: user };
    socket.emit("join_new", info);
  };

  const onClick = () => {
    socket.emit("new", roomID);
  };

  const handleNew = useCallback(() => {
    setStarted(true);
    // eslint-disable-next-line
  }, []);

  const handleJoin = useCallback((newState: gameStateInterface) => {
    setGameState(Object.assign({}, newState));
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    socket.on("new", handleNew);
    socket.on("join_new", handleJoin);
    return () => {
      socket.off("join_new", handleJoin);
      socket.off("new", handleNew);
    };
  }, [handleJoin, handleNew]);

  return (
    <div>
      {user !== gameState.players[0] && !started && (
        <Typography variant="h6">
          Waiting for {gameState.players[0]} to start the next game...
        </Typography>
      )}

      {user !== gameState.players[0] && started && (
        <p>{gameState.players[0]} is choosing the settings...</p>
      )}

      {user === gameState.players[0] && !started && (
        <Button
          onClick={onClick}
          variant="contained"
          color="primary"
          type="submit"
        >
          Start Next Game
        </Button>
      )}

      {user === gameState.players[0] && started && (
        <form
          onSubmit={handleSubmit}
          style={{ minWidth: "225px", maxWidth: "400px", margin: "auto 0" }}
        >
          <FormGroup>
            <TextField
              type="number"
              label="Lives"
              value={state.lives}
              onChange={(e) => setState({ ...state, lives: e.target.value })}
              id="lives"
              name="lives"
              inputProps={{ min: 6, max: 10 }}
              onInvalid={(e) => "Please fill out this field"}
              variant="filled"
              required
            />
            <br />
            <TextField
              type="number"
              label="Rounds"
              value={state.numRounds}
              onChange={(e) =>
                setState({ ...state, numRounds: e.target.value })
              }
              id="numRounds"
              name="numRounds"
              inputProps={{ min: 1 }}
              onInvalid={(e) => "Please fill out this field"}
              variant="filled"
              required
            />
            <br />
            <FormControl>
              <InputLabel id="rotation-label">Rotation</InputLabel>
              <Select
                labelId="rotation-label"
                name="rotation"
                id="rotation"
                value={state.rotation}
                onChange={(e) =>
                  setState({ ...state, rotation: e.target.value as string })
                }
                onInvalid={(e) => "Please fill out this field"}
                variant="filled"
                required
              >
                <MenuItem value="robin">Round Robin</MenuItem>
                <MenuItem value="king">King of the Hill</MenuItem>
              </Select>{" "}
            </FormControl>
            <br />
            <FormControl>
              <InputLabel id="time-label">Guess Time (sec)</InputLabel>
              <Select
                name="time"
                id="time"
                labelId="time-label"
                onInvalid={(e) => "Please fill out this field"}
                value={state.time}
                required
                variant="filled"
                onChange={(e) =>
                  setState({ ...state, time: e.target.value as string })
                }
              >
                <MenuItem value="10">10</MenuItem>
                <MenuItem value="20">20</MenuItem>
                <MenuItem value="30">30</MenuItem>
                <MenuItem value="40">40</MenuItem>
                <MenuItem value="50">50</MenuItem>
                <MenuItem value="60">60</MenuItem>
                <MenuItem value="70">70</MenuItem>
                <MenuItem value="80">80</MenuItem>
                <MenuItem value="90">90</MenuItem>
                <MenuItem value="inf">Unlimited</MenuItem>
              </Select>
            </FormControl>
            <br />
            <br />
            <Button variant="contained" color="primary" type="submit">
              Create Game
            </Button>
            <br />
            <br />
          </FormGroup>
        </form>
      )}
    </div>
  );
};

export default NewRound;
