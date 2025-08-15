import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom"; // To get the room name from the URL
import io from "socket.io-client"; // Socket.io for real-time communication
import axios from "axios";

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
const backendUrl =
  process.env.REACT_APP_ENV === "prod"
    ? process.env.REACT_APP_BACKEND_PROD_URL
    : process.env.REACT_APP_BACKEND_URL;

const socket = io(backendUrl); // Make sure to use the correct backend URL

const Room = () => {
  const auth = useAuthUser();

  const playerId = auth()!.playerId;
  const userId = auth()!.id;

  const { roomName } = useParams<{ roomName: string }>(); // Get the room name from the URL

  const [messages, setMessages] = useState<Message[]>([]); // Store messages
  const [newMessage, setNewMessage] = useState(""); // Store the new message input

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await axios.get(`${backendUrl}/messages/room/${roomName}`);

        // Padroniza o formato
        const formattedMessages: Message[] = res.data.map((m: any) => ({
          user: m.player_id || (m.user_id === userId ? playerId : m.user_id),
          content: m.text,
          timestamp: new Date(m.created_at).getTime(),
        }));

        setMessages(formattedMessages);
      } catch (err) {
        console.error("Erro ao carregar mensagens:", err);
      }
    };
    fetchMessages();

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

  // const sendMessage = async () => {
  //   if (newMessage.trim()) {
  //     const message: Message = {
  //       user: playerId, // You can replace this with dynamic user data
  //       content: newMessage,
  //       timestamp: Date.now(),
  //     };

  //     await axios.post(`${backendUrl}/messages`, {
  //       roomName,
  //       ...message,
  //     });
  //     // Emit the message to the server with room name
  //     socket.emit("send_message", { roomName, message });

  //     // Optionally clear the input field after sending
  //     setNewMessage("");
  //   }
  // };
  const sendMessage = async () => {
    if (newMessage.trim()) {
      try {
        const result = await axios.post(`${backendUrl}/messages`, {
          room_name: roomName,
          player_id: playerId,
          user_id: userId,
          text: newMessage,
        });

        const content = result.data.result
          ? `rolou um ${result.data.text.split(" ")[0]} ${
              result.data.text.split(" ")[1].split(" ")[0]
            } ${result.data.mod} e resultou em ${result.data.result} (${
              result.data.dice
            } ${result.data.text.split(" ")[1].split(" ")[0]} ${
              result.data.mod
            })`
          : newMessage;

        // emitir para o socket
        socket.emit("send_message", {
          roomName,
          message: {
            user: playerId,
            content,
            timestamp: Date.now(),
          },
        });

        setNewMessage("");
      } catch (err) {
        console.error("Erro ao enviar mensagem:", err);
      }
    }
  };

  // Handle keydown event to trigger sendMessage on Enter key press
  const handleKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault(); // impede reload ou submit
      await sendMessage();
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
                ({new Date(Number(message.timestamp)).toLocaleTimeString()})
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
