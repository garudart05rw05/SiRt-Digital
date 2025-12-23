
import { GoogleGenAI } from "@google/genai";

// Always initialize with named parameter and use process.env.API_KEY directly
const getAIClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const generateNewsDraft = async (topic: string) => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Buatkan draf pengumuman RT yang formal dan ramah tentang topik berikut: ${topic}. Format dalam bahasa Indonesia yang baik.`,
    config: {
      temperature: 0.7,
      maxOutputTokens: 1000,
      thinkingConfig: { thinkingBudget: 500 }
    }
  });
  return response.text;
};

export const polishNews = async (content: string) => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Perbaiki tata bahasa dan buat teks pengumuman RT berikut menjadi lebih profesional namun tetap santun: ${content}`,
  });
  return response.text;
};

export const polishComplaint = async (content: string) => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Tolong perbaiki teks aduan warga ini agar lebih jelas, sopan, dan konstruktif untuk disampaikan ke pengurus RT: "${content}"`,
  });
  return response.text;
};

export const analyzeFinancialData = async (summary: string) => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Anda adalah Bendahara RT Profesional. Berdasarkan ringkasan data keuangan berikut: ${summary}, berikan analisa singkat (maks 3 poin) mengenai kesehatan keuangan RT, saran penghematan, dan apresiasi untuk warga jika saldo surplus. Gunakan bahasa yang sangat santun namun taktis.`,
  });
  return response.text;
};

export const analyzeImageContent = async (base64Image: string) => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: {
      parts: [
        { text: "Berikan deskripsi singkat dalam satu kalimat tentang apa yang terjadi di foto kegiatan lingkungan ini untuk caption berita." },
        { inlineData: { mimeType: 'image/jpeg', data: base64Image } }
      ]
    }
  });
  return response.text;
};
