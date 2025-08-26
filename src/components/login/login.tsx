import { Button } from "baseui/button";

import { Container, ErrorText, InputWrapper, StyledInput } from "../commons";

import "./login.css";

import { useAuthUser, useSignIn } from "react-auth-kit";
import { useFormik } from "formik";
import axios, { AxiosError } from "axios";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogoBox } from "../logo-box/logoBox";

import loginImage from "../../assets/image-login.png";
// import * as Yup from "yup";

function Login(props: any) {
  const [error, setError] = useState("");
  const signIn = useSignIn();

  const navigate = useNavigate();

  // Check if user is already authenticated
  const auth = useAuthUser();

  useEffect(() => {
    if (auth()) {
      navigate("/"); // Redirect to home page if authenticated
    }
  }, [auth, navigate]);

  const onSubmit = async (values: any) => {
    setError("");

    try {
      const backendUrl =
        process.env.REACT_APP_ENV === "prod"
          ? process.env.REACT_APP_BACKEND_PROD_URL
          : process.env.REACT_APP_BACKEND_URL;

      const response = await axios.post(`${backendUrl}/auth/login`, values);

      //salva nos cookies e autentica
      signIn({
        token: response.data.token,
        expiresIn: 3600,
        tokenType: "Bearer",
        authState: {
          id: response.data.user_id,
          email: values.email,
          playerId: response.data.player_id,
        },
      });
      console.log("response :>> ", response);

      navigate("/");
    } catch (err) {
      if (err && err instanceof AxiosError)
        setError(err.response?.data.message);
      else if (err && err instanceof Error) setError(err.message);

      console.log("Error: ", err);
    }
  };

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    onSubmit,
  });

  return (
    <Container className="outer-cont">
      <div className="login-box">
        <LogoBox style={{ marginTop: "-.3rem", marginRight: ".6rem" }} />
        <div className="login-image">
          <img src={loginImage} alt="" />
        </div>
        <div className="login-form">
          <form onSubmit={formik.handleSubmit}>
            <h1 style={{ color: "#4b3931" }}>LOGIN</h1>
            <ErrorText>{error}</ErrorText>
            <InputWrapper
              style={{
                fontFamily: "Sorts Mill Goudy",
                color: "black",
              }}
            >
              <StyledInput
                name="email"
                value={formik.values.email}
                onChange={formik.handleChange}
                placeholder="Email"
                clearOnEscape
                size="large"
                type="email"
              />
            </InputWrapper>
            <InputWrapper
              style={{
                fontFamily: "Sorts Mill Goudy",
                marginBottom: "0.2rem",
              }}
            >
              <StyledInput
                name="password"
                value={formik.values.password}
                onChange={formik.handleChange}
                placeholder="Senha"
                clearOnEscape
                size="large"
                type="password"
              />
            </InputWrapper>
            <Link
              to="/sign-up"
              style={{
                color: "black",
                marginLeft: "1px",
                fontFamily: "'Inter', sans-serif",
              }}
            >
              cadastrar novo usuário
            </Link>
            <InputWrapper>
              <Button
                style={{
                  backgroundColor: "#DBC9B9",
                  border: "#908378 solid 3px",
                  width: "70%",
                  padding: ".8rem 1rem .6rem",
                }}
                className="login-button"
                size="large"
                kind="primary"
                isLoading={formik.isSubmitting}
              >
                <span style={{ color: "#4B3931" }}>ENTRAR</span>
              </Button>
            </InputWrapper>
          </form>
        </div>
      </div>
    </Container>
  );
}

export { Login };
