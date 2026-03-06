import { Tabs } from "expo-router";
import { View } from "react-native";
import { BottomNav } from "../../components/BottomNav";

export default function TabLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Tabs 
        tabBar={(props) => <BottomNav {...props} />} 
        screenOptions={{ headerShown: false }}
      >
        <Tabs.Screen name="index" options={{ title: 'Dashboard' }} />
        <Tabs.Screen name="notes" options={{ title: 'Catatan' }} />
        <Tabs.Screen name="todo" options={{ title: 'Tugas' }} />
        <Tabs.Screen name="profile" options={{ title: 'Profil' }} />
      </Tabs>
    </View>
  );
}