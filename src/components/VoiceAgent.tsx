import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ThemeToggle } from './ThemeToggle';
import { ChatInput } from './ChatInput';

interface Message {
  id: string;
  text: string;
  type: 'user' | 'agent';
  timestamp: Date;
}

export const VoiceAgent = () => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  
  const recognitionRef = useRef<any | null>(null);
  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setCurrentTranscript(transcript);

        // If the result is final, process it
        if (event.results[event.resultIndex].isFinal) {
          handleUserInput(transcript);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        if (!isProcessing && isMicEnabled) {
          // Restart listening automatically only if mic is enabled
          setTimeout(() => recognition.start(), 100);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      
      // Start listening automatically
      if (isMicEnabled) {
        recognition.start();
      }

      return () => {
        recognition.stop();
      };
    }
  }, [isMicEnabled]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleUserInput = async (transcript: string) => {
    if (transcript.trim() === '') return;

    setIsProcessing(true);
    setCurrentTranscript('');

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: transcript,
      type: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);

    // Simulate AI processing and generate response
    const agentResponse = await generateAgentResponse(transcript);
    
    const agentMessage: Message = {
      id: (Date.now() + 1).toString(),
      text: agentResponse,
      type: 'agent',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, agentMessage]);

    // Speak the response
    if (isAudioEnabled) {
      speakText(agentResponse);
    }

    setIsProcessing(false);
  };

  const generateAgentResponse = async (userInput: string): Promise<string> => {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Simple real estate agent responses
    const lowerInput = userInput.toLowerCase();
    
    if (lowerInput.includes('hello') || lowerInput.includes('hi')) {
      return "Hello! I'm your AI real estate agent. I'm here to help you find your dream home or answer any property-related questions. What can I assist you with today?";
    }
    
    if (lowerInput.includes('house') || lowerInput.includes('home')) {
      return "I'd be happy to help you with your home search! Are you looking to buy or sell? What's your preferred location and budget range?";
    }
    
    if (lowerInput.includes('price') || lowerInput.includes('cost')) {
      return "Property prices vary greatly depending on location, size, and amenities. Could you tell me more about the type of property and area you're interested in so I can provide more specific pricing information?";
    }
    
    if (lowerInput.includes('location') || lowerInput.includes('area')) {
      return "Location is key in real estate! I can help you explore different neighborhoods based on your preferences like schools, commute time, amenities, and lifestyle. What factors are most important to you?";
    }
    
    if (lowerInput.includes('mortgage') || lowerInput.includes('loan')) {
      return "I can connect you with trusted mortgage professionals and help you understand the home buying process. Getting pre-approved for a mortgage is usually the first step. Would you like me to explain the mortgage process?";
    }

    return "That's a great question! As your real estate agent, I'm here to help with all your property needs. Could you provide more details so I can give you the most helpful information?";
  };

  const speakText = (text: string) => {
    if (!window.speechSynthesis) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    speechSynthRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const toggleMic = () => {
    const newMicState = !isMicEnabled;
    setIsMicEnabled(newMicState);
    
    if (recognitionRef.current) {
      if (newMicState) {
        // Enable mic - start listening
        recognitionRef.current.start();
      } else {
        // Disable mic - stop listening
        recognitionRef.current.stop();
        setIsListening(false);
        setCurrentTranscript('');
      }
    }
  };

  const handleChatInput = (message: string) => {
    handleUserInput(message);
  };

  const getVoiceIndicatorClass = () => {
    if (!isMicEnabled) return 'bg-voice-muted';
    if (isProcessing) return 'bg-voice-processing shadow-voice animate-pulse';
    if (isListening) return 'bg-voice-listening shadow-voice animate-pulse';
    if (isSpeaking) return 'bg-voice-active shadow-voice animate-pulse';
    return 'bg-voice-muted';
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Voice AI Real Estate Agent - Demo
          </h1>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleMic}
              className={cn(
                "transition-colors",
                isMicEnabled ? "text-voice-active" : "text-voice-muted"
              )}
            >
              {isMicEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-20 pb-32 px-4">
        <div className="container mx-auto max-w-4xl">
          {/* Voice Status Indicator */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className={cn(
                "w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300",
                getVoiceIndicatorClass()
              )}>
                {isMicEnabled ? (
                  isListening ? (
                    <Mic className="h-12 w-12 text-white" />
                  ) : (
                    <Mic className="h-12 w-12 text-white opacity-70" />
                  )
                ) : (
                  <MicOff className="h-12 w-12 text-white" />
                )}
              </div>
              {/* Pulse rings */}
              {isMicEnabled && (isListening || isSpeaking || isProcessing) && (
                <>
                  <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                  <div className="absolute inset-2 rounded-full bg-primary/10 animate-ping animation-delay-75" />
                </>
              )}
            </div>
          </div>

          {/* Status Text */}
          <div className="text-center mb-8">
            <p className="text-lg font-medium text-foreground">
              {!isMicEnabled ? 'Type mode - Mic disabled' :
               isProcessing ? 'Processing...' :
               isListening ? 'Listening...' :
               isSpeaking ? 'Speaking...' :
               'Ready to help'}
            </p>
            {currentTranscript && isMicEnabled && (
              <p className="text-sm text-muted-foreground mt-2">
                "{currentTranscript}"
              </p>
            )}
          </div>

          {/* Chat Messages */}
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {messages.length === 0 && (
              <Card className="p-6 text-center bg-gradient-card">
                <p className="text-muted-foreground">
                  Start speaking to begin your conversation with the AI real estate agent!
                </p>
              </Card>
            )}
            
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.type === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                <Card className={cn(
                  "max-w-md p-4 shadow-card",
                  message.type === 'user' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-card text-card-foreground'
                )}>
                  <p className="text-sm">{message.text}</p>
                  <p className="text-xs opacity-70 mt-2">
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </Card>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input - appears when mic is disabled */}
          {!isMicEnabled && (
            <div className="mt-6">
              <ChatInput 
                onSendMessage={handleChatInput}
                disabled={isProcessing}
              />
            </div>
          )}
        </div>
      </div>

      {/* Instructions Footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-md border-t border-border p-4">
        <div className="container mx-auto text-center">
          <p className="text-sm text-muted-foreground">
            {isMicEnabled 
              ? "🎤 Speak naturally - I'm always listening and ready to help with your real estate needs!"
              : "💬 Type your message using the input above or click the mic button to enable voice mode"
            }
          </p>
        </div>
      </div>
    </div>
  );
};