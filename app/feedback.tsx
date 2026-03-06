import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { AlertCircle, ArrowLeft, CheckCircle2, MessageSquareQuote, Send, Star } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React, { useState } from 'react';
import { ActivityIndicator, Appearance, KeyboardAvoidingView, Modal, Platform, ScrollView, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CustomText } from '../components/ui/custom-text';
import { useSettings } from '../hooks/use-settings';
import { useAuth } from '../lib/auth-context';
import { addFeedback } from '../lib/feedback-service';

const accentColors: Record<string, string> = {
  default: '#9333ea', blue: '#3b82f6', emerald: '#10b981',
  amber: '#f59e0b', orange: '#f97316', rose: '#f43f5e', violet: '#8b5cf6',
};

export default function FeedbackScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark' || ((colorScheme as any) === 'system' && Appearance.getColorScheme() === 'dark');
  
  const cardBgColor = isDark ? '#18181b' : '#ffffff';
  const borderColor = isDark ? '#27272a' : '#e4e4e7';
  const textColor = isDark ? '#ffffff' : '#09090b';
  const mutedColor = isDark ? '#a1a1aa' : '#71717a';

  const { colorAccent } = useSettings();
  const primaryHex = accentColors[colorAccent] || accentColors.default;

  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // --- STATE CUSTOM DIALOG MODAL ---
  const [dialog, setDialog] = useState({ isOpen: false, title: "", message: "" });
  const showAlert = (title: string, message: string) => setDialog({ isOpen: true, title, message });

  const getRatingText = () => {
    switch (rating) {
      case 1: return "Kurang memuaskan 😢";
      case 2: return "Bisa lebih baik 🤔";
      case 3: return "Cukup bagus 😐";
      case 4: return "Sangat bagus! 😃";
      case 5: return "Sempurna! Aku suka 💖";
      default: return "";
    }
  };

  const handleStarPress = (star: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRating(star);
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      showAlert("Perhatian", "Tolong berikan penilaian bintang terlebih dahulu ya!");
      return;
    }
    if (!message.trim()) {
      showAlert("Perhatian", "Kolom pesan tidak boleh kosong. Ceritakan pengalamanmu!");
      return;
    }

    setIsSubmitting(true);
    try {
      await addFeedback({
        userId: user ? user.uid : "guest",
        name: user?.displayName || "Pengguna Anonim",
        rating: rating,
        message: message.trim(),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsSuccess(true);
    } catch (error) {
      console.error(error);
      showAlert("Gagal", "Terjadi kesalahan saat mengirim masukan. Coba lagi nanti.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ===============================================
  // TAMPILAN SUKSES
  // ===============================================
  if (isSuccess) {
    return (
      <View className="flex-1 bg-background justify-center items-center px-6" style={{ paddingTop: insets.top }}>
        <View className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 color="#22c55e" size={48} />
        </View>
        <CustomText className="text-3xl font-black mb-3 text-center" style={{ color: textColor }}>Terima Kasih! 🎉</CustomText>
        <CustomText className="text-sm leading-relaxed mb-10 text-center" style={{ color: mutedColor }}>
          Masukan kamu sudah berhasil dikirim dan akan sangat membantu perkembangan Nexa ke depannya.
        </CustomText>
        <TouchableOpacity 
          onPress={() => router.push("/")} 
          className="w-full h-14 rounded-2xl items-center justify-center shadow-lg"
          style={{ backgroundColor: primaryHex }}
        >
          <CustomText className="text-white font-bold text-base">Kembali ke Beranda</CustomText>
        </TouchableOpacity>
      </View>
    );
  }

  // ===============================================
  // TAMPILAN FORM FEEDBACK
  // ===============================================
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      
      {/* Header Statis */}
      <View className="px-4 py-3 flex-row items-center gap-3 border-b border-border/50 bg-background/90 z-10">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-muted">
          <ArrowLeft color={textColor} size={24} />
        </TouchableOpacity>
        <CustomText className="text-sm font-semibold uppercase tracking-wider" style={{ color: mutedColor }}>
          Kirim Masukan
        </CustomText>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        
        {/* Intro */}
        <View className="items-center space-y-4 pt-4 mb-8">
          <View className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center mb-4">
            <MessageSquareQuote color="#22c55e" size={32} />
          </View>
          <CustomText className="text-2xl font-extrabold tracking-tight text-center mb-2" style={{ color: textColor }}>Bagaimana Pengalamanmu?</CustomText>
          <CustomText className="text-sm leading-relaxed text-center px-4" style={{ color: mutedColor }}>
            Bantu kami membuat Nexa lebih baik. Laporkan bug, berikan saran fitur, atau sekadar kasih semangat!
          </CustomText>
        </View>

        {/* Card Form */}
        <View className="p-6 rounded-[2rem] border shadow-sm" style={{ backgroundColor: cardBgColor, borderColor }}>
          
          {/* Star Rating Interaktif */}
          <View className="items-center mb-6">
            <CustomText className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: textColor }}>Berikan Penilaian</CustomText>
            <View className="flex-row items-center justify-center gap-2 mb-3">
              {[1, 2, 3, 4, 5].map((star) => {
                const isActive = star <= rating;
                return (
                  <TouchableOpacity
                    key={star}
                    activeOpacity={0.7}
                    onPress={() => handleStarPress(star)}
                    className="p-1"
                  >
                    <Star 
                      // Outline color: Kuning jika aktif, abu-abu padat jika tidak
                      color={isActive ? "#f59e0b" : (isDark ? "#52525b" : "#d4d4d8")} 
                      // Fill color: Kuning jika aktif, abu-abu sangat muda/transparan jika tidak
                      fill={isActive ? "#f59e0b" : (isDark ? "#27272a" : "#f4f4f5")} 
                      size={40} 
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
            <CustomText className="text-xs font-medium h-4" style={{ color: mutedColor }}>
              {getRatingText()}
            </CustomText>
          </View>

          <View className="h-px w-full mb-6" style={{ backgroundColor: borderColor }} />

          {/* Textarea Masukan */}
          <View className="mb-6">
            <CustomText className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: textColor }}>Pesan Kamu</CustomText>
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="Ceritakan detailnya di sini... (Misal: Aku pengen ada fitur dark mode warna pink!)"
              placeholderTextColor={mutedColor}
              multiline
              textAlignVertical="top"
              className="w-full min-h-[120px] p-4 rounded-2xl border text-sm font-medium"
              style={{ backgroundColor: isDark ? '#09090b' : '#f4f4f5', borderColor, color: textColor }}
            />
          </View>

          <TouchableOpacity 
            onPress={handleSubmit} 
            disabled={isSubmitting} 
            className="w-full h-14 rounded-2xl flex-row items-center justify-center shadow-md active:scale-95 transition-transform"
            style={{ backgroundColor: primaryHex, opacity: isSubmitting ? 0.7 : 1 }}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#ffffff" size="small" style={{ marginRight: 8 }} />
            ) : (
              <Send color="#ffffff" size={20} style={{ marginRight: 8 }} />
            )}
            <CustomText className="font-bold text-white text-base">{isSubmitting ? "Mengirim..." : "Kirim Masukan"}</CustomText>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* CUSTOM DIALOG MODAL */}
      <Modal visible={dialog.isOpen} transparent animationType="fade">
        <View className="flex-1 bg-black/80 justify-center items-center p-4">
          <View className="w-full max-w-sm rounded-[2rem] p-6 shadow-2xl items-center border" style={{ backgroundColor: cardBgColor, borderColor }}>
            <View className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: `${primaryHex}15` }}>
              <AlertCircle color={primaryHex} size={28} />
            </View>
            <CustomText className="font-bold text-xl mb-2 text-center" style={{ color: textColor }}>{dialog.title}</CustomText>
            <CustomText className="text-sm mb-6 text-center leading-relaxed" style={{ color: mutedColor }}>{dialog.message}</CustomText>
            
            <TouchableOpacity onPress={() => setDialog({ ...dialog, isOpen: false })} className="w-full rounded-xl h-12 items-center justify-center" style={{ backgroundColor: primaryHex }}>
              <CustomText className="font-bold text-white">Oke, Mengerti</CustomText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </KeyboardAvoidingView>
  );
}