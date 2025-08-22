import { CosmWasmClient, SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
import { GasPrice } from '@cosmjs/stargate';

// Contract addresses (these would be set after deployment)
export const CONTRACT_ADDRESSES = {
  SKILL_PROOF: process.env.EXPO_PUBLIC_SKILL_PROOF_CONTRACT || '',
};

// RPC endpoints
export const RPC_ENDPOINTS = {
  XION_TESTNET: process.env.EXPO_PUBLIC_RPC_ENDPOINT || 'https://rpc.xion-testnet-2.burnt.com:443',
  XION_MAINNET: 'https://rpc.xion.burnt.com:443',
};

export interface SkillProofData {
  platform: string;
  username: string;
  skillData: any;
  proofHash: string;
  metadata?: string;
}

export interface UserProof {
  id: string;
  user: string;
  platform: string;
  username: string;
  skillData: string;
  proofHash: string;
  timestamp: number;
  verified: boolean;
  metadata?: string;
}

export interface UserReputation {
  user: string;
  score: number;
  totalProofs: number;
  endorsementsReceived: number;
  endorsementsGiven: number;
  lastUpdated: number;
}

export interface Endorsement {
  id: string;
  endorser: string;
  endorsee: string;
  skill: string;
  message: string;
  weight: number;
  timestamp: number;
}

export interface SkillNFT {
  tokenId: string;
  owner: string;
  platform: string;
  skillLevel: number;
  tokenUri: string;
  createdAt: number;
  lastUpdated: number;
}

export interface LeaderboardEntry {
  user: string;
  score: number;
  rank: number;
  primaryPlatform: string;
  totalProofs: number;
}

export class BlockchainService {
  private client: CosmWasmClient | null = null;
  private signingClient: SigningCosmWasmClient | null = null;
  private userAddress: string | null = null;

  async initialize(rpcEndpoint: string = RPC_ENDPOINTS.XION_TESTNET) {
    this.client = await CosmWasmClient.connect(rpcEndpoint);
  }

  async initializeWithSigner(
    signingClient: any,
    userAddress: string
  ) {
    this.signingClient = signingClient;
    this.userAddress = userAddress;
    
    // Also initialize read-only client
    if (!this.client) {
      await this.initialize();
    }
  }

  // Store a skill verification proof on-chain
  async storeProof(proofData: SkillProofData): Promise<string> {
    if (!this.signingClient || !this.userAddress) {
      throw new Error('Signing client not initialized');
    }
    if (!CONTRACT_ADDRESSES.SKILL_PROOF) {
      throw new Error('Contract address is not configured');
    }

    const msg = {
      store_proof: {
        platform: proofData.platform,
        username: proofData.username,
        skill_data: JSON.stringify(proofData.skillData),
        proof_hash: proofData.proofHash,
        metadata: proofData.metadata,
      },
    };

    try {
      const result = await this.signingClient.execute(
        this.userAddress,
        CONTRACT_ADDRESSES.SKILL_PROOF,
        msg,
        'auto',
        'Storing skill verification proof'
      );

      return result.transactionHash;
    } catch (error) {
      console.error('Error storing proof:', error);
      throw error;
    }
  }

  // Add peer endorsement
  async addEndorsement(
    endorsee: string,
    skill: string,
    message: string,
    weight: number = 10
  ): Promise<string> {
    if (!this.signingClient || !this.userAddress) {
      throw new Error('Signing client not initialized');
    }
    if (!CONTRACT_ADDRESSES.SKILL_PROOF) {
      throw new Error('Contract address is not configured');
    }

    const msg = {
      add_endorsement: {
        endorsee,
        skill,
        message,
        weight,
      },
    };

    try {
      const result = await this.signingClient.execute(
        this.userAddress,
        CONTRACT_ADDRESSES.SKILL_PROOF,
        msg,
        'auto',
        'Adding peer endorsement'
      );

      return result.transactionHash;
    } catch (error) {
      console.error('Error adding endorsement:', error);
      throw error;
    }
  }

  // Mint skill NFT (admin only initially)
  async mintSkillNFT(
    recipient: string,
    platform: string,
    skillLevel: number,
    tokenUri: string
  ): Promise<string> {
    if (!this.signingClient || !this.userAddress) {
      throw new Error('Signing client not initialized');
    }
    if (!CONTRACT_ADDRESSES.SKILL_PROOF) {
      throw new Error('Contract address is not configured');
    }

    const msg = {
      mint_skill_nft: {
        recipient,
        platform,
        skill_level: skillLevel,
        token_uri: tokenUri,
      },
    };

    try {
      const result = await this.signingClient.execute(
        this.userAddress,
        CONTRACT_ADDRESSES.SKILL_PROOF,
        msg,
        'auto',
        'Minting skill NFT'
      );

      return result.transactionHash;
    } catch (error) {
      console.error('Error minting NFT:', error);
      throw error;
    }
  }

  // Query user's proofs
  async getUserProofs(userAddress: string, platform?: string): Promise<UserProof[]> {
    if (!this.client) {
      throw new Error('Client not initialized');
    }
    if (!CONTRACT_ADDRESSES.SKILL_PROOF) {
      return [];
    }

    const query = {
      get_user_proofs: {
        user: userAddress,
        platform,
      },
    };

    try {
      const result = await this.client.queryContractSmart(
        CONTRACT_ADDRESSES.SKILL_PROOF,
        query
      );
      return result;
    } catch (error) {
      console.error('Error querying user proofs:', error);
      return [];
    }
  }

  // Query specific proof
  async getProof(proofId: string): Promise<UserProof | null> {
    if (!this.client) {
      throw new Error('Client not initialized');
    }
    if (!CONTRACT_ADDRESSES.SKILL_PROOF) {
      return null;
    }

    const query = {
      get_proof: {
        proof_id: proofId,
      },
    };

    try {
      const result = await this.client.queryContractSmart(
        CONTRACT_ADDRESSES.SKILL_PROOF,
        query
      );
      return result;
    } catch (error) {
      console.error('Error querying proof:', error);
      return null;
    }
  }

  // Query user's reputation
  async getUserReputation(userAddress: string): Promise<UserReputation | null> {
    if (!this.client) {
      throw new Error('Client not initialized');
    }
    if (!CONTRACT_ADDRESSES.SKILL_PROOF) {
      return null;
    }

    const query = {
      get_reputation: {
        user: userAddress,
      },
    };

    try {
      const result = await this.client.queryContractSmart(
        CONTRACT_ADDRESSES.SKILL_PROOF,
        query
      );
      return result;
    } catch (error) {
      console.error('Error querying reputation:', error);
      return null;
    }
  }

  // Query user's endorsements
  async getUserEndorsements(userAddress: string, skill?: string): Promise<Endorsement[]> {
    if (!this.client) {
      throw new Error('Client not initialized');
    }
    if (!CONTRACT_ADDRESSES.SKILL_PROOF) {
      return [];
    }

    const query = {
      get_endorsements: {
        user: userAddress,
        skill,
      },
    };

    try {
      const result = await this.client.queryContractSmart(
        CONTRACT_ADDRESSES.SKILL_PROOF,
        query
      );
      return result;
    } catch (error) {
      console.error('Error querying endorsements:', error);
      return [];
    }
  }

  // Query user's NFTs
  async getUserNFTs(userAddress: string): Promise<SkillNFT[]> {
    if (!this.client) {
      throw new Error('Client not initialized');
    }
    if (!CONTRACT_ADDRESSES.SKILL_PROOF) {
      return [];
    }

    const query = {
      get_user_nfts: {
        user: userAddress,
      },
    };

    try {
      const result = await this.client.queryContractSmart(
        CONTRACT_ADDRESSES.SKILL_PROOF,
        query
      );
      return result;
    } catch (error) {
      console.error('Error querying user NFTs:', error);
      return [];
    }
  }

  // Query leaderboard
  async getLeaderboard(platform?: string, limit: number = 100): Promise<LeaderboardEntry[]> {
    if (!this.client) {
      throw new Error('Client not initialized');
    }
    if (!CONTRACT_ADDRESSES.SKILL_PROOF) {
      return [];
    }

    const query = {
      get_leaderboard: {
        platform,
        limit,
      },
    };

    try {
      const result = await this.client.queryContractSmart(
        CONTRACT_ADDRESSES.SKILL_PROOF,
        query
      );
      return result;
    } catch (error) {
      console.error('Error querying leaderboard:', error);
      return [];
    }
  }

  // Query platform statistics
  async getPlatformStats(platform: string) {
    if (!this.client) {
      throw new Error('Client not initialized');
    }
    if (!CONTRACT_ADDRESSES.SKILL_PROOF) {
      return null;
    }

    const query = {
      get_platform_stats: {
        platform,
      },
    };

    try {
      const result = await this.client.queryContractSmart(
        CONTRACT_ADDRESSES.SKILL_PROOF,
        query
      );
      return result;
    } catch (error) {
      console.error('Error querying platform stats:', error);
      return null;
    }
  }

  // Query contract configuration
  async getConfig() {
    if (!this.client) {
      throw new Error('Client not initialized');
    }
    if (!CONTRACT_ADDRESSES.SKILL_PROOF) {
      return null;
    }

    const query = { get_config: {} };

    try {
      const result = await this.client.queryContractSmart(
        CONTRACT_ADDRESSES.SKILL_PROOF,
        query
      );
      return result;
    } catch (error) {
      console.error('Error querying config:', error);
      return null;
    }
  }

  // Helper method to calculate skill level based on proofs
  calculateSkillLevel(proofCount: number, platformScore: number): number {
    if (proofCount >= 10 && platformScore >= 1000) return 4; // Platinum
    if (proofCount >= 5 && platformScore >= 500) return 3;   // Gold
    if (proofCount >= 2 && platformScore >= 100) return 2;   // Silver
    return 1; // Bronze
  }

  // Helper method to generate proof hash (simplified)
  generateProofHash(data: any): string {
    // In a real implementation, this would use actual cryptographic hashing
    // and include zkTLS proof data
    const jsonString = JSON.stringify(data);
    return `proof_${Date.now()}_${jsonString.length}_${Math.random().toString(36).substring(7)}`;
  }

  // Disconnect
  disconnect() {
    this.client = null;
    this.signingClient = null;
    this.userAddress = null;
  }
}

// Singleton instance
export const blockchainService = new BlockchainService();
