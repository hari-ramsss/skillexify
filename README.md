# Skillexify

Skillexify is a mobile-first app that leverages zkTLS and XION's on-chain infrastructure to verify and showcase real, tamper-proof technical skill credentials. 

## Overview

In today's competitive tech landscape, verifying the authenticity of technical skills is challenging. Skillexify solves this by connecting to platforms like LeetCode, GitHub, Kaggle, HackerRank, and Stack Overflow to pull verifiable data on a user's activity, rankings, contributions, and certifications — without compromising privacy.

With this data, Skillexify generates a "Proof of Skill" badge, stored immutably on-chain. Users can flex their verified expertise in competitive programming, open-source contributions, data science, and more — while recruiters and collaborators can trust the authenticity of those claims.

## Features

### Verifiable Skill Credentials
- Connect to multiple platforms (LeetCode, GitHub, Kaggle, etc.)
- Zero-Knowledge TLS verification ensures real credentials without exposing private data
- On-chain storage of proofs for permanent verification

### Gamification & Community
- Global leaderboards for different skill categories
- Personalized skill graphs and progress tracking
- Skill-based communities with exclusive access

### Blockchain Integration
- XION wallet integration for identity management
- NFT-based achievement badges for top performers
- On-chain proof of skills that can be shared and verified

## How It Works

1. **Connect Your Accounts**: Link your profiles from coding platforms
2. **Verify Credentials**: zkTLS technology verifies your activity without exposing private data
3. **Generate Proof**: Create immutable proof of your skills stored on the XION blockchain
4. **Showcase Skills**: Display your verified credentials in your profile
5. **Join Communities**: Access exclusive groups based on your verified skills

## Tech Stack

- **Frontend**: React Native with Expo
- **Blockchain**: XION Network
- **Verification**: zkTLS (Zero-Knowledge TLS)
- **Smart Contracts**: CosmWasm on XION
- **Wallet Integration**: Abstraxion wallet

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npx expo start
   ```

3. Connect to platforms and start verifying your skills!

## Hackathon Theme Alignment

This project aligns with the hackathon theme of building an iOS or Android mobile-first app using XION's Mobile Development Kit (Dave), leveraging verifiable internet data (zkTLS) and connecting to an on-chain source of truth.

Skillexify demonstrates:
- Mobile-first design with React Native/Expo
- zkTLS integration for verifiable internet data
- XION blockchain as the on-chain source of truth for skill credentials
- Practical application of verifiable credentials in the professional development space