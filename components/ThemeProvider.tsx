import { useColorScheme } from 'nativewind';
import React, { useEffect, useState } from 'react';
import { Appearance, View } from 'react-native';
import { useSettings } from '../hooks/use-settings';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { colorScheme, setColorScheme } = useColorScheme();
  const { colorAccent } = useSettings();
  const [mounted, setMounted] = useState(false);

  // Status nyata apakah aplikasi sedang mode gelap
  const actualIsDark = colorScheme === 'dark' || ((colorScheme as any) === 'system' && Appearance.getColorScheme() === 'dark');

  useEffect(() => {
    setMounted(true);
    const listener = Appearance.addChangeListener((preferences) => {
       if ((colorScheme as any) === 'system' || !colorScheme) {
          setColorScheme(preferences.colorScheme as 'light' | 'dark');
       }
    });
    
    if ((colorScheme as any) === 'system' || !colorScheme) {
      const currentSystemTheme = Appearance.getColorScheme() || 'light';
      setColorScheme(currentSystemTheme as 'light' | 'dark');
    }

    return () => listener.remove();
  }, [colorScheme, setColorScheme]);

  if (!mounted) return null;

  const themeClass = colorAccent !== 'default' ? `theme-${colorAccent}` : '';
  const rootClass = actualIsDark ? 'dark' : '';

  return (
    <View className={`flex-1 bg-background ${themeClass} ${rootClass}`}>
      {children}
    </View>
  );
}