import React, { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "react-router-dom"; // To get the room name from the URL
import io from "socket.io-client"; // Socket.io for real-time communication
import axios from "axios";

import "./room.css";
import { useAuthUser } from "react-auth-kit";
import { LogoBox } from "../logo-box/logoBox";
import TreatMessage from "../../utils/treatMessage";

// Define types for your data
interface Message {
  user: string;
  content: string;
  timestamp: number;
  message_writer: "user" | "adm";
  color: string;
  char?: string;
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
  const [userColor, setUserColor] = useState("#d5a770"); // Store messages
  const [userChar, setUserChar] = useState(""); // Store the new message input

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await axios.get(`${backendUrl}/messages/room/${roomName}`);

        // Padroniza o formato
        const formattedMessages: Message[] = res.data.map((m: any) => ({
          user: m.player_id,
          content: m.text,
          timestamp: m.created_at,
          message_writer: m.message_writer || "user",
          color: m.color,
          char: m.char,
        }));

        setMessages(formattedMessages);

        const user = await axios.get(`${backendUrl}/users/${userId}`);
        setUserColor(user.data.color ?? userColor);
        setUserChar(user.data.char ?? userChar);
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

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages]); // toda vez que messages mudar

  const sendMessage = async () => {
    if (newMessage.trim()) {
      try {
        // tratar mensagem:
        const { color, char, finalMessage, newMessageWriter } = TreatMessage(
          userColor,
          userChar,
          newMessage
        );

        console.log("color :>> ", color);
        console.log("char :>> ", char);

        const response = await axios.post(`${backendUrl}/messages`, {
          room_name: roomName,
          player_id: playerId,
          user_id: userId,
          text: finalMessage,
          message_writer: newMessageWriter,
          color: userColor,
          char: userChar,
        });

        if (color !== userColor) setUserColor(color);
        if (char !== userChar) setUserChar(char);

        //color e char vão ter que vir da prop. active char e active color do user!!!
        console.log("userColor :>> ", userColor);
        console.log("userChar :>> ", userChar);

        // emitir para o socket
        socket.emit("send_message", {
          roomName,
          message: {
            user: playerId,
            content: finalMessage,
            timestamp: Date.now(),
            message_writer: newMessageWriter,
            char: userChar,
            color: userColor,
          },
        });

        //chamar o backend para atualizar userColor ou userChar se necessário

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
        <div className="messages-container" ref={containerRef}>
          {messages.map((message, index) => (
            <div key={index} className="message">
              {message.char !== "" ? (
                <>
                  <span
                    style={{
                      color: message.color,
                    }}
                  >
                    ({message.user})
                  </span>
                  <strong>{message.char}</strong>
                </>
              ) : (
                <strong style={{ color: message.color }}>{message.user}</strong>
              )}
              {message.message_writer === "user" ? <span>: </span> : " "}
              <span
                dangerouslySetInnerHTML={{ __html: message.content }}
              ></span>
              <span className="timestamp">
                {" "}
                (
                {new Date(message.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                )
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
          <button onClick={sendMessage}>ENVIAR</button>
        </div>
      </div>
    </div>
  );
};

export default Room;
