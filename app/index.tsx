import { Redirect } from "expo-router";

export default function Index() {
  // Langsung arahkan ke folder (tabs)
  return <Redirect href="/(tabs)" />;
}