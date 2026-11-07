import React, {useEffect, useState} from 'react';
import {StatusBar, View, ActivityIndicator, Pressable} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {NavigationContainer} from '@react-navigation/native';
import {
  BottomTabBarProps,
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';
import {SafeAreaProvider, useSafeAreaInsets} from 'react-native-safe-area-context';
import {AppProvider} from './src/context/AppContext';
import {ErrorBoundary} from './src/components/ErrorBoundary';
import {HomeScreen} from './src/screens/HomeScreen';
import {SettingsScreen} from './src/screens/SettingsScreen';
import {QiblaScreen} from './src/screens/QiblaScreen';
import {getOnboardingCompleted, initializeStorage} from './src/services/storage';
import {setupNotificationChannel} from './src/services/notifications';
import {ThemeRoot, useTheme, lightPalette} from './src/theme';
import {Text} from './src/ui/Text';
import {OnboardingScreen} from './src/features/onboarding/OnboardingScreen';

const Tab = createBottomTabNavigator();

/**
 * Alt gezinme — ikonsuz.
 *
 * Üç sekme için üç ikon, birbirinden ayırt edilmesi zor ve süs görevi gören
 * çizimlerdi. Yerine üç sütun metin: seçili sekme vurgu renginde ve üstünde
 * ince bir vurgu çizgisi var. Sekme adları etiket ölçeğinde (mono, büyük harf),
 * yani aletin diğer etiketleriyle aynı dil.
 */
const TAB_LABELS: Record<string, string> = {
  Vakitler: 'Vakitler',
  Kible: 'Kıble',
  Ayarlar: 'Ayarlar',
};

function TabBar({state, navigation}: BottomTabBarProps) {
  const {palette} = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: palette.background,
        borderTopWidth: 1,
        borderTopColor: palette.hairline,
        paddingBottom: insets.bottom,
      }}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const label = TAB_LABELS[route.name] ?? route.name;

        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityState={{selected: focused}}
            accessibilityLabel={label}
            onPress={() => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            }}
            style={({pressed}) => ({
              flex: 1,
              paddingVertical: 16,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.6 : 1,
            })}>
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 2,
                backgroundColor: focused ? palette.accent : 'transparent',
              }}
            />
            <Text variant="label" tone={focused ? 'accent' : 'muted'}>
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function AppTabs() {
  return (
    <Tab.Navigator
      tabBar={props => <TabBar {...props} />}
      screenOptions={{headerShown: false}}>
      <Tab.Screen name="Vakitler" component={HomeScreen} />
      <Tab.Screen name="Kible" component={QiblaScreen} />
      <Tab.Screen name="Ayarlar" component={SettingsScreen} />
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
