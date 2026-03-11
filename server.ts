import express from "express";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Lazy initialization of Gemini
let genAI: GoogleGenAI | null = null;
function getGenAI() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set in environment variables.");
    }
    genAI = new GoogleGenAI({ apiKey });
  }
  return genAI;
}

// API Routes
app.post("/api/campaign", async (req, res) => {
  try {
    const { product, audience, platform } = req.body;
    const ai = getGenAI();
    
    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: `Generate a comprehensive marketing campaign for the following:
      Product: ${product}
      Target Audience: ${audience}
      Platform: ${platform}
      
      Provide a structured strategy including:
      1. Campaign Theme
      2. Key Messaging
      3. Content Ideas
      4. Success Metrics`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            theme: { type: Type.STRING },
            messaging: { type: Type.ARRAY, items: { type: Type.STRING } },
            contentIdeas: { type: Type.ARRAY, items: { type: Type.STRING } },
            metrics: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["theme", "messaging", "contentIdeas", "metrics"]
        }
      }
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    console.error("Campaign generation error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/pitch", async (req, res) => {
  try {
    const { product, problem, solution } = req.body;
    const ai = getGenAI();

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: `Generate a personalized 30-second sales pitch for:
      Product: ${product}
      Problem it solves: ${problem}
      Solution it provides: ${solution}
      
      Provide:
      1. The 30-second pitch
      2. Core Value Proposition
      3. Key Differentiators`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            pitch: { type: Type.STRING },
            valueProp: { type: Type.STRING },
            differentiators: { type: Type.ARRAY, items: { type: Type.STRING } },
          },
          required: ["pitch", "valueProp", "differentiators"]
        }
      }
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    console.error("Pitch generation error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/lead-score", async (req, res) => {
  try {
    const { budget, need, urgency, authority } = req.body;
    const ai = getGenAI();

    const response = await ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: `Evaluate and score this lead based on the BANT framework:
      Budget: ${budget}
      Need: ${need}
      Urgency: ${urgency}
      Authority: ${authority}
      
      Provide a score from 0-100 and a brief justification for each BANT category.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            justification: {
              type: Type.OBJECT,
              properties: {
                budget: { type: Type.STRING },
                need: { type: Type.STRING },
                urgency: { type: Type.STRING },
                authority: { type: Type.STRING },
              },
              required: ["budget", "need", "urgency", "authority"]
            }
          },
          required: ["score", "justification"]
        }
      }
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    console.error("Lead scoring error:", error);
    res.status(500).json({ error: error.message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
