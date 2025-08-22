// Enhanced zkTLS Service
// Uses a configurable backend endpoint for real zkTLS/TLS-notary style verification,
// with graceful fallback to the local cryptographic simulation (`realZKTLSService`).

import { realZKTLSService, RealZKProof, TLSVerificationResult } from "./realZKTLS";

export interface EnhancedTLSVerificationResult extends TLSVerificationResult {}

class EnhancedZKTLSService {
  private readonly endpoint = process.env.EXPO_PUBLIC_ZKTLS_ENDPOINT || "";
  private readonly enabled = String(process.env.EXPO_PUBLIC_ENABLE_ZKTLS || "true").toLowerCase() !== "false";

  isConfigured(): boolean {
    return Boolean(this.endpoint);
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Ask the backend zkTLS verifier to perform a TLS session verification and produce a ZK proof
   * Schema expectation (server):
   * POST /verify { platform, username }
   * -> { success: boolean, proof?: RealZKProof, error?: string }
   */
  async performTLSVerification(platform: string, username: string): Promise<EnhancedTLSVerificationResult> {
    if (!this.isEnabled()) {
      // Disabled globally → fallback immediately
      return realZKTLSService.performRealTLSVerification(platform, username);
    }

    if (!this.isConfigured()) {
      // No endpoint configured → fallback
      return realZKTLSService.performRealTLSVerification(platform, username);
    }

    try {
      const res = await fetch(`${this.endpoint.replace(/\/$/, "")}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, username })
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status} ${res.statusText}${text ? `: ${text}` : ""}`);
      }

      const json: { success: boolean; proof?: RealZKProof; error?: string } = await res.json();
      if (!json.success || !json.proof) {
        return {
          success: false,
          error: json.error || "Enhanced zkTLS verification failed"
        };
      }

      // Optionally, ask backend to verify again or verify locally using realZKTLSService
      const isValid = await realZKTLSService.verifyRealProof(json.proof);
      if (!isValid) {
        return { success: false, error: "Enhanced zkTLS proof verification failed" };
      }

      return {
        success: true,
        proof: json.proof,
        verificationData: {
          platform,
          username,
          dataHash: json.proof.publicSignals.dataHash,
          timestamp: json.proof.publicSignals.timestamp,
          cryptographicIntegrity: true
        }
      };
    } catch (err: any) {
      // Network or server failure → fallback to local cryptographic path
      console.error("Enhanced zkTLS error, falling back:", err);
      return realZKTLSService.performRealTLSVerification(platform, username);
    }
  }

  /**
   * Convenience wrappers to mirror local service API in docs
   */
  async generateRealZKProof(data: any, platform: string, username: string) {
    return realZKTLSService.generateRealZKProof(data, platform, username);
  }

  async verifyRealProof(proof: RealZKProof) {
    return realZKTLSService.verifyRealProof(proof);
  }
}

export const enhancedZKTLSService = new EnhancedZKTLSService();



