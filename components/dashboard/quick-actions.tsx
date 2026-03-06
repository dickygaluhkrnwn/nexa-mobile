import { useRouter } from 'expo-router';
import { Camera, FileText, ListTodo, Mic } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React from 'react';
import { Appearance, TouchableOpacity, View } from 'react-native';
import { CustomText } from '../ui/custom-text';

export function QuickActions() {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark' || ((colorScheme as any) === 'system' && Appearance.getColorScheme() === 'dark');
  
  const cardBgColor = isDark ? '#18181b' : '#ffffff'; 
  const borderColor = isDark ? '#27272a' : '#e4e4e7';
  const textColor = isDark ? '#ffffff' : '#09090b';
  const mutedColor = isDark ? '#a1a1aa' : '#71717a'; // <-- Tambahkan deteksi warna muted

  return (
    <View className="pt-2 mb-4">
      <View className="flex-row gap-3">
        <TouchableOpacity 
          onPress={() => router.push('/create')}
          activeOpacity={0.7}
          className="flex-1 flex-col items-center gap-2.5"
        >
          <View className="w-full aspect-square rounded-[1.25rem] flex items-center justify-center shadow-sm" style={{ backgroundColor: cardBgColor, borderColor: borderColor, borderWidth: 1 }}>
            <FileText color={textColor} size={24} />
          </View>
          <CustomText className="text-[10px] font-bold" style={{ color: mutedColor }}>Teks</CustomText>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => router.push('/create-todo')}
          activeOpacity={0.7}
          className="flex-1 flex-col items-center gap-2.5"
        >
          <View className="w-full aspect-square rounded-[1.25rem] flex items-center justify-center shadow-sm" style={{ backgroundColor: cardBgColor, borderColor: borderColor, borderWidth: 1 }}>
            <ListTodo color={textColor} size={24} />
          </View>
          <CustomText className="text-[10px] font-bold" style={{ color: mutedColor }}>Tugas</CustomText>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => router.push({ pathname: '/create', params: { mode: 'voice' } })}
          activeOpacity={0.7}
          className="flex-1 flex-col items-center gap-2.5"
        >
          <View className="w-full aspect-square rounded-[1.25rem] flex items-center justify-center shadow-sm" style={{ backgroundColor: cardBgColor, borderColor: borderColor, borderWidth: 1 }}>
            <Mic color={textColor} size={24} />
          </View>
          <CustomText className="text-[10px] font-bold" style={{ color: mutedColor }}>Suara</CustomText>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => router.push({ pathname: '/create', params: { mode: 'camera' } })}
          activeOpacity={0.7}
          className="flex-1 flex-col items-center gap-2.5"
        >
          <View className="w-full aspect-square rounded-[1.25rem] flex items-center justify-center shadow-sm" style={{ backgroundColor: cardBgColor, borderColor: borderColor, borderWidth: 1 }}>
            <Camera color={textColor} size={24} />
          </View>
          <CustomText className="text-[10px] font-bold" style={{ color: mutedColor }}>Pindai</CustomText>
        </TouchableOpacity>
      </View>
    </View>
  );
}