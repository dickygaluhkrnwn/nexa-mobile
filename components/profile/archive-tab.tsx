import { Archive, Sparkles } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React from 'react';
import { Appearance, Text, TouchableOpacity, View } from 'react-native';
import { useSettings } from '../../hooks/use-settings';

interface ArchiveTabProps {
  archivedReviews: any[];
}

const accentColors: Record<string, string> = {
  default: '#9333ea', blue: '#3b82f6', emerald: '#10b981',
  amber: '#f59e0b', orange: '#f97316', rose: '#f43f5e', violet: '#8b5cf6',
};

export function ArchiveTab({ archivedReviews }: ArchiveTabProps) {
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

  return (
    <View className="flex flex-col gap-4">
      <Text className="text-xs font-bold uppercase tracking-widest px-1" style={{ color: mutedColor, fontFamily }}>
        Laporan Mingguan
      </Text>
      
      {archivedReviews.length === 0 ? (
        <View className="border border-dashed rounded-3xl p-8 items-center" style={{ backgroundColor: cardBgColor, borderColor }}>
          <View className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: isDark ? '#27272a' : '#f4f4f5' }}>
            <Archive color={mutedColor} size={32} />
          </View>
          <Text className="text-sm font-bold text-center" style={{ color: textColor, fontFamily }}>Belum ada arsip.</Text>
          <Text className="text-xs mt-2 text-center" style={{ color: mutedColor, fontFamily }}>Laporan mingguan AI yang disimpan dari To-Do akan muncul di sini.</Text>
        </View>
      ) : (
        <View className="flex flex-col gap-3">
          {archivedReviews.map(review => (
            <TouchableOpacity 
              key={review.id} 
              activeOpacity={0.7} 
              className="border p-4 rounded-3xl shadow-sm flex flex-row items-start gap-4"
              style={{ backgroundColor: cardBgColor, borderColor }}
            >
              <View className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${primaryHex}15` }}>
                 <Sparkles color={primaryHex} size={24} />
              </View>
              <View className="flex-1 min-w-0 pt-1">
                <Text className="font-bold text-sm mb-1" style={{ color: textColor, fontFamily }}>
                  {review.title || "Laporan Mingguan"}
                </Text>
                <Text className="text-xs" style={{ color: mutedColor, fontFamily }} numberOfLines={2}>
                  {review.content.replace(/<[^>]+>/g, ' ')}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}