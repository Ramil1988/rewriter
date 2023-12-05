import React, { useState } from "react";
import { OPENAI_API_KEY } from "./config.local";
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
  useClipboard,
  Flex,
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
  const { hasCopied, onCopy } = useClipboard(suggestions.join("\n"));
  const [highlightedText, setHighlightedText] = useState("");
  const [hasCopiedText, setHasCopiedText] = useState(false);

  const handleInputChange = (e) => {
    setText(e.target.value);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setErrorHighlights("");
    let instruction = `Please provide ${numSuggestions} separate suggestions for rewriting the following text: "${text}"`;

    try {
      const response = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
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
        .map(
          (suggestion) =>
            suggestion
              .replace(/^\d+\.\s*/, "") // Remove leading numbers and dots
              .replace(/^"|"$/g, "") // Remove leading and trailing quotes
        );

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
        "https://api.openai.com/v1/chat/completions",
        {
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
            <FancyHeading mb={7}>Write perfectly with AI</FancyHeading>
            <FlexWrapContainer direction="column" mb={1}>
              <Textarea
                bg="white"
                color="black"
                value={text}
                onChange={handleInputChange}
                placeholder="Enter your text"
                size="lg"
              />
              <Button
                colorScheme="red"
                size="sm"
                alignSelf="flex-end"
                mt={2}
                onClick={clearText}>
                Clear
              </Button>
            </FlexWrapContainer>
            <FlexWrapContainer>
              <Button
                colorScheme="blue"
                onClick={handleSubmit}
                isDisabled={!text}>
                Rewrite Text times:
              </Button>
              <Menu>
                <MenuButton
                  ml={1}
                  as={Button}
                  rightIcon={<FaChevronCircleDown />}>
                  {numSuggestions}
                </MenuButton>
                <MenuList>
                  {[1, 2, 3].map((number) => (
                    <MenuItem
                      key={number}
                      color="black"
                      onClick={() => setNumSuggestions(number)}>
                      {number}
                    </MenuItem>
                  ))}
                </MenuList>
              </Menu>
              <Button
                colorScheme="green"
                ml={4}
                onClick={handleCheckErrors}
                isDisabled={!text}>
                Check Errors
              </Button>
            </FlexWrapContainer>
            {isLoading ? (
              <SkeletonText mt="4" noOfLines={4} spacing="4" />
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
                        size="xs">
                        {hasCopiedText ? "Copied" : "Copy"}
                      </CopyButton>
                      <Button
                          colorScheme="red"
                          size="xs"
                          alignSelf="flex-end"
                          mt={2}
                          onClick={() => setHighlightedText("")}>
                          Delete </Button>
                    </ButtonContainer>
                  </HighlightedText>
                )}
                <FlexWrapContainer>
                  {suggestions.map((suggestion, index) => (
                    <SuggestionBox key={index}>
                      {suggestion}
                      <ButtonContainer>
                        <CopyButton
                          onClick={() => onCopy(suggestion)}
                          colorScheme="blue"
                          size="xs">
                          {hasCopied ? "Copied" : "Copy"}
                        </CopyButton>
                        <Button
                          colorScheme="red"
                          size="xs"
                          alignSelf="flex-end"
                          mt={2}
                          onClick={() => removeSuggestion(index)}>
                          Delete </Button>
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

const OuterContainer = styled.div`
  width: 100vw;
  height: 100vh;
  overflow-y: auto;
  background-image: url("./rewriter.png");
  background-size: cover;
  background-position: center center;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const AppContainer = styled.div`
  overflow: --x; 
  margin: auto 200px;
  height: 100%; 
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`;

const FlexWrapContainer = styled(Flex)`
  flex-wrap: wrap;
  gap: 5px;
  @media (max-width: 768px) {
    gap: 5px;
    width: 85vw;
  }
`;

const FancyHeading = styled(Heading)`
  font-size: 2.5rem;
  text-shadow: 1px 1px 4px rgba(0, 0, 0, 0.5);
  margin-bottom: 20px;
  animation: pulse 2s infinite ease-in-out;

  @keyframes pulse {
    0% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.2);
    }
    100% {
      transform: scale(1);
    }
  }
`;

const SuggestionBox = styled(Box)`
  flex: calc(33% - 1rem);
  margin: 0.5rem auto;
  padding: 1rem;
  background-color: #f7fafc;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  border-radius: 0.5rem;
  color: black;
  overflow: hidden;
  white-space: pre-wrap;
`;

const HighlightedText = styled.div`
  background-color: white;
  color: black;
  width: 50%;
  margin: 2rem auto;
  padding: 1rem;
  background-color: #f7fafc;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  border-radius: 0.5rem;
  color: black;
  overflow: hidden;
  white-space: pre-wrap;
  .added {
    background-color: #90ee90;
  }
  .removed {
    background-color: #ffcccb;
    text-decoration: line-through;
  }

  @media (max-width: 768px) {
    width: 80vw;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 10px;
  @media (max-width: 768px) {
   
    right: 5px;
    top: 5px;
    size: 'xs'; 
  }
`;

const CopyButton = styled(Button)`
  align-self: flex-end;
  @media (max-width: 768px) {
    flex-direction: column; 
    align-items: flex-end;
  }
`;

export default RewRitter;
