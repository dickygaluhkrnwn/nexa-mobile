import * as Haptics from 'expo-haptics';
import { ArrowDownAZ, ArrowDownZA, ArrowUpCircle, Clock, Filter, LayoutGrid, List, Search, X } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React, { useState } from 'react';
import { Appearance, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSettings } from '../../hooks/use-settings';

const accentColors: Record<string, string> = {
  default: '#9333ea', blue: '#3b82f6', emerald: '#10b981',
  amber: '#f59e0b', orange: '#f97316', rose: '#f43f5e', violet: '#8b5cf6',
};

interface SearchFilterBarProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  viewMode: 'list' | 'grid';
  setViewMode: (mode: 'list' | 'grid') => void;
  sortBy: string;
  setSortBy: (sort: 'newest' | 'oldest' | 'az' | "za") => void;
  allTags: string[];
  selectedTag: string | null;
  setSelectedTag: (tag: string | null) => void;
}

export function SearchFilterBar({
  searchQuery, setSearchQuery,
  viewMode, setViewMode,
  sortBy, setSortBy,
  allTags, selectedTag, setSelectedTag
}: SearchFilterBarProps) {
  const [showSortMenu, setShowSortMenu] = useState(false);

  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark' || ((colorScheme as any) === 'system' && Appearance.getColorScheme() === 'dark');
  const cardBgColor = isDark ? '#18181b' : '#ffffff';
  const borderColor = isDark ? '#27272a' : '#e4e4e7';
  const textColor = isDark ? '#ffffff' : '#09090b';
  const mutedColor = isDark ? '#a1a1aa' : '#71717a';

  const { colorAccent, fontStyle } = useSettings();
  const primaryHex = accentColors[colorAccent] || accentColors.default;
  const fontFamily = fontStyle === 'serif' ? 'serif' : fontStyle === 'mono' ? 'monospace' : 'sans-serif';

  return (
    <View>
      {/* TOOLBAR PENCARIAN & FILTER */}
      <View className="flex-row items-center gap-2 mb-4">
        <View className="flex-1 flex-row items-center px-4 h-12 rounded-xl border shadow-sm" style={{ backgroundColor: cardBgColor, borderColor }}>
          <Search color={mutedColor} size={18} />
          <TextInput
            placeholder="Cari catatan..."
            placeholderTextColor={mutedColor}
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 ml-2 text-sm font-medium"
            style={{ color: textColor, fontFamily }}
          />
          {searchQuery !== "" && (
            <TouchableOpacity onPress={() => setSearchQuery("")} className="p-1">
               <X color={mutedColor} size={16} />
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity 
          activeOpacity={0.7}
          onPress={() => setShowSortMenu(true)}
          className="w-12 h-12 rounded-xl items-center justify-center border shadow-sm"
          style={{ backgroundColor: sortBy !== "newest" ? primaryHex : cardBgColor, borderColor }}
        >
          <Filter color={sortBy !== "newest" ? "#fff" : textColor} size={20} />
        </TouchableOpacity>

        <TouchableOpacity 
          activeOpacity={0.7}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setViewMode(viewMode === "grid" ? "list" : "grid"); }}
          className="w-12 h-12 rounded-xl items-center justify-center border shadow-sm"
          style={{ backgroundColor: cardBgColor, borderColor }}
        >
          {viewMode === "grid" ? <List color={textColor} size={20} /> : <LayoutGrid color={textColor} size={20} />}
        </TouchableOpacity>
      </View>

      {/* FILTER TAGS */}
      {allTags.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row overflow-visible mt-2 mb-6">
          <TouchableOpacity
            onPress={() => setSelectedTag(null)}
            className="px-4 py-2 rounded-full border mr-2 items-center justify-center"
            style={{ backgroundColor: selectedTag === null ? primaryHex : cardBgColor, borderColor: selectedTag === null ? primaryHex : borderColor }}
          >
            <Text className="text-xs font-bold" style={{ color: selectedTag === null ? '#fff' : mutedColor, fontFamily }}>Semua</Text>
          </TouchableOpacity>
          
          {allTags.map(tag => (
            <TouchableOpacity
              key={tag}
              onPress={() => setSelectedTag(tag)}
              className="px-4 py-2 rounded-full border mr-2 items-center justify-center"
              style={{ backgroundColor: selectedTag === tag ? primaryHex : cardBgColor, borderColor: selectedTag === tag ? primaryHex : borderColor }}
            >
              <Text className="text-xs font-bold" style={{ color: selectedTag === tag ? '#fff' : mutedColor, fontFamily }}>#{tag}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* MODAL SORTING */}
      <Modal visible={showSortMenu} transparent animationType="fade">
         <TouchableOpacity activeOpacity={1} onPress={() => setShowSortMenu(false)} className="flex-1 bg-black/40 justify-center items-center p-4">
            <View className="w-full max-w-xs rounded-3xl p-2 shadow-2xl" style={{ backgroundColor: cardBgColor, borderColor, borderWidth: 1 }}>
               <Text className="text-xs font-bold uppercase tracking-wider px-4 py-3" style={{ color: mutedColor, fontFamily }}>Urutkan Catatan</Text>
               <View className="h-px w-full mb-2" style={{ backgroundColor: borderColor }} />
               
               {[
                 { id: 'newest', icon: Clock, label: 'Terbaru' },
                 { id: 'oldest', icon: ArrowUpCircle, label: 'Terlama' },
                 { id: 'az', icon: ArrowDownAZ, label: 'Judul (A - Z)' },
                 { id: 'za', icon: ArrowDownZA, label: 'Judul (Z - A)' },
               ].map(item => (
                 <TouchableOpacity 
                   key={item.id}
                   onPress={() => { setSortBy(item.id as any); setShowSortMenu(false); }}
                   className="flex-row items-center gap-3 px-4 py-4 rounded-xl mb-1"
                   style={{ backgroundColor: sortBy === item.id ? `${primaryHex}15` : 'transparent' }}
                 >
                   <item.icon color={sortBy === item.id ? primaryHex : textColor} size={20} />
                   <Text className="font-bold text-sm" style={{ color: sortBy === item.id ? primaryHex : textColor, fontFamily }}>{item.label}</Text>
                 </TouchableOpacity>
               ))}
            </View>
         </TouchableOpacity>
      </Modal>
    </View>
  );
}