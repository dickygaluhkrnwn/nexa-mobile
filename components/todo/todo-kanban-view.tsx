import { AlertCircle, CheckCircle2, Clock, ListTodo } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React from 'react';
import { Appearance, Dimensions, ScrollView, View } from 'react-native';
import { CustomText } from '../ui/custom-text';
import { TaskItem } from './task-item';
import { TodoItem } from './types';

interface TodoKanbanViewProps {
  todos: TodoItem[];
  todayStr: string;
  onToggle: (todo: TodoItem) => void;
  onDelete: (id: string) => void;
  onTogglePin: (todo: TodoItem) => void;
}

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = width * 0.85; // Lebar 85% dari layar agar kolom sebelahnya sedikit mengintip

export function TodoKanbanView({ todos, todayStr, onToggle, onDelete, onTogglePin }: TodoKanbanViewProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark' || ((colorScheme as any) === 'system' && Appearance.getColorScheme() === 'dark');
  
  const cardBgColor = isDark ? '#18181b' : '#ffffff';
  const borderColor = isDark ? '#27272a' : '#e4e4e7';
  const textColor = isDark ? '#ffffff' : '#09090b';
  const mutedColor = isDark ? '#a1a1aa' : '#71717a';

  const pendingTodos = todos.filter(t => !t.isCompleted);
  const completedTodos = todos.filter(t => t.isCompleted);
  
  const isTaskOverdue = (t: TodoItem) => {
    if (!t.dueDate) return false;
    const now = new Date();
    let targetDateStr = t.dueDate;
    if (t.dueTime) targetDateStr += `T${t.dueTime}`;
    else targetDateStr += `T23:59:59`;
    return now > new Date(targetDateStr);
  };

  const overdueTasks = pendingTodos.filter(t => isTaskOverdue(t));
  const todayTasks = pendingTodos.filter(t => t.dueDate === todayStr && !isTaskOverdue(t));
  const backlog = pendingTodos.filter(t => !t.dueDate || t.dueDate > todayStr);

  const KanbanColumn = ({ title, icon: Icon, tasks, colorHex, isOverdueCol }: any) => (
    <View style={{ width: COLUMN_WIDTH, marginRight: 16 }}>
      <View 
        className="rounded-[2rem] border p-4" 
        style={{ 
          backgroundColor: isDark ? '#27272a30' : '#f4f4f5', 
          borderColor: borderColor,
          height: 520 // Sedikit dilebarkan agar lebih nyaman dilihat
        }}
      >
        <View className="flex-row items-center justify-between mb-4 px-1">
          <View className="flex-row items-center gap-2">
            <Icon color={colorHex} size={20} />
            <CustomText className="font-bold text-base" style={{ color: textColor }}>{title}</CustomText>
          </View>
          <View className="px-2.5 py-0.5 rounded-full shadow-sm" style={{ backgroundColor: cardBgColor }}>
            <CustomText className="text-xs font-bold" style={{ color: textColor }}>{tasks.length}</CustomText>
          </View>
        </View>
        
        <ScrollView 
          showsVerticalScrollIndicator={false} 
          contentContainerStyle={{ paddingBottom: 20, flexGrow: 1 }}
          nestedScrollEnabled={true} // FIX: Ini adalah kunci agar scroll dalam scroll bisa bekerja di HP
        >
          {tasks.length === 0 ? (
            <View className="items-center justify-center py-10 border-2 border-dashed rounded-2xl" style={{ borderColor: `${mutedColor}50` }}>
              <CustomText className="text-sm font-medium" style={{ color: mutedColor }}>Tidak ada tugas</CustomText>
            </View>
          ) : (
            tasks.map((todo: TodoItem) => (
              <TaskItem 
                key={todo.id} 
                todo={todo} 
                onToggle={() => onToggle(todo)} 
                onDelete={onDelete} 
                onTogglePin={onTogglePin} 
                isOverdue={isOverdueCol} 
              />
            ))
          )}
        </ScrollView>
      </View>
    </View>
  );

  return (
    <View className="pb-12">
      <CustomText className="text-xs font-medium text-center mb-3" style={{ color: mutedColor }}>
        Geser ke kiri/kanan untuk melihat papan 👉
      </CustomText>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        snapToInterval={COLUMN_WIDTH + 16} // Snap pas di tengah kolom
        decelerationRate="fast"
      >
        <KanbanColumn title="Tidak Selesai" icon={AlertCircle} tasks={overdueTasks} colorHex="#ef4444" isOverdueCol={true} />
        <KanbanColumn title="Fokus Hari Ini" icon={Clock} tasks={todayTasks} colorHex="#f97316" />
        <KanbanColumn title="Akan Datang" icon={ListTodo} tasks={backlog} colorHex={mutedColor} />
        <KanbanColumn title="Selesai" icon={CheckCircle2} tasks={completedTodos} colorHex="#22c55e" />
      </ScrollView>
    </View>
  );
}