import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LogScreen from "@/screens/LogScreen";
import { HeaderTitle } from "@/components/HeaderTitle";
import { useScreenOptions } from "@/hooks/useScreenOptions";

export type LogStackParamList = {
  Log: undefined;
};

const Stack = createNativeStackNavigator<LogStackParamList>();

export default function LogStackNavigator() {
  const screenOptions = useScreenOptions();

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Log"
        component={LogScreen}
        options={{
          headerTitle: () => <HeaderTitle title="Today's Workout" />,
        }}
      />
    </Stack.Navigator>
  );
}
