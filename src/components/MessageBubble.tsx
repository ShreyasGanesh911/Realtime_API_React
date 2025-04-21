interface Message {
    text: string;
    isUser: boolean;
    timestamp?: Date;
  }
type Props = {
    index: number
    message:Message
}

function MessageBubble({index,message}:Props) {
  return (
    <>
        <div
              key={index}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} mb-4`}
            >
              <div
                className={`max-w-[70%] p-4 rounded-2xl shadow-sm
                  ${message.isUser 
                    ? 'bg-blue-600 text-white rounded-br-none' 
                    : 'bg-gray-100 text-gray-800 rounded-bl-none'
                  }`}
              >
                {message.isUser ? (
                  message.text
                ) : (
                  <div dangerouslySetInnerHTML={{ __html: message.text }} />
                )}
              </div>
            </div>
    </>
  )
}

export default MessageBubble
