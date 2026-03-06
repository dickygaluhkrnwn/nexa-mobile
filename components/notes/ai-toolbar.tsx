import { Brain, Camera, ChevronDown, ChevronUp, Image as ImageIcon, MessageSquare, Mic, Network, Sparkles, Tag as TagIcon, Wand2 } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React, { useState } from 'react';
import { ActivityIndicator, Appearance, TouchableOpacity, View } from 'react-native';
import { useSettings } from '../../hooks/use-settings';
import { CustomText } from '../ui/custom-text';

interface AiToolbarProps {
  onOpenChat?: () => void;
  onGenerateMindMap?: () => void;
  onAutoFormat?: () => void;
  onGenerateTags?: () => void;
  onSummarize?: () => void;
  onGenerateFlashcards?: () => void;
  
  isGeneratingMindMap?: boolean;
  isFormatting?: boolean;
  isGeneratingTags?: boolean;
  isSummarizing?: boolean;
  isGeneratingFlashcards?: boolean;
  
  isContentEmpty?: boolean;
  isTitleAndContentEmpty?: boolean;
  
  onVoiceRecord?: () => void;
  isRecording?: boolean;
  isAnalyzingVoice?: boolean;
  onStopRecording?: () => void;

  onShowComingSoon?: (fitur: string) => void;
}

const accentColors: Record<string, string> = {
  default: '#9333ea', blue: '#3b82f6', emerald: '#10b981',
  amber: '#f59e0b', orange: '#f97316', rose: '#f43f5e', violet: '#8b5cf6',
};

export function AiToolbar({
  onOpenChat, onGenerateMindMap, onAutoFormat, onGenerateTags, onSummarize, onGenerateFlashcards,
  isGeneratingMindMap, isFormatting, isGeneratingTags, isSummarizing, isGeneratingFlashcards,
  isContentEmpty, isTitleAndContentEmpty,
  onVoiceRecord, isRecording, isAnalyzingVoice, onStopRecording,
  onShowComingSoon
}: AiToolbarProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark' || ((colorScheme as any) === 'system' && Appearance.getColorScheme() === 'dark');
  
  const { colorAccent } = useSettings();
  const primaryHex = accentColors[colorAccent] || accentColors.default;

  const textColor = isDark ? '#ffffff' : '#09090b';
  const mutedColor = isDark ? '#a1a1aa' : '#71717a';
  const borderColor = isDark ? '#27272a' : '#e4e4e7';

  const [isExpanded, setIsExpanded] = useState(false);

  // FIX: Pemetaan warna tombol AI
  const colors = {
    rose: { bg: isDark ? '#4c0519' : '#ffe4e6', border: isDark ? '#881337' : '#fecdd3', text: isDark ? '#fb7185' : '#e11d48' },
    blue: { bg: isDark ? '#1e3a8a' : '#dbeafe', border: isDark ? '#3730a3' : '#bfdbfe', text: isDark ? '#60a5fa' : '#2563eb' },
    emerald: { bg: isDark ? '#064e3b' : '#d1fae5', border: isDark ? '#065f46' : '#a7f3d0', text: isDark ? '#34d399' : '#059669' },
    green: { bg: isDark ? '#14532d' : '#dcfce7', border: isDark ? '#166534' : '#bbf7d0', text: isDark ? '#4ade80' : '#16a34a' },
    indigo: { bg: isDark ? '#312e81' : '#e0e7ff', border: isDark ? '#4338ca' : '#c7d2fe', text: isDark ? '#818cf8' : '#4f46e5' },
    orange: { bg: isDark ? '#7c2d12' : '#ffedd5', border: isDark ? '#9a3412' : '#fed7aa', text: isDark ? '#fb923c' : '#ea580c' },
    cyan: { bg: isDark ? '#164e63' : '#cffafe', border: isDark ? '#155e75' : '#a5f3fc', text: isDark ? '#22d3ee' : '#0891b2' },
    purple: { bg: isDark ? '#4c1d95' : '#f3e8ff', border: isDark ? '#5b21b6' : '#e9d5ff', text: isDark ? '#c084fc' : '#7e22ce' },
  };

  // FIX: Pemetaan warna SOLID untuk Background Card Utama Toolbar dan Icon berdasarkan Tema yang Dipilih (colorAccent)
  const themeCardColors: Record<string, { bg: string, border: string, iconBg: string, iconBorder: string }> = {
    default: { bg: isDark ? '#2e1065' : '#faf5ff', border: isDark ? '#4c1d95' : '#f3e8ff', iconBg: isDark ? '#4c1d95' : '#e9d5ff', iconBorder: isDark ? '#5b21b6' : '#d8b4fe' },
    rose: { bg: isDark ? '#4c0519' : '#fff1f2', border: isDark ? '#881337' : '#ffe4e6', iconBg: isDark ? '#9f1239' : '#fecdd3', iconBorder: isDark ? '#be123c' : '#fda4af' },
    emerald: { bg: isDark ? '#022c22' : '#ecfdf5', border: isDark ? '#064e3b' : '#d1fae5', iconBg: isDark ? '#065f46' : '#a7f3d0', iconBorder: isDark ? '#047857' : '#6ee7b7' },
    amber: { bg: isDark ? '#451a03' : '#fffbeb', border: isDark ? '#78350f' : '#fef3c7', iconBg: isDark ? '#92400e' : '#fde68a', iconBorder: isDark ? '#b45309' : '#fcd34d' },
    orange: { bg: isDark ? '#431407' : '#fff7ed', border: isDark ? '#7c2d12' : '#ffedd5', iconBg: isDark ? '#9a3412' : '#fed7aa', iconBorder: isDark ? '#c2410c' : '#fdba74' },
    violet: { bg: isDark ? '#2e1065' : '#f5f3ff', border: isDark ? '#4c1d95' : '#ede9fe', iconBg: isDark ? '#5b21b6' : '#ddd6fe', iconBorder: isDark ? '#6d28d9' : '#c4b5fd' },
    blue: { bg: isDark ? '#172554' : '#eff6ff', border: isDark ? '#1e3a8a' : '#dbeafe', iconBg: isDark ? '#1e40af' : '#bfdbfe', iconBorder: isDark ? '#1d4ed8' : '#93c5fd' },
  };

  const activeCardColors = themeCardColors[colorAccent] || themeCardColors.default;

  return (
    <View 
      className="mt-4 p-4 rounded-[1.5rem] border mb-4 flex-col shadow-sm" 
      style={{ backgroundColor: activeCardColors.bg, borderColor: activeCardColors.border }}
    >
      
      {/* Header Toolbar Toggle */}
      <TouchableOpacity 
        activeOpacity={0.7} 
        onPress={() => setIsExpanded(!isExpanded)}
        className="flex-row items-center justify-between px-1"
      >
        <View className="flex-row items-center gap-2.5">
          <View 
            className="p-1.5 rounded-lg shadow-sm border" 
            style={{ backgroundColor: activeCardColors.iconBg, borderColor: activeCardColors.iconBorder }}
          >
            <Sparkles color={primaryHex} size={16} />
          </View>
          <View>
            <CustomText className="text-xs font-bold" style={{ color: textColor }}>Nexa AI Assistant</CustomText>
            <CustomText className="text-[10px]" style={{ color: mutedColor }}>Bantu ekstrak dan rapikan catatan</CustomText>
          </View>
        </View>
        <View className="p-1">
          {isExpanded ? <ChevronUp color={mutedColor} size={20} /> : <ChevronDown color={mutedColor} size={20} />}
        </View>
      </TouchableOpacity>
      
      {/* Kumpulan Tombol AI yang Dikategorikan */}
      {isExpanded && (
        <View className="mt-4 flex-col gap-4">
          
          {/* ==========================================
              KATEGORI 1: INPUT PINTAR
              ========================================== */}
          <View>
            <CustomText className="text-[10px] font-bold uppercase tracking-widest mb-2.5 px-1" style={{ color: mutedColor }}>
              Input Pintar
            </CustomText>
            <View className="flex-row flex-wrap justify-between">
              
              {/* Voice (Full Width) */}
              {onVoiceRecord && isRecording ? (
                <TouchableOpacity onPress={onStopRecording} className="flex-row items-center justify-center py-3 rounded-xl bg-red-500 shadow-md animate-pulse w-full mb-2">
                  <View className="w-2 h-2 rounded-full bg-white mr-2" />
                  <CustomText className="text-[11px] font-bold text-white">Berhenti Rekam</CustomText>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  onPress={onVoiceRecord ? onVoiceRecord : () => onShowComingSoon && onShowComingSoon("Suara Pintar")} 
                  disabled={isAnalyzingVoice} 
                  className="flex-row items-center justify-center py-3 rounded-xl border shadow-sm w-full mb-2" 
                  style={{ backgroundColor: colors.rose.bg, borderColor: colors.rose.border }}
                >
                  {isAnalyzingVoice ? <ActivityIndicator size="small" color={colors.rose.text} style={{ marginRight: 6 }} /> : <Mic color={colors.rose.text} size={14} style={{ marginRight: 6 }} />}
                  <CustomText className="text-[11px] font-bold" style={{ color: colors.rose.text }}>{isAnalyzingVoice ? "Menganalisis Suara..." : "Transkrip Suara Pintar"}</CustomText>
                </TouchableOpacity>
              )}

              {/* Kamera & Galeri (Split) */}
              <TouchableOpacity 
                onPress={() => onShowComingSoon && onShowComingSoon("Kamera OCR")} 
                className="flex-row items-center justify-center py-3 rounded-xl border shadow-sm w-[48%]" 
                style={{ backgroundColor: colors.blue.bg, borderColor: colors.blue.border }}
              >
                <Camera color={colors.blue.text} size={14} style={{ marginRight: 6 }} />
                <CustomText className="text-[11px] font-bold" style={{ color: colors.blue.text }}>Kamera Pindai</CustomText>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={() => onShowComingSoon && onShowComingSoon("Galeri OCR")} 
                className="flex-row items-center justify-center py-3 rounded-xl border shadow-sm w-[48%]" 
                style={{ backgroundColor: colors.emerald.bg, borderColor: colors.emerald.border }}
              >
                <ImageIcon color={colors.emerald.text} size={14} style={{ marginRight: 6 }} />
                <CustomText className="text-[11px] font-bold" style={{ color: colors.emerald.text }}>Dari Galeri</CustomText>
              </TouchableOpacity>
            </View>
          </View>

          <View className="h-px w-full opacity-50" style={{ backgroundColor: borderColor }} />

          {/* ==========================================
              KATEGORI 2: ANALISIS & VISUAL
              ========================================== */}
          <View>
            <CustomText className="text-[10px] font-bold uppercase tracking-widest mb-2.5 px-1" style={{ color: mutedColor }}>
              Analisis & Visual
            </CustomText>
            <View className="flex-row flex-wrap justify-between">
              
              {/* Chat & Flashcards (Split) */}
              <TouchableOpacity 
                onPress={onOpenChat ? onOpenChat : () => onShowComingSoon && onShowComingSoon("Chat AI")} 
                className="flex-row items-center justify-center py-3 rounded-xl border shadow-sm w-[48%] mb-2" 
                style={{ backgroundColor: colors.green.bg, borderColor: colors.green.border }}
              >
                <MessageSquare color={colors.green.text} size={14} style={{ marginRight: 6 }} />
                <CustomText className="text-[11px] font-bold" style={{ color: colors.green.text }}>Tanya AI</CustomText>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={onGenerateFlashcards ? onGenerateFlashcards : () => onShowComingSoon && onShowComingSoon("Bikin Kuis")} 
                disabled={isGeneratingFlashcards || isContentEmpty} 
                className="flex-row items-center justify-center py-3 rounded-xl border shadow-sm w-[48%] mb-2" 
                style={{ backgroundColor: colors.indigo.bg, borderColor: colors.indigo.border, opacity: isContentEmpty ? 0.5 : 1 }}
              >
                {isGeneratingFlashcards ? <ActivityIndicator size="small" color={colors.indigo.text} style={{ marginRight: 6 }} /> : <Brain color={colors.indigo.text} size={14} style={{ marginRight: 6 }} />}
                <CustomText className="text-[11px] font-bold" style={{ color: colors.indigo.text }}>Bikin Kuis</CustomText>
              </TouchableOpacity>

              {/* Mind Map (Full Width) */}
              <TouchableOpacity 
                onPress={onGenerateMindMap ? onGenerateMindMap : () => onShowComingSoon && onShowComingSoon("Mind Map")} 
                disabled={isGeneratingMindMap || isContentEmpty} 
                className="flex-row items-center justify-center py-3 rounded-xl border shadow-sm w-full" 
                style={{ backgroundColor: colors.orange.bg, borderColor: colors.orange.border, opacity: isContentEmpty ? 0.5 : 1 }}
              >
                {isGeneratingMindMap ? <ActivityIndicator size="small" color={colors.orange.text} style={{ marginRight: 6 }} /> : <Network color={colors.orange.text} size={14} style={{ marginRight: 6 }} />}
                <CustomText className="text-[11px] font-bold" style={{ color: colors.orange.text }}>Buat Peta Konsep (Mind Map)</CustomText>
              </TouchableOpacity>
            </View>
          </View>

          <View className="h-px w-full opacity-50" style={{ backgroundColor: borderColor }} />

          {/* ==========================================
              KATEGORI 3: OTOMATISASI TEKS
              ========================================== */}
          <View>
            <CustomText className="text-[10px] font-bold uppercase tracking-widest mb-2.5 px-1" style={{ color: mutedColor }}>
              Otomatisasi Teks
            </CustomText>
            <View className="flex-row flex-wrap justify-between">
              
              {/* Rapihkan & Tags (Split) */}
              <TouchableOpacity 
                onPress={onAutoFormat ? onAutoFormat : () => onShowComingSoon && onShowComingSoon("Rapihkan Teks")} 
                disabled={isFormatting || isContentEmpty} 
                className="flex-row items-center justify-center py-3 rounded-xl border shadow-sm w-[48%] mb-2" 
                style={{ backgroundColor: colors.cyan.bg, borderColor: colors.cyan.border, opacity: isContentEmpty ? 0.5 : 1 }}
              >
                {isFormatting ? <ActivityIndicator size="small" color={colors.cyan.text} style={{ marginRight: 6 }} /> : <Sparkles color={colors.cyan.text} size={14} style={{ marginRight: 6 }} />}
                <CustomText className="text-[11px] font-bold" style={{ color: colors.cyan.text }}>Rapihkan</CustomText>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={onGenerateTags ? onGenerateTags : () => onShowComingSoon && onShowComingSoon("Tebak Tag")} 
                disabled={isGeneratingTags || isTitleAndContentEmpty} 
                className="flex-row items-center justify-center py-3 rounded-xl border shadow-sm w-[48%] mb-2" 
                style={{ backgroundColor: activeCardColors.iconBg, borderColor: activeCardColors.iconBorder, opacity: isTitleAndContentEmpty ? 0.5 : 1 }}
              >
                {isGeneratingTags ? <ActivityIndicator size="small" color={primaryHex} style={{ marginRight: 6 }} /> : <TagIcon color={primaryHex} size={14} style={{ marginRight: 6 }} />}
                <CustomText className="text-[11px] font-bold" style={{ color: primaryHex }}>Tebak Tag</CustomText>
              </TouchableOpacity>

              {/* Summarize (Full Width) */}
              <TouchableOpacity 
                onPress={onSummarize ? onSummarize : () => onShowComingSoon && onShowComingSoon("Ringkas Isi")} 
                disabled={isSummarizing || isTitleAndContentEmpty} 
                className="flex-row items-center justify-center py-3 rounded-xl border shadow-sm w-full" 
                style={{ backgroundColor: colors.purple.bg, borderColor: colors.purple.border, opacity: isTitleAndContentEmpty ? 0.5 : 1 }}
              >
                {isSummarizing ? <ActivityIndicator size="small" color={colors.purple.text} style={{ marginRight: 6 }} /> : <Wand2 color={colors.purple.text} size={14} style={{ marginRight: 6 }} />}
                <CustomText className="text-[11px] font-bold" style={{ color: colors.purple.text }}>Ringkas Keseluruhan Isi</CustomText>
              </TouchableOpacity>
            </View>
          </View>

        </View>
      )}
    </View>
  );
}