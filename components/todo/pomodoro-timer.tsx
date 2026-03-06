import * as Haptics from "expo-haptics";
import { Brain, CheckCircle2, Coffee, Minimize2, Pause, Play, RotateCcw, X } from "lucide-react-native";
import { useColorScheme } from "nativewind";
import React, { useEffect, useRef, useState } from "react";
import { Alert, Appearance, Dimensions, Modal, PanResponder, Animated as RNAnimated, TouchableOpacity, Vibration, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { create } from "zustand";
import { useSettings } from "../../hooks/use-settings";
import { useAuth } from "../../lib/auth-context";
import { addFocusSession } from "../../lib/notes-service";
import { CustomText } from "../ui/custom-text";

// --- STATE GLOBAL POMODORO (DIPERBARUI) ---
export const usePomodoroStore = create<{
  isOpen: boolean;
  isFloating: boolean; // Tambahan state untuk mendeteksi mode minimize
  openPomodoro: () => void;
  closePomodoro: () => void;
  minimizePomodoro: () => void;
}>((set) => ({
  isOpen: false,
  isFloating: false,
  openPomodoro: () => set({ isOpen: true, isFloating: false }),
  closePomodoro: () => set({ isOpen: false, isFloating: false }),
  minimizePomodoro: () => set({ isOpen: false, isFloating: true }), // Buka widget mengambang
}));

const WORK_TIME = 25 * 60; // 25 Menit
const BREAK_TIME = 5 * 60; // 5 Menit

const { width } = Dimensions.get('window');

const accentColors: Record<string, string> = {
  default: '#9333ea', blue: '#3b82f6', emerald: '#10b981',
  amber: '#f59e0b', orange: '#f97316', rose: '#f43f5e', violet: '#8b5cf6',
};

export function PomodoroTimer() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  
  const { isOpen, isFloating, closePomodoro, openPomodoro, minimizePomodoro } = usePomodoroStore();
  
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark' || ((colorScheme as any) === 'system' && Appearance.getColorScheme() === 'dark');
  
  const bgModeFokus = isDark ? '#09090b' : '#fafafa';
  const cardBgColor = isDark ? '#18181b' : '#ffffff';
  const borderColor = isDark ? '#27272a' : '#e4e4e7';
  const textColor = isDark ? '#ffffff' : '#09090b';
  const mutedColor = isDark ? '#a1a1aa' : '#71717a';

  const { colorAccent } = useSettings();
  const primaryHex = accentColors[colorAccent] || accentColors.default;

  const [timeLeft, setTimeLeft] = useState(WORK_TIME);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<"work" | "break">("work");
  
  const initialTimeRef = useRef(WORK_TIME);
  const targetTimeRef = useRef<number | null>(null);

  const progressAnim = useSharedValue(0);

  // =========================================================
  // LOGIKA DRAGGABLE WIDGET (YANG SUDAH DIPERBAIKI)
  // =========================================================
  const pan = useRef(new RNAnimated.ValueXY({ x: 0, y: 0 })).current;
  const panResponder = useRef(
    PanResponder.create({
      // Hanya aktifkan drag jika user menggeser lebih dari 5px
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        // Ambil posisi terakhir sebelum digeser lagi
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value
        });
        pan.setValue({ x: 0, y: 0 }); // Reset value agar transisinya mulus
      },
      onPanResponderMove: RNAnimated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: () => {
        pan.flattenOffset(); // Kunci posisi akhir
      }
    })
  ).current;
  // =========================================================

  const handleTimerComplete = async () => {
    setIsActive(false);
    targetTimeRef.current = null;
    Vibration.vibrate([500, 200, 500, 200, 500]); 
    
    if (mode === "work") {
      if (user && !user.isAnonymous) {
         const durationInMinutes = Math.floor(initialTimeRef.current / 60);
         addFocusSession({
           userId: user.uid,
           durationMinutes: durationInMinutes,
           completedAt: new Date().toISOString()
         }).catch(err => console.error("Gagal menyimpan data fokus", err));
      }

      setMode("break");
      initialTimeRef.current = BREAK_TIME;
      setTimeLeft(BREAK_TIME);
      Alert.alert("Fokus Selesai! 🎉", "Kerja bagus! Sesi fokusmu telah dicatat. Sekarang waktunya istirahat.");
    } else {
      setMode("work");
      initialTimeRef.current = WORK_TIME;
      setTimeLeft(WORK_TIME);
      Alert.alert("Istirahat Selesai!", "Ayo kembali fokus 25 menit. Kamu pasti bisa!");
    }
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (isActive && timeLeft > 0) {
      if (!targetTimeRef.current) {
        targetTimeRef.current = Date.now() + timeLeft * 1000;
      }
      
      interval = setInterval(() => {
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((targetTimeRef.current! - now) / 1000));
        setTimeLeft(remaining);
        
        if (remaining <= 0) {
          if (interval) clearInterval(interval);
          handleTimerComplete();
        }
      }, 1000);
    } else {
      targetTimeRef.current = null; 
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, timeLeft, mode, user]);

  useEffect(() => {
    const totalTime = mode === 'work' ? WORK_TIME : BREAK_TIME;
    const progress = ((totalTime - timeLeft) / totalTime) * 100;
    progressAnim.value = withTiming(progress, { duration: 500 });
  }, [timeLeft, mode, progressAnim]);

  const toggleTimer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (!isActive) targetTimeRef.current = Date.now() + timeLeft * 1000;
    setIsActive(!isActive);
  };
  
  const resetTimer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsActive(false);
    targetTimeRef.current = null;
    setTimeLeft(mode === "work" ? WORK_TIME : BREAK_TIME);
    progressAnim.value = withTiming(0);
  };

  const switchMode = (newMode: "work" | "break") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setMode(newMode);
    const newTime = newMode === "work" ? WORK_TIME : BREAK_TIME;
    initialTimeRef.current = newTime;
    setTimeLeft(newTime);
    setIsActive(false);
    targetTimeRef.current = null;
    progressAnim.value = withTiming(0);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleMinimize = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    minimizePomodoro(); // Aktifkan isFloating dari Zustand
  };

  const handleExit = () => {
    if (isActive) {
      Alert.alert(
        "Hentikan Sesi Fokus?", 
        "Timer masih berjalan. Sesi ini tidak akan dicatat jika dihentikan sekarang.", 
        [
          { text: "Batal", style: "cancel" },
          { text: "Hentikan", style: "destructive", onPress: () => {
              setIsActive(false);
              setTimeLeft(WORK_TIME);
              setMode("work");
              progressAnim.value = withTiming(0);
              closePomodoro(); // Tutup total, matikan isFloating
          }}
        ]
      );
    } else {
      closePomodoro(); // Tutup total, matikan isFloating
    }
  };

  const activeColor = mode === 'work' ? primaryHex : '#22c55e';

  const animatedProgressStyle = useAnimatedStyle(() => {
    return {
      width: `${progressAnim.value}%`,
      backgroundColor: activeColor,
    };
  });

  return (
    <>
      {/* ============================================================== */}
      {/* 1. WIDGET MENGAMBANG (BISA DIGESER - DRAGGABLE) */}
      {/* ============================================================== */}
      {isFloating && (
        <RNAnimated.View 
          {...panResponder.panHandlers}
          style={[
            // FIX POSISI: Menggunakan transform alih-alih pan.getLayout()
            { 
              position: 'absolute', 
              bottom: 95, 
              right: 16, 
              zIndex: 9999,
              transform: [{ translateX: pan.x }, { translateY: pan.y }] 
            }
          ]}
        >
          <TouchableOpacity 
            activeOpacity={0.9}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); openPomodoro(); }}
            className="flex-row items-center gap-3 px-4 py-3 rounded-full shadow-2xl border"
            style={{ 
              backgroundColor: isActive ? activeColor : cardBgColor,
              borderColor: isActive ? activeColor : borderColor,
              shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 10
            }}
          >
            {mode === 'work' ? <Brain color={isActive ? '#fff' : primaryHex} size={18} /> : <Coffee color={isActive ? '#fff' : '#22c55e'} size={18} />}
            <CustomText className="font-bold tabular-nums tracking-wide text-base" style={{ color: isActive ? '#fff' : textColor }}>
              {formatTime(timeLeft)}
            </CustomText>
            
            <View className="flex-row items-center gap-2 ml-1 pl-3 border-l" style={{ borderColor: isActive ? '#ffffff40' : borderColor }}>
              <TouchableOpacity onPress={toggleTimer} className="p-1">
                {isActive ? <Pause color="#fff" size={20} fill="#fff" /> : <Play color={textColor} size={20} fill={textColor} />}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </RNAnimated.View>
      )}

      {/* ============================================================== */}
      {/* 2. MODAL LAYAR PENUH (SUNGGUHAN MENTOK UJUNG KE UJUNG) */}
      {/* ============================================================== */}
      <Modal 
        visible={isOpen} 
        animationType="slide" 
        transparent={false}           
        statusBarTranslucent={true}   
        onRequestClose={handleMinimize}
      >
        <View className="flex-1 flex-col" style={{ backgroundColor: bgModeFokus }}>
          
          {/* HEADER MODAL */}
          <View className="flex-row items-center justify-between px-6 pb-6" style={{ paddingTop: insets.top + 20 }}>
            <View className="flex-row items-center gap-2">
               <CheckCircle2 color={activeColor} size={20} />
               <CustomText className="font-bold text-lg uppercase tracking-widest" style={{ color: activeColor }}>
                 Deep Work
               </CustomText>
            </View>
            <View className="flex-row gap-2">
              <TouchableOpacity onPress={handleMinimize} className="p-2 rounded-full bg-muted/50 transition-colors hover:bg-muted">
                <Minimize2 color={textColor} size={22} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleExit} className="p-2 rounded-full bg-muted/50 transition-colors hover:bg-red-500/20">
                <X color={textColor} size={22} />
              </TouchableOpacity>
            </View>
          </View>

          {/* AREA JAM TENGAH LAYAR */}
          <View className="flex-1 items-center justify-center">
            {/* Toggle Mode */}
            <View className="flex-row bg-muted/30 rounded-full p-1.5 mb-12 border border-border/50">
              <TouchableOpacity 
                onPress={() => switchMode("work")} 
                className="px-6 py-2.5 rounded-full flex-row items-center gap-2"
                style={{ backgroundColor: mode === 'work' ? primaryHex : 'transparent' }}
              >
                <Brain color={mode === 'work' ? '#fff' : mutedColor} size={16} />
                <CustomText className="font-bold text-sm" style={{ color: mode === 'work' ? '#fff' : mutedColor }}>Fokus</CustomText>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => switchMode("break")} 
                className="px-6 py-2.5 rounded-full flex-row items-center gap-2"
                style={{ backgroundColor: mode === 'break' ? '#22c55e' : 'transparent' }}
              >
                <Coffee color={mode === 'break' ? '#fff' : mutedColor} size={16} />
                <CustomText className="font-bold text-sm" style={{ color: mode === 'break' ? '#fff' : mutedColor }}>Rehat</CustomText>
              </TouchableOpacity>
            </View>

            {/* Jam Super Besar */}
            <CustomText 
              className="font-black tabular-nums tracking-tighter" 
              style={{ fontSize: width * 0.28, color: textColor, lineHeight: width * 0.3 }}
            >
              {formatTime(timeLeft)}
            </CustomText>
            <CustomText className="text-sm font-bold uppercase tracking-widest mt-2" style={{ color: mutedColor }}>
               {mode === "work" ? "Mode Kerja 25 Menit" : "Waktu Istirahat 5 Menit"}
            </CustomText>
          </View>

          {/* Progress Bar Bawah */}
          <View className="w-full h-2 bg-muted/50 relative">
            <Animated.View className="absolute top-0 left-0 bottom-0 rounded-r-full" style={animatedProgressStyle} />
          </View>

          {/* KONTROL BAWAH */}
          <View className="p-8 flex-row justify-center gap-6 items-center" style={{ paddingBottom: Math.max(insets.bottom + 20, 40) }}>
            <TouchableOpacity 
              onPress={resetTimer} 
              activeOpacity={0.7}
              className="w-16 h-16 rounded-full border items-center justify-center shadow-sm"
              style={{ borderColor: isDark ? '#27272a' : '#e4e4e7', backgroundColor: isDark ? '#18181b' : '#f4f4f5' }}
            >
              <RotateCcw color={mutedColor} size={24} />
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={toggleTimer} 
              activeOpacity={0.8}
              className="w-24 h-24 rounded-full items-center justify-center shadow-2xl"
              style={{ backgroundColor: activeColor, shadowColor: activeColor }}
            >
              {isActive ? <Pause color="#fff" size={40} fill="#fff" /> : <Play color="#fff" size={40} fill="#fff" style={{ marginLeft: 6 }} />}
            </TouchableOpacity>

            {/* Dummy space agar tombol Play ada persis di tengah */}
            <View className="w-16 h-16" />
          </View>

        </View>
      </Modal>
    </>
  );
}