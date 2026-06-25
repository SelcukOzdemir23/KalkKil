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
import {initializeStorage} from './src/services/storage';
import {setupNotificationChannel} from './src/services/notifications';
import {Sunrise, Settings, Compass} from 'lucide-react-native';
import {colors} from './src/theme/tokens';
import './global.css';

const Tab = createBottomTabNavigator();

function TabBarIcon({Icon, color, focused}: {Icon: typeof Sunrise; color: string; focused: boolean}) {
  return (
    <View
      style={{
        width: 32,
        height: 32,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: focused ? colors.accentSoft : 'transparent',
      }}>
      <Icon size={18} color={color} strokeWidth={focused ? 2.6 : 1.8} />
    </View>
  );
}

function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          position: 'absolute',
          bottom: 14,
          left: 14,
          right: 14,
          height: 60,
          borderRadius: 20,
          backgroundColor: colors.surfaceSoft,
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: colors.border,
          elevation: 24,
          shadowColor: colors.background,
          shadowOffset: {width: 0, height: 8},
          shadowOpacity: 0.28,
          shadowRadius: 24,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '700',
          marginTop: 2,
          marginBottom: 4,
          letterSpacing: 0.3,
        },
        tabBarIconStyle: {
          marginTop: 2,
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
  useEffect(() => {
    setupNotificationChannel().catch(() => {});
  }, []);

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <NavigationContainer
        theme={{
          dark: true,
          colors: {
            primary: colors.accent,
            background: colors.background,
            card: colors.surface,
            text: colors.text,
            border: colors.border,
            notification: colors.accent,
          },
        }}>
        <AppTabs />
      </NavigationContainer>
    </>
  );
}

function App(): React.JSX.Element {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initializeStorage().then(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background}}>
        <View style={{width: 52, height: 52, borderRadius: 26, borderWidth: 2, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center'}}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{flex: 1}}>
        <SafeAreaProvider>
          <AppProvider>
            <AppContent />
          </AppProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

export default App;
