import express from 'express';
import cors from 'cors';
import "dotenv/config";
import { sales_script } from './assets/script.js';

const app = express();
app.use(cors());
const apiKey = process.env.OPENAI_API_KEY;
const port = 8000
app.get("/token", async (req, res) => {
    try {
      const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          response_format: "html", 
        },
        body: JSON.stringify({
          model: "gpt-4o-realtime-preview-2024-12-17",
          voice: "verse",
          
        }),
      });
  
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Token generation error:", error);
      res.status(500).json({ error: "Failed to generate token" });
    }
  });
  
  app.listen(port, () => {
    console.log(`Backend running on http://localhost:${port}`);
  });
