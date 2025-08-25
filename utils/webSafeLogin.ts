import { Platform } from 'react-native';

// Determine if we're in a web environment
const isWeb = typeof window !== 'undefined';
const isProductionWeb = isWeb && window.location.hostname.includes('expo.app');

export const getWebSafeCallbackUrl = () => {
  if (isProductionWeb) {
    return 'https://skillexify.expo.app';
  }
  if (isWeb) {
    return window.location.origin;
  }
  return undefined; // Let Abstraxion use default for native
};

export const isWebEnvironment = () => isWeb;
export const isProductionWebEnvironment = () => isProductionWeb;




