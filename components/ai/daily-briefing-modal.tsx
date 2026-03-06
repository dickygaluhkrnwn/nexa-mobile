import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech'; // <-- MENGGUNAKAN EXPO SPEECH UNTUK NATIVE
import { AlertCircle, CheckCircle2, CloudSun, Moon, SquareSquare, StopCircle, Sun, Volume2 } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Appearance, Modal, TouchableOpacity, View } from "react-native";
import { useAuth } from "../../lib/auth-context";
import { getUserHabits, getUserNotes, HabitData, NoteData } from "../../lib/notes-service";
import { CustomText } from "../ui/custom-text";

type ExtendedNoteData = NoteData & { id: string };

export function DailyBriefingModal() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark' || ((colorScheme as any) === 'system' && Appearance.getColorScheme() === 'dark');
  const cardBgColor = isDark ? '#18181b' : '#ffffff';
  const borderColor = isDark ? '#27272a' : '#e4e4e7';
  const textColor = isDark ? '#ffffff' : '#09090b';
  const mutedColor = isDark ? '#a1a1aa' : '#71717a';

  // Data State
  const [pendingTodos, setPendingTodos] = useState<ExtendedNoteData[]>([]);
  const [missedHabits, setMissedHabits] = useState<HabitData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [greetingText, setGreetingText] = useState("");

  // State untuk Kesadaran Waktu (Time Awareness)
  const [timeConfig, setTimeConfig] = useState({
    greeting: "Pagi",
    bgHex: "#f59e0b", // Amber
    Icon: Sun
  });

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 11) {
      setTimeConfig({ greeting: "Pagi", bgHex: "#f59e0b", Icon: Sun });
    } else if (hour >= 11 && hour < 15) {
      setTimeConfig({ greeting: "Siang", bgHex: "#f97316", Icon: Sun }); // Orange
    } else if (hour >= 15 && hour < 18) {
      setTimeConfig({ greeting: "Sore", bgHex: "#f43f5e", Icon: CloudSun }); // Rose
    } else {
      setTimeConfig({ greeting: "Malam", bgHex: "#6366f1", Icon: Moon }); // Indigo
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    const checkBriefingStatus = async () => {
      try {
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        const lastBriefing = await AsyncStorage.getItem(`nexa_briefing_${user.uid}`);

        if (lastBriefing !== todayStr) {
          setIsOpen(true);
          await fetchDataForBriefing();
        }
      } catch (error) {
        console.error("Gagal mengecek status briefing", error);
      }
    };

    checkBriefingStatus();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchDataForBriefing = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [notes, habits] = await Promise.all([
        getUserNotes(user.uid),
        getUserHabits(user.uid)
      ]);

      const todos = (notes as unknown as ExtendedNoteData[]).filter(n => n.isTodo && !n.isCompleted && !n.isHidden);
      setPendingTodos(todos);

      const yesterdayStr = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd');
      const missed = habits.filter(h => !h.completedDates.includes(yesterdayStr));
      setMissedHabits(missed);

      const userName = user.displayName?.split(" ")[0] || "Bos";
      const hour = new Date().getHours();
      let timeGreeting = "pagi";
      if (hour >= 11 && hour < 15) timeGreeting = "siang";
      else if (hour >= 15 && hour < 18) timeGreeting = "sore";
      else if (hour >= 18 || hour < 4) timeGreeting = "malam";

      let text = `Selamat ${timeGreeting}, ${userName}. Semoga harimu menyenangkan. `;
      
      if (todos.length > 0) {
        text += `Hari ini kamu memiliki ${todos.length} tugas yang menunggu untuk diselesaikan. `;
      } else {
        text += `Jadwal tugasmu kosong hari ini, waktu yang tepat untuk bersantai atau merencanakan hal baru. `;
      }

      if (missed.length > 0 && missed.length < 3) {
         text += `Oh ya, aku perhatikan kemarin kamu melewatkan habit ${missed[0].title}. Jangan lupa dilanjutkan hari ini ya!`;
      } else if (missed.length >= 3) {
         text += `Ada beberapa rutinitas yang terlewat kemarin, mari kita perbaiki rekornya hari ini! Tetap semangat!`;
      }

      setGreetingText(text);
    } catch (error) {
      console.error("Gagal memuat data briefing:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = async () => {
    if (!user) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      await AsyncStorage.setItem(`nexa_briefing_${user.uid}`, todayStr);
    } catch(e) {}
    
    Speech.stop();
    setIsSpeaking(false);
    setIsOpen(false);
  };

  const handleSpeakToggle = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const isSpeakingNow = await Speech.isSpeakingAsync();
    
    if (isSpeakingNow || isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
      return;
    }

    Speech.speak(greetingText, {
      language: 'id-ID',
      rate: 0.95, // Sedikit dilambatkan agar terdengar natural
      pitch: 1.0,
      onStart: () => setIsSpeaking(true),
      onDone: () => setIsSpeaking(false),
      onStopped: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  if (!isOpen) return null;

  const IconComponent = timeConfig.Icon;

  return (
    <Modal visible={isOpen} transparent animationType="fade">
      <View className="flex-1 bg-black/80 justify-center items-center p-4">
        
        <View className="w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl border" style={{ backgroundColor: cardBgColor, borderColor }}>
          
          {/* Header Dinamis (Mengikuti Waktu) */}
          <View className="p-6 items-center relative overflow-hidden" style={{ backgroundColor: timeConfig.bgHex }}>
            <View className="absolute -top-10 -right-10 w-32 h-32 bg-white/20 rounded-full" />
            <IconComponent color="#ffffff" size={48} style={{ marginBottom: 12 }} />
            <CustomText className="text-2xl font-black tracking-tight" style={{ color: '#ffffff' }}>Selamat {timeConfig.greeting}!</CustomText>
            <CustomText className="font-medium text-xs mt-1" style={{ color: 'rgba(255,255,255,0.9)' }}>
              {format(new Date(), 'EEEE, dd MMMM yyyy', { locale: localeId })}
            </CustomText>
          </View>

          {/* Konten Laporan */}
          <View className="p-6">
            {isLoading ? (
              <View className="items-center justify-center py-8">
                <ActivityIndicator size="large" color={timeConfig.bgHex} />
                <CustomText className="text-xs mt-4 font-medium" style={{ color: mutedColor }}>Menyiapkan laporan harianmu...</CustomText>
              </View>
            ) : (
              <>
                {/* Pesan Sapaan Jarvis */}
                <View className="p-4 rounded-2xl border mb-6 relative" style={{ backgroundColor: isDark ? '#27272a50' : '#f4f4f5', borderColor: `${borderColor}80` }}>
                  <CustomText className="text-sm leading-relaxed font-medium" style={{ color: textColor }}>
                    "{greetingText}"
                  </CustomText>
                  <View className="absolute -top-3 -left-2 w-6 h-6 rounded-full items-center justify-center border shadow-sm" style={{ backgroundColor: cardBgColor, borderColor }}>
                    <CustomText className="text-xs">✨</CustomText>
                  </View>
                </View>

                {/* Grid Statistik */}
                <View className="flex-row gap-3 mb-6">
                  <View className="flex-1 border rounded-xl p-3 shadow-sm items-center" style={{ borderColor, backgroundColor: cardBgColor }}>
                    <View className="w-8 h-8 rounded-full bg-blue-500/10 items-center justify-center mb-2">
                      <SquareSquare color="#3b82f6" size={16} />
                    </View>
                    <CustomText className="text-2xl font-black" style={{ color: textColor }}>{pendingTodos.length}</CustomText>
                    <CustomText className="text-[10px] uppercase tracking-wider font-bold mt-1" style={{ color: mutedColor }}>Tugas Hari Ini</CustomText>
                  </View>
                  
                  <View className="flex-1 border rounded-xl p-3 shadow-sm items-center" style={{ borderColor, backgroundColor: cardBgColor }}>
                    <View className={`w-8 h-8 rounded-full items-center justify-center mb-2 ${missedHabits.length > 0 ? 'bg-rose-500/10' : 'bg-emerald-500/10'}`}>
                      {missedHabits.length > 0 ? <AlertCircle color="#f43f5e" size={16} /> : <CheckCircle2 color="#10b981" size={16} />}
                    </View>
                    <CustomText className="text-2xl font-black" style={{ color: textColor }}>{missedHabits.length}</CustomText>
                    <CustomText className="text-[10px] uppercase tracking-wider font-bold mt-1" style={{ color: mutedColor }}>Habit Bolong</CustomText>
                  </View>
                </View>

                {/* Tombol Aksi */}
                <View className="flex-row gap-3">
                  <TouchableOpacity 
                    onPress={handleClose} 
                    className="flex-1 h-12 rounded-xl border items-center justify-center"
                    style={{ borderColor }}
                  >
                    <CustomText className="font-bold" style={{ color: textColor }}>Tutup</CustomText>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    onPress={handleSpeakToggle} 
                    className="flex-1 h-12 rounded-xl flex-row items-center justify-center shadow-md"
                    style={{ backgroundColor: isSpeaking ? '#ef4444' : timeConfig.bgHex }}
                  >
                    {isSpeaking ? (
                      <>
                        <StopCircle color="#ffffff" size={20} style={{ marginRight: 8 }} />
                        <CustomText className="font-bold text-white">Hentikan</CustomText>
                      </>
                    ) : (
                      <>
                        <Volume2 color="#ffffff" size={20} style={{ marginRight: 8 }} />
                        <CustomText className="font-bold text-white">Dengarkan</CustomText>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>

        </View>
      </View>
    </Modal>
  );
}