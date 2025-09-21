import { NextResponse } from "next/server";
import { Agent, createTool } from "@mastra/core";
import { google } from "@ai-sdk/google";
import { z } from "zod";

const sub_endpoint = `https://api.weatherapi.com/v1/forecast.json?key=${process.env.NEXT_PUBLIC_WEATHER_API_KEY}&q=`;

async function getWeatherInfo(location) {
  const endpoint = sub_endpoint + location + "&days=1";
  const response = await fetch(endpoint);

  if (!response.ok) {
    throw new Error(`Error fetching weather data: ${response.statusText}`);
  }
  const data = await response.json();
  return JSON.stringify(data);
}

async function getPollenInfo(location) {
  const [lat, lon] = location.split(","); 

  const res = await fetch(
    `https://api.ambeedata.com/latest/pollen/by-lat-lng?lat=${lat}&lng=${lon}`,
    {
      headers: {
        "x-api-key": process.env.AMBEE_API_KEY,
        "Content-Type": "application/json",
      },
    }
  );

  if (!res.ok) {
    throw new Error(`Error fetching pollen data: ${res.statusText}`);
  }

  const data = await res.json();
  return JSON.stringify(data);
}

const weatherTool = createTool({
  id: "Get Weather Information",
  description: "Fetches weather information for a specific location.",
  inputSchema: z.object({
    location: z.string().describe("The location"),
  }),
  outputSchema: z.string().describe("The weather information for the specified location."),
  execute: async (args) => {
    return await getWeatherInfo(args.location);
  },
});

const pollenTool = createTool({
  id: "Get Pollen Information",
  description: "Fetches pollen information for a specific location using Ambee API.",
  inputSchema: z.object({
    location: z.string().describe("Latitude and longitude of the location, comma-separated (lat,lon)"),
  }),
  outputSchema: z.string().describe("The pollen information for the specified location."),
  execute: async (args) => {
    return await getPollenInfo(args.location);
  },
});

const myAgent = new Agent({
  name: "Allergy Assistant",
  instructions: `You are an AI Allergist designed to help users understand allergies, their triggers, and ways to manage them. You specialize in common allergens such as pollen, dust, mold, pet dander, foods, insect stings, and environmental factors.

Your role is to:
• Provide clear, accurate explanations of allergy causes, symptoms, and prevention
• Suggest evidence-based strategies for minimizing exposure (e.g., pollen counts, cleaning tips, avoidance techniques)
• Explain over-the-counter treatment options (antihistamines, nasal sprays, eye drops) in general terms
• Encourage healthy habits that may help reduce allergy impact (air purifiers, masks, timing outdoor activities)
• Always remind users that you are not a substitute for a licensed medical professional and recommend they consult a doctor for diagnosis or treatment

Avoid:
• Giving direct prescriptions or medical dosages
• Acting as if you are replacing a healthcare provider
• Making up unsupported medical information

Tone: Empathetic, supportive, and easy to understand. Encourage users with practical steps and reliable allergy resources.

You have access to current weather and pollen information tools to provide relevant, location-specific advice.`,
  model: google("gemini-1.5-flash", {
    apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
  }),
  tools: [weatherTool, pollenTool],
});

export async function POST(req) {
  try {
    const { message } = await req.json();
    
    if (!message) {
      return NextResponse.json({ reply: "Please provide a message." }, { status: 400 });
    }

    const result = await myAgent.generate(message);

    return NextResponse.json({ reply: result.text });
  } catch (error) {
    console.error("Agent error:", error);
    return NextResponse.json({ reply: "⚠️ Something went wrong. Please try again." }, { status: 500 });
  }
}
