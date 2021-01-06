import React, { useState, useEffect } from "react";
import { gameStateInterface } from "../hangman";
import { socket } from "../modules";

const NewWord = ({
  gameState,
  setGameState,
  user,
  roomID,
}: {
  gameState: gameStateInterface;
  setGameState: React.Dispatch<
    React.SetStateAction<gameStateInterface | undefined>
  >;
  user: string;
  roomID: string;
}) => {
  const [word, setWord] = useState("");
  const [category, setCategory] = useState("");
  const [error, setError] = useState("");

  // TODO: Update Regex to Prohibit Digits in Word
  const checkInput = (): boolean => {
    let copy = Object.assign("", word);
    copy.replace(/[^a-z\s-]/gi, "");
    return word.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (category && word) {
      if (checkInput()) setError("Only alphabetic, spaces, and dashes allowed");
      const info = {
        category: category,
        word: word,
        user: user,
        roomID: roomID,
      };
      socket.emit("newRound", info);
    } else {
      setError("One or more fields are missing");
    }
  };

  const gameHandler = (newState: gameStateInterface) => {
    setGameState(Object.assign({}, newState));
  };

  useEffect(() => {
    socket.on("response", gameHandler);
    return () => {
      socket.off("response", gameHandler);
    };
  }, []);

  const next =
    gameState.players[
      (gameState.players.indexOf(gameState.hanger) + 1) %
        gameState.players.length
    ];

  let next_hanger = "";

  if (gameState.round === 0) {
    next_hanger = gameState.hanger;
  } else if (gameState.rotation === "king") {
    if (gameState.numIncorrect === gameState.lives) {
      next_hanger = gameState.hanger;
    } else {
      next_hanger = gameState.guesser;
    }
  } else if (gameState.rotation === "robin") {
    next_hanger = next;
  }

  if (gameState.round !== gameState.numRounds) {
    return (
      <>
        {gameState.word !== "" &&
          gameState.rotation === "robin" &&
          gameState.numIncorrect !== gameState.lives &&
          user === gameState.guesser && <p>YOU WIN! :)</p>}

        {gameState.word !== "" &&
          gameState.rotation === "robin" &&
          gameState.numIncorrect === gameState.lives &&
          user === gameState.hanger && <p>YOU WIN! :)</p>}

        {user === next_hanger ? (
          <div>
            {gameState.word !== "" && gameState.rotation === "king" && (
              <p>YOU WIN! :)</p>
            )}

            <form onSubmit={handleSubmit}>
              Enter {gameState.word ? "New" : ""} Word:
              <input
                type="text"
                value={word}
                onChange={(e) => setWord(e.target.value)}
                id="word"
                name="word"
              ></input>
              <br />
              Enter {gameState.word ? "New" : ""} Category:
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                id="category"
                name="category"
              ></input>
              <br />
              <input type="submit" value="Submit" />
            </form>
          </div>
        ) : (
          <div>
            {gameState.word !== "" && user !== gameState.hanger && (
              <p>The word was {gameState.word}</p>
            )}
            <p>
              {next_hanger} is {gameState.word ? "now" : ""} the hanger
            </p>
            <p>Waiting for a {gameState.word ? "new" : ""} word...</p>
          </div>
        )}
        {error && error !== "" && <p>error</p>}
      </>
    );
  } else {
    const places = [
      "FIRST",
      "SECOND",
      "THIRD",
      "FOURTH",
      "FIFTH",
      "SIXTH",
      "SEVENTH",
      "EIGTH",
    ];
    let wins = Object.entries(gameState.wins);
    wins.sort(function (a, b) {
      return b[1] - a[1];
    });
    let prev = wins[0][1];
    let uniq = 0;
    let res: Array<string> = [];
    for (let person of wins) {
      if (person[1] !== prev) {
        uniq++;
      }
      prev = person[1];
      let str = `${places[uniq]} PLACE: ${person[0]} with a score of ${person[1]}`;
      res.push(str);
    }

    return (
      <div>
        {res.map((place: string) => (
          <p>{place}</p>
        ))}
      </div>
    );
  }
};

export default NewWord;
