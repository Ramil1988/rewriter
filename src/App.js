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
  CloseButton,
  useClipboard,
  Flex
} from "@chakra-ui/react";
import { FaChevronCircleDown } from "react-icons/fa";
import { ChakraProvider } from "@chakra-ui/react";

function RewRitter() {
  const [text, setText] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [numSuggestions, setNumSuggestions] = useState(1);
  const { hasCopied, onCopy } = useClipboard(suggestions.join("\n"));

  const handleInputChange = (e) => {
    setText(e.target.value);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    let instruction = `Please provide ${numSuggestions} separate suggestions for rewriting the following text: ${text}`;

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
      const rawSuggestions = data.choices[0].message.content.split("\n");
      const filteredSuggestions = rawSuggestions.filter(
        (suggestion) => suggestion.trim() !== ""
      );

      const processedSuggestions = filteredSuggestions.map((suggestion) =>
        suggestion.replace(/^\d+\.\s*/, "").replace(/^"|"$/g, "")
      );

      setSuggestions(processedSuggestions.slice(0, numSuggestions));

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
  };

  return (
    <ChakraProvider>
      <OuterContainer>
        <AppContainer>
          <Box textAlign="center" py={10} color="white">
            <FancyHeading mb={7}>Rewrite perfect with AI</FancyHeading>
            <Menu>
              <MenuButton as={Button} rightIcon={<FaChevronCircleDown />}>
                Number of Suggestions: {numSuggestions}
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
            <Box my={4}>
  <Flex flexDirection="column" alignItems="flex-end">
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
      mt={2}
      onClick={clearText}
    >
      Clear Text
    </Button>
  </Flex>
  <Button
    colorScheme="blue"
    my={5}
    onClick={handleSubmit}
    isDisabled={!text}
  >
    Get back from AI
  </Button>
</Box>
            {isLoading ? (
              <SkeletonText mt="4" noOfLines={4} spacing="4" />
            ) : (
              suggestions.map((suggestion, index) => (
                <SuggestionBox key={index}>
                  {suggestion}
                  <Button onClick={onCopy} colorScheme="blue" size="sm" m={2}>
                    {hasCopied ? "Copied" : "Copy"}
                  </Button>
                  <StyledCloseButton onClick={() => removeSuggestion(index)} />
                </SuggestionBox>
              ))
            )}
          </Box>
        </AppContainer>
      </OuterContainer>
    </ChakraProvider>
  );
}

const OuterContainer = styled.div`
  min-height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-image: url("./rewriter.png");
  background-size: cover;
  background-position: center center;
  background-attachment: fixed;
  text-align: center;
`;

const AppContainer = styled.div`
  width: 50vw;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
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
  width: 80%;
  margin: 2rem auto;
  padding: 1rem;
  padding-right: 3rem;
  background-color: #f7fafc;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  border-radius: 0.5rem;
  position: relative;
  color: black;
  overflow: hidden;
`;

const StyledCloseButton = styled(CloseButton)`
  position: absolute;
  right: 1rem;
  top: 1rem;
`;

export default RewRitter;