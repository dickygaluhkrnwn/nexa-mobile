import * as Haptics from 'expo-haptics';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React from 'react';
import { Appearance, TouchableOpacity, View } from 'react-native';
import { CustomText } from '../ui/custom-text';
import { TaskItem } from './task-item';
import { TodoItem } from './types';

const getLocalIsoDate = (d: Date) => {
  const offset = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - offset).toISOString().split('T')[0];
};

interface TodoCalendarViewProps {
  todos: TodoItem[];
  todayStr: string;
  currentMonth: Date;
  setCurrentMonth: (date: Date) => void;
  selectedDate: Date;
  setSelectedDate: (date: Date) => void;
  onToggle: (todo: TodoItem) => void;
  onDelete: (id: string) => void;
  onTogglePin: (todo: TodoItem) => void;
}

export function TodoCalendarView({ 
  todos, todayStr, 
  currentMonth, setCurrentMonth, 
  selectedDate, setSelectedDate, 
  onToggle, onDelete, onTogglePin 
}: TodoCalendarViewProps) {
  
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark' || ((colorScheme as any) === 'system' && Appearance.getColorScheme() === 'dark');
  
  const cardBgColor = isDark ? '#18181b' : '#ffffff';
  const borderColor = isDark ? '#27272a' : '#e4e4e7';
  const textColor = isDark ? '#ffffff' : '#09090b';
  const mutedColor = isDark ? '#a1a1aa' : '#71717a';

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();
  
  const days = [];
  for (let i = 0; i < firstDayIndex; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));

  const selectedDateStr = getLocalIsoDate(selectedDate);
  const tasksForSelectedDate = todos.filter(t => t.dueDate === selectedDateStr);

  const isTaskOverdue = (t: TodoItem) => {
    if (!t.dueDate) return false;
    const now = new Date();
    let targetDateStr = t.dueDate;
    if (t.dueTime) targetDateStr += `T${t.dueTime}`;
    else targetDateStr += `T23:59:59`;
    return now > new Date(targetDateStr);
  };

  return (
    <View className="space-y-6 pb-12">
      {/* Header Kalender */}
      <View className="flex-row items-center justify-between p-4 rounded-2xl border shadow-sm mb-4" style={{ backgroundColor: cardBgColor, borderColor }}>
        <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setCurrentMonth(new Date(year, month - 1, 1)); }} className="p-2 rounded-full hover:bg-muted">
          <ChevronLeft color={textColor} size={20} />
        </TouchableOpacity>
        <CustomText className="font-bold text-lg" style={{ color: textColor }}>
          {currentMonth.toLocaleString('id-ID', { month: 'long', year: 'numeric' })}
        </CustomText>
        <TouchableOpacity onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setCurrentMonth(new Date(year, month + 1, 1)); }} className="p-2 rounded-full hover:bg-muted">
          <ChevronRight color={textColor} size={20} />
        </TouchableOpacity>
      </View>

      {/* Grid Kalender */}
      <View className="p-4 rounded-2xl border shadow-sm mb-6" style={{ backgroundColor: cardBgColor, borderColor }}>
        <View className="flex-row justify-between mb-3">
          {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map((d, i) => (
             <CustomText key={i} className="flex-1 text-center text-xs font-bold" style={{ color: mutedColor }}>{d}</CustomText>
          ))}
        </View>
        <View className="flex-row flex-wrap justify-between">
          {days.map((date, idx) => {
            if (!date) return <View key={`empty-${idx}`} style={{ width: '14.28%', height: 48 }} />;
            
            const dateStr = getLocalIsoDate(date);
            const isSelected = dateStr === selectedDateStr;
            const isToday = dateStr === todayStr;
            
            const dayTasks = todos.filter(t => t.dueDate === dateStr);
            const pendingTasks = dayTasks.filter(t => !t.isCompleted);
            
            const overdueCount = pendingTasks.filter(t => isTaskOverdue(t)).length;
            const normalPendingCount = pendingTasks.length - overdueCount;

            return (
              <TouchableOpacity
                key={dateStr}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelectedDate(date); }}
                style={{ 
                  width: '14.28%', height: 48, 
                  backgroundColor: isSelected ? '#9333ea' : (isToday ? '#9333ea15' : 'transparent'),
                  borderRadius: 12,
                  alignItems: 'center', justifyContent: 'center'
                }}
              >
                <CustomText style={{ 
                  fontWeight: isSelected || isToday ? 'bold' : 'normal',
                  color: isSelected ? '#ffffff' : (isToday ? '#9333ea' : textColor) 
                }}>
                  {date.getDate()}
                </CustomText>
                
                {/* Rendering Titik Indikator Tugas */}
                {pendingTasks.length > 0 && (
                  <View className="flex-row gap-0.5 mt-1">
                    {Array.from({ length: Math.min(overdueCount, 3) }).map((_, i) => (
                      <View key={`overdue-${i}`} className="w-1 h-1 rounded-full" style={{ backgroundColor: isSelected ? '#fff' : '#ef4444' }} />
                    ))}
                    {Array.from({ length: Math.min(normalPendingCount, 3 - Math.min(overdueCount, 3)) }).map((_, i) => (
                      <View key={`normal-${i}`} className="w-1 h-1 rounded-full" style={{ backgroundColor: isSelected ? '#fff' : '#f97316' }} />
                    ))}
                    {pendingTasks.length > 3 && <View className="w-1 h-1 rounded-full" style={{ backgroundColor: isSelected ? '#fff' : mutedColor }} />}
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* List Tugas Harian */}
      <View>
        <CustomText className="font-bold text-sm uppercase tracking-wider mb-4" style={{ color: mutedColor }}>
          Tugas tgl {selectedDate.getDate()} {selectedDate.toLocaleString('id-ID', { month: 'short' })}
        </CustomText>
        {tasksForSelectedDate.length === 0 ? (
          <View className="items-center justify-center py-8 border border-dashed rounded-2xl" style={{ borderColor }}>
             <CustomText className="text-sm font-medium" style={{ color: mutedColor }}>Tidak ada tugas di hari ini.</CustomText>
          </View>
        ) : (
          tasksForSelectedDate.map(todo => (
            <TaskItem 
              key={todo.id} 
              todo={todo} 
              onToggle={() => onToggle(todo)} 
              onDelete={() => onDelete(todo.id)} 
              onTogglePin={onTogglePin}
              isOverdue={!todo.isCompleted && isTaskOverdue(todo)}
            />
          ))
        )}
      </View>
    </View>
  );
}