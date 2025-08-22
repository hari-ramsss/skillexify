use cosmwasm_std::Addr;
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct InstantiateMsg {
    pub admin: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum ExecuteMsg {
    // Store a skill verification proof
    StoreProof {
        platform: String,
        username: String,
        skill_data: String, // JSON string of verified data
        proof_hash: String,
        metadata: Option<String>,
    },
    // Update user's reputation score
    UpdateReputation {
        user: String,
        score_delta: i32,
        reason: String,
    },
    // Add peer endorsement
    AddEndorsement {
        endorsee: String,
        skill: String,
        message: String,
        weight: u32, // endorsement weight based on endorser's reputation
    },
    // Mint/Update skill NFT
    MintSkillNft {
        recipient: String,
        platform: String,
        skill_level: u32, // 1-4 (Bronze, Silver, Gold, Platinum)
        token_uri: String,
    },
    // Update admin
    UpdateAdmin {
        new_admin: String,
    },
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
#[serde(rename_all = "snake_case")]
pub enum QueryMsg {
    // Get user's proofs
    GetUserProofs {
        user: String,
        platform: Option<String>,
    },
    // Get specific proof by ID
    GetProof {
        proof_id: String,
    },
    // Get user's reputation score
    GetReputation {
        user: String,
    },
    // Get user's endorsements
    GetEndorsements {
        user: String,
        skill: Option<String>,
    },
    // Get user's NFTs
    GetUserNfts {
        user: String,
    },
    // Get leaderboard
    GetLeaderboard {
        platform: Option<String>,
        limit: Option<u32>,
    },
    // Get platform statistics
    GetPlatformStats {
        platform: String,
    },
    // Get contract config
    GetConfig {},
}

// Responses
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct ProofResponse {
    pub id: String,
    pub user: Addr,
    pub platform: String,
    pub username: String,
    pub skill_data: String,
    pub proof_hash: String,
    pub timestamp: u64,
    pub verified: bool,
    pub metadata: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct ReputationResponse {
    pub user: Addr,
    pub score: i32,
    pub total_proofs: u32,
    pub endorsements_received: u32,
    pub endorsements_given: u32,
    pub last_updated: u64,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct EndorsementResponse {
    pub id: String,
    pub endorser: Addr,
    pub endorsee: Addr,
    pub skill: String,
    pub message: String,
    pub weight: u32,
    pub timestamp: u64,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct NftResponse {
    pub token_id: String,
    pub owner: Addr,
    pub platform: String,
    pub skill_level: u32,
    pub token_uri: String,
    pub created_at: u64,
    pub last_updated: u64,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct LeaderboardEntry {
    pub user: Addr,
    pub score: i32,
    pub rank: u32,
    pub primary_platform: String,
    pub total_proofs: u32,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct ConfigResponse {
    pub admin: Addr,
    pub total_proofs: u32,
    pub total_users: u32,
    pub supported_platforms: Vec<String>,
}
