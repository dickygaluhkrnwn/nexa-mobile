import * as Haptics from 'expo-haptics';
import { usePathname, useRouter } from 'expo-router'; // <-- Import useRouter
import { Bot, Send, User, X } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Appearance, KeyboardAvoidingView, Modal, Platform, ScrollView, TextInput, TouchableOpacity, View } from 'react-native';
import { useGemini } from '../../hooks/use-gemini';
import { useSettings } from '../../hooks/use-settings';
import { useAuth } from '../../lib/auth-context';
import { getUserNotes, NoteData } from '../../lib/notes-service';
import { CustomText } from './custom-text';

interface Message {
  id: string;
  role: 'user' | 'ai';
  text: string;
}

const accentColors: Record<string, string> = {
  default: '#9333ea', blue: '#3b82f6', emerald: '#10b981',
  amber: '#f59e0b', orange: '#f97316', rose: '#f43f5e', violet: '#8b5cf6',
};

export function ChatWidget() {
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter(); // <-- Inisialisasi router
  const { callAI, isAiLoading } = useGemini();
  
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark' || ((colorScheme as any) === 'system' && Appearance.getColorScheme() === 'dark');
  const { colorAccent, fontStyle } = useSettings();
  const primaryHex = accentColors[colorAccent] || accentColors.default;

  const cardBgColor = isDark ? '#18181b' : '#ffffff';
  const borderColor = isDark ? '#27272a' : '#e4e4e7';
  const textColor = isDark ? '#ffffff' : '#09090b';
  const mutedColor = isDark ? '#a1a1aa' : '#71717a';

  const fontFamily = fontStyle === 'serif' ? 'serif' : fontStyle === 'mono' ? 'monospace' : 'sans-serif';

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'ai', text: 'Halo! Aku asisten Nexa. Aku bisa mencarikan informasi dari seluruh tumpukan catatanmu. Ada yang mau ditanyakan?' }
  ]);
  const [input, setInput] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);
  
  // State untuk menyimpan list metadata catatan agar bisa dicocokkan jadi link
  const [allNotes, setAllNotes] = useState<{id: string, title: string, isTodo: boolean}[]>([]);

  // Ambil list catatan saat modal chat dibuka
  useEffect(() => {
    if (isOpen && user) {
      getUserNotes(user.uid).then(data => {
        setAllNotes(data.map((n: any) => ({
          id: n.id,
          title: n.title || "Tanpa Judul",
          isTodo: !!n.isTodo
        })));
      }).catch(err => console.error(err));
    }
  }, [isOpen, user]);

  const hideOnRoutes = ['create', 'edit'];
  const shouldHide = hideOnRoutes.some(route => pathname?.includes(route));

  if (shouldHide || !user) return null;

  const handleSend = async () => {
    if (!input.trim() || isAiLoading) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const notesData = await getUserNotes(user.uid);
      const typedNotes = notesData as (NoteData & { id: string })[];
      
      // FIX: RAG Client-Side - Jangan filter isTodo, biarkan AI membaca tugas juga!
      const contextStr = typedNotes
        .filter(n => !n.isHidden) // Jangan ikut sertakan catatan di Brankas (untuk keamanan)
        .map(n => {
          // Beda perlakuan untuk Tugas vs Catatan Biasa
          if (n.isTodo) {
            const status = n.isCompleted ? "Selesai" : "Belum Selesai";
            const due = n.dueDate ? ` (Tenggat: ${n.dueDate})` : "";
            return `- [TUGAS] Judul: ${n.title || 'Tanpa Judul'} | Status: ${status}${due}\n  Rincian: ${n.content ? n.content.replace(/<[^>]+>/g, ' ').trim().substring(0, 100) : "Tidak ada rincian"}`;
          } else {
            const plain = n.content ? n.content.replace(/<[^>]+>/g, ' ').trim() : "";
            return `- [CATATAN] Judul: ${n.title || 'Tanpa Judul'}\n  Isi Singkat: ${plain.substring(0, 200)}...`;
          }
        }).join('\n\n');

      // FIX: Injeksi instruksi tegas agar AI membungkus judul dengan [[...]]
      const finalContext = contextStr 
        ? `Ini adalah ringkasan dari semua catatan dan tugas pengguna:\n${contextStr}\n\nINSTRUKSI KRUSIAL: Jika kamu menyebutkan judul catatan atau judul tugas sebagai sumber jawabanmu, WAJIB bungkus judul tersebut dengan kurung siku ganda persis seperti ini: [[Judul Catatannya]].` 
        : "Pengguna belum memiliki catatan atau tugas apa pun.";

      const response = await callAI({ action: 'chat', context: finalContext, prompt: userMsg.text });
      
      if (response) {
        const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'ai', text: response };
        setMessages(prev => [...prev, aiMsg]);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      const errorMsg: Message = { id: (Date.now() + 1).toString(), role: 'ai', text: 'Maaf, otak AI-ku sedang penuh atau terjadi kesalahan jaringan. Coba tanyakan lagi nanti ya.' };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  // --- CUSTOM PARSER (Bisa klik Link, Bold, Italic) ---
  const renderMessageContent = (text: string, role: 'user' | 'ai') => {
    // Pecah string berdasarkan format [[Link]], **Bold**, dan *Italic*
    const parts = text.split(/(\[\[.*?\]\]|\*\*.*?\*\*|\*.*?\*)/g);
    
    return (
      <CustomText className="text-sm leading-relaxed" style={{ color: role === 'user' ? '#ffffff' : textColor }}>
        {parts.map((part, index) => {
          // 1. Tangani Tautan Interaktif [[Catatan]]
          if (part.startsWith('[[') && part.endsWith(']]')) {
            const title = part.slice(2, -2);
            // Cari catatan yang judulnya cocok (Abaikan huruf besar/kecil)
            const note = allNotes.find(n => n.title.toLowerCase() === title.toLowerCase());
            
            if (note) {
              return (
                <CustomText 
                  key={index} 
                  style={{ color: isDark ? '#60a5fa' : '#2563eb', fontWeight: 'bold', textDecorationLine: 'underline' }}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setIsOpen(false); // Tutup modal chat
                    // Navigasi cerdas: Ke To-Do jika tugas, ke Notes jika catatan biasa
                    router.push(note.isTodo ? `/edit-todo/${note.id}` as any : `/edit/${note.id}` as any);
                  }}
                >
                  🔗 {title}
                </CustomText>
              );
            }
            // Jika catatan tidak ditemukan di database, render sebagai teks abu-abu miring
            return <CustomText key={index} style={{ fontStyle: 'italic', opacity: 0.6 }}>[{title}]</CustomText>;
          }
          
          // 2. Tangani Teks Tebal (Bold)
          if (part.startsWith('**') && part.endsWith('**')) {
            return <CustomText key={index} style={{ fontWeight: 'bold' }}>{part.slice(2, -2)}</CustomText>;
          }
          
          // 3. Tangani Teks Miring (Italic)
          if (part.startsWith('*') && part.endsWith('*')) {
            return <CustomText key={index} style={{ fontStyle: 'italic' }}>{part.slice(1, -1)}</CustomText>;
          }

          // 4. Teks Biasa
          return <CustomText key={index}>{part}</CustomText>;
        })}
      </CustomText>
    );
  };

  return (
    <>
      {/* FLOATING BUTTON (WIDGET) */}
      {!isOpen && (
        <View style={{ position: 'absolute', bottom: 90, right: 16, zIndex: 50 }}>
          <TouchableOpacity
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setIsOpen(true); }}
            activeOpacity={0.8}
            className="w-14 h-14 rounded-full flex items-center justify-center border-2 border-background/20"
            style={{ backgroundColor: primaryHex, shadowColor: primaryHex, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 10 }}
          >
            <Bot color="#ffffff" size={26} />
          </TouchableOpacity>
        </View>
      )}

      {/* CHAT MODAL */}
      <Modal visible={isOpen} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1 justify-end bg-black/60">
          
          <View className="h-[80%] rounded-t-[2rem] overflow-hidden" style={{ backgroundColor: cardBgColor, borderColor, borderTopWidth: 1 }}>
            
            {/* Header Chat */}
            <View className="px-5 py-4 border-b flex-row items-center justify-between" style={{ borderColor, backgroundColor: isDark ? '#18181b' : '#f4f4f5' }}>
              <View className="flex-row items-center gap-3">
                <View className="p-2 rounded-full" style={{ backgroundColor: `${primaryHex}20` }}>
                  <Bot color={primaryHex} size={20} />
                </View>
                <View>
                  <CustomText className="font-bold text-base" style={{ color: textColor }}>Asisten Nexa</CustomText>
                  <CustomText className="text-[11px]" style={{ color: mutedColor }}>Mencari info dari catatan & tugasmu</CustomText>
                </View>
              </View>
              <TouchableOpacity onPress={() => setIsOpen(false)} className="p-2 rounded-full" style={{ backgroundColor: isDark ? '#27272a' : '#e4e4e7' }}>
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
                      <Bot color={primaryHex} size={14} />
                    </View>
                  )}

                  <View 
                    className={`max-w-[75%] p-4 rounded-2xl ${msg.role === 'user' ? 'rounded-tr-sm' : 'rounded-tl-sm'}`}
                    style={{ backgroundColor: msg.role === 'user' ? primaryHex : (isDark ? '#27272a' : '#f4f4f5') }}
                  >
                    {/* Render Pesan Menggunakan Custom Parser Baru */}
                    {renderMessageContent(msg.text, msg.role)}
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
                    <Bot color={primaryHex} size={14} />
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
                placeholder="Tanya info catatan atau tugas..."
                placeholderTextColor={mutedColor}
                value={input}
                onChangeText={setInput}
                onSubmitEditing={handleSend}
                className="flex-1 h-12 px-4 rounded-2xl border text-sm font-medium"
                style={{ backgroundColor: isDark ? '#09090b' : '#ffffff', borderColor, color: textColor, fontFamily }}
              />
              <TouchableOpacity 
                onPress={handleSend} 
                disabled={!input.trim() || isAiLoading}
                className="w-12 h-12 rounded-2xl items-center justify-center shadow-md"
                style={{ backgroundColor: (!input.trim() || isAiLoading) ? (isDark ? '#27272a' : '#e4e4e7') : primaryHex }}
              >
                <Send color={(!input.trim() || isAiLoading) ? mutedColor : '#ffffff'} size={20} style={{ marginLeft: 2 }} />
              </TouchableOpacity>
            </View>

          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}