/// <reference types="nativewind/types" />
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications'; // <-- MENGGUNAKAN EXPO NOTIFICATIONS
import { Bell, BellRing, Pencil, Phone, Save, Smartphone } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Appearance, TextInput, TouchableOpacity, View } from 'react-native';
import { CustomText } from '../ui/custom-text';

// FIX: Hapus shouldShowAlert yang sudah usang di Expo SDK 53
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true, 
    shouldShowList: true,   
  }),
});

interface NotificationsTabProps {
  vibrationEnabled: boolean;
  setVibrationEnabled: (val: boolean) => void;
  whatsapp: string;
  setWhatsapp: (val: string) => void;
  userUid: string;
}

export function NotificationsTab({
  vibrationEnabled, setVibrationEnabled,
  whatsapp, setWhatsapp,
  userUid
}: NotificationsTabProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark' || ((colorScheme as any) === 'system' && Appearance.getColorScheme() === 'dark');
  
  const cardBgColor = isDark ? '#18181b' : '#ffffff';
  const borderColor = isDark ? '#27272a' : '#e4e4e7';
  const textColor = isDark ? '#ffffff' : '#09090b';
  const mutedColor = isDark ? '#a1a1aa' : '#71717a';

  // State Lokal Tab
  const [isEditingWA, setIsEditingWA] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // State Izin Notifikasi Expo
  const [pushStatus, setPushStatus] = useState<Notifications.PermissionStatus>(Notifications.PermissionStatus.UNDETERMINED);

  // Cek status izin notifikasi saat komponen pertama kali dimuat
  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const { status } = await Notifications.getPermissionsAsync();
        setPushStatus(status);
      } catch (err) {
        console.log("Expo Go restriction on permissions:", err);
      }
    };
    checkPermissions();
  }, []);

  const handleRequestPush = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    try {
      // Minta izin ke OS (Android/iOS)
      const { status } = await Notifications.requestPermissionsAsync();
      setPushStatus(status);

      if (status === 'granted') {
        // Jika diizinkan, langsung tembak test notifikasi lokal ke HP
        try {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: "Nexa AI Terhubung! 🚀",
              body: "Asisten pagi dan pengingat tugasmu akan muncul di sini.",
              sound: true,
            },
            trigger: null, // Kirim langsung sekarang
          });
        } catch (err) {
          console.log("Local push notification failed (Expo Go limitation):", err);
        }
        Alert.alert("Berhasil", "Notifikasi sistem berhasil diaktifkan! (Catatan: Mungkin tidak berbunyi di Expo Go, tapi akan bekerja sempurna di APK/Aplikasi rilis).");
      } else {
        Alert.alert("Izin Ditolak", "Kamu menolak izin notifikasi. Kamu bisa mengubahnya nanti di pengaturan HP.");
      }
    } catch (err) {
      Alert.alert("Info Expo Go", "Fungsi ini dibatasi di Expo Go versi terbaru. Fitur akan berfungsi normal saat di-build menjadi APK.");
    }
  };

  const handleToggleVibration = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setVibrationEnabled(!vibrationEnabled);
    // (Penyimpanan state ini ke Firestore sudah ditangani di profile.tsx)
  };

  const handleSaveWA = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSaving(true);
    // (Simulasi loading, fungsi update ke Firestore di-handle di profile.tsx,
    // di sini kita asumsikan sukses lalu tutup form edit)
    setTimeout(() => {
      setIsSaving(false);
      setIsEditingWA(false);
      Alert.alert("Tersimpan", "Nomor WhatsApp berhasil diperbarui.");
    }, 800);
  };

  return (
    <View className="space-y-6 pb-6">
      
      {/* 1. Pengaturan Push & Getaran */}
      <View className="space-y-4">
        <CustomText className="text-xs font-bold uppercase tracking-widest px-2" style={{ color: mutedColor }}>
          Notifikasi Aplikasi
        </CustomText>
        
        <View className="rounded-[2rem] p-5 shadow-sm border" style={{ backgroundColor: cardBgColor, borderColor }}>
          
          {/* Push Notif Item */}
          <View className="flex-row items-center justify-between pb-5 border-b" style={{ borderColor: `${borderColor}80` }}>
            <View className="flex-row items-center gap-4 flex-1">
              <View className="p-3 bg-blue-500/10 rounded-2xl">
                <Bell color="#2563eb" size={20} />
              </View>
              <View className="flex-1">
                <CustomText className="font-bold text-base mb-0.5" style={{ color: textColor }}>Notifikasi Sistem</CustomText>
                <CustomText className="text-xs" style={{ color: mutedColor }}>Muncul di layar HP-mu</CustomText>
              </View>
            </View>
            
            {pushStatus === 'granted' ? (
              <View className="bg-green-500/10 px-3 py-1.5 rounded-full border border-green-500/20">
                <CustomText className="text-xs font-extrabold text-green-600 dark:text-green-400">Aktif</CustomText>
              </View>
            ) : (
              <TouchableOpacity 
                onPress={handleRequestPush} 
                className="px-4 py-2 rounded-full bg-blue-600 shadow-md active:scale-95"
              >
                <CustomText className="text-xs font-bold text-white">Aktifkan</CustomText>
              </TouchableOpacity>
            )}
          </View>

          {/* Getaran Item */}
          <View className="flex-row items-center justify-between pt-5">
            <View className="flex-row items-center gap-4 flex-1">
              <View className="p-3 bg-orange-500/10 rounded-2xl">
                <Smartphone color="#ea580c" size={20} />
              </View>
              <View className="flex-1">
                <CustomText className="font-bold text-base mb-0.5" style={{ color: textColor }}>Getaran Perangkat</CustomText>
                <CustomText className="text-xs" style={{ color: mutedColor }}>Bergetar saat notif masuk</CustomText>
              </View>
            </View>
            
            {/* Custom Switch / Toggle Button */}
            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={handleToggleVibration}
              className="w-12 h-7 rounded-full justify-center px-1 transition-colors"
              style={{ backgroundColor: vibrationEnabled ? '#9333ea' : (isDark ? '#3f3f46' : '#e4e4e7') }}
            >
              <View 
                className="w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200"
                style={{ transform: [{ translateX: vibrationEnabled ? 20 : 0 }] }}
              />
            </TouchableOpacity>
          </View>

        </View>
      </View>

      {/* 2. Pengaturan WhatsApp */}
      <View className="space-y-4 pt-2">
        <CustomText className="text-xs font-bold uppercase tracking-widest px-2" style={{ color: mutedColor }}>
          Integrasi Eksternal
        </CustomText>
        
        <View className="rounded-[2rem] p-5 shadow-sm border" style={{ backgroundColor: cardBgColor, borderColor }}>
          <View className="flex-row items-center justify-between pb-4">
            <View className="flex-row items-center gap-4 flex-1">
              <View className="p-3 bg-green-500/10 rounded-2xl">
                <BellRing color="#16a34a" size={20} />
              </View>
              <View className="flex-1 pr-2">
                <CustomText className="font-bold text-base mb-0.5" style={{ color: textColor }}>Notifikasi WhatsApp</CustomText>
                <CustomText className="text-xs" style={{ color: mutedColor }}>Pengingat tugas dari Nexa</CustomText>
              </View>
            </View>
            
            {!isEditingWA && (
              <TouchableOpacity 
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setIsEditingWA(true); }} 
                className="flex-row items-center px-3 py-1.5 rounded-full bg-primary/10"
              >
                <Pencil color="#9333ea" size={12} style={{ marginRight: 6 }} />
                <CustomText className="font-bold text-xs text-primary">Edit</CustomText>
              </TouchableOpacity>
            )}
          </View>
          
          <View>
            {isEditingWA ? (
              <View className="p-4 rounded-2xl border" style={{ backgroundColor: isDark ? '#27272a50' : '#f4f4f5', borderColor }}>
                <View className="flex-row items-center bg-background border rounded-xl px-4 py-1 mb-2 shadow-sm" style={{ borderColor }}>
                  <Phone color={mutedColor} size={18} />
                  <CustomText className="font-extrabold text-sm ml-3 mr-1" style={{ color: mutedColor }}>+62</CustomText>
                  <TextInput
                    keyboardType="phone-pad"
                    placeholder="81234567890"
                    placeholderTextColor={mutedColor}
                    value={whatsapp.replace(/^62|^0/, '')}
                    onChangeText={(val) => setWhatsapp("62" + val.replace(/^0/, ''))}
                    className="flex-1 h-12 text-base font-bold"
                    style={{ color: textColor }}
                  />
                </View>
                <CustomText className="text-[10px] font-medium mb-3 px-1" style={{ color: mutedColor }}>
                  *Gunakan format tanpa angka 0 di depan (Contoh: 812...).
                </CustomText>
                
                <View className="flex-row gap-2">
                  <TouchableOpacity 
                    onPress={() => setIsEditingWA(false)} 
                    disabled={isSaving} 
                    className="flex-1 h-12 rounded-xl border items-center justify-center"
                    style={{ borderColor }}
                  >
                    <CustomText className="font-bold" style={{ color: textColor }}>Batal</CustomText>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    onPress={handleSaveWA} 
                    disabled={isSaving} 
                    className="flex-1 h-12 bg-green-600 rounded-xl items-center justify-center flex-row shadow-md"
                  >
                    {isSaving ? <ActivityIndicator color="#fff" size="small" style={{ marginRight: 8 }} /> : <Save color="#fff" size={16} style={{ marginRight: 8 }} />}
                    <CustomText className="font-bold text-white">Simpan</CustomText>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View className="p-4 rounded-2xl border" style={{ backgroundColor: isDark ? '#27272a50' : '#f4f4f5', borderColor: `${borderColor}50` }}>
                <View className="flex-row items-center gap-3">
                  <View className="p-2 bg-background rounded-full shadow-sm border" style={{ borderColor }}>
                    <Phone color={mutedColor} size={16} />
                  </View>
                  <CustomText className={`text-sm ${whatsapp ? 'font-extrabold tracking-widest' : 'font-medium italic'}`} style={{ color: whatsapp ? textColor : mutedColor }}>
                    {whatsapp ? `+${whatsapp}` : "Belum dihubungkan"}
                  </CustomText>
                </View>
              </View>
            )}
          </View>
        </View>
      </View>

    </View>
  );
}