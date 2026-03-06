import { format, subDays } from "date-fns";
import * as Haptics from "expo-haptics";
import { Flame, MoreVertical, Pencil, Plus, Save, Trash2, X } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Appearance, TextInput, TouchableOpacity, View } from "react-native";
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { useAuth } from "../../lib/auth-context";
import { addHabit, deleteHabit, getUserHabits, HabitData, updateHabit } from "../../lib/notes-service";
import { CustomText } from "../ui/custom-text";

const PRESET_COLORS = [
  "#3b82f6", "#10b981", "#f43f5e", "#f59e0b", "#a855f7", "#06b6d4"
];
const PRESET_ICONS = ["💧", "📖", "🏃", "🧘", "🥗", "💻", "💊", "🛏️"];

// --- KOMPONEN ANIMASI API ---
const AnimatedFlame = ({ isCompleted }: { isCompleted: boolean }) => {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (isCompleted) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 700, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) })
        ),
        -1, 
        true
      );
    } else {
      scale.value = withTiming(1, { duration: 300 });
    }
  }, [isCompleted, scale]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  return (
    <Animated.View style={style}>
      <Flame color={isCompleted ? "#ffffff" : "#a1a1aa"} size={44} strokeWidth={isCompleted ? 2.5 : 1.5} />
    </Animated.View>
  );
};

export function HabitTracker() {
  const { user } = useAuth();
  
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark' || ((colorScheme as any) === 'system' && Appearance.getColorScheme() === 'dark');
  const cardBgColor = isDark ? '#18181b' : '#ffffff'; 
  const borderColor = isDark ? '#27272a' : '#e4e4e7';
  const textColor = isDark ? '#ffffff' : '#09090b';
  const mutedColor = isDark ? '#a1a1aa' : '#71717a';

  const [habits, setHabits] = useState<HabitData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [newTitle, setNewTitle] = useState("");
  const [newIcon, setNewIcon] = useState("💧");
  const [newColor, setNewColor] = useState("#3b82f6");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State untuk melacak menu opsi kartu mana yang sedang terbuka
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const todayStr = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
  const yesterdayStr = useMemo(() => format(subDays(new Date(), 1), 'yyyy-MM-dd'), []);

  useEffect(() => {
    if (!user) return;
    const fetchHabits = async () => {
      try {
        const data = await getUserHabits(user.uid);
        setHabits(data);
      } catch (err) {
        console.error("Gagal mengambil data habits", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHabits();
  }, [user]);

  const calculateStreak = (completedDates: string[]) => {
    if (!completedDates || completedDates.length === 0) return 0;
    const sortedDates = [...completedDates].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    let currentStreak = 0;
    let checkDate = new Date(); 
    if (!sortedDates.includes(todayStr) && !sortedDates.includes(yesterdayStr)) return 0;
    while (true) {
        const dateStr = format(checkDate, 'yyyy-MM-dd');
        if (sortedDates.includes(dateStr)) {
            currentStreak++;
            checkDate = subDays(checkDate, 1);
        } else if (dateStr === todayStr) {
           checkDate = subDays(checkDate, 1);
        } else {
            break; 
        }
    }
    return currentStreak;
  };

  const handleOpenAddForm = () => {
    setEditingId(null);
    setNewTitle("");
    setNewIcon("💧");
    setNewColor("#3b82f6");
    setIsAdding(true);
    setActiveMenuId(null);
  };

  const handleOpenEditForm = (habit: HabitData) => {
    setEditingId(habit.id!);
    setNewTitle(habit.title);
    setNewIcon(habit.icon);
    const hColor = habit.color.startsWith('bg-') ? PRESET_COLORS[0] : habit.color;
    setNewColor(hColor);
    setIsAdding(true);
  };

  const handleCloseForm = () => {
    setIsAdding(false);
    setEditingId(null);
  };

  const handleSaveHabit = async () => {
    if (!user) return;
    if (!newTitle.trim()) return Alert.alert("Perhatian", "Nama kebiasaan tidak boleh kosong.");

    setIsSubmitting(true);
    try {
      if (editingId) {
        const updatedHabitData = { title: newTitle.trim(), icon: newIcon, color: newColor };
        await updateHabit(editingId, updatedHabitData);
        setHabits(habits.map(h => h.id === editingId ? { ...h, ...updatedHabitData } : h));
      } else {
        const newHabitData = { userId: user.uid, title: newTitle.trim(), icon: newIcon, color: newColor, completedDates: [] };
        const id = await addHabit(newHabitData);
        setHabits([...habits, { ...newHabitData, id }]);
      }
      handleCloseForm();
    } catch (err) {
      Alert.alert("Gagal", "Terjadi kesalahan saat menyimpan kebiasaan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleHabit = async (habit: HabitData) => {
    if (!user || !habit.id) return;
    const isCompletedToday = habit.completedDates.includes(todayStr);
    let updatedDates = [...habit.completedDates];

    if (isCompletedToday) updatedDates = updatedDates.filter(d => d !== todayStr);
    else updatedDates.push(todayStr);

    setHabits(habits.map(h => h.id === habit.id ? { ...h, completedDates: updatedDates } : h));
    try {
      await updateHabit(habit.id, { completedDates: updatedDates });
    } catch (err) {
      Alert.alert("Gagal", "Gagal menyimpan status kebiasaan.");
      setHabits(habits.map(h => h.id === habit.id ? { ...h, completedDates: habit.completedDates } : h));
    }
  };

  const handleDeleteHabit = (id: string, title: string) => {
    Alert.alert(
      "Hapus Kebiasaan?", 
      `Yakin ingin menghapus tracker "${title}"?`, 
      [
        { text: "Batal", style: "cancel" },
        { 
          text: "Hapus", style: "destructive", 
          onPress: async () => {
            setHabits((prev) => prev.filter((h) => h.id !== id));
            try { await deleteHabit(id); } catch (err) { Alert.alert("Gagal", "Gagal menghapus data."); }
          }
        }
      ]
    );
  };

  return (
    <View className="space-y-4 mb-4 pt-2 relative" style={{ zIndex: activeMenuId ? 100 : 1 }}>
      
      {/* Overlay penutup dropdown jika user klik di luar menu */}
      {activeMenuId && (
        <View style={{ position: 'absolute', top: -1000, bottom: -1000, left: -1000, right: -1000, zIndex: 90, elevation: 90 }}>
          <TouchableOpacity activeOpacity={1} onPress={() => setActiveMenuId(null)} style={{ width: '100%', height: '100%' }} />
        </View>
      )}

      <View className="flex-row items-center justify-between mb-4">
        <View>
          <View className="flex-row items-center gap-2">
            <Flame color="#f97316" size={20} />
            <CustomText className="text-lg font-bold" style={{ color: textColor }}>Habit Tracker</CustomText>
          </View>
          <CustomText className="text-xs" style={{ color: mutedColor }}>Bangun rutinitas positif harianmu.</CustomText>
        </View>
        {!isAdding && (
          <TouchableOpacity onPress={handleOpenAddForm} className="bg-muted px-4 py-2 rounded-full flex-row items-center">
            <Plus color={textColor} size={16} />
            <CustomText className="font-bold text-xs ml-1" style={{ color: textColor }}>Habit</CustomText>
          </TouchableOpacity>
        )}
      </View>

      {isAdding && (
        <View className="rounded-[2rem] p-5 shadow-lg border mb-4" style={{ backgroundColor: cardBgColor, borderColor: '#9333ea80' }}>
          <View className="flex-row items-center justify-between mb-4">
            <CustomText className="font-bold text-sm" style={{ color: textColor }}>{editingId ? "Edit Kebiasaan" : "Kebiasaan Baru"}</CustomText>
            <TouchableOpacity onPress={handleCloseForm} className="p-1 rounded-full"><X color={mutedColor} size={20}/></TouchableOpacity>
          </View>
          
          <View className="space-y-4">
            <TextInput 
              placeholder="Contoh: Baca Buku 15 Menit" 
              placeholderTextColor={mutedColor}
              value={newTitle}
              onChangeText={setNewTitle}
              className="w-full bg-muted/50 py-3 px-4 rounded-xl text-sm font-semibold"
              style={{ color: textColor }}
              autoFocus
            />
            
            <View>
              <CustomText className="text-xs font-semibold mb-2" style={{ color: mutedColor }}>Pilih Ikon</CustomText>
              <View className="flex-row flex-wrap gap-2">
                {PRESET_ICONS.map(icon => (
                  <TouchableOpacity key={icon} onPress={() => setNewIcon(icon)} className={`w-10 h-10 rounded-xl flex items-center justify-center ${newIcon === icon ? 'bg-primary/20 border-2 border-primary' : 'bg-muted'}`}>
                    <CustomText className="text-xl">{icon}</CustomText>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View>
              <CustomText className="text-xs font-semibold mb-2" style={{ color: mutedColor }}>Pilih Warna Aksen</CustomText>
              <View className="flex-row gap-2 flex-wrap">
                {PRESET_COLORS.map(color => (
                  <TouchableOpacity key={color} onPress={() => setNewColor(color)} className={`w-8 h-8 rounded-full border-2 ${newColor === color ? 'border-foreground' : 'border-transparent'}`} style={{ backgroundColor: color }} />
                ))}
              </View>
            </View>

            <TouchableOpacity onPress={handleSaveHabit} disabled={isSubmitting || !newTitle.trim()} className="w-full rounded-xl py-3 mt-2 bg-primary flex-row items-center justify-center">
              {isSubmitting ? <ActivityIndicator color="#fff" size="small" /> : <Save color="#fff" size={16} />}
              <CustomText className="font-bold text-white ml-2">{editingId ? "Simpan Perubahan" : "Simpan Habit"}</CustomText>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {isLoading ? (
        <View className="h-24 items-center justify-center border border-dashed rounded-3xl" style={{ borderColor: borderColor }}><ActivityIndicator color="#9333ea" /></View>
      ) : !isAdding && habits.length === 0 ? (
        <View className="p-6 text-center border border-dashed rounded-3xl" style={{ borderColor: borderColor }}>
          <CustomText className="text-sm font-medium text-center" style={{ color: mutedColor }}>Belum ada kebiasaan yang dilacak.</CustomText>
        </View>
      ) : (
        <View className="flex-row flex-wrap justify-between">
          {habits.map((habit, index) => {
            const isCompletedToday = habit.completedDates.includes(todayStr);
            const currentStreak = calculateStreak(habit.completedDates);
            const activeColor = habit.color.startsWith('bg-') ? PRESET_COLORS[0] : habit.color;
            
            // Logika Dynamic Bento Grid: Jika total item ganjil dan ini elemen terakhir, lebarkan jadi 100%
            const isLastOdd = habits.length % 2 !== 0 && index === habits.length - 1;

            return (
              <View 
                key={habit.id} 
                className={`${isLastOdd ? 'w-full' : 'w-[48%]'} mb-4 relative flex-col p-4 rounded-3xl border shadow-sm`}
                style={{ 
                  backgroundColor: isCompletedToday ? activeColor : cardBgColor, 
                  borderColor: isCompletedToday ? activeColor : borderColor,
                  zIndex: activeMenuId === habit.id ? 100 : 1 // Angkat layer jika menu terbuka
                }}
              >
                
                {/* Judul (Diperbarui agar Ikon & Teks sejajar kesamping, max 1 baris) */}
                <View className="flex-row items-center justify-between z-50">
                  <View className="flex-row items-center flex-1 pr-2">
                    <View className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-sm mr-2.5 shrink-0 ${isCompletedToday ? 'bg-white/20' : 'bg-muted'}`}>
                      <CustomText className="text-lg">{habit.icon}</CustomText>
                    </View>
                    <CustomText 
                      className="font-bold text-[13px] flex-1" 
                      style={{ color: isCompletedToday ? '#fff' : textColor }} 
                      numberOfLines={1} // Dibatasi 1 baris dengan "..." di ujungnya
                    >
                      {habit.title}
                    </CustomText>
                  </View>

                  {!isCompletedToday && (
                    <TouchableOpacity 
                      onPress={() => setActiveMenuId(activeMenuId === habit.id ? null : habit.id!)}
                      className="p-1 -mr-2 shrink-0 rounded-full"
                    >
                      <MoreVertical color={mutedColor} size={18} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Dropdown Menu (Titik Tiga) */}
                {activeMenuId === habit.id && !isCompletedToday && (
                  <View className="absolute top-12 right-2 w-32 bg-card border border-border rounded-2xl shadow-xl overflow-hidden z-[100] elevation-10">
                    <TouchableOpacity 
                      onPress={() => { handleOpenEditForm(habit); setActiveMenuId(null); }}
                      className="flex-row items-center px-4 py-3 border-b border-border/50"
                      style={{ backgroundColor: cardBgColor }}
                    >
                      <Pencil color={mutedColor} size={14} />
                      <CustomText className="text-xs ml-2 font-bold" style={{ color: textColor }}>Edit Habit</CustomText>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      onPress={() => { setActiveMenuId(null); handleDeleteHabit(habit.id!, habit.title); }}
                      className="flex-row items-center px-4 py-3"
                      style={{ backgroundColor: cardBgColor }}
                    >
                      <Trash2 color="#ef4444" size={14} />
                      <CustomText className="text-xs ml-2 font-bold text-destructive">Hapus</CustomText>
                    </TouchableOpacity>
                  </View>
                )}

                {/* --- AREA API INTERAKTIF & ANIMASI --- */}
                <TouchableOpacity 
                  activeOpacity={0.7}
                  onPress={() => {
                    if(activeMenuId) setActiveMenuId(null); // Tutup menu jika klik api
                    Haptics.impactAsync(isCompletedToday ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium);
                    handleToggleHabit(habit);
                  }}
                  className="flex-col items-center justify-center mt-3 pt-2"
                >
                  <AnimatedFlame isCompleted={isCompletedToday} />
                  
                  <CustomText className="text-2xl font-black tracking-tighter mt-1" style={{ color: isCompletedToday ? '#fff' : textColor }}>
                    {currentStreak} <CustomText className="text-[10px] font-bold uppercase tracking-widest opacity-80" style={{ color: isCompletedToday ? '#fff' : textColor }}>Hari</CustomText>
                  </CustomText>
                  
                  {/* Teks Instruksi agar user tau ini bisa dipencet */}
                  {!isCompletedToday ? (
                    <View className="mt-2 bg-muted px-2 py-1 rounded-full border border-border/50">
                       <CustomText className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Ketuk Api 🔥</CustomText>
                    </View>
                  ) : (
                    <View className="mt-2">
                      <CustomText className="text-[9px] font-bold text-white/70 uppercase tracking-widest">
                         Ketuk untuk Batal
                      </CustomText>
                    </View>
                  )}
                </TouchableOpacity>

              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}