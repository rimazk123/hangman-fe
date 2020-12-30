import React, { useState, useEffect } from "react";
import axios from "axios";
import { Router, Route, Redirect, useLocation } from "react-router";
import Create from "./Create";
import Room from "./Room";
import { createBrowserHistory } from "history";

// Pages -> home, waiting, game
// components -> main determines if home or room
// room -> determines if game or wait

// const useQuery = (): URLSearchParams => {
//   return new URLSearchParams(useLocation().search);
// };

const history = createBrowserHistory();

const Main = () => {
  const [roomID, setRoomID] = useState("");
  const [username, setUsername] = useState("");

  const params = new URLSearchParams(window.location.search);
  const id = params.get("roomID");
  console.log(params, id, window.location, window.location.search);

  useEffect(() => {
    const checkRoomID = async () => {
      let res = await axios.get(`http://localhost:5000/?roomID=${id}`);
      console.log(id);
      if (res.status === 200) setRoomID(roomID!);
    };

    checkRoomID();
  }, []);

  return (
    <div>
      {id ? (
        <Room roomID={roomID} username={username} />
      ) : (
        <Create setUser={setUsername} />
      )}
    </div>
  );
};

export default Main;