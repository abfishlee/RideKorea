import { Text, type ColorValue } from 'react-native';
import { Tabs } from 'expo-router';
import { AuthSessionProvider } from '@/context/AuthSessionContext';

export default function TabLayout() {
  return (
    <AuthSessionProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#1E3A8A',
          tabBarInactiveTintColor: '#64748B',
          tabBarStyle: {
            borderTopColor: '#E2E8F0',
            height: 64,
            paddingBottom: 8,
            paddingTop: 8,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '700',
          },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Journey',
            tabBarIcon: ({ color }) => <TabGlyph label="J" color={color} />,
          }}
        />
        <Tabs.Screen
          name="moments"
          options={{
            title: 'Moments',
            tabBarIcon: ({ color }) => <TabGlyph label="M" color={color} />,
          }}
        />
        <Tabs.Screen
          name="my-path"
          options={{
            title: 'My Path',
            tabBarIcon: ({ color }) => <TabGlyph label="P" color={color} />,
          }}
        />
        <Tabs.Screen
          name="compass"
          options={{
            title: 'Compass',
            tabBarIcon: ({ color }) => <TabGlyph label="C" color={color} />,
          }}
        />
        <Tabs.Screen
          name="routes/[id]"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="journeys/[id]"
          options={{
            href: null,
          }}
        />
        <Tabs.Screen
          name="shared-routes/[id]"
          options={{
            href: null,
          }}
        />
      </Tabs>
    </AuthSessionProvider>
  );
}

function TabGlyph({ label, color }: { label: string; color: ColorValue }) {
  return (
    <Text style={{ color, fontSize: 13, fontWeight: '900' }}>
      {label}
    </Text>
  );
}
