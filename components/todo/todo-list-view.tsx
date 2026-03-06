import { AlertCircle, CheckCircle2, Clock, ListTodo, Pin, Repeat } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React from 'react';
import { Appearance, TouchableOpacity, View } from 'react-native';
import { useSettings } from '../../hooks/use-settings';
import { CustomText } from '../ui/custom-text';
import { TaskItem } from './task-item';
import { TodoItem } from './types';

// Tambahkan mapping warna aksen
const accentColors: Record<string, string> = {
  default: '#9333ea', blue: '#3b82f6', emerald: '#10b981',
  amber: '#f59e0b', orange: '#f97316', rose: '#f43f5e', violet: '#8b5cf6',
};

interface TodoListViewProps {
  todos: TodoItem[];
  todayStr: string;
  onToggle: (todo: TodoItem) => void;
  onDelete: (id: string) => void;
  onTogglePin: (todo: TodoItem) => void;
}

export function TodoListView({ todos, todayStr, onToggle, onDelete, onTogglePin }: TodoListViewProps) {
  
  // Deteksi mode warna agar aman dari bug NativeWind
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark' || ((colorScheme as any) === 'system' && Appearance.getColorScheme() === 'dark');
  
  const borderColor = isDark ? '#27272a' : '#e4e4e7';
  const mutedColor = isDark ? '#a1a1aa' : '#71717a';

  // Ambil warna aksen pilihan user
  const { colorAccent } = useSettings();
  const primaryHex = accentColors[colorAccent] || accentColors.default;

  const completedTodos = todos.filter(t => t.isCompleted);
  const pendingTodos = todos.filter(t => !t.isCompleted);
  const pinnedTodos = pendingTodos.filter(t => t.isPinned); 
  const unpinnedPending = pendingTodos.filter(t => !t.isPinned);
  
  const isTaskOverdue = (t: TodoItem) => {
    if (!t.dueDate) return false;
    const now = new Date();
    let targetDateStr = t.dueDate;
    if (t.dueTime) targetDateStr += `T${t.dueTime}`;
    else targetDateStr += `T23:59:59`;
    return now > new Date(targetDateStr);
  };

  const overdue = unpinnedPending.filter(t => isTaskOverdue(t));
  const dueToday = unpinnedPending.filter(t => t.dueDate === todayStr && !isTaskOverdue(t));
  const upcomingAndNoDate = unpinnedPending.filter(t => !t.dueDate || t.dueDate > todayStr);

  return (
    <View className="space-y-6 pb-12">
      
      {/* DISEMATKAN */}
      {pinnedTodos.length > 0 && (
        <View className="mb-4">
          <View className="flex-row items-center gap-2 mb-3">
            <Pin color="#9333ea" size={16} />
            <CustomText className="text-sm font-bold" style={{ color: '#9333ea' }}>Disematkan ({pinnedTodos.length})</CustomText>
          </View>
          {pinnedTodos.map(todo => <TaskItem key={todo.id} todo={todo} onToggle={() => onToggle(todo)} onDelete={onDelete} onTogglePin={onTogglePin} isPinned />)}
        </View>
      )}

      {/* TIDAK SELESAI */}
      {overdue.length > 0 && (
        <View className="mb-4">
          <View className="flex-row items-center gap-2 mb-3">
            <AlertCircle color="#ef4444" size={16} />
            <CustomText className="text-sm font-bold text-red-500">Tidak Selesai ({overdue.length})</CustomText>
          </View>
          {overdue.map(todo => <TaskItem key={todo.id} todo={todo} onToggle={() => onToggle(todo)} onDelete={onDelete} onTogglePin={onTogglePin} isOverdue />)}
        </View>
      )}

      {/* HARI INI */}
      <View className="mb-4">
        <View className="flex-row items-center gap-2 mb-3">
          {/* FIX: Ikon dan Teks Hari Ini sekarang menggunakan primaryHex (Aksen dinamis) */}
          <Clock color={primaryHex} size={16} />
          <CustomText className="text-sm font-bold" style={{ color: primaryHex }}>Hari Ini ({dueToday.length})</CustomText>
        </View>
        {dueToday.length === 0 ? (
           <View className="border-2 border-dashed rounded-2xl p-4 items-center justify-center" style={{ borderColor: `${borderColor}80` }}>
              <CustomText className="text-xs font-medium" style={{ color: mutedColor }}>Tidak ada tugas hari ini.</CustomText>
           </View>
        ) : (
           dueToday.map(todo => <TaskItem key={todo.id} todo={todo} onToggle={() => onToggle(todo)} onDelete={onDelete} onTogglePin={onTogglePin} />)
        )}
      </View>

      {/* MENDATANG */}
      <View className="mb-4">
        <View className="flex-row items-center gap-2 mb-3">
          <ListTodo color={mutedColor} size={16} />
          <CustomText className="text-sm font-bold" style={{ color: mutedColor }}>Mendatang ({upcomingAndNoDate.length})</CustomText>
        </View>
        {upcomingAndNoDate.map(todo => <TaskItem key={todo.id} todo={todo} onToggle={() => onToggle(todo)} onDelete={onDelete} onTogglePin={onTogglePin} />)}
      </View>

      {/* SELESAI */}
      {completedTodos.length > 0 && (
        <View className="pt-4 border-t mt-4" style={{ borderColor: `${borderColor}80` }}>
          <View className="flex-row items-center gap-2 mb-3">
            <CheckCircle2 color="#22c55e" size={16} />
            <CustomText className="text-sm font-bold text-green-500">Selesai ({completedTodos.length})</CustomText>
          </View>
          {completedTodos.map(todo => (
            <TouchableOpacity 
              key={todo.id} 
              onPress={() => onToggle(todo)} 
              activeOpacity={0.7} 
              className="flex-row items-center gap-3 p-4 rounded-2xl mb-3 border shadow-sm"
              style={{ 
                backgroundColor: isDark ? '#22c55e15' : '#22c55e08',
                borderColor: isDark ? '#22c55e30' : '#22c55e40',
                borderLeftWidth: 4,
                borderLeftColor: '#22c55e'
              }}
            >
              <CheckCircle2 color="#22c55e" size={20} />
              <View className="flex-1">
                <CustomText className="font-bold text-sm" style={{ color: mutedColor, textDecorationLine: 'line-through' }} numberOfLines={1}>
                  {todo.title}
                </CustomText>
                {todo.recurrence && todo.recurrence !== 'none' && (
                  <View className="flex-row items-center gap-1 mt-1">
                    <Repeat color="#a855f7" size={10} />
                    <CustomText className="text-[10px] font-bold text-purple-500">Rutinitas Selesai</CustomText>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

    </View>
  );
}