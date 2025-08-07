import { useState, useEffect } from "react";
import { View, StyleSheet, Text, TouchableOpacity, Alert, ScrollView, Linking, TextInput } from "react-native";
import {
  useAbstraxionAccount,
  useAbstraxionSigningClient,
  useAbstraxionClient,
} from "@burnt-labs/abstraxion-react-native";
import type { ExecuteResult } from "@cosmjs/cosmwasm-stargate";

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

type PassionIndex = {
  platform: string;
  activity: number;
  engagement: number;
  lastUpdated: string;
};

type ReputationScore = {
  score: number;
  endorsements: number;
  lastUpdated: string;
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
  const [passionIndex, setPassionIndex] = useState<PassionIndex[]>([]);
  const [reputationScore, setReputationScore] = useState<ReputationScore | null>(null);
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState<string>("0");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("");
  const [username, setUsername] = useState<string>("");

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
    // In a real app, this would connect to APIs like LeetCode, GitHub, etc.
    // For demo purposes, we'll use mock data
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
      
      // Auto-generate proof after fetching data
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
      // In a real app, this would interact with zkTLS to verify credentials
      // and then store the proof on-chain
      const mockProof: ProofOfSkill = {
        id: Math.random().toString(36).substring(7),
        platform,
        data: { verified: true, timestamp: new Date().toISOString() },
        timestamp: new Date().toISOString(),
        txHash: "mock_tx_hash_" + Math.random().toString(36).substring(7)
      };

      setProofs(prev => [mockProof, ...prev]);
      Alert.alert("Success", `Proof of Skill generated for ${platform}!`);
      
      // Auto-generate NFT after creating proof
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
      // In a real app, this would mint an NFT on the XION blockchain
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

  // Function to calculate passion index
  const calculatePassionIndex = async () => {
    setLoading(true);
    try {
      // In a real app, this would connect to APIs like Reddit, YouTube, Medium
      // For demo purposes, we'll use mock data
      const mockPassionIndex: PassionIndex[] = [
        {
          platform: "Reddit",
          activity: Math.floor(Math.random() * 100),
          engagement: Math.floor(Math.random() * 100),
          lastUpdated: new Date().toISOString().split('T')[0]
        },
        {
          platform: "YouTube",
          activity: Math.floor(Math.random() * 100),
          engagement: Math.floor(Math.random() * 100),
          lastUpdated: new Date().toISOString().split('T')[0]
        },
        {
          platform: "Medium",
          activity: Math.floor(Math.random() * 100),
          engagement: Math.floor(Math.random() * 100),
          lastUpdated: new Date().toISOString().split('T')[0]
        }
      ];

      setPassionIndex(mockPassionIndex);
      Alert.alert("Success", "Passion Index calculated!");
    } catch (error) {
      console.error("Error calculating passion index:", error);
      Alert.alert("Error", "Failed to calculate passion index");
    } finally {
      setLoading(false);
    }
  };

  // Function to calculate reputation score
  const calculateReputationScore = async () => {
    setLoading(true);
    try {
      // In a real app, this would aggregate endorsements from peers
      // For demo purposes, we'll use mock data
      const mockReputationScore: ReputationScore = {
        score: Math.floor(Math.random() * 1000),
        endorsements: Math.floor(Math.random() * 50),
        lastUpdated: new Date().toISOString().split('T')[0]
      };

      setReputationScore(mockReputationScore);
      Alert.alert("Success", "Reputation Score calculated!");
    } catch (error) {
      console.error("Error calculating reputation score:", error);
      Alert.alert("Error", "Failed to calculate reputation score");
    } finally {
      setLoading(false);
    }
  };

  function handleLogout() {
    logout();
    // Clear all data on logout
    setSkillData([]);
    setProofs([]);
    setNfts([]);
    setPassionIndex([]);
    setReputationScore(null);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Skillexify</Text>
      <Text style={styles.subtitle}>Verifiable Technical Skill Credentials</Text>

      {!isConnected ? (
        <View style={styles.connectButtonContainer}>
          <TouchableOpacity
            onPress={login}
            style={[styles.menuButton, styles.fullWidthButton, isConnecting && styles.disabledButton]}
            disabled={isConnecting}
          >
            <Text style={styles.buttonText}>
              {isConnecting ? "Connecting..." : "Connect Wallet"}
            </Text>
          </TouchableOpacity>
          <Text style={styles.infoText}>
            Connect your wallet to start verifying your technical skills and earning Proof of Skill badges.
          </Text>
        </View>
      ) : (
        <View style={styles.mainContainer}>
          {/* Account Info */}
          <View style={styles.accountInfoContainer}>
            <Text style={styles.accountLabel}>Connected Account:</Text>
            <View style={styles.addressContainer}>
              <Text style={styles.addressText} numberOfLines={1} ellipsizeMode="middle">
                {account?.bech32Address}
              </Text>
            </View>
            <View style={styles.balanceContainer}>
              <Text style={styles.balanceLabel}>Balance:</Text>
              <Text style={styles.balanceText}>{balance} UXION</Text>
            </View>
            <TouchableOpacity
              onPress={logout}
              style={[styles.menuButton, styles.logoutButton, styles.fullWidthButton]}
            >
              <Text style={styles.buttonText}>Logout</Text>
            </TouchableOpacity>
          </View>

          {/* Platform Connection Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Connect Platforms</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Platform:</Text>
              <View style={styles.pickerContainer}>
                <TouchableOpacity 
                  style={styles.pickerButton}
                  onPress={() => setSelectedPlatform("LeetCode")}
                >
                  <Text style={selectedPlatform === "LeetCode" ? styles.selectedText : styles.pickerText}>
                    LeetCode
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.pickerButton}
                  onPress={() => setSelectedPlatform("GitHub")}
                >
                  <Text style={selectedPlatform === "GitHub" ? styles.selectedText : styles.pickerText}>
                    GitHub
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.pickerButton}
                  onPress={() => setSelectedPlatform("Kaggle")}
                >
                  <Text style={selectedPlatform === "Kaggle" ? styles.selectedText : styles.pickerText}>
                    Kaggle
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username:</Text>
              <TextInput
                style={styles.input}
                value={username}
                onChangeText={setUsername}
                placeholder="Enter username"
                placeholderTextColor="#999"
              />
            </View>
            <TouchableOpacity
              onPress={() => fetchSkillData(selectedPlatform, username)}
              style={[styles.menuButton, styles.fullWidthButton]}
              disabled={loading || !selectedPlatform || !username}
            >
              <Text style={styles.buttonText}>
                {loading ? "Connecting..." : "Connect & Verify"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Skill Data Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Skills</Text>
            {skillData.length > 0 && (
              <View style={styles.skillDataContainer}>
                {skillData.map((skill, index) => (
                  <View key={index} style={styles.skillCard}>
                    <Text style={styles.skillPlatform}>{skill.platform}</Text>
                    <Text style={styles.skillUsername}>@{skill.username}</Text>
                    {skill.rank && <Text style={styles.skillDetail}>Rank: {skill.rank}</Text>}
                    {skill.badges !== undefined && <Text style={styles.skillDetail}>Badges: {skill.badges}</Text>}
                    {skill.contributions !== undefined && <Text style={styles.skillDetail}>Contributions: {skill.contributions}</Text>}
                    <Text style={styles.skillDetail}>Last Updated: {skill.lastUpdated}</Text>
                    <TouchableOpacity
                      onPress={() => generateProof(skill.platform)}
                      style={[styles.proveButton, loading && styles.disabledButton]}
                      disabled={loading}
                    >
                      <Text style={styles.buttonText}>Prove This Skill</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* NFTs Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skill NFTs</Text>
            <TouchableOpacity
              onPress={() => nfts.length > 0 && Alert.alert("Info", "NFTs automatically upgrade as you improve your skills!")}
              style={[styles.menuButton, styles.fullWidthButton]}
            >
              <Text style={styles.buttonText}>View Dynamic NFTs</Text>
            </TouchableOpacity>
            {nfts.length > 0 ? (
              <View style={styles.nftsContainer}>
                {nfts.map((nft, index) => (
                  <View key={index} style={styles.nftCard}>
                    <Text style={styles.nftName}>{nft.name}</Text>
                    <Text style={[styles.nftLevel, getLevelStyle(nft.level)]}>{nft.level} Level</Text>
                    <Text style={styles.nftId}>ID: {nft.tokenId}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.noNftsText}>No NFTs generated yet. Start by proving your skills!</Text>
            )}
          </View>

          {/* Passion Index Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Passion Index</Text>
            <TouchableOpacity
              onPress={calculatePassionIndex}
              style={[styles.menuButton, styles.fullWidthButton]}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? "Calculating..." : "Calculate Passion Index"}
              </Text>
            </TouchableOpacity>
            {passionIndex.length > 0 && (
              <View style={styles.passionIndexContainer}>
                {passionIndex.map((index, i) => (
                  <View key={i} style={styles.passionIndexCard}>
                    <Text style={styles.passionPlatform}>{index.platform}</Text>
                    <Text style={styles.passionDetail}>Activity: {index.activity}%</Text>
                    <Text style={styles.passionDetail}>Engagement: {index.engagement}%</Text>
                    <Text style={styles.passionDetail}>Last Updated: {index.lastUpdated}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Reputation Score Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reputation Score</Text>
            <TouchableOpacity
              onPress={calculateReputationScore}
              style={[styles.menuButton, styles.fullWidthButton]}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? "Calculating..." : "Calculate Reputation Score"}
              </Text>
            </TouchableOpacity>
            {reputationScore && (
              <View style={styles.reputationCard}>
                <Text style={styles.reputationScore}>Score: {reputationScore.score}</Text>
                <Text style={styles.reputationDetail}>Endorsements: {reputationScore.endorsements}</Text>
                <Text style={styles.reputationDetail}>Last Updated: {reputationScore.lastUpdated}</Text>
              </View>
            )}
          </View>

          {/* Proofs Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Proof of Skills</Text>
            {proofs.length > 0 ? (
              <View style={styles.proofsContainer}>
                {proofs.map((proof, index) => (
                  <View key={index} style={styles.proofCard}>
                    <Text style={styles.proofPlatform}>{proof.platform}</Text>
                    <Text style={styles.proofId}>ID: {proof.id}</Text>
                    <Text style={styles.proofDate}>Date: {new Date(proof.timestamp).toLocaleDateString()}</Text>
                    <TouchableOpacity
                      onPress={() => Linking.openURL(`https://www.mintscan.io/xion-testnet/tx/${proof.txHash}`)}
                      style={styles.viewButton}
                    >
                      <Text style={styles.buttonText}>View on Blockchain</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.noProofsText}>No proofs generated yet. Start by proving your skills!</Text>
            )}
          </View>

          {/* Features Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Features</Text>
            <View style={styles.featuresContainer}>
              <View style={styles.featureCard}>
                <Text style={styles.featureTitle}>zkTLS Verification</Text>
                <Text style={styles.featureDescription}>
                  Zero-Knowledge TLS verification ensures your credentials are real without exposing private data.
                </Text>
              </View>
              <View style={styles.featureCard}>
                <Text style={styles.featureTitle}>On-Chain Storage</Text>
                <Text style={styles.featureDescription}>
                  All proofs are stored immutably on the XION blockchain for permanent verification.
                </Text>
              </View>
              <View style={styles.featureCard}>
                <Text style={styles.featureTitle}>Dynamic NFT Evolution</Text>
                <Text style={styles.featureDescription}>
                  Skill NFTs upgrade automatically as users improve (e.g., Bronze → Gold).
                </Text>
              </View>
              <View style={styles.featureCard}>
                <Text style={styles.featureTitle}>Privacy-Friendly Identity</Text>
                <Text style={styles.featureDescription}>
                  Prove skills anonymously without exposing personal information.
                </Text>
              </View>
              <View style={styles.featureCard}>
                <Text style={styles.featureTitle}>Passion Index</Text>
                <Text style={styles.featureDescription}>
                  Tracks developer engagement on Reddit, YouTube, Medium to show curiosity and activity.
                </Text>
              </View>
              <View style={styles.featureCard}>
                <Text style={styles.featureTitle}>Reputation Score</Text>
                <Text style={styles.featureDescription}>
                  Earn peer endorsements from teammates, mentors, or open-source maintainers.
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f0f0",
  },
  contentContainer: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
  },
  mainContainer: {
    flex: 1,
    gap: 20,
  },
  accountInfoContainer: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  accountLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  addressContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f5f5f5",
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    color: "#666",
    marginRight: 10,
  },
  balanceContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  balanceLabel: {
    fontSize: 14,
    color: "#666",
  },
  balanceText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  connectButtonContainer: {
    width: '100%',
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  infoText: {
    marginTop: 20,
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },
  menuButton: {
    padding: 15,
    borderRadius: 5,
    backgroundColor: "#2196F3",
    alignItems: "center",
    marginBottom: 10,
  },
  fullWidthButton: {
    width: '100%',
    maxWidth: '100%',
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  logoutButton: {
    backgroundColor: '#dc3545',
  },
  section: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  input: {
    backgroundColor: "#f9f9f9",
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#ddd",
    color: "#333",
  },
  pickerContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  pickerButton: {
    padding: 8,
    borderRadius: 5,
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  pickerText: {
    color: "#666",
  },
  selectedText: {
    color: "#2196F3",
    fontWeight: "bold",
  },
  skillDataContainer: {
    marginTop: 15,
    gap: 15,
  },
  skillCard: {
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#eee",
  },
  skillPlatform: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  skillUsername: {
    fontSize: 14,
    color: "#2196F3",
    marginBottom: 10,
  },
  skillDetail: {
    fontSize: 14,
    color: "#666",
    marginBottom: 3,
  },
  proveButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: "#4CAF50",
    borderRadius: 5,
    alignItems: "center",
  },
  nftsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  nftCard: {
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#eee",
    width: "48%",
  },
  nftName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  nftLevel: {
    fontSize: 14,
    marginBottom: 5,
  },
  nftId: {
    fontSize: 12,
    color: "#666",
  },
  noNftsText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    fontStyle: "italic",
  },
  passionIndexContainer: {
    gap: 15,
  },
  passionIndexCard: {
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#eee",
  },
  passionPlatform: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  passionDetail: {
    fontSize: 14,
    color: "#666",
    marginBottom: 3,
  },
  reputationCard: {
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#eee",
  },
  reputationScore: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  reputationDetail: {
    fontSize: 14,
    color: "#666",
    marginBottom: 3,
  },
  proofsContainer: {
    gap: 15,
  },
  proofCard: {
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#eee",
  },
  proofPlatform: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  proofId: {
    fontSize: 12,
    color: "#666",
    marginBottom: 5,
  },
  proofDate: {
    fontSize: 14,
    color: "#666",
    marginBottom: 10,
  },
  viewButton: {
    padding: 10,
    backgroundColor: "#2196F3",
    borderRadius: 5,
    alignItems: "center",
  },
  noProofsText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    fontStyle: "italic",
  },
  featuresContainer: {
    gap: 15,
  },
  featureCard: {
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#eee",
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  featureDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  disabledButton: {
    backgroundColor: '#ccc',
    opacity: 0.7,
  },
});
