import { GoogleGenerativeAI } from "@google/generative-ai";
import { useState } from "react";
import { Alert } from "react-native";

const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export function useGemini() {
  const [isAiLoading, setIsAiLoading] = useState(false);

  const callAI = async (payload: { action: string, content?: string, prompt?: string, context?: string, imageBase64?: string, mimeType?: string }) => {
    if (!apiKey) {
      Alert.alert("API Key Kosong", "Pastikan EXPO_PUBLIC_GEMINI_API_KEY sudah diatur di file .env");
      return null;
    }

    setIsAiLoading(true);
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      let finalPrompt = "";
      let isJson = false;
      let generateParams: any[] = [];

      switch (payload.action) {
        case "auto-tag":
          finalPrompt = `Baca catatan ini dan berikan maksimal 3 tag/kategori yang paling relevan. Format balasan HANYA kata dipisahkan koma, tanpa hashtag. Catatan: "${payload.content}"`;
          generateParams = [finalPrompt];
          break;
        case "summarize":
          finalPrompt = `Buatlah ringkasan singkat dan padat (maksimal 3 kalimat) dari catatan berikut. Fokus pada poin utama. Catatan: "${payload.content}"`;
          generateParams = [finalPrompt];
          break;
        case "auto-format":
          finalPrompt = `Rapikan teks acak berikut agar lebih logis dan enak dibaca. Perbaiki ejaan dan tanda baca. Jangan gunakan format HTML atau Markdown tebal, cukup teks biasa yang terstruktur paragrafnya. Teks: "${payload.content}"`;
          generateParams = [finalPrompt];
          break;
        case "mindmap":
          finalPrompt = `Buatlah diagram (peta konsep) berformat sintaks Mermaid.js dari catatan berikut. PENTING: Output HANYA berupa kode Mermaid murni tanpa bungkus markdown block (\`\`\`mermaid\`). Hindari karakter khusus. Catatan: "${payload.content}"`;
          generateParams = [finalPrompt];
          break;
        
        // --- FIX: PROMPT ENGINEERING UNTUK PROJECT BREAKDOWN ---
        case "project-breakdown":
          finalPrompt = `
          Kamu adalah Pelatih Produktivitas AI. Pengguna meminta rencana/jadwal ini: 
          "${payload.content}"
          
          Konteks tambahan: ${payload.context || "Tidak ada"}
          
          Tugasmu adalah memecah permintaan ini menjadi langkah-langkah atau jadwal.
          
          ⚠️ INSTRUKSI KRITIS (JANGAN BERHALUSINASI): 
          1. Jika pengguna meminta rutinitas/jadwal (misal: "Jadwal Shalat", "Jadwal Belajar", "Jadwal Diet"), berikan DAFTAR AKTIVITAS DAN JAMNYA (contoh: Subuh 04:30, Dzuhur 12:00). BUKAN langkah-langkah membuat aplikasi/software!
          2. Jika ini proyek kerjaan (misal: "Bikin Skripsi", "Launch Startup"), baru pecah menjadi tahapan kerja.
          
          Balas HANYA dalam format JSON murni persis seperti ini:
          {
            "description": "Kata-kata motivasi atau strategi eksekusi singkat (Maks 2 kalimat).",
            "subTasks": [
              {
                "text": "Nama aktivitas (contoh: Shalat Subuh / Analisis Pasar)",
                "time": "HH:MM" // Isi dengan jam HANYA jika ini jadwal harian. Jika bukan, kosongkan ("").
              }
            ],
            "recommendedDueDate": "YYYY-MM-DD" // Hitung logis dari tanggal hari ini. Kosongkan ("") jika ini rutinitas harian tanpa batas waktu.
          }`;
          isJson = true;
          generateParams = [finalPrompt];
          break;
        // --------------------------------------------------------

        case "weekly-review":
          finalPrompt = `Kamu Pelatih Produktivitas AI. Analisis tugas minggu ini dan buat evaluasi. Balasan JSON murni: {"title": "...", "summary": "...", "insights": ["..."], "focusNextWeek": ["..."], "grade": "A/B/C/D"}. Data Tugas: "${payload.content}"`;
          isJson = true;
          generateParams = [finalPrompt];
          break;
        case "generate-flashcards":
          finalPrompt = `Kamu adalah AI pembuat Flashcard. Baca materi berikut dan buatkan kartu flashcard tanya-jawab. Berikan balasan HANYA dalam format JSON murni. Strukturnya WAJIB array of objects seperti ini: [{"front": "Pertanyaan Singkat", "back": "Jawaban Detail"}]. Buatlah 3-5 kartu. Catatan: "${payload.content}"`;
          isJson = true;
          generateParams = [finalPrompt];
          break;
        case "chat":
          finalPrompt = `Kamu adalah Asisten Nexa. Jawab pertanyaan pengguna berdasarkan catatan berikut:\n${payload.context}\n\nPertanyaan: "${payload.prompt}"`;
          generateParams = [finalPrompt];
          break;
        case "ocr":
          if (!payload.imageBase64) throw new Error("Image Base64 is required");
          finalPrompt = `Ekstrak seluruh teks yang ada di gambar ini dengan akurat. Jika tidak ada teks, jelaskan gambar tersebut secara singkat. Format output sebagai teks paragraf biasa tanpa markdown.`;
          generateParams = [
            finalPrompt,
            {
              inlineData: {
                data: payload.imageBase64,
                mimeType: payload.mimeType || "image/jpeg",
              },
            }
          ];
          break;
        case "analyze-voice":
          finalPrompt = `Rapikan hasil transkripsi audio yang berantakan ini menjadi satu paragraf yang rapi dan masuk akal. Buang kata-kata filler (seperti eh, um). Transkripsi: "${payload.content}"`;
          generateParams = [finalPrompt];
          break;
        default:
          throw new Error("Action tidak valid");
      }

      const result = await model.generateContent(
         isJson ? { contents: [{ role: "user", parts: [{ text: finalPrompt }] }], generationConfig: { responseMimeType: "application/json" } } 
         : generateParams
      );

      return result.response.text().trim();
    } catch (error: any) {
      console.error("AI Error:", error);
      Alert.alert("Gagal AI", "Terjadi kesalahan saat memanggil asisten AI.");
      throw error;
    } finally {
      setIsAiLoading(false);
    }
  };

  return { callAI, isAiLoading };
}