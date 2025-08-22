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

// Add minimal resolver to handle unknown module errors
config.resolver.alias = {
  'crypto': 'react-native-quick-crypto',
};

// Optional: shrink the file watcher scope explicitly
config.watchFolders = [projectRoot];

module.exports = config;
