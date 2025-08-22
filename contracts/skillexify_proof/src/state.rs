use cosmwasm_std::Addr;
use cw_storage_plus::{Item, Map};
use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct Config {
    pub admin: Addr,
    pub total_proofs: u32,
    pub total_users: u32,
    pub supported_platforms: Vec<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct SkillProof {
    pub id: String,
    pub user: Addr,
    pub platform: String,
    pub username: String,
    pub skill_data: String, // JSON string of verified data
    pub proof_hash: String,
    pub timestamp: u64,
    pub verified: bool,
    pub metadata: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct UserReputation {
    pub user: Addr,
    pub score: i32,
    pub total_proofs: u32,
    pub endorsements_received: u32,
    pub endorsements_given: u32,
    pub last_updated: u64,
    pub platforms: Vec<String>, // platforms user has verified on
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct Endorsement {
    pub id: String,
    pub endorser: Addr,
    pub endorsee: Addr,
    pub skill: String,
    pub message: String,
    pub weight: u32,
    pub timestamp: u64,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct SkillNft {
    pub token_id: String,
    pub owner: Addr,
    pub platform: String,
    pub skill_level: u32, // 1=Bronze, 2=Silver, 3=Gold, 4=Platinum
    pub token_uri: String,
    pub created_at: u64,
    pub last_updated: u64,
    pub proof_count: u32, // number of proofs supporting this NFT level
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, JsonSchema)]
pub struct PlatformStats {
    pub platform: String,
    pub total_users: u32,
    pub total_proofs: u32,
    pub average_score: f64,
    pub top_users: Vec<Addr>,
}

// Storage
pub const CONFIG: Item<Config> = Item::new("config");

// proof_id -> SkillProof
pub const PROOFS: Map<String, SkillProof> = Map::new("proofs");

// user_addr -> UserReputation
pub const REPUTATIONS: Map<&Addr, UserReputation> = Map::new("reputations");

// endorsement_id -> Endorsement
pub const ENDORSEMENTS: Map<String, Endorsement> = Map::new("endorsements");

// token_id -> SkillNft
pub const SKILL_NFTS: Map<String, SkillNft> = Map::new("skill_nfts");

// platform -> PlatformStats
pub const PLATFORM_STATS: Map<String, PlatformStats> = Map::new("platform_stats");

// Secondary indexes for efficient queries
// user_addr -> Vec<proof_id>
pub const USER_PROOFS: Map<&Addr, Vec<String>> = Map::new("user_proofs");

// user_addr -> Vec<endorsement_id>
pub const USER_ENDORSEMENTS: Map<&Addr, Vec<String>> = Map::new("user_endorsements");

// user_addr -> Vec<token_id>
pub const USER_NFTS: Map<&Addr, Vec<String>> = Map::new("user_nfts");

// platform -> Vec<user_addr> (sorted by score for leaderboard)
pub const PLATFORM_LEADERBOARDS: Map<String, Vec<Addr>> = Map::new("platform_leaderboards");

// Global leaderboard (all platforms combined)
pub const GLOBAL_LEADERBOARD: Item<Vec<Addr>> = Item::new("global_leaderboard");
