import { Lightbulb, Target, X } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React from 'react';
import { Appearance, Modal, ScrollView, TouchableOpacity, View } from 'react-native';
import { CustomText } from '../ui/custom-text';

interface WeeklyReviewModalProps {
  reviewData: any;
  onClose: () => void;
  onSave: () => void;
}

export function WeeklyReviewModal({ reviewData, onClose, onSave }: WeeklyReviewModalProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark' || ((colorScheme as any) === 'system' && Appearance.getColorScheme() === 'dark');
  
  const cardBgColor = isDark ? '#18181b' : '#ffffff';
  const textColor = isDark ? '#ffffff' : '#09090b';
  const mutedColor = isDark ? '#a1a1aa' : '#71717a';
  const borderColor = isDark ? '#27272a' : '#e4e4e7';

  // FIX: Warna Solid Anti-Glitch Kertas Putih
  const solidPurpleBg = isDark ? '#4c1d95' : '#f3e8ff';
  const solidPurpleBorder = isDark ? '#5b21b6' : '#e9d5ff';
  const solidPurpleText = isDark ? '#d8b4fe' : '#7e22ce';

  if (!reviewData) return null;

  return (
    <Modal visible={true} transparent animationType="slide">
      <View className="flex-1 bg-black/80 justify-end">
        <View className="w-full h-[85%] rounded-t-[2rem] p-6 shadow-2xl relative" style={{ backgroundColor: cardBgColor }}>
          
          {/* Header Pita Gradien (Aman pakai solid color hex) */}
          <View className="absolute top-0 left-0 right-0 h-2 bg-purple-500 rounded-t-[2rem]" />
          
          <TouchableOpacity onPress={onClose} className="absolute top-5 right-5 p-2 bg-muted rounded-full z-10">
            <X color={textColor} size={20} />
          </TouchableOpacity>

          <View className="flex-row items-center gap-4 mb-6 mt-4">
            <View className="w-16 h-16 rounded-full bg-purple-600 flex items-center justify-center shadow-lg">
              <CustomText className="text-white text-3xl font-black">{reviewData.grade || "A"}</CustomText>
            </View>
            <View className="flex-1 pr-6">
              <CustomText className="font-extrabold text-xl leading-tight" style={{ color: textColor }}>{reviewData.title}</CustomText>
              <CustomText className="text-[10px] font-bold uppercase tracking-widest mt-1" style={{ color: mutedColor }}>Nexa AI Evaluation</CustomText>
            </View>
          </View>

          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            {/* FIX: Menggunakan Solid Color untuk Box Pesan AI */}
            <View className="p-4 rounded-2xl border mb-6" style={{ backgroundColor: solidPurpleBg, borderColor: solidPurpleBorder }}>
              <CustomText className="text-sm font-medium leading-relaxed italic" style={{ color: solidPurpleText }}>
                "{reviewData.summary}"
              </CustomText>
            </View>

            <View className="mb-6">
              <View className="flex-row items-center gap-2 mb-3">
                <Lightbulb color="#f59e0b" size={16} />
                <CustomText className="font-bold text-sm" style={{ color: textColor }}>Wawasan Pola Kerjamu</CustomText>
              </View>
              <View className="space-y-3">
                {reviewData.insights?.map((item: string, i: number) => (
                  <View key={i} className="flex-row items-start gap-2.5">
                    <View className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                    <CustomText className="text-sm font-medium leading-relaxed flex-1" style={{ color: mutedColor }}>{item}</CustomText>
                  </View>
                ))}
              </View>
            </View>

            <View className="mb-6">
              <View className="flex-row items-center gap-2 mb-3">
                <Target color="#06b6d4" size={16} />
                <CustomText className="font-bold text-sm" style={{ color: textColor }}>Fokus Minggu Depan</CustomText>
              </View>
              <View className="space-y-3">
                {reviewData.focusNextWeek?.map((item: string, i: number) => (
                  <View key={i} className="flex-row items-start gap-2.5">
                    <View className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-1.5 shrink-0" />
                    <CustomText className="text-sm font-medium leading-relaxed flex-1" style={{ color: mutedColor }}>{item}</CustomText>
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Footer Action */}
          <View className="pt-4 border-t flex-row gap-3" style={{ borderColor }}>
            <TouchableOpacity onPress={onClose} className="flex-1 h-14 rounded-xl border items-center justify-center" style={{ borderColor }}>
              <CustomText className="font-bold" style={{ color: textColor }}>Tutup</CustomText>
            </TouchableOpacity>
            <TouchableOpacity onPress={onSave} className="flex-1 h-14 rounded-xl bg-purple-600 shadow-md items-center justify-center">
              <CustomText className="font-bold text-white">Simpan ke Arsip</CustomText>
            </TouchableOpacity>
          </View>
          
        </View>
      </View>
    </Modal>
  );
}