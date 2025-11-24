import { GoogleGenerativeAI } from "@google/generative-ai";
import { DocumentItem } from "../types";

// Initialize the client dynamically
const getClient = (userApiKey?: string) => {
  // Prioritize the user-provided key, otherwise fallback to the environment variable
  // This allows users to override the server key with their own in the Settings
  const apiKey = userApiKey || process.env.API_KEY;
  
  if (userApiKey) {
    console.log("GeminiService: Using User API Key from Settings");
  } else if (process.env.API_KEY) {
    console.log("GeminiService: Using Server API Key from Environment");
  } else {
    console.warn("GeminiService: No API Key found!");
  }
  
  if (!apiKey) {
    console.warn("API Key is missing. AI features will not work.");
    return null;
  }
  return new GoogleGenerativeAI(apiKey);
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
  documents?: DocumentItem[],
  userApiKey?: string
): Promise<string> => {
  const genAI = getClient(userApiKey);
  
  if (!genAI) {
    return "Clé API manquante. Veuillez configurer votre clé API dans les paramètres ou vérifier la configuration du serveur.";
  }

  try {
    let systemInstruction = "Tu es Lumina, une assistante virtuelle intelligente, élégante et concise pour un portail d'entreprise. Réponds en français de manière professionnelle et utile.";

    // Inject document context if available using RAG logic
    if (documents && documents.length > 0) {
      const contextData = findRelevantContext(prompt, documents);
      systemInstruction += `\n\nCONTEXTE DOCUMENTAIRE (RAG) :
Tu disposes ci-dessous d'extraits de documents internes pertinents pour la question.

CONSIGNES STRICTES POUR LES RÉPONSES BASÉES SUR LES DOCUMENTS :
1. Utilise prioritairement ces informations pour répondre.
2. Si tu utilises une information venant d'un document, tu DOIS citer le nom du document (ex: [Source: NomDuFichier.pdf]).
3. À la toute fin de ta réponse, ajoute systématiquement une ligne "Sources utilisées :" listant les noms des documents consultés pour cette réponse.
4. Si l'information n'est pas dans les documents fournis, dis-le honnêtement et essaie de répondre avec tes connaissances générales en précisant que cela ne vient pas des documents.

EXTRAITS DES DOCUMENTS :
${contextData}`;
    }

    // Updated to gemini-2.5-flash to avoid 404 and deprecation errors
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      systemInstruction: systemInstruction
    });

    // Sanitize history: Gemini expects the first message to be from 'user'
    // We filter out any leading 'model' messages that might have slipped in
    const cleanHistory = history.map(h => ({
        role: h.role as "user" | "model",
        parts: h.parts.map(p => ({ text: p.text }))
    }));

    // Remove leading model messages if any
    while (cleanHistory.length > 0 && cleanHistory[0].role === 'model') {
        cleanHistory.shift();
    }

    const chat = model.startChat({
      history: cleanHistory
    });

    const result = await chat.sendMessage(prompt);
    return result.response.text() || "Désolé, je n'ai pas pu générer de réponse.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Une erreur est survenue lors de la communication avec l'IA. (Erreur: Modèle introuvable ou clé invalide).";
  }
};