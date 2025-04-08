import React from "react";
import logo from "./logo.svg";
import "./App.css";
import styled from "styled-components";
import { Route, Routes } from "react-router-dom";
import { Login } from "./components/login/login";
import { Home } from "./components/home/Home";
import { RequireAuth } from "react-auth-kit";
import { Register } from "./components/register/register";
import Room from "./components/room/room";

const AppContainer = styled.div`
  width: 100%;
  height: 100%;
`;

function App() {
  return (
    <AppContainer>
      <Routes>
        <Route
          path="/"
          element={
            <RequireAuth loginPath="/login">
              <Home />
            </RequireAuth>
          }
        ></Route>
        <Route
          path="/room/:roomName"
          element={
            <RequireAuth loginPath="/login">
              <Room />
            </RequireAuth>
          }
        ></Route>
        <Route path="/login" element={<Login />}></Route>
        <Route path="/sign-up" element={<Register />}></Route>
      </Routes>
    </AppContainer>
  );
}

export default App;
