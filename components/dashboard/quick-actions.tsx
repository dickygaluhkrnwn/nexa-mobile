import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Camera, FileText, ListTodo, Mic } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React from 'react';
import { Appearance, TouchableOpacity, View } from 'react-native';
import { useSettings } from '../../hooks/use-settings';
import { CustomText } from '../ui/custom-text';

export function QuickActions() {
  const router = useRouter();
  
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark' || ((colorScheme as any) === 'system' && Appearance.getColorScheme() === 'dark');

  const { fontStyle } = useSettings();
  const fontFamily = fontStyle === 'serif' ? 'serif' : fontStyle === 'mono' ? 'monospace' : 'sans-serif';

  return (
    <View className="pt-2 mb-4">
      <View className="flex-row gap-3">
        
        {/* Tombol Teks (Blue Translucent) */}
        <TouchableOpacity 
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/create'); }}
          activeOpacity={0.8}
          className="flex-1 flex-col items-center justify-center gap-1.5 h-[85px] rounded-2xl border shadow-sm"
          style={{ backgroundColor: isDark ? '#1e3a8a' : '#dbeafe', borderColor: isDark ? '#1e40af' : '#bfdbfe' }}
        >
          <FileText color={isDark ? '#60a5fa' : '#2563eb'} size={24} />
          <CustomText 
            className="font-bold text-[10px] uppercase tracking-wider mt-0.5 text-center" 
            style={{ color: isDark ? '#60a5fa' : '#2563eb', fontFamily }}
          >
            Teks
          </CustomText>
        </TouchableOpacity>

        {/* Tombol Tugas (Emerald Translucent) */}
        <TouchableOpacity 
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/create-todo'); }}
          activeOpacity={0.8}
          className="flex-1 flex-col items-center justify-center gap-1.5 h-[85px] rounded-2xl border shadow-sm"
          style={{ backgroundColor: isDark ? '#064e3b' : '#d1fae5', borderColor: isDark ? '#065f46' : '#a7f3d0' }}
        >
          <ListTodo color={isDark ? '#34d399' : '#059669'} size={24} />
          <CustomText 
            className="font-bold text-[10px] uppercase tracking-wider mt-0.5 text-center" 
            style={{ color: isDark ? '#34d399' : '#059669', fontFamily }}
          >
            Tugas
          </CustomText>
        </TouchableOpacity>

        {/* Tombol Suara (Violet Translucent) */}
        <TouchableOpacity 
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push({ pathname: '/create', params: { mode: 'voice' } }); }}
          activeOpacity={0.8}
          className="flex-1 flex-col items-center justify-center gap-1.5 h-[85px] rounded-2xl border shadow-sm"
          style={{ backgroundColor: isDark ? '#3b0764' : '#f3e8ff', borderColor: isDark ? '#581c87' : '#e9d5ff' }}
        >
          <Mic color={isDark ? '#c084fc' : '#9333ea'} size={24} />
          <CustomText 
            className="font-bold text-[10px] uppercase tracking-wider mt-0.5 text-center" 
            style={{ color: isDark ? '#c084fc' : '#9333ea', fontFamily }}
          >
            Suara
          </CustomText>
        </TouchableOpacity>

        {/* Tombol Pindai (Amber Translucent) */}
        <TouchableOpacity 
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push({ pathname: '/create', params: { mode: 'camera' } }); }}
          activeOpacity={0.8}
          className="flex-1 flex-col items-center justify-center gap-1.5 h-[85px] rounded-2xl border shadow-sm"
          style={{ backgroundColor: isDark ? '#78350f' : '#fef3c7', borderColor: isDark ? '#92400e' : '#fde68a' }}
        >
          <Camera color={isDark ? '#fbbf24' : '#d97706'} size={24} />
          <CustomText 
            className="font-bold text-[10px] uppercase tracking-wider mt-0.5 text-center" 
            style={{ color: isDark ? '#fbbf24' : '#d97706', fontFamily }}
          >
            Pindai
          </CustomText>
        </TouchableOpacity>

      </View>
    </View>
  );
}