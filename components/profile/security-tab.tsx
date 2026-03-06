import * as Haptics from 'expo-haptics';
import { doc, updateDoc } from 'firebase/firestore';
import { Lock, Pencil, Save, ShieldCheck } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Appearance, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSettings } from '../../hooks/use-settings';
import { db } from '../../lib/firebase';

interface SecurityTabProps {
  pinCode: string;
  setPinCode: (val: string) => void;
  userUid: string;
}

const accentColors: Record<string, string> = {
  default: '#9333ea', blue: '#3b82f6', emerald: '#10b981',
  amber: '#f59e0b', orange: '#f97316', rose: '#f43f5e', violet: '#8b5cf6',
};

export function SecurityTab({ pinCode, setPinCode, userUid }: SecurityTabProps) {
  const [isEditingPin, setIsEditingPin] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [localPin, setLocalPin] = useState(pinCode);

  // 1. Deteksi Mode Gelap & Warna Dinamis
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark' || ((colorScheme as any) === 'system' && Appearance.getColorScheme() === 'dark');
  
  const cardBgColor = isDark ? '#18181b' : '#ffffff';
  const borderColor = isDark ? '#27272a' : '#e4e4e7';
  const textColor = isDark ? '#ffffff' : '#09090b';
  const mutedColor = isDark ? '#a1a1aa' : '#71717a';

  // 2. Ambil Font Global & Warna Aksen
  const { fontStyle, colorAccent } = useSettings();
  const getFontFamily = () => {
    switch (fontStyle) {
      case 'serif': return 'serif';
      case 'mono': return 'monospace';
      case 'sans': default: return 'sans-serif';
    }
  };
  const fontFamily = getFontFamily();
  const primaryHex = accentColors[colorAccent] || accentColors.default;

  const handleSavePin = async () => {
    if (localPin.length !== 4) return Alert.alert("Perhatian", "PIN harus tepat 4 angka!");
    setIsSavingProfile(true);
    try {
      await updateDoc(doc(db, "users", userUid), { pinCode: localPin });
      setPinCode(localPin);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsEditingPin(false);
    } catch (error) {
      Alert.alert("Gagal", "Gagal menyimpan PIN.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  return (
    <View className="flex flex-col gap-4">
      <View className="border rounded-3xl p-5 shadow-sm flex flex-col gap-4" style={{ backgroundColor: cardBgColor, borderColor }}>
        <View className="flex-row items-center justify-between border-b pb-4" style={{ borderColor: `${borderColor}80` }}>
          <View className="flex-row items-center gap-3">
            <View className="p-3 rounded-2xl" style={{ backgroundColor: `${primaryHex}15` }}>
              <ShieldCheck color={primaryHex} size={24} />
            </View>
            <View>
              <Text className="font-bold text-base" style={{ color: textColor, fontFamily }}>Brankas Rahasia</Text>
              <Text className="text-xs mt-0.5" style={{ color: mutedColor, fontFamily }}>Akses PIN 4 angka</Text>
            </View>
          </View>
          {!isEditingPin && (
            <TouchableOpacity 
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setLocalPin(pinCode); setIsEditingPin(true); }} 
              className="px-4 py-2 rounded-full flex-row items-center"
              style={{ backgroundColor: isDark ? '#27272a' : '#f4f4f5' }}
            >
              <Pencil color={primaryHex} size={14} />
              <Text className="text-xs font-bold ml-1.5" style={{ color: primaryHex, fontFamily }}>Edit</Text>
            </TouchableOpacity>
          )}
        </View>

        {isEditingPin ? (
          <View className="p-4 rounded-2xl border flex flex-col gap-3" style={{ backgroundColor: isDark ? '#27272a50' : '#f4f4f5', borderColor: `${borderColor}50` }}>
            <View className="relative justify-center">
              <View className="absolute left-4 z-10"><Lock color={mutedColor} size={20} /></View>
              <TextInput
                value={localPin}
                onChangeText={(text) => setLocalPin(text.replace(/[^0-9]/g, '').slice(0, 4))}
                keyboardType="number-pad"
                secureTextEntry
                placeholder="Masukkan PIN"
                placeholderTextColor={mutedColor}
                className="w-full pl-12 pr-4 py-3.5 text-center text-xl font-black rounded-xl border"
                style={{ backgroundColor: isDark ? '#09090b' : '#ffffff', borderColor, color: textColor, fontFamily }}
                autoFocus
              />
            </View>
            <View className="flex-row gap-2 pt-1">
              <TouchableOpacity 
                onPress={() => setIsEditingPin(false)} 
                className="flex-1 py-3 items-center justify-center rounded-xl border" 
                style={{ backgroundColor: cardBgColor, borderColor }}
              >
                <Text className="font-bold" style={{ color: textColor, fontFamily }}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleSavePin} 
                disabled={isSavingProfile || localPin.length !== 4} 
                className="flex-1 py-3 items-center flex-row justify-center rounded-xl shadow-md" 
                style={{ backgroundColor: primaryHex, opacity: localPin.length === 4 ? 1 : 0.5 }}
              >
                {isSavingProfile ? <ActivityIndicator size="small" color="#fff" /> : <Save color="#fff" size={16} />}
                <Text className="font-bold text-white ml-2" style={{ fontFamily }}>Simpan</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View className="p-5 rounded-2xl items-center justify-center" style={{ backgroundColor: isDark ? '#27272a' : '#f4f4f5' }}>
            <Text className="text-2xl font-black tracking-[0.2em]" style={{ color: textColor, fontFamily }}>
              {pinCode ? "••••" : "Belum Diatur"}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}