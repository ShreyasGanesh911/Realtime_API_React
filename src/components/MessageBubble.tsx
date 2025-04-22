interface Message {
    text: string;
    isUser: boolean;
    timestamp?: Date;
  }
type Props = {
    index: number
    message:Message
    currentText:string
}

function MessageBubble({index,message,currentText}:Props) {
  return (
    <>
        <div
              key={index}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} mb-4`}
            >
              <div
                className={`sm:max-w-[70%] max-w-[90%] p-3 xl:p-4 rounded-2xl shadow-sm
                  ${message.isUser 
                    ? 'bg-blue-600 text-white rounded-br-none ' 
                    : 'bg-gray-100 text-gray-800 rounded-bl-none text-sm '
                  }`}
              >
                {message.isUser ? (
                  message.text
                ) : (
                  <div className="" dangerouslySetInnerHTML={{ __html: currentText? currentText : message.text }} />
                )}
              </div>
            </div>
    </>
  )
}

export default MessageBubble
