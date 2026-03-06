import { Audio } from 'expo-av';
import * as Haptics from "expo-haptics";
import * as ImagePicker from 'expo-image-picker';
import { Dispatch, SetStateAction, useRef, useState } from "react";
import { Alert } from "react-native";
import { useGemini } from "./use-gemini";

interface UseNoteAiProps {
  title: string;
  content: string;
  setContent: Dispatch<SetStateAction<string>>; 
  tags: string[];
  setTags: Dispatch<SetStateAction<string[]>>; 
  mindMapHistory?: string[];
  setMindMapHistory?: Dispatch<SetStateAction<string[]>>;
  setShowMindMap?: (val: boolean) => void;
  flashcardsHistory?: any[][];
  setFlashcardsHistory?: Dispatch<SetStateAction<any[][]>>;
  setShowFlashcards?: (val: boolean) => void;
}

// Fungsi Pembersih Markdown untuk Text Editor murni
const stripMarkdown = (text: string) => {
  if (!text) return "";
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1') // Hapus ** (Bold)
    .replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '$1') // Hapus * (Italic)
    .replace(/^#+\s+/gm, '') // Hapus header (#)
    .replace(/`(.*?)`/g, '$1'); // Hapus backtick kode
};

export function useNoteAi({ 
  title, content, setContent, tags, setTags,
  mindMapHistory, setMindMapHistory, setShowMindMap,
  flashcardsHistory, setFlashcardsHistory, setShowFlashcards
}: UseNoteAiProps) {
  const { callAI } = useGemini();

  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);
  const [isFormatting, setIsFormatting] = useState(false);
  const [isGeneratingMindMap, setIsGeneratingMindMap] = useState(false);
  const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzingVoice, setIsAnalyzingVoice] = useState(false);
  const recordingRef = useRef<Audio.Recording | null>(null);
  
  const [aiSummary, setAiSummary] = useState<string | null>(null);

  const handleAutoFormat = async () => {
    setIsFormatting(true);
    try {
      const result = await callAI({ action: "auto-format", content });
      if (result) {
        setContent(stripMarkdown(result)); // Bersihkan sebelum masuk editor
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } finally {
      setIsFormatting(false);
    }
  };

  const handleSummarize = async () => {
    setIsSummarizing(true);
    try {
      const result = await callAI({ action: "summarize", content: `Judul: ${title}\n\nIsi: ${content}` });
      if (result) {
        setAiSummary(result); // Biarkan Markdown, akan dirender oleh MarkdownText di UI
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleGenerateTags = async () => {
    setIsGeneratingTags(true);
    try {
      const result = await callAI({ action: "auto-tag", content: `Judul: ${title}\n\nIsi: ${content}` });
      if (result) {
        const newTags = result.split(',').map((t: string) => stripMarkdown(t.trim())).filter(Boolean);
        setTags(Array.from(new Set([...tags, ...newTags])));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } finally {
      setIsGeneratingTags(false);
    }
  };

  const handleGenerateMindMap = async () => {
    setIsGeneratingMindMap(true);
    try {
      const result = await callAI({ action: "mindmap", content: `Judul: ${title}\n\nIsi: ${content}` });
      if (result && setMindMapHistory && setShowMindMap && mindMapHistory) {
        const cleanCode = result.replace(/```mermaid/gi, '').replace(/```/g, '').trim();
        setMindMapHistory([cleanCode, ...mindMapHistory]);
        setShowMindMap(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } finally {
      setIsGeneratingMindMap(false);
    }
  };

  const handleGenerateFlashcards = async () => {
    setIsGeneratingFlashcards(true);
    try {
      const result = await callAI({ action: "generate-flashcards", content: `Judul: ${title}\n\nIsi: ${content}` });
      if (result && setFlashcardsHistory && setShowFlashcards && flashcardsHistory) {
        const parsed = JSON.parse(result);
        if (Array.isArray(parsed)) {
          setFlashcardsHistory([parsed, ...flashcardsHistory]);
          setShowFlashcards(true);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Gagal", "AI tidak dapat mengekstrak pertanyaan dari catatan ini.");
    } finally {
      setIsGeneratingFlashcards(false);
    }
  };

  const handleImageUpload = async (source: 'camera' | 'gallery') => {
    try {
      let permissionResult;
      if (source === 'camera') {
        permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      } else {
        permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      }

      if (permissionResult.granted === false) {
        Alert.alert("Izin Ditolak", "Kamu perlu memberikan izin akses ke kamera/galeri untuk menggunakan fitur ini.");
        return;
      }

      const pickerOptions: ImagePicker.ImagePickerOptions = {
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.5, 
        base64: true, 
      };

      const result = source === 'camera' 
        ? await ImagePicker.launchCameraAsync(pickerOptions)
        : await ImagePicker.launchImageLibraryAsync(pickerOptions);

      if (!result.canceled && result.assets[0].base64) {
        setIsScanning(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        
        const extractedText = await callAI({
          action: "ocr",
          imageBase64: result.assets[0].base64,
          mimeType: result.assets[0].mimeType || 'image/jpeg'
        });

        if (extractedText) {
          setContent((prev: string) => prev ? prev + "\n\n" + stripMarkdown(extractedText) : stripMarkdown(extractedText));
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    } catch (error) {
      console.error("Error Image Picker/OCR:", error);
      Alert.alert("Gagal", "Gagal memproses gambar.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleVoiceRecord = async () => {
    try {
      if (isRecording) {
        setIsRecording(false);
        setIsAnalyzingVoice(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        
        const recording = recordingRef.current;
        if (recording) {
          await recording.stopAndUnloadAsync();
          setTimeout(async () => {
             const mockTranscript = "Ini adalah hasil ketikan otomatis dari suaramu. Di versi produksi, file audio akan dikirim ke Whisper API atau Speech-to-Text bawaan HP untuk diolah AI.";
             const result = await callAI({ action: "analyze-voice", content: mockTranscript });
             if (result) setContent((prev: string) => prev ? prev + "\n\n" + stripMarkdown(result) : stripMarkdown(result));
             setIsAnalyzingVoice(false);
             Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }, 1500);
        }
      } else {
        const permission = await Audio.requestPermissionsAsync();
        if (permission.status === 'granted') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
          const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
          recordingRef.current = recording;
          setIsRecording(true);
        } else {
          Alert.alert("Izin Ditolak", "Nexa butuh akses mikrofon untuk merekam suaramu.");
        }
      }
    } catch (err) {
      setIsRecording(false);
      setIsAnalyzingVoice(false);
    }
  };

  const handleShowComingSoon = (fitur: string) => {
    Alert.alert("Segera Hadir 🚀", `Fitur ${fitur} sedang diracik khusus untuk Mobile V5.`);
  };

  return {
    isSummarizing, isGeneratingTags, isFormatting, isGeneratingMindMap, isGeneratingFlashcards,
    isScanning, isRecording, isAnalyzingVoice, 
    aiSummary, setAiSummary,
    handleAutoFormat, handleSummarize, handleGenerateTags, handleGenerateMindMap, handleGenerateFlashcards,
    handleImageUpload, handleVoiceRecord, 
    handleShowComingSoon
  };
}