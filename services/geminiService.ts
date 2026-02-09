
import { GoogleGenAI, Type } from "@google/genai";
import { FarmState } from "../types";

export const getFarmInsights = async (farmData: FarmState) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const prompt = `
    Analyze the following poultry farm data and provide strategic insights.
    Current Data Summary:
    - Transactions: ${JSON.stringify(farmData.transactions.slice(-20))}
    - Active Flocks: ${JSON.stringify(farmData.flocks)}
    - Inventory: ${JSON.stringify(farmData.inventory)}

    Focus on:
    1. Financial health (Profit/Loss trends).
    2. Feed conversion ratio (FCR) estimation if possible.
    3. Health warnings (mortality spikes).
    4. Inventory management (low stock alerts).
    
    Provide the response in a structured JSON format with 'summary', 'warnings', and 'recommendations' keys.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            warnings: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["summary", "warnings", "recommendations"]
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      summary: "Unable to generate AI insights at this time.",
      warnings: ["Check your internet connection or API key."],
      recommendations: ["Manually review your feed and medicine stocks."]
    };
  }
};
