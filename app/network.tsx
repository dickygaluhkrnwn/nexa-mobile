import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { ArrowLeft, Network as NetworkIcon } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Appearance, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { CustomText } from '../components/ui/custom-text';
import { useSettings } from '../hooks/use-settings';
import { useAuth } from '../lib/auth-context';
import { getUserNotesGraphData } from '../lib/notes-service';

const accentColors: Record<string, string> = {
  default: '#9333ea', blue: '#3b82f6', emerald: '#10b981',
  amber: '#f59e0b', orange: '#f97316', rose: '#f43f5e', violet: '#8b5cf6',
};

export default function NetworkGraphScreen() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const webViewRef = useRef<WebView>(null);
  
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark' || ((colorScheme as any) === 'system' && Appearance.getColorScheme() === 'dark');
  const backgroundColor = isDark ? '#09090b' : '#ffffff';
  const cardBgColor = isDark ? 'rgba(24,24,27,0.85)' : 'rgba(255,255,255,0.85)';
  const textColor = isDark ? '#ffffff' : '#000000';
  const mutedColor = isDark ? '#a1a1aa' : '#71717a';

  const { colorAccent } = useSettings();
  const primaryHex = accentColors[colorAccent] || accentColors.default;

  const [graphData, setGraphData] = useState<{ nodes: any[]; links: any[] }>({ nodes: [], links: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [filterMode, setFilterMode] = useState<"all" | "note" | "todo">("all");
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  useEffect(() => {
    const fetchGraph = async () => {
      if (!user) return;
      try {
        const data = await getUserNotesGraphData(user.uid);
        
        const nodes: any[] = [];
        const links: any[] = [];

        data.forEach((note) => {
          nodes.push({
            id: note.id,
            name: note.title || "Tanpa Judul",
            val: 1.5,
            group: "note",
            color: note.parentId ? "#06b6d4" : primaryHex, 
            tags: note.tags || []
          });
        });

        data.forEach((note) => {
          if (note.links && Array.isArray(note.links)) {
            note.links.forEach(targetId => {
               if (nodes.some(n => n.id === targetId)) {
                 if (!links.some(l => l.source === note.id && l.target === targetId)) {
                   links.push({ source: note.id, target: targetId });
                 }
               }
            });
          }
          if (note.parentId && nodes.some(n => n.id === note.parentId)) {
            if (!links.some(l => l.source === note.id && l.target === note.parentId)) {
              links.push({ source: note.id, target: note.parentId });
            }
          }
        });

        links.forEach((link) => {
          const targetNode = nodes.find((n) => n.id === link.target);
          if (targetNode) targetNode.val += 1.2; 
        });

        setGraphData({ nodes, links });
      } catch (error) {
        console.error("Gagal memproses Graph:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGraph();
  }, [user, primaryHex]);

  const handleMessage = (event: any) => {
    const data = JSON.parse(event.nativeEvent.data);
    if (data.type === 'NODE_CLICK') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      router.push(`/edit/${data.id}` as any);
    }
  };

  // --- HTML INJEKSI UNTUK FORCE GRAPH 2D ---
  const htmlContent = useMemo(() => {
    if (graphData.nodes.length === 0) return '';
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes">
        <script src="https://unpkg.com/force-graph"></script>
        <style>
          body { margin: 0; padding: 0; background-color: ${backgroundColor}; overflow: hidden; }
          #graph { width: 100vw; height: 100vh; }
          .node-label {
            position: absolute;
            color: ${textColor};
            background: ${cardBgColor};
            padding: 4px 8px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: bold;
            font-family: sans-serif;
            pointer-events: none;
            backdrop-filter: blur(4px);
            border: 1px solid ${isDark ? '#3f3f46' : '#e4e4e7'};
            transition: opacity 0.2s;
            opacity: 0;
          }
        </style>
      </head>
      <body>
        <div id="graph"></div>
        <div id="node-tooltip" class="node-label"></div>
        <script>
          const rawData = ${JSON.stringify(graphData)};
          const isDark = ${isDark};
          const linkColor = isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)";
          
          const Graph = ForceGraph()
            (document.getElementById('graph'))
            .graphData(rawData)
            .backgroundColor('${backgroundColor}')
            .nodeColor(node => node.color)
            .nodeRelSize(6)
            .linkColor(() => linkColor)
            .linkWidth(1.5)
            .linkCurvature(0.2)
            .linkDirectionalArrowLength(4)
            .linkDirectionalArrowRelPos(1)
            .linkDirectionalParticles(2)
            .linkDirectionalParticleWidth(2)
            .linkDirectionalParticleColor(() => isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)")
            .onNodeClick(node => {
               window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'NODE_CLICK', id: node.id }));
            })
            .onNodeHover(node => {
              const tooltip = document.getElementById('node-tooltip');
              if (node) {
                tooltip.style.opacity = 1;
                tooltip.innerHTML = node.name;
              } else {
                tooltip.style.opacity = 0;
              }
            })
            .nodeCanvasObject((node, ctx, globalScale) => {
              const size = Math.sqrt(node.val) * 4;
              
              // Draw Circle
              ctx.beginPath();
              ctx.arc(node.x, node.y, size, 0, 2 * Math.PI, false);
              ctx.fillStyle = node.color;
              ctx.fill();
              
              // Draw Ring
              ctx.strokeStyle = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";
              ctx.lineWidth = size * 0.2;
              ctx.stroke();

              // Draw Text if zoomed enough
              if (globalScale >= 1.5) {
                const label = node.name;
                const fontSize = 12 / globalScale;
                ctx.font = \`600 \${fontSize}px sans-serif\`;
                ctx.textAlign = "center";
                ctx.textBaseline = "top";
                
                ctx.fillStyle = isDark ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.8)";
                ctx.fillText(label, node.x, node.y + size + (4/globalScale));
              }
            });

            // Update tooltip position based on Graph engine logic
            let rafId;
            const updateTooltip = () => {
              const tooltip = document.getElementById('node-tooltip');
              if (tooltip.style.opacity === "1" && Graph.hoverNode()) {
                 const node = Graph.hoverNode();
                 const { x, y } = Graph.graph2ScreenCoords(node.x, node.y);
                 tooltip.style.left = (x + 10) + 'px';
                 tooltip.style.top = (y + 10) + 'px';
              }
              rafId = requestAnimationFrame(updateTooltip);
            };
            updateTooltip();
            
            // Adjust to screen size
            window.addEventListener('resize', () => {
               Graph.width(window.innerWidth).height(window.innerHeight);
            });
            
            // Allow manual zooming from RN
            window.zoomGraph = (ratio) => {
               Graph.zoom(Graph.zoom() * ratio, 400);
            };
            window.fitGraph = () => {
               Graph.zoomToFit(400, 50);
            };
        </script>
      </body>
      </html>
    `;
  }, [graphData, backgroundColor, isDark, primaryHex, cardBgColor, textColor]);

  if (authLoading || isLoading) {
    return (
      <View className="flex-1 justify-center items-center" style={{ backgroundColor }}>
        <ActivityIndicator size="large" color={primaryHex} />
        <CustomText className="mt-4 font-bold" style={{ color: mutedColor }}>Menghubungkan semesta ide...</CustomText>
      </View>
    );
  }

  return (
    <View className="flex-1 relative" style={{ backgroundColor }}>
      
      {/* --- HEADER MELAYANG --- */}
      <View 
        className="absolute top-0 left-0 right-0 z-50 flex-row items-center justify-between px-4 pb-3 border-b"
        style={{ paddingTop: insets.top + 10, backgroundColor: cardBgColor, borderColor: isDark ? '#27272a' : '#e4e4e7' }}
      >
        <View className="flex-row items-center gap-3">
          <TouchableOpacity onPress={() => router.back()} className="p-2 rounded-full" style={{ backgroundColor: isDark ? '#27272a' : '#f4f4f5' }}>
            <ArrowLeft color={textColor} size={20} />
          </TouchableOpacity>
          <View>
            <View className="flex-row items-center gap-1.5">
              <NetworkIcon color={primaryHex} size={16} />
              <CustomText className="font-bold text-base" style={{ color: textColor }}>Peta Semesta</CustomText>
            </View>
            <CustomText className="text-[10px] font-medium mt-0.5" style={{ color: mutedColor }}>
              {graphData.nodes.length} Catatan • {graphData.links.length} Tautan
            </CustomText>
          </View>
        </View>

        {/* Tombol Fit (Center) Graph */}
        <TouchableOpacity 
          onPress={() => webViewRef.current?.injectJavaScript('window.fitGraph(); true;')}
          className="px-3 py-1.5 rounded-full border"
          style={{ backgroundColor: `${primaryHex}15`, borderColor: `${primaryHex}30` }}
        >
          <CustomText className="text-xs font-bold" style={{ color: primaryHex }}>Pusatkan</CustomText>
        </TouchableOpacity>
      </View>

      {/* --- KANVAS WEBVIEW (ENGINE GRAFIS) --- */}
      <View className="flex-1 mt-[90px]">
        {graphData.nodes.length === 0 ? (
          <View className="flex-1 items-center justify-center p-8">
            <CustomText className="text-center font-medium leading-relaxed" style={{ color: mutedColor }}>
              Peta Semesta masih kosong. Mulailah membuat catatan dan hubungkan mereka menggunakan fitur Bi-directional Linking (ketik `[[` di editor).
            </CustomText>
          </View>
        ) : (
          <WebView 
            ref={webViewRef}
            source={{ html: htmlContent }}
            originWhitelist={['*']}
            onMessage={handleMessage}
            bounces={false}
            scrollEnabled={false}
            style={{ backgroundColor: 'transparent' }}
          />
        )}
      </View>

    </View>
  );
}