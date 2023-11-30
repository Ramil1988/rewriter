import { useState, useEffect } from "react";
import styled, { keyframes } from "styled-components";
import { OPENAI_API_KEY } from "./config.local";
import {
  Heading,
} from "@chakra-ui/react";

function ReWritter() {
  const [sentence, setSentence] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleSubmit = async () => {
    let instruction = `Provide up 5 alternatives of the ${sentence}.\n`;
    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "You are a helpful assistant.",
            },
            {
              role: "user",
              content: instruction,
            },
          ],
        }),
      });

      if (!response.ok) {
        const responseData = await response.json();
        console.error("OpenAI API Error:", responseData);
        throw new Error(`OpenAI API responded with status: ${response.status}`);
      }

      const data = await response.json();
      const suggestionText = data.choices[0].message.content.trim();
      const suggestionList = suggestionText.split("\n"); // Splitting suggestions assuming they are separated by new lines
      setSuggestions(suggestionList);
      setShowSuggestions(true);
    } catch (error) {
      console.error(error);
    }
  };

  const handleCopyText = (suggestion) => {
    navigator.clipboard
      .writeText(suggestion)
      .catch((err) =>
        console.error("Something went wrong when copying the text: ", err)
      );
  };

  const handleCloseSuggestions = () => {
    setShowSuggestions(false);
  };

  return (
    <AppContainer>
      <ContainerForSloganText>
        <SloganText>Write perfect with AI</SloganText>
      </ContainerForSloganText>
      <ContentContainer>
        <FormContainer>
          <InputField
            type="text"
            value={sentence}
            onChange={(e) => setSentence(e.target.value)}
            placeholder="Enter a sentence to paraphrase"
          />
          <SendButton onClick={handleSubmit} disabled={!sentence}>
            Get Suggestions
          </SendButton>
          {showSuggestions && suggestions.length > 0 && (
            <SuggestionsContainer>
              <CloseButton onClick={handleCloseSuggestions}>Close</CloseButton>
              {suggestions.map((suggestion, index) => (
                <Suggestion key={index}>
                  {suggestion}
                  <CopyButton onClick={() => handleCopyText(suggestion)}>
                    Copy
                  </CopyButton>
                </Suggestion>
              ))}
            </SuggestionsContainer>
          )}
        </FormContainer>
      </ContentContainer>
    </AppContainer>
  );
}

const SuggestionsContainer = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  background: white;
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 10px;
  width: 300px;
  box-shadow: 0px 8px 16px 0px rgba(0, 0, 0, 0.2);
  z-index: 5;
`;

const CloseButton = styled.button`
  background: #ff6b6b; // Example close button color
  color: white;
  float: right;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  padding: 5px 10px;
  margin-bottom: 10px;
`;

const Suggestion = styled.div`
  display: flex;
  justify-content: space-between;
  margin: 5px 0;
`;

const ContainerForSloganText = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
`;

const typing = keyframes`
  from {
    width: 0;
  }
  to {
    width: 100%;
  }
`;

const blinkCursor = keyframes`
  from, to {
    border-color: transparent;
  }
  50% {
    border-color: #204c84;
  }
`;

const SloganText = styled(Heading)`
  color: white;
  margin: 2rem;
  font-family: "Aeroport", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji",
    "Segoe UI Symbol";
  overflow: hidden;
  white-space: nowrap;
  animation: ${typing} 3s steps(60, end), ${blinkCursor} 0.5s step-end infinite;
  animation-fill-mode: forwards;
  display: block;
  @media (max-width: 1300px) {
    display: none;
  }
`;

const AppContainer = styled.div`
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0 auto;
  background: linear-gradient(
    to right,
    rgba(83, 200, 239, 0.8) 0%,
    rgba(81, 106, 204, 0.8) 96%
  );
  border-radius: 8px;
  padding-bottom: 50px;
`;

const ContentContainer = styled.div`
  display: flex;
  justify-content: space-between;
  justify-content: center;
  padding: 0 50px;
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: center;
  }
`;

const FormContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  & > h1,
  & > h2,
  & > h3 {
    color: white;
  }
  & > div {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  @media (max-width: 768px) {
    width: 95%;
    margin-top: 20px;
    & > h1,
    & > h2,
    & > h3 {
      font-size: 18px;
    }
  }
`;

const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(50px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const InputField = styled.input`
  padding: 10px 15px;
  width: 50vw;
  height: 50vh;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.3s ease, box-shadow 0.3s ease;
  &:focus {
    border-color: #3498db;
    box-shadow: 0 0 5px rgba(52, 152, 219, 0.5);
    outline: none;
  }
  &::placeholder {
    color: #b3b3b3;
  }
  &:hover {
    border-color: #b3b3b3;
  }
  @media (max-width: 768px) {
    width: 90%;
  }
`;

const SendButton = styled.button`
  padding: 20px;
  margin: 20px;
  cursor: pointer;
  background: linear-gradient(90deg, #3498db, #8e44ad);
  color: #ffffff;
  font-size: 20px;
  border: 1px solid #e5e5e5;
  border-radius: 4px;
  transition: background 0.3s ease;
  box-shadow: 0 10px 6px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05);
  &:hover {
    background: linear-gradient(90deg, #8e44ad, #3498db);
    box-shadow: 0 15px 10px rgba(81, 106, 204, 0.5);
  }
  &:disabled {
    background: gray;
  }
  @media (max-width: 768px) {
    width: 80%;
  }
`
const CopyButton = styled.button`
  margin: 20px;
  padding: 10px;
  cursor: pointer;
  background: linear-gradient(90deg, #3498db, #8e44ad);
  color: #ffffff;
  border: none;
  border-radius: 4px;
  transition: background-color 0.2s;
  &:hover {
    background: linear-gradient(90deg, #8e44ad, #3498db);
  }
`;
const PreformattedTextContainer = styled.pre`
  background-color: #ffffff;
  padding: 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
  line-height: 1.5;
  white-space: pre-wrap;
  overflow: hidden;
  border: 1px solid #dcdcdc;
`;
export default ReWritter;