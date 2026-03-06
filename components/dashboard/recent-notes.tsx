import { useRouter } from 'expo-router';
import { FileText, Plus } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React from 'react';
import { Appearance, TouchableOpacity, View } from 'react-native';
import { NoteData } from '../../lib/notes-service';
import { CustomText } from '../ui/custom-text';

interface DashboardNote extends NoteData {
  id: string;
}

interface RecentNotesProps {
  recentNotes: DashboardNote[];
}

export function RecentNotes({ recentNotes }: RecentNotesProps) {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark' || ((colorScheme as any) === 'system' && Appearance.getColorScheme() === 'dark');
  
  const cardBgColor = isDark ? '#18181b' : '#ffffff';
  const borderColor = isDark ? '#27272a' : '#e4e4e7';
  const textColor = isDark ? '#ffffff' : '#09090b';
  const mutedColor = isDark ? '#a1a1aa' : '#71717a';

  return (
    <View className="space-y-4 pt-2">
      <View className="flex-row items-center justify-between mb-4">
        <View>
          <View className="flex-row items-center gap-2">
            <FileText color="#3b82f6" size={20} />
            <CustomText className="text-lg font-bold" style={{ color: textColor }}>Catatan Terbaru</CustomText>
          </View>
          <CustomText className="text-xs" style={{ color: mutedColor }}>Akses cepat ide dan jurnalmu.</CustomText>
        </View>
        <TouchableOpacity 
          activeOpacity={0.7} 
          onPress={() => router.push('/notes')} 
          className="bg-card border rounded-full px-4 py-2 shadow-sm" 
          style={{ borderColor }}
        >
          <CustomText className="font-bold text-xs" style={{ color: textColor }}>Semua</CustomText>
        </TouchableOpacity>
      </View>

      {recentNotes.length === 0 ? (
        <View className="p-6 rounded-[2rem] border border-dashed items-center justify-center bg-muted/20" style={{ borderColor }}>
          <CustomText className="text-sm font-bold mb-4 text-center" style={{ color: mutedColor }}>Belum ada ide yang dicatat.</CustomText>
          <TouchableOpacity 
            activeOpacity={0.7} 
            onPress={() => router.push('/create' as any)} 
            className="flex-row items-center px-4 py-2.5 rounded-xl bg-primary/10 border border-primary/20"
          >
            <Plus color="#9333ea" size={16} style={{ marginRight: 6 }} />
            <CustomText className="text-xs font-bold text-primary">Tulis Sesuatu</CustomText>
          </TouchableOpacity>
        </View>
      ) : (
        <View className="flex-row flex-wrap justify-between">
          {recentNotes.map((note) => {
            // Membersihkan tag HTML dari konten untuk preview
            const plainTextSnippet = note.content ? note.content.replace(/<[^>]+>/g, ' ').trim() : "";

            return (
              <TouchableOpacity
                key={note.id}
                activeOpacity={0.7}
                onPress={() => router.push(`/edit/${note.id}` as any)}
                className="w-[48%] p-4 rounded-[1.5rem] border shadow-sm mb-4 flex-col overflow-hidden"
                style={{ backgroundColor: cardBgColor, borderColor, minHeight: 120 }}
              >
                <View className="flex-1">
                  <CustomText className="font-bold text-[13px] mb-2 leading-tight" style={{ color: textColor }} numberOfLines={2}>
                    {note.title || "Tanpa Judul"}
                  </CustomText>
                  <CustomText className="text-[10px] leading-relaxed" style={{ color: mutedColor }} numberOfLines={3}>
                    {plainTextSnippet}
                  </CustomText>
                </View>
                
                {note.tags && note.tags.length > 0 && (
                  <View className="mt-3 self-start bg-primary/10 px-2 py-1 rounded-md">
                    <CustomText className="text-[9px] font-bold text-primary uppercase tracking-wider" numberOfLines={1}>
                      #{note.tags[0]}
                    </CustomText>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}