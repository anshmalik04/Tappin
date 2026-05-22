import { Tabs } from 'expo-router';
import { Text, View } from 'react-native';
import { Colors } from '@/constants/Colors';

function TabIcon({ focused, icon, label }: { focused: boolean; icon: string; label: string }) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', paddingTop: 4 }}>
      <Text style={{ fontSize: 20, color: focused ? Colors.tabBarActive : Colors.tabBarInactive }}>
        {icon}
      </Text>
      <Text
        style={{
          fontSize: 10,
          fontWeight: focused ? '700' : '500',
          color: focused ? Colors.tabBarActive : Colors.tabBarInactive,
          marginTop: 2,
        }}
      >
        {label}
      </Text>
    </View>
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
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="map"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon="◉" label="Map" />,
        }}
      />
      <Tabs.Screen
        name="tonight"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon="✦" label="Tonight" />,
        }}
      />
      <Tabs.Screen
        name="chatlist"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon="◫" label="Chat" />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} icon="○" label="Me" />,
        }}
      />
    </Tabs>
  );
}
