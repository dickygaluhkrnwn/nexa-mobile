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

  // Definisi Warna Eksplisit (Anti-Gagal)
  const inactiveColor = isDark ? '#71717a' : '#a1a1aa'; 
  const cardBgColor = isDark ? '#18181b' : '#ffffff'; 
  const borderColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'; 
  const textColor = isDark ? '#ffffff' : '#09090b'; 

  const navItems = [
    { path: "/", label: "Beranda", icon: Home },
    { path: "/notes", label: "Catatan", icon: FileText },
    { path: "create", label: "Create", icon: Plus, isMain: true },
    { path: "/todo", label: "Tugas", icon: CheckSquare },
    { path: "/profile", label: "Profil", icon: User },
  ];

  // Menu pop-up modern
  const popupMenu = [
    { id: "/todo", label: "Tugas Baru", icon: CheckSquare, hex: "#f97316" }, 
    { id: "voice", label: "Suara Pintar", icon: Mic, hex: "#f43f5e" }, 
    { id: "gallery", label: "Dari Galeri", icon: ImageIcon, hex: "#6366f1" }, 
    { id: "camera", label: "Pindai Kamera", icon: Camera, hex: "#3b82f6" }, 
    { id: "text", label: "Catatan Teks", icon: Type, hex: primaryHex }, 
  ];

  const handleCreateOption = (modeId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); 
    setIsOpen(false);
    
    if (modeId === "/todo") {
      router.push("/create-todo" as any); 
    } else if (modeId === "text") {
      router.push("/create" as any); 
    } else {
      router.push({ pathname: "/create", params: { mode: modeId } } as any);
    }
  };

  const toggleMenu = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsOpen(!isOpen);
  };

  const plusIconStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: withSpring(isOpen ? "135deg" : "0deg", { damping: 14, stiffness: 120 }) }],
    };
  });

  // Margin dinamis untuk menjaga jarak aman dari indikator home iPhone
  const navBottomMargin = Math.max(insets.bottom, 16);

  return (
    <>
      {/* WADAH UTAMA FLOATING PILL */}
      <View
        className="absolute left-4 right-4 z-40"
        style={{ bottom: navBottomMargin }}
      >
        <View
          className="flex-row items-center justify-between px-2 rounded-[2rem] border"
          style={{ 
            backgroundColor: isDark ? 'rgba(24, 24, 27, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            borderColor: borderColor,
            height: 70,
            shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 15 
          }}
        >
          {navItems.map((item) => {
            
            // Render Tombol Tengah (Create)
            if (item.isMain) {
              return (
                <View key="create-btn" className="relative items-center justify-center w-1/5 -top-4">
                  <TouchableOpacity
                    onPress={toggleMenu}
                    activeOpacity={0.9}
                    className="w-14 h-14 rounded-full items-center justify-center shadow-xl"
                    style={{ 
                      backgroundColor: primaryHex, 
                      borderWidth: 4, 
                      borderColor: isDark ? '#18181b' : '#ffffff', // Efek "Cutout" pada pill
                      shadowColor: primaryHex, shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 10 
                    }}
                  >
                    <Animated.View style={plusIconStyle}>
                      <Plus color="#ffffff" size={28} strokeWidth={3} />
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

            // Render Tab Item Biasa
            return (
              <TouchableOpacity
                key={item.path}
                onPress={onPress}
                activeOpacity={0.6}
                className="flex-1 items-center justify-center h-full pt-1"
              >
                <View className="items-center justify-center">
                  <Icon color={isFocused ? primaryHex : inactiveColor} size={22} strokeWidth={isFocused ? 2.5 : 2} />
                </View>
                <CustomText 
                  className="text-[9px] mt-1 font-bold"
                  style={{ color: isFocused ? primaryHex : inactiveColor, opacity: isFocused ? 1 : 0.7 }}
                >
                  {item.label}
                </CustomText>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* OVERLAY MODAL UNTUK MENU CREATE */}
      <Modal visible={isOpen} transparent animationType="fade">
        <Pressable 
          className="flex-1" 
          style={{ backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.4)' }} 
          onPress={toggleMenu}
        >
          
          {/* Daftar Opsi Menu Melayang */}
          <View className="absolute w-full items-center" style={{ bottom: navBottomMargin + 95 }}>
            <View className="flex-col items-center gap-3 w-56">
              {popupMenu.map((menu, idx) => {
                const MenuIcon = menu.icon;
                return (
                  <Animated.View 
                    key={menu.id} 
                    entering={FadeInDown.delay(idx * 50).springify().damping(14)} 
                    exiting={FadeOutDown.duration(150)}
                    className="w-full"
                  >
                    <TouchableOpacity
                      onPress={() => handleCreateOption(menu.id)}
                      activeOpacity={0.8}
                      className="flex-row items-center gap-4 px-5 py-3.5 rounded-[1.5rem] shadow-lg border"
                      style={{ backgroundColor: cardBgColor, borderColor: borderColor }}
                    >
                      <View 
                        className="w-10 h-10 rounded-full items-center justify-center"
                        style={{ backgroundColor: `${menu.hex}15` }} 
                      >
                        <MenuIcon color={menu.hex} size={20} strokeWidth={2.5} />
                      </View>
                      <CustomText 
                        className="text-sm font-extrabold"
                        style={{ color: textColor }}
                      >
                        {menu.label}
                      </CustomText>
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </View>
          </View>

          {/* Duplikat Tombol Create di atas Overlay agar transisi X mulus */}
          <View 
            className="absolute left-4 right-4 flex-row items-center justify-center pointer-events-none z-50" 
            style={{ bottom: navBottomMargin, height: 70 }}
          >
            <View className="relative items-center justify-center w-1/5 -top-4 pointer-events-auto">
              <TouchableOpacity
                onPress={toggleMenu}
                activeOpacity={0.9}
                className="w-14 h-14 rounded-full items-center justify-center shadow-xl"
                style={{ 
                  backgroundColor: primaryHex, 
                  borderWidth: 4, 
                  borderColor: isDark ? '#18181b' : '#ffffff', 
                  shadowColor: primaryHex, shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 10 
                }}
              >
                <Animated.View style={plusIconStyle}>
                  <Plus color="#ffffff" size={28} strokeWidth={3} />
                </Animated.View>
              </TouchableOpacity>
            </View>
          </View>

        </Pressable>
      </Modal>
    </>
  );
}