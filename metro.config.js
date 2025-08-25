// Metro configuration to speed up bundling by ignoring heavy non-JS folders
// like Rust build outputs under `contracts/**/target/**`.

// Learn more: https://docs.expo.dev/guides/customizing-metro/

const { getDefaultConfig } = require('expo/metro-config');
const exclusionList = require('metro-config/src/defaults/exclusionList');
const path = require('path');

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);

// Ignore large, irrelevant directories so Metro does not crawl them
config.resolver.blockList = exclusionList([
  /contracts\/.*\/target\/.*/,
  /contracts\/.*\/artifacts\/.*/,
]);

// Optional: shrink the file watcher scope explicitly
config.watchFolders = [projectRoot];

// Add resolver configurations for Web3 and crypto modules
config.resolver.alias = {
  ...config.resolver.alias,
  'crypto': require.resolve('expo-crypto'),
  'stream': require.resolve('readable-stream'),
  'buffer': require.resolve('buffer'),
};

// Add Node.js polyfills for better compatibility
config.resolver.platforms = ['native', 'web', 'ios', 'android'];

// Enhanced transformer for better module resolution
config.transformer = {
  ...config.transformer,
  unstable_allowRequireContext: true,
};

module.exports = config;
