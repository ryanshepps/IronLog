import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ExercisesScreen from "@/screens/ExercisesScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type ExercisesStackParamList = {
  Exercises: undefined;
};

const Stack = createNativeStackNavigator<ExercisesStackParamList>();

export default function ExercisesStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Exercises"
        component={ExercisesScreen}
        options={{
          headerTitle: "Exercises",
        }}
      />
    </Stack.Navigator>
  );
}
