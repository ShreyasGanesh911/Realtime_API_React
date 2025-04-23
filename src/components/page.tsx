import{ useEffect, useRef, useState } from 'react'
import SessionControls from './SessionControls';
import { sales_script } from '../assets/script';
import MessageBubble from './MessageBubble';
import { Message,EventMessage } from "../types/types";
import { Mic, MicOff } from 'react-feather';

const page = () => {
  const [isSessionActive, setIsSessionActive] = useState<boolean>(false);
  const [currentText, setCurrentText] = useState<string>('');
  const [currentMessageId, setCurrentMessageId] = useState<string | null>(null);
  const [isMicActive, setIsMicActive] = useState<boolean>(false);
  const [events, setEvents] = useState<any[]>([]);
  const [dataChannel, setDataChannel] = useState<RTCDataChannel | null>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const audioElement = useRef<HTMLAudioElement | null>(null);
  const mediaStream = useRef<MediaStream | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([
    { text: `Welcome! 👋 \n\nTo get started, press the <span class="text-blue-500 hover:text-blue-600 hover:cursor-pointer">Start Assessment</span> button.`, isUser: false, timestamp: new Date() },
  ]);

  const enableMicrophone = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!peerConnection.current || !mediaStream.current) return;
    mediaStream.current.getTracks().forEach(track => {
      track.enabled = true;
    });
    setIsMicActive(true);
  };

  const disableMicrophone = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    if (!peerConnection.current || !mediaStream.current) return;
    mediaStream.current.getTracks().forEach(track => {
      track.enabled = false;
    });
    setIsMicActive(false);
  };

  async function startSession() {
    try {
         // Get a session token for OpenAI Realtime API
    const tokenResponse = await fetch("http://localhost:8888/token");
    if (!tokenResponse.ok) {
      console.error("Failed to fetch token:", tokenResponse.statusText);
      return;
    }
    const data = await tokenResponse.json();
    const EPHEMERAL_KEY = data.client_secret.value;
    console.log("Ephemeral Key:", EPHEMERAL_KEY);
    // Create a peer connection
    const pc = new RTCPeerConnection();
    // Set up to play remote audio from the model
    audioElement.current = document.createElement("audio");
    audioElement.current.autoplay = true;
    pc.ontrack = (e) => {
      if (audioElement.current) {
        audioElement.current.srcObject = e.streams[0];
      }
    };
    // Add local audio track for microphone input in the browser
    const ms = await navigator.mediaDevices.getUserMedia({
      audio: true,
    });
    // Start with microphone disabled
    ms.getTracks().forEach(track => {
      track.enabled = false;
    });
    mediaStream.current = ms;
    pc.addTrack(ms.getTracks()[0]);
    // Set up data channel for sending and receiving events
    const dc = pc.createDataChannel("oai-events");
    setDataChannel(dc);
    // Start the session using the Session Description Protocol (SDP)
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    const baseUrl = "https://api.openai.com/v1/realtime";
    const model = "gpt-4o-realtime-preview-2024-12-17";
    const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
      method: "POST",
      body: offer.sdp,
      headers: {
        Authorization: `Bearer ${EPHEMERAL_KEY}`,
        "Content-Type": "application/sdp",
      },
    });

    const answer: RTCSessionDescriptionInit = {
      type: 'answer',
      sdp: await sdpResponse.text(),
    };
    await pc.setRemoteDescription(answer);

    peerConnection.current = pc;
    setIsSessionActive(true);
    } catch (error) {
      console.error("Error starting session:", error);
    }
  }
  
  function stopSession() {
    // Close the data channel if it exists
    if (dataChannel) {
      dataChannel.close();
    }
    // Stop all media senders (tracks) for the peer connection
    if (mediaStream.current) {
      mediaStream.current.getTracks().forEach((track) => {
        track.stop();
      });
      mediaStream.current = null;
    }
    // Close the peer connection
    if (peerConnection.current) {
      peerConnection.current.close();
    }
    // Reset session state
    setIsSessionActive(false);
    setIsMicActive(false);
    setDataChannel(null);
    peerConnection.current = null;
    // Clean up audio element
    if (audioElement.current) {
      audioElement.current.srcObject = null;
    }
  }

  function sendClientEvent(message: EventMessage) {
    if (dataChannel) {
      const timestamp = new Date().toLocaleTimeString();
      message.event_id = message.event_id || crypto.randomUUID();
      // Send event before setting timestamp since the backend peer doesn't expect this field
      dataChannel.send(JSON.stringify(message));
      // Guard just in case the timestamp exists by miracle
      if (!message.timestamp) message.timestamp = timestamp;
    
      setEvents((prev) => [message, ...prev]);
    } else  console.error("Failed to send message - no data channel available",message);
    
  }
  function sendTextMessage(message: string) {
    setMessages([...messages, { isUser: true, text: message, timestamp: new Date() }]);
    const event: EventMessage = {
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [
          {
            type: "input_text",
            text: message,
          },
        ],
      },
    };
    sendClientEvent(event);
    sendClientEvent({ type: "response.create" });
  }

  const messageHandler = (e: MessageEvent) => {
    const eventData = JSON.parse(e.data);
    let transcript = eventData.response?.output[0]?.content[0]?.transcript; // Extract the transcript from the event data
    if(transcript) 
      console.log("Transcription", transcript);
    if (eventData.type === "input_audio_buffer.committed") {
      setMessages(prev => [...prev, { 
        id: eventData.event_id,
        isUser: true, 
        text: "🎤 Audio message sent", 
        timestamp: new Date() 
      }]);
    }
    if(eventData.type === "response.audio_transcript.delta") {
      const deltaText = eventData.delta;
      if (typeof deltaText === "string") {
        setMessages(prev => {
          // Check if we have a previous message from assistant
          const lastMessage = prev[prev.length - 1];
          
          // If no messages or last message is from user, create new one
          if (!lastMessage || lastMessage.isUser) {
            const newId = Date.now().toString();
            setCurrentMessageId(newId);
            setCurrentText(deltaText);
            return [...prev, { 
              id: newId,
              isUser: false, 
              text: deltaText, 
              timestamp: new Date() 
            }];
          }
          // Otherwise update the last message
          setCurrentText(prev => prev + deltaText);
          return prev.map((msg, index) => {
            if (index === prev.length - 1) {
              return { ...msg, text: msg.text + deltaText };
            }
            return msg;
          });
        });
      }
    }
    if (eventData.type === "response.done") {
      // Reset for next message
      setCurrentMessageId(null);
      setCurrentText('');
    }
  };
  useEffect(() => {
    if (dataChannel) {
      dataChannel.addEventListener("open", () => {
        // console.log("Data channel is open!");
        setIsSessionActive(true);
        setEvents([]);
        // Send the sales script once the channel is open
        const systemEvent: EventMessage = {
          type: "conversation.item.create",
          item: {
            type: "message",
            role: "system",
            content: [
              {
                type: "input_text",
                text: `
                  You are an AI Sales Coach named Nysaa. 
                  You will take the user through a 10-step sales training journey. 
                  Start with a warm greeting, then ask **Question 1**, wait for the user's answer, give feedback and a score from 1 to 10, and then move to the next question. 
                  Use the following script as your guide, but ask one question at a time: ${sales_script}
                `
              },
            ],
          },
        };
        
        sendClientEvent(systemEvent);
        // Send a message to the user to indicate the assessment has started
        const assistantMessageEvent: EventMessage = {
          type: "conversation.item.create",
          item: {
            type: "message",
            role: "assistant",
            content: [
              {
                type: "text",
                text: sales_script
              },
            ],
          },
        };
        setTimeout(() => {
          sendClientEvent(assistantMessageEvent);
        }, 300);
        setMessages([...messages, { isUser: true, text: "Starting assessment", timestamp: new Date() }]);
        sendClientEvent({ type: "response.create" });
      });
      dataChannel.addEventListener("message", messageHandler);
      return () => {
        dataChannel.removeEventListener("message", messageHandler);
      };
    }
  }, [dataChannel]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <>
        <div className="flex justify-center items-start min-h-screen bg-gray-50 p-4">
      <div className="w-full 2xl:max-w-[40%] xl:max-w-[70%] relative h-[95vh] bg-white rounded-2xl shadow-lg">
        <div ref={chatContainerRef} className="h-full overflow-y-auto pb-40 px-6 pt-6">
          {messages.map((message, index) => (
            <MessageBubble 
              key={message.id || index} 
              index={index} 
              message={message}
              currentText={message.id === currentMessageId ? currentText : message.text}
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
        <div className="absolute bottom-5 left-0 py-2 right-0 px-6 bg-white mr-5">
            <SessionControls
              startSession={startSession}
              stopSession={stopSession}
              sendClientEvent={sendClientEvent}
              sendTextMessage={sendTextMessage}
              serverEvents={events}
              isSessionActive={isSessionActive}
            />
            {isSessionActive && (
              <button
                onMouseDown={enableMicrophone}
                onMouseUp={disableMicrophone}
                onMouseLeave={disableMicrophone}
                onTouchStart={enableMicrophone}
                onTouchEnd={disableMicrophone}
                className={`
                  absolute sm:right-24 right-20 mr-2 bottom-4 p-3
                  rounded-full transition-all duration-300 ease-in-out
                  shadow-md hover:shadow-lg transform hover:scale-105
                  flex items-center justify-center
                  ${isMicActive 
                    ? 'bg-blue-500 text-white animate-pulse ring-4 ring-blue-300 ring-opacity-50' 
                    : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                  }
                  ${isMicActive ? 'scale-110' : 'scale-100'}
                `}
                style={{
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)'
                }}
              >
                {isMicActive ? (
                  <div className="relative">
                    <Mic size={18} className="animate-bounce" />
                    <div className="absolute -inset-1 bg-blue-500 rounded-full opacity-30 animate-ping" />
                  </div>
                ) : (
                  <MicOff size={18} />
                )}
              </button>
            )}
        </div>
        </div>
    </div>
    </>
  )
}

export default page
