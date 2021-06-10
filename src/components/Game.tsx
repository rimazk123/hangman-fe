import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useContext,
} from "react";
import { gameStateInterface } from "../hangman";
import { FormControl, Input, InputLabel, Typography } from "@material-ui/core";
import Letters from "./Letters";
import Timer from "./Timer";
import "../css/Game.scss";
import { socket } from "../modules";
import gameStateContext from "../context/gameContext";

const figureMapping = [
  "none.png",
  "head.png",
  "body.png",
  "left_leg.png",
  "right_leg.png",
  "left_arm.png",
  "right_arm.png",
  "hair.png",
  "eyes.png",
  "nose.png",
  "mouth.png",
];

function Game({
  username,
  roomID,
  mute,
}: {
  username: string;
  roomID: string;
  mute: boolean;
}) {
  const { gameState, setGameState } = useContext(gameStateContext);
  const [word, setWord] = useState("");
  const [source, setSource] = useState("");
  const [showScore, setShowScore] = useState(false);
  const [change, setChange] = useState("");
  const audioRef = useRef<HTMLAudioElement>(null);

  const gameHandler = useCallback((newState: gameStateInterface) => {
    setGameState(Object.assign({}, newState));
    setShowScore(true);
    window.setTimeout(() => setShowScore(false), 2000);
    // eslint-disable-next-line
  }, []);

  const updateSong = (source: string) => {
    setSource(source);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.load();
      audioRef.current.play(); // Maintain returned promise with a ref to avoid console error
    }
  };

  const handleStatus = useCallback(
    (info: { status: string; guess: string }) => {
      let newURL: string = "";
      let message: string = "";
      if (info["status"] === "timer") {
        newURL = `${process.env.REACT_APP_SERVER}/audio/timer.mp3`;
        message = `${username} ran out of time`;
        setChange("-5");
      } else if (info["status"] === "correct") {
        newURL = `${process.env.REACT_APP_SERVER}/audio/correct.mp3`;
        message = `${username} guessed ${info["guess"]}`;
        setChange("+15");
      } else if (info["status"] === "incorrect") {
        console.log(gameState);
        console.log(info["guess"]);
        newURL = `${process.env.REACT_APP_SERVER}/audio/wrong.mp3`;
        message = `${username} guessed ${info["guess"]}`;
        setChange("-5");
      } else if (info["status"] === "win") {
        message = `${username} completed the word!`;
        setChange("+30");
      }

      updateSong(newURL);

      let res = {
        roomID: roomID,
        user: info["status"],
        message: message,
        effects: true,
      };

      socket.emit("chat", res);
    },
    // eslint-disable-next-line
    []
  );

  useEffect(() => {
    socket.on("update", gameHandler);
    socket.on("status", handleStatus);
    return () => {
      socket.off("update", gameHandler);
      socket.off("status", handleStatus);
    };
  }, [gameHandler, handleStatus]);

  const validateGuess = () => {
    let userGuess = document.getElementById("guess") as HTMLInputElement;
    if (gameState.guessedWords.includes(userGuess.value)) {
      userGuess.setCustomValidity(
        `${userGuess.value} has already been guessed`
      );
    } else if (!/^[^\s]+(\s+[^\s]+)*$/.test(userGuess.value)) {
      userGuess.setCustomValidity(
        "Guess cannot have leading or trailing spaces"
      );
    } else if (!/^[-\sa-zA-Z]+$/.test(userGuess.value)) {
      userGuess.setCustomValidity(
        "Only alphabetic characters, spaces, and dashes allowed"
      );
    } else if (userGuess.value.length < 2) {
      userGuess.setCustomValidity("Guess must have at least two characters");
    } else {
      userGuess.setCustomValidity("");
    }
  };

  const makeGuess = (guessedEntity: string) => {
    let guessState = Object.assign(
      {},
      { ...gameState, curGuess: guessedEntity }
    );

    let guess = {
      roomID: roomID,
      gameState: guessState,
    };

    socket.emit("guess", guess);
  };

  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    makeGuess(word);
    setWord("");
  };

  const onLetterClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setWord("");
    let ev = e.currentTarget as HTMLButtonElement;
    makeGuess(ev.value);
  };

  const getScore = (player: string) => {
    const win: number = 30;
    const right: number = 15;
    const wrong: number = -5;
    const miss: number = -5;

    return (
      win * gameState.wins[player] +
      right * gameState.right[player] +
      wrong * gameState.wrong[player] +
      miss * gameState.misses[player]
    );
  };

  let prevGuesser: number = gameState.players.indexOf(gameState.guesser);

  do {
    prevGuesser =
      (((prevGuesser - 1) % gameState.players.length) +
        gameState.players.length) %
      gameState.players.length;
  } while (gameState.players[prevGuesser] === gameState.hanger);

  let mode =
    gameState.rotation === "robin" ? "Round Robin" : "King of the Hill";

  return (
    <>
      <div className="players">
        <h2>Active Players: </h2>
        {gameState.players.map((player) => (
          <Typography
            variant="h5"
            style={{ color: player === gameState.guesser ? "blue" : "black" }}
            key={player}
          >
            {username === player ? "*" : ""}
            {player} {getScore(player)}{" "}
            {showScore && player === gameState.players[prevGuesser] && (
              <span
                className="change"
                style={{ color: change[0] === "+" ? "green" : "red" }}
              >
                {change}
              </span>
            )}
          </Typography>
        ))}
        <br />
        <Typography variant="h5">{"Hanger: " + gameState.hanger}</Typography>
        <Typography variant="h5">{"Mode: " + mode}</Typography>
      </div>
      <div className="game-container">
        {username === gameState.players[prevGuesser] && source !== "" && (
          <audio
            id="guessAudio"
            autoPlay
            onEnded={() => setSource("")}
            muted={mute}
            ref={audioRef}
          >
            <source src={source} />
          </audio>
        )}
        {username && username !== "" && (
          <div>
            <div className="top-container">
              <Typography variant="h4" paragraph>
                Round {gameState.round} of {gameState.numRounds}
              </Typography>
              <br />

              {username === gameState.guesser && gameState.time && (
                <div className="timer">
                  <Timer gameState={gameState} makeGuess={makeGuess} />
                </div>
              )}
            </div>
            {username === gameState.hanger && (
              <Typography variant="h5" style={{ wordWrap: "break-word" }}>
                {"Word(s): " + gameState.word}
              </Typography>
            )}
            <Typography variant="h6">
              {"Category: " + gameState.category} <br />
              {"Guesses Remaining: " +
                (gameState.lives - gameState.numIncorrect)}
            </Typography>
            <Typography variant="h3" style={{}} className="word">
              {gameState.guessedWord}
            </Typography>
            <img
              className="drawing"
              src={`/images/${figureMapping[gameState.numIncorrect]}`}
              alt="Hangman Representing Game Progress"
            />

            {username !== gameState.hanger && (
              <>
                <Letters
                  onClick={onLetterClick}
                  disabled={gameState.guesser !== username}
                  guessedLetters={gameState.guessedLetters}
                />
                <br />
                <form onSubmit={onFormSubmit}>
                  <FormControl>
                    <InputLabel htmlFor="guess">Word</InputLabel>
                    <Input
                      type="text"
                      value={word}
                      onChange={(e) => setWord(e.target.value)}
                      id="guess"
                      name="guess"
                      inputProps={{
                        maxLength: 50,
                        minLength: 2,
                      }}
                      onInput={(e) => validateGuess()}
                      disabled={gameState.guesser !== username}
                      required
                    />
                  </FormControl>
                </form>
              </>
            )}
            <br />
          </div>
        )}
      </div>
    </>
  );
}

export default Game;
