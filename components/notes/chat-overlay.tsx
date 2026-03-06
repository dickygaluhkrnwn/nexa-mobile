import * as Haptics from 'expo-haptics';
import { Send, Sparkles, User, X } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Appearance, KeyboardAvoidingView, Modal, Platform, ScrollView, TextInput, TouchableOpacity, View } from 'react-native';
import { useGemini } from '../../hooks/use-gemini';
import { useSettings } from '../../hooks/use-settings';
import { CustomText } from '../ui/custom-text';
import { MarkdownText } from '../ui/markdown-text'; // <-- IMPORT KOMPONEN BARU

interface ChatOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  noteTitle: string;
  noteContent: string;
}

interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
}

const accentColors: Record<string, string> = {
  default: '#9333ea', blue: '#3b82f6', emerald: '#10b981',
  amber: '#f59e0b', orange: '#f97316', rose: '#f43f5e', violet: '#8b5cf6',
};

export function ChatOverlay({ isOpen, onClose, noteTitle, noteContent }: ChatOverlayProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark' || ((colorScheme as any) === 'system' && Appearance.getColorScheme() === 'dark');
  const { colorAccent } = useSettings();
  const primaryHex = accentColors[colorAccent] || accentColors.default;

  const cardBgColor = isDark ? '#18181b' : '#ffffff';
  const borderColor = isDark ? '#27272a' : '#e4e4e7';
  const textColor = isDark ? '#ffffff' : '#09090b';
  const mutedColor = isDark ? '#a1a1aa' : '#71717a';

  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'ai', text: 'Halo! Ada yang ingin ditanyakan seputar catatan ini?' }
  ]);
  const [input, setInput] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);
  
  const { callAI, isAiLoading } = useGemini();

  useEffect(() => {
    if (isOpen && messages.length === 1 && !noteContent.trim() && !noteTitle.trim()) {
      setMessages([{ id: Date.now().toString(), role: 'ai', text: 'Catatanmu masih kosong. Tulis sesuatu dulu yuk, nanti kita bahas sama-sama!' }]);
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isAiLoading) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);

    const context = `Judul: ${noteTitle}\n\nIsi: ${noteContent}`;

    try {
      const response = await callAI({ action: 'chat', context, prompt: userMsg.text });
      if (response) {
        const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'ai', text: response };
        setMessages(prev => [...prev, aiMsg]);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      const errorMsg: Message = { id: (Date.now() + 1).toString(), role: 'ai', text: 'Maaf, terjadi kesalahan saat memproses pertanyaanmu. Coba lagi ya.' };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  return (
    <Modal visible={isOpen} transparent animationType="slide">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 justify-end bg-black/60">
        
        <View className="h-[80%] rounded-t-[2rem] overflow-hidden" style={{ backgroundColor: cardBgColor, borderColor, borderTopWidth: 1 }}>
          
          {/* Header Chat */}
          <View className="px-5 py-4 border-b flex-row items-center justify-between" style={{ borderColor, backgroundColor: isDark ? '#18181b' : '#f4f4f5' }}>
            <View className="flex-row items-center gap-3">
              <View className="p-2 rounded-full" style={{ backgroundColor: `${primaryHex}20` }}>
                <Sparkles color={primaryHex} size={20} />
              </View>
              <View>
                <CustomText className="font-bold text-base" style={{ color: textColor }}>Diskusi AI</CustomText>
                <CustomText className="text-[11px]" style={{ color: mutedColor }}>Berdasarkan konteks catatanmu</CustomText>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} className="p-2 rounded-full" style={{ backgroundColor: isDark ? '#27272a' : '#e4e4e7' }}>
              <X color={textColor} size={20} />
            </TouchableOpacity>
          </View>

          {/* Area Pesan Chat */}
          <ScrollView 
            ref={scrollViewRef}
            contentContainerStyle={{ padding: 16, gap: 16 }}
            className="flex-1"
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >
            {messages.map((msg) => (
              <View key={msg.id} className={`flex-row w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                
                {msg.role === 'ai' && (
                  <View className="w-8 h-8 rounded-full items-center justify-center mr-2 mt-1" style={{ backgroundColor: `${primaryHex}20` }}>
                    <Sparkles color={primaryHex} size={14} />
                  </View>
                )}

                <View 
                  className={`max-w-[75%] p-4 rounded-2xl ${msg.role === 'user' ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}
                  style={{ backgroundColor: msg.role === 'user' ? primaryHex : (isDark ? '#27272a' : '#f4f4f5') }}
                >
                  {/* FIX: MENGGUNAKAN MARKDOWN TEXT AGAR BOLD & ITALIC RENDER SEMPURNA */}
                  <MarkdownText className="text-sm leading-relaxed" style={{ color: msg.role === 'user' ? '#ffffff' : textColor }}>
                    {msg.text}
                  </MarkdownText>
                </View>

                {msg.role === 'user' && (
                  <View className="w-8 h-8 rounded-full items-center justify-center ml-2 mt-1" style={{ backgroundColor: isDark ? '#27272a' : '#e4e4e7' }}>
                    <User color={textColor} size={14} />
                  </View>
                )}
              </View>
            ))}
            
            {isAiLoading && (
              <View className="flex-row items-center justify-start">
                <View className="w-8 h-8 rounded-full items-center justify-center mr-2" style={{ backgroundColor: `${primaryHex}20` }}>
                  <Sparkles color={primaryHex} size={14} />
                </View>
                <View className="p-4 rounded-2xl rounded-tl-sm" style={{ backgroundColor: isDark ? '#27272a' : '#f4f4f5' }}>
                  <ActivityIndicator size="small" color={primaryHex} />
                </View>
              </View>
            )}
          </ScrollView>

          {/* Area Input Chat */}
          <View className="p-4 border-t flex-row items-center gap-3 pb-8" style={{ borderColor, backgroundColor: cardBgColor }}>
            <TextInput
              placeholder="Tanya sesuatu ke AI..."
              placeholderTextColor={mutedColor}
              value={input}
              onChangeText={setInput}
              onSubmitEditing={handleSend}
              className="flex-1 h-12 px-4 rounded-2xl border text-sm"
              style={{ backgroundColor: isDark ? '#09090b' : '#ffffff', borderColor, color: textColor }}
            />
            <TouchableOpacity 
              onPress={handleSend} 
              disabled={!input.trim() || isAiLoading}
              className="w-12 h-12 rounded-2xl items-center justify-center shadow-md"
              style={{ backgroundColor: (!input.trim() || isAiLoading) ? (isDark ? '#27272a' : '#e4e4e7') : primaryHex }}
            >
              <Send color={(!input.trim() || isAiLoading) ? mutedColor : '#ffffff'} size={20} />
            </TouchableOpacity>
          </View>

        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}