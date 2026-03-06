import * as Haptics from 'expo-haptics';
import { CheckCircle2, Circle, Clock, ListTodo, Pencil, Plus, X } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React, { useState } from "react";
import { Appearance, TextInput, TouchableOpacity, View } from "react-native";
import { SubTask } from "../../lib/notes-service";
import { CustomText } from "../ui/custom-text";

interface SubTaskListProps {
  subTasks: SubTask[];
  onChange: (subTasks: SubTask[]) => void;
}

export function SubTaskList({ subTasks, onChange }: SubTaskListProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark' || ((colorScheme as any) === 'system' && Appearance.getColorScheme() === 'dark');
  const cardBgColor = isDark ? '#18181b' : '#ffffff';
  const borderColor = isDark ? '#27272a' : '#e4e4e7';
  const textColor = isDark ? '#ffffff' : '#09090b';
  const mutedColor = isDark ? '#a1a1aa' : '#71717a';

  const [newSubTask, setNewSubTask] = useState("");
  const [newSubTaskTime, setNewSubTaskTime] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editTime, setEditTime] = useState("");

  const handleAdd = () => {
    if (!newSubTask.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newTask: SubTask = {
      id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
      text: newSubTask.trim(),
      time: newSubTaskTime || undefined,
      isCompleted: false
    };
    onChange([...subTasks, newTask]);
    setNewSubTask("");
    setNewSubTaskTime("");
  };

  const startEdit = (st: SubTask) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingId(st.id);
    setEditText(st.text);
    setEditTime(st.time || "");
  };

  const saveEdit = (id: string) => {
    if (!editText.trim()) {
      handleRemove(id);
      return;
    }
    onChange(subTasks.map(st => st.id === id ? { ...st, text: editText.trim(), time: editTime || undefined } : st));
    setEditingId(null);
  };

  const handleRemove = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onChange(subTasks.filter(st => st.id !== id));
  };

  const handleToggle = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(subTasks.map(st => st.id === id ? { ...st, isCompleted: !st.isCompleted } : st));
  };

  return (
    <View className="space-y-3 pt-2">
      <View className="flex-row items-center justify-between mb-2">
        <View className="flex-row items-center gap-2">
          <ListTodo color={mutedColor} size={20} />
          <CustomText className="font-semibold text-sm uppercase tracking-wider" style={{ color: mutedColor }}>Rincian & Jadwal</CustomText>
        </View>
        {subTasks.length > 0 && (
          <View className="bg-primary/10 px-2 py-0.5 rounded-md">
            <CustomText className="text-xs font-bold text-primary">
              {subTasks.filter(s => s.isCompleted).length} / {subTasks.length} Selesai
            </CustomText>
          </View>
        )}
      </View>
      
      <View className="flex-col gap-2">
        {subTasks.map((st) => (
          <View key={st.id} className="flex-row items-start gap-3 p-3 rounded-2xl border" style={{ backgroundColor: st.isCompleted ? (isDark ? '#27272a80' : '#f4f4f580') : cardBgColor, borderColor: st.isCompleted ? 'transparent' : borderColor, opacity: st.isCompleted ? 0.7 : 1 }}>
            <TouchableOpacity onPress={() => handleToggle(st.id)} className="mt-0.5 shrink-0">
              {st.isCompleted ? <CheckCircle2 color="#9333ea" size={20} /> : <Circle color={mutedColor} size={20} />}
            </TouchableOpacity>
            
            {editingId === st.id ? (
              <View className="flex-1 flex-col gap-2">
                <TextInput value={editText} onChangeText={setEditText} className="w-full bg-background border px-3 py-2 text-sm rounded-xl font-medium" style={{ borderColor: '#9333ea', color: textColor }} autoFocus />
                <View className="flex-row items-center gap-2">
                  <TextInput value={editTime} onChangeText={setEditTime} placeholder="Jam (08:00)" placeholderTextColor={mutedColor} className="bg-background border px-3 py-2 text-xs rounded-xl flex-1 font-medium" style={{ borderColor, color: textColor }} />
                  <TouchableOpacity onPress={() => saveEdit(st.id)} className="bg-primary px-4 py-2 rounded-xl">
                    <CustomText className="text-white font-bold text-xs">Simpan</CustomText>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View className="flex-1 pr-2">
                <CustomText className="text-sm font-medium leading-relaxed" style={{ color: st.isCompleted ? mutedColor : textColor, textDecorationLine: st.isCompleted ? 'line-through' : 'none' }}>{st.text}</CustomText>
                {st.time && (
                  <View className="flex-row items-center gap-1.5 mt-1.5 bg-orange-500/10 self-start px-2 py-0.5 rounded-md">
                    <Clock color="#f97316" size={12} />
                    <CustomText className="text-[10px] font-bold text-orange-500">{st.time}</CustomText>
                  </View>
                )}
              </View>
            )}
            
            {editingId !== st.id && (
              <View className="flex-row items-center gap-1 shrink-0">
                <TouchableOpacity onPress={() => startEdit(st)} className="p-1.5"><Pencil color={mutedColor} size={16} /></TouchableOpacity>
                <TouchableOpacity onPress={() => handleRemove(st.id)} className="p-1.5"><X color="#ef4444" size={16} /></TouchableOpacity>
              </View>
            )}
          </View>
        ))}
        
        {/* Form Tambah Sub-Tugas Baru */}
        <View className="flex-row items-center gap-2 mt-2 p-1.5 rounded-2xl border" style={{ backgroundColor: isDark ? '#27272a' : '#f4f4f5', borderColor: 'transparent' }}>
          <TextInput value={newSubTaskTime} onChangeText={setNewSubTaskTime} placeholder="Jam" placeholderTextColor={mutedColor} className="bg-background px-3 py-2.5 text-xs font-medium rounded-xl text-center shadow-sm w-16" style={{ color: textColor }} />
          <TextInput value={newSubTask} onChangeText={setNewSubTask} onSubmitEditing={handleAdd} placeholder="Ketik rincian tugas..." placeholderTextColor={mutedColor} className="flex-1 bg-transparent px-2 py-2.5 text-sm font-medium" style={{ color: textColor }} />
          <TouchableOpacity onPress={handleAdd} disabled={!newSubTask.trim()} className="h-10 w-10 rounded-xl items-center justify-center shadow-sm" style={{ backgroundColor: newSubTask.trim() ? '#9333ea' : mutedColor }}>
            <Plus color="#ffffff" size={20} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}