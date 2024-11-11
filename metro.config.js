const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

module.exports = (async () => {
  // eslint-disable-next-line no-undef
  const config = await getDefaultConfig(__dirname);
  const {
    resolver: { sourceExts, assetExts },
  } = config;

  return withNativeWind(
    {
      ...config,
      transformer: {
        babelTransformerPath: require.resolve(
          "react-native-svg-transformer/react-native",
        ),
        ...config.transformer,
      },
      resolver: {
        assetExts: assetExts.filter((ext) => ext !== "svg"),
        sourceExts: [...sourceExts, "svg"],
        ...config.resolver,
      },
    },
    { input: "./assets/global.css" },
  );
})();
