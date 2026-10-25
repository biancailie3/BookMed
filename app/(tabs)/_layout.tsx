import { Tabs } from 'expo-router';
import { Text } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#0a7ea4', headerShown: true }}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Medici & Specializări',
          tabBarIcon: () => <Text style={{ fontSize: 18 }}>🩺</Text>,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profilul Meu',
          tabBarIcon: () => <Text style={{ fontSize: 18 }}>👤</Text>,
        }}
      />
    </Tabs>
  );
}