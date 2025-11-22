import { GoogleGenAI } from "@google/genai";

// Initialize the client dynamically
const getClient = (userApiKey?: string) => {
  // Priority: User Key > Environment Key
  const apiKey = userApiKey || process.env.API_KEY;
  
  if (!apiKey) {
    console.warn("API Key is missing. AI features will not work.");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateAIResponse = async (
  prompt: string,
  history: { role: string; parts: { text: string }[] }[] = [],
  userApiKey?: string
): Promise<string> => {
  const ai = getClient(userApiKey);
  if (!ai) return "Clé API manquante. Veuillez configurer votre clé API dans les Paramètres.";

  try {
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: "Tu es Lumina, une assistante virtuelle intelligente, élégante et concise pour un portail d'entreprise. Réponds en français de manière professionnelle et utile.",
      },
      history: history.map(h => ({
        role: h.role,
        parts: h.parts
      }))
    });

    const result = await chat.sendMessage({ message: prompt });
    return result.text || "Désolé, je n'ai pas pu générer de réponse.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Une erreur est survenue lors de la communication avec l'IA. Vérifiez votre clé API.";
  }
};