import * as Haptics from 'expo-haptics';
import { Calendar, Clock, Repeat } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React from "react";
import { Appearance, ScrollView, TextInput, TouchableOpacity, View } from "react-native";
import { CustomText } from "../ui/custom-text";

interface TaskSettingsProps {
  dueDate: string;
  setDueDate: (date: string) => void;
  dueTime: string;
  setDueTime: (time: string) => void;
  recurrence: string;
  setRecurrence: (recurrence: string) => void;
}

export function TaskSettings({ dueDate, setDueDate, dueTime, setDueTime, recurrence, setRecurrence }: TaskSettingsProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark' || ((colorScheme as any) === 'system' && Appearance.getColorScheme() === 'dark');
  const cardBgColor = isDark ? '#18181b' : '#ffffff';
  const borderColor = isDark ? '#27272a' : '#e4e4e7';
  const textColor = isDark ? '#ffffff' : '#09090b';
  const mutedColor = isDark ? '#a1a1aa' : '#71717a';

  const recurrences = [
    { id: 'none', label: 'Hanya Sekali' },
    { id: 'daily', label: 'Harian' },
    { id: 'weekly', label: 'Mingguan' },
    { id: 'monthly', label: 'Bulanan' },
  ];

  return (
    <View className="flex-col">
      
      {/* FIX UTAMA: Tambahkan mb-4 (Margin Bottom) di sini agar tidak menempel dengan kartu di bawahnya */}
      <View className="flex-row gap-3 mb-4">
        
        {/* Tanggal */}
        <View className="flex-1 flex-row items-center gap-3 p-3 rounded-2xl border shadow-sm" style={{ backgroundColor: cardBgColor, borderColor }}>
          <View className="p-2 bg-orange-500/10 rounded-xl"><Calendar color="#ea580c" size={20} /></View>
          <View className="flex-1">
            <CustomText className="text-[10px] font-bold text-orange-600 uppercase tracking-wider mb-0.5">Tenggat</CustomText>
            <TextInput 
              placeholder="YYYY-MM-DD" 
              placeholderTextColor={mutedColor}
              value={dueDate} 
              onChangeText={setDueDate} 
              className="text-sm font-bold p-0" 
              style={{ color: textColor }} 
            />
          </View>
        </View>

        {/* Waktu */}
        <View className="flex-1 flex-row items-center gap-3 p-3 rounded-2xl border shadow-sm" style={{ backgroundColor: cardBgColor, borderColor }}>
          <View className="p-2 bg-blue-500/10 rounded-xl"><Clock color="#2563eb" size={20} /></View>
          <View className="flex-1">
            <CustomText className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-0.5">Jam</CustomText>
            <TextInput 
              placeholder="00:00" 
              placeholderTextColor={mutedColor}
              value={dueTime} 
              onChangeText={setDueTime} 
              className="text-sm font-bold p-0" 
              style={{ color: textColor }} 
            />
          </View>
        </View>
      </View>

      {/* Looping (Recurrence) menggunakan Chips Scroll */}
      <View className="p-4 rounded-2xl border shadow-sm" style={{ backgroundColor: cardBgColor, borderColor }}>
        <View className="flex-row items-center gap-2 mb-3">
          <Repeat color="#9333ea" size={16} />
          <CustomText className="text-xs font-bold text-purple-600 uppercase tracking-wider">Pengulangan Rutin</CustomText>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
          {recurrences.map(item => (
            <TouchableOpacity 
              key={item.id}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setRecurrence(item.id); }}
              className="px-4 py-2 rounded-full border mr-2"
              style={{ 
                backgroundColor: recurrence === item.id ? '#9333ea' : (isDark ? '#27272a' : '#f4f4f5'), 
                borderColor: recurrence === item.id ? '#9333ea' : 'transparent' 
              }}
            >
              <CustomText className="text-xs font-bold" style={{ color: recurrence === item.id ? '#ffffff' : mutedColor }}>
                {item.label}
              </CustomText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
    </View>
  );
}