import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: Platform.select({
          ios: {
            // Use a transparent background on iOS to show the blur effect
            position: 'absolute',
          },
          default: {},
        }),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <TabBarIcon name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="two"
        options={{
          title: 'Community',
          tabBarIcon: ({ color }) => <TabBarIcon name="person.2.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}

function TabBarIcon(props: {
  name: string;
  color: string;
}) {
  return (
    <></>
  );
}
