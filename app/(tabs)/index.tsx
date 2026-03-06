import { useRouter } from 'expo-router';
import { CloudOff, Sparkles, User as UserIcon } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Appearance, Image, RefreshControl, ScrollView, TouchableOpacity, View } from 'react-native'; // <-- Import Image ditambahkan
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header, useHeaderAnimation } from '../../components/Header';
import { CustomText } from '../../components/ui/custom-text';
import { useAuth } from '../../lib/auth-context';
import { getUserNotes } from '../../lib/notes-service';

// Komponen Dashboard Terpisah
import { DailyBriefingModal } from '../../components/ai/daily-briefing-modal'; // <-- 1. IMPORT MODAL
import { DashboardHero } from '../../components/dashboard/dashboard-hero';
import { FocusAnalytics } from '../../components/dashboard/focus-analytics';
import { QuickActions } from '../../components/dashboard/quick-actions';
import { RecentNotes } from '../../components/dashboard/recent-notes';
import { TodayFocus } from '../../components/dashboard/today-focus';
import { HabitTracker } from '../../components/todo/habit-tracker';

// Helper format tanggal lokal
const getLocalIsoDate = (d: Date) => {
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().split('T')[0];
};

export default function DashboardScreen() {
  const { user, loading, loginAsGuest } = useAuth();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark' || ((colorScheme as any) === 'system' && Appearance.getColorScheme() === 'dark');
  const textColor = isDark ? '#ffffff' : '#09090b';
  const mutedColor = isDark ? '#a1a1aa' : '#71717a';

  const [notes, setNotes] = useState<any[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isOffline, setIsOffline] = useState(false);

  // --- AMBIL DATA ANIMASI DARI HOOK ---
  const { headerTranslateY, handleScroll } = useHeaderAnimation();

  const todayStr = useMemo(() => getLocalIsoDate(new Date()), []);
  const todayFormatted = useMemo(() => {
    return new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      loginAsGuest();
    }
  }, [user, loading, loginAsGuest]);

  const fetchNotes = async () => {
    if (!user) return;
    try {
      // Berkat persistentLocalCache, data akan ditarik dari cache lokal secara instan jika internet mati
      const data = await getUserNotes(user.uid);
      setNotes(data);
      setIsOffline(false);
    } catch (error) {
      console.error("Gagal mengambil catatan:", error);
      setIsOffline(true);
    } finally {
      setLoadingNotes(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user) fetchNotes();
  }, [user]);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchNotes();
  }, [user]);

  if (loading || !user) {
    return (
      <View className="flex-1 bg-background justify-center items-center">
        <ActivityIndicator size="large" color="#9333ea" />
        <CustomText className="mt-4 font-medium" style={{ color: mutedColor }}>Menyiapkan ruang kerjamu...</CustomText>
      </View>
    );
  }

  // --- PENGOLAHAN DATA DASHBOARD ---
  const visibleNotes = notes.filter((n) => !n.isHidden);
  const totalNotes = visibleNotes.filter((n) => !n.isTodo).length;
  
  // Data Tugas
  const pendingTodos = visibleNotes.filter((n) => n.isTodo && !n.isCompleted);
  const overdueTodos = pendingTodos.filter((n) => n.dueDate && n.dueDate < todayStr);
  const todayTodos = pendingTodos.filter((n) => n.dueDate === todayStr);
  
  // Ringkasan untuk UI (3 Tugas Mendadak & 4 Catatan Terbaru)
  const urgentTasks = [...overdueTodos, ...todayTodos].slice(0, 3);
  const recentNotes = visibleNotes.filter((n) => !n.isTodo).slice(0, 4);
  
  return (
    <View className="flex-1 bg-background"> 
      <Header translateY={headerTranslateY} />
      
      <ScrollView 
        contentContainerStyle={{ 
          paddingTop: insets.top + 70, 
          paddingHorizontal: 16, 
          paddingBottom: 100 
        }} 
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}       
        scrollEventThrottle={16}      
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor="#9333ea" 
            progressViewOffset={insets.top + 70} 
          />
        }
      >
        
        {/* 1. Header & Greeting */}
        <View className="flex-row items-center justify-between mb-6 mt-2">
          <View>
            <View className="flex-row items-center gap-1.5 mb-1">
              <Sparkles color="#9333ea" size={12} />
              <CustomText className="text-[10px] font-bold uppercase tracking-widest" style={{ color: mutedColor }}>
                {todayFormatted}
              </CustomText>
              
              {/* Indikator Mode Offline */}
              {isOffline && (
                <View className="flex-row items-center gap-1 ml-2 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                  <CloudOff color="#ef4444" size={10} />
                  <CustomText className="text-[9px] font-bold text-red-500 uppercase tracking-widest">Offline Mode</CustomText>
                </View>
              )}
            </View>
            <CustomText className="text-3xl font-black tracking-tight" style={{ color: textColor }}>
              Halo, {user.isAnonymous ? "Tamu" : (user.displayName?.split(" ")[0] || "Pengguna")} 👋
            </CustomText>
          </View>
          
          {/* FIX: Profil Gambar / Avatar */}
          <TouchableOpacity onPress={() => router.push('/profile')} activeOpacity={0.8} className="w-12 h-12 rounded-full overflow-hidden bg-muted items-center justify-center border-2 border-border shadow-sm">
            {user.photoURL ? (
              <Image source={{ uri: user.photoURL }} className="w-full h-full" />
            ) : (
              <UserIcon color={mutedColor} size={24} />
            )}
          </TouchableOpacity>
        </View>

        {loadingNotes ? (
          <ActivityIndicator size="large" color="#9333ea" className="mt-10" />
        ) : (
          <>
            {/* 2. Hero Dashboard (Kotak Ungu) */}
            <DashboardHero pendingTodosCount={pendingTodos.length} totalNotesCount={totalNotes} />

            {/* 3. Quick Actions (4 Tombol AI) */}
            <QuickActions />

            <View className="w-full h-px bg-border/50 my-5" />

            {/* 4. Fokus Hari Ini */}
            <TodayFocus urgentTasks={urgentTasks} pendingTodosCount={pendingTodos.length} todayStr={todayStr} />

            <View className="w-full h-px bg-border/50 my-5" />

            {/* 5. Habit Tracker (Rutinitas) */}
            <HabitTracker />

            <View className="w-full h-px bg-border/50 my-5" />

            {/* 6. Analitik Fokus Pomodoro */}
            <FocusAnalytics />

            <View className="w-full h-px bg-border/50 my-6" />

            {/* 7. Catatan Terbaru */}
            <RecentNotes recentNotes={recentNotes} />
          </>
        )}
      </ScrollView>

      {/* <-- 2. TAMBAHKAN DI PALING BAWAH (di luar ScrollView) --> */}
      <DailyBriefingModal />
    </View>
  );
}