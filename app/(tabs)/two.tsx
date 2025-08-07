import { useState, useEffect } from "react";
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, FlatList, Alert } from "react-native";
import { useAbstraxionAccount } from "@burnt-labs/abstraxion-react-native";

type LeaderboardEntry = {
  rank: number;
  username: string;
  platform: string;
  score: number;
  address: string;
};

type Community = {
  id: string;
  name: string;
  members: number;
  description: string;
  isMember: boolean;
  skills: string[];
};

type Endorsement = {
  id: string;
  from: string;
  to: string;
  skill: string;
  message: string;
  timestamp: string;
};

export default function CommunityScreen() {
  const { data: account, isConnected } = useAbstraxionAccount();

  // Mock leaderboard data
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([
    { rank: 1, username: "crypto_master", platform: "LeetCode", score: 2850, address: "xion1..." },
    { rank: 2, username: "data_wizard", platform: "Kaggle", score: 2720, address: "xion2..." },
    { rank: 3, username: "code_ninja", platform: "GitHub", score: 2680, address: "xion3..." },
    { rank: 4, username: "algo_expert", platform: "HackerRank", score: 2590, address: "xion4..." },
    { rank: 5, username: "ml_guru", platform: "Kaggle", score: 2510, address: "xion5..." },
    { rank: 6, username: "dev_star", platform: "GitHub", score: 2430, address: "xion6..." },
    { rank: 7, username: "puzzle_solver", platform: "LeetCode", score: 2380, address: "xion7..." },
    { rank: 8, username: "stack_overflow", platform: "Stack Overflow", score: 2290, address: "xion8..." },
  ]);

  // Mock community data
  const [communities, setCommunities] = useState<Community[]>([
    { id: "1", name: "LeetCode Champions", members: 1240, description: "Top competitive programmers", isMember: true, skills: ["Algorithms", "Data Structures"] },
    { id: "2", name: "Kaggle Grandmasters", members: 890, description: "Data science experts", isMember: false, skills: ["Machine Learning", "Data Analysis"] },
    { id: "3", name: "Open Source Heroes", members: 2100, description: "GitHub contributors", isMember: true, skills: ["Open Source", "Collaboration"] },
    { id: "4", name: "Blockchain Builders", members: 650, description: "Web3 developers", isMember: false, skills: ["Smart Contracts", "Blockchain"] },
    { id: "5", name: "AI Pioneers", members: 980, description: "Machine learning researchers", isMember: false, skills: ["AI", "Deep Learning"] },
  ]);

  // Mock endorsements
  const [endorsements, setEndorsements] = useState<Endorsement[]>([
    { id: "1", from: "dev_mentor", to: "skillexify_user", skill: "React Native", message: "Great mobile developer!", timestamp: "2025-08-01" },
    { id: "2", from: "team_lead", to: "skillexify_user", skill: "Problem Solving", message: "Excellent analytical skills", timestamp: "2025-07-28" },
  ]);

  const [newEndorsement, setNewEndorsement] = useState({ skill: "", message: "" });
  const [loading, setLoading] = useState(false);

  const joinCommunity = (id: string) => {
    setCommunities(prev =>
      prev.map(community =>
        community.id === id
          ? { ...community, isMember: !community.isMember, members: community.isMember ? community.members - 1 : community.members + 1 }
          : community
      )
    );
  };

  const submitEndorsement = () => {
    if (!newEndorsement.skill || !newEndorsement.message) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    const endorsement: Endorsement = {
      id: Math.random().toString(36).substring(7),
      from: "anonymous_user",
      to: account?.bech32Address || "current_user",
      skill: newEndorsement.skill,
      message: newEndorsement.message,
      timestamp: new Date().toISOString().split('T')[0]
    };

    setEndorsements(prev => [endorsement, ...prev]);
    setNewEndorsement({ skill: "", message: "" });
    Alert.alert("Success", "Endorsement submitted!");
  };

  const renderLeaderboardItem = ({ item }: { item: LeaderboardEntry }) => (
    <View style={[styles.leaderboardItem, item.address === account?.bech32Address && styles.currentUserItem]}>
      <View style={styles.rankContainer}>
        <Text style={styles.rankText}>{item.rank}</Text>
      </View>
      <View style={styles.userContainer}>
        <Text style={styles.username}>{item.username}</Text>
        <Text style={styles.platform}>{item.platform}</Text>
      </View>
      <View style={styles.scoreContainer}>
        <Text style={styles.score}>{item.score}</Text>
      </View>
    </View>
  );

  const renderCommunityItem = ({ item }: { item: Community }) => (
    <View style={styles.communityCard}>
      <View style={styles.communityHeader}>
        <Text style={styles.communityName}>{item.name}</Text>
        <Text style={styles.memberCount}>{item.members} members</Text>
      </View>
      <Text style={styles.communityDescription}>{item.description}</Text>
      <View style={styles.skillsContainer}>
        {item.skills.map((skill, index) => (
          <Text key={index} style={styles.skillTag}>{skill}</Text>
        ))}
      </View>
      <TouchableOpacity
        onPress={() => joinCommunity(item.id)}
        style={[styles.joinButton, item.isMember && styles.leaveButton]}
      >
        <Text style={styles.buttonText}>
          {item.isMember ? "Leave Community" : "Join Community"}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderEndorsementItem = ({ item }: { item: Endorsement }) => (
    <View style={styles.endorsementCard}>
      <View style={styles.endorsementHeader}>
        <Text style={styles.endorser}>{item.from}</Text>
        <Text style={styles.endorsementDate}>{item.timestamp}</Text>
      </View>
      <Text style={styles.endorsementSkill}>{item.skill}</Text>
      <Text style={styles.endorsementMessage}>{item.message}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={styles.title}>Community & Leaderboards</Text>

      {!isConnected ? (
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            Connect your wallet to see your position on the leaderboards and access exclusive communities.
          </Text>
        </View>
      ) : (
        <>
          {/* User's Rank */}
          <View style={styles.userRankContainer}>
            <Text style={styles.sectionTitle}>Your Global Rank</Text>
            <View style={styles.userRankCard}>
              <Text style={styles.userRank}>#247</Text>
              <Text style={styles.userScore}>2150 points</Text>
              <Text style={styles.userPlatform}>Overall Score</Text>
            </View>
          </View>

          {/* Leaderboard */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Global Leaderboard</Text>
            <View style={styles.leaderboardHeader}>
              <Text style={[styles.headerText, styles.rankHeader]}>Rank</Text>
              <Text style={[styles.headerText, styles.userHeader]}>User</Text>
              <Text style={[styles.headerText, styles.scoreHeader]}>Score</Text>
            </View>
            <FlatList
              data={leaderboardData}
              renderItem={renderLeaderboardItem}
              keyExtractor={(item) => item.rank.toString()}
              scrollEnabled={false}
            />
          </View>

          {/* Communities */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Skill-Based Communities</Text>
            <Text style={styles.sectionDescription}>
              Join communities based on your skills and interests. Access exclusive resources, events, and networking opportunities.
            </Text>
            <FlatList
              data={communities}
              renderItem={renderCommunityItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              contentContainerStyle={styles.communitiesList}
            />
          </View>

          {/* Endorsements */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Peer Endorsements</Text>
            <Text style={styles.sectionDescription}>
              Earn endorsements from teammates, mentors, or open-source maintainers to boost your reputation score.
            </Text>

            {/* Submit Endorsement */}
            <View style={styles.endorsementForm}>
              <Text style={styles.formTitle}>Submit an Endorsement</Text>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Skill:</Text>
                <View style={styles.pickerContainer}>
                  <TouchableOpacity
                    style={styles.pickerButton}
                    onPress={() => setNewEndorsement({ ...newEndorsement, skill: "React Native" })}
                  >
                    <Text style={newEndorsement.skill === "React Native" ? styles.selectedText : styles.pickerText}>
                      React Native
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.pickerButton}
                    onPress={() => setNewEndorsement({ ...newEndorsement, skill: "Blockchain" })}
                  >
                    <Text style={newEndorsement.skill === "Blockchain" ? styles.selectedText : styles.pickerText}>
                      Blockchain
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.pickerButton}
                    onPress={() => setNewEndorsement({ ...newEndorsement, skill: "Data Science" })}
                  >
                    <Text style={newEndorsement.skill === "Data Science" ? styles.selectedText : styles.pickerText}>
                      Data Science
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Message:</Text>
                <TextInput
                  style={styles.textArea}
                  value={newEndorsement.message}
                  onChangeText={(text) => setNewEndorsement({ ...newEndorsement, message: text })}
                  placeholder="Write your endorsement message..."
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={3}
                />
              </View>
              <TouchableOpacity
                onPress={submitEndorsement}
                style={[styles.menuButton, styles.fullWidthButton]}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? "Submitting..." : "Submit Endorsement"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Endorsements List */}
            <FlatList
              data={endorsements}
              renderItem={renderEndorsementItem}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
              contentContainerStyle={styles.endorsementsList}
            />
          </View>
        </>
      )}
    </ScrollView>
  );
}

// Helper components
const TextInput = ({ style, value, onChangeText, placeholder, placeholderTextColor, multiline, numberOfLines }: any) => (
  <View style={[styles.input, style]}>
    <Text style={styles.inputText}>{value || placeholder}</Text>
  </View>
);

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
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
    textAlign: "center",
  },
  infoContainer: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  infoText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
  },
  userRankContainer: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 20,
  },
  userRankCard: {
    alignItems: "center",
    padding: 20,
    backgroundColor: "#2196F3",
    borderRadius: 10,
  },
  userRank: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 5,
  },
  userScore: {
    fontSize: 24,
    color: "#fff",
    marginBottom: 5,
  },
  userPlatform: {
    fontSize: 16,
    color: "#e3f2fd",
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
  sectionDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 15,
    lineHeight: 20,
  },
  leaderboardHeader: {
    flexDirection: "row",
    backgroundColor: "#e3f2fd",
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  headerText: {
    fontWeight: "bold",
    color: "#333",
  },
  rankHeader: {
    flex: 1,
  },
  userHeader: {
    flex: 3,
  },
  scoreHeader: {
    flex: 1,
    textAlign: "right",
  },
  leaderboardItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  currentUserItem: {
    backgroundColor: "#e3f2fd",
  },
  rankContainer: {
    flex: 1,
  },
  rankText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  userContainer: {
    flex: 3,
  },
  username: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  platform: {
    fontSize: 12,
    color: "#666",
  },
  scoreContainer: {
    flex: 1,
    alignItems: "flex-end",
  },
  score: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2196F3",
  },
  communitiesList: {
    gap: 15,
  },
  communityCard: {
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#eee",
  },
  communityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  communityName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  memberCount: {
    fontSize: 14,
    color: "#666",
  },
  communityDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 15,
    lineHeight: 20,
  },
  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
    marginBottom: 15,
  },
  skillTag: {
    backgroundColor: "#2196F3",
    color: "#fff",
    padding: 5,
    borderRadius: 3,
    fontSize: 12,
  },
  joinButton: {
    padding: 10,
    backgroundColor: "#4CAF50",
    borderRadius: 5,
    alignItems: "center",
  },
  leaveButton: {
    backgroundColor: "#dc3545",
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  endorsementForm: {
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#eee",
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
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
  textArea: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#ddd",
    color: "#333",
    minHeight: 80,
    textAlignVertical: "top",
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
  endorsementsList: {
    gap: 15,
  },
  endorsementCard: {
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#eee",
  },
  endorsementHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  endorser: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  endorsementDate: {
    fontSize: 14,
    color: "#666",
  },
  endorsementSkill: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2196F3",
    marginBottom: 5,
  },
  endorsementMessage: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  input: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#ddd",
    color: "#333",
  },
  inputText: {
    color: "#333",
  },
});
