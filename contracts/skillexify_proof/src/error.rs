use cosmwasm_std::StdError;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum ContractError {
    #[error("{0}")]
    Std(#[from] StdError),

    #[error("Unauthorized")]
    Unauthorized {},

    #[error("Invalid platform: {platform}")]
    InvalidPlatform { platform: String },

    #[error("Proof not found: {proof_id}")]
    ProofNotFound { proof_id: String },

    #[error("User not found: {user}")]
    UserNotFound { user: String },

    #[error("NFT not found: {token_id}")]
    NftNotFound { token_id: String },

    #[error("Duplicate proof: proof already exists for this user and platform")]
    DuplicateProof {},

    #[error("Invalid skill level: {level}. Must be between 1 and 4")]
    InvalidSkillLevel { level: u32 },

    #[error("Invalid endorsement weight: {weight}. Must be between 1 and 100")]
    InvalidEndorsementWeight { weight: u32 },

    #[error("Self endorsement not allowed")]
    SelfEndorsement {},

    #[error("Insufficient reputation to perform this action")]
    InsufficientReputation {},

    #[error("Invalid proof hash format")]
    InvalidProofHash {},

    #[error("Platform not supported: {platform}")]
    UnsupportedPlatform { platform: String },

    #[error("Empty username provided")]
    EmptyUsername {},

    #[error("Invalid skill data format")]
    InvalidSkillData {},
}
