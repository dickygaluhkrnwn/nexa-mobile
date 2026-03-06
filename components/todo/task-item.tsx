import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { Calendar, Check, CheckCircle2, Circle, MoreVertical, Pin, Repeat } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React from 'react';
import { Alert, Appearance, TouchableOpacity, View } from 'react-native';
import { useSettings } from '../../hooks/use-settings';
import { CustomText } from '../ui/custom-text';
import { TodoItem } from './types';

const accentColors: Record<string, string> = {
  default: '#9333ea', blue: '#3b82f6', emerald: '#10b981',
  amber: '#f59e0b', orange: '#f97316', rose: '#f43f5e', violet: '#8b5cf6',
};

interface TaskItemProps {
  todo: TodoItem;
  onToggle: () => void;
  onDelete: (id: string) => void;
  onTogglePin?: (todo: TodoItem) => void;
  isOverdue?: boolean;
  isPinned?: boolean;
}

export function TaskItem({ todo, onToggle, onDelete, onTogglePin, isOverdue = false, isPinned = false }: TaskItemProps) {
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark' || ((colorScheme as any) === 'system' && Appearance.getColorScheme() === 'dark');

  const { colorAccent } = useSettings();
  const primaryHex = accentColors[colorAccent] || accentColors.default;

  const cardBgColor = isDark ? '#18181b' : '#ffffff';
  const textColor = isDark ? '#ffffff' : '#09090b';
  const mutedColor = isDark ? '#a1a1aa' : '#71717a';
  const borderColor = isDark ? '#27272a' : '#e4e4e7';

  const hasSubTasks = todo.subTasks && todo.subTasks.length > 0;

  // Kalkulasi apakah tugas ini untuk Hari Ini
  const getLocalIsoDate = (d: Date) => {
    const offset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offset).toISOString().split('T')[0];
  };
  const todayStr = getLocalIsoDate(new Date());
  const isToday = todo.dueDate === todayStr;

  // --- LOGIKA WARNA DINAMIS SESUAI STATUS TUGAS ---
  // Menggunakan HEX dengan opacity (15 untuk 20%, 30 untuk border) agar warnanya MUNCUL TERANG tapi elegan
  const neutralLeftBorder = isDark ? '#e4e4e7' : '#d4d4d8';
  let currentLeftBorderColor = neutralLeftBorder;
  let currentBgColor = cardBgColor;
  let currentBorderColor = borderColor;

  if (todo.isCompleted) {
    // HIJAU TERANG - SELESAI
    currentLeftBorderColor = '#22c55e'; 
    currentBgColor = isDark ? '#22c55e15' : '#22c55e08';
    currentBorderColor = isDark ? '#22c55e30' : '#22c55e40';
  } else if (isOverdue) {
    // MERAH - TERLEWAT
    currentLeftBorderColor = '#ef4444'; 
    currentBgColor = isDark ? '#ef444415' : '#ef444408';
    currentBorderColor = isDark ? '#ef444430' : '#ef444440';
  } else if (isToday) {
    // WARNA AKSEN - HARI INI
    currentLeftBorderColor = primaryHex; 
    currentBgColor = isDark ? `${primaryHex}15` : `${primaryHex}08`;
    currentBorderColor = isDark ? `${primaryHex}30` : `${primaryHex}40`;
  } else {
    // NETRAL - MENDATANG / PINNED
    currentLeftBorderColor = isPinned ? primaryHex : neutralLeftBorder;
    currentBgColor = cardBgColor;
    currentBorderColor = borderColor;
  }

  // Fungsi Native Options Menu
  const showOptions = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const options = [
      { text: "Batal", style: "cancel" as const },
      { text: isPinned ? "Lepas Sematan" : "Sematkan", onPress: () => onTogglePin && onTogglePin(todo) },
      { text: "Hapus Tugas", style: "destructive" as const, onPress: () => onDelete(todo.id) }
    ];
    Alert.alert(todo.title || "Pilihan Tugas", "Apa yang ingin kamu lakukan?", options);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => router.push(`/edit-todo/${todo.id}` as any)}
      onLongPress={showOptions}
      className="flex-row items-start gap-3 p-4 rounded-2xl border shadow-sm mb-3"
      style={{
        backgroundColor: currentBgColor,
        borderColor: currentBorderColor,
        borderLeftWidth: 4,
        borderLeftColor: currentLeftBorderColor
      }}
    >
      <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onToggle(); }} className="mt-0.5 p-1 -ml-1 shrink-0">
        {todo.isCompleted ? (
            <CheckCircle2 color="#22c55e" size={20} />
        ) : (
            <Circle color={isOverdue ? "#ef4444" : (isToday ? primaryHex : mutedColor)} size={20} />
        )}
      </TouchableOpacity>

      <View className="flex-1 min-w-0 pr-1">
        <CustomText className="font-bold text-base mb-1.5" style={{ color: todo.isCompleted ? mutedColor : textColor, textDecorationLine: todo.isCompleted ? 'line-through' : 'none' }}>
          {isPinned && <Pin color={mutedColor} size={12} style={{ marginRight: 4 }} />}
          {todo.title || "Tanpa Judul"}
        </CustomText>

        <View className="flex-row items-center gap-2 flex-wrap">
          {todo.dueDate && (
            <View className="flex-row items-center gap-1.5 px-2 py-0.5 rounded-md" style={{ backgroundColor: todo.isCompleted ? '#22c55e15' : (isOverdue ? '#ef444415' : (isToday ? `${primaryHex}15` : isDark ? '#27272a' : '#f4f4f5')) }}>
              <Calendar color={todo.isCompleted ? '#22c55e' : (isOverdue ? '#ef4444' : (isToday ? primaryHex : mutedColor))} size={12} />
              <CustomText className="text-[10px] font-bold" style={{ color: todo.isCompleted ? '#22c55e' : (isOverdue ? '#ef4444' : (isToday ? primaryHex : mutedColor)) }}>
                {todo.dueDate} {todo.dueTime ? `• ${todo.dueTime}` : ''}
              </CustomText>
            </View>
          )}

          {todo.recurrence && todo.recurrence !== 'none' && (
            <View className="flex-row items-center gap-1.5 px-2 py-0.5 rounded-md" style={{ backgroundColor: '#a855f715' }}>
              <Repeat color="#a855f7" size={12} />
              <CustomText className="text-[10px] font-bold" style={{ color: '#a855f7' }}>
                {todo.recurrence === 'daily' ? 'Harian' : todo.recurrence === 'weekly' ? 'Mingguan' : 'Bulanan'}
              </CustomText>
            </View>
          )}
        </View>

        {hasSubTasks && (
          <View className="mt-3 pt-3 border-t border-border/50 space-y-2" style={{ borderColor: currentBorderColor }}>
            {todo.subTasks!.map(st => (
              <View key={st.id} className="flex-row items-start gap-2 text-sm" style={{ opacity: st.isCompleted ? 0.5 : 1 }}>
                <View className="mt-1 w-3 h-3 rounded-sm flex items-center justify-center border shrink-0" style={{ backgroundColor: st.isCompleted ? '#9333ea' : 'transparent', borderColor: st.isCompleted ? '#9333ea' : mutedColor }}>
                   {st.isCompleted && <Check color="#fff" size={8} />}
                </View>
                <CustomText className="flex-1 text-xs leading-tight" style={{ color: textColor, textDecorationLine: st.isCompleted ? 'line-through' : 'none' }}>
                  {st.text}
                </CustomText>
                {st.time && (
                  <View className="px-1.5 py-0.5 rounded bg-orange-500/10 shrink-0">
                    <CustomText className="text-[9px] font-bold text-orange-500">{st.time}</CustomText>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </View>

      <TouchableOpacity onPress={showOptions} className="p-1 -mr-2 -mt-1 rounded-full">
        <MoreVertical color={mutedColor} size={18} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}