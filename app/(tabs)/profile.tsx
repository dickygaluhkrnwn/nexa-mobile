import * as Haptics from 'expo-haptics';
import { doc, getDoc } from 'firebase/firestore';
import { Archive, BellRing, BrainCircuit, Lock, Mail, Palette, ShieldCheck, Sparkles, UserCircle, User as UserIcon } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Appearance, Image, KeyboardAvoidingView, Platform, ScrollView, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Header, useHeaderAnimation } from '../../components/Header'; // <-- Import Hook Animasi
import { CustomText } from '../../components/ui/custom-text';
import { useAuth } from '../../lib/auth-context';
import { db } from '../../lib/firebase';
import { getUserNotes } from '../../lib/notes-service';

// --- Impor Komponen Tab ---
import { AccountTab } from '../../components/profile/account-tab';
import { AppearanceTab } from '../../components/profile/appearance-tab';
import { ArchiveTab } from '../../components/profile/archive-tab';
import { NotificationsTab } from '../../components/profile/notifications-tab';
import { SecurityTab } from '../../components/profile/security-tab';

export default function ProfileScreen() {
  const { user, loginWithEmail, registerWithEmail, logout } = useAuth();
  const insets = useSafeAreaInsets();
  
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark' || ((colorScheme as any) === 'system' && Appearance.getColorScheme() === 'dark');
  
  // Warna dinamis Anti-Gagal untuk teks dan ikon
  const textColor = isDark ? '#ffffff' : '#09090b';
  const mutedColor = isDark ? '#a1a1aa' : '#71717a';

  // --- AMBIL DATA ANIMASI DARI HOOK ---
  const { headerTranslateY, handleScroll } = useHeaderAnimation();
  
  // State Auth
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // State Tabs & Data
  const [activeTab, setActiveTab] = useState('account');
  const [stats, setStats] = useState({ notes: 0, todos: 0, vault: 0 });
  const [loadingStats, setLoadingStats] = useState(false);
  const [archivedReviews, setArchivedReviews] = useState<any[]>([]);
  const [activityDates, setActivityDates] = useState<Date[]>([]); 

  // State Profil Terpusat (Dioper ke Tab)
  const [pinCode, setPinCode] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [vibrationEnabled, setVibrationEnabled] = useState(true);

  // Mengambil Data Statistik dan Profil User
  useEffect(() => {
    const fetchStatsAndProfile = async () => {
      if (user && !user.isAnonymous) {
        setLoadingStats(true);
        try {
          const notesData = await getUserNotes(user.uid);
          
          setStats({
            notes: notesData.filter((n: any) => !n.isTodo && !n.isHidden && !n.tags?.includes("WeeklyReview")).length,
            todos: notesData.filter((n: any) => n.isTodo && !n.isCompleted).length,
            vault: notesData.filter((n: any) => n.isHidden).length,
          });

          setArchivedReviews(notesData.filter((n: any) => n.tags?.includes("Weekly Review") || n.tags?.includes("WeeklyReview")));

          // --- EKSTRAK TANGGAL UNTUK HEATMAP ---
          const dates: Date[] = [];
          notesData.forEach((note: any) => {
            if (note.createdAt) {
               dates.push(note.createdAt.toDate ? note.createdAt.toDate() : new Date(note.createdAt));
            }
            if (note.isTodo && note.isCompleted && note.updatedAt) {
               dates.push(note.updatedAt.toDate ? note.updatedAt.toDate() : new Date(note.updatedAt));
            }
          });
          setActivityDates(dates);
          // -------------------------------------

          const userRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists()) {
            const data = userSnap.data();
            if (data.pinCode) setPinCode(data.pinCode);
            if (data.whatsappNumber) setWhatsapp(data.whatsappNumber);
            if (data.vibrationEnabled !== undefined) setVibrationEnabled(data.vibrationEnabled);
          }
        } catch (error) {
          console.error("Gagal mengambil data profil:", error);
        } finally {
          setLoadingStats(false);
        }
      }
    };

    fetchStatsAndProfile();
  }, [user]);

  // --- FUNGSI AUTH ---
  const handleAuthSubmit = async () => {
    if (!email || !password) return Alert.alert("Perhatian", "Email dan Password wajib diisi!");
    if (isRegisterMode && !name) return Alert.alert("Perhatian", "Nama wajib diisi untuk mendaftar!");
    if (password.length < 6) return Alert.alert("Perhatian", "Password minimal 6 karakter!");

    setIsLoading(true);
    try {
      if (isRegisterMode) await registerWithEmail(name, email, password);
      else await loginWithEmail(email, password);
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') Alert.alert("Gagal", "Email ini sudah terdaftar!");
      else if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found') Alert.alert("Gagal", "Email atau Password salah!");
      else Alert.alert("Error", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Keluar Akun", "Yakin ingin keluar dari Nexa?", [
      { text: "Batal", style: "cancel" },
      { text: "Keluar", style: "destructive", onPress: async () => await logout() }
    ]);
  };

  // --- TAMPILAN JIKA SUDAH LOGIN (MEMBER AREA) ---
  if (user && !user.isAnonymous) {
    const switchTab = (id: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setActiveTab(id);
    };

    return (
      <View className="flex-1 bg-background">
        <Header translateY={headerTranslateY} />
        
        <ScrollView 
          contentContainerStyle={{ paddingTop: insets.top + 70, paddingBottom: 100 }} 
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          
          {/* Header Profile Aesthetic */}
          <View className="items-center mt-8 mb-6 px-4">
            <View className="relative items-center">
              <View className="w-28 h-28 rounded-full bg-card overflow-hidden border-4 border-background shadow-lg items-center justify-center">
                {user.photoURL ? (
                  <Image source={{ uri: user.photoURL }} className="w-full h-full" />
                ) : (
                  <UserIcon color="#9333ea" size={50} />
                )}
              </View>
              <View className="absolute -bottom-3 bg-primary px-4 py-1.5 rounded-full border-2 border-background flex-row items-center shadow-sm">
                <Sparkles color="#ffffff" size={12} />
                <CustomText className="text-xs font-bold ml-1.5 uppercase" style={{ color: '#ffffff' }}>Member</CustomText>
              </View>
            </View>
            <CustomText className="text-2xl font-black mt-6" style={{ color: textColor }}>{user.displayName || "Pengguna Nexa"}</CustomText>
            <CustomText className="text-sm font-medium mt-1" style={{ color: mutedColor }}>{user.email}</CustomText>
          </View>

          {/* Sistem Tabs Navigasi Horizontal */}
          <View className="mb-6">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
              <TouchableOpacity onPress={() => switchTab('account')} activeOpacity={0.7} className="flex-row items-center justify-center gap-2 px-5 py-3 rounded-xl border border-border bg-card" style={{ backgroundColor: activeTab === 'account' ? '#9333ea' : undefined }}>
                <UserCircle color={activeTab === 'account' ? "#ffffff" : mutedColor} size={18} />
                <CustomText className="text-xs font-bold" style={{ color: activeTab === 'account' ? '#ffffff' : mutedColor }}>Akun</CustomText>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => switchTab('archive')} activeOpacity={0.7} className="flex-row items-center justify-center gap-2 px-5 py-3 rounded-xl border border-border bg-card" style={{ backgroundColor: activeTab === 'archive' ? '#9333ea' : undefined }}>
                <Archive color={activeTab === 'archive' ? "#ffffff" : mutedColor} size={18} />
                <CustomText className="text-xs font-bold" style={{ color: activeTab === 'archive' ? '#ffffff' : mutedColor }}>Arsip</CustomText>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => switchTab('appearance')} activeOpacity={0.7} className="flex-row items-center justify-center gap-2 px-5 py-3 rounded-xl border border-border bg-card" style={{ backgroundColor: activeTab === 'appearance' ? '#9333ea' : undefined }}>
                <Palette color={activeTab === 'appearance' ? "#ffffff" : mutedColor} size={18} />
                <CustomText className="text-xs font-bold" style={{ color: activeTab === 'appearance' ? '#ffffff' : mutedColor }}>Tampilan</CustomText>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => switchTab('security')} activeOpacity={0.7} className="flex-row items-center justify-center gap-2 px-5 py-3 rounded-xl border border-border bg-card" style={{ backgroundColor: activeTab === 'security' ? '#9333ea' : undefined }}>
                <ShieldCheck color={activeTab === 'security' ? "#ffffff" : mutedColor} size={18} />
                <CustomText className="text-xs font-bold" style={{ color: activeTab === 'security' ? '#ffffff' : mutedColor }}>Keamanan</CustomText>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => switchTab('notifications')} activeOpacity={0.7} className="flex-row items-center justify-center gap-2 px-5 py-3 rounded-xl border border-border bg-card" style={{ backgroundColor: activeTab === 'notifications' ? '#9333ea' : undefined }}>
                <BellRing color={activeTab === 'notifications' ? "#ffffff" : mutedColor} size={18} />
                <CustomText className="text-xs font-bold" style={{ color: activeTab === 'notifications' ? '#ffffff' : mutedColor }}>Notif</CustomText>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* Area Konten Tab Terisolasi */}
          <View className="px-4">
            {activeTab === 'account' && <AccountTab stats={stats} loadingStats={loadingStats} activityDates={activityDates} onLogout={handleLogout} />}
            {activeTab === 'archive' && <ArchiveTab archivedReviews={archivedReviews} />}
            {activeTab === 'appearance' && <AppearanceTab />}
            {activeTab === 'security' && <SecurityTab pinCode={pinCode} setPinCode={setPinCode} userUid={user.uid} />}
            {activeTab === 'notifications' && <NotificationsTab whatsapp={whatsapp} setWhatsapp={setWhatsapp} vibrationEnabled={vibrationEnabled} setVibrationEnabled={setVibrationEnabled} userUid={user.uid} />}
          </View>
        </ScrollView>
      </View>
    );
  }

  // --- TAMPILAN FORM LOGIN / REGISTER ---
  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 bg-background">
      <Header translateY={headerTranslateY} />
      <ScrollView 
        contentContainerStyle={{ paddingTop: insets.top + 70, flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 }} 
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <View className="items-center mb-8">
          <View className="w-20 h-20 rounded-3xl bg-primary flex items-center justify-center shadow-lg mb-6">
            <BrainCircuit color="#ffffff" size={40} />
          </View>
          <CustomText className="text-3xl font-black mb-2 text-center" style={{ color: textColor }}>
            {isRegisterMode ? "Buat Akun Baru" : "Selamat Datang"}
          </CustomText>
          <CustomText className="text-sm font-medium text-center px-4" style={{ color: mutedColor }}>
            Amankan semua catatan dan tugasmu di cloud agar tidak hilang.
          </CustomText>
        </View>

        <View className="bg-card border border-border p-6 rounded-3xl shadow-lg">
          <View className="flex flex-col gap-4">
            {isRegisterMode && (
              <View className="relative justify-center">
                <View className="absolute left-4 z-10"><UserIcon color={mutedColor} size={20} /></View>
                <TextInput 
                  placeholder="Nama Panggilan" 
                  placeholderTextColor={mutedColor} 
                  value={name} 
                  onChangeText={setName} 
                  className="w-full h-14 bg-muted border border-border rounded-2xl pl-12 pr-4 font-semibold" 
                  style={{ color: textColor }} 
                />
              </View>
            )}
            <View className="relative justify-center">
              <View className="absolute left-4 z-10"><Mail color={mutedColor} size={20} /></View>
              <TextInput 
                placeholder="Email Aktif" 
                placeholderTextColor={mutedColor} 
                value={email} 
                onChangeText={setEmail} 
                keyboardType="email-address" 
                autoCapitalize="none" 
                className="w-full h-14 bg-muted border border-border rounded-2xl pl-12 pr-4 font-semibold" 
                style={{ color: textColor }} 
              />
            </View>
            <View className="relative justify-center">
              <View className="absolute left-4 z-10"><Lock color={mutedColor} size={20} /></View>
              <TextInput 
                placeholder="Password (min. 6 karakter)" 
                placeholderTextColor={mutedColor} 
                value={password} 
                onChangeText={setPassword} 
                secureTextEntry 
                className="w-full h-14 bg-muted border border-border rounded-2xl pl-12 pr-4 font-semibold" 
                style={{ color: textColor }} 
              />
            </View>

            <TouchableOpacity onPress={handleAuthSubmit} disabled={isLoading} activeOpacity={0.8} className="w-full h-14 bg-primary rounded-2xl flex items-center justify-center mt-2 shadow-md">
              {isLoading ? <ActivityIndicator color="#ffffff" /> : <CustomText className="font-black text-base" style={{ color: '#ffffff' }}>{isRegisterMode ? "Daftar Sekarang" : "Masuk"}</CustomText>}
            </TouchableOpacity>
          </View>

          <View className="flex-row justify-center items-center gap-1 mt-6">
            <CustomText className="text-sm font-medium" style={{ color: mutedColor }}>{isRegisterMode ? "Sudah punya akun?" : "Belum punya akun?"}</CustomText>
            <TouchableOpacity onPress={() => setIsRegisterMode(!isRegisterMode)} className="p-1">
              <CustomText className="text-sm font-black text-primary">{isRegisterMode ? "Masuk di sini" : "Daftar gratis"}</CustomText>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}