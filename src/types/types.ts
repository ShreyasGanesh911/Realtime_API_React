export type EventMessage = {
    event_id?: string;
    timestamp?: string;
    [key: string]: any;
  };
 export interface AssistantMessage {
    type:string
    response:{
      output: {
        content: {
          type: string;
          transcript: string;
        }[];
        
      }[];
    }
  }
 export interface Message {
    text: string;
    isUser: boolean;
    timestamp?: Date;
    id?: string;
    isComplete?: boolean;
  }