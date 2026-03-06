/// <reference types="nativewind/types" />
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { ArrowLeft, BrainCircuit, Camera, CheckCircle2, Code, Coffee, ExternalLink, Heart, Receipt, Server, Sparkles } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Appearance, Linking, ScrollView, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CustomText } from '../components/ui/custom-text';
import { useGemini } from '../hooks/use-gemini';
import { useSettings } from '../hooks/use-settings';
import { useAuth } from '../lib/auth-context';
import { addDonationVerification } from '../lib/funding-service';

const accentColors: Record<string, string> = {
  default: '#9333ea', blue: '#3b82f6', emerald: '#10b981',
  amber: '#f59e0b', orange: '#f97316', rose: '#f43f5e', violet: '#8b5cf6',
};

// Data Dummy Donatur (Nanti bisa di-fetch dari Firestore jika portal admin sudah siap)
const DUMMY_DONATORS = [
  { name: "Hamba Allah", amount: "Rp 50.000", date: "Hari ini" },
  { name: "Reza Web Dev", amount: "Rp 75.000", date: "Hari ini" },
  { name: "Siska UI/UX", amount: "Rp 25.000", date: "Kemarin" },
  { name: "Budi Santoso", amount: "Rp 100.000", date: "2 Hari lalu" },
  { name: "Nexa Fans", amount: "Rp 150.000", date: "3 Hari lalu" },
  { name: "Mahasiswa IT", amount: "Rp 20.000", date: "4 Hari lalu" },
  { name: "Anonim", amount: "Rp 15.000", date: "Minggu lalu" },
  { name: "Sarah", amount: "Rp 50.000", date: "Minggu lalu" },
  { name: "Pejuang Skripsi", amount: "Rp 30.000", date: "2 Minggu lalu" },
];

export default function FundingScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { callAI } = useGemini();
  
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark' || ((colorScheme as any) === 'system' && Appearance.getColorScheme() === 'dark');
  
  const cardBgColor = isDark ? '#18181b' : '#ffffff';
  const borderColor = isDark ? '#27272a' : '#e4e4e7';
  const textColor = isDark ? '#ffffff' : '#09090b';
  const mutedColor = isDark ? '#a1a1aa' : '#71717a';

  const { colorAccent } = useSettings();
  const primaryHex = accentColors[colorAccent] || accentColors.default;

  const [isScanning, setIsScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  
  // State baru untuk nama donatur
  const [displayName, setDisplayName] = useState("");

  const handleOpenLink = async (url: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) await Linking.openURL(url);
    } catch (error) {
      console.error("Gagal membuka tautan:", error);
    }
  };

  const handleScanReceipt = async () => {
    if (!user) {
      Alert.alert("Perhatian", "Silakan login terlebih dahulu untuk melakukan konfirmasi donasi.");
      return;
    }

    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.granted === false) {
        Alert.alert("Izin Ditolak", "Butuh akses galeri untuk mengunggah bukti transfer.");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.5,
        base64: true, 
      });

      if (!result.canceled && result.assets[0].base64) {
        setIsScanning(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        // 1. Suruh AI membaca struknya
        const extractedText = await callAI({
          action: "ocr",
          imageBase64: result.assets[0].base64,
          mimeType: result.assets[0].mimeType || 'image/jpeg'
        });

        if (extractedText) {
          // Tentukan nama yang akan disimpan (Input Form -> Nama Profil -> Hamba Allah)
          const finalName = displayName.trim() || user.displayName || "Hamba Allah";

          // 2. Gunakan Service untuk menyimpan data
          await addDonationVerification({
            userId: user.uid,
            userName: finalName,
            userEmail: user.email || "Tidak ada email",
            proofTextRaw: extractedText,
            status: "pending",
          });

          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setScanSuccess(true);
          setDisplayName(""); // Reset form setelah sukses
          
          setTimeout(() => setScanSuccess(false), 5000);
        }
      }
    } catch (error) {
      console.error("Gagal memproses struk:", error);
      Alert.alert("Gagal", "Gagal memproses gambar bukti transfer. Coba lagi.");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      
      {/* Header Statis */}
      <View className="px-4 py-3 flex-row items-center gap-3 border-b border-border/50 bg-background/90 z-10">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-muted">
          <ArrowLeft color={textColor} size={24} />
        </TouchableOpacity>
        <CustomText className="text-sm font-semibold uppercase tracking-wider" style={{ color: mutedColor }}>
          Dukung Nexa
        </CustomText>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        
        {/* Hero Section */}
        <View className="items-center space-y-4 pt-2 mb-10">
          <View className="w-20 h-20 bg-rose-500 rounded-[2rem] flex items-center justify-center shadow-lg shadow-rose-500/30 mb-4">
            <Heart color="#ffffff" size={40} fill="#ffffff" />
          </View>
          <CustomText className="text-3xl font-extrabold tracking-tight text-center mb-2" style={{ color: textColor }}>
            Bantu Nexa Tetap Hidup
          </CustomText>
          <CustomText className="text-sm leading-relaxed text-center px-2" style={{ color: mutedColor }}>
            Nexa dikembangkan secara independen tanpa investor. Dukunganmu sangat berarti untuk menjaga server dan otak AI tetap berjalan lancar untuk semua orang.
          </CustomText>
        </View>

        {/* Transparansi Biaya */}
        <View className="mb-10">
          <CustomText className="text-xs font-bold uppercase tracking-wider mb-4 px-1" style={{ color: mutedColor }}>
            Transparansi Biaya Bulanan
          </CustomText>
          
          <View className="rounded-3xl border shadow-sm p-2" style={{ backgroundColor: cardBgColor, borderColor }}>
            
            <View className="p-4 flex-row items-start gap-4">
              <View className="p-2.5 rounded-xl shrink-0 mt-0.5 bg-blue-500/10">
                <BrainCircuit color="#3b82f6" size={24} />
              </View>
              <View className="flex-1">
                <CustomText className="font-bold text-[15px] mb-1.5" style={{ color: textColor }}>Tagihan AI (Google Gemini)</CustomText>
                <CustomText className="text-xs leading-relaxed" style={{ color: mutedColor }}>
                  Setiap kamu meminta AI merangkum, mengekstrak gambar (OCR), atau mengobrol dengan database, server Google memotong kuota Token yang harus dibayar jika batas gratis harian habis.
                </CustomText>
              </View>
            </View>

            <View className="h-px w-full bg-border/50 my-1" />

            <View className="p-4 flex-row items-start gap-4">
              <View className="p-2.5 rounded-xl shrink-0 mt-0.5 bg-purple-500/10">
                <Server color="#a855f7" size={24} />
              </View>
              <View className="flex-1">
                <CustomText className="font-bold text-[15px] mb-1.5" style={{ color: textColor }}>Firebase & Database</CustomText>
                <CustomText className="text-xs leading-relaxed" style={{ color: mutedColor }}>
                  Menyimpan ribuan catatan pengguna, fitur kolaborasi, dan sistem Brankas Rahasia membutuhkan biaya penyimpanan dan *Bandwidth* seiring bertambahnya pengguna.
                </CustomText>
              </View>
            </View>

            <View className="h-px w-full bg-border/50 my-1" />

            <View className="p-4 flex-row items-start gap-4">
              <View className="p-2.5 rounded-xl shrink-0 mt-0.5 bg-orange-500/10">
                <Code color="#f97316" size={24} />
              </View>
              <View className="flex-1">
                <CustomText className="font-bold text-[15px] mb-1.5" style={{ color: textColor }}>Hosting & Maintenance</CustomText>
                <CustomText className="text-xs leading-relaxed" style={{ color: mutedColor }}>
                  Biaya perpanjangan domain aplikasi, *deployment* server, serta subsidi "Kopi" untuk developer yang begadang membasmi bug dan membuat fitur baru. ☕
                </CustomText>
              </View>
            </View>

          </View>
        </View>

        {/* Pilihan Donasi */}
        <View className="mb-10">
          <CustomText className="text-xs font-bold uppercase tracking-wider mb-4 px-1" style={{ color: mutedColor }}>
            Salurkan Dukungan
          </CustomText>
          
          <View className="flex-col gap-3">
            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={() => handleOpenLink('https://saweria.co/ikydev')}
              className="flex-row items-center justify-between p-4 rounded-2xl border bg-orange-500/5 border-orange-500/30"
            >
              <View className="flex-row items-center gap-4">
                <View className="w-12 h-12 bg-[#E5B034] rounded-full flex items-center justify-center shadow-md">
                  <CustomText className="text-white font-black text-xl">S</CustomText>
                </View>
                <View>
                  <CustomText className="font-bold text-[15px] mb-1" style={{ color: '#E5B034' }}>Saweria</CustomText>
                  <CustomText className="text-xs" style={{ color: mutedColor }}>Gopay / OVO / Dana / QRIS</CustomText>
                </View>
              </View>
              <ExternalLink color="#E5B034" size={20} />
            </TouchableOpacity>

            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={() => handleOpenLink('https://teer.id/ikydev')}
              className="flex-row items-center justify-between p-4 rounded-2xl border bg-red-500/5 border-red-500/30"
            >
              <View className="flex-row items-center gap-4">
                <View className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center shadow-md">
                  <Coffee color="#ffffff" size={20} />
                </View>
                <View>
                  <CustomText className="font-bold text-[15px] mb-1" style={{ color: '#ef4444' }}>Trakteer Kopi</CustomText>
                  <CustomText className="text-xs" style={{ color: mutedColor }}>Dukung dengan secangkir kopi</CustomText>
                </View>
              </View>
              <ExternalLink color="#ef4444" size={20} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Verifikasi Pembayaran OCR */}
        <View className="mb-10">
          <CustomText className="text-xs font-bold uppercase tracking-wider mb-4 px-1" style={{ color: mutedColor }}>
            Konfirmasi Donasi (Beta)
          </CustomText>
          <View className="p-5 rounded-[2rem] border shadow-sm" style={{ backgroundColor: cardBgColor, borderColor }}>
            <View className="flex-row items-center gap-3 mb-3">
              <Receipt color={primaryHex} size={20} />
              <CustomText className="font-bold text-base" style={{ color: textColor }}>Pindai Bukti Transfer</CustomText>
            </View>
            <CustomText className="text-xs leading-relaxed mb-6" style={{ color: mutedColor }}>
              Sudah berdonasi? Unggah *screenshot* bukti transfermu. AI Nexa akan membaca gambar tersebut dan mengirimkannya ke Admin.
            </CustomText>

            {scanSuccess ? (
              <View className="bg-green-500/10 border border-green-500/30 p-4 rounded-2xl flex-row items-center justify-center gap-2">
                <CheckCircle2 color="#22c55e" size={20} />
                <CustomText className="font-bold text-green-600 dark:text-green-400">Bukti berhasil dikirim ke Admin!</CustomText>
              </View>
            ) : (
              <View>
                {/* Input Nama Tampilan */}
                <View className="mb-4">
                  <CustomText className="text-xs font-bold uppercase tracking-wider mb-2 px-1" style={{ color: textColor }}>
                    Nama untuk ditampilkan
                  </CustomText>
                  <TextInput
                    value={displayName}
                    onChangeText={setDisplayName}
                    placeholder="Contoh: Hamba Allah / Tuan Krab"
                    placeholderTextColor={mutedColor}
                    className="w-full h-12 px-4 rounded-xl border text-sm font-medium"
                    style={{ backgroundColor: isDark ? '#09090b' : '#f4f4f5', borderColor, color: textColor }}
                  />
                </View>

                <TouchableOpacity 
                  onPress={handleScanReceipt}
                  disabled={isScanning}
                  className="w-full h-14 rounded-2xl flex-row items-center justify-center shadow-md transition-transform active:scale-95"
                  style={{ backgroundColor: primaryHex, opacity: isScanning ? 0.7 : 1 }}
                >
                  {isScanning ? <ActivityIndicator color="#ffffff" size="small" style={{ marginRight: 8 }} /> : <Camera color="#ffffff" size={20} style={{ marginRight: 8 }} />}
                  <CustomText className="font-bold text-white text-base">
                    {isScanning ? "AI Sedang Membaca..." : "Upload Bukti (Galeri)"}
                  </CustomText>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Wall of Love (Hall of Fame) */}
        <View className="mb-8">
          <CustomText className="text-xs font-bold uppercase tracking-wider mb-4 px-1 text-center" style={{ color: primaryHex }}>
            ✨ Wall of Love ✨
          </CustomText>
          <View className="p-5 rounded-[2rem] border shadow-sm" style={{ backgroundColor: isDark ? '#27272a40' : '#f4f4f580', borderColor }}>
            <CustomText className="text-xs text-center mb-6 leading-relaxed" style={{ color: mutedColor }}>
              Terima kasih kepada pahlawan produktivitas yang telah membantu Nexa tetap hidup. Nama kamu akan muncul di sini setelah diverifikasi.
            </CustomText>

            <View className="flex-col gap-3">
              {DUMMY_DONATORS.map((donator, idx) => (
                <View key={idx} className="flex-row items-center justify-between p-3 bg-background border rounded-xl" style={{ borderColor }}>
                  <View className="flex-row items-center gap-3">
                    <View className="w-8 h-8 rounded-full items-center justify-center" style={{ backgroundColor: `${primaryHex}15` }}>
                      <CustomText className="font-bold" style={{ color: primaryHex }}>{donator.name.charAt(0)}</CustomText>
                    </View>
                    <View>
                      <CustomText className="font-bold text-sm" style={{ color: textColor }}>{donator.name}</CustomText>
                      <CustomText className="text-[10px] mt-0.5" style={{ color: mutedColor }}>{donator.date}</CustomText>
                    </View>
                  </View>
                  <CustomText className="font-bold text-sm" style={{ color: primaryHex }}>{donator.amount}</CustomText>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Apresiasi Terakhir */}
        <View className="text-center p-6 bg-muted/30 rounded-[2rem] border border-border/50 items-center">
          <Sparkles color={primaryHex} size={28} style={{ marginBottom: 12 }} />
          <CustomText className="text-sm font-medium leading-relaxed text-center" style={{ color: textColor }}>
            Tidak punya dana lebih? Tidak apa-apa! Tetap menggunakan Nexa dan memberikan <CustomText style={{ fontStyle: 'italic', color: primaryHex }}>feedback</CustomText> membangun juga sudah menjadi dukungan terbesar bagiku. Terima kasih! 🚀
          </CustomText>
        </View>

      </ScrollView>
    </View>
  );
}