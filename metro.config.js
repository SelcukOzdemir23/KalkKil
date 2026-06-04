const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const {withNativeWind} = require('nativewind/metro');

const config = {};

const baseConfig = mergeConfig(getDefaultConfig(__dirname), config);

module.exports = withNativeWind(baseConfig, {input: './global.css'});
