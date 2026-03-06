import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { AlignLeft, ArrowLeft, CalendarClock, Save, Sparkles } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Appearance, KeyboardAvoidingView, Platform, ScrollView, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SubTaskList } from '../components/todo/sub-task-list';
import { TaskSettings } from '../components/todo/task-settings';
import { CustomText } from '../components/ui/custom-text';
import { useGemini } from '../hooks/use-gemini';
import { useAuth } from '../lib/auth-context';
import { addNote, SubTask } from '../lib/notes-service';

export default function CreateTodoScreen() {
  const { user } = useAuth();
  const router = useRouter();
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
  
  const [isSaving, setIsSaving] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);

  if (!user) {
    return (
      <View className="flex-1 bg-background justify-center items-center px-4">
        <CustomText className="text-muted-foreground mb-4">Silakan login terlebih dahulu.</CustomText>
        <TouchableOpacity onPress={() => router.push('/')} className="px-6 py-3 bg-primary rounded-full shadow-md">
           <CustomText className="text-white font-bold">Kembali ke Home</CustomText>
        </TouchableOpacity>
      </View>
    );
  }

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert("Perhatian", "Judul tugas tidak boleh kosong!");
      return;
    }

    setIsSaving(true);
    try {
      await addNote({
        title: title.trim(),
        content: content.trim(),
        tags: [],
        isTodo: true,
        dueDate: dueDate || null,
        dueTime: dueTime || null, 
        recurrence: recurrence,
        isHidden: false,
        isPinned: false,
        isCompleted: false,
        subTasks: subTasks,
        userId: user.uid,
      } as any); 
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push("/todo" as any);
    } catch (error) {
      console.error(error);
      Alert.alert("Gagal", "Terjadi kesalahan saat menyimpan tugas.");
      setIsSaving(false);
    }
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
              const timeValue = typeof task === 'object' && task.time ? task.time : undefined;
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

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      
      {/* Header */}
      <View className="px-4 py-3 flex-row items-center justify-between border-b border-border/50 bg-background/90 z-10">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-muted">
            <ArrowLeft color={textColor} size={24} />
          </TouchableOpacity>
          <CustomText className="text-sm font-semibold uppercase tracking-wider" style={{ color: mutedColor }}>Buat Tugas</CustomText>
        </View>
        <TouchableOpacity onPress={handleSave} disabled={isSaving || !title.trim()} className="flex-row items-center px-4 py-2 rounded-full shadow-sm bg-orange-500" style={{ opacity: (!title.trim()) ? 0.5 : 1 }}>
          {isSaving ? <ActivityIndicator size="small" color="#fff" /> : <Save color="#fff" size={16} />}
          <CustomText className="text-white font-bold text-xs ml-2">Simpan</CustomText>
        </TouchableOpacity>
      </View>

      {/* FIX: Tambahkan padding bottom ekstra (140) agar tidak tertutup saat di-scroll mentok bawah */}
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
            autoFocus 
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

        {/* FIX UI: Input Deskripsi Tambahan dibuat menjadi Box yang rapi */}
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