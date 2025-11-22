import { GoogleGenAI } from "@google/genai";
import { DocumentItem } from "../types";

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

// Helper: Clean and extract keywords from query
const extractKeywords = (text: string): string[] => {
  return text.toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "")
    .split(/\s+/)
    .filter(w => w.length > 2); // Filter out small words
};

/**
 * Client-side RAG (Retrieval Augmented Generation)
 * Instead of sending 20MB of text, we find relevant chunks based on the user query.
 */
const findRelevantContext = (query: string, documents: DocumentItem[]): string => {
  if (!documents || documents.length === 0) return "";

  // 1. Check total size. If small (< 30k chars), send everything as is.
  const totalSize = documents.reduce((acc, doc) => acc + doc.content.length, 0);
  if (totalSize < 30000) {
     return documents.map(d => `--- Document: ${d.name} (Type: ${d.type}) ---\n${d.content}`).join('\n\n');
  }

  // 2. For large content, use Chunking & Scoring
  const chunks: { text: string; source: string; score: number }[] = [];
  const CHUNK_SIZE = 2000; // ~500 tokens
  const OVERLAP = 200;
  const keywords = extractKeywords(query);

  // If no keywords (e.g. "Bonjour"), return a summary context
  if (keywords.length === 0) {
    return documents.map(d => `--- Document: ${d.name} ---\n${d.content.substring(0, 1000)}... [Contenu tronqué]`).join('\n\n');
  }

  documents.forEach(doc => {
    const content = doc.content;
    // Skip processing if document is empty
    if (!content) return;

    // Sliding window chunking
    for (let i = 0; i < content.length; i += (CHUNK_SIZE - OVERLAP)) {
      const chunkText = content.slice(i, i + CHUNK_SIZE);
      const lowerChunk = chunkText.toLowerCase();
      
      // Scoring: Count keyword occurrences
      let score = 0;
      keywords.forEach(word => {
        if (lowerChunk.includes(word)) {
          score += 1;
        }
      });

      // Only keep chunks with some relevance
      if (score > 0) {
        chunks.push({
          text: chunkText,
          source: doc.name,
          score: score
        });
      }
    }
  });

  // 3. Sort by relevance (score)
  chunks.sort((a, b) => b.score - a.score);

  // 4. Select top chunks (up to ~40k chars context limit)
  const selectedChunks = chunks.slice(0, 20);
  
  if (selectedChunks.length === 0) {
    // Fallback if no keywords match: return intro of each doc
    return documents.map(d => `--- Document: ${d.name} (Début) ---\n${d.content.substring(0, 1500)}...`).join('\n\n');
  }

  return selectedChunks
    .map(c => `--- Extrait pertinent de: ${c.source} (Pertinence: ${c.score}) ---\n${c.text}`)
    .join('\n\n');
};

export const generateAIResponse = async (
  prompt: string,
  history: { role: string; parts: { text: string }[] }[] = [],
  userApiKey?: string,
  documents?: DocumentItem[]
): Promise<string> => {
  const ai = getClient(userApiKey);
  if (!ai) return "Clé API manquante. Veuillez configurer votre clé API dans les Paramètres.";

  try {
    let systemInstruction = "Tu es Lumina, une assistante virtuelle intelligente, élégante et concise pour un portail d'entreprise. Réponds en français de manière professionnelle et utile.";

    // Inject document context if available using RAG logic
    if (documents && documents.length > 0) {
      const contextData = findRelevantContext(prompt, documents);
      systemInstruction += `\n\nIMPORTANT : Tu as accès aux extraits de documents internes ci-dessous (sélectionnés pour leur pertinence avec la question). Utilise ces informations pour répondre. Si l'information n'est pas dans le contexte, dis-le.\n\n${contextData}`;
    }

    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: systemInstruction,
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
    return "Une erreur est survenue lors de la communication avec l'IA. Si vos documents sont très volumineux, essayez de poser une question plus précise.";
  }
};