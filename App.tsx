import React, {useEffect, useState} from 'react';
import {StatusBar, View, ActivityIndicator} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {AppProvider} from './src/context/AppContext';
import {ErrorBoundary} from './src/components/ErrorBoundary';
import {HomeScreen} from './src/screens/HomeScreen';
import {SettingsScreen} from './src/screens/SettingsScreen';
import {QiblaScreen} from './src/screens/QiblaScreen';
import {getOnboardingCompleted, initializeStorage} from './src/services/storage';
import {setupNotificationChannel} from './src/services/notifications';
import {Sunrise, Settings, Compass} from 'lucide-react-native';
import {ThemeRoot, useTheme, lightPalette} from './src/theme';
import {OnboardingScreen} from './src/features/onboarding/OnboardingScreen';

const Tab = createBottomTabNavigator();

function TabBarIcon({
  Icon,
  color,
  focused,
}: {
  Icon: typeof Sunrise;
  color: string;
  focused: boolean;
}) {
  const {palette, radius} = useTheme();

  return (
    <View
      style={{
        width: 30,
        height: 30,
        borderRadius: radius.sm,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: focused ? palette.accentSoft : 'transparent',
      }}>
      <Icon size={18} color={color} strokeWidth={focused ? 2.4 : 1.7} />
    </View>
  );
}

function AppTabs() {
  const {palette} = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.accent,
        tabBarInactiveTintColor: palette.inkSubtle,
        tabBarStyle: {
          // Kart değil, ince çizgiyle ayrılmış düz bir şerit.
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 62,
          backgroundColor: palette.background,
          borderTopWidth: 1,
          borderTopColor: palette.hairline,
          elevation: 0,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          letterSpacing: 0.1,
          marginBottom: 6,
        },
      }}>
      <Tab.Screen
        name="Vakitler"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Vakitler',
          tabBarIcon: ({color, focused}) => (
            <TabBarIcon Icon={Sunrise} color={color} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Ayarlar"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Ayarlar',
          tabBarIcon: ({color, focused}) => (
            <TabBarIcon Icon={Settings} color={color} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Kıble"
        component={QiblaScreen}
        options={{
          tabBarLabel: 'Kıble',
          tabBarIcon: ({color, focused}) => (
            <TabBarIcon Icon={Compass} color={color} focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function AppContent() {
  const {palette, isDark} = useTheme();

  useEffect(() => {
    setupNotificationChannel().catch(() => {});
  }, []);

  return (
    <NavigationContainer
        theme={{
          dark: isDark,
          colors: {
            primary: palette.accent,
            background: palette.background,
            card: palette.surface,
            text: palette.ink,
            border: palette.hairline,
            notification: palette.accent,
          },
        }}>
      <AppTabs />
    </NavigationContainer>
  );
}

/**
 * İlk açılışta onboarding, sonrasında sekmeler.
 * Konum onboarding'de seçilir; ana ekran GPS izni istemez.
 */
function AppShell() {
  const {isDark} = useTheme();
  const [onboarded, setOnboarded] = useState(getOnboardingCompleted);

  return (
    <>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      {onboarded ? (
        <AppContent />
      ) : (
        <OnboardingScreen onFinish={() => setOnboarded(true)} />
      )}
    </>
  );
}

function App(): React.JSX.Element {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initializeStorage().then(() => setReady(true));
  }, []);

  if (!ready) {
    return <BootSplash />;
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{flex: 1}}>
        <SafeAreaProvider>
          <AppProvider>
            <ThemeRoot>
              <AppShell />
            </ThemeRoot>
          </AppProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

function BootSplash() {
  // Depolama hazır değilken tema bilinmiyor; açılış her zaman kâğıt tonunda.
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: lightPalette.background,
      }}>
      <ActivityIndicator color={lightPalette.accent} />
    </View>
  );
}

export default App;
