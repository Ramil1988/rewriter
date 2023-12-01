import { useState } from "react";
import { styled, keyframes } from "styled-components";
import { OPENAI_API_KEY } from "./config.local";
import {
  Heading,
  Button,
  Input,
  Box,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Textarea,
  SkeletonText,
} from "@chakra-ui/react";
import { FaChevronCircleDown } from "react-icons/fa";
import { ChakraProvider } from "@chakra-ui/react";

function ReWriter() {
  const [text, setText] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [choice, setChoice] = useState("Sentence");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    setIsLoading(true);
    let instruction = `Please provide ${
      choice === "Sentence" ? "5" : "3"
    } paraphrases of the ${choice.toLowerCase()}: "${text}".`;

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
      const suggestionText = data.choices[0].message.content.trim();
      const suggestionList = suggestionText.split("\n");
      setSuggestions(suggestionList);
      setIsLoading(false);
    } catch (error) {
      console.error(error);
      setIsLoading(false);
    }
  };

  return (
    <ChakraProvider>
      <AppContainer>
        <Box textAlign="center" py={10} color="white">
          <FancyHeading mb={7}>Write perfect with AI</FancyHeading>
          <Menu>
            <MenuButton as={Button} rightIcon={<FaChevronCircleDown />}>
              Rewrite my {choice}
            </MenuButton>
            <MenuList>
              <MenuItem onClick={() => setChoice("Sentence")} color="black">
                Sentence
              </MenuItem>
              <MenuItem onClick={() => setChoice("Paragraph")} color="black">
                Paragraph
              </MenuItem>
            </MenuList>
          </Menu>
          <Box my={4}>
            <Textarea
              bg="white"
              color="black"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={`Enter a ${choice.toLowerCase()} to paraphrase`}
              size="lg"
            />
            <Button
              colorScheme="blue"
              my={5}
              onClick={handleSubmit}
              isDisabled={!text}
            >
              Get Suggestions
            </Button>
          </Box>
          {suggestions.length > 0 && (
            <Box>
              {isLoading ? (
                <SkeletonText mt="4" noOfLines={4} spacing="4" />
              ) : (
                suggestions.map((suggestion, index) => (
                  <Box key={index} my={2} p={2} shadow="md" borderWidth="3px">
                    {suggestion}
                  </Box>
                ))
              )}
            </Box>
          )}
        </Box>
      </AppContainer>
    </ChakraProvider>
  );
}

const AppContainer = styled.div`
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
    } /* Slightly larger */
    100% {
      transform: scale(1);
    }
  }
`;

export default ReWriter;
