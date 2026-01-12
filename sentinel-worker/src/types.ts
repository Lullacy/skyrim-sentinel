/**
 * Skyrim Sentinel - Type Definitions
 */

// ============================================================================
// KV Storage Types
// ============================================================================

/**
 * Plugin metadata stored in Cloudflare KV.
 * Key format: "sha256:<hash>"
 */
export interface KVPluginEntry {
	name: string;
	nexusId: number;
	filename?: string;
	author?: string;
	status: "verified" | "pending" | "revoked";
}

// ============================================================================
// API Request/Response Types
// ============================================================================

/**
 * POST /api/v1/scan request body
 */
export interface ScanRequest {
	hashes: string[];
}

/**
 * Plugin info returned in scan results
 */
export interface PluginInfo {
	name: string;
	nexusId: number;
	filename?: string;
	author?: string;
}

/**
 * Individual hash verification result
 */
export interface ScanResult {
	hash: string;
	status: "verified" | "unknown" | "revoked";
	plugin: PluginInfo | null;
}

/**
 * POST /api/v1/scan response body
 */
export interface ScanResponse {
	scanned: number;
	verified: number;
	unknown: number;
	revoked: number;
	timestamp: string;
	results: ScanResult[];
}

/**
 * Standard error response
 */
export interface ErrorResponse {
	error: string;
	code?: string;
	details?: string;
}
