import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, FolderTree, Lock, Save, Sparkles, Tag as TagIcon, Unlock, X } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Appearance, KeyboardAvoidingView, Modal, Platform, ScrollView, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CustomText } from '../components/ui/custom-text';
import { useSettings } from '../hooks/use-settings';
import { useAuth } from '../lib/auth-context';
import { addNote, getUserNotes } from '../lib/notes-service';

import { AiToolbar } from '../components/notes/ai-toolbar';
import { useNoteAi } from '../hooks/use-note-ai';
import { useNoteForm } from '../hooks/use-note-form';

// IMPORT KOMPONEN MODAL & UI KHUSUS
import { FlashcardModal } from '../components/flashcards/flashcard-modal';
import { ChatOverlay } from '../components/notes/chat-overlay';
import { MindMapViewer } from '../components/notes/mindmap-viewer';
import { MarkdownText } from '../components/ui/markdown-text';
import { RichTextEditor } from '../components/ui/rich-text-editor';

const accentColors: Record<string, string> = {
  default: '#9333ea', blue: '#3b82f6', emerald: '#10b981',
  amber: '#f59e0b', orange: '#f97316', rose: '#f43f5e', violet: '#8b5cf6',
};

export default function CreateNoteScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode: string }>();
  const insets = useSafeAreaInsets();
  
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark' || ((colorScheme as any) === 'system' && Appearance.getColorScheme() === 'dark');
  const cardBgColor = isDark ? '#18181b' : '#ffffff';
  const borderColor = isDark ? '#27272a' : '#e4e4e7';
  const textColor = isDark ? '#ffffff' : '#09090b';
  const mutedColor = isDark ? '#a1a1aa' : '#71717a';

  const { colorAccent } = useSettings();
  const primaryHex = accentColors[colorAccent] || accentColors.default;

  const [isSaving, setIsSaving] = useState(false);
  const [editorKey, setEditorKey] = useState(1);

  const {
    title, setTitle, content, setContent, tags, setTags, tagInput, setTagInput,
    isHidden, setIsHidden, parentId, setParentId, handleAddTag, removeTag
  } = useNoteForm();

  // --- FIX KEYBOARD TERTUTUP (INFINITE RELOAD WEBVIEW) ---
  const initialContentRef = useRef(content);
  useEffect(() => {
    // Hanya perbarui initial text (yang memicu reload) saat AI selesai bekerja (editorKey berubah)
    initialContentRef.current = content;
  }, [editorKey]);

  // --- STATE UNTUK PARENT NOTE (DROPDOWN INDUK) ---
  const [availableNotes, setAvailableNotes] = useState<{id: string, title: string}[]>([]);
  const [showParentModal, setShowParentModal] = useState(false);

  useEffect(() => {
    if (user) {
      // Tarik data catatan yang ada untuk dijadikan opsi induk
      getUserNotes(user.uid).then(notesData => {
        const formatted = notesData
          .filter((n: any) => !n.isTodo)
          .map((n: any) => ({ id: n.id, title: n.title || "Tanpa Judul" }));
        setAvailableNotes(formatted);
      }).catch(err => console.error(err));
    }
  }, [user]);

  // --- FORMAT TANGGAL SAAT INI ---
  const currentDateFormatted = useMemo(() => {
    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const now = new Date();
    return `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}, ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  }, []);

  const wordCount = useMemo(() => {
    const plainText = content.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ');
    return plainText.trim() === '' ? 0 : plainText.trim().split(/\s+/).filter(w => w.length > 0).length;
  }, [content]);

  // STATE UNTUK FITUR VISUAL AI
  const [mindMapHistory, setMindMapHistory] = useState<string[]>([]);
  const [showMindMap, setShowMindMap] = useState(false);
  const [flashcardsHistory, setFlashcardsHistory] = useState<any[][]>([]);
  const [showFlashcards, setShowFlashcards] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false); 

  const {
    isSummarizing, isGeneratingTags, isFormatting, isGeneratingMindMap, isGeneratingFlashcards,
    isScanning, isRecording, isAnalyzingVoice, 
    aiSummary, setAiSummary,
    handleAutoFormat, handleSummarize, handleGenerateTags, handleGenerateMindMap, handleGenerateFlashcards,
    handleImageUpload, handleVoiceRecord, 
    handleShowComingSoon
  } = useNoteAi({ 
    title, content, setContent, tags, setTags,
    mindMapHistory, setMindMapHistory, setShowMindMap,
    flashcardsHistory, setFlashcardsHistory, setShowFlashcards
  });

  useEffect(() => {
    if (!isFormatting && !isAnalyzingVoice) {
      setEditorKey(prev => prev + 1);
    }
  }, [isFormatting, isAnalyzingVoice]);

  useEffect(() => {
    if (mode) {
      setTimeout(() => {
        if (mode === 'camera') handleImageUpload('camera');
        else if (mode === 'gallery') handleImageUpload('gallery');
        else if (mode === 'voice') handleVoiceRecord();
      }, 400); 
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const handleSave = async () => {
    if (!user) return;
    
    const plainText = content.replace(/<[^>]+>/g, '').trim();
    if (!title.trim() && !plainText) {
      Alert.alert("Perhatian", "Catatan tidak boleh kosong!");
      return;
    }

    setIsSaving(true);
    try {
      const htmlContent = content;
      const serializedFlashcards = JSON.stringify(flashcardsHistory);

      await addNote({
        title: title || "Tanpa Judul",
        content: htmlContent,
        tags: tags,
        isTodo: false, 
        isHidden: isHidden,
        parentId: parentId, 
        mindmapCode: mindMapHistory,
        flashcards: serializedFlashcards as any, 
        userId: user.uid,
      } as any);
      
      router.push("/notes" as any);
    } catch (error) {
      console.error("Gagal menyimpan:", error);
      Alert.alert("Gagal", "Terjadi kesalahan saat menyimpan catatan.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return null;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      
      {/* HEADER */}
      <View className="px-4 py-3 flex-row items-center justify-between border-b border-border/50 bg-background/90 z-10">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-muted">
            <ArrowLeft color={textColor} size={24} />
          </TouchableOpacity>
        </View>

        <View className="flex-row items-center">
          {/* FIX UI: TOMBOL PRIVASI PINDAH KE HEADER (IKON SAJA) */}
          <TouchableOpacity 
            onPress={() => setIsHidden(!isHidden)} 
            className="p-2 rounded-full border transition-colors mr-2"
            style={{ 
              backgroundColor: isHidden ? '#a855f715' : 'transparent', 
              borderColor: isHidden ? '#a855f750' : 'transparent' 
            }}
          >
            {isHidden ? <Lock color="#a855f7" size={18} /> : <Unlock color={mutedColor} size={18} />}
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSave} disabled={isSaving} className="flex-row items-center px-4 py-2 rounded-full shadow-sm" style={{ backgroundColor: primaryHex }}>
            {isSaving ? <ActivityIndicator size="small" color="#fff" /> : <Save color="#fff" size={16} />}
            <CustomText className="text-white font-bold text-xs ml-2">Simpan</CustomText>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        
        {/* FIX UI: AREA BREADCRUMB PARENT NOTE (MIPIR NOTION) */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setShowParentModal(true)}
          className="flex-row items-center mb-1.5 self-start"
        >
          <FolderTree color={mutedColor} size={14} style={{ marginRight: 6 }} />
          <CustomText className="text-xs font-bold" style={{ color: parentId ? primaryHex : mutedColor }}>
            {parentId
              ? `${availableNotes.find(n => n.id === parentId)?.title || "Terpilih"} /`
              : "Catatan Utama /"}
          </CustomText>
        </TouchableOpacity>

        {/* INPUT JUDUL */}
        <TextInput
          placeholder="Judul Catatan..."
          placeholderTextColor={mutedColor}
          value={title}
          onChangeText={setTitle}
          className="text-3xl font-black mb-1"
          style={{ color: textColor }}
        />

        {/* INFO TANGGAL & JUMLAH KATA */}
        <CustomText className="text-xs font-medium mb-4" style={{ color: mutedColor }}>
          {currentDateFormatted}  •  {wordCount} kata
        </CustomText>

        {/* AREA TAGS */}
        <View className="flex-row flex-wrap items-center gap-2 mb-4">
          {tags.map((tag) => (
            <View key={tag} className="flex-row items-center px-2 py-1 rounded-md" style={{ backgroundColor: `${primaryHex}15` }}>
              <TagIcon color={primaryHex} size={10} style={{ marginRight: 4 }} />
              <CustomText className="text-[11px] font-bold" style={{ color: primaryHex }}>{tag}</CustomText>
              <TouchableOpacity onPress={() => removeTag(tag)} className="ml-1.5 p-0.5 rounded-full bg-primary/20">
                <X color={primaryHex} size={10} />
              </TouchableOpacity>
            </View>
          ))}
          <View className="flex-row items-center bg-muted/50 rounded-lg px-2">
            <TextInput
              placeholder="+ Tag baru"
              placeholderTextColor={mutedColor}
              value={tagInput}
              onChangeText={setTagInput}
              onSubmitEditing={handleAddTag}
              className="py-1.5 text-xs font-medium w-24"
              style={{ color: textColor }}
            />
          </View>
        </View>

        {/* TAMPILKAN LOADING BAR BESAR JIKA SEDANG SCANNING OCR */}
        {isScanning && (
          <View className="w-full bg-primary/10 border border-primary/20 p-4 rounded-2xl flex-row items-center my-4">
            <ActivityIndicator color={primaryHex} style={{ marginRight: 12 }} />
            <View className="flex-1">
               <CustomText className="font-bold text-primary">Membaca Gambar...</CustomText>
               <CustomText className="text-[10px] text-primary/80 mt-0.5">AI sedang mengekstrak teks dari fotomu.</CustomText>
            </View>
          </View>
        )}

        {/* AI TOOLBAR */}
        <AiToolbar 
          onOpenChat={() => setIsChatOpen(true)} 
          onAutoFormat={handleAutoFormat}
          onGenerateTags={handleGenerateTags}
          onSummarize={handleSummarize}
          onGenerateMindMap={handleGenerateMindMap}
          onGenerateFlashcards={handleGenerateFlashcards}
          
          onShowComingSoon={(action) => {
             if (action === 'Kamera OCR') handleImageUpload('camera');
             else if (action === 'Galeri OCR') handleImageUpload('gallery');
             else handleShowComingSoon(action);
          }}
          onVoiceRecord={handleVoiceRecord}
          onStopRecording={handleVoiceRecord} 
          isRecording={isRecording}
          isAnalyzingVoice={isAnalyzingVoice}

          isFormatting={isFormatting}
          isGeneratingTags={isGeneratingTags}
          isSummarizing={isSummarizing}
          isGeneratingMindMap={isGeneratingMindMap}
          isGeneratingFlashcards={isGeneratingFlashcards}
          isContentEmpty={wordCount === 0}
          isTitleAndContentEmpty={!title.trim() && wordCount === 0}
        />

        {/* HASIL RINGKASAN AI */}
        {aiSummary && (
          <View className="mt-4 p-4 rounded-2xl border" style={{ backgroundColor: '#a855f710', borderColor: '#a855f730' }}>
            <TouchableOpacity onPress={() => setAiSummary(null)} className="absolute top-2 right-2 p-1 z-10">
              <X color={mutedColor} size={16} />
            </TouchableOpacity>
            <View className="flex-row items-center gap-2 mb-2">
              <Sparkles color="#a855f7" size={16} />
              <CustomText className="font-bold text-xs uppercase tracking-wider" style={{ color: '#a855f7' }}>Ringkasan Cerdas AI</CustomText>
            </View>
            <MarkdownText className="text-sm leading-relaxed" style={{ color: textColor }}>
              {aiSummary}
            </MarkdownText>
          </View>
        )}

        {/* --- RICH TEXT EDITOR MURNI --- */}
        <View className="mt-6 mb-10 flex-1">
          <CustomText className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: mutedColor }}>
             Editor Catatan
          </CustomText>
          <RichTextEditor 
            key={`editor-${editorKey}`} 
            initialContent={initialContentRef.current} 
            onChange={(html) => setContent(html)} 
            placeholder="Mulai menulis idemu yang luar biasa di sini..." 
            minHeight={350}
          />
        </View>

      </ScrollView>

      {/* --- MODAL PILIH INDUK (DROPDOWN) --- */}
      <Modal visible={showParentModal} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/60">
          <View className="w-full max-h-[70%] rounded-t-[2rem] p-5 shadow-2xl" style={{ backgroundColor: cardBgColor, borderColor, borderTopWidth: 1 }}>
            <View className="flex-row justify-between items-center mb-4 pb-2 border-b" style={{ borderColor: `${borderColor}80` }}>
              <CustomText className="font-bold text-lg" style={{ color: textColor }}>Pilih Catatan Induk</CustomText>
              <TouchableOpacity onPress={() => setShowParentModal(false)} className="p-2 bg-muted rounded-full">
                <X color={textColor} size={20} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
              <TouchableOpacity
                onPress={() => { setParentId(null); setShowParentModal(false); }}
                className="p-4 border-b transition-colors rounded-xl mb-1"
                style={{ borderColor: `${borderColor}50`, backgroundColor: parentId === null ? `${primaryHex}15` : 'transparent' }}
              >
                <CustomText className="font-bold text-sm" style={{ color: parentId === null ? primaryHex : textColor }}>
                  Tidak ada (Catatan Utama)
                </CustomText>
              </TouchableOpacity>

              {availableNotes.map(n => (
                <TouchableOpacity
                  key={n.id}
                  onPress={() => { setParentId(n.id); setShowParentModal(false); }}
                  className="p-4 border-b transition-colors rounded-xl mb-1"
                  style={{ borderColor: `${borderColor}50`, backgroundColor: parentId === n.id ? `${primaryHex}15` : 'transparent' }}
                >
                  <CustomText className="font-bold text-sm" style={{ color: parentId === n.id ? primaryHex : textColor }}>
                    {n.title}
                  </CustomText>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MOUNTING MODAL VISUAL AI */}
      {showMindMap && mindMapHistory.length > 0 && (
        <MindMapViewer history={mindMapHistory} onClose={() => setShowMindMap(false)} />
      )}

      {showFlashcards && flashcardsHistory.length > 0 && (
        <FlashcardModal history={flashcardsHistory} onClose={() => setShowFlashcards(false)} />
      )}

      <ChatOverlay 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        noteTitle={title} 
        noteContent={content} 
      />

    </KeyboardAvoidingView>
  );
}