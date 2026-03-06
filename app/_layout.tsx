import { Stack } from "expo-router"; // <-- Menggunakan Stack lebih stabil dari Slot
import { StatusBar } from "expo-status-bar";
import { LogBox } from "react-native";
import { ThemeProvider } from "../components/ThemeProvider";
import { PomodoroTimer } from "../components/todo/pomodoro-timer";
import { ChatWidget } from "../components/ui/chat-widget"; // <-- IMPORT CHAT WIDGET
import "../global.css";
import { AuthProvider } from "../lib/auth-context";

// =====================================================================
// MEMBUNGKAM WARNING EXPO GO (SDK 53)
// Cukup gunakan LogBox. Jangan pernah menimpa (override) console.error 
// karena bisa merusak sistem React Navigation saat aplikasi me-render ulang!
// =====================================================================
LogBox.ignoreLogs([
  'expo-notifications: Android Push notifications',
  'Android Push notifications (remote notifications)'
]);

export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <StatusBar style="auto" />
        
        {/* Menggunakan Stack agar Navigation Context terjamin aman di seluruh aplikasi */}
        <Stack screenOptions={{ headerShown: false }} /> 
        
        {/* Pomodoro Global: Di-mount di lapisan terluar aplikasi agar tidak pernah hilang! */}
        <PomodoroTimer />

        {/* Asisten AI Global: Di-mount di lapisan terluar agar melayang di semua halaman */}
        <ChatWidget />
        
      </ThemeProvider>
    </AuthProvider>
  );
}