import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Brain, KeyRound, LockKeyhole, Network, Waypoints } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React from 'react';
import { Appearance, TouchableOpacity, View } from 'react-native';
import { useSettings } from '../../hooks/use-settings';
import { CustomText } from '../ui/custom-text';

interface NotesActionsProps {
  isVaultOpen: boolean;
  onToggleVault: () => void;
  onOpenFlashcard: () => void;
  onOpenMindMap: () => void;
}

export function NotesActions({ isVaultOpen, onToggleVault, onOpenFlashcard, onOpenMindMap }: NotesActionsProps) {
  const router = useRouter();
  
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark' || ((colorScheme as any) === 'system' && Appearance.getColorScheme() === 'dark');

  const { fontStyle } = useSettings();
  const fontFamily = fontStyle === 'serif' ? 'serif' : fontStyle === 'mono' ? 'monospace' : 'sans-serif';

  return (
    <View className="mb-6 flex-row gap-3">
      
      {/* Tombol Peta Semesta (Orange Translucent) */}
      <TouchableOpacity 
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/network' as any); }}
        activeOpacity={0.8}
        className="flex-1 flex-col items-center justify-center gap-1.5 h-[85px] rounded-2xl border shadow-sm"
        style={{ backgroundColor: isDark ? '#7c2d12' : '#ffedd5', borderColor: isDark ? '#9a3412' : '#fed7aa' }}
      >
        <Network color={isDark ? '#fdba74' : '#ea580c'} size={24} />
        <CustomText className="font-bold text-[10px] uppercase tracking-wider mt-0.5 text-center" style={{ color: isDark ? '#fdba74' : '#ea580c', fontFamily }}>
          Semesta
        </CustomText>
      </TouchableOpacity>

      {/* Tombol Kuis AI (Indigo Translucent) */}
      <TouchableOpacity 
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onOpenFlashcard(); }}
        activeOpacity={0.8}
        className="flex-1 flex-col items-center justify-center gap-1.5 h-[85px] rounded-2xl border shadow-sm"
        style={{ backgroundColor: isDark ? '#312e81' : '#e0e7ff', borderColor: isDark ? '#4338ca' : '#c7d2fe' }}
      >
        <Brain color={isDark ? '#818cf8' : '#4f46e5'} size={24} />
        <CustomText className="font-bold text-[10px] uppercase tracking-wider mt-0.5 text-center" style={{ color: isDark ? '#818cf8' : '#4f46e5', fontFamily }}>
          Kuis AI
        </CustomText>
      </TouchableOpacity>

      {/* Tombol Mind Map (Rose Translucent) */}
      <TouchableOpacity 
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onOpenMindMap(); }}
        activeOpacity={0.8}
        className="flex-1 flex-col items-center justify-center gap-1.5 h-[85px] rounded-2xl border shadow-sm"
        style={{ backgroundColor: isDark ? '#4c0519' : '#ffe4e6', borderColor: isDark ? '#881337' : '#fecdd3' }}
      >
        <Waypoints color={isDark ? '#fb7185' : '#e11d48'} size={24} />
        <CustomText className="font-bold text-[10px] uppercase tracking-wider mt-0.5 text-center" style={{ color: isDark ? '#fb7185' : '#e11d48', fontFamily }}>
          Mind Map
        </CustomText>
      </TouchableOpacity>

      {/* Tombol Brankas (Merah / Hijau Translucent) */}
      <TouchableOpacity 
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onToggleVault(); }}
        activeOpacity={0.8}
        className="flex-1 flex-col items-center justify-center gap-1.5 h-[85px] rounded-2xl border shadow-sm"
        style={{ 
          backgroundColor: isVaultOpen ? (isDark ? '#14532d' : '#dcfce7') : (isDark ? '#7f1d1d' : '#fee2e2'), 
          borderColor: isVaultOpen ? (isDark ? '#166534' : '#bbf7d0') : (isDark ? '#991b1b' : '#fecaca')
        }}
      >
        {isVaultOpen ? <LockKeyhole color={isDark ? '#4ade80' : '#16a34a'} size={24} /> : <KeyRound color={isDark ? '#fca5a5' : '#dc2626'} size={24} />}
        <CustomText 
          className="font-bold text-[10px] uppercase tracking-wider mt-0.5 text-center" 
          style={{ color: isVaultOpen ? (isDark ? '#4ade80' : '#16a34a') : (isDark ? '#fca5a5' : '#dc2626'), fontFamily }}
        >
          {isVaultOpen ? "Tutup" : "Brankas"}
        </CustomText>
      </TouchableOpacity>

    </View>
  );
}