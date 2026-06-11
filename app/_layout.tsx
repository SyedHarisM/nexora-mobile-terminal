import { Stack } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import React, { createContext, useContext, useEffect, useState } from 'react';

export interface AuthProps {
  signIn: (token: string) => void;
  signOut: () => void;
  userToken: string | null;
}

const AuthContext = createContext<AuthProps | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

// ─── GLOBAL THEME CONTEXT SETUP ───────────────────
export type ThemeType = 'NEXORA_DARK' | 'AMETHYST_NEON' | 'VIBRANT_CYAN';

const ThemeContext = createContext<{
  activeTheme: ThemeType;
  setTheme: (theme: ThemeType) => void;
}>({
  activeTheme: 'NEXORA_DARK',
  setTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export default function RootLayout() {
  const [userToken, setUserToken] = useState<string | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [activeTheme, setActiveTheme] = useState<ThemeType>('NEXORA_DARK');

  useEffect(() => {
    const loadToken = async () => {
        try {
            console.log("LOG: Core framework authentication token pulling active...");
            
            // Safe extraction calls
            const token = await SecureStore.getItemAsync('userToken'); 
            const userData = await SecureStore.getItemAsync('userData');
            const savedTheme = await SecureStore.getItemAsync('setting_theme');

            if (token) {
                console.log("LOG: Access token validated successfully.");
                setUserToken(token); // Update token state matrix
            } else {
                console.log("LOG: No active token found, routing to guest flow.");
            }

            if (savedTheme) {
                console.log("LOG: Restoring saved app theme:", savedTheme);
                setActiveTheme(savedTheme as ThemeType);
            }
        } catch (error) {
            console.error("CRITICAL: Root token registry fetching pipeline crashed:", error);
        } finally {
            // FIRE AUTH MATRIX: Is pipeline release call se white screen instant khatam hogi
            setIsAuthReady(true);
        }
    };

    loadToken();
  }, []);

  const updateTheme = async (theme: ThemeType) => {
    setActiveTheme(theme);
    await SecureStore.setItemAsync('setting_theme', theme);
  };

  const authContext: AuthProps = {
    signIn: async (token) => {
      try {
        await SecureStore.setItemAsync('userToken', token);
        setUserToken(token);
      } catch (e) {
        console.error("Login session write crash:", e);
      }
    },
    signOut: async () => {
      console.log("DASHBOARD: Clearing session...");
      try {
        await SecureStore.deleteItemAsync('userToken');
        await SecureStore.deleteItemAsync('userData');
        await SecureStore.deleteItemAsync('user_avatar_local');
        await SecureStore.deleteItemAsync('setting_theme'); // Reset theme on logout
        setUserToken(null); 
      } catch (e) {
        console.error("Session termination cleanup crash:", e);
      }
    },
    userToken,
  };

  // Safe layout lifecycle render bypass gate
  if (!isAuthReady) return null;

  return (
    <AuthContext.Provider value={authContext}>
      <ThemeContext.Provider value={{ activeTheme, setTheme: updateTheme }}>
        {/* 🔑 Stack Key: Reset state on auth changes */}
        <Stack key={userToken ? 'authenticated' : 'guest'} screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" /> 
          <Stack.Screen name="signup" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="history" options={{ presentation: 'modal' }} />
          <Stack.Screen name="transfer" options={{ presentation: 'modal' }} />
          <Stack.Screen name="withdraw" options={{ presentation: 'modal' }} />
        </Stack>
      </ThemeContext.Provider>
    </AuthContext.Provider>
  );
}