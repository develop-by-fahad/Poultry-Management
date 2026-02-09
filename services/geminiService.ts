
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { FarmState } from "../types";

// Using gemini-3-pro-preview for complex reasoning and strategic data analysis
export const getFarmInsights = async (farmData: FarmState) => {
  // Always use process.env.API_KEY directly as per guidelines
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    নিম্নলিখিত পোল্ট্রি খামারের ডেটা বিশ্লেষণ করুন এবং কৌশলগত পরামর্শ প্রদান করুন। অবশ্যই সব উত্তর বাংলা ভাষায় হতে হবে।
    Current Data Summary:
    - Transactions: ${JSON.stringify(farmData.transactions.slice(-20))}
    - Active Flocks: ${JSON.stringify(farmData.flocks)}
    - Inventory: ${JSON.stringify(farmData.inventory)}

    নিচের বিষয়গুলোতে ফোকাস করুন:
    ১. আর্থিক অবস্থা (লাভ/ক্ষতির প্রবণতা)।
    ২. সম্ভব হলে ফিড কনভার্সন রেশিও (FCR) অনুমান করুন।
    ৩. স্বাস্থ্য সতর্কতা (মুরগির মৃত্যুর হার বৃদ্ধি)।
    ৪. ইনভেন্টরি ম্যানেজমেন্ট (স্টক কমে যাওয়ার সতর্কতা)।
    
    Response must be in Bengali and follow this JSON structure with 'summary', 'warnings', and 'recommendations' keys.
  `;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description: "A summary of the current farm status in Bengali."
            },
            warnings: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "A list of critical warnings in Bengali."
            },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "A list of recommended actions in Bengali."
            }
          },
          required: ["summary", "warnings", "recommendations"]
        }
      }
    });

    // Access .text property directly (not as a method) and trim it
    const jsonStr = (response.text || '{}').trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      summary: "এই মুহূর্তে এআই পরামর্শ তৈরি করা সম্ভব হচ্ছে না।",
      warnings: ["আপনার ইন্টারনেট সংযোগ বা এপিআই কি (API Key) পরীক্ষা করুন।"],
      recommendations: ["ম্যানুয়ালি আপনার ফিড এবং ওষুধের স্টক যাচাই করুন।"]
    };
  }
};
