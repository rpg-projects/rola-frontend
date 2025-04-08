import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom"; // To get the room name from the URL
import io from "socket.io-client"; // Socket.io for real-time communication

import "./room.css";
import { useAuthUser } from "react-auth-kit";
import { LogoBox } from "../logo-box/logoBox";

// Define types for your data
interface Message {
  user: string;
  content: string;
  timestamp: number;
}

// Connect to the server using socket.io
const socket = io("http://localhost:8080"); // Make sure to use the correct backend URL

const Room = () => {
  const auth = useAuthUser();
  const id = auth()!.id;
  const playerId = auth()!.playerId;

  const { roomName } = useParams<{ roomName: string }>(); // Get the room name from the URL
  const [messages, setMessages] = useState<Message[]>([]); // Store messages
  const [newMessage, setNewMessage] = useState(""); // Store the new message input

  useEffect(() => {
    // Listen for incoming messages from other users in the room
    socket.on("receive_message", (data: Message) => {
      console.log("Received message:", data); // Log the entire message
      console.log("Timestamp:", data.timestamp); // Log timestamp separately for debugging
      setMessages((prevMessages) => [...prevMessages, data]);
    });

    // Join the room when the component mounts
    socket.emit("join_room", roomName);

    return () => {
      // Clean up when the component unmounts
      socket.off("receive_message");
      socket.emit("leave_room", roomName); // Optional: Notify when leaving the room
    };
  }, [roomName]);

  const sendMessage = () => {
    if (newMessage.trim()) {
      const message: Message = {
        user: playerId, // You can replace this with dynamic user data
        content: newMessage,
        timestamp: Date.now(),
      };

      // Emit the message to the server with room name
      socket.emit("send_message", { roomName, message });

      // Optionally clear the input field after sending
      setNewMessage("");
    }
  };

  // Handle keydown event to trigger sendMessage on Enter key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  return (
    <div className="outer-container-rooms">
      <div className="room-container">
        <LogoBox style={{ marginTop: "10px" }} className="custom-logo-box" />
        <h1>Sala: {roomName}</h1>

        {/* Messages container */}
        <div className="messages-container">
          {messages.map((message, index) => (
            <div key={index} className="message">
              <strong>{message.user}</strong>: {message.content}
              <span className="timestamp">
                {" "}
                ({new Date(message.timestamp).toLocaleTimeString()})
              </span>
            </div>
          ))}
        </div>

        {/* Message input container */}
        <div className="message-input-container">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escreva aqui..."
          />
          <button onClick={sendMessage}>Enviar</button>
        </div>
      </div>
    </div>
  );
};

export default Room;
