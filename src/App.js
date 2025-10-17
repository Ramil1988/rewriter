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
  const [writingStyle, setWritingStyle] = useState("Professional");
  const [lastRewrittenText, setLastRewrittenText] = useState("");
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
    setHighlightedText("");

    const stylePrompts = {
      Professional: {
        system: "You rewrite text for business settings. Use clear, polished language. Professional but not overly formal. Example: 'I would like to discuss the project timeline with you.'",
        user: `Rewrite this for a business/professional setting. Keep it polished but approachable: "${text}"`
      },
      Casual: {
        system: "You rewrite text casually, like texting a friend. Use contractions (I'm, you're, it's). Relaxed and conversational. Example: 'Hey, wanna grab coffee later?'",
        user: `Rewrite this like you're texting a friend. Be casual and relaxed: "${text}"`
      },
      Formal: {
        system: "You rewrite text in formal, traditional style. No contractions. Structured sentences. Sophisticated vocabulary. Example: 'I would be honoured to attend the ceremony.'",
        user: `Rewrite this in a VERY formal, traditional style. No contractions. Sophisticated: "${text}"`
      },
      Friendly: {
        system: "You rewrite text in a warm, friendly way. Enthusiastic and kind. Show warmth. Example: 'I'd love to help you with that! Let me know what you need!'",
        user: `Rewrite this in a warm, friendly, enthusiastic way: "${text}"`
      },
      Academic: {
        system: "You rewrite text in scholarly, academic style. Objective, precise, research-oriented. Example: 'The findings suggest a correlation between the variables examined.'",
        user: `Rewrite this in academic, scholarly style. Objective and precise: "${text}"`
      },
      Simple: {
        system: "You rewrite text using ONLY basic, simple words that a child would understand. Short sentences. No big words. Example: 'Can we make an app to help you write reports each week?'",
        user: `Rewrite this using ONLY simple words. Pretend you're explaining to a 10-year-old. Use basic words only: "${text}"`
      }
    };

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
                content: stylePrompts[writingStyle].system
              },
              {
                role: "user",
                content: stylePrompts[writingStyle].user
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
      const rewrittenText = data.choices[0].message.content.trim().replace(/^"|"$/g, "");

      setSuggestions([rewrittenText]);
      setLastRewrittenText(text);
      setIsLoading(false);
    } catch (error) {
      console.error(error);
      setIsLoading(false);
    }
  };

  const handleCheckErrors = async () => {
    setIsLoading(true);
    setSuggestions([]);

    let instruction = `Check the following text ONLY for grammar, spelling, and punctuation errors. If there are mistakes, provide the corrected version. If there are NO mistakes, return the text exactly as is. Do NOT rephrase or change the style, ONLY fix errors: "${text}"`;

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
                content: "You are a grammar and spelling checker. Your job is to ONLY fix errors without changing the writing style or rephrasing. If there are no errors, return the text unchanged.",
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

  const handleStyleChange = (newStyle) => {
    setWritingStyle(newStyle);
    // If there's already a rewrite visible, automatically rewrite with new style
    if (suggestions.length > 0 && lastRewrittenText) {
      // Small delay to let the dropdown close and show the new style
      setTimeout(() => {
        handleSubmit();
      }, 100);
    }
  };

  return (
    <ChakraProvider>
      <OuterContainer>
        <AppContainer>
          <Box textAlign="center" color="white">
            <SloganText>Write perfectly with AI</SloganText>

            <InputCard>
              <StyledTextarea
                value={text}
                onChange={handleInputChange}
                placeholder="Enter your text to check or rewrite..."
                size="lg"
                minH="150px"
                resize="vertical"
                bg="white"
                color="#1a202c"
                border="2px solid #E5E7EB"
                borderRadius="12px"
                fontSize="15px"
                _placeholder={{ color: "#9CA3AF" }}
                _focus={{
                  borderColor: "#3B82F6",
                  boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
                  outline: "none"
                }}
              />

              <ActionButtonsRow>
                <PrimaryButton
                  colorScheme="blue"
                  size="lg"
                  onClick={handleSubmit}
                  isDisabled={!text || isLoading}
                  leftIcon={<span>✨</span>}
                >
                  Rewrite as
                </PrimaryButton>

                <Menu>
                  <MenuButton
                    as={Button}
                    size="lg"
                    rightIcon={<FaChevronCircleDown />}
                    variant="outline"
                    bg="white"
                    color="black"
                    _hover={{ bg: "#F9FAFB" }}
                    minW="150px"
                  >
                    {writingStyle}
                  </MenuButton>
                  <MenuList bg="white" zIndex={1000}>
                    {["Professional", "Casual", "Formal", "Friendly", "Academic", "Simple"].map((style) => (
                      <MenuItem
                        key={style}
                        color="black"
                        onClick={() => handleStyleChange(style)}
                        _hover={{ bg: "#F3F4F6" }}
                        bg={writingStyle === style ? "#E5E7EB" : "white"}
                      >
                        {style}
                      </MenuItem>
                    ))}
                  </MenuList>
                </Menu>

                <SecondaryButton
                  colorScheme="green"
                  size="lg"
                  onClick={handleCheckErrors}
                  isDisabled={!text || isLoading}
                  leftIcon={<span>✓</span>}
                >
                  Check Errors
                </SecondaryButton>

                <Button
                  size="lg"
                  variant="ghost"
                  colorScheme="red"
                  onClick={clearText}
                  isDisabled={!text}
                >
                  Clear
                </Button>
              </ActionButtonsRow>
            </InputCard>

            {isLoading ? (
              <LoadingContainer>
                <Spinner
                  thickness="4px"
                  speed="0.65s"
                  emptyColor="gray.200"
                  color="blue.500"
                  size="xl"
                />
                <LoadingText>Processing your text...</LoadingText>
              </LoadingContainer>
            ) : (
              <>
                {highlightedText && (
                  <HighlightedText>
                    <ResultLabel>Corrected Text</ResultLabel>
                    <div
                      dangerouslySetInnerHTML={{ __html: highlightedText }}
                    />
                    <ButtonContainer>
                      <CopyButton
                        onClick={copyTextContent}
                        colorScheme="blue"
                        size="sm"
                      >
                        {hasCopiedText ? "✓ Copied" : "Copy"}
                      </CopyButton>
                      <Button
                        colorScheme="red"
                        size="sm"
                        variant="ghost"
                        onClick={() => setHighlightedText("")}
                      >
                        Remove
                      </Button>
                    </ButtonContainer>
                  </HighlightedText>
                )}

                {suggestions.length > 0 && (
                  <>
                    <ResultsHeader>
                      {writingStyle} Style Rewrite
                    </ResultsHeader>
                    <FlexWrapContainer>
                      {suggestions.map((suggestion, index) => (
                        <SuggestionBox key={index}>
                          <SuggestionNumber>{writingStyle} Version</SuggestionNumber>
                          <SuggestionText>{suggestion}</SuggestionText>
                          <ButtonContainer>
                            <CopyButton
                              onClick={() => handleCopy(suggestion, index)}
                              colorScheme="blue"
                              size="sm"
                            >
                              {copiedStatus[index] ? "✓ Copied" : "Copy"}
                            </CopyButton>
                            <Button
                              colorScheme="red"
                              size="sm"
                              variant="ghost"
                              onClick={() => removeSuggestion(index)}
                            >
                              Remove
                            </Button>
                          </ButtonContainer>
                        </SuggestionBox>
                      ))}
                    </FlexWrapContainer>
                  </>
                )}
              </>
            )}
          </Box>
        </AppContainer>
      </OuterContainer>
    </ChakraProvider>
  );
}

const SloganText = styled(Heading)`
  font-size: 4rem;
  font-weight: 800;
  color: white;
  letter-spacing: -0.02em;
  margin-bottom: 48px;
  text-shadow: 0 4px 12px rgba(0, 0, 0, 0.5),
               0 2px 4px rgba(0, 0, 0, 0.3);
  line-height: 1.1;

  @media (max-width: 768px) {
    font-size: 2.5rem;
    margin-bottom: 32px;
  }
`;

const OuterContainer = styled.div`
  width: 100vw;
  min-height: 100vh;
  overflow-y: auto;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 64px 24px;

  &::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: url("./rewriter.png");
    background-size: cover;
    background-position: center center;
    background-attachment: fixed;
    z-index: 0;
  }

  &::after {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.4);
    z-index: 1;
  }

  @media (max-width: 768px) {
    padding: 32px 16px;
  }
`;

const AppContainer = styled.div`
  max-width: 1000px;
  width: 100%;
  margin: 0 auto;
  position: relative;
  z-index: 2;
  animation: fadeInUp 0.5s ease-out;

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const FlexWrapContainer = styled(Flex)`
  flex-wrap: wrap;
  gap: 16px;
  justify-content: center;
  width: 100%;

  @media (max-width: 768px) {
    gap: 12px;
  }
`;

const SuggestionBox = styled(Box)`
  flex: 1 1 calc(50% - 16px);
  min-width: 300px;
  max-width: 100%;
  padding: 24px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  color: #1a202c;
  white-space: pre-wrap;
  word-wrap: break-word;
  border-left: 4px solid #3B82F6;
  transition: all 0.25s ease;
  animation: slideInUp 0.4s ease-out backwards;
  font-size: 15px;
  line-height: 1.6;

  @keyframes slideInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    border-left-color: #2563EB;
  }

  @media (max-width: 768px) {
    flex: 1 1 100%;
    min-width: unset;
  }
`;

const HighlightedText = styled.div`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  color: #1a202c;
  width: 100%;
  max-width: 800px;
  margin: 32px auto;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  white-space: pre-wrap;
  word-wrap: break-word;
  border-left: 4px solid #10B981;
  transition: all 0.25s ease;
  animation: slideInUp 0.4s ease-out;
  font-size: 15px;
  line-height: 1.6;

  @keyframes slideInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
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
    background-color: #90EE90;
    color: #006400;
    padding: 4px 8px;
    border-radius: 4px;
    font-weight: 700;
    text-decoration: underline;
    text-decoration-color: #006400;
    text-decoration-thickness: 2px;
  }

  .removed {
    background-color: #FFCCCB;
    color: #8B0000;
    text-decoration: line-through;
    padding: 4px 8px;
    border-radius: 4px;
    font-weight: 700;
    text-decoration-thickness: 2px;
  }

  @media (max-width: 768px) {
    margin: 24px auto;
    padding: 20px;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 16px;

  @media (max-width: 768px) {
    gap: 8px;
  }
`;

const CopyButton = styled(Button)`
  transition: all 0.2s ease;

  &:hover {
    transform: translateY(-1px);
  }

  &:active {
    transform: scale(0.98);
  }
`;

const InputCard = styled(Box)`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  margin-bottom: 32px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  position: relative;
  z-index: 10;

  @media (max-width: 768px) {
    padding: 24px;
    margin-bottom: 24px;
  }
`;

const StyledTextarea = styled(Textarea)`
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  line-height: 1.6;
`;

const ActionButtonsRow = styled(Flex)`
  gap: 12px;
  margin-top: 20px;
  flex-wrap: wrap;
  justify-content: center;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 10px;
  }
`;

const PrimaryButton = styled(Button)`
  font-weight: 600;
  min-width: 160px;

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const SecondaryButton = styled(Button)`
  font-weight: 600;
  min-width: 160px;

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  margin: 64px 0;
`;

const LoadingText = styled.p`
  color: white;
  font-size: 16px;
  font-weight: 500;
`;

const ResultsHeader = styled.h2`
  color: white;
  font-size: 24px;
  font-weight: 700;
  margin: 32px 0 24px;
  text-align: left;

  @media (max-width: 768px) {
    font-size: 20px;
    margin: 24px 0 16px;
  }
`;

const ResultLabel = styled.div`
  font-size: 14px;
  font-weight: 700;
  color: #10B981;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 12px;
`;

const SuggestionNumber = styled.div`
  font-size: 12px;
  font-weight: 700;
  color: #3B82F6;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 12px;
`;

const SuggestionText = styled.div`
  margin-bottom: 16px;
`;

export default RewRitter;
