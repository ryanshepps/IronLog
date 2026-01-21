import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import FavoritesScreen from "@/screens/FavoritesScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type FavoritesStackParamList = {
  Favorites: undefined;
};

const Stack = createNativeStackNavigator<FavoritesStackParamList>();

export default function FavoritesStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{
          headerTitle: "Favorites",
        }}
      />
    </Stack.Navigator>
  );
}
