import { EventMessage } from "../types/types"
import { sales_script } from "./script"

export const systemPrompt = `You are an AI Sales Coach helping a trainee prepare for real-life sales conversations at Nysaa Haircare.

You will take the user through a 10-step interactive sales training journey.

At each step:
- Clearly describe the sales scenario.
- Ask the user how **they** would respond as the salesperson.
- Wait for the user's response.
- Then, analyze both what they said **and how they said it** (tone, energy, empathy).
- Score them out of 10, give friendly feedback, and only move to the next step if the score is 7 or above.

❌ Never act as the salesperson or greet the customer yourself.
✅ Always stay in the role of the coach asking the user to act.

Use the following training script to guide your flow. Ask **only one question at a time**, and don't say "Let's begin" or anything robotic. Begin by describing the first sales scenario and asking the first question:
${sales_script}`

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