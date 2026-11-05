import { ParsedCurl } from '../types.js';

/**
 * Tokenize a shell command string respecting quotes and escapes.
 */
export function tokenizeCommand(command: string): string[] {
  const cleanCmd = command
    .replace(/\\\r?\n/g, ' ') // join backslash line continuations
    .replace(/^\s*\$\s*/, '') // remove bash prompt $
    .trim();

  const tokens: string[] = [];
  let current = '';
  let inDoubleQuote = false;
  let inSingleQuote = false;
  let escapeNext = false;

  for (let i = 0; i < cleanCmd.length; i++) {
    const char = cleanCmd[i];

    if (escapeNext) {
      current += char;
      escapeNext = false;
      continue;
    }

    if (char === '\\' && !inSingleQuote) {
      escapeNext = true;
      continue;
    }

    if (char === '"' && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote;
      continue;
    }

    if (char === "'" && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote;
      continue;
    }

    if (/\s/.test(char) && !inDoubleQuote && !inSingleQuote) {
      if (current.length > 0) {
        tokens.push(current);
        current = '';
      }
      continue;
    }

    current += char;
  }

  if (current.length > 0) {
    tokens.push(current);
  }

  return tokens;
}

/**
 * Parse a cURL command string into structured data.
 */
export function parseCurl(command: string): ParsedCurl {
  const tokens = tokenizeCommand(command);

  if (tokens.length === 0 || tokens[0].toLowerCase() !== 'curl') {
    // If user passed command without 'curl' prefix, check if first token is an option or URL
    if (tokens.length > 0 && !tokens[0].startsWith('curl')) {
      tokens.unshift('curl');
    }
  }

  let method = 'GET';
  let url = '';
  const headers: Record<string, string> = {};
  let body: string | undefined = undefined;
  let explicitMethod = false;

  for (let i = 1; i < tokens.length; i++) {
    const token = tokens[i];

    // Method: -X, --request
    if (token === '-X' || token === '--request') {
      if (i + 1 < tokens.length) {
        method = tokens[++i].toUpperCase();
        explicitMethod = true;
      }
      continue;
    }

    // Headers: -H, --header
    if (token === '-H' || token === '--header') {
      if (i + 1 < tokens.length) {
        const headerStr = tokens[++i];
        const colonIdx = headerStr.indexOf(':');
        if (colonIdx > -1) {
          const key = headerStr.slice(0, colonIdx).trim();
          const value = headerStr.slice(colonIdx + 1).trim();
          headers[key] = value;
        }
      }
      continue;
    }

    // Body: -d, --data, --data-raw, --data-binary, --data-urlencode
    if (
      token === '-d' ||
      token === '--data' ||
      token === '--data-raw' ||
      token === '--data-binary' ||
      token === '--data-urlencode'
    ) {
      if (i + 1 < tokens.length) {
        const data = tokens[++i];
        body = body ? `${body}&${data}` : data;
        if (!explicitMethod) {
          method = 'POST';
        }
      }
      continue;
    }

    // Form data: -F, --form
    if (token === '-F' || token === '--form') {
      if (i + 1 < tokens.length) {
        const formData = tokens[++i];
        body = body ? `${body}&${formData}` : formData;
        if (!explicitMethod) {
          method = 'POST';
        }
        if (!headers['Content-Type']) {
          headers['Content-Type'] = 'multipart/form-data';
        }
      }
      continue;
    }

    // Basic Auth: -u, --user
    if (token === '-u' || token === '--user') {
      if (i + 1 < tokens.length) {
        const userPass = tokens[++i];
        const encoded = Buffer.from(userPass).toString('base64');
        headers['Authorization'] = `Basic ${encoded}`;
      }
      continue;
    }

    // URL: --url or standalone argument that looks like a URL or does not start with -
    if (token === '--url') {
      if (i + 1 < tokens.length) {
        url = tokens[++i];
      }
      continue;
    }

    // Standalone non-flag argument: likely the URL
    if (!token.startsWith('-') && !url) {
      url = token;
      continue;
    }
  }

  // Fallback URL if none detected
  if (!url) {
    throw new Error('Unable to find target URL in cURL command.');
  }

  // Clean quotes from URL if any
  url = url.replace(/^['"]|['"]$/g, '');

  // Ensure protocol
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }

  // Parse URL components
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error(`Invalid URL provided: "${url}"`);
  }

  const queryParams: Record<string, string> = {};
  parsedUrl.searchParams.forEach((val, key) => {
    queryParams[key] = val;
  });

  const baseUrl = `${parsedUrl.protocol}//${parsedUrl.host}`;
  const pathname = parsedUrl.pathname;

  // Detect and parse JSON body
  let jsonBody: any = undefined;
  if (body) {
    try {
      jsonBody = JSON.parse(body);
      if (!headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
      }
    } catch {
      // Body is not JSON (maybe form-urlencoded or plain text)
      if (!headers['Content-Type']) {
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
      }
    }
  }

  // Detect Auth scheme
  let auth: ParsedCurl['auth'] = undefined;
  for (const [k, v] of Object.entries(headers)) {
    if (k.toLowerCase() === 'authorization') {
      if (v.toLowerCase().startsWith('bearer ')) {
        auth = {
          type: 'bearer',
          token: v.slice(7).trim(),
        };
      } else if (v.toLowerCase().startsWith('basic ')) {
        const rawAuth = Buffer.from(v.slice(6).trim(), 'base64').toString('utf8');
        const [username, password] = rawAuth.split(':');
        auth = {
          type: 'basic',
          username,
          password,
        };
      } else {
        auth = {
          type: 'custom',
          headerKey: k,
          headerValue: v,
        };
      }
      break;
    }
    if (k.toLowerCase().includes('api-key') || k.toLowerCase().includes('apikey') || k.toLowerCase().includes('token')) {
      auth = {
        type: 'custom',
        headerKey: k,
        headerValue: v,
      };
    }
  }

  return {
    raw: command,
    method,
    url: parsedUrl.toString(),
    baseUrl,
    pathname,
    queryParams,
    headers,
    auth,
    body,
    jsonBody,
    contentType: headers['Content-Type'] || headers['content-type'],
  };
}
