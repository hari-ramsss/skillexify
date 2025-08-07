import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import Colors from '../constants/Colors';

// Pixel border component
export const PixelBorder: React.FC<{
  children: React.ReactNode;
  color?: string;
  style?: ViewStyle;
}> = ({ children, color = Colors.dark.border, style }) => {
  return (
    <View style={[styles.pixelBorderContainer, { borderColor: color }, style]}>
      {/* Corner pixels */}
      <View style={[styles.cornerPixel, styles.topLeft, { backgroundColor: color }]} />
      <View style={[styles.cornerPixel, styles.topRight, { backgroundColor: color }]} />
      <View style={[styles.cornerPixel, styles.bottomLeft, { backgroundColor: color }]} />
      <View style={[styles.cornerPixel, styles.bottomRight, { backgroundColor: color }]} />
      
      {children}
    </View>
  );
};

// Retro button component
export const RetroButton: React.FC<{
  onPress: () => void;
  title: string;
  color?: string;
  textColor?: string;
  style?: ViewStyle;
  disabled?: boolean;
}> = ({ onPress, title, color = Colors.dark.primary, textColor = '#fff', style, disabled = false }) => {
  return (
    <TouchableOpacity 
      onPress={onPress} 
      disabled={disabled}
      style={[
        styles.retroButton, 
        { backgroundColor: disabled ? '#555' : color },
        style
      ]}
    >
      <PixelBorder color={disabled ? '#777' : color}>
        <Text style={[styles.retroButtonText, { color: textColor }]}>
          {title}
        </Text>
      </PixelBorder>
    </TouchableOpacity>
  );
};

// Neon text component
export const NeonText: React.FC<{
  text: string;
  color?: string;
  style?: TextStyle;
  size?: 'small' | 'medium' | 'large';
}> = ({ text, color = Colors.dark.primary, style, size = 'medium' }) => {
  const fontSize = size === 'small' ? 14 : size === 'medium' ? 20 : 28;
  
  return (
    <Text
      style={[
        styles.neonText,
        { 
          color: color,
          fontSize,
          textShadowColor: color,
        },
        style
      ]}
    >
      {text}
    </Text>
  );
};

// Pixel card component
export const PixelCard: React.FC<{
  children: React.ReactNode;
  color?: string;
  style?: ViewStyle;
}> = ({ children, color = Colors.dark.card, style }) => {
  return (
    <PixelBorder color={Colors.dark.border} style={{ ...styles.pixelCard, backgroundColor: color, ...(style || {}) }}>
      {children}
    </PixelBorder>
  );
};

// Terminal text component
export const TerminalText: React.FC<{
  text: string;
  style?: TextStyle;
}> = ({ text, style }) => {
  return (
    <Text style={[styles.terminalText, style]}>
      {'> '}{text}
    </Text>
  );
};

// Web3 badge component
export const Web3Badge: React.FC<{
  type: 'blockchain' | 'token' | 'wallet' | 'nft' | 'defi';
  text: string;
  style?: ViewStyle;
}> = ({ type, text, style }) => {
  const color = Colors.web3[type];
  
  return (
    <View style={[styles.web3Badge, { backgroundColor: color }, style]}>
      <Text style={styles.web3BadgeText}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  pixelBorderContainer: {
    borderWidth: Colors.web3.pixel.borderSize,
    borderStyle: 'solid',
    padding: 10,
    position: 'relative',
  },
  cornerPixel: {
    position: 'absolute',
    width: Colors.web3.pixel.borderSize * 2,
    height: Colors.web3.pixel.borderSize * 2,
    backgroundColor: Colors.dark.border,
  },
  topLeft: {
    top: -Colors.web3.pixel.borderSize,
    left: -Colors.web3.pixel.borderSize,
  },
  topRight: {
    top: -Colors.web3.pixel.borderSize,
    right: -Colors.web3.pixel.borderSize,
  },
  bottomLeft: {
    bottom: -Colors.web3.pixel.borderSize,
    left: -Colors.web3.pixel.borderSize,
  },
  bottomRight: {
    bottom: -Colors.web3.pixel.borderSize,
    right: -Colors.web3.pixel.borderSize,
  },
  retroButton: {
    marginVertical: 8,
    padding: 0,
  },
  retroButtonText: {
    textAlign: 'center',
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    padding: 8,
  },
  neonText: {
    fontWeight: 'bold',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    letterSpacing: 1,
  },
  pixelCard: {
    marginVertical: 10,
    backgroundColor: Colors.dark.card,
  },
  terminalText: {
    fontFamily: 'SpaceMono',
    color: Colors.web3.blockchain,
    fontSize: 14,
    marginVertical: 4,
  },
  web3Badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginVertical: 4,
    marginRight: 6,
  },
  web3BadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
});