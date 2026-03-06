import { addMonths, format, getDay, getDaysInMonth, isSameDay, startOfMonth, subMonths } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Info } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React, { useMemo, useState } from "react";
import { Appearance, Text, TouchableOpacity, View } from "react-native";
import { useSettings } from "../../hooks/use-settings";

interface ProductivityHeatmapProps {
  activityDates: Date[];
}

const accentColors: Record<string, string> = {
  default: '#9333ea', blue: '#3b82f6', emerald: '#10b981',
  amber: '#f59e0b', orange: '#f97316', rose: '#f43f5e', violet: '#8b5cf6',
};

export function ProductivityHeatmap({ activityDates }: ProductivityHeatmapProps) {
  // 1. Deteksi Mode Gelap & Warna Dinamis
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark' || ((colorScheme as any) === 'system' && Appearance.getColorScheme() === 'dark');
  
  const cardBgColor = isDark ? '#18181b' : '#ffffff';
  const borderColor = isDark ? '#27272a' : '#e4e4e7';
  const textColor = isDark ? '#ffffff' : '#09090b';
  const mutedColor = isDark ? '#a1a1aa' : '#71717a';

  // 2. Ambil Font Global & Warna Aksen
  const { fontStyle, colorAccent } = useSettings();
  const getFontFamily = () => {
    switch (fontStyle) {
      case 'serif': return 'serif';
      case 'mono': return 'monospace';
      case 'sans': default: return 'sans-serif';
    }
  };
  const fontFamily = getFontFamily();
  const primaryHex = accentColors[colorAccent] || accentColors.default;

  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(today));

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  let firstDayIndex = getDay(currentMonth) - 1;
  if (firstDayIndex === -1) firstDayIndex = 6;

  const daysInMonth = getDaysInMonth(currentMonth);

  const activityMap = useMemo(() => {
    const map = new Map<string, number>();
    const currentMonthStr = format(currentMonth, 'yyyy-MM');
    
    activityDates.forEach(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      if (dateStr.startsWith(currentMonthStr)) {
        map.set(dateStr, (map.get(dateStr) || 0) + 1);
      }
    });
    return map;
  }, [activityDates, currentMonth]);

  const getColorClass = (count: number) => {
    if (count === 0) return "bg-muted/50 border-border/50";
    if (count === 1) return "bg-green-500/30 border-green-500/20";
    if (count >= 2 && count <= 3) return "bg-green-500/60 border-green-500/40";
    if (count >= 4 && count <= 5) return "bg-green-500/80 border-green-500/60";
    return "bg-green-500 border-green-600";
  };

  // Logika warna teks kotak tanggal agar jelas (kontras)
  const getTextColor = (count: number) => {
    if (count === 0) return mutedColor;
    if (count === 1) return textColor;
    return "#ffffff"; // Jika sangat hijau, pastikan teksnya putih
  };

  const gridDays = [];
  for (let i = 0; i < firstDayIndex; i++) gridDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) gridDays.push(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i));

  const weekDays = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
  const totalContributionsThisMonth = Array.from(activityMap.values()).reduce((a, b) => a + b, 0);

  return (
    <View className="space-y-3 mt-2">
      <View className="rounded-[2rem] p-5 shadow-sm border" style={{ backgroundColor: cardBgColor, borderColor }}>
        <View className="flex-row items-center justify-between mb-5">
          <View>
            <Text className="font-bold text-sm" style={{ color: textColor, fontFamily }}>Jejak Aktivitas</Text>
            <View className="flex-row items-center gap-2 mt-1">
              <TouchableOpacity onPress={handlePrevMonth} className="p-1 rounded-full hover:bg-muted">
                <ChevronLeft color={mutedColor} size={16} />
              </TouchableOpacity>
              <Text className="text-xs capitalize font-semibold min-w-[80px] text-center" style={{ color: mutedColor, fontFamily }}>
                {format(currentMonth, 'MMM yyyy', { locale: localeId })}
              </Text>
              <TouchableOpacity 
                onPress={handleNextMonth} 
                disabled={isSameDay(startOfMonth(currentMonth), startOfMonth(today))}
                className={`p-1 rounded-full ${isSameDay(startOfMonth(currentMonth), startOfMonth(today)) ? 'opacity-50' : 'hover:bg-muted'}`}
              >
                <ChevronRight color={mutedColor} size={16} />
              </TouchableOpacity>
            </View>
          </View>
          
          <View className="px-2 py-1 rounded-md border" style={{ backgroundColor: `${primaryHex}15`, borderColor: `${primaryHex}30` }}>
            <Text className="text-[10px] font-bold" style={{ color: primaryHex, fontFamily }}>
              {totalContributionsThisMonth} Kontribusi
            </Text>
          </View>
        </View>

        <View className="flex-col gap-2">
          <View className="flex-row justify-between text-center mb-1">
            {weekDays.map((day, i) => (
              <Text key={i} className="flex-1 text-[10px] font-bold tracking-wider text-center" style={{ color: mutedColor, fontFamily }}>
                {day}
              </Text>
            ))}
          </View>

          <View className="flex-row flex-wrap">
            {gridDays.map((date, index) => {
              if (!date) {
                return <View key={`empty-${index}`} style={{ width: '14.28%', aspectRatio: 1, padding: 2 }} />;
              }
              
              const dateStr = format(date, 'yyyy-MM-dd');
              const count = activityMap.get(dateStr) || 0;
              const isTodayDate = isSameDay(date, today);

              return (
                <View key={index} style={{ width: '14.28%', aspectRatio: 1, padding: 2 }}>
                  <View 
                    className={`w-full h-full rounded-xl border items-center justify-center ${getColorClass(count)}`}
                    // Indikator hari ini menggunakan border warna utama
                    style={isTodayDate ? { borderColor: primaryHex, borderWidth: 2 } : {}}
                  >
                    <Text className="text-xs font-bold" style={{ color: getTextColor(count), fontFamily }}>
                      {date.getDate()}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
        
        <View className="flex-row items-center justify-center gap-2 mt-5 pt-4 border-t" style={{ borderColor: `${borderColor}80` }}>
          <Text className="text-[10px] font-medium" style={{ color: mutedColor, fontFamily }}>Sedikit</Text>
          <View className="flex-row gap-1.5">
            <View className="w-4 h-4 rounded-md bg-muted/50 border border-border/50" />
            <View className="w-4 h-4 rounded-md bg-green-500/30 border border-green-500/20" />
            <View className="w-4 h-4 rounded-md bg-green-500/60 border border-green-500/40" />
            <View className="w-4 h-4 rounded-md bg-green-500/80 border border-green-500/60" />
            <View className="w-4 h-4 rounded-md bg-green-500 border border-green-600" />
          </View>
          <Text className="text-[10px] font-medium" style={{ color: mutedColor, fontFamily }}>Banyak</Text>
        </View>
      </View>

      <View className="flex-row items-start gap-2.5 p-3.5 rounded-2xl border mt-2" style={{ backgroundColor: isDark ? '#27272a50' : '#f4f4f5', borderColor }}>
        <Info color={primaryHex} size={16} className="shrink-0 mt-0.5" />
        <Text className="text-xs leading-relaxed flex-1" style={{ color: mutedColor, fontFamily }}>
          <Text className="font-bold" style={{ color: textColor, fontFamily }}>Logika Jejak Aktivitas: </Text>
          Tingkat warna hijau ditentukan oleh jumlah "Kontribusi" harian, yaitu total dari Catatan Baru dan Tugas yang diselesaikan. Makin produktif, makin menyala! 🔥
        </Text>
      </View>
    </View>
  );
}