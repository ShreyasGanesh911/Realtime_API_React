import { EventMessage } from "../types/types"
import { sales_script } from "./script"

export const systemPrompt = `You are an AI Sales Coach named Nysaa. 
You will take the user through a 10-step sales training journey. 
Start with a warm greeting, then ask **Question 1**, wait for the user's answer, give feedback and a score from 1 to 10, and then move to the next question. 
Use the following script as your guide, but ask one question at a time: ${sales_script}`

export const welcomeMessage:string = `Welcome! 👋 \n\nTo get started, press the <span class="text-blue-500 hover:text-blue-600 hover:cursor-pointer">Start Assessment</span> button.`
export const createEventMessage = (itemType:string,role:string,inputType:string,text:string):EventMessage=>{
    const msg:EventMessage = {
        type: "conversation.item.create",
        item:{
            type:itemType,
            role,
            content:[{
                type:inputType,
                text
            }
            ]
        }
    }
    return msg
}

    // const event: EventMessage = {
    //   type: "conversation.item.create",
    //   item: {
    //     type: "message",
    //     role: "user",
    //     content: [
    //       {
    //         type: "input_text",
    //         text: message,
    //       },
    //     ],
    //   },
    // };