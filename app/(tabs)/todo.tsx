import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { CalendarDays, CheckSquare, KanbanSquare, LayoutList, Plus, Sparkles, Timer } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Appearance, ScrollView, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CustomText } from '../../components/ui/custom-text';
import { useGemini } from '../../hooks/use-gemini';
import { useSettings } from '../../hooks/use-settings';
import { useAuth } from '../../lib/auth-context';
import { addNote, deleteNote, getUserNotes, updateNote } from '../../lib/notes-service';

import { Header, useHeaderAnimation } from '../../components/Header';
import { usePomodoroStore } from '../../components/todo/pomodoro-timer';
import { TodoCalendarView } from '../../components/todo/todo-calendar-view';
import { TodoKanbanView } from '../../components/todo/todo-kanban-view';
import { TodoListView } from '../../components/todo/todo-list-view';
import { TodoItem } from '../../components/todo/types';
import { WeeklyReviewModal } from '../../components/todo/weekly-review-modal';

const accentColors: Record<string, string> = {
  default: '#9333ea', blue: '#3b82f6', emerald: '#10b981',
  amber: '#f59e0b', orange: '#f97316', rose: '#f43f5e', violet: '#8b5cf6',
};

const getLocalIsoDate = (d: Date) => {
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().split('T')[0];
};

export default function TodoScreen() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { callAI, isAiLoading } = useGemini();
  
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark' || ((colorScheme as any) === 'system' && Appearance.getColorScheme() === 'dark');
  const cardBgColor = isDark ? '#18181b' : '#ffffff';
  const textColor = isDark ? '#ffffff' : '#09090b';
  const mutedColor = isDark ? '#a1a1aa' : '#71717a';
  const borderColor = isDark ? '#27272a' : '#e4e4e7';

  const { colorAccent } = useSettings();
  const primaryHex = accentColors[colorAccent] || accentColors.default;

  const { headerTranslateY, handleScroll } = useHeaderAnimation();
  
  const { openPomodoro } = usePomodoroStore();

  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'calendar' | 'kanban'>('list');
  
  const [reviewData, setReviewData] = useState<any>(null);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const todayStr = useMemo(() => getLocalIsoDate(new Date()), []);

  const isTaskOverdue = (t: TodoItem) => {
    if (!t.dueDate) return false;
    const now = new Date();
    let targetDateStr = t.dueDate;
    if (t.dueTime) targetDateStr += `T${t.dueTime}`;
    else targetDateStr += `T23:59:59`;
    return now > new Date(targetDateStr);
  };

  const fetchTodos = async () => {
    if (!user) return;
    try {
      const data = await getUserNotes(user.uid);
      let todoData = data.filter((note: any) => note.isTodo) as TodoItem[];
      let hasAutoUpdated = false;

      for (const todo of todoData) {
        if (!todo.isCompleted && isTaskOverdue(todo)) {
          if (todo.recurrence && todo.recurrence !== 'none') {
            let nextDue = new Date(todo.dueDate!);
            const now = new Date(todayStr);
            while (nextDue <= now) {
              if (todo.recurrence === 'daily') nextDue.setDate(nextDue.getDate() + 1);
              else if (todo.recurrence === 'weekly') nextDue.setDate(nextDue.getDate() + 7);
              else if (todo.recurrence === 'monthly') nextDue.setMonth(nextDue.getMonth() + 1);
              else break;
            }
            const nextDueStr = getLocalIsoDate(nextDue);

            await addNote({
              title: todo.title, content: todo.content, tags: todo.tags || [],
              isTodo: true, dueDate: nextDueStr, dueTime: todo.dueTime || null, recurrence: todo.recurrence,
              isHidden: todo.isHidden || false, isPinned: todo.isPinned || false, isCompleted: false,
              subTasks: todo.subTasks ? todo.subTasks.map(st => ({...st, isCompleted: false})) : [], 
              userId: user.uid,
            } as any);

            await updateNote(todo.id, { recurrence: 'none' } as any);
            hasAutoUpdated = true;
          }
        }
      }

      if (hasAutoUpdated) {
        const updatedData = await getUserNotes(user.uid);
        todoData = updatedData.filter((note: any) => note.isTodo) as TodoItem[];
      }

      setTodos(todoData);
    } catch (error) {
      console.error("Gagal memuat tugas:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchTodos();
    else if (!authLoading) setLoading(false);
  }, [user, authLoading]);

  const handleWeeklyReview = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    const lastWeekStr = getLocalIsoDate(lastWeek);

    const weeklyTasks = todos.filter(t => t.dueDate && t.dueDate >= lastWeekStr && t.dueDate <= todayStr);

    if (weeklyTasks.length === 0) {
      Alert.alert("Data Kurang", "Kamu belum memiliki data tugas dalam 7 hari terakhir untuk dianalisis.");
      return;
    }

    const contextStr = weeklyTasks.map(t => {
      let status = "Selesai";
      if (!t.isCompleted) status = isTaskOverdue(t) ? "Tidak Selesai" : "Belum / Berjalan";
      return `- [${status}] ${t.title} (Target: ${t.dueDate}${t.dueTime ? ` ${t.dueTime}` : ''})`;
    }).join('\n');

    try {
      const result = await callAI({ action: "weekly-review", content: contextStr });
      if (result) {
        const parsed = JSON.parse(result);
        setReviewData(parsed);
      }
    } catch (error: any) {
      Alert.alert("Gagal Menganalisis", "AI kebingungan memproses datamu. Coba lagi nanti ya.");
    }
  };

  const handleSaveReview = async () => {
    if (!reviewData || !user) return;
    try {
      const contentHtml = `
        <h2>${reviewData.title}</h2>
        <p>${reviewData.summary}</p><br/>
        <h3>💡 Wawasan Pola Kerja</h3>
        <ul>${reviewData.insights.map((i: string) => `<li>${i}</li>`).join('')}</ul><br/>
        <h3>🎯 Fokus Minggu Depan</h3>
        <ul>${reviewData.focusNextWeek.map((i: string) => `<li>${i}</li>`).join('')}</ul><br/>
        <p><strong>Nilai Performa: ${reviewData.grade}</strong></p>
      `;

      await addNote({
        title: `Laporan Mingguan: ${new Date().toLocaleDateString('id-ID')}`,
        content: contentHtml, tags: ["WeeklyReview"], isTodo: false, isHidden: false, userId: user.uid,
      } as any);

      Alert.alert("Tersimpan!", "Laporan Mingguan berhasil disimpan ke Arsip di halaman Profil.");
      setReviewData(null);
    } catch (error) {
      Alert.alert("Gagal", "Terjadi kesalahan saat menyimpan laporan.");
    }
  };

  const toggleComplete = async (todo: TodoItem) => {
    if (!user) return; 
    const newStatus = !todo.isCompleted;
    setTodos(todos.map(t => t.id === todo.id ? { ...t, isCompleted: newStatus } : t));
    
    try {
      if (newStatus === true && todo.recurrence && todo.recurrence !== 'none') {
        const currentDue = todo.dueDate ? new Date(todo.dueDate) : new Date();
        const nextDue = new Date(currentDue);
        if (todo.recurrence === 'daily') nextDue.setDate(currentDue.getDate() + 1);
        else if (todo.recurrence === 'weekly') nextDue.setDate(currentDue.getDate() + 7);
        else if (todo.recurrence === 'monthly') nextDue.setMonth(currentDue.getMonth() + 1);
        
        const nextDueStr = getLocalIsoDate(nextDue);
        const resetSubTasks = todo.subTasks ? todo.subTasks.map(st => ({ ...st, isCompleted: false })) : [];

        await addNote({
          title: todo.title, content: todo.content, tags: todo.tags || [], isTodo: true, dueDate: nextDueStr, dueTime: todo.dueTime || null,
          recurrence: todo.recurrence, isHidden: todo.isHidden || false, isPinned: todo.isPinned || false, isCompleted: false, 
          subTasks: resetSubTasks, userId: user.uid,
        } as any);

        await updateNote(todo.id, { isCompleted: true, recurrence: 'none' } as any);
        Alert.alert("Tugas Berulang", `Tugas telah diselesaikan! Jadwal berikutnya otomatis dibuat untuk ${nextDueStr}.`);
        fetchTodos(); 
      } else {
        await updateNote(todo.id, { isCompleted: newStatus } as any);
      }
    } catch (error) {
      setTodos(todos.map(t => t.id === todo.id ? { ...t, isCompleted: todo.isCompleted } : t));
    }
  };

  const handleTogglePin = async (todo: TodoItem) => {
    const newPinStatus = !todo.isPinned;
    setTodos(todos.map(t => t.id === todo.id ? { ...t, isPinned: newPinStatus } : t));
    try { await updateNote(todo.id, { isPinned: newPinStatus } as any); } 
    catch (error) { setTodos(todos.map(t => t.id === todo.id ? { ...t, isPinned: todo.isPinned } : t)); }
  };

  const handleDelete = (id: string) => {
    const previousTodos = [...todos];
    setTodos(prev => prev.filter(t => t.id !== id));
    try { deleteNote(id); } 
    catch (error) { setTodos(previousTodos); }
  };

  if (authLoading || loading) return <View className="flex-1 bg-background justify-center items-center"><ActivityIndicator size="large" color="#f97316" /></View>;
  if (!user) return <View className="flex-1 bg-background justify-center items-center"><CustomText className="text-muted-foreground">Silakan login untuk melihat tugas.</CustomText></View>;

  const completedTodos = todos.filter(t => t.isCompleted);
  const pendingTodos = todos.filter(t => !t.isCompleted);
  const progressPercentage = todos.length > 0 ? Math.round((completedTodos.length / todos.length) * 100) : 0;

  return (
    <View className="flex-1 bg-background">
      
      <Header translateY={headerTranslateY} />

      <ScrollView 
        contentContainerStyle={{ paddingTop: insets.top + 70, paddingHorizontal: 16, paddingBottom: 100 }} 
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        
        {/* --- Hero Box & Progress (Solid Theme Update) --- */}
        <View 
          className="rounded-[2rem] p-6 shadow-xl overflow-hidden mb-4"
          style={{ backgroundColor: primaryHex }}
        >
          <View className="relative z-10">
            <View className="flex-row items-center justify-between mb-4">
              <CustomText className="font-bold text-sm text-white/80 uppercase tracking-widest">
                Manajemen Tugas
              </CustomText>
              <View className="bg-white/20 px-3 py-1 rounded-full">
                <CustomText className="font-bold text-[10px] text-white uppercase tracking-widest">
                  {pendingTodos.length} Tersisa
                </CustomText>
              </View>
            </View>
            
            <View className="flex-row items-center gap-3 mb-5">
              <View className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <CheckSquare color="#ffffff" size={20} />
              </View>
              <View>
                <CustomText className="text-3xl font-black text-white">Tugas Saya</CustomText>
              </View>
            </View>

            {todos.length > 0 && (
              <View className="bg-white/10 border border-white/20 p-4 rounded-2xl flex-col justify-between">
                <View className="flex-row justify-between mb-2">
                  <CustomText className="text-[10px] font-bold uppercase tracking-widest text-white/80">Progress Harian</CustomText>
                  <CustomText className="text-[10px] font-bold text-white">{progressPercentage}% Selesai</CustomText>
                </View>
                <View className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
                  <View className="h-full bg-white rounded-full" style={{ width: `${progressPercentage}%` }} />
                </View>
              </View>
            )}
          </View>
        </View>

        {/* --- 3 ACTION BUTTONS ESTETIK (Tugas, Fokus, Review) --- */}
        <View className="flex-row gap-3 mb-6">
          <TouchableOpacity 
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/create-todo' as any); }} 
            activeOpacity={0.8}
            className="flex-1 flex-col items-center justify-center gap-1.5 h-[85px] rounded-2xl border shadow-sm" 
            style={{ backgroundColor: isDark ? '#7c2d12' : '#ffedd5', borderColor: isDark ? '#9a3412' : '#fed7aa' }}
          >
            <Plus color={isDark ? '#fdba74' : '#ea580c'} size={24} />
            <CustomText className="font-bold text-[11px] uppercase tracking-wider mt-0.5" style={{ color: isDark ? '#fdba74' : '#ea580c' }}>Baru</CustomText>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); openPomodoro(); }} 
            activeOpacity={0.8}
            className="flex-1 flex-col items-center justify-center gap-1.5 h-[85px] rounded-2xl border shadow-sm" 
            style={{ backgroundColor: isDark ? '#7f1d1d' : '#fee2e2', borderColor: isDark ? '#991b1b' : '#fecaca' }}
          >
            <Timer color={isDark ? '#fca5a5' : '#dc2626'} size={24} />
            <CustomText className="font-bold text-[11px] uppercase tracking-wider mt-0.5" style={{ color: isDark ? '#fca5a5' : '#dc2626' }}>Fokus</CustomText>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={handleWeeklyReview} 
            disabled={isAiLoading} 
            activeOpacity={0.8}
            className="flex-1 flex-col items-center justify-center gap-1.5 h-[85px] rounded-2xl border shadow-sm" 
            style={{ backgroundColor: isDark ? '#4c1d95' : '#f3e8ff', borderColor: isDark ? '#5b21b6' : '#e9d5ff' }}
          >
            {isAiLoading ? <ActivityIndicator size="small" color={isDark ? '#d8b4fe' : '#9333ea'} /> : <Sparkles color={isDark ? '#d8b4fe' : '#9333ea'} size={24} />}
            <CustomText className="font-bold text-[11px] uppercase tracking-wider mt-0.5 text-center px-1" style={{ color: isDark ? '#d8b4fe' : '#9333ea' }}>
              {isAiLoading ? "Tunggu..." : "AI Review"}
            </CustomText>
          </TouchableOpacity>
        </View>

        {/* FIX UI: Tab Mode Tampilan Dibuat Full Width dengan Border */}
        <View className="flex-row p-1.5 rounded-2xl mb-6 w-full border" style={{ backgroundColor: isDark ? '#27272a40' : '#f4f4f5', borderColor }}>
          <TouchableOpacity 
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setViewMode('list'); }} 
            className="flex-1 flex-row items-center justify-center gap-2 py-3 rounded-xl transition-colors"
            style={{ backgroundColor: viewMode === 'list' ? cardBgColor : 'transparent', shadowOpacity: viewMode === 'list' ? 0.05 : 0 }}
          >
            <LayoutList color={viewMode === 'list' ? textColor : mutedColor} size={16} />
            <CustomText className="font-bold text-xs" style={{ color: viewMode === 'list' ? textColor : mutedColor }}>Daftar</CustomText>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setViewMode('calendar'); }} 
            className="flex-1 flex-row items-center justify-center gap-2 py-3 rounded-xl transition-colors"
            style={{ backgroundColor: viewMode === 'calendar' ? cardBgColor : 'transparent', shadowOpacity: viewMode === 'calendar' ? 0.05 : 0 }}
          >
            <CalendarDays color={viewMode === 'calendar' ? textColor : mutedColor} size={16} />
            <CustomText className="font-bold text-xs" style={{ color: viewMode === 'calendar' ? textColor : mutedColor }}>Kalender</CustomText>
          </TouchableOpacity>

          <TouchableOpacity 
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setViewMode('kanban'); }} 
            className="flex-1 flex-row items-center justify-center gap-2 py-3 rounded-xl transition-colors"
            style={{ backgroundColor: viewMode === 'kanban' ? cardBgColor : 'transparent', shadowOpacity: viewMode === 'kanban' ? 0.05 : 0 }}
          >
            <KanbanSquare color={viewMode === 'kanban' ? textColor : mutedColor} size={16} />
            <CustomText className="font-bold text-xs" style={{ color: viewMode === 'kanban' ? textColor : mutedColor }}>Kanban</CustomText>
          </TouchableOpacity>
        </View>

        {/* KONTEN UTAMA BERDASARKAN MODE */}
        {todos.length === 0 ? (
          <View className="items-center py-12 px-4 border border-dashed rounded-3xl" style={{ borderColor, backgroundColor: `${borderColor}20` }}>
            <CustomText className="text-sm font-medium mb-4 text-center" style={{ color: mutedColor }}>Belum ada tugas yang dibuat.</CustomText>
          </View>
        ) : (
          <View>
            {viewMode === 'list' && (
              <TodoListView 
                todos={todos} 
                todayStr={todayStr} 
                onToggle={toggleComplete} 
                onDelete={handleDelete} 
                onTogglePin={handleTogglePin} 
              />
            )}
            {viewMode === 'calendar' && (
              <TodoCalendarView 
                todos={todos} 
                todayStr={todayStr} 
                currentMonth={currentMonth}
                setCurrentMonth={setCurrentMonth}
                selectedDate={selectedDate}
                setSelectedDate={setSelectedDate}
                onToggle={toggleComplete} 
                onDelete={handleDelete} 
                onTogglePin={handleTogglePin} 
              />
            )}
            {viewMode === 'kanban' && (
              <TodoKanbanView 
                todos={todos} 
                todayStr={todayStr} 
                onToggle={toggleComplete} 
                onDelete={handleDelete} 
                onTogglePin={handleTogglePin} 
              />
            )}
          </View>
        )}
      </ScrollView>

      {/* Modal Review AI */}
      {reviewData && (
        <WeeklyReviewModal 
           reviewData={reviewData} 
           onClose={() => setReviewData(null)} 
           onSave={handleSaveReview} 
        />
      )}

    </View>
  );
}