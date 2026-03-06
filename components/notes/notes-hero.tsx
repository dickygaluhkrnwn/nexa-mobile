import { FileText, LockKeyhole } from 'lucide-react-native';
import React from 'react';
import { Text, View } from 'react-native';
import { useSettings } from '../../hooks/use-settings';

const accentColors: Record<string, string> = {
  default: '#9333ea', blue: '#3b82f6', emerald: '#10b981',
  amber: '#f59e0b', orange: '#f97316', rose: '#f43f5e', violet: '#8b5cf6',
};

interface NotesHeroProps {
  totalNotes: number;
  totalPublicNotes: number;
  totalVaultNotes: number;
}

export function NotesHero({ totalNotes, totalPublicNotes, totalVaultNotes }: NotesHeroProps) {
  const { colorAccent, fontStyle } = useSettings();
  const primaryHex = accentColors[colorAccent] || accentColors.default;

  // --- LOGIKA FONT MANUAL ANTI-CRASH ---
  const getFontFamily = () => {
    switch (fontStyle) {
      case 'serif': return 'serif';
      case 'mono': return 'monospace';
      case 'sans': default: return 'sans-serif';
    }
  };
  const fontFamily = getFontFamily();

  return (
    <View 
      className="rounded-[2rem] p-6 shadow-xl overflow-hidden mb-4"
      style={{ backgroundColor: primaryHex }}
    >
      <View className="relative z-10">
        <View className="flex-row items-center justify-between mb-4">
          <Text className="font-bold text-sm text-white/80 uppercase tracking-widest" style={{ fontFamily }}>
            Pusat Ide
          </Text>
          <View className="bg-white/20 px-3 py-1 rounded-full">
            <Text className="font-bold text-[10px] text-white uppercase tracking-widest" style={{ fontFamily }}>
              {totalNotes} Total
            </Text>
          </View>
        </View>
        
        <View className="flex-row gap-3">
          {/* FIX: Hapus shadow-sm agar kotak transparan tidak menampilkan bayangan aneh di belakangnya */}
          <View className="flex-1 bg-white/10 border border-white/20 p-4 rounded-2xl flex-col justify-between">
            <View className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center mb-3">
              <FileText color="#ffffff" size={16} />
            </View>
            <View>
              <Text className="text-3xl font-black text-white" style={{ fontFamily }}>{totalPublicNotes}</Text>
              <Text className="text-[10px] font-bold text-white/80 uppercase tracking-widest mt-1" style={{ fontFamily }}>Publik</Text>
            </View>
          </View>
          
          {/* FIX: Hapus shadow-sm agar kotak transparan tidak menampilkan bayangan aneh di belakangnya */}
          <View className="flex-1 bg-white/10 border border-white/20 p-4 rounded-2xl flex-col justify-between">
            <View className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center mb-3">
              <LockKeyhole color="#ffffff" size={16} />
            </View>
            <View>
              <Text className="text-3xl font-black text-white" style={{ fontFamily }}>{totalVaultNotes}</Text>
              <Text className="text-[10px] font-bold text-white/80 uppercase tracking-widest mt-1" style={{ fontFamily }}>Brankas</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}