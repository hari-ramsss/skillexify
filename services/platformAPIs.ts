// Platform API Integration Service
// This service handles integration with various coding platforms to fetch user data

export interface PlatformCredentials {
  platform: string;
  username: string;
  accessToken?: string;
  apiKey?: string;
}

export interface PlatformUserData {
  platform: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  profileUrl: string;
  verified: boolean;
  lastActive?: string;
  stats: PlatformStats;
  achievements: Achievement[];
  rawData: any; // Platform-specific raw response
}

export interface PlatformStats {
  rank?: string;
  rating?: number;
  score?: number;
  badges?: number;
  contributions?: number;
  followers?: number;
  repositories?: number;
  commits?: number;
  pullRequests?: number;
  issues?: number;
  streakDays?: number;
  totalSolutions?: number;
  acceptanceRate?: number;
  contestRating?: number;
  tier?: string;
  level?: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  iconUrl?: string;
  earnedAt: string;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
}

// Base class for platform integrations
abstract class BasePlatformAPI {
  abstract readonly platformName: string;
  abstract readonly baseUrl: string;
  abstract readonly requiresAuth: boolean;

  abstract fetchUserData(credentials: PlatformCredentials): Promise<PlatformUserData>;
  
  protected async makeRequest(url: string, options?: RequestInit): Promise<any> {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Skillexify-App/1.0',
          ...options?.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error making request to ${url}:`, error);
      throw error;
    }
  }

  protected formatDate(dateString: string): string {
    return new Date(dateString).toISOString();
  }
}

// GitHub API Integration
class GitHubAPI extends BasePlatformAPI {
  readonly platformName = 'GitHub';
  readonly baseUrl = 'https://api.github.com';
  readonly requiresAuth = false; // Can work with public data, but rate limited

  async fetchUserData(credentials: PlatformCredentials): Promise<PlatformUserData> {
    const { username, accessToken } = credentials;
    
    const headers: Record<string, string> = {};
    if (accessToken) {
      headers['Authorization'] = `token ${accessToken}`;
    }

    try {
      // Fetch user profile
      const userProfile = await this.makeRequest(`${this.baseUrl}/users/${username}`, { headers });
      
      // Fetch user repositories
      const repos = await this.makeRequest(`${this.baseUrl}/users/${username}/repos?per_page=100`, { headers });
      
      // Fetch user events for activity
      const events = await this.makeRequest(`${this.baseUrl}/users/${username}/events/public?per_page=30`, { headers });

      // Calculate stats
      const stats = this.calculateGitHubStats(userProfile, repos, events);
      
      // Extract achievements
      const achievements = this.extractGitHubAchievements(userProfile, repos, events);

      return {
        platform: this.platformName,
        username: userProfile.login,
        displayName: userProfile.name,
        avatarUrl: userProfile.avatar_url,
        profileUrl: userProfile.html_url,
        verified: userProfile.public_repos > 0,
        lastActive: events[0]?.created_at ? this.formatDate(events[0].created_at) : undefined,
        stats,
        achievements,
        rawData: { userProfile, repos, events }
      };
    } catch (error) {
      console.error('Error fetching GitHub data:', error);
      throw new Error(`Failed to fetch GitHub data for ${username}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private calculateGitHubStats(profile: any, repos: any[], events: any[]): PlatformStats {
    const totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
    const totalForks = repos.reduce((sum, repo) => sum + repo.forks_count, 0);
    const languages = [...new Set(repos.map(repo => repo.language).filter(Boolean))];
    
    // Calculate a simple score based on various factors
    const score = (
      (profile.public_repos * 5) +
      (totalStars * 2) +
      (totalForks * 3) +
      (profile.followers * 1) +
      (languages.length * 10)
    );

    // Determine tier based on score
    let tier = 'Bronze';
    if (score > 1000) tier = 'Platinum';
    else if (score > 500) tier = 'Gold';
    else if (score > 100) tier = 'Silver';

    return {
      score,
      repositories: profile.public_repos,
      followers: profile.followers,
      contributions: repos.length, // Simplified
      tier,
    };
  }

  private extractGitHubAchievements(profile: any, repos: any[], events: any[]): Achievement[] {
    const achievements: Achievement[] = [];

    // Repository milestones
    if (profile.public_repos >= 50) {
      achievements.push({
        id: 'repo_master',
        name: 'Repository Master',
        description: 'Created 50+ public repositories',
        earnedAt: this.formatDate(profile.created_at),
        rarity: 'epic'
      });
    } else if (profile.public_repos >= 10) {
      achievements.push({
        id: 'repo_creator',
        name: 'Repository Creator',
        description: 'Created 10+ public repositories',
        earnedAt: this.formatDate(profile.created_at),
        rarity: 'rare'
      });
    }

    // Follower milestones
    if (profile.followers >= 100) {
      achievements.push({
        id: 'popular_developer',
        name: 'Popular Developer',
        description: 'Gained 100+ followers',
        earnedAt: this.formatDate(profile.created_at),
        rarity: 'epic'
      });
    }

    // Star achievements
    const totalStars = repos.reduce((sum, repo) => sum + repo.stargazers_count, 0);
    if (totalStars >= 100) {
      achievements.push({
        id: 'star_collector',
        name: 'Star Collector',
        description: 'Earned 100+ stars across repositories',
        earnedAt: this.formatDate(profile.created_at),
        rarity: 'rare'
      });
    }

    return achievements;
  }
}

// LeetCode API Integration (unofficial API)
class LeetCodeAPI extends BasePlatformAPI {
  readonly platformName = 'LeetCode';
  readonly baseUrl = 'https://leetcode.com/graphql';
  readonly requiresAuth = false;

  async fetchUserData(credentials: PlatformCredentials): Promise<PlatformUserData> {
    const { username } = credentials;

    try {
      // LeetCode GraphQL query
      const query = `
        query getUserProfile($username: String!) {
          allQuestionsCount {
            difficulty
            count
          }
          matchedUser(username: $username) {
            username
            socialAccounts {
              provider
              profileUrl
            }
            githubUrl
            contributions {
              points
            }
            profile {
              reputation
              ranking
              userAvatar
              realName
              aboutMe
              school
              websites
              countryName
              company
              jobTitle
              skillTags
              postViewCount
              postViewCountDiff
              reputation
              reputationDiff
              solutionCount
              solutionCountDiff
              categoryDiscussCount
              categoryDiscussCountDiff
            }
            problemsSolvedBeatsStats {
              difficulty
              percentage
            }
            submitStatsGlobal {
              acSubmissionNum {
                difficulty
                count
                submissions
              }
            }
            badges {
              id
              displayName
              icon
              creationDate
            }
          }
        }
      `;

      const response = await this.makeRequest(this.baseUrl, {
        method: 'POST',
        body: JSON.stringify({
          query,
          variables: { username }
        })
      });

      if (!response.data?.matchedUser) {
        throw new Error('User not found');
      }

      const userData = response.data.matchedUser;
      const stats = this.calculateLeetCodeStats(userData, response.data.allQuestionsCount);
      const achievements = this.extractLeetCodeAchievements(userData);

      return {
        platform: this.platformName,
        username: userData.username,
        displayName: userData.profile.realName,
        avatarUrl: userData.profile.userAvatar,
        profileUrl: `https://leetcode.com/${username}/`,
        verified: userData.profile.solutionCount > 0,
        stats,
        achievements,
        rawData: userData
      };

    } catch (error) {
      console.error('Error fetching LeetCode data:', error);
      throw new Error(`Failed to fetch LeetCode data for ${username}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private calculateLeetCodeStats(userData: any, allQuestions: any[]): PlatformStats {
    const profile = userData.profile;
    const solvedStats = userData.submitStatsGlobal?.acSubmissionNum || [];
    
    const totalSolved = solvedStats.reduce((sum: number, stat: any) => sum + stat.count, 0);
    const totalSubmissions = solvedStats.reduce((sum: number, stat: any) => sum + stat.submissions, 0);
    const acceptanceRate = totalSubmissions > 0 ? (totalSolved / totalSubmissions) * 100 : 0;

    // Determine rank tier
    let tier = 'Bronze';
    if (profile.ranking && profile.ranking <= 1000) tier = 'Platinum';
    else if (profile.ranking && profile.ranking <= 10000) tier = 'Gold';
    else if (profile.ranking && profile.ranking <= 100000) tier = 'Silver';

    return {
      rank: profile.ranking ? `#${profile.ranking}` : undefined,
      rating: profile.reputation,
      totalSolutions: totalSolved,
      acceptanceRate: Math.round(acceptanceRate),
      tier,
      score: profile.reputation || 0
    };
  }

  private extractLeetCodeAchievements(userData: any): Achievement[] {
    const achievements: Achievement[] = [];

    // Convert LeetCode badges to achievements
    if (userData.badges) {
      userData.badges.forEach((badge: any) => {
        achievements.push({
          id: badge.id,
          name: badge.displayName,
          description: `Earned ${badge.displayName} badge`,
          iconUrl: badge.icon,
          earnedAt: this.formatDate(badge.creationDate),
          rarity: 'rare'
        });
      });
    }

    // Problem solving milestones
    const profile = userData.profile;
    if (profile.solutionCount >= 1000) {
      achievements.push({
        id: 'problem_master',
        name: 'Problem Master',
        description: 'Solved 1000+ problems',
        earnedAt: new Date().toISOString(),
        rarity: 'legendary'
      });
    } else if (profile.solutionCount >= 100) {
      achievements.push({
        id: 'problem_solver',
        name: 'Problem Solver',
        description: 'Solved 100+ problems',
        earnedAt: new Date().toISOString(),
        rarity: 'epic'
      });
    }

    return achievements;
  }
}

// Kaggle API Integration (requires API key)
class KaggleAPI extends BasePlatformAPI {
  readonly platformName = 'Kaggle';
  readonly baseUrl = 'https://www.kaggle.com/api/v1';
  readonly requiresAuth = true;

  async fetchUserData(credentials: PlatformCredentials): Promise<PlatformUserData> {
    const { username, apiKey } = credentials;

    if (!apiKey) {
      throw new Error('Kaggle API key is required');
    }

    try {
      // Note: Kaggle API requires authentication with username:key in base64
      const basic = `${username}:${apiKey}`;
      // Use btoa where available (web), Buffer fallback for native
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const auth = typeof btoa === 'function' ? btoa(basic) : require('buffer').Buffer.from(basic, 'utf-8').toString('base64');
      const headers = { 'Authorization': `Basic ${auth}` };

      // Fetch user profile (this endpoint may not exist in public API)
      // This is a mock implementation - actual Kaggle API structure may differ
      const profile = await this.makeRequest(`${this.baseUrl}/users/${username}`, { headers });
      
      const stats = this.calculateKaggleStats(profile);
      const achievements = this.extractKaggleAchievements(profile);

      return {
        platform: this.platformName,
        username: profile.username || username,
        displayName: profile.displayName,
        avatarUrl: profile.avatarUrl,
        profileUrl: `https://www.kaggle.com/${username}`,
        verified: true,
        stats,
        achievements,
        rawData: profile
      };

    } catch (error) {
      console.error('Error fetching Kaggle data:', error);
      // Return mock data for demo purposes
      return this.getMockKaggleData(username);
    }
  }

  private getMockKaggleData(username: string): PlatformUserData {
    const mockData = {
      username,
      displayName: username,
      tier: 'Expert',
      competitions: Math.floor(Math.random() * 20) + 5,
      medals: Math.floor(Math.random() * 10) + 1,
      datasets: Math.floor(Math.random() * 15) + 3,
      notebooks: Math.floor(Math.random() * 50) + 10
    };

    return {
      platform: this.platformName,
      username,
      displayName: mockData.displayName,
      profileUrl: `https://www.kaggle.com/${username}`,
      verified: true,
      stats: {
        tier: mockData.tier,
        badges: mockData.medals,
        score: mockData.competitions * 100 + mockData.medals * 50
      },
      achievements: [
        {
          id: 'kaggle_expert',
          name: 'Kaggle Expert',
          description: 'Achieved Expert tier',
          earnedAt: new Date().toISOString(),
          rarity: 'epic'
        }
      ],
      rawData: mockData
    };
  }

  private calculateKaggleStats(profile: any): PlatformStats {
    return {
      tier: profile.tier,
      badges: profile.totalMedals,
      score: profile.performancePoints || 0
    };
  }

  private extractKaggleAchievements(profile: any): Achievement[] {
    const achievements: Achievement[] = [];
    
    if (profile.tier === 'Grandmaster') {
      achievements.push({
        id: 'kaggle_grandmaster',
        name: 'Kaggle Grandmaster',
        description: 'Achieved Grandmaster tier',
        earnedAt: new Date().toISOString(),
        rarity: 'legendary'
      });
    }

    return achievements;
  }
}

// Stack Overflow API Integration
class StackOverflowAPI extends BasePlatformAPI {
  readonly platformName = 'Stack Overflow';
  readonly baseUrl = 'https://api.stackexchange.com/2.3';
  readonly requiresAuth = false;

  async fetchUserData(credentials: PlatformCredentials): Promise<PlatformUserData> {
    const { username } = credentials;

    try {
      // Search for user by display name
      const userSearch = await this.makeRequest(
        `${this.baseUrl}/users?inname=${encodeURIComponent(username)}&site=stackoverflow`
      );

      if (!userSearch.items || userSearch.items.length === 0) {
        throw new Error('User not found');
      }

      const user = userSearch.items[0];
      const userId = user.user_id;

      // Fetch user details
      const userDetails = await this.makeRequest(
        `${this.baseUrl}/users/${userId}?site=stackoverflow`
      );

      // Fetch user badges
      const badges = await this.makeRequest(
        `${this.baseUrl}/users/${userId}/badges?site=stackoverflow`
      );

      const userData = userDetails.items[0];
      const stats = this.calculateStackOverflowStats(userData, badges.items);
      const achievements = this.extractStackOverflowAchievements(badges.items);

      return {
        platform: this.platformName,
        username: userData.display_name,
        displayName: userData.display_name,
        avatarUrl: userData.profile_image,
        profileUrl: userData.link,
        verified: userData.reputation > 100,
        stats,
        achievements,
        rawData: { user: userData, badges: badges.items }
      };

    } catch (error) {
      console.error('Error fetching Stack Overflow data:', error);
      throw new Error(`Failed to fetch Stack Overflow data for ${username}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private calculateStackOverflowStats(userData: any, badges: any[]): PlatformStats {
    const goldBadges = badges.filter(b => b.rank === 'gold').length;
    const silverBadges = badges.filter(b => b.rank === 'silver').length;
    const bronzeBadges = badges.filter(b => b.rank === 'bronze').length;

    // Determine tier based on reputation
    let tier = 'Bronze';
    if (userData.reputation >= 25000) tier = 'Platinum';
    else if (userData.reputation >= 10000) tier = 'Gold';
    else if (userData.reputation >= 1000) tier = 'Silver';

    return {
      rating: userData.reputation,
      badges: goldBadges + silverBadges + bronzeBadges,
      tier,
      score: userData.reputation
    };
  }

  private extractStackOverflowAchievements(badges: any[]): Achievement[] {
    return badges.slice(0, 10).map(badge => ({
      id: badge.badge_id.toString(),
      name: badge.name,
      description: badge.description || `Earned ${badge.name} badge`,
      earnedAt: new Date(badge.award_count * 1000).toISOString(),
      rarity: badge.rank === 'gold' ? 'epic' : badge.rank === 'silver' ? 'rare' : 'common'
    }));
  }
}

// HackerRank API Integration (mock implementation)
class HackerRankAPI extends BasePlatformAPI {
  readonly platformName = 'HackerRank';
  readonly baseUrl = 'https://www.hackerrank.com/api';
  readonly requiresAuth = false;

  async fetchUserData(credentials: PlatformCredentials): Promise<PlatformUserData> {
    const { username } = credentials;

    // HackerRank doesn't have a public API, so we'll return mock data
    const mockData = {
      username,
      rank: Math.floor(Math.random() * 100000) + 1000,
      score: Math.floor(Math.random() * 2000) + 500,
      badges: Math.floor(Math.random() * 15) + 5,
      challengesSolved: Math.floor(Math.random() * 100) + 20
    };

    return {
      platform: this.platformName,
      username,
      displayName: username,
      profileUrl: `https://www.hackerrank.com/${username}`,
      verified: true,
      stats: {
        rank: `#${mockData.rank}`,
        score: mockData.score,
        badges: mockData.badges,
        totalSolutions: mockData.challengesSolved,
        tier: mockData.score > 1500 ? 'Gold' : mockData.score > 1000 ? 'Silver' : 'Bronze'
      },
      achievements: [
        {
          id: 'problem_solver_hr',
          name: 'Problem Solver',
          description: `Solved ${mockData.challengesSolved} challenges`,
          earnedAt: new Date().toISOString(),
          rarity: 'rare'
        }
      ],
      rawData: mockData
    };
  }
}

// Main Platform API Service
export class PlatformAPIService {
  private apis: Map<string, BasePlatformAPI> = new Map();

  constructor() {
    this.apis.set('GitHub', new GitHubAPI());
    this.apis.set('LeetCode', new LeetCodeAPI());
    this.apis.set('Kaggle', new KaggleAPI());
    this.apis.set('Stack Overflow', new StackOverflowAPI());
    this.apis.set('HackerRank', new HackerRankAPI());
  }

  async fetchUserData(credentials: PlatformCredentials): Promise<PlatformUserData> {
    const api = this.apis.get(credentials.platform);
    
    if (!api) {
      throw new Error(`Unsupported platform: ${credentials.platform}`);
    }

    return await api.fetchUserData(credentials);
  }

  getSupportedPlatforms(): string[] {
    return Array.from(this.apis.keys());
  }

  isPlatformSupported(platform: string): boolean {
    return this.apis.has(platform);
  }

  requiresAuth(platform: string): boolean {
    const api = this.apis.get(platform);
    return api?.requiresAuth || false;
  }
}

// Singleton instance
export const platformAPIService = new PlatformAPIService();
