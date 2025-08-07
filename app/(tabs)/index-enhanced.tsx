import { useState, useEffect } from "react";
import { View, StyleSheet, Text, TouchableOpacity, Alert, ScrollView, TextInput, Animated, Easing, Dimensions } from "react-native";
import {
  useAbstraxionAccount,
  useAbstraxionSigningClient,
  useAbstraxionClient,
} from "@burnt-labs/abstraxion-react-native";
import Colors from "../../constants/Colors";
import { PixelBorder, RetroButton, NeonText, PixelCard, TerminalText, Web3Badge } from "../../components/PixelTheme";
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';

const { width: screenWidth } = Dimensions.get('window');

if (!process.env.EXPO_PUBLIC_USER_MAP_CONTRACT_ADDRESS) {
  throw new Error("EXPO_PUBLIC_USER_MAP_CONTRACT_ADDRESS is not set in your environment file");
}

type SkillData = {
  platform: string;
  username: string;
  rank?: string;
  badges?: number;
  contributions?: number;
  lastUpdated?: string;
};

type ProofOfSkill = {
  id: string;
  platform: string;
  data: any;
  timestamp: string;
  txHash: string;
};

type NFT = {
  id: string;
  name: string;
  level: string;
  skills: string[];
  tokenId: string;
  imageUrl: string;
};

type PlatformIconsType = {
  [key: string]: { name: string; type: string; };
};

export default function HomeScreen() {
  // Abstraxion hooks
  const { data: account, logout, login, isConnected, isConnecting } = useAbstraxionAccount();
  const { client } = useAbstraxionSigningClient();
  const { client: queryClient } = useAbstraxionClient();

  // State variables
  const [skillData, setSkillData] = useState<SkillData[]>([]);
  const [proofs, setProofs] = useState<ProofOfSkill[]>([]);
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState<string>("0");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("");
  const [username, setUsername] = useState<string>("");

  // Animation values
  const [pulseAnim] = useState(new Animated.Value(1));
  const [floatAnim] = useState(new Animated.Value(0));
  const [fadeAnim] = useState(new Animated.Value(0));

  // Start animations
  useEffect(() => {
    // Pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        })
      ])
    ).start();

    // Float animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -10,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        })
      ])
    ).start();

    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  // Add effect to fetch balance
  useEffect(() => {
    const fetchBalance = async () => {
      if (account?.bech32Address && queryClient) {
        try {
          const response = await queryClient.getBalance(account.bech32Address, "uxion");
          setBalance(response.amount);
        } catch (error) {
          console.error("Error fetching balance:", error);
        }
      }
    };

    fetchBalance();
  }, [account?.bech32Address, queryClient]);

  // Mock function to fetch skill data from platforms
  const fetchSkillData = async (platform: string, user: string) => {
    if (!platform || !user) {
      Alert.alert("Error", "Please select a platform and enter a username");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const newSkillData: SkillData = {
        platform,
        username: user,
        rank: ["LeetCode", "HackerRank"].includes(platform) ? "Guardian" : undefined,
        badges: ["LeetCode", "Kaggle"].includes(platform) ? Math.floor(Math.random() * 20) + 1 : undefined,
        contributions: ["GitHub", "Stack Overflow"].includes(platform) ? Math.floor(Math.random() * 200) + 1 : undefined,
        lastUpdated: new Date().toISOString().split('T')[0]
      };

      setSkillData(prev => [...prev, newSkillData]);
      setLoading(false);
      generateProof(platform);
    }, 1000);
  };

  // Function to generate proof of skill
  const generateProof = async (platform: string) => {
    if (!client || !account) {
      Alert.alert("Error", "Please connect your wallet first");
      return;
    }

    setLoading(true);
    try {
      const mockProof: ProofOfSkill = {
        id: Math.random().toString(36).substring(7),
        platform,
        data: { verified: true, timestamp: new Date().toISOString() },
        timestamp: new Date().toISOString(),
        txHash: "mock_tx_hash_" + Math.random().toString(36).substring(7)
      };

      setProofs(prev => [mockProof, ...prev]);
      Alert.alert("Success", `Proof of Skill generated for ${platform}!`);
      generateNFT(platform);
    } catch (error) {
      console.error("Error generating proof:", error);
      Alert.alert("Error", "Failed to generate proof of skill");
    } finally {
      setLoading(false);
    }
  };

  // Function to generate NFT
  const generateNFT = async (platform: string) => {
    if (!client || !account) {
      Alert.alert("Error", "Please connect your wallet first");
      return;
    }

    setLoading(true);
    try {
      const mockNFT: NFT = {
        id: Math.random().toString(36).substring(7),
        name: `${platform} Skill Badge`,
        level: ["Bronze", "Silver", "Gold", "Platinum"][Math.floor(Math.random() * 4)],
        skills: [platform],
        tokenId: "nft_" + Math.random().toString(36).substring(7),
        imageUrl: `https://example.com/nft/${platform.toLowerCase()}.png`
      };

      setNfts(prev => [mockNFT, ...prev]);
      Alert.alert("Success", `NFT generated for ${platform}!`);
    } catch (error) {
      console.error("Error generating NFT:", error);
      Alert.alert("Error", "Failed to generate NFT");
    } finally {
      setLoading(false);
    }
  };

  function handleLogout() {
    logout();
    setSkillData([]);
    setProofs([]);
    setNfts([]);
  }

  // Helper function to get level-specific styling
  const getLevelStyle = (level: string) => {
    switch (level) {
      case "Bronze":
        return { color: "#CD7F32", fontWeight: "bold" as const };
      case "Silver":
        return { color: "#C0C0C0", fontWeight: "bold" as const };
      case "Gold":
        return { color: "#FFD700", fontWeight: "bold" as const };
      case "Platinum":
        return { color: "#E5E4E2", fontWeight: "bold" as const };
      default:
        return { color: "#666", fontWeight: "bold" as const };
    }
  };

  // Platform icons mapping
  const platformIcons: PlatformIconsType = {
    'LeetCode': { name: 'code', type: 'Ionicons' },
    'GitHub': { name: 'github', type: 'FontAwesome5' },
    'Kaggle': { name: 'chart-bar', type: 'FontAwesome5' },
    'HackerRank': { name: 'code-braces', type: 'MaterialCommunityIcons' },
    'Stack Overflow': { name: 'stack-overflow', type: 'FontAwesome5' }
  };

  const renderPlatformIcon = (platform: string, size: number = 24, color: string = Colors.dark.primary) => {
    const iconConfig = platformIcons[platform] || { name: 'code', type: 'Ionicons' };
    
    switch (iconConfig.type) {
      case 'Ionicons':
        return <Ionicons name={iconConfig.name as any} size={size} color={color} />;
      case 'FontAwesome5':
        return <FontAwesome5 name={iconConfig.name as any} size={size} color={color} />;
      case 'MaterialCommunityIcons':
        return <MaterialCommunityIcons name={iconConfig.name as any} size={size} color={color} />;
      default:
        return <Ionicons name="code" size={size} color={color} />;
    }
  };

  return (
    <LinearGradient
      colors={[Colors.dark.background, '#16213E', Colors.dark.background]}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.contentContainer}>
        {/* Animated Background Elements */}
        <View style={styles.backgroundElements}>
          <Animated.View style={[styles.floatingCircle1, { transform: [{ translateY: floatAnim }] }]} />
          <Animated.View style={[styles.floatingCircle2, { transform: [{ translateY: floatAnim }] }]} />
          <Animated.View style={[styles.floatingCircle3, { transform: [{ translateY: floatAnim }] }]} />
        </View>

        {/* Header */}
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <LinearGradient
            colors={['#FF00FF', '#00FFFF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.titleGradient}
          >
            <Text style={styles.title}>SKILLEXIFY</Text>
          </LinearGradient>
          <Text style={styles.subtitle}>VERIFIABLE TECHNICAL SKILL CREDENTIALS</Text>
          
          <View style={styles.featureBadges}>
            <Animated.View style={[styles.featureBadge, { transform: [{ scale: pulseAnim }] }]}>
              <MaterialCommunityIcons name="shield-check" size={20} color={Colors.web3.blockchain} />
              <Text style={styles.featureBadgeText}>zkTLS</Text>
            </Animated.View>
            <Animated.View style={[styles.featureBadge, { transform: [{ scale: pulseAnim }] }]}>
              <MaterialCommunityIcons name="ethereum" size={20} color={Colors.web3.nft} />
              <Text style={styles.featureBadgeText}>NFT</Text>
            </Animated.View>
            <Animated.View style={[styles.featureBadge, { transform: [{ scale: pulseAnim }] }]}>
              <Ionicons name="shield-checkmark" size={20} color={Colors.web3.wallet} />
              <Text style={styles.featureBadgeText}>PRIVATE</Text>
            </Animated.View>
          </View>
        </Animated.View>

        {!isConnected ? (
          <Animated.View style={[styles.connectContainer, { opacity: fadeAnim }]}>
            <LinearGradient
              colors={['#1A1A2E', '#16213E']}
              style={styles.connectCard}
            >
              <MaterialCommunityIcons name="wallet" size={60} color={Colors.dark.primary} />
              <Text style={styles.connectTitle}>CONNECT YOUR WALLET</Text>
              <Text style={styles.connectDescription}>
                Start verifying your technical skills and earning Proof of Skill badges
              </Text>
              <RetroButton
                onPress={login}
                title={isConnecting ? "CONNECTING..." : "CONNECT WALLET"}
                color={Colors.dark.primary}
                disabled={isConnecting}
                style={styles.connectButton}
              />
            </LinearGradient>
          </Animated.View>
        ) : (
          <View style={styles.mainContent}>
            {/* Account Info */}
            <LinearGradient
              colors={['#1A1A2E', '#16213E']}
              style={styles.accountCard}
            >
              <View style={styles.accountHeader}>
                <MaterialCommunityIcons name="account-circle" size={24} color={Colors.dark.primary} />
                <Text style={styles.accountTitle}>CONNECTED ACCOUNT</Text>
              </View>
              <Text style={styles.accountAddress} numberOfLines={1} ellipsizeMode="middle">
                {account?.bech32Address}
              </Text>
              <View style={styles.balanceRow}>
                <Text style={styles.balanceLabel}>BALANCE:</Text>
                <Text style={styles.balanceValue}>{balance} UXION</Text>
              </View>
              <RetroButton
                onPress={handleLogout}
                title="DISCONNECT"
                color={Colors.dark.error}
                style={styles.disconnectButton}
              />
            </LinearGradient>

            {/* Platform Selection */}
            <LinearGradient
              colors={['#16213E', '#1A1A2E']}
              style={styles.sectionCard}
            >
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons name="link-variant" size={24} color={Colors.dark.primary} />
                <Text style={styles.sectionTitle}>CONNECT PLATFORMS</Text>
              </View>

              <View style={styles.platformGrid}>
                {['LeetCode', 'GitHub', 'Kaggle', 'HackerRank', 'Stack Overflow'].map((platform) => (
                  <TouchableOpacity
                    key={platform}
                    style={[
                      styles.platformButton,
                      selectedPlatform === platform && styles.platformButtonActive
                    ]}
                    onPress={() => setSelectedPlatform(platform)}
                  >
                    {renderPlatformIcon(platform, 28, selectedPlatform === platform ? Colors.dark.primary : '#666')}
                    <Text style={[
                      styles.platformButtonText,
                      selectedPlatform === platform && styles.platformButtonTextActive
                    ]}>
                      {platform}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="person" size={20} color={Colors.dark.primary} />
                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Enter your username"
                  placeholderTextColor="#666"
                />
              </View>

              <RetroButton
                onPress={() => fetchSkillData(selectedPlatform, username)}
                title={loading ? "CONNECTING..." : "CONNECT & VERIFY"}
                disabled={loading || !selectedPlatform || !username}
                style={styles.actionButton}
              />
            </LinearGradient>

            {/* Skills Display */}
            {skillData.length > 0 && (
              <LinearGradient
                colors={['#1A1A2E', '#16213E']}
                style={styles.sectionCard}
              >
                <View style={styles.sectionHeader}>
                  <MaterialCommunityIcons name="trophy" size={24} color={Colors.web3.token} />
                  <Text style={styles.sectionTitle}>YOUR SKILLS</Text>
                </View>

                {skillData.map((skill, index) => (
                  <Animated.View 
                    key={index} 
                    style={[
                      styles.skillCard,
                      { transform: [{ translateY: floatAnim }] }
                    ]}
                  >
                    <View style={styles.skillHeader}>
                      {renderPlatformIcon(skill.platform, 24, Colors.dark.primary)}
                      <Text style={styles.skillPlatform}>{skill.platform}</Text>
                    </View>
                    <Text style={styles.skillUsername}>@{skill.username}</Text>
                    
                    <View style={styles.skillStats}>
                      {skill.rank && (
                        <View style={styles.statItem}>
                          <MaterialCommunityIcons name="medal" size={16} color={Colors.web3.token} />
                          <Text style={styles.statText}>RANK: {skill.rank}</Text>
                        </View>
                      )}
                      {skill.badges !== undefined && (
                        <View style={styles.statItem}>
                          <MaterialCommunityIcons name="shield-star" size={16} color={Colors.web3.nft} />
                          <Text style={styles.statText}>BADGES: {skill.badges}</Text>
                        </View>
                      )}
                      {skill.contributions !== undefined && (
                        <View style={styles.statItem}>
                          <MaterialCommunityIcons name="source-commit" size={16} color={Colors.web3.blockchain} />
                          <Text style={styles.statText}>CONTRIBUTIONS: {skill.contributions}</Text>
                        </View>
                      )}
                    </View>

                    <RetroButton
                      onPress={() => generateProof(skill.platform)}
                      title="PROVE THIS SKILL"
                      color={Colors.web3.blockchain}
                      disabled={loading}
                      style={styles.proveButton}
                    />
                  </Animated.View>
                ))}
              </LinearGradient>
            )}

            {/* NFTs Display */}
            {nfts.length > 0 && (
              <LinearGradient
                colors={['#16213E', '#1A1A2E']}
                style={styles.sectionCard}
              >
                <View style={styles.sectionHeader}>
                  <MaterialCommunityIcons name="diamond-stone" size={24} color={Colors.web3.nft} />
                  <Text style={styles.sectionTitle}>SKILL NFTs</Text>
                </View>

                <View style={styles.nftGrid}>
                  {nfts.map((nft, index) => (
                    <Animated.View 
                      key={index}
                      style={[
                        styles.nftCard,
                        { transform: [{ scale: pulseAnim }] }
                      ]}
                    >
                      <MaterialCommunityIcons name="ethereum" size={40} color={Colors.web3.nft} />
                      <Text style={styles.nftName}>{nft.name}</Text>
                      <Text style={[styles.nftLevel, getLevelStyle(nft.level)]}>
                        {nft.level} LEVEL
                      </Text>
                      <Text style={styles.nftId}>#{nft.tokenId}</Text>
                    </Animated.View>
                  ))}
                </View>
              </LinearGradient>
            )}

            {/* Proofs Display */}
            {proofs.length > 0 && (
              <LinearGradient
                colors={['#1A1A2E', '#16213E']}
                style={styles.sectionCard}
              >
                <View style={styles.sectionHeader}>
                  <MaterialCommunityIcons name="shield-check" size={24} color={Colors.web3.blockchain} />
                  <Text style={styles.sectionTitle}>PROOF OF SKILLS</Text>
                </View>

                {proofs.map((proof, index) => (
                  <View key={index} style={styles.proofCard}>
                    <Text style={styles.proofPlatform}>{proof.platform}</Text>
                    <Text style={styles.proofId}>ID: {proof.id}</Text>
                    <Text style={styles.proofDate}>
                      VERIFIED: {new Date(proof.timestamp).toLocaleDateString()}
                    </Text>
                    <TouchableOpacity
                      style={styles.txButton}
                      onPress={() => Alert.alert("Transaction", `TX Hash: ${proof.txHash}`)}
                    >
                      <Text style={styles.txButtonText}>VIEW TRANSACTION</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </LinearGradient>
            )}
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingTop: 60,
  },
  backgroundElements: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  floatingCircle1: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 0, 255, 0.1)',
    top: 50,
    left: -50,
  },
  floatingCircle2: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(0, 255, 255, 0.1)',
    top: 200,
    right: -75,
  },
  floatingCircle3: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(57, 255, 20, 0.1)',
    bottom: 100,
    left: 50,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  titleGradient: {
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 3,
    textShadowColor: 'rgba(255, 0, 255, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    letterSpacing: 1,
    marginBottom: 20,
  },
  featureBadges: {
    flexDirection: 'row',
    gap: 15,
  },
  featureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  featureBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    marginLeft: 5,
    fontWeight: 'bold',
  },
  connectContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectCard: {
    width: '100%',
    padding: 30,
    borderRadius: 15,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.dark.primary,
  },
  connectTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 20,
    marginBottom: 10,
  },
  connectDescription: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginBottom: 20,
  },
  connectButton: {
    width: '100%',
  },
  mainContent: {
    gap: 20,
  },
  accountCard: {
    padding: 20,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: Colors.dark.border,
  },
  accountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  accountTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 10,
  },
  accountAddress: {
    fontSize: 14,
    color: Colors.dark.secondary,
    marginBottom: 15,
    fontFamily: 'SpaceMono',
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#999',
  },
  balanceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.web3.token,
  },
  disconnectButton: {
    width: '100%',
  },
  sectionCard: {
    padding: 20,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: Colors.dark.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 10,
  },
  platformGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  platformButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  platformButtonActive: {
    backgroundColor: 'rgba(255, 0, 255, 0.2)',
    borderColor: Colors.dark.primary,
  },
  platformButtonText: {
    color: '#666',
    marginLeft: 8,
    fontSize: 12,
  },
  platformButtonTextActive: {
    color: Colors.dark.primary,
    fontWeight: 'bold',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    marginLeft: 10,
    color: '#FFFFFF',
    fontSize: 16,
  },
  actionButton: {
    width: '100%',
  },
  skillCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  skillHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  skillPlatform: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.dark.primary,
    marginLeft: 10,
  },
  skillUsername: {
    fontSize: 14,
    color: Colors.dark.secondary,
    marginBottom: 15,
  },
  skillStats: {
    gap: 10,
    marginBottom: 15,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 14,
    color: '#FFFFFF',
    marginLeft: 8,
  },
  proveButton: {
    width: '100%',
  },
  nftGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  nftCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    width: (screenWidth - 70) / 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  nftName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 10,
    textAlign: 'center',
  },
  nftLevel: {
    fontSize: 16,
    marginTop: 5,
  },
  nftId: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  proofCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  proofPlatform: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.web3.blockchain,
    marginBottom: 5,
  },
  proofId: {
    fontSize: 12,
    color: '#999',
    marginBottom: 5,
  },
  proofDate: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 10,
  },
  txButton: {
    backgroundColor: 'rgba(57, 255, 20, 0.2)',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 5,
    alignItems: 'center',
  },
  txButtonText: {
    color: Colors.web3.blockchain,
    fontSize: 12,
    fontWeight: 'bold',
  },
});