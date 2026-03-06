import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import {
    ArrowLeft,
    Bot,
    BrainCircuit,
    Camera,
    CheckCircle2, Flame,
    Github, Globe,
    ListTodo,
    LockKeyhole,
    Mic,
    Network,
    Repeat,
    Sparkles,
    Timer,
    Twitter
} from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React from 'react';
import { Appearance, Linking, ScrollView, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CustomText } from '../components/ui/custom-text';
import { useSettings } from '../hooks/use-settings';

const accentColors: Record<string, string> = {
  default: '#9333ea', blue: '#3b82f6', emerald: '#10b981',
  amber: '#f59e0b', orange: '#f97316', rose: '#f43f5e', violet: '#8b5cf6',
};

// FIX UTAMA: Pindahkan komponen FeatureItem ke LUAR AboutScreen agar NativeWind tidak kebingungan
const FeatureItem = ({ icon: Icon, title, desc, colorHex, textColor, mutedColor, borderColor }: any) => (
  <View className="flex-row items-start gap-4 mb-5">
    <View className="p-2.5 rounded-xl shrink-0 mt-0.5" style={{ backgroundColor: `${colorHex}15` }}>
      <Icon color={colorHex} size={22} />
    </View>
    <View className="flex-1 pr-2 border-b pb-4" style={{ borderColor: `${borderColor}50` }}>
      <CustomText className="font-bold text-[15px] mb-1.5" style={{ color: textColor }}>{title}</CustomText>
      <CustomText className="text-xs leading-relaxed" style={{ color: mutedColor }}>{desc}</CustomText>
    </View>
  </View>
);

export default function AboutScreen() {
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

  const handleOpenLink = async (url: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error("Gagal membuka tautan:", error);
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
          Panduan Nexa
        </CustomText>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        
        {/* Hero Section */}
        <View className="items-center space-y-4 pt-4 mb-10">
          <View className="w-24 h-24 mx-auto rounded-3xl flex items-center justify-center shadow-lg mb-6" style={{ backgroundColor: primaryHex }}>
            <CustomText className="text-5xl font-extrabold text-white">N</CustomText>
          </View>
          <View className="items-center">
            <CustomText className="text-3xl font-black mb-2" style={{ color: textColor }}>Nexa AI Notes</CustomText>
            <View className="px-3 py-1 rounded-full mb-4" style={{ backgroundColor: `${primaryHex}15` }}>
              <CustomText className="text-xs font-bold" style={{ color: primaryHex }}>V5 Native (BETA)</CustomText>
            </View>
            <CustomText className="text-sm leading-relaxed text-center" style={{ color: mutedColor }}>
              Sistem Operasi Produktivitas Pribadimu. Bukan sekadar catatan biasa, ini adalah "Otak Kedua" yang ditenagai Kecerdasan Buatan.
            </CustomText>
          </View>
        </View>

        {/* --- SECTION: BERANDA / DASHBOARD --- */}
        <View className="mb-8">
          <View className="flex-row items-center gap-2 mb-5">
            <View className="h-6 w-1 rounded-full" style={{ backgroundColor: primaryHex }} />
            <CustomText className="text-sm font-bold uppercase tracking-widest" style={{ color: primaryHex }}>
              Dashboard & AI
            </CustomText>
          </View>
          
          <View className="bg-card border rounded-[2rem] p-5 shadow-sm" style={{ borderColor }}>
            <FeatureItem 
              icon={Bot} title="Asisten Pagi (Daily Briefing)" colorHex={primaryHex}
              desc="Setiap pagi, AI akan menyapamu, merangkum tugas yang belum selesai, menyoroti habit yang bolong, dan membacakannya via Suara (Voice)." 
              textColor={textColor} mutedColor={mutedColor} borderColor={borderColor}
            />
            <FeatureItem 
              icon={BrainCircuit} title="Project Breakdown AI" colorHex="#3b82f6"
              desc="Tulis rencana besarmu (Contoh: Bikin Startup), dan biarkan AI memecahnya menjadi belasan sub-tugas siap eksekusi secara otomatis." 
              textColor={textColor} mutedColor={mutedColor} borderColor={borderColor}
            />
            <FeatureItem 
              icon={Camera} title="Pindai & Ekstrak (OCR)" colorHex="#10b981"
              desc="Malas mengetik? Foto dokumen atau papan tulis, AI akan mengekstrak seluruh teksnya langsung ke dalam catatanmu." 
              textColor={textColor} mutedColor={mutedColor} borderColor={borderColor}
            />
            <FeatureItem 
              icon={Mic} title="Transkrip Suara Pintar" colorHex="#f43f5e"
              desc="Rekam rapat atau idemu. AI tidak hanya menuliskannya, tapi juga membuang kata-kata berantakan agar menjadi rapi." 
              textColor={textColor} mutedColor={mutedColor} borderColor={borderColor}
            />
          </View>
        </View>

        {/* --- SECTION: TUGAS & FOKUS --- */}
        <View className="mb-8">
          <View className="flex-row items-center gap-2 mb-5">
            <View className="h-6 w-1 rounded-full bg-orange-500" />
            <CustomText className="text-sm font-bold uppercase tracking-widest text-orange-500">
              Eksekusi & Tugas
            </CustomText>
          </View>
          
          <View className="bg-card border rounded-[2rem] p-5 shadow-sm" style={{ borderColor }}>
            <FeatureItem 
              icon={ListTodo} title="Smart Kanban & Calendar" colorHex="#f97316"
              desc="Papan tugas yang otomatis mengatur tenggat waktu (Hari Ini, Akan Datang, Terlewat) agar kamu selalu tahu apa yang harus dikerjakan." 
              textColor={textColor} mutedColor={mutedColor} borderColor={borderColor}
            />
            <FeatureItem 
              icon={Repeat} title="Rutinitas Otomatis" colorHex="#a855f7"
              desc="Buat tugas berulang (Harian, Mingguan, Bulanan). Jika dicentang selesai, tugas baru untuk periode berikutnya akan otomatis terbuat." 
              textColor={textColor} mutedColor={mutedColor} borderColor={borderColor}
            />
            <FeatureItem 
              icon={Timer} title="Deep Work Timer" colorHex="#ef4444"
              desc="Eksekusi tugas dengan teknik Pomodoro (25 Menit). Semua waktu fokusmu akan direkam menjadi grafik di profil." 
              textColor={textColor} mutedColor={mutedColor} borderColor={borderColor}
            />
            <FeatureItem 
              icon={Flame} title="Habit Tracker & Streak" colorHex="#f59e0b"
              desc="Bangun kebiasaan baik. Lacak rentetan (streak) harianmu layaknya game untuk mengalahkan rasa malas." 
              textColor={textColor} mutedColor={mutedColor} borderColor={borderColor}
            />
          </View>
        </View>

        {/* --- SECTION: MANAJEMEN PENGETAHUAN --- */}
        <View className="mb-8">
          <View className="flex-row items-center gap-2 mb-5">
            <View className="h-6 w-1 rounded-full bg-blue-500" />
            <CustomText className="text-sm font-bold uppercase tracking-widest text-blue-500">
              Semesta Pengetahuan
            </CustomText>
          </View>
          
          <View className="bg-card border rounded-[2rem] p-5 shadow-sm" style={{ borderColor }}>
            <FeatureItem 
              icon={Network} title="Knowledge Graph" colorHex="#3b82f6"
              desc="Hubungkan ide-idemu! Catatan yang saling terkait akan divisualisasikan menjadi peta jaringan 2D yang interaktif layaknya Neuron Otak." 
              textColor={textColor} mutedColor={mutedColor} borderColor={borderColor}
            />
            <FeatureItem 
              icon={Sparkles} title="Ringkas & Tebak Tag" colorHex="#06b6d4"
              desc="Tidak ada lagi catatan berantakan. Satu klik untuk merangkum teks panjang dan AI akan otomatis membuatkan Tag (#) yang relevan." 
              textColor={textColor} mutedColor={mutedColor} borderColor={borderColor}
            />
            <FeatureItem 
              icon={LockKeyhole} title="Brankas Rahasia" colorHex="#8b5cf6"
              desc="Sembunyikan catatan keuangan atau sandi penting di Brankas yang hanya bisa diakses menggunakan PIN 4 Digit." 
              textColor={textColor} mutedColor={mutedColor} borderColor={borderColor}
            />
            <View className="flex-row items-start gap-4">
              <View className="p-2.5 rounded-xl shrink-0 mt-0.5 bg-green-500/10">
                <CheckCircle2 color="#22c55e" size={22} />
              </View>
              <View className="flex-1 pr-2">
                <CustomText className="font-bold text-[15px] mb-1.5" style={{ color: textColor }}>Productivity Heatmap</CustomText>
                <CustomText className="text-xs leading-relaxed" style={{ color: mutedColor }}>Sama seperti GitHub, lihat seberapa sering kamu produktif melalui kotak-kotak hijau di halaman profilmu.</CustomText>
              </View>
            </View>
          </View>
        </View>

        {/* Tentang Kreator (FIXED BG COLOR) */}
        <View className="pt-4">
          {/* Ubah Background Color menjadi warna solid cardBgColor layaknya elemen lain di atasnya */}
          <View className="p-6 rounded-[2rem] border text-center flex-col items-center shadow-sm" style={{ backgroundColor: cardBgColor, borderColor }}>
            <CustomText className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: mutedColor }}>
              Dikembangkan Oleh
            </CustomText>
            <CustomText className="text-sm leading-relaxed font-medium text-center mb-6" style={{ color: textColor }}>
              Nexa dirancang dan dibangun secara mandiri dengan 💖 oleh <CustomText style={{ fontWeight: 'bold', color: primaryHex }}>ikydev</CustomText>. Dibuat khusus untuk para *hustler* yang ingin lebih produktif tanpa harus berlangganan aplikasi mahal.
            </CustomText>
            
            <View className="flex-row justify-center gap-4">
              <TouchableOpacity 
                onPress={() => handleOpenLink('https://github.com/ikydev')} 
                activeOpacity={0.7} 
                className="w-12 h-12 rounded-full border items-center justify-center shadow-sm"
                style={{ backgroundColor: isDark ? '#27272a' : '#f4f4f5', borderColor }}
              >
                <Github color={textColor} size={20} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => handleOpenLink('https://twitter.com/ikydev')} 
                activeOpacity={0.7} 
                className="w-12 h-12 rounded-full border items-center justify-center shadow-sm"
                style={{ backgroundColor: isDark ? '#27272a' : '#f4f4f5', borderColor }}
              >
                <Twitter color={textColor} size={20} />
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => handleOpenLink('https://nexa-app.vercel.app')} 
                activeOpacity={0.7} 
                className="w-12 h-12 rounded-full border items-center justify-center shadow-sm"
                style={{ backgroundColor: isDark ? '#27272a' : '#f4f4f5', borderColor }}
              >
                <Globe color={textColor} size={20} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}