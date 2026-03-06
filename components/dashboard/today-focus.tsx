import { useRouter } from 'expo-router';
import { AlertCircle, CalendarClock, CheckCircle2, ChevronRight, Circle, Clock } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React from 'react';
import { Appearance, TouchableOpacity, View } from 'react-native';
import { NoteData } from '../../lib/notes-service';
import { CustomText } from '../ui/custom-text';

interface DashboardNote extends NoteData {
  id: string;
}

interface TodayFocusProps {
  urgentTasks: DashboardNote[];
  pendingTodosCount: number;
  todayStr: string;
}

export function TodayFocus({ urgentTasks, pendingTodosCount, todayStr }: TodayFocusProps) {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark' || ((colorScheme as any) === 'system' && Appearance.getColorScheme() === 'dark');
  
  const cardBgColor = isDark ? '#18181b' : '#ffffff';
  const borderColor = isDark ? '#27272a' : '#e4e4e7';
  const textColor = isDark ? '#ffffff' : '#09090b';
  const mutedColor = isDark ? '#a1a1aa' : '#71717a';

  return (
    <View className="space-y-4 mb-4 pt-2">
      <View className="flex-row items-center justify-between mb-4">
        <View>
          <View className="flex-row items-center gap-2">
            <CalendarClock color="#f97316" size={20} />
            <CustomText className="text-lg font-bold" style={{ color: textColor }}>Fokus Hari Ini</CustomText>
          </View>
          <CustomText className="text-xs" style={{ color: mutedColor }}>Selesaikan tugas prioritasmu.</CustomText>
        </View>
        <TouchableOpacity 
          activeOpacity={0.7} 
          onPress={() => router.push('/todo')} 
          className="bg-card border rounded-full px-4 py-2 shadow-sm" 
          style={{ borderColor }}
        >
          <CustomText className="font-bold text-xs" style={{ color: textColor }}>Buka Papan</CustomText>
        </TouchableOpacity>
      </View>

      {pendingTodosCount === 0 ? (
        <View className="p-6 rounded-[2rem] border border-dashed items-center justify-center bg-muted/20" style={{ borderColor }}>
          <View className="w-14 h-14 bg-green-500/10 rounded-full flex items-center justify-center mb-3">
            <CheckCircle2 color="#22c55e" size={28} />
          </View>
          <CustomText className="text-sm font-bold mb-1" style={{ color: textColor }}>Semua Tuntas!</CustomText>
          <CustomText className="text-xs text-center" style={{ color: mutedColor }}>Kamu bisa beristirahat dengan tenang sekarang.</CustomText>
        </View>
      ) : (
        <View className="flex-col gap-2.5">
          {urgentTasks.map((todo) => {
            const isOverdue = todo.dueDate && todo.dueDate < todayStr;
            return (
              <TouchableOpacity
                key={todo.id}
                activeOpacity={0.7}
                onPress={() => router.push(`/edit-todo/${todo.id}` as any)}
                className="flex-row items-center gap-3 p-4 rounded-2xl border shadow-sm"
                style={{
                  backgroundColor: isOverdue ? (isDark ? '#450a0a30' : '#fef2f2') : cardBgColor,
                  borderColor: isOverdue ? '#ef444450' : borderColor
                }}
              >
                <Circle color={isOverdue ? "#ef444480" : mutedColor} size={20} />
                <View className="flex-1 pr-2">
                  <CustomText className="font-bold text-[13px] mb-1" style={{ color: textColor }} numberOfLines={1}>
                    {todo.title || "Tanpa Judul"}
                  </CustomText>
                  {todo.dueDate && (
                    <View className="flex-row items-center gap-1.5">
                      {isOverdue ? <AlertCircle color="#ef4444" size={12} /> : <Clock color="#f97316" size={12} />}
                      <CustomText className="text-[10px] font-bold uppercase tracking-widest" style={{ color: isOverdue ? '#ef4444' : '#f97316' }}>
                        {isOverdue ? 'Terlewat!' : 'Hari Ini'}
                      </CustomText>
                    </View>
                  )}
                </View>
                <ChevronRight color={mutedColor} size={16} style={{ opacity: 0.5 }} />
              </TouchableOpacity>
            );
          })}
          
          {pendingTodosCount > 3 && (
            <TouchableOpacity 
              activeOpacity={0.7} 
              onPress={() => router.push('/todo')} 
              className="py-3 bg-muted/30 rounded-2xl border items-center mt-1" 
              style={{ borderColor }}
            >
              <CustomText className="text-xs font-bold" style={{ color: mutedColor }}>Lihat {pendingTodosCount - 3} tugas lainnya</CustomText>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}