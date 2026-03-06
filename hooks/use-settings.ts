import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ColorAccent = 'default' | 'rose' | 'emerald' | 'amber' | 'violet' | 'blue' | 'orange';
export type FontStyle = 'sans' | 'serif' | 'mono';

export interface SettingsState {
  colorAccent: ColorAccent;
  fontStyle: FontStyle;
  setColorAccent: (color: ColorAccent) => void;
  setFontStyle: (font: FontStyle) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      colorAccent: 'default',
      fontStyle: 'sans',
      setColorAccent: (color) => set({ colorAccent: color }),
      setFontStyle: (font) => set({ fontStyle: font }),
    }),
    { 
      name: 'nexa-settings-mobile',
      storage: createJSONStorage(() => AsyncStorage)
    } 
  )
);