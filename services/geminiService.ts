
import { GoogleGenAI } from "@google/genai";

const getAIClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

/**
 * Helper untuk membersihkan data dari struktur sirkular sebelum ke Gemini
 */
const safeStringify = (data: any) => {
  try {
    const cache = new Set();
    return JSON.stringify(data, (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (cache.has(value)) return;
        cache.add(value);
      }
      return value;
    });
  } catch (e) {
    return String(data);
  }
};

export const generateNewsDraft = async (topic: string) => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Buatkan draf pengumuman RT yang formal dan ramah tentang topik berikut: ${topic}. Format dalam bahasa Indonesia yang baik dan santun.`,
    config: {
      temperature: 0.7,
      maxOutputTokens: 1000
    }
  });
  return response.text;
};

export const polishNews = async (content: string) => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Tolong perbaiki tata bahasa dan buat teks pengumuman RT berikut menjadi lebih profesional, berwibawa, namun tetap akrab bagi warga: "${content}"`,
  });
  return response.text;
};

export const polishComplaint = async (description: string) => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Tolong perbaiki tata bahasa dan buat teks aduan warga berikut menjadi lebih formal, sopan, dan jelas agar mudah dipahami pengurus: "${description}"`,
  });
  return response.text;
};

export const analyzeFinancialData = async (transactions: any[]) => {
  const ai = getAIClient();
  const cleanedData = safeStringify(transactions);
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Berikan analisis singkat dan saran finansial untuk data transaksi RT berikut dalam bahasa Indonesia yang santun: ${cleanedData}`,
  });
  return response.text;
};

export const analyzeImageContent = async (base64Image: string) => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { text: "Berikan deskripsi singkat satu kalimat dalam bahasa Indonesia formal tentang apa yang terjadi di foto kegiatan lingkungan ini untuk caption berita/galeri." },
        { inlineData: { mimeType: 'image/jpeg', data: base64Image } }
      ]
    }
  });
  return response.text;
};
