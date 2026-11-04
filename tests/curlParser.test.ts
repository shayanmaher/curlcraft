import { describe, it, expect } from 'vitest';
import { parseCurl, tokenizeCommand } from '../src/parser/curlParser.js';
import { generateSDK } from '../src/index.js';

describe('curlParser', () => {
  it('tokenizes multi-line curl command with escapes', () => {
    const cmd = `curl -X POST https://api.stripe.com/v1/charges \\
      -H "Authorization: Bearer sk_test_123" \\
      -d amount=2000 \\
      -d currency=usd`;

    const tokens = tokenizeCommand(cmd);
    expect(tokens[0]).toBe('curl');
    expect(tokens).toContain('-X');
    expect(tokens).toContain('POST');
    expect(tokens).toContain('https://api.stripe.com/v1/charges');
    expect(tokens).toContain('Authorization: Bearer sk_test_123');
  });

  it('parses JSON payload and headers correctly', () => {
    const cmd = `curl -X POST "https://api.github.com/repos/octocat/Hello-World/issues" \\
      -H "Accept: application/vnd.github+json" \\
      -H "Authorization: Bearer ghp_token123" \\
      -d '{"title":"Found a bug","body":"I am having an issue","assignees":["octocat"],"milestone":1}'`;

    const parsed = parseCurl(cmd);
    expect(parsed.method).toBe('POST');
    expect(parsed.baseUrl).toBe('https://api.github.com');
    expect(parsed.pathname).toBe('/repos/octocat/Hello-World/issues');
    expect(parsed.auth?.type).toBe('bearer');
    expect(parsed.auth?.token).toBe('ghp_token123');
    expect(parsed.jsonBody).toBeDefined();
    expect(parsed.jsonBody.title).toBe('Found a bug');
    expect(parsed.jsonBody.assignees).toEqual(['octocat']);
    expect(parsed.jsonBody.milestone).toBe(1);
  });

  it('parses Basic Auth from -u flag', () => {
    const cmd = `curl -u admin:secret123 https://httpbin.org/basic-auth/admin/secret123`;
    const parsed = parseCurl(cmd);
    expect(parsed.auth?.type).toBe('basic');
    expect(parsed.auth?.username).toBe('admin');
    expect(parsed.auth?.password).toBe('secret123');
  });

  it('parses query parameters into an object', () => {
    const cmd = `curl "https://api.example.com/v1/search?q=typescript&limit=25&active=true"`;
    const parsed = parseCurl(cmd);
    expect(parsed.queryParams.q).toBe('typescript');
    expect(parsed.queryParams.limit).toBe('25');
    expect(parsed.queryParams.active).toBe('true');
  });
});

describe('generateSDK', () => {
  const sampleCurl = `curl -X POST https://api.petstore.com/v2/pet \\
    -H "Content-Type: application/json" \\
    -H "Authorization: Bearer pet_token" \\
    -d '{"id":100,"name":"Doggie","status":"available"}'`;

  it('generates TypeScript client with types and interfaces', () => {
    const result = generateSDK(sampleCurl, { language: 'typescript' });
    expect(result.code).toContain('export interface PostV2PetRequest');
    expect(result.code).toContain('name: string;');
    expect(result.code).toContain('id: number;');
    expect(result.code).toContain('export async function postV2Pet');
    expect(result.code).toContain('fetch(');
  });

  it('generates Zod schemas when includeZod is enabled', () => {
    const result = generateSDK(sampleCurl, { language: 'typescript', includeZod: true });
    expect(result.code).toContain("import { z } from 'zod'");
    expect(result.code).toContain('export const PostV2PetRequestSchema');
  });

  it('generates Python httpx + pydantic client', () => {
    const result = generateSDK(sampleCurl, { language: 'python' });
    expect(result.code).toContain('import httpx');
    expect(result.code).toContain('class PostV2PetRequest(BaseModel)');
    expect(result.code).toContain('def post_v2_pet(');
  });

  it('generates Go net/http client', () => {
    const result = generateSDK(sampleCurl, { language: 'go' });
    expect(result.code).toContain('package client');
    expect(result.code).toContain('type PostV2PetRequest struct');
    expect(result.code).toContain('http.NewRequestWithContext');
  });
});
