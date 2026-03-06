import * as Haptics from 'expo-haptics';
import { useFocusEffect, useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { LockKeyhole, Pin, Trash2, Users, X } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, Appearance, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSettings } from "../../hooks/use-settings";
import { useAuth } from "../../lib/auth-context";
import { db } from "../../lib/firebase";
import { deleteNote, getNote, getUserNotes, NoteData, updateNote } from "../../lib/notes-service";

import { Header, useHeaderAnimation } from '../../components/Header';
import { NoteCard } from '../../components/notes/note-card';
import { NotesActions } from '../../components/notes/notes-actions';
import { NotesHero } from '../../components/notes/notes-hero';
import { SearchFilterBar } from '../../components/notes/search-filter-bar';

import { FlashcardModal } from '../../components/flashcards/flashcard-modal';
import { MindMapViewer } from '../../components/notes/mindmap-viewer';
import { useGemini } from '../../hooks/use-gemini';

type ExtNoteData = NoteData & { id: string; isHidden?: boolean; isPinned?: boolean; parentId?: string | null };
type TreeNodeData = ExtNoteData & { depth: number; hasChildren: boolean };

const accentColors: Record<string, string> = {
  default: '#9333ea', blue: '#3b82f6', emerald: '#10b981',
  amber: '#f59e0b', orange: '#f97316', rose: '#f43f5e', violet: '#8b5cf6',
};

export default function NotesScreen() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { callAI } = useGemini();
  
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark' || ((colorScheme as any) === 'system' && Appearance.getColorScheme() === 'dark');
  const cardBgColor = isDark ? '#18181b' : '#ffffff';
  const borderColor = isDark ? '#27272a' : '#e4e4e7';
  const textColor = isDark ? '#ffffff' : '#09090b';
  const mutedColor = isDark ? '#a1a1aa' : '#71717a';

  const { colorAccent, fontStyle } = useSettings();
  const primaryHex = accentColors[colorAccent] || accentColors.default;
  const fontFamily = fontStyle === 'serif' ? 'serif' : fontStyle === 'mono' ? 'monospace' : 'sans-serif';

  const { headerTranslateY, handleScroll } = useHeaderAnimation();

  const [notes, setNotes] = useState<ExtNoteData[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "az" | "za">("newest");
  
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  const [isVaultOpen, setIsVaultOpen] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [showPinModal, setShowPinModal] = useState(false);
  const [correctPin, setCorrectPin] = useState<string | null>(null);

  const [activeNoteOptions, setActiveNoteOptions] = useState<ExtNoteData | null>(null);

  const [selectNoteMode, setSelectNoteMode] = useState<'flashcard' | 'mindmap' | null>(null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [flashcardsData, setFlashcardsData] = useState<any[][]>([]);
  const [mindMapData, setMindMapData] = useState<string[]>([]);

  const fetchData = async () => {
    if (!user) return;
    try {
      const [notesData, userSnap] = await Promise.all([
        getUserNotes(user.uid, user.email || undefined),
        getDoc(doc(db, "users", user.uid))
      ]);
      setNotes(notesData as ExtNoteData[]);
      if (userSnap.exists() && userSnap.data().pinCode) setCorrectPin(userSnap.data().pinCode);
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingNotes(false);
    }
  };

  useFocusEffect(useCallback(() => { if (user) fetchData(); else if (!authLoading) setLoadingNotes(false); }, [user, authLoading]));

  // --- LOGIKA AI GENERATION ---
  const generateAndSaveFlashcard = async (note: ExtNoteData, existingHistory: any[][]) => {
    setIsGeneratingAi(true);
    try {
      const result = await callAI({ action: "generate-flashcards", content: `Judul: ${note.title}\n\nIsi: ${note.content}` });
      if (result) {
        const parsed = JSON.parse(result);
        if (Array.isArray(parsed)) {
          const newHistory = [parsed, ...existingHistory];
          setFlashcardsData(newHistory);
          await updateNote(note.id, { flashcards: JSON.stringify(newHistory) } as any);
          setNotes(prev => prev.map(n => n.id === note.id ? { ...n, flashcards: JSON.stringify(newHistory) as any } : n));
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    } catch (e) { Alert.alert("Gagal", "AI tidak dapat memproses catatan ini."); } finally { setIsGeneratingAi(false); }
  };

  const generateAndSaveMindMap = async (note: ExtNoteData, existingHistory: string[]) => {
    setIsGeneratingAi(true);
    try {
      const result = await callAI({ action: "mindmap", content: `Judul: ${note.title}\n\nIsi: ${note.content}` });
      if (result) {
        const cleanCode = result.replace(/```mermaid/gi, '').replace(/```/g, '').trim();
        const newHistory = [cleanCode, ...existingHistory];
        setMindMapData(newHistory);
        await updateNote(note.id, { mindmapCode: newHistory } as any);
        setNotes(prev => prev.map(n => n.id === note.id ? { ...n, mindmapCode: newHistory } : n));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (e) { Alert.alert("Gagal", "AI tidak dapat memproses catatan ini."); } finally { setIsGeneratingAi(false); }
  };

  const handleSelectNoteForAi = async (noteMeta: ExtNoteData) => {
    const mode = selectNoteMode;
    setSelectNoteMode(null); 
    setIsGeneratingAi(true); 

    try {
      const freshNote = await getNote(noteMeta.id);
      if (!freshNote) throw new Error("Catatan tidak ditemukan");
      setIsGeneratingAi(false); 

      if (mode === 'flashcard') {
        let existingHistory: any[][] = [];
        if (freshNote.flashcards) {
           try {
             const parsed = typeof freshNote.flashcards === 'string' ? JSON.parse(freshNote.flashcards) : freshNote.flashcards;
             if (Array.isArray(parsed)) existingHistory = (parsed.length > 0 && !Array.isArray(parsed[0])) ? [parsed] : parsed;
           } catch (e) {}
        }
        if (existingHistory.length > 0) {
           Alert.alert("Kuis Tersedia", "Catatan ini sudah memiliki riwayat Kuis AI.", [
             { text: "Batal", style: "cancel" },
             { text: "Mulai Belajar", onPress: () => setFlashcardsData(existingHistory) },
             { text: "Buat Versi Baru", onPress: () => generateAndSaveFlashcard(freshNote as any, existingHistory) }
           ]);
        } else generateAndSaveFlashcard(freshNote as any, existingHistory);
      } else if (mode === 'mindmap') {
        let existingHistory: string[] = [];
        if (freshNote.mindmapCode) {
           const raw = freshNote.mindmapCode;
           if (typeof raw === 'string') {
              try { const parsed = JSON.parse(raw); existingHistory = Array.isArray(parsed) ? parsed : [raw]; } catch(e) { existingHistory = [raw]; }
           } else if (Array.isArray(raw)) existingHistory = raw;
        }
        if (existingHistory.length > 0) {
           Alert.alert("Mind Map Tersedia", "Catatan ini sudah memiliki riwayat Mind Map.", [
             { text: "Batal", style: "cancel" },
             { text: "Lihat Map", onPress: () => setMindMapData(existingHistory) },
             { text: "Buat Versi Baru", onPress: () => generateAndSaveMindMap(freshNote as any, existingHistory) }
           ]);
        } else generateAndSaveMindMap(freshNote as any, existingHistory);
      }
    } catch (err) { setIsGeneratingAi(false); Alert.alert("Gagal", "Terjadi kesalahan saat memuat data."); }
  };

  // --- LOGIKA AKSI CATATAN ---
  const handleDelete = (id: string) => {
    Alert.alert("Hapus Catatan?", "Apakah kamu yakin ingin menghapus catatan ini?", [
      { text: "Batal", style: "cancel" },
      { text: "Hapus", style: "destructive", onPress: async () => { await deleteNote(id); fetchData(); } }
    ]);
  };

  const handleTogglePin = async (id: string, currentPinStatus: boolean | undefined) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newStatus = !currentPinStatus;
    setNotes(notes.map(n => n.id === id ? { ...n, isPinned: newStatus } : n));
    try { await updateNote(id, { isPinned: newStatus } as any); } catch (error) { setNotes(notes.map(n => n.id === id ? { ...n, isPinned: currentPinStatus } : n)); }
  };

  const handleUnlockVault = () => {
    if (!correctPin) return Alert.alert("PIN Belum Diatur", "Atur PIN Brankas di halaman Profil!");
    if (pinInput === correctPin) {
      setIsVaultOpen(true); setShowPinModal(false); setPinInput(""); setSelectedTag(null); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else { Alert.alert("Ditolak", "PIN salah!"); setPinInput(""); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); }
  };

  if (authLoading || loadingNotes) return <View className="flex-1 bg-background justify-center items-center"><ActivityIndicator size="large" color={primaryHex} /></View>;
  if (!user) return null;

  // --- FILTERING & SORTING ---
  const totalPublicNotes = notes.filter(n => !n.isTodo && !n.isHidden).length;
  const totalVaultNotes = notes.filter(n => !n.isTodo && n.isHidden).length;
  const availableNotes = notes.filter(n => !n.isTodo && (isVaultOpen ? n.isHidden : !n.isHidden));
  const allTags = Array.from(new Set(availableNotes.flatMap(n => n.tags || [])));

  let displayedNotes = [...availableNotes].filter(note => {
    if (selectedTag && (!note.tags || !note.tags.includes(selectedTag))) return false;
    const query = searchQuery.toLowerCase();
    return (note.title?.toLowerCase().includes(query) || note.content?.toLowerCase().includes(query) || note.tags?.some(tag => tag.toLowerCase().includes(query)));
  });

  const applySort = (arr: ExtNoteData[]) => {
    let sorted = [...arr];
    if (sortBy === "oldest") sorted.reverse();
    else if (sortBy === "az") sorted.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    else if (sortBy === "za") sorted.sort((a, b) => (b.title || "").localeCompare(a.title || ""));
    return sorted;
  };

  const isSharedNote = (n: ExtNoteData): boolean => !!(n.collaborators && n.collaborators.length > 0);

  const generateTreeList = (notesList: ExtNoteData[]): TreeNodeData[] => {
    const flatList: TreeNodeData[] = [];
    const roots = notesList.filter(n => !n.parentId || !notesList.some(parent => parent.id === n.parentId));
    const buildNode = (node: ExtNoteData, depth: number) => {
      const children = notesList.filter(n => n.parentId === node.id);
      flatList.push({ ...node, depth, hasChildren: children.length > 0 });
      if (children.length > 0 && (expandedNodes[node.id] || searchQuery.trim() !== "")) {
        applySort(children).forEach(child => buildNode(child, depth + 1));
      }
    };
    applySort(roots).forEach(root => buildNode(root, 0));
    return flatList;
  };

  const treePinnedNotes = generateTreeList(applySort(displayedNotes.filter(n => n.isPinned)));
  const treeSharedNotes = generateTreeList(applySort(displayedNotes.filter(n => !n.isPinned && isSharedNote(n))));
  const treeOtherNotes = generateTreeList(applySort(displayedNotes.filter(n => !n.isPinned && !isSharedNote(n))));

  return (
    <View className="flex-1 bg-background">
      <Header translateY={headerTranslateY} />

      <ScrollView contentContainerStyle={{ paddingTop: insets.top + 70, paddingHorizontal: 16, paddingBottom: 120 }} showsVerticalScrollIndicator={false} onScroll={handleScroll} scrollEventThrottle={16}>
        
        {/* FIX: Total Notes yang dilempar sekarang murni hanya Catatan (Publik + Brankas), tanpa tugas Todo */}
        <NotesHero totalNotes={totalPublicNotes + totalVaultNotes} totalPublicNotes={totalPublicNotes} totalVaultNotes={totalVaultNotes} />

        {/* KOMPONEN: Action Buttons */}
        <NotesActions 
          isVaultOpen={isVaultOpen} 
          onToggleVault={() => { if (isVaultOpen) { setIsVaultOpen(false); setSelectedTag(null); } else setShowPinModal(true); }}
          onOpenFlashcard={() => setSelectNoteMode('flashcard')}
          onOpenMindMap={() => setSelectNoteMode('mindmap')}
        />

        {/* KOMPONEN: Search & Filter */}
        <SearchFilterBar 
          searchQuery={searchQuery} setSearchQuery={setSearchQuery}
          viewMode={viewMode as any} setViewMode={setViewMode as any}
          sortBy={sortBy as any} setSortBy={setSortBy as any}
          allTags={allTags} selectedTag={selectedTag} setSelectedTag={setSelectedTag}
        />

        {isVaultOpen && displayedNotes.length > 0 && (
          <View className="mb-4 flex-row items-center justify-between px-2">
            <Text className="text-xs font-bold text-purple-500 uppercase tracking-widest" style={{ fontFamily }}>Akses Brankas Aktif</Text>
            <LockKeyhole color="#a855f7" size={14} />
          </View>
        )}

        {/* DAFTAR CATATAN */}
        {displayedNotes.length === 0 ? (
          <View className="items-center justify-center py-16 px-4 border border-dashed rounded-3xl mt-4" style={{ borderColor, backgroundColor: `${borderColor}20` }}>
            <Text className="text-center" style={{ color: mutedColor, fontFamily }}>
              {searchQuery || selectedTag ? "Tidak ada catatan yang cocok." : isVaultOpen ? "Brankas kamu masih kosong." : "Belum ada catatan."}
            </Text>
          </View>
        ) : (
          <View className="space-y-6">
            {treePinnedNotes.length > 0 && (
              <View className="mb-4">
                <View className="flex-row items-center gap-2 mb-3"><Pin color={mutedColor} size={16} /><Text className="text-sm font-bold" style={{ color: mutedColor, fontFamily }}>Disematkan</Text></View>
                <View className={viewMode === "grid" ? "flex-row flex-wrap justify-between" : "flex-col"}>
                  {treePinnedNotes.map(n => <NoteCard key={n.id} note={n} viewMode={viewMode} isVaultOpen={isVaultOpen} isShared={isSharedNote(n)} isExpanded={expandedNodes[n.id] || searchQuery.trim() !== ""} onPress={() => router.push(`/edit/${n.id}` as any)} onLongPress={() => setActiveNoteOptions(n)} onToggleExpand={() => setExpandedNodes(p => ({ ...p, [n.id]: !p[n.id] }))} />)}
                </View>
              </View>
            )}
            {treeSharedNotes.length > 0 && (
              <View className="mb-4">
                <View className="flex-row items-center gap-2 mb-3 mt-1"><Users color="#3b82f6" size={16} /><Text className="text-sm font-bold text-blue-500" style={{ fontFamily }}>Catatan Bersama</Text></View>
                <View className={viewMode === "grid" ? "flex-row flex-wrap justify-between" : "flex-col"}>
                  {treeSharedNotes.map(n => <NoteCard key={n.id} note={n} viewMode={viewMode} isVaultOpen={isVaultOpen} isShared={true} isExpanded={expandedNodes[n.id] || searchQuery.trim() !== ""} onPress={() => router.push(`/edit/${n.id}` as any)} onLongPress={() => setActiveNoteOptions(n)} onToggleExpand={() => setExpandedNodes(p => ({ ...p, [n.id]: !p[n.id] }))} />)}
                </View>
              </View>
            )}
            {treeOtherNotes.length > 0 && (
              <View>
                {(treePinnedNotes.length > 0 || treeSharedNotes.length > 0) && <Text className="text-sm font-semibold mb-3 mt-1" style={{ color: primaryHex, fontFamily }}>Catatan Lainnya</Text>}
                <View className={viewMode === "grid" ? "flex-row flex-wrap justify-between" : "flex-col"}>
                  {treeOtherNotes.map(n => <NoteCard key={n.id} note={n} viewMode={viewMode} isVaultOpen={isVaultOpen} isShared={false} isExpanded={expandedNodes[n.id] || searchQuery.trim() !== ""} onPress={() => router.push(`/edit/${n.id}` as any)} onLongPress={() => setActiveNoteOptions(n)} onToggleExpand={() => setExpandedNodes(p => ({ ...p, [n.id]: !p[n.id] }))} />)}
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* MODAL BOTTOM SHEET OPSI CATATAN */}
      <Modal visible={!!activeNoteOptions} transparent animationType="slide">
        <TouchableOpacity activeOpacity={1} onPress={() => setActiveNoteOptions(null)} className="flex-1 bg-black/60 justify-end">
          <View className="rounded-t-[2rem] p-6 shadow-2xl w-full" style={{ backgroundColor: cardBgColor, borderColor, borderTopWidth: 1 }}>
            <View className="w-12 h-1.5 rounded-full mx-auto mb-6" style={{ backgroundColor: borderColor }} />
            <Text className="font-bold text-xl mb-6 text-center" style={{ color: textColor, fontFamily }} numberOfLines={1}>{activeNoteOptions?.title || "Tanpa Judul"}</Text>
            <View className="space-y-3">
              <TouchableOpacity onPress={() => { if(activeNoteOptions) handleTogglePin(activeNoteOptions.id, activeNoteOptions.isPinned); setActiveNoteOptions(null); }} className="w-full flex-row items-center p-4 rounded-2xl border" style={{ backgroundColor: activeNoteOptions?.isPinned ? `${primaryHex}10` : 'transparent', borderColor: activeNoteOptions?.isPinned ? primaryHex : borderColor }}>
                <Pin color={activeNoteOptions?.isPinned ? primaryHex : textColor} size={20} style={{ marginRight: 12 }} />
                <Text className="font-bold text-base" style={{ color: activeNoteOptions?.isPinned ? primaryHex : textColor, fontFamily }}>{activeNoteOptions?.isPinned ? "Lepaskan Sematan" : "Sematkan ke Atas"}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { const id = activeNoteOptions?.id; setActiveNoteOptions(null); if(id) handleDelete(id); }} className="w-full flex-row items-center p-4 rounded-2xl border" style={{ backgroundColor: '#ef444410', borderColor: '#ef444450' }}>
                <Trash2 color="#ef4444" size={20} style={{ marginRight: 12 }} />
                <Text className="font-bold text-base text-red-500" style={{ fontFamily }}>Hapus Catatan</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* SISA MODAL LAINNYA */}
      <Modal visible={!!selectNoteMode} transparent animationType="slide">
        <View className="flex-1 bg-black/60 justify-end">
          <View className="w-full h-[75%] rounded-t-[2rem] p-5 shadow-2xl" style={{ backgroundColor: cardBgColor, borderColor, borderTopWidth: 1 }}>
            <View className="flex-row justify-between items-center mb-4 pb-2 border-b" style={{ borderColor: `${borderColor}80` }}>
              <View>
                <Text className="font-bold text-lg" style={{ color: textColor, fontFamily }}>{selectNoteMode === 'flashcard' ? 'Pilih Materi Kuis' : 'Pilih Materi Mind Map'}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectNoteMode(null)} className="p-2 bg-muted rounded-full border" style={{ borderColor }}><X color={textColor} size={20} /></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
              {availableNotes.map(n => (
                <TouchableOpacity key={n.id} onPress={() => handleSelectNoteForAi(n)} className="p-4 border-b transition-colors rounded-2xl mb-2 border shadow-sm" style={{ borderColor: `${borderColor}50`, backgroundColor: isDark ? '#27272a30' : '#f4f4f5' }}>
                  <Text className="font-bold text-sm mb-1.5" style={{ color: textColor, fontFamily }}>{n.title || "Tanpa Judul"}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={isGeneratingAi} transparent animationType="fade">
        <View className="flex-1 bg-black/70 justify-center items-center p-4">
          <View className="p-6 rounded-[2rem] items-center shadow-2xl border w-64" style={{ backgroundColor: cardBgColor, borderColor }}>
             <ActivityIndicator size="large" color={primaryHex} style={{ marginBottom: 16 }} />
             <Text className="font-bold text-base mb-2 text-center" style={{ color: textColor, fontFamily }}>AI Sedang Meracik...</Text>
          </View>
        </View>
      </Modal>

      <Modal visible={showPinModal} transparent animationType="fade">
        <View className="flex-1 bg-black/80 justify-center items-center p-4">
          <View className="w-full max-w-sm rounded-[2rem] p-6 shadow-2xl items-center" style={{ backgroundColor: cardBgColor, borderColor, borderWidth: 1 }}>
            <LockKeyhole color="#a855f7" size={32} style={{ marginBottom: 16 }} />
            <TextInput keyboardType="number-pad" maxLength={4} autoFocus secureTextEntry value={pinInput} onChangeText={(text) => setPinInput(text.replace(/[^0-9]/g, ''))} className="w-full px-4 py-4 text-center tracking-[1em] text-3xl font-black rounded-2xl mb-6 border" style={{ backgroundColor: isDark ? '#09090b' : '#f4f4f5', borderColor, color: textColor, fontFamily }} />
            <View className="flex-row gap-3 w-full">
              <TouchableOpacity onPress={() => { setShowPinModal(false); setPinInput(""); }} className="flex-1 rounded-xl h-12 items-center justify-center border" style={{ borderColor }}><Text style={{ color: textColor, fontFamily }}>Batal</Text></TouchableOpacity>
              <TouchableOpacity onPress={handleUnlockVault} disabled={pinInput.length !== 4} className="flex-1 rounded-xl h-12 items-center justify-center shadow-md" style={{ backgroundColor: pinInput.length === 4 ? '#9333ea' : '#d8b4fe' }}><Text style={{ color: '#fff', fontFamily }}>Buka</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {flashcardsData.length > 0 && <FlashcardModal history={flashcardsData} onClose={() => setFlashcardsData([])} />}
      {mindMapData.length > 0 && <MindMapViewer history={mindMapData} onClose={() => setMindMapData([])} />}

    </View>
  );
}