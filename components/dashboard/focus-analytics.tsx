import { Activity, BrainCircuit, Clock, Target } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Appearance, Text, View } from 'react-native';
import { useSettings } from '../../hooks/use-settings';
import { useAuth } from '../../lib/auth-context';
import { getUserFocusSessions, getUserNotes } from '../../lib/notes-service';

const accentColors: Record<string, string> = {
  default: '#9333ea', blue: '#3b82f6', emerald: '#10b981',
  amber: '#f59e0b', orange: '#f97316', rose: '#f43f5e', violet: '#8b5cf6',
};

export function FocusAnalytics() {
  const { user } = useAuth();
  const { colorScheme } = useColorScheme();
  const { colorAccent, fontStyle } = useSettings();

  const isDark = colorScheme === 'dark' || ((colorScheme as any) === 'system' && Appearance.getColorScheme() === 'dark');
  
  const cardBgColor = isDark ? '#18181b' : '#ffffff';
  const borderColor = isDark ? '#27272a' : '#e4e4e7';
  const textColor = isDark ? '#ffffff' : '#09090b';
  const mutedColor = isDark ? '#a1a1aa' : '#71717a';

  const primaryHex = accentColors[colorAccent] || accentColors.default;

  // Logika Font manual agar tidak butuh CustomText yang rawan error NativeWind
  const getFontFamily = () => {
    switch (fontStyle) {
      case 'serif': return 'serif';
      case 'mono': return 'monospace';
      case 'sans': default: return 'sans-serif';
    }
  };
  const fontFamily = getFontFamily();

  // State untuk Data Asli
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ sessions: 0, hours: "0m", completionRate: 0 });

  useEffect(() => {
    if (!user) return;

    const fetchAnalytics = async () => {
      try {
        const [focusData, notesData] = await Promise.all([
          getUserFocusSessions(user.uid),
          getUserNotes(user.uid)
        ]);

        // Kalkulasi Batas Waktu Minggu Ini (Senin - Minggu)
        const now = new Date();
        const dayOfWeek = now.getDay();
        const diffToMonday = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        const startOfWeek = new Date(now.setDate(diffToMonday));
        startOfWeek.setHours(0, 0, 0, 0);

        // 1. Hitung Sesi Fokus & Total Waktu
        let sessionCount = 0;
        let totalMinutes = 0;

        focusData.forEach((s: any) => {
          const completedDate = new Date(s.completedAt || (s.timestamp && s.timestamp.toDate ? s.timestamp.toDate() : Date.now()));
          if (completedDate >= startOfWeek) {
            sessionCount++;
            totalMinutes += s.durationMinutes || 0;
          }
        });

        const formattedHours = totalMinutes >= 60
          ? `${(totalMinutes / 60).toFixed(1)}h`
          : `${totalMinutes}m`;

        // 2. Hitung Produktivitas (Rasio Selesai Tugas)
        let weekTodos = 0;
        let completedWeekTodos = 0;
        
        notesData.forEach((n: any) => {
          if (n.isTodo && n.dueDate) {
             const d = new Date(n.dueDate);
             if (d >= startOfWeek) {
                weekTodos++;
                if (n.isCompleted) completedWeekTodos++;
             }
          }
        });

        const rate = weekTodos === 0 ? 0 : Math.round((completedWeekTodos / weekTodos) * 100);

        setStats({ sessions: sessionCount, hours: formattedHours, completionRate: rate });
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [user]);

  return (
    <View className="mb-2">
      <View className="flex-row items-center justify-between mb-4">
        {/* FIX UI: Diselaraskan dengan Recent Notes & Today Focus */}
        <View>
          <View className="flex-row items-center gap-2">
            <Activity color={primaryHex} size={20} />
            <Text className="text-lg font-bold" style={{ fontFamily, color: textColor }}>
              Statistik Fokus
            </Text>
          </View>
          <Text className="text-xs mt-0.5" style={{ fontFamily, color: mutedColor }}>
            Lacak jam produktif dan kinerjamu.
          </Text>
        </View>
        <View className="px-2.5 py-1 rounded-md border" style={{ backgroundColor: `${primaryHex}15`, borderColor: `${primaryHex}30` }}>
          <Text className="text-[9px] font-bold uppercase tracking-widest" style={{ fontFamily, color: primaryHex }}>
            Minggu Ini
          </Text>
        </View>
      </View>

      <View className="flex-row gap-3">
        {/* KARTU 1: Total Sesi */}
        <View className="flex-1 p-4 rounded-2xl border shadow-sm items-center justify-center" style={{ backgroundColor: cardBgColor, borderColor }}>
          <BrainCircuit color={primaryHex} size={24} style={{ marginBottom: 8 }} />
          {loading ? <ActivityIndicator size="small" color={primaryHex} style={{ marginVertical: 4 }} /> : (
            <Text className="text-2xl font-black tabular-nums" style={{ fontFamily, color: textColor }}>{stats.sessions}</Text>
          )}
          <Text className="text-[10px] font-bold uppercase tracking-widest mt-1 text-center" style={{ fontFamily, color: mutedColor }}>Sesi Fokus</Text>
        </View>

        {/* KARTU 2: Total Waktu */}
        <View className="flex-1 p-4 rounded-2xl border shadow-sm items-center justify-center" style={{ backgroundColor: cardBgColor, borderColor }}>
          <Clock color="#3b82f6" size={24} style={{ marginBottom: 8 }} />
          {loading ? <ActivityIndicator size="small" color="#3b82f6" style={{ marginVertical: 4 }} /> : (
            <Text className="text-2xl font-black tabular-nums" style={{ fontFamily, color: textColor }}>{stats.hours}</Text>
          )}
          <Text className="text-[10px] font-bold uppercase tracking-widest mt-1 text-center" style={{ fontFamily, color: mutedColor }}>Waktu Kerja</Text>
        </View>

        {/* KARTU 3: Produktivitas */}
        <View className="flex-1 p-4 rounded-2xl border shadow-sm items-center justify-center" style={{ backgroundColor: cardBgColor, borderColor }}>
          <Target color="#22c55e" size={24} style={{ marginBottom: 8 }} />
          {loading ? <ActivityIndicator size="small" color="#22c55e" style={{ marginVertical: 4 }} /> : (
            <Text className="text-2xl font-black tabular-nums" style={{ fontFamily, color: textColor }}>{stats.completionRate}%</Text>
          )}
          <Text className="text-[10px] font-bold uppercase tracking-widest mt-1 text-center" style={{ fontFamily, color: mutedColor }}>Skor Tuntas</Text>
        </View>
      </View>
    </View>
  );
}