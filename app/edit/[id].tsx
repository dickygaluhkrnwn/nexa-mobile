import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Edit3, Eye, FolderTree, Lock, Save, Share2, Shield, Tag as TagIcon, Trash2, Unlock, UserPlus, X } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Appearance, KeyboardAvoidingView, Modal, Platform, ScrollView, Share, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CustomText } from '../../components/ui/custom-text';
import { useSettings } from '../../hooks/use-settings';
import { useAuth } from '../../lib/auth-context';
import { deleteNote, getNote, getUserNotes, updateNote } from '../../lib/notes-service';

import { AiToolbar } from '../../components/notes/ai-toolbar';
import { useNoteAi } from '../../hooks/use-note-ai';
import { useNoteForm } from '../../hooks/use-note-form';

import { FlashcardModal } from '../../components/flashcards/flashcard-modal';
import { ChatOverlay } from '../../components/notes/chat-overlay';
import { MindMapViewer } from '../../components/notes/mindmap-viewer';
import { RichTextEditor } from '../../components/ui/rich-text-editor';

const accentColors: Record<string, string> = {
  default: '#9333ea', blue: '#3b82f6', emerald: '#10b981',
  amber: '#f59e0b', orange: '#f97316', rose: '#f43f5e', violet: '#8b5cf6',
};

// Tipe data untuk kolaborator
interface Collaborator {
  email: string;
  role: 'viewer' | 'editor';
}

export default function EditNoteScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>(); 
  const insets = useSafeAreaInsets();
  
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark' || ((colorScheme as any) === 'system' && Appearance.getColorScheme() === 'dark');
  const cardBgColor = isDark ? '#18181b' : '#ffffff';
  const borderColor = isDark ? '#27272a' : '#e4e4e7';
  const textColor = isDark ? '#ffffff' : '#09090b';
  const mutedColor = isDark ? '#a1a1aa' : '#71717a';

  const { colorAccent } = useSettings();
  const primaryHex = accentColors[colorAccent] || accentColors.default;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [editorKey, setEditorKey] = useState(1);

  const {
    title, setTitle, content, setContent, tags, setTags, tagInput, setTagInput,
    isHidden, setIsHidden, parentId, setParentId, handleAddTag, removeTag
  } = useNoteForm();

  const initialContentRef = useRef("");
  
  // STATE UNTUK PARENT NOTE (DROPDOWN INDUK)
  const [availableNotes, setAvailableNotes] = useState<{id: string, title: string}[]>([]);
  const [showParentModal, setShowParentModal] = useState(false);

  // --- STATE KOLABORASI (MABAR CATATAN) ---
  const [noteOwnerId, setNoteOwnerId] = useState<string>("");
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [collabEmailInput, setCollabEmailInput] = useState("");
  const [collabRoleSelect, setCollabRoleSelect] = useState<'viewer'|'editor'>('viewer');

  // Menentukan hak akses pengguna saat ini
  const isOwner = user?.uid === noteOwnerId;
  const userCollabInfo = collaborators.find(c => c.email === user?.email);
  const canEdit = isOwner || userCollabInfo?.role === 'editor';
  const canView = isOwner || !!userCollabInfo || !isHidden;

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
      initialContentRef.current = content; 
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFormatting, isAnalyzingVoice]);

  useEffect(() => {
    const fetchNote = async () => {
      if (!user || !id) return;
      const validId = Array.isArray(id) ? id[0] : id;

      try {
        const noteData = await getNote(validId);
        
        if (noteData) {
          // CEK HAK AKSES
          const owner = noteData.userId;
          const collabs = noteData.collaborators || [];
          const currentUserCollab = collabs.find((c: any) => c.email === user.email);
          
          if (owner === user.uid || currentUserCollab || !noteData.isHidden) {
            // --- JIKA DIIZINKAN ---
            setNoteOwnerId(owner);
            setCollaborators(collabs);

            setTitle(noteData.title);
            setContent(noteData.content || "");
            initialContentRef.current = noteData.content || "";
            setTags(noteData.tags || []);
            setIsHidden(noteData.isHidden || false);
            setParentId((noteData as any).parentId || null);

            const existingMindMap = (noteData as any).mindmapCode;
            if (Array.isArray(existingMindMap)) setMindMapHistory(existingMindMap);
            else if (typeof existingMindMap === 'string') setMindMapHistory([existingMindMap]);
            
            const existingFlashcards = (noteData as any).flashcards;
            if (existingFlashcards) {
              try {
                if (typeof existingFlashcards === 'string') setFlashcardsHistory(JSON.parse(existingFlashcards));
                else if (Array.isArray(existingFlashcards)) setFlashcardsHistory(existingFlashcards);
              } catch (e) { setFlashcardsHistory([]); }
            }
          } else {
            // --- JIKA TIDAK DIIZINKAN ---
            Alert.alert("Akses Ditolak", "Ini adalah Brankas Pribadi milik orang lain. Kamu tidak punya akses.");
            router.replace("/notes");
          }
        } else {
          Alert.alert("Tidak Ditemukan", "Catatan tidak ditemukan.");
          router.replace("/notes");
        }
      } catch (error) {
        Alert.alert("Gagal", "Terjadi kesalahan saat memuat catatan.");
        router.replace("/notes");
      } finally {
        setIsLoading(false);
      }
    };

    fetchNote();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, id]);

  // --- AMBIL DATA CATATAN LAIN UNTUK PILIHAN INDUK ---
  useEffect(() => {
    if (user && id && isOwner) {
      const validId = Array.isArray(id) ? id[0] : id;
      getUserNotes(user.uid).then(notesData => {
        const formatted = notesData
          .filter((n: any) => !n.isTodo && n.id !== validId)
          .map((n: any) => ({ id: n.id, title: n.title || "Tanpa Judul" }));
        setAvailableNotes(formatted);
      }).catch(err => console.error(err));
    }
  }, [user, id, isOwner]);

  const handleUpdate = async () => {
    if (!user || !canEdit) return;
    
    const plainText = content.replace(/<[^>]+>/g, '').trim();
    if (!title.trim() && !plainText) {
      Alert.alert("Perhatian", "Catatan tidak boleh kosong!");
      return;
    }

    setIsSaving(true);
    try {
      const validId = Array.isArray(id) ? id[0] : id;
      await updateNote(validId, {
        title: title || "Tanpa Judul",
        content: content,
        tags: tags,
        isHidden: isHidden,
        parentId: parentId, 
        mindmapCode: mindMapHistory,
        flashcards: JSON.stringify(flashcardsHistory), 
        collaborators: collaborators 
      } as any);
      
      router.push("/notes" as any);
    } catch (error) {
      Alert.alert("Gagal", "Terjadi kesalahan saat menyimpan perubahan.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (!isOwner) return Alert.alert("Akses Ditolak", "Hanya pemilik catatan yang bisa menghapusnya.");
    Alert.alert(
      "Hapus Catatan?", "Apakah kamu yakin ingin menghapus catatan ini selamanya?", 
      [ { text: "Batal", style: "cancel" }, { text: "Hapus", style: "destructive", onPress: async () => {
            const validId = Array.isArray(id) ? id[0] : id;
            await deleteNote(validId);
            router.replace("/notes");
      }}]
    );
  };

  // --- LOGIKA MENAMBAH KOLABORATOR ---
  const handleAddCollaborator = () => {
    if (!collabEmailInput.trim() || !collabEmailInput.includes('@')) {
      return Alert.alert("Email Tidak Valid", "Masukkan alamat email yang benar.");
    }
    if (collabEmailInput.toLowerCase() === user?.email?.toLowerCase()) {
      return Alert.alert("Gagal", "Kamu tidak bisa menambahkan dirimu sendiri.");
    }
    if (collaborators.some(c => c.email.toLowerCase() === collabEmailInput.toLowerCase())) {
      return Alert.alert("Sudah Ada", "Email ini sudah ada di daftar akses.");
    }

    const newCollaborators = [...collaborators, { email: collabEmailInput.toLowerCase(), role: collabRoleSelect }];
    setCollaborators(newCollaborators);
    setCollabEmailInput("");
    
    const validId = Array.isArray(id) ? id[0] : id;
    updateNote(validId, { collaborators: newCollaborators } as any);
  };

  const handleRemoveCollaborator = (email: string) => {
    const newCollaborators = collaborators.filter(c => c.email !== email);
    setCollaborators(newCollaborators);
    const validId = Array.isArray(id) ? id[0] : id;
    updateNote(validId, { collaborators: newCollaborators } as any);
  };

  const handleShareNative = async () => {
    const validId = Array.isArray(id) ? id[0] : id;
    const url = `https://nexa-app.vercel.app/p/${validId}`;
    try {
      await Share.share({ message: `Ayo berkolaborasi di catatanku:\n${title}\n${url}`, url: url });
    } catch (error: any) { Alert.alert("Gagal Membagikan", error.message); }
  };

  const currentDateFormatted = useMemo(() => {
    const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const now = new Date();
    return `${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}, ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  }, []);

  const wordCount = useMemo(() => {
    const plainText = content.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ');
    return plainText.trim() === '' ? 0 : plainText.trim().split(/\s+/).filter(w => w.length > 0).length;
  }, [content]);

  if (!user || !canView) return null;
  
  if (isLoading) {
    return <View className="flex-1 bg-background justify-center items-center"><ActivityIndicator size="large" color={primaryHex} /></View>;
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      
      {/* HEADER */}
      <View className="px-4 py-3 flex-row items-center justify-between border-b border-border/50 bg-background/90 z-10">
        <View className="flex-row items-center gap-2">
          <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2 rounded-full hover:bg-muted">
            <ArrowLeft color={textColor} size={24} />
          </TouchableOpacity>
          {!isOwner && (
            <View className="px-2 py-1 rounded-md ml-1" style={{ backgroundColor: `${primaryHex}15` }}>
              <CustomText className="text-[10px] font-bold" style={{ color: primaryHex }}>
                {canEdit ? 'Akses Editor' : 'Hanya Lihat'}
              </CustomText>
            </View>
          )}
        </View>

        <View className="flex-row items-center gap-2">
          {/* Tombol Modal Mabar */}
          {isOwner && (
            <TouchableOpacity onPress={() => setShowShareModal(true)} className="p-2 rounded-full bg-blue-500/10 border border-blue-500/20">
              <UserPlus color="#3b82f6" size={18} />
            </TouchableOpacity>
          )}
          
          {isOwner && (
            <TouchableOpacity onPress={handleDelete} className="p-2 rounded-full bg-red-500/10 border border-red-500/20 mr-2">
              <Trash2 color="#ef4444" size={18} />
            </TouchableOpacity>
          )}

          {canEdit && (
            <TouchableOpacity onPress={handleUpdate} disabled={isSaving} className="flex-row items-center px-4 py-2 rounded-full shadow-sm" style={{ backgroundColor: primaryHex }}>
              {isSaving ? <ActivityIndicator size="small" color="#fff" /> : <Save color="#fff" size={16} />}
              <CustomText className="text-white font-bold text-xs ml-2">Simpan</CustomText>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled={true}
      >
        
        {/* INPUT JUDUL */}
        <TextInput
          placeholder="Judul Catatan..."
          placeholderTextColor={mutedColor}
          value={title}
          onChangeText={setTitle}
          editable={canEdit}
          className="text-3xl font-black mb-1"
          style={{ color: textColor }}
        />

        <CustomText className="text-xs font-medium mb-4" style={{ color: mutedColor }}>
          Terakhir diedit: {currentDateFormatted}  •  {wordCount} kata
        </CustomText>

        {/* AREA TAGS */}
        <View className="flex-row flex-wrap items-center gap-2 mb-4">
          {tags.map((tag) => (
            <View key={tag} className="flex-row items-center px-2 py-1 rounded-md" style={{ backgroundColor: `${primaryHex}15` }}>
              <TagIcon color={primaryHex} size={10} style={{ marginRight: 4 }} />
              <CustomText className="text-[11px] font-bold" style={{ color: primaryHex }}>{tag}</CustomText>
              {canEdit && (
                <TouchableOpacity onPress={() => removeTag(tag)} className="ml-1.5 p-0.5 rounded-full bg-primary/20">
                  <X color={primaryHex} size={10} />
                </TouchableOpacity>
              )}
            </View>
          ))}
          {canEdit && (
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
          )}
        </View>

        {/* --- AREA PILIH INDUK (PARENT NOTE) RESTORED! --- */}
        {canEdit && (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setShowParentModal(true)}
            className="flex-row items-center px-3 py-2.5 rounded-xl border mb-4 self-start shadow-sm"
            style={{ backgroundColor: isDark ? '#27272a50' : '#f4f4f5', borderColor: borderColor }}
          >
            <FolderTree color={mutedColor} size={16} />
            <CustomText className="text-xs font-bold ml-2" style={{ color: parentId ? textColor : mutedColor }}>
              {parentId
                ? `Induk: ${availableNotes.find(n => n.id === parentId)?.title || "Terpilih"}`
                : "Catatan Utama (Bukan Sub-Catatan)"}
            </CustomText>
          </TouchableOpacity>
        )}

        {/* TOMBOL PRIVASI (HANYA OWNER) */}
        {isOwner && (
          <View className="flex-row mt-2 mb-2">
            <TouchableOpacity 
              onPress={() => setIsHidden(!isHidden)} 
              activeOpacity={0.7}
              className="flex-row items-center px-3 py-2 rounded-xl border transition-colors"
              style={{ backgroundColor: isHidden ? '#a855f715' : cardBgColor, borderColor: isHidden ? '#a855f750' : borderColor }}
            >
              {isHidden ? <Lock color="#a855f7" size={14} style={{ marginRight: 6 }} /> : <Unlock color={mutedColor} size={14} style={{ marginRight: 6 }} />}
              <CustomText className="text-xs font-bold" style={{ color: isHidden ? '#a855f7' : mutedColor }}>
                {isHidden ? "Terkunci di Brankas" : "Catatan Publik"}
              </CustomText>
            </TouchableOpacity>
          </View>
        )}

        {/* AI TOOLBAR (HANYA BISA DIAKSES JIKA PUNYA HAK EDIT) */}
        {canEdit && (
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
        )}

        {/* --- RICH TEXT EDITOR --- */}
        <View className="mt-6 mb-10 flex-1 min-h-[400px] relative">
          <CustomText className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: mutedColor }}>
             {canEdit ? "Editor Catatan" : "Mode Pratinjau (Read-Only)"}
          </CustomText>
          
          <RichTextEditor 
            key={`editor-${editorKey}`} 
            initialContent={initialContentRef.current} 
            onChange={(html) => { if(canEdit) setContent(html); }} 
            placeholder={canEdit ? "Mulai menulis idemu yang luar biasa di sini..." : "Catatan kosong..."} 
            minHeight={400}
          />
          
          {/* Overlay Pencegah Ketik (Viewer Only) */}
          {!canEdit && (
            <View className="absolute inset-0 z-50 pt-[55px]" style={{ backgroundColor: 'transparent' }} />
          )}
        </View>

      </ScrollView>

      {/* --- MODAL PILIH INDUK (DROPDOWN) --- */}
      {canEdit && (
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
      )}

      {/* --- MODAL GOOGLE DOCS STYLE SHARE --- */}
      {isOwner && (
        <Modal visible={showShareModal} transparent animationType="slide">
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 justify-end bg-black/60">
            <View className="w-full max-h-[85%] rounded-t-[2rem] p-5 shadow-2xl" style={{ backgroundColor: cardBgColor, borderColor, borderTopWidth: 1 }}>
              <View className="flex-row justify-between items-center mb-6 pb-4 border-b" style={{ borderColor: `${borderColor}80` }}>
                <View>
                  <CustomText className="font-bold text-xl" style={{ color: textColor }}>Bagikan Akses</CustomText>
                  <CustomText className="text-xs mt-1" style={{ color: mutedColor }}>Kolaborasi catatan antar akun Nexa</CustomText>
                </View>
                <TouchableOpacity onPress={() => setShowShareModal(false)} className="p-2 bg-muted rounded-full">
                  <X color={textColor} size={20} />
                </TouchableOpacity>
              </View>

              {/* Input Tambah Teman */}
              <View className="flex-row gap-2 mb-6">
                <TextInput
                  placeholder="Masukkan email teman..."
                  placeholderTextColor={mutedColor}
                  value={collabEmailInput}
                  onChangeText={setCollabEmailInput}
                  autoCapitalize="none"
                  className="flex-1 px-4 py-3 rounded-xl border text-sm font-medium"
                  style={{ backgroundColor: isDark ? '#27272a50' : '#f4f4f5', borderColor, color: textColor }}
                />
                <TouchableOpacity 
                  activeOpacity={0.7} 
                  onPress={() => setCollabRoleSelect(collabRoleSelect === 'viewer' ? 'editor' : 'viewer')}
                  className="px-3 rounded-xl border items-center justify-center bg-muted"
                  style={{ borderColor }}
                >
                  <CustomText className="text-xs font-bold" style={{ color: textColor }}>
                    {collabRoleSelect === 'editor' ? '📝 Edit' : '👁️ Lihat'}
                  </CustomText>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={handleAddCollaborator}
                  className="px-4 rounded-xl items-center justify-center shadow-sm"
                  style={{ backgroundColor: primaryHex }}
                >
                  <UserPlus color="#fff" size={18} />
                </TouchableOpacity>
              </View>

              <CustomText className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: mutedColor }}>Orang yang memiliki akses</CustomText>

              {/* Daftar Akses */}
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                {/* Owner Info */}
                <View className="flex-row items-center justify-between p-3 rounded-xl border mb-2" style={{ backgroundColor: `${primaryHex}10`, borderColor: `${primaryHex}30` }}>
                  <View className="flex-row items-center gap-3">
                    <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: primaryHex }}>
                       <Shield color="#fff" size={18} />
                    </View>
                    <View>
                      <CustomText className="font-bold text-sm" style={{ color: textColor }}>Kamu (Pemilik)</CustomText>
                      <CustomText className="text-xs" style={{ color: mutedColor }}>{user.email}</CustomText>
                    </View>
                  </View>
                </View>

                {/* Collaborators Info */}
                {collaborators.map((c, idx) => (
                  <View key={idx} className="flex-row items-center justify-between p-3 rounded-xl border mb-2" style={{ backgroundColor: isDark ? '#27272a30' : '#ffffff', borderColor }}>
                    <View className="flex-row items-center gap-3">
                      <View className="w-10 h-10 rounded-full items-center justify-center bg-muted">
                         <CustomText className="font-bold uppercase text-lg" style={{ color: textColor }}>{c.email.charAt(0)}</CustomText>
                      </View>
                      <View>
                        <CustomText className="font-bold text-sm" style={{ color: textColor }}>{c.email}</CustomText>
                        <View className="flex-row items-center mt-0.5">
                          {c.role === 'editor' ? <Edit3 color="#3b82f6" size={10} /> : <Eye color="#10b981" size={10} />}
                          <CustomText className="text-[10px] ml-1" style={{ color: c.role === 'editor' ? '#3b82f6' : '#10b981' }}>
                            {c.role === 'editor' ? 'Editor' : 'Viewer'}
                          </CustomText>
                        </View>
                      </View>
                    </View>
                    <TouchableOpacity onPress={() => handleRemoveCollaborator(c.email)} className="p-2">
                       <X color="#ef4444" size={16} />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>

              <TouchableOpacity onPress={handleShareNative} className="w-full mt-2 py-3.5 rounded-xl border flex-row items-center justify-center gap-2" style={{ borderColor }}>
                 <Share2 color={textColor} size={18} />
                 <CustomText className="font-bold" style={{ color: textColor }}>Salin Link Catatan</CustomText>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      )}

      {/* MODAL LAINNYA */}
      {showMindMap && mindMapHistory.length > 0 && <MindMapViewer history={mindMapHistory} onClose={() => setShowMindMap(false)} />}
      {showFlashcards && flashcardsHistory.length > 0 && <FlashcardModal history={flashcardsHistory} onClose={() => setShowFlashcards(false)} />}
      <ChatOverlay isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} noteTitle={title} noteContent={content} />

    </KeyboardAvoidingView>
  );
}