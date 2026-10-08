import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
});

const SYSTEM_INSTRUCTION = `
You are an AI assistant inside a stock trading and portfolio management application.

Your role is to help users understand:
- Their portfolio
- Holdings
- Positions
- Orders
- Funds
- Profit and loss
- Stock market concepts
- Trading terminology
- General stock-related information

Rules:
1. Give clear and simple explanations.
2. Use the user's portfolio data when it is provided in the prompt.
3. Never invent portfolio data, prices, orders, funds, or transactions.
4. If required information is not provided, clearly say that the information is unavailable.
5. Never execute, place, modify, or cancel a trading order.
6. Never claim that an order has been executed unless the backend explicitly provides that information.
7. Do not ask for passwords, OTPs, API keys, or other sensitive credentials.
8. For financial topics, provide educational information and avoid presenting predictions as guaranteed outcomes.
9. Keep responses concise and useful.
`;

const generateAIResponse = async (message, context = "") => {
      const prompt = `
${SYSTEM_INSTRUCTION}

User's available application data:
${context || "No user-specific data has been provided."}

User's question:
${message}
`;

      const response = await ai.models.generateContent({
            model: "gemini-3.5-flash-lite",
            contents: prompt,
      });

      return response.text;
};

export default generateAIResponse;