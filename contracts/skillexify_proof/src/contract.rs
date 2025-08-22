use cosmwasm_std::{
    entry_point, to_json_binary, Addr, Binary, Deps, DepsMut, Env, MessageInfo, Response, StdResult,
};
use cw2::set_contract_version;

use crate::error::ContractError;
use crate::msg::{
    ConfigResponse, EndorsementResponse, ExecuteMsg, InstantiateMsg, LeaderboardEntry, NftResponse,
    ProofResponse, QueryMsg, ReputationResponse,
};
use crate::state::{
    Config, Endorsement, PlatformStats, SkillNft, SkillProof, UserReputation, CONFIG,
    ENDORSEMENTS, GLOBAL_LEADERBOARD, PLATFORM_LEADERBOARDS, PLATFORM_STATS, PROOFS,
    REPUTATIONS, SKILL_NFTS, USER_ENDORSEMENTS, USER_NFTS, USER_PROOFS,
};

// Version info for migration info
const CONTRACT_NAME: &str = "skillexify-proof";
const CONTRACT_VERSION: &str = env!("CARGO_PKG_VERSION");

// Supported platforms
const SUPPORTED_PLATFORMS: &[&str] = &["LeetCode", "GitHub", "Kaggle", "HackerRank", "Stack Overflow"];

#[entry_point]
pub fn instantiate(
    deps: DepsMut,
    _env: Env,
    info: MessageInfo,
    msg: InstantiateMsg,
) -> Result<Response, ContractError> {
    let admin = msg
        .admin
        .map(|s| deps.api.addr_validate(&s))
        .transpose()?
        .unwrap_or_else(|| info.sender.clone());

    let config = Config {
        admin,
        total_proofs: 0,
        total_users: 0,
        supported_platforms: SUPPORTED_PLATFORMS.iter().map(|&s| s.to_string()).collect(),
    };

    set_contract_version(deps.storage, CONTRACT_NAME, CONTRACT_VERSION)?;
    CONFIG.save(deps.storage, &config)?;

    // Initialize empty global leaderboard
    GLOBAL_LEADERBOARD.save(deps.storage, &vec![])?;

    Ok(Response::new()
        .add_attribute("method", "instantiate")
        .add_attribute("admin", config.admin))
}

#[entry_point]
pub fn execute(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    msg: ExecuteMsg,
) -> Result<Response, ContractError> {
    match msg {
        ExecuteMsg::StoreProof {
            platform,
            username,
            skill_data,
            proof_hash,
            metadata,
        } => execute_store_proof(deps, env, info, platform, username, skill_data, proof_hash, metadata),
        ExecuteMsg::UpdateReputation {
            user,
            score_delta,
            reason,
        } => execute_update_reputation(deps, env, info, user, score_delta, reason),
        ExecuteMsg::AddEndorsement {
            endorsee,
            skill,
            message,
            weight,
        } => execute_add_endorsement(deps, env, info, endorsee, skill, message, weight),
        ExecuteMsg::MintSkillNft {
            recipient,
            platform,
            skill_level,
            token_uri,
        } => execute_mint_skill_nft(deps, env, info, recipient, platform, skill_level, token_uri),
        ExecuteMsg::UpdateAdmin { new_admin } => execute_update_admin(deps, info, new_admin),
    }
}

pub fn execute_store_proof(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    platform: String,
    username: String,
    skill_data: String,
    proof_hash: String,
    metadata: Option<String>,
) -> Result<Response, ContractError> {
    // Validate platform
    let config = CONFIG.load(deps.storage)?;
    if !config.supported_platforms.contains(&platform) {
        return Err(ContractError::UnsupportedPlatform { platform });
    }

    // Validate inputs
    if username.trim().is_empty() {
        return Err(ContractError::EmptyUsername {});
    }

    if skill_data.trim().is_empty() {
        return Err(ContractError::InvalidSkillData {});
    }

    if proof_hash.len() < 32 {
        return Err(ContractError::InvalidProofHash {});
    }

    // Generate proof ID
    let proof_id = format!("{}:{}:{}", info.sender, platform, env.block.time.seconds());

    // Create proof
    let proof = SkillProof {
        id: proof_id.clone(),
        user: info.sender.clone(),
        platform: platform.clone(),
        username: username.clone(),
        skill_data: skill_data.clone(),
        proof_hash,
        timestamp: env.block.time.seconds(),
        verified: true, // In real implementation, this would be set after zkTLS verification
        metadata,
    };

    // Store proof
    PROOFS.save(deps.storage, proof_id.clone(), &proof)?;

    // Update user proofs index
    let mut user_proofs = USER_PROOFS
        .may_load(deps.storage, &info.sender)?
        .unwrap_or_default();
    user_proofs.push(proof_id.clone());
    USER_PROOFS.save(deps.storage, &info.sender, &user_proofs)?;

    // Update or create user reputation
    let mut reputation = REPUTATIONS
        .may_load(deps.storage, &info.sender)?
        .unwrap_or_else(|| UserReputation {
            user: info.sender.clone(),
            score: 0,
            total_proofs: 0,
            endorsements_received: 0,
            endorsements_given: 0,
            last_updated: env.block.time.seconds(),
            platforms: vec![],
        });

    reputation.total_proofs += 1;
    reputation.score += 10; // Base score for each proof
    reputation.last_updated = env.block.time.seconds();
    if !reputation.platforms.contains(&platform) {
        reputation.platforms.push(platform.clone());
        reputation.score += 25; // Bonus for new platform
    }

    REPUTATIONS.save(deps.storage, &info.sender, &reputation)?;

    // Update platform stats
    let platform_clone = platform.clone();
    let mut stats = PLATFORM_STATS
        .may_load(deps.storage, platform_clone.clone())?
        .unwrap_or_else(|| PlatformStats {
            platform: platform_clone.clone(),
            total_users: 0,
            total_proofs: 0,
            average_score: 0.0,
            top_users: vec![],
        });

    stats.total_proofs += 1;
    if !stats.top_users.contains(&info.sender) {
        stats.total_users += 1;
        stats.top_users.push(info.sender.clone());
    }

    PLATFORM_STATS.save(deps.storage, platform_clone, &stats)?;

    // Update global config
    let mut config = CONFIG.load(deps.storage)?;
    config.total_proofs += 1;
    CONFIG.save(deps.storage, &config)?;

    // Update leaderboards (simplified version)
    update_leaderboards(deps.storage, &platform, &info.sender)?;

    Ok(Response::new()
        .add_attribute("method", "store_proof")
        .add_attribute("proof_id", proof_id)
        .add_attribute("user", info.sender)
        .add_attribute("platform", platform)
        .add_attribute("score_gained", "10"))
}

pub fn execute_add_endorsement(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    endorsee: String,
    skill: String,
    message: String,
    weight: u32,
) -> Result<Response, ContractError> {
    let endorsee_addr = deps.api.addr_validate(&endorsee)?;

    // Prevent self-endorsement
    if info.sender == endorsee_addr {
        return Err(ContractError::SelfEndorsement {});
    }

    // Validate weight
    if weight == 0 || weight > 100 {
        return Err(ContractError::InvalidEndorsementWeight { weight });
    }

    // Check if endorser has sufficient reputation (optional)
    let endorser_reputation = REPUTATIONS.may_load(deps.storage, &info.sender)?;
    if let Some(rep) = endorser_reputation {
        if rep.score < 50 {
            return Err(ContractError::InsufficientReputation {});
        }
    } else {
        return Err(ContractError::InsufficientReputation {});
    }

    // Generate endorsement ID
    let endorsement_id = format!("{}:{}:{}", info.sender, endorsee_addr, env.block.time.seconds());

    // Create endorsement
    let endorsement = Endorsement {
        id: endorsement_id.clone(),
        endorser: info.sender.clone(),
        endorsee: endorsee_addr.clone(),
        skill: skill.clone(),
        message,
        weight,
        timestamp: env.block.time.seconds(),
    };

    // Store endorsement
    ENDORSEMENTS.save(deps.storage, endorsement_id.clone(), &endorsement)?;

    // Update endorsee's endorsements index
    let mut user_endorsements = USER_ENDORSEMENTS
        .may_load(deps.storage, &endorsee_addr)?
        .unwrap_or_default();
    user_endorsements.push(endorsement_id.clone());
    USER_ENDORSEMENTS.save(deps.storage, &endorsee_addr, &user_endorsements)?;

    // Update reputations
    let mut endorsee_rep = REPUTATIONS
        .may_load(deps.storage, &endorsee_addr)?
        .unwrap_or_else(|| UserReputation {
            user: endorsee_addr.clone(),
            score: 0,
            total_proofs: 0,
            endorsements_received: 0,
            endorsements_given: 0,
            last_updated: env.block.time.seconds(),
            platforms: vec![],
        });

    let mut endorser_rep = REPUTATIONS.load(deps.storage, &info.sender)?;

    endorsee_rep.endorsements_received += 1;
    endorsee_rep.score += weight as i32;
    endorsee_rep.last_updated = env.block.time.seconds();

    endorser_rep.endorsements_given += 1;
    endorser_rep.score += 5; // Small bonus for giving endorsements
    endorser_rep.last_updated = env.block.time.seconds();

    REPUTATIONS.save(deps.storage, &endorsee_addr, &endorsee_rep)?;
    REPUTATIONS.save(deps.storage, &info.sender, &endorser_rep)?;

    Ok(Response::new()
        .add_attribute("method", "add_endorsement")
        .add_attribute("endorsement_id", endorsement_id)
        .add_attribute("endorser", info.sender)
        .add_attribute("endorsee", endorsee_addr)
        .add_attribute("skill", skill)
        .add_attribute("weight", weight.to_string()))
}

pub fn execute_mint_skill_nft(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    recipient: String,
    platform: String,
    skill_level: u32,
    token_uri: String,
) -> Result<Response, ContractError> {
    // Only admin can mint NFTs initially (in production, this would be automated)
    let config = CONFIG.load(deps.storage)?;
    if info.sender != config.admin {
        return Err(ContractError::Unauthorized {});
    }

    let recipient_addr = deps.api.addr_validate(&recipient)?;

    // Validate skill level
    if skill_level < 1 || skill_level > 4 {
        return Err(ContractError::InvalidSkillLevel { level: skill_level });
    }

    // Validate platform
    if !config.supported_platforms.contains(&platform) {
        return Err(ContractError::UnsupportedPlatform { platform });
    }

    // Generate token ID
    let token_id = format!("{}:{}:{}", recipient_addr, platform, skill_level);

    // Create NFT
    let nft = SkillNft {
        token_id: token_id.clone(),
        owner: recipient_addr.clone(),
        platform: platform.clone(),
        skill_level,
        token_uri,
        created_at: env.block.time.seconds(),
        last_updated: env.block.time.seconds(),
        proof_count: 1, // Will be updated based on actual proofs
    };

    // Store NFT
    SKILL_NFTS.save(deps.storage, token_id.clone(), &nft)?;

    // Update user NFTs index
    let mut user_nfts = USER_NFTS
        .may_load(deps.storage, &recipient_addr)?
        .unwrap_or_default();
    user_nfts.push(token_id.clone());
    USER_NFTS.save(deps.storage, &recipient_addr, &user_nfts)?;

    Ok(Response::new()
        .add_attribute("method", "mint_skill_nft")
        .add_attribute("token_id", token_id)
        .add_attribute("owner", recipient_addr)
        .add_attribute("platform", platform)
        .add_attribute("skill_level", skill_level.to_string()))
}

pub fn execute_update_reputation(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    user: String,
    score_delta: i32,
    reason: String,
) -> Result<Response, ContractError> {
    // Only admin can manually update reputation
    let config = CONFIG.load(deps.storage)?;
    if info.sender != config.admin {
        return Err(ContractError::Unauthorized {});
    }

    let user_addr = deps.api.addr_validate(&user)?;
    let mut reputation = REPUTATIONS
        .may_load(deps.storage, &user_addr)?
        .ok_or(ContractError::UserNotFound { user })?;

    reputation.score += score_delta;
    reputation.last_updated = env.block.time.seconds();

    REPUTATIONS.save(deps.storage, &user_addr, &reputation)?;

    Ok(Response::new()
        .add_attribute("method", "update_reputation")
        .add_attribute("user", user_addr)
        .add_attribute("score_delta", score_delta.to_string())
        .add_attribute("reason", reason))
}

pub fn execute_update_admin(
    deps: DepsMut,
    info: MessageInfo,
    new_admin: String,
) -> Result<Response, ContractError> {
    let mut config = CONFIG.load(deps.storage)?;
    if info.sender != config.admin {
        return Err(ContractError::Unauthorized {});
    }

    let new_admin_addr = deps.api.addr_validate(&new_admin)?;
    config.admin = new_admin_addr.clone();
    CONFIG.save(deps.storage, &config)?;

    Ok(Response::new()
        .add_attribute("method", "update_admin")
        .add_attribute("new_admin", new_admin_addr))
}

// Helper function to update leaderboards (simplified)
fn update_leaderboards(
    storage: &mut dyn cosmwasm_std::Storage,
    platform: &str,
    user: &Addr,
) -> StdResult<()> {
    // Update platform leaderboard
    let mut platform_leaderboard = PLATFORM_LEADERBOARDS
        .may_load(storage, platform.to_string())?
        .unwrap_or_default();

    if !platform_leaderboard.contains(user) {
        platform_leaderboard.push(user.clone());
        PLATFORM_LEADERBOARDS.save(storage, platform.to_string(), &platform_leaderboard)?;
    }

    // Update global leaderboard
    let mut global_leaderboard = GLOBAL_LEADERBOARD.load(storage)?;
    if !global_leaderboard.contains(user) {
        global_leaderboard.push(user.clone());
        GLOBAL_LEADERBOARD.save(storage, &global_leaderboard)?;
    }

    Ok(())
}

#[entry_point]
pub fn query(deps: Deps, _env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::GetUserProofs { user, platform } => {
            to_json_binary(&query_user_proofs(deps, user, platform)?)
        }
        QueryMsg::GetProof { proof_id } => to_json_binary(&query_proof(deps, proof_id)?),
        QueryMsg::GetReputation { user } => to_json_binary(&query_reputation(deps, user)?),
        QueryMsg::GetEndorsements { user, skill } => {
            to_json_binary(&query_endorsements(deps, user, skill)?)
        }
        QueryMsg::GetUserNfts { user } => to_json_binary(&query_user_nfts(deps, user)?),
        QueryMsg::GetLeaderboard { platform, limit } => {
            to_json_binary(&query_leaderboard(deps, platform, limit)?)
        }
        QueryMsg::GetPlatformStats { platform } => {
            to_json_binary(&query_platform_stats(deps, platform)?)
        }
        QueryMsg::GetConfig {} => to_json_binary(&query_config(deps)?),
    }
}

pub fn query_user_proofs(
    deps: Deps,
    user: String,
    platform: Option<String>,
) -> StdResult<Vec<ProofResponse>> {
    let user_addr = deps.api.addr_validate(&user)?;
    let proof_ids = USER_PROOFS.may_load(deps.storage, &user_addr)?.unwrap_or_default();

    let mut proofs = vec![];
    for proof_id in proof_ids {
        if let Ok(proof) = PROOFS.load(deps.storage, proof_id) {
            if platform.is_none() || platform.as_ref() == Some(&proof.platform) {
                proofs.push(ProofResponse {
                    id: proof.id,
                    user: proof.user,
                    platform: proof.platform,
                    username: proof.username,
                    skill_data: proof.skill_data,
                    proof_hash: proof.proof_hash,
                    timestamp: proof.timestamp,
                    verified: proof.verified,
                    metadata: proof.metadata,
                });
            }
        }
    }

    Ok(proofs)
}

pub fn query_proof(deps: Deps, proof_id: String) -> StdResult<ProofResponse> {
    let proof = PROOFS.load(deps.storage, proof_id)?;
    Ok(ProofResponse {
        id: proof.id,
        user: proof.user,
        platform: proof.platform,
        username: proof.username,
        skill_data: proof.skill_data,
        proof_hash: proof.proof_hash,
        timestamp: proof.timestamp,
        verified: proof.verified,
        metadata: proof.metadata,
    })
}

pub fn query_reputation(deps: Deps, user: String) -> StdResult<ReputationResponse> {
    let user_addr = deps.api.addr_validate(&user)?;
    let reputation = REPUTATIONS.load(deps.storage, &user_addr)?;
    Ok(ReputationResponse {
        user: reputation.user,
        score: reputation.score,
        total_proofs: reputation.total_proofs,
        endorsements_received: reputation.endorsements_received,
        endorsements_given: reputation.endorsements_given,
        last_updated: reputation.last_updated,
    })
}

pub fn query_endorsements(
    deps: Deps,
    user: String,
    skill: Option<String>,
) -> StdResult<Vec<EndorsementResponse>> {
    let user_addr = deps.api.addr_validate(&user)?;
    let endorsement_ids = USER_ENDORSEMENTS
        .may_load(deps.storage, &user_addr)?
        .unwrap_or_default();

    let mut endorsements = vec![];
    for endorsement_id in endorsement_ids {
        if let Ok(endorsement) = ENDORSEMENTS.load(deps.storage, endorsement_id) {
            if skill.is_none() || skill.as_ref() == Some(&endorsement.skill) {
                endorsements.push(EndorsementResponse {
                    id: endorsement.id,
                    endorser: endorsement.endorser,
                    endorsee: endorsement.endorsee,
                    skill: endorsement.skill,
                    message: endorsement.message,
                    weight: endorsement.weight,
                    timestamp: endorsement.timestamp,
                });
            }
        }
    }

    Ok(endorsements)
}

pub fn query_user_nfts(deps: Deps, user: String) -> StdResult<Vec<NftResponse>> {
    let user_addr = deps.api.addr_validate(&user)?;
    let nft_ids = USER_NFTS.may_load(deps.storage, &user_addr)?.unwrap_or_default();

    let mut nfts = vec![];
    for nft_id in nft_ids {
        if let Ok(nft) = SKILL_NFTS.load(deps.storage, nft_id) {
            nfts.push(NftResponse {
                token_id: nft.token_id,
                owner: nft.owner,
                platform: nft.platform,
                skill_level: nft.skill_level,
                token_uri: nft.token_uri,
                created_at: nft.created_at,
                last_updated: nft.last_updated,
            });
        }
    }

    Ok(nfts)
}

pub fn query_leaderboard(
    deps: Deps,
    platform: Option<String>,
    limit: Option<u32>,
) -> StdResult<Vec<LeaderboardEntry>> {
    let limit = limit.unwrap_or(100).min(1000) as usize;

    let user_addrs = if let Some(platform) = platform {
        PLATFORM_LEADERBOARDS
            .may_load(deps.storage, platform)?
            .unwrap_or_default()
    } else {
        GLOBAL_LEADERBOARD.load(deps.storage)?
    };

    let mut entries = vec![];
    for (rank, user_addr) in user_addrs.iter().enumerate() {
        if rank >= limit {
            break;
        }

        if let Ok(reputation) = REPUTATIONS.load(deps.storage, user_addr) {
            entries.push(LeaderboardEntry {
                user: user_addr.clone(),
                score: reputation.score,
                rank: (rank + 1) as u32,
                primary_platform: reputation.platforms.first().unwrap_or(&"Unknown".to_string()).clone(),
                total_proofs: reputation.total_proofs,
            });
        }
    }

    // Sort by score (in a real implementation, this would be more efficient)
    entries.sort_by(|a, b| b.score.cmp(&a.score));

    // Update ranks after sorting
    for (i, entry) in entries.iter_mut().enumerate() {
        entry.rank = (i + 1) as u32;
    }

    Ok(entries)
}

pub fn query_platform_stats(deps: Deps, platform: String) -> StdResult<PlatformStats> {
    PLATFORM_STATS.load(deps.storage, platform)
}

pub fn query_config(deps: Deps) -> StdResult<ConfigResponse> {
    let config = CONFIG.load(deps.storage)?;
    Ok(ConfigResponse {
        admin: config.admin,
        total_proofs: config.total_proofs,
        total_users: config.total_users,
        supported_platforms: config.supported_platforms,
    })
}
