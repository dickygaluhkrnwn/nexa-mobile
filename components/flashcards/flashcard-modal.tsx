import * as Haptics from 'expo-haptics';
import { Brain, Check, ChevronLeft, ChevronRight, History, RefreshCw, X } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React, { useState } from 'react';
import { Appearance, Modal, TouchableOpacity, View } from 'react-native';
import Animated, { interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { CustomText } from '../ui/custom-text';

interface Flashcard {
  front: string;
  back: string;
}

interface FlashcardModalProps {
  history: any[][];
  onClose: () => void;
}

export function FlashcardModal({ history, onClose }: FlashcardModalProps) {
  // State untuk melacak indeks histori mana yang sedang dilihat (0 = versi terbaru)
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cardIndex, setCardIndex] = useState(0);
  
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark' || ((colorScheme as any) === 'system' && Appearance.getColorScheme() === 'dark');
  const cardBgColor = isDark ? '#18181b' : '#ffffff';
  const borderColor = isDark ? '#27272a' : '#e4e4e7';
  const textColor = isDark ? '#ffffff' : '#09090b';
  const mutedColor = isDark ? '#a1a1aa' : '#71717a';

  if (!history || history.length === 0) return null;
  const currentFlashcards: Flashcard[] = history[currentIndex] || [];
  const currentCard = currentFlashcards[cardIndex];

  // Logic 3D Flip Animasi Reanimated
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const spin = useSharedValue(0);

  const flipCard = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    spin.value = withTiming(spin.value === 0 ? 1 : 0, { duration: 400 });
  };

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const frontStyle = useAnimatedStyle(() => {
    const spinVal = interpolate(spin.value, [0, 1], [0, 180]);
    return {
      transform: [{ rotateY: `${spinVal}deg` }],
      backfaceVisibility: 'hidden',
    };
  });

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const backStyle = useAnimatedStyle(() => {
    const spinVal = interpolate(spin.value, [0, 1], [180, 360]);
    return {
      transform: [{ rotateY: `${spinVal}deg` }],
      backfaceVisibility: 'hidden',
      position: 'absolute',
      top: 0, left: 0, right: 0, bottom: 0,
    };
  });

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    spin.value = withTiming(0, { duration: 300 }); // Kembalikan ke depan
    setTimeout(() => {
      if (cardIndex < currentFlashcards.length - 1) setCardIndex(cardIndex + 1);
      else onClose();
    }, 150);
  };

  // --- LOGIKA NAVIGASI RIWAYAT (HISTORY) ---
  const handlePrevVersion = () => {
    if (currentIndex < history.length - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      spin.value = withTiming(0, { duration: 300 }); // Kembalikan kartu ke posisi depan
      setTimeout(() => {
        setCurrentIndex(prev => prev + 1); // Mundur ke versi lebih lama
        setCardIndex(0); // Reset progress ke kartu pertama
      }, 150);
    }
  };

  const handleNextVersion = () => {
    if (currentIndex > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      spin.value = withTiming(0, { duration: 300 });
      setTimeout(() => {
        setCurrentIndex(prev => prev - 1); // Maju ke versi lebih baru
        setCardIndex(0); // Reset progress
      }, 150);
    }
  };

  const progress = ((cardIndex) / currentFlashcards.length) * 100;

  // FIX: Warna sisi belakang yang aman untuk Light dan Dark Mode (menghindari bug kertas putih transparansi)
  const backSideBgColor = isDark ? '#312e81' : '#e0e7ff'; // Indigo sangat gelap / Indigo sangat terang
  const backSideBorderColor = isDark ? '#4338ca' : '#c7d2fe';

  return (
    <Modal visible={true} transparent animationType="fade">
      <View className="flex-1 justify-center items-center p-4 bg-black/80">
        
        <View className="w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden p-6" style={{ backgroundColor: cardBgColor, borderColor, borderWidth: 1 }}>
          
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <CustomText className="font-bold text-lg" style={{ color: textColor }}>Sesi Kuis</CustomText>
              <CustomText className="text-xs" style={{ color: mutedColor }}>Kartu {cardIndex + 1} dari {currentFlashcards.length}</CustomText>
            </View>
            <TouchableOpacity onPress={onClose} className="p-2 rounded-full" style={{ backgroundColor: isDark ? '#27272a' : '#f4f4f5' }}>
              <X color={textColor} size={20} />
            </TouchableOpacity>
          </View>

          {/* --- PANEL NAVIGASI RIWAYAT (Hanya tampil jika ada > 1 versi) --- */}
          {history.length > 1 && (
            <View className="flex-row items-center justify-center gap-3 bg-muted/30 self-center px-4 py-2 rounded-full border border-border/50 mb-6 relative">
              <TouchableOpacity onPress={handlePrevVersion} disabled={currentIndex === history.length - 1} className="p-1">
                <ChevronLeft color={currentIndex === history.length - 1 ? mutedColor : textColor} size={18} />
              </TouchableOpacity>
              
              <View className="flex-row items-center gap-1.5 px-2">
                <History color={mutedColor} size={14} />
                <CustomText className="text-xs font-bold" style={{ color: textColor }}>
                  Versi {history.length - currentIndex} <CustomText style={{ color: mutedColor }}>/ {history.length}</CustomText>
                </CustomText>
              </View>

              <TouchableOpacity onPress={handleNextVersion} disabled={currentIndex === 0} className="p-1">
                <ChevronRight color={currentIndex === 0 ? mutedColor : textColor} size={18} />
              </TouchableOpacity>

              {/* Indikator "Terbaru" jika berada di index 0 */}
              {currentIndex === 0 && (
                <View className="absolute -top-0.5 right-0 flex h-2.5 w-2.5">
                  <View className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <View className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary border border-background" />
                </View>
              )}
            </View>
          )}

          {/* Progress Bar */}
          <View className="h-1.5 w-full rounded-full mb-8 mt-2" style={{ backgroundColor: isDark ? '#27272a' : '#e4e4e7' }}>
            <View className="h-full bg-indigo-500 rounded-full" style={{ width: `${progress}%` }} />
          </View>

          {/* 3D Flashcard Container */}
          <TouchableOpacity activeOpacity={1} onPress={flipCard} className="w-full aspect-[4/3] relative mb-8">
            
            {/* Sisi Depan (Pertanyaan) */}
            <Animated.View style={[frontStyle, { backgroundColor: cardBgColor, borderColor: borderColor, borderWidth: 2 }]} className="absolute inset-0 rounded-3xl p-6 items-center justify-center shadow-lg">
              <View className="absolute top-4 left-4 p-2 rounded-xl" style={{ backgroundColor: isDark ? '#312e81' : '#e0e7ff' }}>
                 <Brain color={isDark ? '#818cf8' : '#4f46e5'} size={24} />
              </View>
              <CustomText className="text-xl font-bold text-center" style={{ color: textColor }}>
                {currentCard?.front}
              </CustomText>
              <View className="absolute bottom-4 flex-row items-center opacity-50">
                <RefreshCw color={mutedColor} size={14} style={{ marginRight: 6 }} />
                <CustomText className="text-[10px] font-bold uppercase tracking-widest" style={{ color: mutedColor }}>Ketuk untuk balik</CustomText>
              </View>
            </Animated.View>

            {/* Sisi Belakang (Jawaban) */}
            <Animated.View style={[backStyle, { backgroundColor: backSideBgColor, borderColor: backSideBorderColor, borderWidth: 2 }]} className="absolute inset-0 rounded-3xl p-6 items-center justify-center shadow-lg">
              <View className="absolute top-4 right-4 p-2 rounded-xl" style={{ backgroundColor: isDark ? '#064e3b' : '#dcfce7' }}>
                 <Check color={isDark ? '#34d399' : '#16a34a'} size={24} />
              </View>
              <CustomText className="text-base font-medium text-center leading-relaxed" style={{ color: isDark ? '#e0e7ff' : '#312e81' }}>
                {currentCard?.back}
              </CustomText>
            </Animated.View>

          </TouchableOpacity>

          {/* Tombol Lanjut */}
          <TouchableOpacity onPress={handleNext} className="w-full h-14 bg-indigo-500 rounded-2xl flex-row items-center justify-center shadow-md active:scale-95 transition-transform">
            <CustomText className="font-bold text-white text-base">
              {cardIndex < currentFlashcards.length - 1 ? "Lanjut ke Kartu Berikutnya" : "Selesai Kuis"}
            </CustomText>
            <ChevronRight color="#fff" size={20} style={{ marginLeft: 4 }} />
          </TouchableOpacity>

        </View>

      </View>
    </Modal>
  );
}