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
import { blockchainService, SkillProofData } from "../../services/blockchain";
import { platformAPIService, PlatformCredentials } from "../../services/platformAPIs";
import { zkTLSService, ZKProof } from "../../services/zkTLS";
import { realZKTLSService, RealZKProof } from "../../services/realZKTLS";
import { enhancedZKTLSService } from "../../services/enhancedZKTLS";

const { width: screenWidth } = Dimensions.get('window');

if (!process.env.EXPO_PUBLIC_USER_MAP_CONTRACT_ADDRESS) {
  // Non-fatal in development/web: log a warning so the app can still run
  // On-chain actions will be limited until env vars are configured
  console.warn(
    "EXPO_PUBLIC_USER_MAP_CONTRACT_ADDRESS is not set. The app will run, but some wallet permissions may be limited."
  );
}

// Determine whether on-chain writes are configured (requires a real XION contract address)
const ONCHAIN_ENABLED = !!process.env.EXPO_PUBLIC_SKILL_PROOF_CONTRACT &&
  String(process.env.EXPO_PUBLIC_SKILL_PROOF_CONTRACT).startsWith("xion");

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

  // Add effect to fetch balance and initialize blockchain service
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

    const initializeBlockchain = async () => {
      try {
        await blockchainService.initialize();
        
        // Initialize with signing client if available
        if (client && account?.bech32Address) {
          await blockchainService.initializeWithSigner(client, account.bech32Address);
          
          // Load user's existing data from blockchain
          await loadUserData();
        }
      } catch (error) {
        console.error("Error initializing blockchain service:", error);
      }
    };

    fetchBalance();
    initializeBlockchain();
  }, [account?.bech32Address, queryClient, client]);

  // Load user data from blockchain
  const loadUserData = async () => {
    if (!account?.bech32Address) return;

    try {
      setLoading(true);
      
      // Load proofs from blockchain
      const userProofs = await blockchainService.getUserProofs(account.bech32Address);
      const convertedProofs = userProofs.map(proof => ({
        id: proof.id,
        platform: proof.platform,
        data: JSON.parse(proof.skillData),
        timestamp: new Date(proof.timestamp * 1000).toISOString(),
        txHash: proof.id // Using proof ID as tx hash for now
      }));
      setProofs(convertedProofs);

      // Load NFTs from blockchain
      const userNFTs = await blockchainService.getUserNFTs(account.bech32Address);
      const convertedNFTs = userNFTs.map(nft => ({
        id: nft.tokenId,
        name: `${nft.platform} Skill Badge`,
        level: ["Bronze", "Silver", "Gold", "Platinum"][nft.skillLevel - 1] || "Bronze",
        skills: [nft.platform],
        tokenId: nft.tokenId,
        imageUrl: nft.tokenUri
      }));
      setNfts(convertedNFTs);

      // Load reputation
      const reputation = await blockchainService.getUserReputation(account.bech32Address);
      if (reputation) {
        // You can use reputation data to show user stats
        console.log('User reputation:', reputation);
      }

      // Convert proofs to skill data for display
      const platforms = [...new Set(userProofs.map(proof => proof.platform))];
      const skillDataArray = platforms.map(platform => {
        const platformProofs = userProofs.filter(p => p.platform === platform);
        const latestProof = platformProofs[platformProofs.length - 1];
        const parsedData = JSON.parse(latestProof.skillData);
        
        return {
          platform,
          username: latestProof.username,
          rank: parsedData.rank,
          badges: parsedData.badges,
          contributions: parsedData.contributions,
          lastUpdated: new Date(latestProof.timestamp * 1000).toISOString().split('T')[0]
        };
      });
      setSkillData(skillDataArray);

    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch real skill data from platforms
  const fetchSkillData = async (platform: string, user: string) => {
    if (!platform || !user) {
      Alert.alert("Error", "Please select a platform and enter a username");
      return;
    }

    setLoading(true);
    try {
      const credentials: PlatformCredentials = { platform, username: user };
      let platformData: any;
      let zkProof: RealZKProof | ZKProof | undefined;

      // 1) Enhanced zkTLS via backend
      try {
        console.log("🔐 Attempting enhanced zkTLS verification...");
        const tlsResult = await enhancedZKTLSService.performTLSVerification(platform, user);
        if (tlsResult.success && tlsResult.proof) {
          zkProof = tlsResult.proof;
          platformData = await platformAPIService.fetchUserData(credentials);
          const isProofValid = await enhancedZKTLSService.verifyRealProof(zkProof as RealZKProof);
          if (!isProofValid) throw new Error("Enhanced zkTLS proof verification failed");
          console.log("✅ Enhanced zkTLS verification successful");
          await processVerifiedData(platform, user, platformData, zkProof);
          return;
        }
        throw new Error(tlsResult.error || "Enhanced zkTLS verification failed");
      } catch (enhancedError) {
        console.error("Enhanced zkTLS verification error:", enhancedError);

        // 2) Local real zkTLS
        try {
          console.log("🔐 Attempting local real zkTLS verification...");
          const tlsResultLocal = await realZKTLSService.performRealTLSVerification(platform, user);
          if (tlsResultLocal.success && tlsResultLocal.proof) {
            zkProof = tlsResultLocal.proof;
            platformData = await platformAPIService.fetchUserData(credentials);
            const isProofValidLocal = await realZKTLSService.verifyRealProof(zkProof as RealZKProof);
            if (!isProofValidLocal) throw new Error("Local real zkTLS proof verification failed");
            console.log("✅ Local real zkTLS verification successful");
            await processVerifiedData(platform, user, platformData, zkProof);
            return;
          }
          throw new Error(tlsResultLocal.error || "Local real zkTLS verification failed");
        } catch (realError) {
          console.error("Real zkTLS verification error:", realError);

          // 3) Standard zkTLS fallback
          try {
            console.log("🔄 Falling back to standard zkTLS...");
            const sessionId = await zkTLSService.initializeVerification(platform, user);
            Alert.alert("Verification in Progress", "Generating zero-knowledge proof...");
            zkProof = await zkTLSService.waitForVerification(sessionId);
            platformData = await platformAPIService.fetchUserData(credentials);
            const isProofValid = await zkTLSService.verifyProof(zkProof);
            if (!isProofValid) throw new Error("Standard zkTLS proof verification failed");
            console.log("✅ Standard zkTLS verification successful");
            await processVerifiedData(platform, user, platformData, zkProof);
            return;
          } catch (standardError) {
            console.error("Standard zkTLS verification error:", standardError);
            // Final fallback to direct API
            Alert.alert("Verification Failed", "zkTLS verification failed. Using standard API verification.");
            platformData = await platformAPIService.fetchUserData(credentials);
            if (platformData.verified) {
              await processVerifiedData(platform, user, platformData);
            } else {
              handleVerificationError(platform, user, new Error("All verification methods failed."));
            }
          }
        }
      }
    } catch (error) {
      handleVerificationError(platform, user, error);
    } finally {
      setLoading(false);
    }
  };

          const processVerifiedData = async (platform: string, user: string, platformData: any, zkProof?: ZKProof | RealZKProof) => {
    // Convert platform data to our internal format
    const newSkillData: SkillData = {
      platform,
      username: platformData.username,
      rank: platformData.stats.rank || platformData.stats.tier,
      badges: platformData.stats.badges,
      contributions: platformData.stats.contributions || platformData.stats.repositories || platformData.stats.totalSolutions,
      lastUpdated: new Date().toISOString().split('T')[0]
    };

    setSkillData(prev => [...prev, newSkillData]);
    
    const verificationMethod = zkProof ? "zkTLS" : "Standard API";
    const proofInfo = zkProof ? `\nProof ID: ${zkProof.proofId.substring(0, 16)}...` : "";
    
    Alert.alert(
      "Verification Success!", 
      `✅ ${verificationMethod} verification completed for ${platform}!\n` +
      `Account: ${user}\n` +
      `Score: ${platformData.stats.score || 0}\n` +
      `Achievements: ${platformData.achievements.length}${proofInfo}`,
      [{ text: "Generate Proof", onPress: () => generateProof(platform, zkProof) }]
    );
  };

  const handleVerificationError = (platform: string, user: string, error: any) => {
    console.error("Error fetching platform data:", error);
    
    // Fallback to mock data if platform API fails
    Alert.alert(
      "Platform API Unavailable", 
      `Using demo data for ${platform}. In production, this would fetch real data.`,
      [
        {
          text: "Use Demo Data",
          onPress: () => {
            const mockSkillData: SkillData = {
              platform,
              username: user,
              rank: ["LeetCode", "HackerRank"].includes(platform) ? "Guardian" : undefined,
              badges: ["LeetCode", "Kaggle"].includes(platform) ? Math.floor(Math.random() * 20) + 1 : undefined,
              contributions: ["GitHub", "Stack Overflow"].includes(platform) ? Math.floor(Math.random() * 200) + 1 : undefined,
              lastUpdated: new Date().toISOString().split('T')[0]
            };
            setSkillData(prev => [...prev, mockSkillData]);
            generateProof(platform);
          }
        },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };

  // Function to generate proof of skill
          const generateProof = async (platform: string, zkProof?: ZKProof | RealZKProof) => {
    if (!client || !account?.bech32Address) {
      Alert.alert("Error", "Please connect your wallet first");
      return;
    }

    setLoading(true);
    try {
      // Find the skill data for this platform
      const skillForPlatform = skillData.find(skill => skill.platform === platform);
      if (!skillForPlatform) {
        Alert.alert("Error", "No skill data found for this platform");
        return;
      }

      // Prepare skill data for blockchain storage
      const skillDataForProof = {
        verified: true,
        timestamp: new Date().toISOString(),
        rank: skillForPlatform.rank,
        badges: skillForPlatform.badges,
        contributions: skillForPlatform.contributions,
        username: skillForPlatform.username,
        verificationMethod: zkProof ? "zkTLS" : "API",
        zkProofId: zkProof?.proofId,
        dataHash: zkProof?.publicSignals?.dataHash,
      };

      // Generate proof hash
      const proofHash = blockchainService.generateProofHash(skillDataForProof);

      // Create proof data
      const proofData: SkillProofData = {
        platform,
        username: skillForPlatform.username,
        skillData: skillDataForProof,
        proofHash,
        metadata: JSON.stringify({
          verifiedAt: new Date().toISOString(),
          appVersion: "1.0.0"
        })
      };

      // If no contract configured, show a helpful message and skip on-chain call
      if (!ONCHAIN_ENABLED) {
        Alert.alert(
          "On-chain disabled",
          "A contract address is not set in .env (EXPO_PUBLIC_SKILL_PROOF_CONTRACT). I saved your verification locally. Set the contract address to enable on-chain proofs.")
        // Optimistically show the proof locally and return
        const newProofLocal: ProofOfSkill = {
          id: `${account.bech32Address}:${platform}:${Date.now()}`,
          platform,
          data: skillDataForProof,
          timestamp: new Date().toISOString(),
          txHash: "local-only"
        };
        setProofs(prev => [newProofLocal, ...prev]);
        return;
      }

      // Store proof on blockchain
      const txHash = await blockchainService.storeProof(proofData);
      
      // Create local proof object for immediate UI update
      const newProof: ProofOfSkill = {
        id: `${account.bech32Address}:${platform}:${Date.now()}`,
        platform,
        data: skillDataForProof,
        timestamp: new Date().toISOString(),
        txHash
      };

      setProofs(prev => [newProof, ...prev]);
      Alert.alert("Success", `Proof of Skill stored on-chain for ${platform}!\nTx: ${txHash.substring(0, 16)}...`);
      
      // Generate NFT after successful proof storage
      await generateNFT(platform, skillDataForProof);
      
    } catch (error) {
      console.error("Error generating proof:", error);
      Alert.alert("Error", `Failed to generate proof of skill: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Function to generate NFT
  const generateNFT = async (platform: string, skillDataForProof: any) => {
    if (!client || !account?.bech32Address) {
      Alert.alert("Error", "Please connect your wallet first");
      return;
    }

    try {
      // Calculate skill level based on user's performance
      const userProofs = await blockchainService.getUserProofs(account.bech32Address, platform);
      const proofCount = userProofs.length + 1; // +1 for the proof we just added
      
      // Calculate platform score from skill data
      let platformScore = 0;
      if (skillDataForProof.contributions) platformScore += skillDataForProof.contributions * 2;
      if (skillDataForProof.badges) platformScore += skillDataForProof.badges * 10;
      if (skillDataForProof.rank === "Guardian") platformScore += 500;

      const skillLevel = blockchainService.calculateSkillLevel(proofCount, platformScore);
      const levelNames = ["Bronze", "Silver", "Gold", "Platinum"];
      const levelName = levelNames[skillLevel - 1];

      // Generate token URI (in production, this would point to actual metadata)
      const tokenUri = `https://skillexify.app/nft/${platform.toLowerCase()}/${skillLevel}.json`;

      // Check if user already has an NFT for this platform
      const existingNFTs = await blockchainService.getUserNFTs(account.bech32Address);
      const existingNFT = existingNFTs.find(nft => nft.platform === platform);

      if (existingNFT && existingNFT.skillLevel < skillLevel) {
        // NFT evolution - would need to implement update function in contract
        console.log(`NFT would evolve from level ${existingNFT.skillLevel} to ${skillLevel}`);
        Alert.alert("NFT Evolution!", `Your ${platform} NFT has evolved to ${levelName}!`);
      } else if (!existingNFT) {
        // Mint new NFT (Note: in production, this would be automated by the contract)
        try {
          const txHash = await blockchainService.mintSkillNFT(
            account.bech32Address,
            platform,
            skillLevel,
            tokenUri
          );

          const newNFT: NFT = {
            id: `${platform}_${skillLevel}_${Date.now()}`,
            name: `${platform} ${levelName} Badge`,
            level: levelName,
            skills: [platform],
            tokenId: `${account.bech32Address}:${platform}:${skillLevel}`,
            imageUrl: tokenUri
          };

          setNfts(prev => [newNFT, ...prev]);
          Alert.alert("NFT Minted!", `${levelName} level NFT minted for ${platform}!\nTx: ${txHash.substring(0, 16)}...`);
        } catch (nftError) {
          console.error("Error minting NFT:", nftError);
          // Don't show error to user as this might be expected (admin-only minting)
          console.log("NFT minting failed - may require admin privileges");
        }
      }

    } catch (error) {
      console.error("Error in generateNFT:", error);
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
                      onPress={() => {
                        if (proof.txHash && proof.txHash !== "local-only") {
                          Alert.alert("Transaction", `TX Hash: ${proof.txHash}`);
                        } else {
                          Alert.alert("Saved Locally", "This proof was created without an on-chain contract. Add EXPO_PUBLIC_SKILL_PROOF_CONTRACT in .env to enable transactions.");
                        }
                      }}
                    >
                      <Text style={styles.txButtonText}>{proof.txHash === "local-only" ? "LOCAL PROOF" : "VIEW TRANSACTION"}</Text>
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