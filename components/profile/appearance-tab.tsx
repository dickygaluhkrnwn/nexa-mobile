import * as Haptics from 'expo-haptics';
import { Laptop, Moon, Palette, Sun, Type } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React, { useEffect, useState } from 'react';
import { Appearance, Text, TouchableOpacity, View } from 'react-native';
import { useSettings } from '../../hooks/use-settings';
import { CustomText } from '../ui/custom-text'; // <-- Menggunakan CustomText agar Font berubah

const accentColors: Record<string, string> = {
  default: '#9333ea',
  blue: '#3b82f6',
  emerald: '#10b981',
  amber: '#f59e0b',
  orange: '#f97316',
  rose: '#f43f5e',
  violet: '#8b5cf6',
};

export function AppearanceTab() {
  const { colorScheme, setColorScheme } = useColorScheme();
  const { colorAccent, setColorAccent, fontStyle, setFontStyle } = useSettings();

  const [activeTheme, setActiveTheme] = useState<'light' | 'dark' | 'system'>(
    colorScheme === 'light' ? 'light' : colorScheme === 'dark' ? 'dark' : 'system'
  );

  useEffect(() => {
     setActiveTheme(colorScheme === 'light' ? 'light' : colorScheme === 'dark' ? 'dark' : 'system');
  }, [colorScheme]);

  const handleThemeChange = (theme: 'light' | 'dark' | 'system') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTheme(theme);
    if (theme === 'system') {
      Appearance.setColorScheme(null); // Ikuti OS HP
      setColorScheme('system' as any);
    } else {
      Appearance.setColorScheme(theme); // Paksa HP
      setColorScheme(theme);
    }
  };

  const handleColorChange = (color: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setColorAccent(color as any);
  };

  const handleFontChange = (font: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFontStyle(font as any);
  };

  // Dinamis mengambil warna hex berdasarkan state
  const activeColor = accentColors[colorAccent] || accentColors.default;

  // FIX UTAMA: Deteksi Mode Gelap secara akurat untuk fallback warna teks dan background
  const isDark = colorScheme === 'dark' || ((colorScheme as any) === 'system' && Appearance.getColorScheme() === 'dark');
  const mutedColor = isDark ? '#a1a1aa' : '#71717a'; 
  const cardBgColor = isDark ? '#18181b' : '#ffffff'; 
  const borderColor = isDark ? '#27272a' : '#e4e4e7'; 

  return (
    <View className="flex flex-col gap-6 pb-4">
      
      {/* --- MODE CAHAYA --- */}
      <View>
        <CustomText className="text-xs font-bold uppercase tracking-widest px-1 ml-1 mb-3" style={{ color: mutedColor }}>
          Mode Cahaya
        </CustomText>
        <View className="rounded-3xl p-5 shadow-sm flex flex-col gap-4" style={{ backgroundColor: cardBgColor, borderColor: borderColor, borderWidth: 1 }}>
          <View className="flex-row gap-3">
            <TouchableOpacity 
              onPress={() => handleThemeChange('light')} 
              activeOpacity={0.7}
              className="flex-1 flex-col items-center justify-center p-4 rounded-2xl border"
              style={{
                backgroundColor: activeTheme === 'light' ? `${activeColor}15` : 'transparent',
                borderColor: activeTheme === 'light' ? activeColor : borderColor
              }}
            >
              <Sun color={activeTheme === 'light' ? activeColor : mutedColor} size={24} style={{ marginBottom: 8 }} />
              <CustomText style={{ fontSize: 12, fontWeight: 'bold', color: activeTheme === 'light' ? activeColor : mutedColor }}>Terang</CustomText>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => handleThemeChange('dark')} 
              activeOpacity={0.7}
              className="flex-1 flex-col items-center justify-center p-4 rounded-2xl border"
              style={{
                backgroundColor: activeTheme === 'dark' ? `${activeColor}15` : 'transparent',
                borderColor: activeTheme === 'dark' ? activeColor : borderColor
              }}
            >
              <Moon color={activeTheme === 'dark' ? activeColor : mutedColor} size={24} style={{ marginBottom: 8 }} />
              <CustomText style={{ fontSize: 12, fontWeight: 'bold', color: activeTheme === 'dark' ? activeColor : mutedColor }}>Gelap</CustomText>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => handleThemeChange('system')} 
              activeOpacity={0.7}
              className="flex-1 flex-col items-center justify-center p-4 rounded-2xl border"
              style={{
                backgroundColor: activeTheme === 'system' ? `${activeColor}15` : 'transparent',
                borderColor: activeTheme === 'system' ? activeColor : borderColor
              }}
            >
              <Laptop color={activeTheme === 'system' ? activeColor : mutedColor} size={24} style={{ marginBottom: 8 }} />
              <CustomText style={{ fontSize: 12, fontWeight: 'bold', color: activeTheme === 'system' ? activeColor : mutedColor }}>Sistem</CustomText>
            </TouchableOpacity>
          </View>
          <CustomText className="text-xs text-center font-medium" style={{ color: mutedColor }}>
            Pilih mode yang paling nyaman untuk matamu.
          </CustomText>
        </View>
      </View>

      {/* --- AKSEN WARNA --- */}
      <View>
        <View className="flex-row items-center gap-2 mb-3 px-1 ml-1">
          <Palette color={mutedColor} size={16} />
          <CustomText className="text-xs font-bold uppercase tracking-widest" style={{ color: mutedColor }}>
            Aksen Warna
          </CustomText>
        </View>
        <View className="rounded-3xl p-5 shadow-sm" style={{ backgroundColor: cardBgColor, borderColor: borderColor, borderWidth: 1 }}>
          <View className="flex-row flex-wrap justify-center gap-4">
            {[
              { id: 'default', hex: '#9333ea' }, 
              { id: 'blue', hex: '#3b82f6' },
              { id: 'emerald', hex: '#10b981' },
              { id: 'amber', hex: '#f59e0b' },
              { id: 'orange', hex: '#f97316' },
              { id: 'rose', hex: '#f43f5e' },
              { id: 'violet', hex: '#8b5cf6' },
            ].map((item) => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.8}
                onPress={() => handleColorChange(item.id)}
                className="w-10 h-10 rounded-full items-center justify-center"
                style={{ backgroundColor: item.hex, opacity: colorAccent === item.id ? 1 : 0.3 }}
              >
                {colorAccent === item.id && (
                  <View style={{ position: 'absolute', top: -6, left: -6, right: -6, bottom: -6, borderWidth: 2, borderColor: item.hex, borderRadius: 999, opacity: 0.5 }} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* --- GAYA HURUF (FONT) --- */}
      <View>
        <View className="flex-row items-center gap-2 mb-3 px-1 ml-1">
          <Type color={mutedColor} size={16} />
          <CustomText className="text-xs font-bold uppercase tracking-widest" style={{ color: mutedColor }}>
            Gaya Huruf (Font)
          </CustomText>
        </View>
        <View className="rounded-3xl p-5 shadow-sm" style={{ backgroundColor: cardBgColor, borderColor: borderColor, borderWidth: 1 }}>
          <View className="flex-row gap-3">
            <TouchableOpacity 
              onPress={() => handleFontChange('sans')} 
              activeOpacity={0.7}
              className="flex-1 p-4 rounded-2xl border flex-col items-center"
              style={{ backgroundColor: fontStyle === 'sans' ? `${activeColor}15` : 'transparent', borderColor: fontStyle === 'sans' ? activeColor : borderColor }}
            >
              {/* Preview huruf tetap menggunakan Text biasa agar tidak kena override CustomText */}
              <Text style={{ fontFamily: 'sans-serif', fontSize: 24, fontWeight: 'bold', marginBottom: 8, color: fontStyle === 'sans' ? activeColor : mutedColor }}>Aa</Text>
              <CustomText style={{ fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, color: fontStyle === 'sans' ? activeColor : mutedColor }}>Modern</CustomText>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => handleFontChange('serif')} 
              activeOpacity={0.7}
              className="flex-1 p-4 rounded-2xl border flex-col items-center"
              style={{ backgroundColor: fontStyle === 'serif' ? `${activeColor}15` : 'transparent', borderColor: fontStyle === 'serif' ? activeColor : borderColor }}
            >
              <Text style={{ fontFamily: 'serif', fontSize: 24, fontWeight: 'bold', marginBottom: 8, color: fontStyle === 'serif' ? activeColor : mutedColor }}>Aa</Text>
              <CustomText style={{ fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, color: fontStyle === 'serif' ? activeColor : mutedColor }}>Klasik</CustomText>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={() => handleFontChange('mono')} 
              activeOpacity={0.7}
              className="flex-1 p-4 rounded-2xl border flex-col items-center"
              style={{ backgroundColor: fontStyle === 'mono' ? `${activeColor}15` : 'transparent', borderColor: fontStyle === 'mono' ? activeColor : borderColor }}
            >
              <Text style={{ fontFamily: 'monospace', fontSize: 24, fontWeight: 'bold', marginBottom: 8, color: fontStyle === 'mono' ? activeColor : mutedColor }}>Aa</Text>
              <CustomText style={{ fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: 1, color: fontStyle === 'mono' ? activeColor : mutedColor }}>Fokus</CustomText>
            </TouchableOpacity>
          </View>
        </View>
      </View>

    </View>
  );
}