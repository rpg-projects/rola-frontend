import axios, { AxiosError } from "axios";
import React, { useState, useEffect } from "react";
import { Button } from "baseui/button";
import { HeadingXXLarge } from "baseui/typography";
import { useNavigate } from "react-router-dom";
import { useSignOut, useAuthUser } from "react-auth-kit";
import { Container } from "../commons";
import { Link } from "react-router-dom"; // Import Link for navigation

import "./home.css";
import { LogoBox } from "../logo-box/logoBox";
import styled from "styled-components";

interface Room {
  _id: string;
  name: string;
  created_at: Date;
}

const CustomButton = styled(Button)`
  margin: 10px;
  padding: 8px 16px;
  color: white !important;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  position: absolute;
  bottom: 10px;
  right: 10px;
  background-color: #554f4b !important; /* Custom background */
`;

function Home() {
  const auth = useAuthUser();
  const signOut = useSignOut();
  const navigate = useNavigate();

  const [rooms, setRooms] = useState<Room[]>([]); // State to store the rooms
  const [loading, setLoading] = useState(true); // State to handle loading status
  const [error, setError] = useState(""); // State for errors

  const id = auth()!.id;
  const playerId = auth()!.playerId;

  const logout = () => {
    signOut();
    navigate("/login");
  };

  useEffect(() => {
    // Fetch rooms when the component mounts
    const fetchRooms = async () => {
      try {
        const response = await axios.get("http://localhost:8080/rooms", {
          withCredentials: true,
        });
        setRooms(response.data); // Set rooms with API response
      } catch (err) {
        console.log("Error fetching rooms:", err);
        setError("Error fetching rooms");
      } finally {
        setLoading(false); // Stop loading
      }
    };

    fetchRooms();
  }, []);

  if (loading) return <div>Loading rooms...</div>;
  if (error) return <div>{error}</div>;

  return (
    <Container className="outer-cont">
      <div className="container-home">
        <LogoBox style={{ marginTop: "10px" }} className="custom-logo-box" />
        <h1 className="titulo-home" color="secondary500">
          Olá {playerId[0] + playerId.slice(1).toLowerCase()}!
        </h1>
        <div className="lista-de-salas">
          <h1>Escolha uma sala:</h1>
          {rooms.length > 0 ? (
            <ul>
              {rooms.map((room) => (
                <li key={room._id}>
                  <Link to={`/room/${room.name}`}>
                    {/* Link englobando todo o elemento */}
                    {room.name}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p>Sem salas disponíveis</p>
          )}
        </div>

        <CustomButton
          style={{
            margin: "10px",
            padding: "8px 16px",
          }}
          className="logout-button-home"
          kind="secondary"
          onClick={logout}
        >
          Logout
        </CustomButton>
      </div>
    </Container>
  );
}

export { Home };
