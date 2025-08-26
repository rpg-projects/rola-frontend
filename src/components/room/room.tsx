import React, { useState, useEffect, useRef } from "react";
import Select from "react-select";
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

const colorOptions = [
  { value: "#990000", label: "pra que essa violência toda?" },
  { value: "#D60033", label: "gritaria e dedo no cu!" },
  { value: "#DF0000", label: "soco soco bate bate!" },
  { value: "#FF6B00", label: "caraca, que calor!" },
  { value: "#FFA800", label: "aplaudindo o sol." },
  { value: "#D8AE40", label: "você quer uma medalha?" },
  { value: "#9F6C19", label: "valeu aí, campeão." },
  { value: "#50B64E", label: "grama do vizinho." },
  { value: "#0D6D36", label: "xuxa verde." },
  { value: "#09AF87", label: "nessa piscina aí..." },
  { value: "#0094FF", label: "ai que frio!" },
  { value: "#182ACD", label: "beber bastante líquido!" },
  { value: "#1C0059", label: "gótica e emo." },
  { value: "#5E17EB", label: "que bruxaria é essa?" },
  { value: "#A61DC8", label: "roxo." },
  { value: "#990763", label: "bons vinhos." },
  { value: "#FF5AC2", label: "rosa calcinha." },
  { value: "#FF004D", label: "rosa biquíni." },
  { value: "#FF5D41", label: "sushi sashimi." },
  { value: "#65637D", label: "discreto e fora do meio." },
];

const Room = () => {
  const auth = useAuthUser();

  const playerId = auth()!.playerId;
  const userId = auth()!.id;

  const { roomName } = useParams<{ roomName: string }>(); // Get the room name from the URL

  const [messages, setMessages] = useState<Message[]>([]); // Store messages
  const [newMessage, setNewMessage] = useState(""); // Store the new message input
  const [userColor, setUserColor] = useState("#d5a770"); // Store messages
  const [userChar, setUserChar] = useState(""); // Store the new message input
  const [showColorSelect, setShowColorSelect] = useState(false);

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

  const sendMessage = async (messageOverride?: string) => {
    const messageToSend = messageOverride ?? newMessage;
    console.log("messageToSend :>> ", messageToSend);

    if (messageToSend.trim()) {
      try {
        // tratar mensagem:
        const { color, char, finalMessage, newMessageWriter } = TreatMessage(
          userColor,
          userChar,
          messageToSend
        );

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
            timestamp: response.data.created_at ?? Date.now(),
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

  const handleInputChange = (value: string) => {
    setNewMessage(value);
    if (value === "/color") {
      setShowColorSelect(true);
    } else if (!value.startsWith("/color")) {
      setShowColorSelect(false);
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
                ({new Date(message.timestamp).toLocaleTimeString()})
              </span>
            </div>
          ))}
        </div>

        {/* Message input container */}
        <div className="message-input-wrapper">
          {showColorSelect && (
            <div className="suggestion-select">
              {colorOptions.map((option, idx) => (
                <div
                  key={idx}
                  className="color-option"
                  style={{
                    color: option.value,
                    cursor: "pointer",
                    padding: "4px",
                  }}
                  onMouseDown={() => {
                    sendMessage(`/color ${option.value} - ${option.label}`);
                    setShowColorSelect(false);
                  }}
                >
                  {option.label}
                </div>
              ))}
            </div>
          )}

          <div className="message-input-container">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escreva aqui..."
            />
            <button onClick={() => sendMessage()}>ENVIAR</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Room;
