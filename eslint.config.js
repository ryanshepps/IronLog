// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");
const eslintPluginPrettierRecommended = require("eslint-plugin-prettier/recommended");

const expoConfigWithoutReactRules = expoConfig.map((config) => ({
  ...config,
  rules: Object.fromEntries(
    Object.entries(config.rules ?? {}).filter(
      ([rule]) => !rule.startsWith("react/"),
    ),
  ),
}));

module.exports = defineConfig([
  expoConfigWithoutReactRules,
  eslintPluginPrettierRecommended,
  {
    ignores: ["dist/**", "static-build/**", ".expo/**"],
    rules: {
      "react-hooks/immutability": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
]);
