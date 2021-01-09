import React, { useState, useEffect, useRef } from "react";
import { socket } from "../modules";
import { FormControl, Input, InputLabel, Button } from "@material-ui/core";

function Chat({ user, roomID }: { user: string; roomID: string }) {
  const [messages, setMessages] = useState<[string, string][]>([]);
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleMessage = (info: [string, string]) => {
    setMessages((messages) => [...messages, info]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message && message !== "") {
      setMessages([...messages, [user, message]]);
      let info = {
        roomID: roomID,
        user: user,
        message: message,
      };
      setMessage("");
      scrollToBottom();
      socket.emit("chat", info);
    }
  };

  useEffect(() => {
    socket.on("chat", handleMessage);
    return () => {
      socket.off("chat", handleMessage);
    };
  }, [messages]);

  return (
    <>
      <h2>Chat:</h2>
      <div className="messagesWrapper">
        {/* Add scroll functionality through CSS */}
        {messages.map((info, idx) => (
          <p key={idx}>
            {info[0]}: {info[1]}
          </p>
        ))}
        <div ref={messagesEndRef} />

        <form onSubmit={handleSubmit}>
          <FormControl>
            <Input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              inputProps={{
                pattern: "(?! )([^*?]| )+(?<! )",
                title: "Message cannot have leading or trailing spaces",
              }}
              id="message"
              name="message"
            />
            <br />
            <Button variant="contained" color="primary" type="submit">
              Send
            </Button>
          </FormControl>
        </form>
      </div>
    </>
  );
}

export default Chat;
