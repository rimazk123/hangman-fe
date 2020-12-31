import React, { useState, useEffect } from "react";
import { gameInitInterface, gameStateInterface } from "../hangman";
import { socket } from "../modules";

function Create({
  setUser,
  setRoom,
}: {
  setUser: React.Dispatch<React.SetStateAction<string>>;
  setRoom: React.Dispatch<React.SetStateAction<string>>;
}) {
  const [state, setState] = useState<gameInitInterface>({
    category: "",
    username: "",
    word: "",
    lives: "",
  });

  // const getUrlCode = (): string => {
  //   return gameURL.slice(-11, -1);
  // };

  const handleLink = (info: {
    gameState: gameStateInterface;
    roomID: string;
  }) => {
    // console.log(`this is my username:  ${state.username}`);
    setUser(info.gameState.players[0]); // why doesn't state.username itself work
    setRoom(info.roomID);
  };

  useEffect(() => {
    socket.on("link", handleLink);
    return () => {
      socket.off("link", handleLink);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state.category && state.username && state.word && state.lives) {
      socket.emit("create", state);
    } else {
      console.warn("One or more fields are missing");
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        Enter Username:
        <input
          type="text"
          value={state.username}
          onChange={(e) => setState({ ...state, username: e.target.value })}
          id="username"
          name="username"
        ></input>
        <br />
        Enter First Word:
        <input
          type="text"
          value={state.word}
          onChange={(e) => setState({ ...state, word: e.target.value })}
          id="word"
          name="word"
        ></input>
        <br />
        Enter Category:
        <input
          type="text"
          value={state.category}
          onChange={(e) => setState({ ...state, category: e.target.value })}
          id="category"
          name="category"
        ></input>
        <br />
        Enter Lives:
        <input
          type="number"
          value={state.lives}
          onChange={(e) => setState({ ...state, lives: e.target.value })}
          id="lives"
          name="lives"
          min="6"
          max="10"
        ></input>
        <br />
        <br />
        <input type="submit" value="Get Game Link"></input>
      </form>
    </div>
  );
}

export default Create;
