import {
	env,
	createExecutionContext,
	waitOnExecutionContext,
	SELF,
} from "cloudflare:test";
import { describe, it, expect } from "vitest";
import worker from "../src/index";

const IncomingRequest = Request<unknown, IncomingRequestCfProperties>;

describe("Skyrim Sentinel API", () => {
	// ========================================================================
	// Root & Health Endpoints
	// ========================================================================

	describe("GET /", () => {
		it("returns API running message", async () => {
			const response = await SELF.fetch("https://example.com/");
			expect(response.status).toBe(200);
			expect(await response.text()).toBe("Skyrim Sentinel API is running.");
		});
	});

	describe("GET /health", () => {
		it("returns health status", async () => {
			const response = await SELF.fetch("https://example.com/health");
			expect(response.status).toBe(200);

			const body = await response.json();
			expect(body).toHaveProperty("status", "ok");
			expect(body).toHaveProperty("timestamp");
			expect(body).toHaveProperty("version");
		});
	});

	// ========================================================================
	// POST /api/v1/scan
	// ========================================================================

	describe("POST /api/v1/scan", () => {
		it("rejects invalid JSON", async () => {
			const response = await SELF.fetch("https://example.com/api/v1/scan", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: "not valid json",
			});

			expect(response.status).toBe(400);
			const body = await response.json();
			expect(body.code).toBe("INVALID_JSON");
		});

		it("rejects missing hashes field", async () => {
			const response = await SELF.fetch("https://example.com/api/v1/scan", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ foo: "bar" }),
			});

			expect(response.status).toBe(400);
			const body = await response.json();
			expect(body.code).toBe("INVALID_REQUEST");
		});

		it("rejects empty hashes array", async () => {
			const response = await SELF.fetch("https://example.com/api/v1/scan", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ hashes: [] }),
			});

			expect(response.status).toBe(400);
			const body = await response.json();
			expect(body.code).toBe("EMPTY_HASHES");
		});

		it("rejects invalid hash format", async () => {
			const response = await SELF.fetch("https://example.com/api/v1/scan", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ hashes: ["tooshort", "invalid!@#"] }),
			});

			expect(response.status).toBe(400);
			const body = await response.json();
			expect(body.code).toBe("INVALID_HASH_FORMAT");
		});

		it("returns unknown for hashes not in KV", async () => {
			const validHash = "a".repeat(64); // Valid SHA-256 format

			const response = await SELF.fetch("https://example.com/api/v1/scan", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ hashes: [validHash] }),
			});

			expect(response.status).toBe(200);
			const body = await response.json();

			expect(body).toHaveProperty("scanned", 1);
			expect(body).toHaveProperty("verified", 0);
			expect(body).toHaveProperty("unknown", 1);
			expect(body).toHaveProperty("results");
			expect(body.results[0]).toMatchObject({
				hash: validHash,
				status: "unknown",
				plugin: null,
			});
		});

		it("returns proper response structure", async () => {
			const validHash = "b".repeat(64);

			const response = await SELF.fetch("https://example.com/api/v1/scan", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ hashes: [validHash] }),
			});

			expect(response.status).toBe(200);
			const body = await response.json();

			// Verify response structure
			expect(body).toHaveProperty("scanned");
			expect(body).toHaveProperty("verified");
			expect(body).toHaveProperty("unknown");
			expect(body).toHaveProperty("revoked");
			expect(body).toHaveProperty("timestamp");
			expect(body).toHaveProperty("results");
			expect(Array.isArray(body.results)).toBe(true);
		});
	});
});
