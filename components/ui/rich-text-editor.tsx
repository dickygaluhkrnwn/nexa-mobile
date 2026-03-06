import * as Haptics from 'expo-haptics';
import { Bold, Heading1, Heading2, Italic, List, ListOrdered } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React, { useRef, useState } from 'react';
import { Appearance, TouchableOpacity, View } from 'react-native';
import { WebView } from 'react-native-webview';

interface RichTextEditorProps {
  initialContent?: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

export function RichTextEditor({ 
  initialContent = '', 
  onChange, 
  placeholder = 'Mulai menulis...',
  minHeight = 250 
}: RichTextEditorProps) {
  const webViewRef = useRef<WebView>(null);
  
  // State untuk menyimpan tinggi dinamis konten Editor
  const [webViewHeight, setWebViewHeight] = useState(minHeight);
  
  const { colorScheme } = useColorScheme();
  
  // Tema Dinamis
  const isDark = colorScheme === 'dark' || ((colorScheme as any) === 'system' && Appearance.getColorScheme() === 'dark');
  const bgColor = isDark ? '#18181b' : '#ffffff';
  const textColor = isDark ? '#ffffff' : '#09090b';
  const mutedColor = isDark ? '#a1a1aa' : '#71717a';
  const borderColor = isDark ? '#27272a' : '#e4e4e7';

  // Template HTML yang sudah disuntik logika Auto-Height
  const htmlTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          background-color: ${bgColor};
          color: ${textColor};
          margin: 0;
          padding: 16px;
          font-size: 16px;
          line-height: 1.6;
          overflow-y: hidden; /* MATIKAN SCROLLBAR INTERNAL */
        }
        #editor {
          min-height: ${minHeight}px;
          outline: none;
          padding-bottom: 60px; /* Ruang lega ekstra di bawah kursor */
        }
        #editor[placeholder]:empty:before {
          content: attr(placeholder);
          color: ${mutedColor};
          pointer-events: none;
          display: block;
        }
        h1 { font-size: 1.6em; font-weight: 800; margin-top: 10px; margin-bottom: 10px; }
        h2 { font-size: 1.3em; font-weight: 700; margin-top: 10px; margin-bottom: 10px; }
        ul, ol { padding-left: 24px; margin-top: 0; margin-bottom: 10px; }
        li { margin-bottom: 4px; }
        b, strong { font-weight: 800; }
      </style>
    </head>
    <body>
      <div id="editor" contenteditable="true" placeholder="${placeholder}">${initialContent}</div>
      <script>
        const editor = document.getElementById('editor');

        // Fungsi ajaib untuk mengukur tinggi konten dan mengirimnya ke React Native
        const sendUpdate = () => {
          const height = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'update',
            html: editor.innerHTML,
            height: height
          }));
        };

        editor.addEventListener('input', sendUpdate);
        editor.addEventListener('blur', sendUpdate);
        editor.addEventListener('keyup', sendUpdate);

        // ResizeObserver mendeteksi jika ada paste teks super panjang atau load gambar
        const resizeObserver = new ResizeObserver(() => sendUpdate());
        resizeObserver.observe(document.body);

        // Trigger pertama saat halaman selesai dimuat agar tingginya pas
        setTimeout(sendUpdate, 200);
      </script>
    </body>
    </html>
  `;

  const applyFormat = (command: string, value?: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const jsCode = `
      document.getElementById('editor').focus();
      document.execCommand('${command}', false, ${value ? `'<${value}>'` : 'null'});
      
      // Update tinggi setelah format diaplikasikan
      const height = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'update',
        html: document.getElementById('editor').innerHTML,
        height: height
      }));
      true;
    `;
    webViewRef.current?.injectJavaScript(jsCode);
  };

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'update') {
        onChange(data.html);
        
        // Update state tinggi komponen berdasarkan perhitungan dari Web
        if (data.height && data.height > minHeight) {
          setWebViewHeight(data.height);
        } else {
          setWebViewHeight(minHeight);
        }
      }
    } catch (e) {
      // Fallback jika message gagal diparsing
      onChange(event.nativeEvent.data);
    }
  };

  return (
    <View 
      className="rounded-[1.5rem] overflow-hidden border mt-2 shadow-sm w-full" 
      style={{ 
        borderColor, 
        backgroundColor: bgColor, 
        // Kunci Auto-Height: Tinggi Toolbar (55px) + Tinggi Dinamis WebView
        height: Math.max(minHeight + 55, webViewHeight + 55) 
      }}
    >
      
      {/* TOOLBAR FORMATTING */}
      <View className="flex-row items-center gap-1.5 p-2 border-b z-10 h-[55px]" style={{ borderColor, backgroundColor: isDark ? '#27272a' : '#f4f4f5' }}>
        <TouchableOpacity onPress={() => applyFormat('bold')} className="p-2 rounded-xl" style={{ backgroundColor: isDark ? '#3f3f46' : '#e4e4e7' }}>
          <Bold color={textColor} size={18} />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => applyFormat('italic')} className="p-2 rounded-xl" style={{ backgroundColor: isDark ? '#3f3f46' : '#e4e4e7' }}>
          <Italic color={textColor} size={18} />
        </TouchableOpacity>

        <View className="w-px h-5 mx-1" style={{ backgroundColor: mutedColor, opacity: 0.3 }} />
        
        <TouchableOpacity onPress={() => applyFormat('formatBlock', 'h1')} className="p-2 rounded-xl" style={{ backgroundColor: isDark ? '#3f3f46' : '#e4e4e7' }}>
          <Heading1 color={textColor} size={18} />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => applyFormat('formatBlock', 'h2')} className="p-2 rounded-xl" style={{ backgroundColor: isDark ? '#3f3f46' : '#e4e4e7' }}>
          <Heading2 color={textColor} size={18} />
        </TouchableOpacity>

        <View className="w-px h-5 mx-1" style={{ backgroundColor: mutedColor, opacity: 0.3 }} />
        
        <TouchableOpacity onPress={() => applyFormat('insertUnorderedList')} className="p-2 rounded-xl" style={{ backgroundColor: isDark ? '#3f3f46' : '#e4e4e7' }}>
          <List color={textColor} size={18} />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => applyFormat('insertOrderedList')} className="p-2 rounded-xl" style={{ backgroundColor: isDark ? '#3f3f46' : '#e4e4e7' }}>
          <ListOrdered color={textColor} size={18} />
        </TouchableOpacity>
      </View>

      {/* AREA MENGETIK (WEBVIEW) */}
      <WebView
        ref={webViewRef}
        source={{ html: htmlTemplate }}
        originWhitelist={['*']}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        bounces={false}
        scrollEnabled={false} /* FIX UTAMA: MATIKAN SCROLL INTERNAL WEBVIEW */
        showsVerticalScrollIndicator={false}
        hideKeyboardAccessoryView={true}
        style={{ backgroundColor: bgColor }}
      />
    </View>
  );
}