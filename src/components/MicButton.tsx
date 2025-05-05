import { Mic, MicOff } from 'react-feather'
type Props = {
    isMicActive:boolean,
    enableMicrophone:(e: React.MouseEvent | React.TouchEvent)=>void,
    disableMicrophone:(e: React.MouseEvent | React.TouchEvent)=>void
}
function MicButton({enableMicrophone,disableMicrophone,isMicActive}:Props) {
  return (
    <>
      <div  
                onContextMenu={(e) => e.preventDefault()}
                onPointerDown={enableMicrophone}
                onPointerUp={disableMicrophone}
                onPointerLeave={disableMicrophone}
                className={`
                  absolute sm:right-24 right-20 mr-2 bottom-6.5 p-3
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
                    <Mic size={16} className="animate-bounce" />
                    <div className="absolute -inset-1 bg-blue-500 rounded-full opacity-30 animate-ping" />
                  </div>
                ) : (
                  <MicOff size={16} />
                )}
              </div>
    </>
  )
}

export default MicButton