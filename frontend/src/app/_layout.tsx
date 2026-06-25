import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useColorScheme, Image } from 'react-native';
import { Tabs } from 'expo-router';

import { AnimatedSplashOverlay } from '@/components/animated-icon';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <Tabs screenOptions={{ headerShown: false }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, size }) => (
              <Image 
                source={require('@/assets/images/tabIcons/home.png')} 
                style={{ width: size, height: size, tintColor: color }} 
              />
            ),
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: 'Explore',
            tabBarIcon: ({ color, size }) => (
              <Image 
                source={require('@/assets/images/tabIcons/explore.png')} 
                style={{ width: size, height: size, tintColor: color }} 
              />
            ),
          }}
        />
      </Tabs>
    </ThemeProvider>
  );
}

