import { useState } from "react";
import { CloudLightning, CloudOff} from "react-feather";
import Button from "./Button";

type SessionStoppedProps = {
  startSession: () => void;
};

function SessionStopped({ startSession }: SessionStoppedProps) {
  const [isActivating, setIsActivating] = useState(false);

  function handleStartSession() {
    if (isActivating) return;

    setIsActivating(true);
    startSession();
  }

  return (
    <div className="flex items-center justify-center w-full h-full mt-2 ">
      <Button
        onClick={handleStartSession}
        className={isActivating ? "bg-blue-300 text-blue-600" : "bg-white text-blue-600 hover:bg-blue-50"}
        icon={<CloudLightning height={18} />}
      >
        {isActivating ? "Starting Assessment..." : "Start Assessment"}
      </Button>
    </div>
  );
}

type SessionActiveProps = {
  stopSession: () => void;
  sendTextMessage: (message: string) => void;
};

function SessionActive({ stopSession, sendTextMessage }: SessionActiveProps) {
  const [message, setMessage] = useState("");

  function handleSendClientEvent() {
    sendTextMessage(message);
    setMessage("");
  }

  return (
    <div className="flex items-center justify-center w-full h-full gap-4 ">
      <div className="absolute bottom-1 left-0 right-0 bg-white mx-2 flex items-center justify-center">
        <div className="flex items-center gap-2 p-1 w-full bg-white rounded-full shadow-lg border border-gray-100 pr-5">
         <input onKeyDown={(e) => {if (e.key === "Enter" && message.trim()) {handleSendClientEvent();}}}
        type="text"
        placeholder="Type your message..."
        className="flex-1 px-4 py-4 bg-transparent  rounded-full text-gray-700 placeholder-gray-400 outline-none"
        value={message} onChange={(e) => setMessage(e.target.value)}/>

      <button onClick={() => {if (message.trim()) {handleSendClientEvent();}}}
        className="p-2 text-blue-500 hover:text-blue-800 transition-colors hover:cursor-pointer duration-200 disabled:text-gray-300">
         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
      </button>
      <button onClick={stopSession} className=" text-red-500 hover:cursor-pointer hover:text-red-600 pr-2"> <CloudOff height={19} /> </button>
          </div>
          </div>
    </div>
  );
}

type SessionControlsProps = {
  startSession: () => void;
  stopSession: () => void;
  sendClientEvent?: (event: any) => void; 
  sendTextMessage: (message: string) => void;
  serverEvents?: any; 
  isSessionActive: boolean;
};

export default function SessionControls({
  startSession,
  stopSession,
  sendTextMessage,
  isSessionActive,
}: SessionControlsProps) {
  return (
    <div className="flex gap-4  border-gray-200 h-full rounded-md">
      {isSessionActive ? (
        <SessionActive
          stopSession={stopSession}
          sendTextMessage={sendTextMessage}
        />
      ) : (
        <SessionStopped startSession={startSession} />
      )}
    </div>
  );
}
