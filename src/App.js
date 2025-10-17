import React, { useState } from "react";
import styled from "styled-components";
import {
  Heading,
  Button,
  Box,
  Textarea,
  Flex,
  Spinner,
  Select,
} from "@chakra-ui/react";
import { ChakraProvider } from "@chakra-ui/react";
import { diffWords } from "diff";

function RewRitter() {
  const [text, setText] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedText, setHighlightedText] = useState("");
  const [hasCopiedText, setHasCopiedText] = useState(false);
  const [copiedStatus, setCopiedStatus] = useState(
    new Array(suggestions.length).fill(false)
  );
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isResultSpeaking, setIsResultSpeaking] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('en-US');

  const languages = [
    { code: 'en-US', name: 'English (US)' },
    { code: 'en-GB', name: 'English (UK)' },
    { code: 'es-ES', name: 'Spanish (Spain)' },
    { code: 'es-MX', name: 'Spanish (Mexico)' },
    { code: 'fr-FR', name: 'French' },
    { code: 'de-DE', name: 'German' },
    { code: 'it-IT', name: 'Italian' },
    { code: 'pt-BR', name: 'Portuguese (Brazil)' },
    { code: 'ru-RU', name: 'Russian' },
    { code: 'zh-CN', name: 'Chinese (Mandarin)' },
    { code: 'ja-JP', name: 'Japanese' },
    { code: 'ko-KR', name: 'Korean' },
    { code: 'ar-SA', name: 'Arabic' },
    { code: 'hi-IN', name: 'Hindi' },
  ];

  const handleInputChange = (e) => {
    setText(e.target.value);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setHighlightedText("");

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
                content: "You improve and rewrite text to make it clearer and better. Keep the same meaning but make it more polished and professional. IMPORTANT: Always respond in the same language as the input text. Do not translate or change the language."
              },
              {
                role: "user",
                content: `Improve this text: "${text}"`
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
      let rewrittenText = data.choices[0].message.content.trim().replace(/^"|"$/g, '');

      setSuggestions([rewrittenText]);
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

  // Voice Recognition (Speech-to-Text)
  const startListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognitionInstance = new SpeechRecognition();

    recognitionInstance.lang = selectedLanguage;
    recognitionInstance.continuous = true; // Changed to continuous so it doesn't stop automatically
    recognitionInstance.interimResults = true;

    recognitionInstance.onstart = () => {
      setIsListening(true);
    };

    recognitionInstance.onresult = (event) => {
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        }
      }

      if (finalTranscript) {
        setText(prevText => prevText + (prevText ? ' ' : '') + finalTranscript);
      }
    };

    recognitionInstance.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      setRecognition(null);
    };

    recognitionInstance.onend = () => {
      setIsListening(false);
      setRecognition(null);
    };

    recognitionInstance.start();
    setRecognition(recognitionInstance);
  };

  const stopListening = () => {
    if (recognition) {
      recognition.stop();
      setIsListening(false);
      setRecognition(null);
    }
  };

  // Text-to-Speech for main input text
  const speakText = (textToSpeak) => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported in your browser.');
      return;
    }

    // Stop any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = selectedLanguage; // Use the same language as voice input
    utterance.rate = 0.9;
    utterance.pitch = 1;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsResultSpeaking(false); // Stop result speaking if active
    };

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  // Text-to-Speech for result text (suggestions/corrections)
  const speakResultText = (textToSpeak) => {
    if (!('speechSynthesis' in window)) {
      alert('Text-to-speech is not supported in your browser.');
      return;
    }

    // Stop any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = selectedLanguage;
    utterance.rate = 0.9;
    utterance.pitch = 1;

    utterance.onstart = () => {
      setIsResultSpeaking(true);
      setIsSpeaking(false); // Stop main speaking if active
    };

    utterance.onend = () => {
      setIsResultSpeaking(false);
    };

    utterance.onerror = () => {
      setIsResultSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsResultSpeaking(false);
  };


  return (
    <ChakraProvider>
      <OuterContainer>
        <AppContainer>
          <Box textAlign="center" color="white">
            <SloganText>Write perfectly with AI</SloganText>

            <InputCard>
              <TextareaContainer>
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
                <VoiceControlsContainer>
                  <VoiceInputGroup>
                    <GroupLabel>Voice Input</GroupLabel>
                    <VoiceButtonsRow>
                      <Select
                        value={selectedLanguage}
                        onChange={(e) => setSelectedLanguage(e.target.value)}
                        size="sm"
                        bg="white"
                        color="#1a202c"
                        border="2px solid #E5E7EB"
                        borderRadius="8px"
                        maxW="140px"
                        fontSize="14px"
                        _focus={{
                          borderColor: "#3B82F6",
                          boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
                        }}
                      >
                        {languages.map((lang) => (
                          <option key={lang.code} value={lang.code}>
                            {lang.name}
                          </option>
                        ))}
                      </Select>
                      <Button
                        size="sm"
                        colorScheme={isListening ? "red" : "purple"}
                        onClick={isListening ? stopListening : startListening}
                        leftIcon={<span>{isListening ? "⏹️" : "🎤"}</span>}
                        minW="150px"
                        px="20px"
                        fontWeight="600"
                      >
                        {isListening ? "Stop" : "Dictate"}
                      </Button>
                    </VoiceButtonsRow>
                  </VoiceInputGroup>

                  <VoiceOutputGroup>
                    <GroupLabel>Voice Output</GroupLabel>
                    <Button
                      size="sm"
                      colorScheme={isSpeaking ? "red" : "teal"}
                      onClick={() => isSpeaking ? stopSpeaking() : speakText(text)}
                      isDisabled={!text}
                      leftIcon={<span>{isSpeaking ? "⏹️" : "🔊"}</span>}
                      minW="150px"
                      px="20px"
                      fontWeight="600"
                    >
                      {isSpeaking ? "Stop" : "Listen to Text"}
                    </Button>
                  </VoiceOutputGroup>
                </VoiceControlsContainer>
              </TextareaContainer>

              <ActionButtonsRow>
                <PrimaryButton
                  colorScheme="blue"
                  size="lg"
                  onClick={handleSubmit}
                  isDisabled={!text || isLoading}
                  leftIcon={<span>✨</span>}
                >
                  Improve Text
                </PrimaryButton>

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
                      <Button
                        size="sm"
                        colorScheme={isResultSpeaking ? "red" : "teal"}
                        onClick={() => {
                          if (isResultSpeaking) {
                            stopSpeaking();
                          } else {
                            // Extract text without HTML tags for speech
                            const tempDiv = document.createElement("div");
                            tempDiv.innerHTML = highlightedText;
                            const cleanText = Array.from(tempDiv.childNodes)
                              .filter(node => !node.classList || !node.classList.contains("removed"))
                              .map(node => node.textContent)
                              .join("");
                            speakResultText(cleanText);
                          }
                        }}
                        leftIcon={<span>{isResultSpeaking ? "⏹️" : "🔊"}</span>}
                      >
                        {isResultSpeaking ? "Stop" : "Listen"}
                      </Button>
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
                      Improved Text
                    </ResultsHeader>
                    <FlexWrapContainer>
                      {suggestions.map((suggestion, index) => (
                        <SuggestionBox key={index}>
                          <SuggestionText>{suggestion}</SuggestionText>
                          <ButtonContainer>
                            <Button
                              size="sm"
                              colorScheme={isResultSpeaking ? "red" : "teal"}
                              onClick={() => {
                                if (isResultSpeaking) {
                                  stopSpeaking();
                                } else {
                                  speakResultText(suggestion);
                                }
                              }}
                              leftIcon={<span>{isResultSpeaking ? "⏹️" : "🔊"}</span>}
                            >
                              {isResultSpeaking ? "Stop" : "Listen"}
                            </Button>
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

const TextareaContainer = styled.div`
  position: relative;
  margin-bottom: 20px;
`;

const StyledTextarea = styled(Textarea)`
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  line-height: 1.6;
`;

const VoiceControlsContainer = styled.div`
  display: flex;
  gap: 20px;
  margin-top: 16px;
  justify-content: space-between;
  align-items: flex-start;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 16px;
    align-items: center;
  }
`;

const VoiceInputGroup = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;

  @media (max-width: 768px) {
    align-items: center;
  }
`;

const VoiceOutputGroup = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;

  @media (max-width: 768px) {
    align-items: center;
  }
`;

const GroupLabel = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: #6B7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
`;

const VoiceButtonsRow = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 8px;
  }
`;

const LanguageSelector = styled(Select)`
  max-width: 140px;
  font-size: 14px;
  appearance: none;
  background-image: none;

  @media (max-width: 768px) {
    max-width: 100%;
  }
`;

const DictateButton = styled(Button)`
  min-width: 150px;
  font-weight: 600;
  padding: 0 20px;

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const ListenButton = styled(Button)`
  min-width: 150px;
  font-weight: 600;
  padding: 0 20px;

  @media (max-width: 768px) {
    width: 100%;
  }
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

const SuggestionText = styled.div`
  margin-bottom: 16px;
`;

export default RewRitter;
