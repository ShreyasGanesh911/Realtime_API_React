import{ useEffect, useRef, useState } from 'react'
import SessionControls from './SessionControls';
import { sales_script } from '../assets/script';
import MessageBubble from './MessageBubble';
import { Message,AssistantMessage,EventMessage } from "../types/types";
const page = () => {
  const [isSessionActive, setIsSessionActive] = useState<boolean>(false);
  const [events, setEvents] = useState<any[]>([]);
  const [dataChannel, setDataChannel] = useState<RTCDataChannel | null>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const audioElement = useRef<HTMLAudioElement | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([
    { text: `Welcome! 👋 \n\nTo get started, press the <span class="text-blue-500 hover:text-blue-600 hover:cursor-pointer">Start Assessment</span> button.`, isUser: false, timestamp: new Date() },
  ]);
  async function startSession() {
    // Get a session token for OpenAI Realtime API
    const tokenResponse = await fetch("http://localhost:8000/token");
    if (!tokenResponse.ok) {
      console.error("Failed to fetch token:", tokenResponse.statusText);
      return;
    }
    const data = await tokenResponse.json();
    const EPHEMERAL_KEY = data.client_secret.value;

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
  }
  
  function stopSession() {
    // Close the data channel if it exists
    if (dataChannel) {
      dataChannel.close();
    }

    // Stop all media senders (tracks) for the peer connection
    peerConnection.current?.getSenders().forEach((sender) => {
      if (sender.track) {
        sender.track.stop();
      }
    });

    // Close the peer connection
    if (peerConnection.current) {
      peerConnection.current.close();
    }

    // Reset session state
    setIsSessionActive(false);
    setDataChannel(null);
    peerConnection.current = null;
  }

  function sendClientEvent(message: EventMessage) {
    if (dataChannel) {
      const timestamp = new Date().toLocaleTimeString();
      message.event_id = message.event_id || crypto.randomUUID();

      // Send event before setting timestamp since the backend peer doesn't expect this field
      dataChannel.send(JSON.stringify(message));

      // Guard just in case the timestamp exists by miracle
      if (!message.timestamp) {
        message.timestamp = timestamp;
      }

      setEvents((prev) => [message, ...prev]);
    } else {
      console.error(
        "Failed to send message - no data channel available",
        message
      );
    }
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
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  // useEffect(() => {
  //   if (dataChannel) {
  //     // Append new server events to the list
  //     dataChannel.addEventListener("message", (e) => {
  //       const event = JSON.parse(e.data);
  //       if (!event.timestamp) {
  //         event.timestamp = new Date().toLocaleTimeString();
  //       }

  //       setEvents((prev) => [event, ...prev]);
  //     });

  //     // Set session active when the data channel is opened
  //     dataChannel.addEventListener("open", () => {
  //       setIsSessionActive(true);
  //       setEvents([]);
      
  //       const systemEvent: EventMessage = {
  //         type: "conversation.item.create",
  //         item: {
  //           type: "message",
  //           role: "user",
  //           content: [
  //             {
  //               type: "input_text",
  //               text: "Hi, tell me a joke",
  //             },
  //           ],
  //         },
  //       };
      
  //       // ✅ Delay sending a bit to avoid race condition
  //       setTimeout(() => {
  //         sendClientEvent(systemEvent);
  //       },500); // 100ms is safe
  //     });
  //   }
  // }, [dataChannel]);

  // useEffect(() => {
  //   if (dataChannel) {
  //     // Append new server events to the list
  //     dataChannel.addEventListener("message", (e) => {
  //       const event = JSON.parse(e.data);
  //       if (!event.timestamp) {
  //         event.timestamp = new Date().toLocaleTimeString();
  //       }

  //       setEvents((prev) => [event, ...prev]);
  //     });

  //     // Set session active when the data channel is opened
  //     dataChannel.addEventListener("open", () => {
  //       setIsSessionActive(true);
  //       setEvents([]);
      
  //       const systemEvent: EventMessage = {
  //         type: "conversation.item.create",
  //         item: {
  //           type: "message",
  //           role: "user",
  //           content: [
  //             {
  //               type: "input_text",
  //               text: sales_script
  //             },
  //           ],
  //         },
  //       };
  //       setTimeout(() => {
  //         sendClientEvent(systemEvent);
         
  //       }, 500);
        
  //     });
  //   }
  // }, [dataChannel]);
  useEffect(() => {
    if (dataChannel) {
      // Log when the data channel is open
      dataChannel.addEventListener("open", () => {
        console.log("Data channel is open!");
        setIsSessionActive(true);
        setEvents([]);
       setTimeout(() => {
        sendTextMessage("Start Assessment"); // Send the initial message to start the assessment
       }, 2000); // Delay to ensure the data channel is open before sending the event
        // Send the system event after the data channel is open
        const systemEvent: EventMessage = {
          type: "conversation.item.create",
          item: {
            type: "message",
            role: "user",
            content: [
              {
                type: "input_text",
                text: sales_script
              },
            ],
          },
        };
        setTimeout(() => {
          console.log("Sending system event:", systemEvent);
          sendClientEvent(systemEvent);
        }, 100);
      });
  
      // Log the state of the data channel
      console.log("Data channel state:", dataChannel.readyState);
  
      // Listen for incoming messages from the data channel
      dataChannel.addEventListener("message", (e) => {
        const eventData:AssistantMessage = JSON.parse(e.data); // Store the raw event data for debugging
        if(e.data.type ==="conversation.item.created"){
          console.log("User text",eventData); // Log parsed event data
        }
        // console.log("User text", e.data);
        let transcript = eventData.response?.output[0]?.content[0]?.transcript; // Extract the transcript from the event data
        if(transcript) {
          console.log("Transcription", transcript); // Log parsed event data
          transcript = transcript.replace(/```html|```/g, "").trim();
          setMessages((prev) => [...prev, {isUser:false,text:transcript,timestamp:new Date()}]); // Store the event data in
        }
      });
    }
  
    // Cleanup when the component is unmounted or dataChannel is changed
    return () => {
      if (dataChannel) {
        dataChannel.removeEventListener("message", () => {});
        dataChannel.removeEventListener("open", () => {});
      }
    };
  }, [dataChannel]);
  
  return (
    <>
        <div className="flex justify-center items-start min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-[40%] relative h-[90vh] bg-white rounded-2xl shadow-lg">
        {/* Chat Messages Area */}
        <div ref={chatContainerRef} className="h-full overflow-y-auto pb-40 px-6 pt-6">
          {messages.map((message, index) => (
            <MessageBubble key={index} index={index} message={message}/>
          ))}
          <div ref={messagesEndRef} />
        </div>
        {/* Quick Reply Chips */}
        <div className="absolute bottom-5 left-0 py-2 right-0 px-6 bg-white mr-5">
          
            {/* {quickReplyOptions.map((option, index) => <MessageChips index={index} option={option} setInputText={setInputText}/>)} */}
            <SessionControls
              startSession={startSession}
              stopSession={stopSession}
              sendClientEvent={sendClientEvent}
              sendTextMessage={sendTextMessage}
              serverEvents={events}
              isSessionActive={isSessionActive}
            />
        
        </div>
        </div>
    </div>
    </>

  )
}

export default page
