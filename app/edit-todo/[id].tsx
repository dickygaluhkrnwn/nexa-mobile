/// <reference types="nativewind/types" />
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AlignLeft, ArrowLeft, CalendarClock, CalendarPlus, Save, Sparkles, Trash2 } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Appearance, KeyboardAvoidingView, Linking, Platform, ScrollView, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SubTaskList } from '../../components/todo/sub-task-list';
import { TaskSettings } from '../../components/todo/task-settings';
import { CustomText } from '../../components/ui/custom-text';
import { useGemini } from '../../hooks/use-gemini';
import { useAuth } from '../../lib/auth-context';
import { deleteNote, getNote, SubTask, updateNote } from '../../lib/notes-service';

export default function EditTodoScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>(); 
  const insets = useSafeAreaInsets();
  const { callAI } = useGemini();
  
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark' || ((colorScheme as any) === 'system' && Appearance.getColorScheme() === 'dark');
  const cardBgColor = isDark ? '#18181b' : '#ffffff';
  const borderColor = isDark ? '#27272a' : '#e4e4e7';
  const textColor = isDark ? '#ffffff' : '#09090b';
  const mutedColor = isDark ? '#a1a1aa' : '#71717a';

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState(""); 
  const [recurrence, setRecurrence] = useState("none");
  const [subTasks, setSubTasks] = useState<SubTask[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);

  useEffect(() => {
    const fetchTodo = async () => {
      if (!user || !id) return;
      try {
        const todoData = await getNote(id);
        if (todoData && todoData.userId === user.uid && todoData.isTodo) {
          setTitle(todoData.title || "");
          setContent(todoData.content || "");
          setDueDate(todoData.dueDate || "");
          setDueTime((todoData as any).dueTime || ""); 
          setRecurrence((todoData as any).recurrence || "none");
          setSubTasks(todoData.subTasks || []); 
        } else {
          Alert.alert("Akses Ditolak", "Tugas tidak ditemukan atau kamu tidak memiliki akses.");
          router.replace("/todo" as any);
        }
      } catch (error) {
        console.error("Gagal memuat tugas:", error);
        Alert.alert("Gagal", "Terjadi kesalahan saat memuat tugas.");
        router.replace("/todo" as any);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTodo();
  }, [user, id]);

  if (!user) return null;

  if (isLoading) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator size="large" color="#f97316" />
      </View>
    );
  }

  const handleUpdate = async () => {
    if (!title.trim()) {
      Alert.alert("Perhatian", "Judul tugas tidak boleh kosong!");
      return;
    }

    setIsSaving(true);
    try {
      const validId = Array.isArray(id) ? id[0] : id;

      // FIX UTAMA: Pembersihan Data Agresif agar Firebase menerima 100%
      const cleanSubTasks = subTasks.map(st => {
        const cleanObj: any = { 
          id: st.id, 
          text: st.text, 
          isCompleted: st.isCompleted 
        };
        // Jika ada jam dan tidak kosong, baru masukkan properti time
        if (st.time && st.time.trim() !== "") {
          cleanObj.time = st.time;
        }
        return cleanObj;
      });

      await updateNote(validId, {
        title: title.trim(),
        content: content.trim(),
        dueDate: dueDate || null,
        dueTime: dueTime || null, 
        recurrence: recurrence || "none",
        subTasks: cleanSubTasks,
      } as any); 
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/todo" as any);
    } catch (error) {
      console.error("Firebase Update Error:", error);
      Alert.alert("Gagal", "Terjadi kesalahan saat menyimpan perubahan.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Hapus Tugas?", 
      "Apakah kamu yakin ingin menghapus tugas ini? Tindakan ini tidak dapat dibatalkan.", 
      [
        { text: "Batal", style: "cancel" },
        { 
          text: "Hapus", style: "destructive", 
          onPress: async () => {
            try {
              const validId = Array.isArray(id) ? id[0] : id;
              await deleteNote(validId);
              router.replace("/todo" as any);
            } catch (error) {
              Alert.alert("Gagal", "Terjadi kesalahan saat menghapus tugas.");
            }
          }
        }
      ]
    );
  };

  const handleProjectBreakdown = async () => {
    if (!title.trim()) {
      Alert.alert("Perhatian", "Tuliskan judul proyek atau jadwalnya dulu ya agar AI mengerti!");
      return;
    }

    setIsAiLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const today = new Date().toISOString().split('T')[0];
      const result = await callAI({ 
        action: "project-breakdown", 
        content: title,
        context: `Hari ini adalah tanggal ${today}.`
      });
      
      if (result) {
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          
          if (parsed.subTasks && Array.isArray(parsed.subTasks)) {
            const newSubTasks = parsed.subTasks.map((task: any, index: number) => {
              const textValue = typeof task === 'string' ? task : task.text;
              const timeValue = typeof task === 'object' && task.time ? task.time : null; 
              return {
                id: Date.now().toString() + index.toString(),
                text: textValue,
                time: timeValue,
                isCompleted: false
              };
            });
            setSubTasks(prev => [...prev, ...newSubTasks]);
          }
          
          if (parsed.description) {
            setContent(prev => prev ? prev + "\n\n---\n🎯 AI Strategy:\n" + parsed.description : "🎯 AI Strategy:\n" + parsed.description);
          }

          if (parsed.recommendedDueDate && !dueDate) {
            setDueDate(parsed.recommendedDueDate);
          }
          
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Alert.alert("Berhasil! ✨", "AI telah memecah tugas dan menyusun jadwalmu.");
        } else {
          throw new Error("Format respons tidak sesuai JSON.");
        }
      }
    } catch (error: any) {
      console.error("Gagal melakukan breakdown:", error);
      Alert.alert("Gagal", "AI kebingungan mencerna rencanamu. Coba lengkapi judulnya sedikit.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleSyncCalendar = async () => {
    if (!title.trim()) {
      Alert.alert("Perhatian", "Judul tugas tidak boleh kosong untuk disinkronkan ke Kalender.");
      return;
    }

    const baseUrl = "https://calendar.google.com/calendar/render?action=TEMPLATE";
    const eventText = encodeURIComponent(title.trim());
    
    let cleanContent = content.replace(/<[^>]+>/g, '\n').trim();
    if (subTasks.length > 0) {
      cleanContent += "\n\nSub-Tugas:\n" + subTasks.map(st => `- [${st.isCompleted ? 'x' : ' '}] ${st.text}`).join("\n");
    }
    cleanContent += "\n\n---\nDibuat menggunakan Nexa AI 🚀";
    const eventDetails = encodeURIComponent(cleanContent);

    let dates = "";
    if (dueDate) {
      try {
        if (dueTime) {
          const dateObj = new Date(`${dueDate}T${dueTime}`);
          const startStr = dateObj.toISOString().replace(/-|:|\.\d\d\d/g, "");
          const endDateObj = new Date(dateObj.getTime() + 60 * 60 * 1000); 
          const endStr = endDateObj.toISOString().replace(/-|:|\.\d\d\d/g, "");
          dates = `&dates=${startStr}/${endStr}`;
        } else {
          const startStr = dueDate.replace(/-/g, "");
          const dateObj = new Date(dueDate);
          dateObj.setDate(dateObj.getDate() + 1); 
          const endStr = dateObj.toISOString().split('T')[0].replace(/-/g, "");
          dates = `&dates=${startStr}/${endStr}`;
        }
      } catch (e) {
        console.error("Gagal memformat tanggal untuk GCal", e);
      }
    }

    let rrule = "";
    if (recurrence && recurrence !== "none") {
      rrule = `&recur=RRULE:FREQ=${recurrence.toUpperCase()}`;
    }

    const url = `${baseUrl}&text=${eventText}&details=${eventDetails}${dates}${rrule}`;
    
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Gagal", "Tidak dapat membuka tautan kalender di perangkat ini.");
      }
    } catch (err) {
      Alert.alert("Error", "Terjadi kesalahan saat membuka kalender.");
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      
      {/* HEADER DENGAN TOMBOL SIMPAN DIPINDAH KE SINI */}
      <View className="px-4 py-3 flex-row items-center justify-between border-b border-border/50 bg-background/90 z-10">
        <View className="flex-row items-center gap-2">
          <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-muted">
            <ArrowLeft color={textColor} size={24} />
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center gap-2">
          <TouchableOpacity onPress={handleSyncCalendar} className="p-2 rounded-full bg-blue-500/10 border border-blue-500/20">
            <CalendarPlus color="#3b82f6" size={18} />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={handleDelete} className="p-2 rounded-full bg-red-500/10 border border-red-500/20 mr-1">
            <Trash2 color="#ef4444" size={18} />
          </TouchableOpacity>

          <TouchableOpacity onPress={handleUpdate} disabled={isSaving || !title.trim()} className="flex-row items-center px-4 py-2 rounded-full shadow-sm bg-orange-500" style={{ opacity: (!title.trim() || isSaving) ? 0.6 : 1 }}>
            {isSaving ? <ActivityIndicator size="small" color="#fff" /> : <Save color="#fff" size={16} />}
            <CustomText className="text-white font-bold text-xs ml-2">Simpan</CustomText>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 140 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        
        {/* Input Judul Utama & Tombol AI */}
        <View className="mb-6">
          <TextInput 
            placeholder="Apa proyek atau tugasmu?" 
            placeholderTextColor={mutedColor}
            value={title} 
            onChangeText={setTitle} 
            className="text-3xl font-black mb-4" 
            style={{ color: textColor }}
          />
          
          <TouchableOpacity 
            activeOpacity={0.7}
            onPress={handleProjectBreakdown}
            disabled={!title.trim() || isAiLoading}
            className="flex-row items-center self-start px-4 py-2.5 rounded-xl border shadow-sm"
            style={{ backgroundColor: isDark ? '#9333ea15' : '#f3e8ff', borderColor: isDark ? '#9333ea40' : '#e9d5ff', opacity: !title.trim() ? 0.5 : 1 }}
          >
            {isAiLoading ? <ActivityIndicator size="small" color="#9333ea" style={{ marginRight: 8 }} /> : <Sparkles color="#9333ea" size={16} style={{ marginRight: 8 }} />}
            <CustomText className="font-bold text-xs" style={{ color: '#9333ea' }}>
              {isAiLoading ? "Sedang Merancang..." : "AI Project Breakdown"}
            </CustomText>
          </TouchableOpacity>
        </View>

        {/* Komponen Rincian Tugas */}
        <SubTaskList subTasks={subTasks} onChange={setSubTasks} />

        {/* FIX UI: Input Deskripsi Tambahan dibuat menjadi Box yang rapi (Diselaraskan dengan create-todo) */}
        <View className="flex-row gap-3 mt-6 p-4 rounded-2xl border" style={{ backgroundColor: isDark ? '#27272a40' : '#f4f4f5', borderColor }}>
          <AlignLeft color={mutedColor} size={20} className="mt-1" />
          <TextInput
            placeholder="Catatan tambahan (opsional)..."
            placeholderTextColor={mutedColor}
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
            className="flex-1 min-h-[100px] text-sm font-medium"
            style={{ color: textColor }}
          />
        </View>

        {/* FIX UI: Komponen Pengaturan Waktu dibungkus dalam kontainer berjarak (margin) */}
        <View className="mt-8 mb-10">
           <View className="flex-row items-center gap-2 mb-4 ml-1">
              <CalendarClock color={mutedColor} size={18} />
              <CustomText className="text-xs font-bold uppercase tracking-widest" style={{ color: mutedColor }}>
                 Pengaturan Jadwal
              </CustomText>
           </View>

           {/* TaskSettings dirender di sini, jarak bawahnya sekarang terjamin aman */}
           <TaskSettings 
             dueDate={dueDate} setDueDate={setDueDate}
             dueTime={dueTime} setDueTime={setDueTime}
             recurrence={recurrence} setRecurrence={setRecurrence}
           />
        </View>
        
      </ScrollView>
    </KeyboardAvoidingView>
  );
}