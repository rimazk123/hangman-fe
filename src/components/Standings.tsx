import React, { useRef, useContext } from "react";
import { gameStateInterface } from "../hangman";
import NewRound from "./NewRound";
import { Typography } from "@material-ui/core";
import gameStateContext from "../context/gameContext";

const Standings = ({ roomID, user }: { roomID: string; user: string }) => {
  const { gameState, setGameState } = useContext(gameStateContext);
  const standings = useRef<string[]>([]);

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

  let scores: { [key: string]: number } = gameState.players.reduce(function (
    obj: { [key: string]: number },
    x: string
  ) {
    obj[x] = getScore(x);
    return obj;
  },
  {});

  if (!standings.current.length) {
    // let wins = Object.entries(gameState.wins);
    let wins = Object.entries(scores);
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

    standings.current = res;
  }

  return (
    <div>
      {standings.current.map((place: string) => (
        <Typography variant="h5" key={place}>
          <b>{place}</b>
        </Typography>
      ))}

      <br />

      <NewRound roomID={roomID} user={user} />
    </div>
  );
};

export default Standings;
