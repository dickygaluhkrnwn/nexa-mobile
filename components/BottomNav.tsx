import * as Haptics from "expo-haptics";
import { usePathname, useRouter } from "expo-router";
import { Camera, CheckSquare, FileText, Home, Image as ImageIcon, Mic, Plus, Type, User } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React, { useState } from "react";
import { Appearance, Modal, Pressable, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown, FadeOutDown, useAnimatedStyle, withSpring } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSettings } from "../hooks/use-settings";
import { CustomText } from "./ui/custom-text";

const accentColors: Record<string, string> = {
  default: '#9333ea', blue: '#3b82f6', emerald: '#10b981',
  amber: '#f59e0b', orange: '#f97316', rose: '#f43f5e', violet: '#8b5cf6',
};

export function BottomNav(props: any) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname(); 
  const [isOpen, setIsOpen] = useState(false);
  
  // Ambil warna dinamis dari pengaturan
  const { colorAccent } = useSettings();
  const primaryHex = accentColors[colorAccent] || accentColors.default;

  // Deteksi Mode Gelap secara akurat untuk fallback warna
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark' || ((colorScheme as any) === 'system' && Appearance.getColorScheme() === 'dark');

  // Definisi Warna Eksplisit (Anti-Gagal di React Native)
  const inactiveColor = isDark ? '#a1a1aa' : '#71717a'; 
  const bgColor = isDark ? '#09090b' : '#ffffff'; 
  const cardBgColor = isDark ? '#18181b' : '#ffffff'; 
  const borderColor = isDark ? '#27272a' : '#e4e4e7'; 
  const textColor = isDark ? '#ffffff' : '#09090b'; 

  const navItems = [
    { path: "/", label: "Beranda", icon: Home },
    { path: "/notes", label: "Catatan", icon: FileText },
    { path: "create", label: "Create", icon: Plus, isMain: true },
    { path: "/todo", label: "Tugas", icon: CheckSquare },
    { path: "/profile", label: "Profil", icon: User },
  ];

  // FIX: Menggunakan HEX Color langsung agar tidak terpengaruh bug NativeWind
  const popupMenu = [
    { id: "/todo", label: "Tugas Baru", icon: CheckSquare, hex: "#f97316" }, // Orange
    { id: "voice", label: "Suara Pintar", icon: Mic, hex: "#f43f5e" }, // Rose
    { id: "gallery", label: "Dari Galeri", icon: ImageIcon, hex: "#6366f1" }, // Indigo
    { id: "camera", label: "Pindai Kamera", icon: Camera, hex: "#3b82f6" }, // Blue
    { id: "text", label: "Catatan Teks", icon: Type, hex: primaryHex }, // Dynamic Primary
  ];

  const handleCreateOption = (modeId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); 
    setIsOpen(false);
    
    if (modeId === "/todo") {
      router.push("/create-todo" as any); 
    } else if (modeId === "text") {
      router.push("/create" as any); 
    } else {
      // Sinyal ini ditangkap oleh useEffect di app/create.tsx untuk memicu hardware!
      router.push({ pathname: "/create", params: { mode: modeId } } as any);
    }
  };

  const toggleMenu = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsOpen(!isOpen);
  };

  const plusIconStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: withSpring(isOpen ? "135deg" : "0deg", { damping: 12, stiffness: 90 }) }],
    };
  });

  return (
    <View
      className="flex-row items-center justify-between px-2"
      style={{ 
        backgroundColor: bgColor,
        borderTopWidth: 1,
        borderTopColor: borderColor,
        paddingBottom: insets.bottom || 12, 
        height: 65 + (insets.bottom || 12),
        elevation: 20, 
        shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.1, shadowRadius: 12 
      }}
    >
      {navItems.map((item) => {
        if (item.isMain) {
          return (
            <View key="create-btn" className="relative items-center justify-center w-1/5 -top-6">
              <TouchableOpacity
                onPress={toggleMenu}
                activeOpacity={0.9}
                className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg shadow-black/20"
                style={{ backgroundColor: primaryHex, borderWidth: 4, borderColor: bgColor }}
              >
                <Animated.View style={plusIconStyle}>
                  <Plus color="#ffffff" size={32} strokeWidth={2.5} />
                </Animated.View>
              </TouchableOpacity>
            </View>
          );
        }

        const isFocused = pathname === item.path;
        const Icon = item.icon;

        const onPress = () => {
          if (!isFocused) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); 
            router.push(item.path as any);
          }
        };

        return (
          <TouchableOpacity
            key={item.path}
            onPress={onPress}
            activeOpacity={0.6}
            className="flex-1 items-center justify-center h-full pt-2"
          >
            <View 
              className={`items-center justify-center px-4 py-1.5 rounded-2xl`}
              style={{ backgroundColor: isFocused ? `${primaryHex}20` : 'transparent' }}
            >
              <Icon color={isFocused ? primaryHex : inactiveColor} size={22} strokeWidth={isFocused ? 2.5 : 2} />
            </View>
            <CustomText 
              className="text-[10px] mt-1 font-bold"
              style={{ color: isFocused ? primaryHex : inactiveColor }}
            >
              {item.label}
            </CustomText>
          </TouchableOpacity>
        );
      })}

      <Modal visible={isOpen} transparent animationType="fade">
        <Pressable className="flex-1 bg-black/70" onPress={toggleMenu}>
          
          <View className="absolute bottom-36 w-full items-center">
            <View className="flex-col items-end gap-3 w-48">
              {popupMenu.map((menu, idx) => {
                const MenuIcon = menu.icon;
                return (
                  <Animated.View 
                    key={menu.id} 
                    entering={FadeInDown.delay(idx * 50).springify().damping(14)} 
                    exiting={FadeOutDown.duration(150)}
                  >
                    <TouchableOpacity
                      onPress={() => handleCreateOption(menu.id)}
                      activeOpacity={0.7}
                      className="flex-row items-center gap-3"
                    >
                      <CustomText 
                        className="text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm"
                        style={{ backgroundColor: cardBgColor, borderColor: borderColor, borderWidth: 1, color: textColor }}
                      >
                        {menu.label}
                      </CustomText>
                      <View 
                        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-lg border-2 border-background/20`}
                        style={{ backgroundColor: menu.hex }} // Menerapkan Hex Color
                      >
                        <MenuIcon color="#fff" size={24} strokeWidth={2.5} />
                      </View>
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </View>
          </View>

          <View 
            className="absolute bottom-0 w-full flex-row items-center justify-center pointer-events-none" 
            style={{ paddingBottom: insets.bottom || 12, height: 65 + (insets.bottom || 12) }}
          >
            <View className="relative items-center justify-center w-1/5 -top-6">
              <View 
                className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg pointer-events-auto shadow-black/50"
                style={{ backgroundColor: cardBgColor, borderColor: bgColor, borderWidth: 4 }}
              >
                <TouchableOpacity onPress={toggleMenu} activeOpacity={0.9} className="w-full h-full items-center justify-center">
                   <Animated.View style={plusIconStyle}>
                     <Plus color={textColor} size={32} strokeWidth={2.5} />
                   </Animated.View>
                </TouchableOpacity>
              </View>
            </View>
          </View>

        </Pressable>
      </Modal>
    </View>
  );
}