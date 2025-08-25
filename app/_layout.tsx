import "../polyfills";
import "react-native-reanimated";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as Linking from "expo-linking";

import { AbstraxionProvider } from "@burnt-labs/abstraxion-react-native";
import { redirectHandler } from "../utils/redirectHandler";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Create a development-friendly callback URL
const createCallbackUrl = () => {
  // For web development, always use the window location
  if (typeof window !== 'undefined') {
    const currentUrl = `${window.location.protocol}//${window.location.host}`;
    console.log('Web callback URL:', currentUrl);
    return currentUrl;
  }

  // For native apps, use the proper deep link scheme
  const baseUrl = Linking.createURL("/");
  console.log('Native callback URL:', baseUrl);

  // Handle the exp:// URLs properly for native
  if (baseUrl.includes('exp://')) {
    return 'skillexify://auth';
  }

  return baseUrl;
};

const callbackUrl = createCallbackUrl();
console.log('Abstraxion callback URL configured:', callbackUrl);

const treasuryConfig = {
  treasury:
    process.env.EXPO_PUBLIC_TREASURY_CONTRACT_ADDRESS ||
    "xion1daqyfnak98wry0grw5vnk9r2rfwpksv4hl53yj537vstmghayc9suzkdq8",
  gasPrice: "0.001uxion",
  rpcUrl:
    process.env.EXPO_PUBLIC_RPC_ENDPOINT ||
    "https://rpc.xion-testnet-2.burnt.com:443",
  restUrl:
    process.env.EXPO_PUBLIC_REST_ENDPOINT ||
    "https://api.xion-testnet-2.burnt.com",
  // Use properly configured callback URL
  callbackUrl: callbackUrl,
  // Additional configuration for better Web3 support
  stake: false,
  bank: ["uxion"],
  // Add user map contract for proper authentication
  userMapContract: process.env.EXPO_PUBLIC_USER_MAP_CONTRACT_ADDRESS,
  // Enable authentication features
  enableAuthentication: true,
};

export default function RootLayout() {
  const colorScheme: "light" | "dark" = "dark"; // Using dark theme for retro-futuristic look
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }

    // Initialize redirect handler for Abstraxion callbacks
    redirectHandler.addListener((url) => {
      console.log('Redirect handler received URL:', url);
      // The redirect handler will manage the callback automatically
    });

    return () => {
      // Cleanup if needed
    };
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AbstraxionProvider config={treasuryConfig}>
      <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="+not-found" />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </AbstraxionProvider>
  );
}
