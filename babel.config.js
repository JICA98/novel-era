module.exports = function (api) {
  api.cache(true);
  const nativewindConfig = require('nativewind/babel')();
  const filteredNativewindPlugins = (nativewindConfig.plugins ?? []).filter(
    (plugin) => plugin !== 'react-native-worklets/plugin'
  );

  return {
    presets: [
      [
        'babel-preset-expo',
        {
          unstable_transformImportMeta: true,
        },
      ],
      ...(nativewindConfig.presets ?? []),
    ],
    plugins: [
      ...filteredNativewindPlugins,
      'react-native-paper/babel',
      'react-native-reanimated/plugin',
    ],
  };
};
