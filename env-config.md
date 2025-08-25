# Environment Variables Configuration

To resolve the warning about missing environment variables, create a `.env` file in the root of your project with the following variables:

## Required Environment Variables

```bash
# Treasury Contract Address (XION blockchain)
EXPO_PUBLIC_TREASURY_CONTRACT_ADDRESS=xion1daqyfnak98wry0grw5vnk9r2rfwpksv4hl53yj537vstmghayc9suzkdq8

# RPC Endpoint for XION blockchain
EXPO_PUBLIC_RPC_ENDPOINT=https://rpc.xion-testnet-2.burnt.com:443

# REST Endpoint for XION blockchain
EXPO_PUBLIC_REST_ENDPOINT=https://api.xion-testnet-2.burnt.com

# User Map Contract Address (for wallet permissions)
EXPO_PUBLIC_USER_MAP_CONTRACT_ADDRESS=xion1daqyfnak98wry0grw5vnk9r2rfwpksv4hl53yj537vstmghayc9suzkdq8

# Skill Proof Contract Address (for on-chain proofs)
EXPO_PUBLIC_SKILL_PROOF_CONTRACT=xion1daqyfnak98wry0grw5vnk9r2rfwpksv4hl53yj537vstmghayc9suzkdq8
```

## How to Create the .env File

1. Create a new file named `.env` in the root directory of your project (same level as `package.json`)
2. Copy the above variables into the file
3. Save the file
4. Restart your development server

## What These Variables Do

- **EXPO_PUBLIC_TREASURY_CONTRACT_ADDRESS**: The XION blockchain contract address for treasury operations
- **EXPO_PUBLIC_RPC_ENDPOINT**: The RPC endpoint for connecting to the XION blockchain
- **EXPO_PUBLIC_REST_ENDPOINT**: The REST API endpoint for XION blockchain queries
- **EXPO_PUBLIC_USER_MAP_CONTRACT_ADDRESS**: Contract address for user mapping and wallet permissions
- **EXPO_PUBLIC_SKILL_PROOF_CONTRACT**: Contract address for storing skill proofs on-chain

## Note

These are testnet addresses. For production, you'll need to replace them with mainnet contract addresses.




