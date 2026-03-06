import * as Haptics from 'expo-haptics';
import { ChevronLeft, ChevronRight, History, Network, X } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React, { useState } from 'react';
import { Appearance, Modal, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview'; // <-- Wajib install react-native-webview
import { CustomText } from '../ui/custom-text';

interface MindMapViewerProps {
  history: string[]; // Menyimpan riwayat kode mermaid
  onClose: () => void;
}

export function MindMapViewer({ history, onClose }: MindMapViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark' || ((colorScheme as any) === 'system' && Appearance.getColorScheme() === 'dark');
  const cardBgColor = isDark ? '#18181b' : '#ffffff';
  const borderColor = isDark ? '#27272a' : '#e4e4e7';
  const textColor = isDark ? '#ffffff' : '#09090b';
  const mutedColor = isDark ? '#a1a1aa' : '#71717a';

  const currentCode = history[currentIndex] || '';

  const handlePrevVersion = () => {
    if (currentIndex < history.length - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleNextVersion = () => {
    if (currentIndex > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentIndex(prev => prev - 1);
    }
  };

  // Suntikkan HTML + Mermaid JS CDN ke dalam Webview
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes">
      <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
      <style>
        body {
          margin: 0;
          padding: 20px;
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          background-color: ${isDark ? '#09090b' : '#ffffff'};
          color: ${isDark ? '#ffffff' : '#000000'};
          font-family: sans-serif;
        }
        .mermaid {
          width: 100%;
          display: flex;
          justify-content: center;
        }
      </style>
    </head>
    <body>
      <div class="mermaid">
        ${currentCode.replace(/`/g, '\\`')}
      </div>
      <script>
        mermaid.initialize({ 
          startOnLoad: true, 
          theme: '${isDark ? 'dark' : 'default'}',
          securityLevel: 'loose'
        });
      </script>
    </body>
    </html>
  `;

  return (
    <Modal visible={true} animationType="slide" transparent>
      <View className="flex-1" style={{ backgroundColor: cardBgColor }}>
        
        {/* Header Modal */}
        <View className="flex-row items-center justify-between p-4 border-b z-50 pt-12" style={{ borderColor, backgroundColor: cardBgColor }}>
          <View className="flex-row items-center gap-3">
            <View className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#f43f5e15' }}>
              <Network color="#f43f5e" size={20} />
            </View>
            <View>
              <CustomText className="font-bold text-base" style={{ color: textColor }}>Peta Konsep (Mind Map)</CustomText>
              <CustomText className="text-[11px]" style={{ color: mutedColor }}>Cubit layar untuk zoom-in/out</CustomText>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} className="p-2 rounded-full" style={{ backgroundColor: isDark ? '#27272a' : '#f4f4f5' }}>
            <X color={textColor} size={20} />
          </TouchableOpacity>
        </View>

        {/* Panel Navigasi Riwayat */}
        {history.length > 1 && (
          <View className="absolute top-32 left-1/2 -translate-x-1/2 z-50 flex-row items-center gap-3 px-3 py-2 rounded-full border shadow-lg" style={{ backgroundColor: cardBgColor, borderColor }}>
            <TouchableOpacity onPress={handlePrevVersion} disabled={currentIndex === history.length - 1} className="p-1">
              <ChevronLeft color={currentIndex === history.length - 1 ? mutedColor : textColor} size={20} />
            </TouchableOpacity>
            
            <View className="flex-row items-center gap-1.5 px-2">
              <History color={mutedColor} size={14} />
              <CustomText className="text-xs font-bold" style={{ color: textColor }}>
                Versi {history.length - currentIndex} <CustomText style={{ color: mutedColor }}>/ {history.length}</CustomText>
              </CustomText>
            </View>

            <TouchableOpacity onPress={handleNextVersion} disabled={currentIndex === 0} className="p-1">
              <ChevronRight color={currentIndex === 0 ? mutedColor : textColor} size={20} />
            </TouchableOpacity>
          </View>
        )}

        {/* AREA WEBVIEW UNTUK MERMAID */}
        <View className="flex-1">
          <WebView 
            source={{ html: htmlContent }}
            originWhitelist={['*']}
            scalesPageToFit={true}
            bounces={false}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            style={{ backgroundColor: 'transparent' }}
          />
        </View>

      </View>
    </Modal>
  );
}