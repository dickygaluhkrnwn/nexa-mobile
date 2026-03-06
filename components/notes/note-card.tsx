import { ChevronDown, ChevronRight, CornerDownRight, LockKeyhole, MoreVertical, Users } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React from 'react';
import { Appearance, Text, TouchableOpacity, View } from 'react-native';
import { useSettings } from '../../hooks/use-settings';

const accentColors: Record<string, string> = {
  default: '#9333ea', blue: '#3b82f6', emerald: '#10b981',
  amber: '#f59e0b', orange: '#f97316', rose: '#f43f5e', violet: '#8b5cf6',
};

interface NoteCardProps {
  note: any; // TreeNodeData
  viewMode: 'list' | 'grid';
  isVaultOpen: boolean;
  isShared: boolean;
  isExpanded: boolean;
  onPress: () => void;
  onLongPress: () => void;
  onToggleExpand: () => void;
}

export function NoteCard({ note, viewMode, isVaultOpen, isShared, isExpanded, onPress, onLongPress, onToggleExpand }: NoteCardProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark' || ((colorScheme as any) === 'system' && Appearance.getColorScheme() === 'dark');
  const cardBgColor = isDark ? '#18181b' : '#ffffff';
  const borderColor = isDark ? '#27272a' : '#e4e4e7';
  const textColor = isDark ? '#ffffff' : '#09090b';
  const mutedColor = isDark ? '#a1a1aa' : '#71717a';

  const { colorAccent, fontStyle } = useSettings();
  const primaryHex = accentColors[colorAccent] || accentColors.default;
  const fontFamily = fontStyle === 'serif' ? 'serif' : fontStyle === 'mono' ? 'monospace' : 'sans-serif';

  const depthMargin = Math.min(note.depth * (viewMode === 'grid' ? 8 : 20), 40);
  const plainTextSnippet = note.content ? note.content.replace(/<[^>]+>/g, ' ').trim() : "Tidak ada konten tambahan.";

  const sharedColor = '#3b82f6'; 
  const neutralLeftBorder = isDark ? '#e4e4e7' : '#d4d4d8'; 
  
  let currentLeftBorderColor = primaryHex; 
  
  if (note.isPinned) currentLeftBorderColor = neutralLeftBorder; 
  else if (isShared) currentLeftBorderColor = sharedColor; 
  else if (isVaultOpen) currentLeftBorderColor = '#a855f7'; 

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      onLongPress={onLongPress}
      style={{
        width: viewMode === 'grid' ? '48%' : undefined,
        marginBottom: 12,
        marginLeft: viewMode === 'list' ? depthMargin : 0, 
        backgroundColor: isShared ? (isDark ? `${sharedColor}10` : `${sharedColor}05`) : cardBgColor,
        borderColor: note.isPinned ? neutralLeftBorder : (isShared ? `${sharedColor}50` : (isVaultOpen ? '#a855f7' : borderColor)),
        borderWidth: 1,
        borderLeftWidth: 4,
        borderLeftColor: currentLeftBorderColor,
      }}
      className="rounded-2xl overflow-hidden shadow-sm flex flex-col"
    >
      <View className="p-4 flex-1 flex flex-col justify-between">
        <View>
          <View className="flex-row items-start justify-between gap-2 mb-1.5">
            <View className="flex-row items-start flex-1 pr-1">
              {note.hasChildren ? (
                <TouchableOpacity 
                  onPress={(e) => { e.stopPropagation(); onToggleExpand(); }}
                  className="p-1 -ml-1 mr-1 rounded-md"
                >
                  {isExpanded ? <ChevronDown color={mutedColor} size={16} /> : <ChevronRight color={mutedColor} size={16} />}
                </TouchableOpacity>
              ) : note.depth > 0 && viewMode === 'list' ? (
                <CornerDownRight color={mutedColor} size={14} className="mt-1 mr-1.5 opacity-50" />
              ) : null}

              <Text 
                className="font-bold flex-1" 
                style={{ fontSize: viewMode === 'grid' ? 14 : 15, color: textColor, lineHeight: 20, fontFamily }} 
                numberOfLines={2}
              >
                {isVaultOpen && <LockKeyhole color="#a855f7" size={14} style={{ marginRight: 4, marginTop: 2 }} />}
                {isShared && !note.isPinned && <Users color={sharedColor} size={14} style={{ marginRight: 4, marginTop: 2 }} />}
                {note.title || "Tanpa Judul"}
              </Text>
            </View>

            <TouchableOpacity 
              onPress={(e) => { e.stopPropagation(); onLongPress(); }}
              className="p-1 -mr-2 -mt-1 rounded-full"
            >
              <MoreVertical color={mutedColor} size={18} />
            </TouchableOpacity>
          </View>

          <Text 
            className="text-[11px] leading-relaxed mt-1" 
            style={{ color: mutedColor, fontFamily }} 
            numberOfLines={viewMode === 'grid' ? 3 : 2}
          >
            {plainTextSnippet}
          </Text>
        </View>
        
        {note.tags && note.tags.length > 0 && (
          <View className="flex-row flex-wrap gap-1.5 mt-3">
            {note.tags.slice(0, 2).map((tag: string, i: number) => (
              <View key={i} className="px-2 py-0.5 rounded-md" style={{ backgroundColor: `${primaryHex}15` }}>
                 <Text className="text-[9px] font-bold" style={{ color: primaryHex, fontFamily }} numberOfLines={1}>
                   #{tag}
                 </Text>
              </View>
            ))}
            {note.tags.length > 2 && (
              <Text className="text-[9px] font-medium mt-0.5" style={{ color: mutedColor, fontFamily }}>
                +{note.tags.length - 2}
              </Text>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}