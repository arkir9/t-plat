module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      // Required for react-native-reanimated (if you add it later)
      // 'react-native-reanimated/plugin',
    ],
  };
};
