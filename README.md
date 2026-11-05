<p align="center">
  <br />
  <h1 align="center">⚡ CurlCraft</h1>
  <p align="center">
    <strong>Transform raw cURL commands into clean, type-safe, production-ready SDK clients in milliseconds.</strong>
  </p>
  <p align="center">
    <a href="https://github.com/shayanmaher/curlcraft"><img src="https://img.shields.io/github/stars/shayanmaher/curlcraft?style=flat-square&color=FFD700" alt="GitHub stars" /></a>
    <a href="https://www.npmjs.com/package/curlcraft"><img src="https://img.shields.io/npm/v/curlcraft.svg?style=flat-square&color=00D8FF" alt="npm version" /></a>
    <a href="https://github.com/shayanmaher/curlcraft/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-green.svg?style=flat-square" alt="license" /></a>
    <a href="https://github.com/shayanmaher/curlcraft"><img src="https://img.shields.io/badge/types-TypeScript-blue.svg?style=flat-square" alt="TypeScript" /></a>
    <a href="https://github.com/shayanmaher/curlcraft/pulls"><img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square" alt="PRs Welcome" /></a>
    <a href="https://github.com/shayanmaher/curlcraft/actions"><img src="https://img.shields.io/badge/tests-passing-success.svg?style=flat-square" alt="Tests" /></a>
  </p>
</p>

<br />

```
  ██████╗██╗   ██╗██████╗ ██╗      ██████╗██████╗  █████╗ ███████╗████████╗
 ██╔════╝██║   ██║██╔══██╗██║     ██╔════╝██╔══██╗██╔══██╗██╔════╝╚══██╔══╝
 ██║     ██║   ██║██████╔╝██║     ██║     ██████╔╝███████║█████╗     ██║   
 ██║     ██║   ██║██╔══██╗██║     ██║     ██╔══██╗██╔══██║██╔══╝     ██║   
 ╚██████╗╚██████╔╝██║  ██║███████╗╚██████╗██║  ██║██║  ██║██║        ██║   
  ╚═════╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝ ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝        ╚═╝   
```

---

## 💡 Why CurlCraft?

Ever clicked **"Copy as cURL"** in your browser's DevTools Network tab or copied a cURL command from an API documentation, only to spend the next 20 minutes manually:
- Writing TypeScript interfaces for headers and payloads?
- Setting up `fetch` / `axios` boilerplate?
- Parsing URL search parameters and path variables?
- Writing validation schemas for inputs and outputs?

**CurlCraft automates this entirely.** It parses any raw cURL command, analyzes its structure, extracts headers, authentication tokens, query parameters, and JSON payloads, and synthesizes 100% type-safe, zero-dependency SDK client code instantly.

---

## ✨ Features

- ⚡ **Zero-Config CLI**: Run instantly with `npx curlcraft` without installing anything.
- 🔮 **Live Response Probing (`--probe`)**: Execute a live request to automatically inspect the server response and synthesize 100% typed response interfaces and schemas!
- ⚛️ **TanStack React Query Hooks (`--react`)**: Generate ready-to-use `useQuery` and `useMutation` hooks for React applications.
- 🎯 **Full Type Inference**: Automatically generates strict TypeScript interfaces from JSON payloads, query parameters, and responses.
- 🛡️ **Optional Zod Schemas**: Turn your cURL payloads and responses into runtime validation schemas with `--zod`.
- 🌐 **Multi-Language Support**:
  - **TypeScript**: Native `fetch` with full type safety and JSDoc documentation.
  - **Python**: Modern `httpx` client with `pydantic` models.
  - **Go**: Idiomatic `net/http` client with Go structs and context support.
- 🔑 **Smart Auth Extraction**: Automatically detects Bearer tokens, Basic Auth, and custom API Keys.
- 🖥️ **Interactive Wizard**: Run without arguments for a sleek terminal UI with syntax-highlighted previews.
- 📦 **Dual Export**: Usable as a global CLI tool or as a library inside your Node.js/TypeScript codebase.

---

## 🚀 Quick Start

### 1. Run via CLI

```bash
# Instant one-liner
npx curlcraft "curl -X POST https://api.github.com/repos/octocat/Hello-World/issues \
  -H 'Authorization: Bearer ghp_token' \
  -d '{\"title\":\"Found a bug\",\"labels\":[\"bug\"]}'"
```

### 2. Interactive Mode

Just run `npx curlcraft` without arguments to launch the interactive prompt:

```bash
npx curlcraft
```

```
┌  Welcome to CurlCraft!
│
◇  Paste your cURL command:
│  curl -X GET https://api.stripe.com/v1/customers -H "Authorization: Bearer sk_123"
│
◇  Select target language:
│  ● TypeScript (Native Fetch + Interfaces)
│  ○ Python (HTTPX + Pydantic)
│  ○ Go (net/http + Structs)
│
◇  Include Zod runtime validation schemas?
│  Yes
│
◇  SDK generated successfully! 🎉
└  Done! Ready to copy & paste into your codebase.
```

---

## 💻 CLI Options

| Flag | Short | Description | Default |
| :--- | :--- | :--- | :--- |
| `--lang <language>` | `-l` | Target language (`typescript`, `python`, `go`) | `typescript` |
| `--out <file>` | `-o` | Save generated code directly to a file | stdout |
| `--probe` | `-p` | Send a live probe request to extract real response types | `false` |
| `--react` | `-r` | Generate TanStack React Query hooks (`useQuery` / `useMutation`) | `false` |
| `--zod` | `-z` | Include Zod runtime validation schemas (TS only) | `false` |
| `--class` | `-c` | Wrap functions in a reusable Client class (TS only) | `false` |
| `--help` | `-h` | Display help screen | - |
| `--version` | `-v` | Display package version | - |

---

## 📖 Programmatic API (Library Usage)

You can also use `curlcraft` directly in your Node.js / TypeScript projects:

```bash
npm install curlcraft
```

```typescript
import { generateSDK, parseCurl } from 'curlcraft';

const curl = `curl -X POST https://api.example.com/v1/users \
  -H "Authorization: Bearer my_secret" \
  -H "Content-Type: application/json" \
  -d '{"name": "Alice", "role": "admin", "age": 30}'`;

// 1. Generate full SDK code
const result = generateSDK(curl, {
  language: 'typescript',
  includeZod: true,
  format: 'class',
});

console.log(result.code);

// 2. Or just parse the cURL command into structured AST
const parsed = parseCurl(curl);
console.log(parsed.method);      // "POST"
console.log(parsed.baseUrl);     // "https://api.example.com"
console.log(parsed.auth?.type);  // "bearer"
console.log(parsed.jsonBody);    // { name: "Alice", role: "admin", age: 30 }
```

---

## 🔬 Comparison: Before & After

### Raw cURL Input
```bash
curl -X POST https://api.petstore.com/v2/pet \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer pet_token" \
  -d '{"id": 100, "name": "Doggie", "status": "available"}'
```

### Generated TypeScript Output (with `--zod`)
```typescript
import { z } from 'zod';

export interface PostV2PetRequest {
  id: number;
  name: string;
  status: string;
}

export const PostV2PetRequestSchema = z.object({
  id: z.number(),
  name: z.string(),
  status: z.string(),
});
export type PostV2Pet = z.infer<typeof PostV2PetRequestSchema>;

export interface PostV2PetResponse {
  [key: string]: unknown;
}

export interface PostV2PetOptions {
  baseUrl?: string;
  authToken?: string;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

/**
 * Execute POST request to /v2/pet
 */
export async function postV2Pet(
  payload: PostV2PetRequest,
  options: PostV2PetOptions = {}
): Promise<PostV2PetResponse> {
  const baseUrl = (options.baseUrl ?? "https://api.petstore.com").replace(/\/+$/, '');
  const url = new URL(`${baseUrl}/v2/pet`);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const token = options.authToken ?? "pet_token";
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url.toString(), {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
    signal: options.signal,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Request to ${url} failed with status ${res.status}: ${errorText}`);
  }

  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    return (await res.json()) as PostV2PetResponse;
  }

  return { data: await res.text() } as unknown as PostV2PetResponse;
}
```

---

## 🛠️ Development & Contributing

Contributions are welcome! Feel free to open issues and pull requests.

```bash
# Clone the repository
git clone https://github.com/shayanmahster/curlcraft.git
cd curlcraft

# Install dependencies
npm install

# Run test suite
npm test

# Build package
npm run build
```

---

## 📄 License

MIT © 2026 CurlCraft Authors.
