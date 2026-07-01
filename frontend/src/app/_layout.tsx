import { NeoOutdoors } from '@/constants/neo-outdoors';
import { Text, View, type ColorValue } from 'react-native';
import { Tabs } from 'expo-router';
import { AuthSessionProvider } from '@/context/AuthSessionContext';

export default function TabLayout() {
  return (
    <AuthSessionProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: NeoOutdoors.color.deepCyan,
          tabBarInactiveTintColor: NeoOutdoors.color.slateMuted,
          tabBarStyle: {
            backgroundColor: NeoOutdoors.color.white,
            borderTopColor: NeoOutdoors.color.line,
            height: 68,
            paddingBottom: NeoOutdoors.space.sm,
            paddingTop: NeoOutdoors.space.sm,
            shadowColor: NeoOutdoors.color.ink,
            shadowOffset: { width: 0, height: -8 },
            shadowOpacity: 0.08,
            shadowRadius: 18,
            elevation: 12,
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '800',
            letterSpacing: 0,
          },
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Journey',
            tabBarIcon: ({ color, focused }) => <TabGlyph label="J" color={color} focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="moments"
          options={{
            title: 'Moments',
            tabBarIcon: ({ color, focused }) => <TabGlyph label="M" color={color} focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="my-path"
          options={{
            title: 'My Path',
            tabBarIcon: ({ color, focused }) => <TabGlyph label="P" color={color} focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="compass"
          options={{
            title: 'Compass',
            tabBarIcon: ({ color, focused }) => <TabGlyph label="C" color={color} focused={focused} />,
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

function TabGlyph({ label, color, focused }: { label: string; color: ColorValue; focused: boolean }) {
  return (
    <View
      style={{
        alignItems: 'center',
        backgroundColor: focused ? NeoOutdoors.color.cyanWash : 'transparent',
        borderColor: focused ? NeoOutdoors.color.electricCyan : 'transparent',
        borderRadius: NeoOutdoors.radius.chip,
        borderWidth: 1,
        height: 26,
        justifyContent: 'center',
        minWidth: 30,
        paddingHorizontal: NeoOutdoors.space.xs,
      }}>
      <Text
        style={{
          color,
          fontSize: 13,
          fontStyle: focused ? 'italic' : 'normal',
          fontWeight: '900',
          letterSpacing: 0,
        }}>
        {label}
      </Text>
    </View>
  );
}
