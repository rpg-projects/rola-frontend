import { Button } from "baseui/button";
import { Input } from "baseui/input";
import styled from "styled-components";
import {
  HeadingXXLarge,
  HeadingXLarge,
  HeadingLarge,
  HeadingMedium,
  HeadingSmall,
  HeadingXSmall,
} from "baseui/typography";
import {
  Container,
  ErrorText,
  InnerContainer,
  InputWrapper,
  StyledInput,
} from "../commons";
import logo from "../../assets/logo.png";
import { useNavigate } from "react-router-dom";

import "./logoBox.css";

// import * as Yup from "yup";

function LogoBox({
  style,
  className,
}: {
  style?: React.CSSProperties;
  className?: string;
}) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate("/"); // Navigate to the home page
  };

  return (
    <div
      className={`box ${className || ""}`}
      style={style}
      onClick={handleClick}
    >
      <p className="nome">ROLA</p>
      <img className="img" src={logo} alt="Logo" />
    </div>
  );
}

export { LogoBox };
