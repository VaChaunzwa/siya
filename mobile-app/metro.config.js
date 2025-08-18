const { getDefaultConfig } = require('expo/metro-config');

/**
 * Metro configuration
 * https://docs.expo.dev/guides/customizing-metro
 *
 * @type {import('expo/metro-config').MetroConfig}
 */
const config = getDefaultConfig(__dirname);

// Disable package.json exports to work around Firebase compatibility issues
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
