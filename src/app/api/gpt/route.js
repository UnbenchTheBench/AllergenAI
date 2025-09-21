import { Agent } from "@mastra/core/agent";
import { google } from "@ai-sdk/google";
import dotenv from "dotenv";

dotenv.config();


const myAgent = new Agent({
  name: "My Agent",
  instructions: "You are a helpful assistant.",
  model: google("gemini-1.5-flash", {
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  }),
});