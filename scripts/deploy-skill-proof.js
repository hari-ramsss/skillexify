/*
  Node deploy script for XION testnet using CosmJS.
  Usage:
    node scripts/deploy-skill-proof.js --generate-key
    node scripts/deploy-skill-proof.js --deploy
*/

const fs = require('fs');
const path = require('path');
const { DirectSecp256k1HdWallet } = require('@cosmjs/proto-signing');
const { SigningCosmWasmClient, CosmWasmClient } = require('@cosmjs/cosmwasm-stargate');
const { GasPrice } = require('@cosmjs/stargate');

const KEY_FILE = path.join(process.cwd(), '.xion-deployer.key');
const ENV_FILE = path.join(process.cwd(), '.env');
const CONTRACT_WASM = path.join(process.cwd(), 'contracts', 'skillexify_proof', 'target', 'wasm32-unknown-unknown', 'release', 'skillexify_proof.wasm');

const RPC = process.env.EXPO_PUBLIC_RPC_ENDPOINT || 'https://rpc.xion-testnet-2.burnt.com:443';
const REST = process.env.EXPO_PUBLIC_REST_ENDPOINT || 'https://api.xion-testnet-2.burnt.com';
const CHAIN_ID = 'xion-testnet-2';
const PREFIX = 'xion';

async function generateKey() {
  const wallet = await DirectSecp256k1HdWallet.generate(24, { prefix: PREFIX });
  const [account] = await wallet.getAccounts();
  // Save mnemonic directly without encryption for simplicity
  const mnemonic = wallet.mnemonic;
  fs.writeFileSync(KEY_FILE, mnemonic);
  console.log('Deployer address:', account.address);
  console.log('Mnemonic saved to:', KEY_FILE);
  console.log('Fund this address with a small amount of UXION from the testnet faucet, then run:');
  console.log('  node scripts/deploy-skill-proof.js --deploy');
}

async function loadWallet() {
  if (!fs.existsSync(KEY_FILE)) {
    throw new Error('Key file not found. Run with --generate-key first.');
  }
  // Load mnemonic directly
  const mnemonic = fs.readFileSync(KEY_FILE, 'utf8').trim();
  const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, { prefix: PREFIX });
  return wallet;
}

async function ensureBalance(address) {
  const client = await CosmWasmClient.connect(RPC);
  const bal = await client.getBalance(address, 'uxion');
  return Number(bal?.amount || '0');
}

function writeEnvContractAddress(addr) {
  let contents = '';
  if (fs.existsSync(ENV_FILE)) {
    contents = fs.readFileSync(ENV_FILE, 'utf8');
  }
  const lines = contents.split(/\r?\n/).filter(Boolean);
  const filtered = lines.filter(l => !l.startsWith('EXPO_PUBLIC_SKILL_PROOF_CONTRACT='));
  filtered.push(`EXPO_PUBLIC_SKILL_PROOF_CONTRACT=${addr}`);
  fs.writeFileSync(ENV_FILE, filtered.join('\n') + '\n');
  console.log('Updated .env with EXPO_PUBLIC_SKILL_PROOF_CONTRACT=', addr);
}

async function deploy() {
  if (!fs.existsSync(CONTRACT_WASM)) {
    throw new Error(`WASM not found at ${CONTRACT_WASM}. Build it first (see DEPLOYMENT.md).`);
  }
  const wallet = await loadWallet();
  const [account] = await wallet.getAccounts();
  const balance = await ensureBalance(account.address);
  if (balance <= 0) {
    throw new Error(`Deployer address ${account.address} has 0 UXION. Fund it via the faucet and retry.`);
  }

  const gasPrice = GasPrice.fromString('0.001uxion');
  const client = await SigningCosmWasmClient.connectWithSigner(RPC, wallet, { gasPrice });

  // Store code
  console.log('Storing contract code...');
  const wasm = fs.readFileSync(CONTRACT_WASM);
  const storeRes = await client.upload(account.address, wasm, 'auto');
  const codeId = storeRes.codeId;
  console.log('Stored with codeId:', codeId);

  // Instantiate
  console.log('Instantiating...');
  const initMsg = { admin: null };
  const { contractAddress } = await client.instantiate(account.address, codeId, initMsg, 'skillexify-proof', 'auto');
  console.log('Contract address:', contractAddress);

  writeEnvContractAddress(contractAddress);
  console.log('Done. Restart Expo to pick up the new env var.');
}

(async () => {
  const arg = process.argv[2] || '';
  if (arg === '--generate-key') {
    await generateKey();
    return;
  }
  if (arg === '--deploy') {
    await deploy();
    return;
  }
  console.log('Usage:');
  console.log('  node scripts/deploy-skill-proof.js --generate-key');
  console.log('  node scripts/deploy-skill-proof.js --deploy');
})();


