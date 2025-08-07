// Pixel Retro Futuristic Web3 Theme Colors - Enhanced
const neonPink = '#FF00FF';
const neonBlue = '#00FFFF';
const neonGreen = '#39FF14';
const neonPurple = '#9D00FF';
const neonYellow = '#FFFF00';
const neonOrange = '#FF6B00';
const neonRed = '#FF0080';
const darkPurple = '#1A0033';
const darkBlue = '#000033';
const matrixGreen = '#00FF41';
const cyberBlack = '#0D0221';
const cyberGray = '#2D2B55';
const deepSpace = '#0A0A0F';
const electricBlue = '#0080FF';
const laserRed = '#FF0040';
const hologramBlue = '#00D4FF';
const plasmaViolet = '#8B00FF';
const retroGold = '#FFD700';
const synthwavePink = '#FF1493';

export default {
  light: {
    // Light theme is now retro-futuristic
    text: '#FFFFFF',
    background: darkBlue,
    tint: neonBlue,
    tabIconDefault: '#666',
    tabIconSelected: neonBlue,
    primary: neonBlue,
    secondary: neonPink,
    accent: neonGreen,
    card: cyberGray,
    border: neonBlue,
    highlight: neonYellow,
    error: '#FF3864',
    success: matrixGreen,
    warning: neonYellow,
    info: neonPurple,
  },
  dark: {
    // Dark theme is more cyberpunk
    text: '#FFFFFF',
    background: deepSpace,
    tint: neonPink,
    tabIconDefault: '#666',
    tabIconSelected: neonPink,
    primary: neonPink,
    secondary: neonBlue,
    accent: neonPurple,
    card: '#16213E',
    cardBorder: '#1F4068',
    border: neonPink,
    highlight: neonGreen,
    error: laserRed,
    success: matrixGreen,
    warning: neonYellow,
    info: hologramBlue,
    // Additional colors for variety
    tertiary: electricBlue,
    quaternary: synthwavePink,
    surface: '#1B1B2F',
    surfaceLight: '#262640',
  },
  // Common Web3 theme elements
  web3: {
    blockchain: neonGreen,
    token: retroGold,
    wallet: hologramBlue,
    nft: plasmaViolet,
    defi: laserRed,
    dao: neonOrange,
    metaverse: synthwavePink,
    pixel: {
      borderSize: 3,
      shadowSize: 6,
    }
  },
  // Gradient combinations for backgrounds
  gradients: {
    cyber: ['#FF00FF', '#00FFFF'],
    matrix: ['#00FF41', '#39FF14'],
    sunset: ['#FF0080', '#FF6B00'],
    space: ['#0D0221', '#1A0033'],
    neon: ['#9D00FF', '#00D4FF'],
    fire: ['#FF0040', '#FFD700'],
    ice: ['#00FFFF', '#0080FF'],
    plasma: ['#8B00FF', '#FF1493'],
  },
  // Glow effects
  glows: {
    pink: 'rgba(255, 0, 255, 0.6)',
    blue: 'rgba(0, 255, 255, 0.6)',
    green: 'rgba(57, 255, 20, 0.6)',
    purple: 'rgba(157, 0, 255, 0.6)',
    yellow: 'rgba(255, 255, 0, 0.6)',
  }
};
