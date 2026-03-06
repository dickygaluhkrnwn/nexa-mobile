import { useRouter } from 'expo-router';
import { FileText, ListTodo } from 'lucide-react-native';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native'; // <-- IMPORT TEXT ASLI
import { useSettings } from '../../hooks/use-settings';

const accentColors: Record<string, string> = {
  default: '#9333ea', blue: '#3b82f6', emerald: '#10b981',
  amber: '#f59e0b', orange: '#f97316', rose: '#f43f5e', violet: '#8b5cf6',
};

interface DashboardHeroProps {
  pendingTodosCount: number;
  totalNotesCount: number;
}

export function DashboardHero({ pendingTodosCount, totalNotesCount }: DashboardHeroProps) {
  const router = useRouter();
  const { colorAccent, fontStyle } = useSettings();
  const primaryHex = accentColors[colorAccent] || accentColors.default;

  // --- LOGIKA FONT MANUAL ANTI-CRASH ---
  const getFontFamily = () => {
    switch (fontStyle) {
      case 'serif': return 'serif';
      case 'mono': return 'monospace';
      case 'sans': default: return 'sans-serif';
    }
  };
  const fontFamily = getFontFamily();

  return (
    <View 
      className="rounded-[2rem] p-6 shadow-xl overflow-hidden mb-4"
      style={{ backgroundColor: primaryHex }}
    >
      <View className="relative z-10">
        <Text className="font-bold text-sm text-white/80 uppercase tracking-widest mb-4" style={{ fontFamily }}>
          Ringkasan Hari Ini
        </Text>
        
        <View className="flex-row gap-3">
          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={() => router.push('/todo')}
            className="flex-1 bg-white/10 border border-white/20 p-4 rounded-2xl flex-col justify-between"
          >
            <View className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center mb-3">
              <ListTodo color="#ffffff" size={16} />
            </View>
            <View>
              <Text className="text-3xl font-black text-white" style={{ fontFamily }}>{pendingTodosCount}</Text>
              <Text className="text-[10px] font-bold text-white/80 uppercase tracking-widest mt-1" style={{ fontFamily }}>Tugas Aktif</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={() => router.push('/notes')}
            className="flex-1 bg-white/10 border border-white/20 p-4 rounded-2xl flex-col justify-between"
          >
            <View className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center mb-3">
              <FileText color="#ffffff" size={16} />
            </View>
            <View>
              <Text className="text-3xl font-black text-white" style={{ fontFamily }}>{totalNotesCount}</Text>
              <Text className="text-[10px] font-bold text-white/80 uppercase tracking-widest mt-1" style={{ fontFamily }}>Total Catatan</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}