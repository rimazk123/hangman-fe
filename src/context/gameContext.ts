import React from "react";
import { gameStateInterface } from "../hangman";

export const defaultGameState: gameStateInterface = {
  players: [],
  wins: {},
  right: {},
  wrong: {},
  misses: {},
  cap: 0,
  hanger: "",
  category: "",
  word: "",
  guessedLetters: [],
  lives: 0,
  numIncorrect: 0,
  guessedWord: "",
  guesser: "",
  curGuess: "",
  guessedWords: [],
  gameStart: false,
  rotation: "",
  round: 0,
  numRounds: 0,
  time: 0,
};

interface gameContextTypes {
  gameState: gameStateInterface;
  setGameState: (newState: gameStateInterface) => void;
}

const gameContext = React.createContext<gameContextTypes>({
  gameState: defaultGameState,
  setGameState: () => {},
});

export default gameContext;
