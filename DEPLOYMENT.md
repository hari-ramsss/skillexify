# Skillexify Deployment Guide

This guide covers deploying the Skillexify smart contracts and configuring the app for production use.

## Prerequisites

- Node.js 18+
- Rust toolchain
- CosmWasm development environment
- XION testnet/mainnet access
- Platform API keys (optional for enhanced functionality)

## Smart Contract Deployment

### 1. Build the Contract

```bash
cd contracts/skillexify_proof
cargo build
cargo test

# Optimize for deployment
docker run --rm -v "$(pwd)":/code \
  --mount type=volume,source="$(basename "$(pwd)")_cache",target=/code/target \
  --mount type=volume,source=registry_cache,target=/usr/local/cargo/registry \
  cosmwasm/rust-optimizer:0.12.6
```

### 2. Deploy to XION

```bash
# Install XION CLI
curl -L https://github.com/burnt-labs/xion/releases/download/v0.3.5/xiond-linux-amd64 -o xiond
chmod +x xiond
sudo mv xiond /usr/local/bin/

# Configure for testnet
xiond config chain-id xion-testnet-2
xiond config node https://rpc.xion-testnet-2.burnt.com:443

# Store the contract
CONTRACT_CODE=$(xiond tx wasm store artifacts/skillexify_proof.wasm \
  --from your-key \
  --gas auto \
  --gas-adjustment 1.3 \
  --broadcast-mode block \
  --yes \
  --output json | jq -r '.logs[0].events[] | select(.type=="store_code") | .attributes[] | select(.key=="code_id") | .value')

echo "Contract Code ID: $CONTRACT_CODE"

# Instantiate the contract
INIT_MSG='{"admin":null}'
CONTRACT_ADDR=$(xiond tx wasm instantiate $CONTRACT_CODE "$INIT_MSG" \
  --from your-key \
  --label "skillexify-proof-v1" \
  --admin your-address \
  --gas auto \
  --gas-adjustment 1.3 \
  --broadcast-mode block \
  --yes \
  --output json | jq -r '.logs[0].events[] | select(.type=="instantiate") | .attributes[] | select(.key=="_contract_address") | .value')

echo "Contract Address: $CONTRACT_ADDR"
```

### 3. Configure Environment Variables

Create a `.env` file in the app root:

```bash
# XION Configuration
EXPO_PUBLIC_RPC_ENDPOINT=https://rpc.xion-testnet-2.burnt.com:443
EXPO_PUBLIC_REST_ENDPOINT=https://api.xion-testnet-2.burnt.com
EXPO_PUBLIC_SKILL_PROOF_CONTRACT=your-contract-address
EXPO_PUBLIC_TREASURY_CONTRACT_ADDRESS=your-treasury-address

# Platform API Keys (optional)
EXPO_PUBLIC_GITHUB_TOKEN=your-github-token
EXPO_PUBLIC_KAGGLE_API_KEY=your-kaggle-key
EXPO_PUBLIC_STACKOVERFLOW_KEY=your-stackoverflow-key

# zkTLS Configuration
EXPO_PUBLIC_ZKTLS_ENDPOINT=https://api.skillexify.com/zktls
EXPO_PUBLIC_ENABLE_ZKTLS=true
```

## App Configuration

### 1. Install Dependencies

```bash
cd skillexify-app
npm install
```

### 2. Platform API Setup

#### GitHub Integration

1. Create a GitHub OAuth App:
   - Go to GitHub Settings > Developer settings > OAuth Apps
   - Set Authorization callback URL to `skillexify://auth/github`
   - Note the Client ID and Client Secret

2. Configure in the app:
   ```typescript
   // In services/platformAPIs.ts
   const GITHUB_CONFIG = {
     clientId: process.env.EXPO_PUBLIC_GITHUB_CLIENT_ID,
     clientSecret: process.env.EXPO_PUBLIC_GITHUB_CLIENT_SECRET,
     redirectUri: 'skillexify://auth/github'
   };
   ```

#### LeetCode Integration

LeetCode doesn't have an official API, so we use GraphQL queries:
- No authentication required for public profiles
- Rate limiting may apply

#### Kaggle Integration

1. Get Kaggle API credentials:
   - Go to Kaggle > Account > Create New API Token
   - Download `kaggle.json`

2. Configure:
   ```typescript
   const KAGGLE_CONFIG = {
     username: process.env.EXPO_PUBLIC_KAGGLE_USERNAME,
     key: process.env.EXPO_PUBLIC_KAGGLE_KEY
   };
   ```

#### Stack Overflow Integration

1. Register your app:
   - Go to Stack Apps > Register Application
   - Note the client ID and key

#### HackerRank Integration

Currently uses mock data as HackerRank doesn't provide a public API.

### 3. zkTLS Setup

For production zkTLS verification:

1. Choose a zkTLS provider (TLSNotary, Reclaim Protocol, etc.)
2. Configure the verification endpoints
3. Set up the circuit compilation environment
4. Deploy verification infrastructure

Example with TLSNotary:

```bash
# Install TLSNotary CLI
cargo install tlsn-cli

# Generate verification keys
tlsn-cli setup

# Configure endpoints
export TLSNOTARY_ENDPOINT=https://your-tlsnotary-node.com
```

## Mobile App Deployment

### Android

1. Configure signing:
   ```bash
   cd android
   ./gradlew generateReleaseApk
   ```

2. Upload to Google Play Console

### iOS

1. Configure Xcode project:
   ```bash
   cd ios
   xcodebuild -workspace Skillexify.xcworkspace -scheme Skillexify archive
   ```

2. Upload to App Store Connect

### Web (Optional)

```bash
npx expo build:web
# Deploy to your hosting provider
```

## Production Considerations

### Security

1. **Private Key Management**: Use hardware wallets or secure key management services
2. **API Key Protection**: Store sensitive keys in secure environment variables
3. **Rate Limiting**: Implement rate limiting for API calls
4. **Input Validation**: Validate all user inputs on both client and contract level

### Scalability

1. **IPFS Integration**: Store large NFT metadata on IPFS
2. **Caching**: Implement Redis caching for frequently accessed data
3. **CDN**: Use CDN for static assets and API responses
4. **Database**: Consider off-chain indexing for complex queries

### Monitoring

1. **Analytics**: Implement app analytics (Firebase, Mixpanel)
2. **Error Tracking**: Use Sentry or similar for error monitoring
3. **Contract Monitoring**: Monitor contract events and gas usage
4. **API Monitoring**: Track platform API usage and rate limits

### Compliance

1. **Privacy Policy**: Implement comprehensive privacy policy
2. **Terms of Service**: Clear terms for platform data usage
3. **GDPR Compliance**: If serving EU users
4. **Platform Terms**: Ensure compliance with each platform's API terms

## Testing

### Unit Tests

```bash
npm test
```

### Contract Tests

```bash
cd contracts/skillexify_proof
cargo test
```

### Integration Tests

```bash
npm run test:integration
```

### E2E Tests

```bash
npx detox test
```

## Maintenance

### Contract Upgrades

1. Deploy new contract version
2. Migrate data if necessary
3. Update app configuration
4. Coordinate upgrade with users

### API Updates

1. Monitor platform API changes
2. Update integration code
3. Test thoroughly
4. Deploy updates

### Dependencies

1. Regular security updates
2. Performance optimizations
3. Bug fixes
4. Feature enhancements

## Support

For deployment support:
- Documentation: https://docs.skillexify.com
- Discord: https://discord.gg/skillexify
- Email: support@skillexify.com
