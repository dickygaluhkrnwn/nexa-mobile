const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// Memberitahu Metro Bundler untuk memproses Tailwind
module.exports = withNativeWind(config, { input: "./global.css" });