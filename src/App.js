import React, { useState } from "react";
import styled from "styled-components";
import {
  Heading,
  Button,
  Box,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Textarea,
  SkeletonText,
  Flex,
  Spinner,
} from "@chakra-ui/react";
import { FaChevronCircleDown } from "react-icons/fa";
import { ChakraProvider } from "@chakra-ui/react";
import { diffWords } from "diff";

function RewRitter() {
  const [text, setText] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [errorHighlights, setErrorHighlights] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [numSuggestions, setNumSuggestions] = useState(1);
  const [highlightedText, setHighlightedText] = useState("");
  const [hasCopiedText, setHasCopiedText] = useState(false);
  const [copiedStatus, setCopiedStatus] = useState(
    new Array(suggestions.length).fill(false)
  );

  const handleInputChange = (e) => {
    setText(e.target.value);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setErrorHighlights("");
    let instruction = `Please provide ${numSuggestions} separate suggestions for rewriting the following text: "${text}"`;

    try {
      const response = await fetch(
        "/.netlify/functions/openai",
        {
          method: "POST",
          headers: {
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
        }
      );

      if (!response.ok) {
        const responseData = await response.json();
        console.error("OpenAI API Error:", responseData);
        throw new Error(`OpenAI API responded with status: ${response.status}`);
      }

      const data = await response.json();
      const rawSuggestions = data.choices[0].message.content.trim().split("\n");
      const filteredSuggestions = rawSuggestions
        .filter((suggestion) => suggestion.trim() !== "")
        .map((suggestion) => {
          return suggestion.replace(/^\d+\.\s*/, "").replace(/^"|"$/g, "");
        });

      setSuggestions(filteredSuggestions.slice(0, numSuggestions));
      setIsLoading(false);
    } catch (error) {
      console.error(error);
      setIsLoading(false);
    }
  };

  const handleCheckErrors = async () => {
    setIsLoading(true);
    setSuggestions([]);

    let instruction = `Please rewrite the following text with corrections if it has mistakes: "${text}".`;

    try {
      const response = await fetch(
        "/.netlify/functions/openai",
        {
          method: "POST",
          headers: {
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
        }
      );

      if (!response.ok) {
        const responseData = await response.json();
        console.error("OpenAI API Error:", responseData);
        throw new Error(`OpenAI API responded with status: ${response.status}`);
      }

      const data = await response.json();
      const correctedText = data.choices[0].message.content.replace(
        /^"|"$/g,
        ""
      ); // Remove leading and trailing quotes;
      const highlightedHtml = applyDiff(text, correctedText);
      setHighlightedText(highlightedHtml);

      setIsLoading(false);
    } catch (error) {
      console.error(error);
      setIsLoading(false);
    }
  };

  const removeSuggestion = (indexToRemove) => {
    setSuggestions(suggestions.filter((_, index) => index !== indexToRemove));
  };

  const clearText = () => {
    setText("");
    setSuggestions([]);
    setErrorHighlights("");
    setHighlightedText("");
  };

  const copyTextContent = () => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = highlightedText;
    let textToCopy = "";

    Array.from(tempDiv.childNodes).forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node;
        if (!element.classList.contains("removed")) {
          textToCopy += element.textContent;
        }
      } else if (node.nodeType === Node.TEXT_NODE) {
        textToCopy += node.textContent;
      }
    });

    navigator.clipboard.writeText(textToCopy).then(() => {
      setHasCopiedText(true);
      setTimeout(() => setHasCopiedText(false), 2000);
    });
  };

  const handleCopy = (textToCopy, index) => {
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopiedStatus((prevStatus) => {
        const newStatus = [...prevStatus];
        newStatus[index] = true;
        return newStatus;
      });

      setTimeout(() => {
        setCopiedStatus((prevStatus) => {
          const newStatus = [...prevStatus];
          newStatus[index] = false;
          return newStatus;
        });
      }, 2000);
    });
  };

  const applyDiff = (oldText, newText) => {
    const diffResult = diffWords(oldText, newText);
    return diffResult
      .map((part) => {
        const highlightClass = part.added
          ? "added"
          : part.removed
          ? "removed"
          : "";
        return `<span class="${highlightClass}">${part.value}</span>`;
      })
      .join("");
  };

  return (
    <ChakraProvider>
      <OuterContainer>
        <AppContainer>
          <Box textAlign="center" py={10} color="white">
            <SloganText>Write perfectly with AI</SloganText>
            <FlexWrapContainer direction="column" mb={1}>
              <Textarea
                bg="white"
                color="black"
                value={text}
                onChange={handleInputChange}
                placeholder="Enter your text to check/rewrite it"
                size="lg"
              />
              <Button
                colorScheme="red"
                size="sm"
                alignSelf="flex-end"
                mt={2}
                onClick={clearText}
              >
                Clear
              </Button>
            </FlexWrapContainer>
            <FlexWrapContainer>
              <Button
                colorScheme="blue"
                onClick={handleSubmit}
                isDisabled={!text}
              >
                Rewrite Text times:
              </Button>
              <Menu>
                <MenuButton
                  ml={1}
                  as={Button}
                  rightIcon={<FaChevronCircleDown />}
                >
                  {numSuggestions}
                </MenuButton>
                <MenuList>
                  {[1, 2, 3].map((number) => (
                    <MenuItem
                      key={number}
                      color="black"
                      onClick={() => setNumSuggestions(number)}
                    >
                      {number}
                    </MenuItem>
                  ))}
                </MenuList>
              </Menu>
              <Button
                colorScheme="green"
                ml={4}
                onClick={handleCheckErrors}
                isDisabled={!text}
              >
                Check Errors
              </Button>
            </FlexWrapContainer>
            {isLoading ? (
              <Spinner
                thickness="6px"
                speed="0.65s"
                emptyColor="gray.200"
                color="blue.500"
                size="xl"
                mt="30px"
              />
            ) : (
              <>
                {highlightedText && (
                  <HighlightedText>
                    <div
                      dangerouslySetInnerHTML={{ __html: highlightedText }}
                    />
                    <ButtonContainer>
                      <CopyButton
                        onClick={copyTextContent}
                        colorScheme="blue"
                        size="xs"
                      >
                        {hasCopiedText ? "Copied" : "Copy"}
                      </CopyButton>
                      <Button
                        colorScheme="red"
                        size="xs"
                        alignSelf="flex-end"
                        mt={2}
                        onClick={() => setHighlightedText("")}
                      >
                        Delete{" "}
                      </Button>
                    </ButtonContainer>
                  </HighlightedText>
                )}
                <FlexWrapContainer>
                  {suggestions.map((suggestion, index) => (
                    <SuggestionBox key={index}>
                      {suggestion}
                      <ButtonContainer>
                        <CopyButton
                          onClick={() => handleCopy(suggestion, index)}
                          colorScheme="blue"
                          size="xs"
                        >
                          {copiedStatus[index] ? "Copied" : "Copy"}
                        </CopyButton>
                        <Button
                          colorScheme="red"
                          size="xs"
                          alignSelf="flex-end"
                          mt={2}
                          onClick={() => removeSuggestion(index)}
                        >
                          Delete{" "}
                        </Button>
                      </ButtonContainer>
                    </SuggestionBox>
                  ))}
                </FlexWrapContainer>
              </>
            )}
          </Box>
        </AppContainer>
      </OuterContainer>
    </ChakraProvider>
  );
}

const SloganText = styled(Heading)`
  text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.3);
  margin-bottom: 30px;
  display: block;
  font-size: 3rem;
  font-weight: 700;
  color: white;
  letter-spacing: 0px;

  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const OuterContainer = styled.div`
  width: 100vw;
  min-height: 100vh;
  overflow-y: auto;
  background-image: url("./rewriter.png");
  background-size: cover;
  background-position: center center;
  background-attachment: fixed;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  position: relative;
`;

const AppContainer = styled.div`
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  position: relative;
  z-index: 1;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(15px);
  border-radius: 24px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  animation: fadeInUp 0.6s ease-out;

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (max-width: 768px) {
    padding: 20px;
    margin: 0 10px;
  }
`;

const FlexWrapContainer = styled(Flex)`
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;

  @media (max-width: 768px) {
    gap: 8px;
    width: 100%;
  }
`;

const SuggestionBox = styled(Box)`
  flex: calc(33% - 1rem);
  min-width: 280px;
  margin: 0.5rem;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-radius: 16px;
  color: #2d3748;
  overflow: hidden;
  white-space: pre-wrap;
  border: 1px solid rgba(200, 200, 200, 0.3);
  transition: all 0.3s ease;
  position: relative;
  animation: slideIn 0.4s ease-out;

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(15px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  }

  @media (max-width: 768px) {
    flex: 100%;
    min-width: unset;
    margin: 0.5rem 0;
  }
`;

const HighlightedText = styled.div`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  color: #2d3748;
  width: 65%;
  max-width: 800px;
  margin: 2rem auto;
  padding: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-radius: 16px;
  overflow: hidden;
  white-space: pre-wrap;
  border: 1px solid rgba(200, 200, 200, 0.3);
  transition: all 0.3s ease;
  animation: slideIn 0.4s ease-out;

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(15px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  }

  .added {
    background-color: #c6f6d5;
    padding: 2px 4px;
    border-radius: 3px;
    font-weight: 600;
  }

  .removed {
    background-color: #fed7d7;
    text-decoration: line-through;
    padding: 2px 4px;
    border-radius: 3px;
    opacity: 0.8;
  }

  @media (max-width: 768px) {
    width: 95%;
    padding: 1.5rem;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 16px;

  @media (max-width: 768px) {
    gap: 8px;
    flex-wrap: wrap;
  }
`;

const CopyButton = styled(Button)`
  align-self: flex-end;
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-end;
  }
`;

export default RewRitter;
