import { CheckSquare, FileText, LockKeyhole, LogOut } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React from 'react';
import { ActivityIndicator, Appearance, Text, TouchableOpacity, View } from 'react-native';
import { useSettings } from '../../hooks/use-settings';
import { ProductivityHeatmap } from './productivity-heatmap';

interface AccountTabProps {
  stats: { notes: number; todos: number; vault: number };
  loadingStats: boolean;
  activityDates: Date[]; 
  onLogout: () => void;
}

export function AccountTab({ stats, loadingStats, activityDates, onLogout }: AccountTabProps) {
  // 1. Deteksi Mode Gelap & Warna Dinamis
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark' || ((colorScheme as any) === 'system' && Appearance.getColorScheme() === 'dark');
  
  const cardBgColor = isDark ? '#18181b' : '#ffffff';
  const borderColor = isDark ? '#27272a' : '#e4e4e7';
  const textColor = isDark ? '#ffffff' : '#09090b';
  const mutedColor = isDark ? '#a1a1aa' : '#71717a';

  // 2. Ambil Font Global
  const { fontStyle } = useSettings();
  const getFontFamily = () => {
    switch (fontStyle) {
      case 'serif': return 'serif';
      case 'mono': return 'monospace';
      case 'sans': default: return 'sans-serif';
    }
  };
  const fontFamily = getFontFamily();

  return (
    <View className="flex flex-col gap-6">
      {/* Statistik Atas */}
      <View className="flex-row gap-3">
        {/* Card Catatan */}
        <View className="flex-1 border rounded-3xl p-4 items-center shadow-sm" style={{ backgroundColor: cardBgColor, borderColor }}>
          <View className="p-2.5 rounded-2xl mb-2" style={{ backgroundColor: isDark ? '#27272a' : '#f4f4f5' }}>
            <FileText color="#3b82f6" size={24} />
          </View>
          {loadingStats ? (
            <ActivityIndicator size="small" color="#3b82f6" className="my-1" />
          ) : (
            <Text className="text-xl font-black" style={{ color: textColor, fontFamily }}>{stats.notes}</Text>
          )}
          <Text className="text-xs font-bold uppercase mt-1" style={{ color: mutedColor, fontFamily }}>Catatan</Text>
        </View>

        {/* Card Tugas */}
        <View className="flex-1 border rounded-3xl p-4 items-center shadow-sm" style={{ backgroundColor: cardBgColor, borderColor }}>
          <View className="p-2.5 rounded-2xl mb-2" style={{ backgroundColor: isDark ? '#27272a' : '#f4f4f5' }}>
            <CheckSquare color="#f97316" size={24} />
          </View>
          {loadingStats ? (
            <ActivityIndicator size="small" color="#f97316" className="my-1" />
          ) : (
            <Text className="text-xl font-black" style={{ color: textColor, fontFamily }}>{stats.todos}</Text>
          )}
          <Text className="text-xs font-bold uppercase mt-1" style={{ color: mutedColor, fontFamily }}>Tugas</Text>
        </View>

        {/* Card Brankas */}
        <View className="flex-1 border rounded-3xl p-4 items-center shadow-sm" style={{ backgroundColor: cardBgColor, borderColor }}>
          <View className="p-2.5 rounded-2xl mb-2" style={{ backgroundColor: isDark ? '#27272a' : '#f4f4f5' }}>
            <LockKeyhole color="#a855f7" size={24} />
          </View>
          {loadingStats ? (
            <ActivityIndicator size="small" color="#a855f7" className="my-1" />
          ) : (
            <Text className="text-xl font-black" style={{ color: textColor, fontFamily }}>{stats.vault}</Text>
          )}
          <Text className="text-xs font-bold uppercase mt-1" style={{ color: mutedColor, fontFamily }}>Brankas</Text>
        </View>
      </View>

      {/* --- MOUNTING HEATMAP DI SINI --- */}
      <ProductivityHeatmap activityDates={activityDates} />

      {/* Tombol Logout */}
      <TouchableOpacity 
        onPress={onLogout} 
        activeOpacity={0.7} 
        className="w-full flex-row items-center justify-center gap-2 h-14 rounded-2xl border mt-2"
        style={{ backgroundColor: isDark ? '#27272a' : '#f4f4f5', borderColor }}
      >
        <LogOut color="#ef4444" size={20} />
        <Text className="font-bold text-base" style={{ color: '#ef4444', fontFamily }}>Keluar dari Akun</Text>
      </TouchableOpacity>
    </View>
  );
}