import { Colors } from '@/constants/Colors';
import { Tabs } from 'expo-router';
import { Text } from 'react-native';

function TabIcon({ focused, icon }: { focused: boolean; icon: string }) {
  return (
    <Text style={{ fontSize: 20, color: focused ? Colors.tabBarActive : Colors.tabBarInactive }}>
      {icon}
    </Text>
  );
}

function TabLabel({ focused, label }: { focused: boolean; label: string }) {
  return (
    <Text
      numberOfLines={1}
      style={{
        fontSize: 10,
        fontWeight: focused ? '700' : '500',
        color: focused ? Colors.tabBarActive : Colors.tabBarInactive,
        marginTop: 2,
      }}
    >
      {label}
    </Text>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.tabBar,
          borderTopColor: Colors.tabBarBorder,
          borderTopWidth: 1,
          height: 80,
          paddingBottom: 16,
          paddingTop: 6,
        },
      }}
    >
      <Tabs.Screen
        name="map"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon="◉" />,
          tabBarLabel: ({ focused }) => <TabLabel focused={focused} label="Map" />,
        }}
      />
      <Tabs.Screen
        name="tonight"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon="✦" />,
          tabBarLabel: ({ focused }) => <TabLabel focused={focused} label="Tonight" />,
        }}
      />
      <Tabs.Screen
        name="people"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon="✌" />,
          tabBarLabel: ({ focused }) => <TabLabel focused={focused} label="People" />,
        }}
      />
      <Tabs.Screen
        name="chatlist"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon="◫" />,
          tabBarLabel: ({ focused }) => <TabLabel focused={focused} label="Matches" />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon="○" />,
          tabBarLabel: ({ focused }) => <TabLabel focused={focused} label="Me" />,
        }}
      />
    </Tabs>
  );
}