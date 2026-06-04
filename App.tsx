import React, {useEffect, useState} from 'react';
import {StatusBar, View, ActivityIndicator} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {NavigationContainer} from '@react-navigation/native';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {AppProvider, useAppContext} from './src/context/AppContext';
import {ErrorBoundary} from './src/components/ErrorBoundary';
import {GlassView} from './src/components/GlassView';
import {HomeScreen} from './src/screens/HomeScreen';
import {SettingsScreen} from './src/screens/SettingsScreen';
import {initializeStorage} from './src/services/storage';
import {setupNotificationChannel} from './src/services/notifications';
import {Sunrise, Settings} from 'lucide-react-native';
import './global.css';

const Tab = createBottomTabNavigator();

function TabBarIcon({Icon, color, focused}: {Icon: typeof Sunrise; color: string; focused: boolean}) {
  return (
    <View style={{
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: focused ? 'rgba(0, 212, 255, 0.15)' : 'transparent',
    }}>
      <Icon size={22} color={color} strokeWidth={focused ? 2.5 : 1.8} />
    </View>
  );
}

function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#00D4FF',
        tabBarInactiveTintColor: 'rgba(255, 255, 255, 0.3)',
        tabBarStyle: {
          position: 'absolute',
          bottom: 20,
          left: 16,
          right: 16,
          height: 66,
          borderRadius: 22,
          backgroundColor: '#0D111F',
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: 'rgba(0, 212, 255, 0.1)',
          elevation: 16,
          shadowColor: '#00D4FF',
          shadowOffset: {width: 0, height: 4},
          shadowOpacity: 0.12,
          shadowRadius: 24,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 0,
          marginBottom: 4,
        },
        tabBarIconStyle: {
          marginTop: 4,
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
    </Tab.Navigator>
  );
}

function AppContent() {
  useEffect(() => {
    setupNotificationChannel();
  }, []);

  return (
    <>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />
      <NavigationContainer
        theme={{
          dark: true,
          colors: {
            primary: '#00D4FF',
            background: '#0A0E1A',
            card: 'rgba(255, 255, 255, 0.05)',
            text: '#FFFFFF',
            border: 'rgba(255, 255, 255, 0.1)',
            notification: '#00D4FF',
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
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0A0E1A'}}>
        <View style={{width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: 'rgba(0, 212, 255, 0.3)', alignItems: 'center', justifyContent: 'center'}}>
          <ActivityIndicator size="large" color="#00D4FF" />
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
