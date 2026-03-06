import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { arrayUnion, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { AlertTriangle, Bell, BellRing, CalendarClock, Check, Heart, Info, Menu, MessageSquareQuote } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Appearance, Image, Modal, ScrollView, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettings } from '../hooks/use-settings';
import { useAuth } from '../lib/auth-context';
import { db } from '../lib/firebase';
import { getUserNotes } from '../lib/notes-service';
import { CustomText } from './ui/custom-text';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true, 
    shouldShowList: true,   
  }),
});

// ======================================================
// HOOK ANIMASI HEADER (Bisa dipakai di layar mana saja)
// ======================================================
export function useHeaderAnimation() {
  const lastOffsetY = useRef(0);
  const isHeaderVisible = useRef(true);
  const headerTranslateY = useRef(new Animated.Value(0)).current;

  const handleScroll = (e: any) => {
    const currentOffset = e.nativeEvent.contentOffset.y;
    if (currentOffset <= 0) return; // Abaikan pantulan (bounce) iOS di atas

    // Scroll ke bawah > 60px -> Sembunyikan
    if (currentOffset > lastOffsetY.current && currentOffset > 60) {
      if (isHeaderVisible.current) {
        isHeaderVisible.current = false;
        Animated.timing(headerTranslateY, {
          toValue: -150, // Geser ke atas keluar layar
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
    } 
    // Scroll ke atas sedikit -> Langsung munculkan
    else if (currentOffset < lastOffsetY.current - 5) {
      if (!isHeaderVisible.current) {
        isHeaderVisible.current = true;
        Animated.timing(headerTranslateY, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }).start();
      }
    }
    lastOffsetY.current = currentOffset;
  };

  return { headerTranslateY, handleScroll };
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: "overdue" | "today";
  todoId: string;
}

const accentColors: Record<string, string> = {
  default: '#9333ea', blue: '#3b82f6', emerald: '#10b981',
  amber: '#f59e0b', orange: '#f97316', rose: '#f43f5e', violet: '#8b5cf6',
};

interface HeaderProps {
  translateY?: Animated.Value; // Menerima prop animasi
}

export function Header({ translateY }: HeaderProps) {
  const { user } = useAuth();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark' || ((colorScheme as any) === 'system' && Appearance.getColorScheme() === 'dark');
  const cardBgColor = isDark ? '#18181b' : '#ffffff';
  const borderColor = isDark ? '#27272a' : '#e4e4e7';
  const textColor = isDark ? '#ffffff' : '#09090b';
  const mutedColor = isDark ? '#a1a1aa' : '#71717a';

  const { colorAccent } = useSettings();
  const primaryHex = accentColors[colorAccent] || accentColors.default;

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [readNotifs, setReadNotifs] = useState<string[]>([]); 

  const [pushStatus, setPushStatus] = useState<Notifications.PermissionStatus>(Notifications.PermissionStatus.UNDETERMINED);

  useEffect(() => {
    const loadLocalData = async () => {
      try {
        const stored = await AsyncStorage.getItem('nexa_read_notifs');
        if (stored) setReadNotifs(JSON.parse(stored));

        try {
          const { status } = await Notifications.getPermissionsAsync();
          setPushStatus(status);
        } catch (err) {
          console.log("Expo Go restriction on permissions:", err);
        }
      } catch (e) { console.error(e); }
    };
    loadLocalData();
  }, []);

  useEffect(() => {
    if (!user) return;
    const syncReadNotifications = async () => {
      try {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          if (data.readNotifications && Array.isArray(data.readNotifications)) {
            setReadNotifs(prev => {
              const combined = Array.from(new Set([...prev, ...data.readNotifications]));
              AsyncStorage.setItem('nexa_read_notifs', JSON.stringify(combined));
              return combined;
            });
          }
        }
      } catch (error) {
        console.error("Gagal sinkronisasi data notifikasi", error);
      }
    };
    syncReadNotifications();
  }, [user]);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return setNotifications([]);
      try {
        const notes = await getUserNotes(user.uid);
        const todos = notes.filter((n: any) => n.isTodo && !n.isCompleted && n.dueDate);
        
        const today = new Date();
        const offset = today.getTimezoneOffset() * 60000;
        const todayStr = (new Date(today.getTime() - offset)).toISOString().split('T')[0];

        const newNotifs: NotificationItem[] = [];

        todos.forEach((todo: any) => {
          const notifId = `notif-${todo.id}-${todayStr}`;
          if (todo.dueDate < todayStr) {
            newNotifs.push({ id: notifId, title: "Tugas Terlewat!", message: `Tugas "${todo.title}" sudah melewati tenggat waktu.`, type: "overdue", todoId: todo.id });
          } else if (todo.dueDate === todayStr) {
            newNotifs.push({ id: notifId, title: "Tenggat Hari Ini", message: `Jangan lupa selesaikan tugas "${todo.title}" hari ini.`, type: "today", todoId: todo.id });
          }
        });

        setNotifications(newNotifs);

        if (pushStatus === 'granted' && newNotifs.length > 0) {
          const lastPushed = await AsyncStorage.getItem('nexa_last_push_date');
          if (lastPushed !== todayStr) {
            let useSound = true;
            try {
              const userRef = doc(db, "users", user.uid);
              const userSnap = await getDoc(userRef);
              if (userSnap.exists() && userSnap.data().vibrationEnabled === false) {
                useSound = false; 
              }
            } catch (e) {
              console.error("Gagal membaca setting getaran");
            }

            try {
              await Notifications.scheduleNotificationAsync({
                content: {
                  title: "Pengingat Nexa",
                  body: `Kamu punya ${newNotifs.length} tugas penting yang menunggumu hari ini!`,
                  sound: useSound,
                },
                trigger: null,
              });
              await AsyncStorage.setItem('nexa_last_push_date', todayStr);
            } catch (err) {
              console.log("Local push notification failed:", err);
            }
          }
        }

      } catch (error) {
        console.error("Gagal memuat notifikasi", error);
      }
    };
    
    if (!isNotifOpen) {
       fetchNotifications();
    }
  }, [user, isNotifOpen, pushStatus]);

  const handleNotifClick = async (notifId: string, todoId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsNotifOpen(false);
    
    if (!readNotifs.includes(notifId)) {
      const updatedReadNotifs = [...readNotifs, notifId];
      setReadNotifs(updatedReadNotifs);
      await AsyncStorage.setItem('nexa_read_notifs', JSON.stringify(updatedReadNotifs));

      if (user) {
        try {
          const userRef = doc(db, "users", user.uid);
          await updateDoc(userRef, { readNotifications: arrayUnion(notifId) });
        } catch (error: any) {
          if (error.code === 'not-found') {
            await setDoc(doc(db, "users", user.uid), { readNotifications: [notifId] }, { merge: true });
          }
        }
      }
    }
    router.push(`/edit-todo/${todoId}` as any);
  };

  const handleRequestPushPermission = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      setPushStatus(status);

      if (status === 'granted') {
         Alert.alert("Berhasil", "Notifikasi sistem berhasil diaktifkan!");
      } else {
         Alert.alert("Izin Ditolak", "Kamu menolak izin notifikasi.");
      }
    } catch (err) {
      Alert.alert("Info", "Fungsi ini dibatasi di lingkungan simulasi.");
    }
  };

  const unreadCount = notifications.filter(n => !readNotifs.includes(n.id)).length;

  return (
    <>
      <Animated.View 
        style={[
          { 
            paddingTop: insets.top,
            backgroundColor: isDark ? 'rgba(24, 24, 27, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            borderBottomWidth: 1,
            borderBottomColor: `${borderColor}80`,
            zIndex: 50,
          },
          // Jika translateY dioper, jadikan Header mengambang (Absolute)
          translateY ? {
            position: 'absolute',
            top: 0, left: 0, right: 0,
            transform: [{ translateY }]
          } : {}
        ]}
      >
        <View className="flex-row items-center justify-between px-5 py-3">
          
          <View className="flex-row items-center gap-3">
            {/* FIX: LOGO DENGAN BACKGROUND TRANSLUCENT DINAMIS */}
            <View 
              className="w-10 h-10 items-center justify-center rounded-[12px] border"
              style={{ backgroundColor: `${primaryHex}15`, borderColor: `${primaryHex}30` }}
            >
              <Image 
                source={require('../assets/images/icon.png')} 
                style={{ width: '70%', height: '70%' }} 
                resizeMode="contain" 
              />
            </View>
            <CustomText className="font-black text-3xl tracking-tight" style={{ color: textColor }}>Nexa</CustomText>
          </View>

          <View className="flex-row items-center">
            {/* FIX: ICON MENU BURGER DENGAN INDIKATOR NOTIFIKASI */}
            <TouchableOpacity 
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setIsMenuOpen(true); }} 
              className="p-2 rounded-full relative"
            >
              <Menu color={textColor} size={28} strokeWidth={2.5} />
              
              {/* Titik Merah Notifikasi */}
              {user && unreadCount > 0 && (
                <View 
                  className="absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-red-500 rounded-full border-2" 
                  style={{ borderColor: isDark ? '#18181b' : '#ffffff' }} 
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      {/* MODAL MENU PENGATURAN & NOTIFIKASI */}
      <Modal visible={isMenuOpen} transparent animationType="fade">
        <TouchableOpacity activeOpacity={1} onPress={() => setIsMenuOpen(false)} className="flex-1 bg-black/50 justify-start items-end pt-[70px] pr-4">
          <TouchableOpacity activeOpacity={1} className="w-64 rounded-3xl shadow-2xl border p-2" style={{ backgroundColor: cardBgColor, borderColor }}>
            <CustomText className="text-[10px] font-bold uppercase tracking-widest px-4 py-3" style={{ color: mutedColor }}>Menu Nexa</CustomText>
            
            {/* OPSI NOTIFIKASI */}
            {user && (
              <TouchableOpacity 
                onPress={() => { 
                  setIsMenuOpen(false); 
                  setTimeout(() => setIsNotifOpen(true), 150); // Buka modal notif setelah menu tertutup
                }} 
                className="flex-row items-center justify-between p-3.5 rounded-2xl mb-1 border" 
                style={{ backgroundColor: isDark ? '#27272a50' : '#f4f4f5', borderColor: unreadCount > 0 ? `${primaryHex}50` : 'transparent' }}
              >
                <View className="flex-row items-center">
                  {unreadCount > 0 ? <BellRing color={primaryHex} size={20} /> : <Bell color={textColor} size={20} />}
                  <CustomText className="ml-3 font-bold text-sm" style={{ color: textColor }}>Notifikasi</CustomText>
                </View>
                {unreadCount > 0 && (
                  <View className="bg-red-500 px-2.5 py-0.5 rounded-full">
                    <CustomText className="text-[10px] font-bold text-white">{unreadCount}</CustomText>
                  </View>
                )}
              </TouchableOpacity>
            )}
            
            <View className="w-full h-px bg-border/50 my-1" />

            <TouchableOpacity onPress={() => { setIsMenuOpen(false); router.push('/about' as any); }} className="flex-row items-center p-3.5 rounded-2xl mb-1" style={{ backgroundColor: 'transparent' }}>
              <Info color="#3b82f6" size={20} />
              <CustomText className="ml-3 font-bold text-sm" style={{ color: textColor }}>Tentang Aplikasi</CustomText>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => { setIsMenuOpen(false); router.push('/feedback' as any); }} className="flex-row items-center p-3.5 rounded-2xl mb-1" style={{ backgroundColor: 'transparent' }}>
              <MessageSquareQuote color="#22c55e" size={20} />
              <CustomText className="ml-3 font-bold text-sm" style={{ color: textColor }}>Kirim Masukan</CustomText>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => { setIsMenuOpen(false); router.push('/funding' as any); }} className="flex-row items-center p-3.5 rounded-2xl mt-1 bg-rose-500/10">
              <Heart color="#f43f5e" size={20} />
              <CustomText className="ml-3 font-bold text-sm text-rose-500">Dukung Nexa</CustomText>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* MODAL NOTIFIKASI (DIBUKA DARI MENU) */}
      <Modal visible={isNotifOpen} transparent animationType="fade">
        <TouchableOpacity activeOpacity={1} onPress={() => setIsNotifOpen(false)} className="flex-1 bg-black/60 justify-center items-center p-4">
          <TouchableOpacity activeOpacity={1} className="w-full max-w-sm max-h-[70%] rounded-[2rem] shadow-2xl overflow-hidden border" style={{ backgroundColor: cardBgColor, borderColor }}>
            <View className="px-5 py-4 border-b flex-row items-center justify-between bg-muted/20" style={{ borderColor: `${borderColor}50` }}>
              <CustomText className="font-black text-lg" style={{ color: textColor }}>Notifikasi</CustomText>
              {unreadCount > 0 && (
                <View className="bg-red-500/10 px-2.5 py-1 rounded-full">
                  <CustomText className="text-[10px] font-bold text-red-500 uppercase tracking-widest">{unreadCount} Baru</CustomText>
                </View>
              )}
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {notifications.length === 0 ? (
                <View className="p-10 items-center">
                  <Check color={mutedColor} size={32} style={{ opacity: 0.3, marginBottom: 12 }} />
                  <CustomText className="text-sm font-medium text-center" style={{ color: mutedColor }}>Semua tugas aman terkendali!</CustomText>
                </View>
              ) : (
                notifications.map((notif) => {
                  const isRead = readNotifs.includes(notif.id);
                  return (
                    <TouchableOpacity 
                      key={notif.id} 
                      onPress={() => handleNotifClick(notif.id, notif.todoId)}
                      className={`flex-row items-start gap-3 p-4 border-b transition-colors`}
                      style={{ borderColor: `${borderColor}50`, backgroundColor: isRead ? 'transparent' : (isDark ? '#27272a40' : '#f4f4f5') }}
                    >
                      {!isRead && <View className="absolute left-2 top-6 w-1.5 h-1.5 bg-red-500 rounded-full" />}
                      <View className={`p-2.5 rounded-xl ml-1 ${notif.type === 'overdue' ? 'bg-red-500/10' : 'bg-orange-500/10'}`}>
                        {notif.type === 'overdue' ? <AlertTriangle color="#ef4444" size={18} /> : <CalendarClock color="#f97316" size={18} />}
                      </View>
                      <View className="flex-1 pr-2">
                        <CustomText className={`text-sm font-bold mb-0.5 ${notif.type === 'overdue' ? 'text-red-500' : 'text-orange-500'}`}>{notif.title}</CustomText>
                        <CustomText className="text-xs leading-relaxed" style={{ color: mutedColor }}>{notif.message}</CustomText>
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>

            {pushStatus !== 'granted' && (
              <View className="p-3 bg-blue-500/5 border-t" style={{ borderColor: `${borderColor}50` }}>
                <TouchableOpacity onPress={handleRequestPushPermission} className="w-full h-10 bg-blue-600 rounded-xl flex-row items-center justify-center shadow-sm">
                  <BellRing color="#fff" size={14} style={{ marginRight: 8 }} />
                  <CustomText className="text-xs font-bold text-white">Aktifkan Notifikasi HP</CustomText>
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

    </>
  );
}