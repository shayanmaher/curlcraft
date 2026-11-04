import { ParsedCurl, GenerateOptions, GeneratedCode } from '../types.js';
import { toPascalCase } from '../inference/typeInference.js';

function deriveGoFuncName(parsed: ParsedCurl): string {
  const parts = parsed.pathname
    .split('/')
    .filter(Boolean)
    .map((p) => p.replace(/[^a-zA-Z0-9]/g, ''));

  if (parts.length === 0) {
    return `${toPascalCase(parsed.method.toLowerCase())}Root`;
  }

  const endpointName = parts.map((p) => toPascalCase(p)).join('');
  return `${toPascalCase(parsed.method.toLowerCase())}${endpointName}`;
}

export function generateGo(parsed: ParsedCurl, options: GenerateOptions = {}): GeneratedCode {
  const funcName = options.functionName || deriveGoFuncName(parsed);
  const lines: string[] = [];

  lines.push(
    'package client',
    '',
    'import (',
    '    "bytes"',
    '    "context"',
    '    "encoding/json"',
    '    "fmt"',
    '    "io"',
    '    "net/http"',
    '    "net/url"',
    ')',
    ''
  );

  // Generate Request Struct if JSON body exists
  if (parsed.jsonBody && typeof parsed.jsonBody === 'object') {
    lines.push(`type ${funcName}Request struct {`);
    for (const [key, val] of Object.entries(parsed.jsonBody)) {
      const fieldName = toPascalCase(key);
      const typeStr =
        typeof val === 'number'
          ? 'float64'
          : typeof val === 'boolean'
          ? 'bool'
          : 'string';
      lines.push(`    ${fieldName} ${typeStr} \`json:"${key}"\``);
    }
    lines.push('}', '');
  }

  // Generate Function
  lines.push(`func ${funcName}(ctx context.Context, baseURL string, payload interface{}) ([]byte, error) {`);
  lines.push(`    if baseURL == "" {`);
  lines.push(`        baseURL = "${parsed.baseUrl}"`);
  lines.push(`    }`);
  lines.push(`    reqURL := baseURL + "${parsed.pathname}"`);
  lines.push('');

  if (parsed.jsonBody) {
    lines.push(`    bodyBytes, err := json.Marshal(payload)`);
    lines.push(`    if err != nil {`);
    lines.push(`        return nil, fmt.Errorf("failed to marshal payload: %w", err)`);
    lines.push(`    }`);
    lines.push(`    req, err := http.NewRequestWithContext(ctx, "${parsed.method}", reqURL, bytes.NewBuffer(bodyBytes))`);
  } else {
    lines.push(`    req, err := http.NewRequestWithContext(ctx, "${parsed.method}", reqURL, nil)`);
  }

  lines.push(`    if err != nil {`);
  lines.push(`        return nil, fmt.Errorf("failed to create request: %w", err)`);
  lines.push(`    }`);
  lines.push('');

  // Headers
  for (const [k, v] of Object.entries(parsed.headers)) {
    lines.push(`    req.Header.Set("${k}", "${v.replace(/"/g, '\\"')}")`);
  }
  lines.push('');

  lines.push(`    resp, err := http.DefaultClient.Do(req)`);
  lines.push(`    if err != nil {`);
  lines.push(`        return nil, fmt.Errorf("request failed: %w", err)`);
  lines.push(`    }`);
  lines.push(`    defer resp.Body.Close()`);
  lines.push('');
  lines.push(`    respBody, err := io.ReadAll(resp.Body)`);
  lines.push(`    if err != nil {`);
  lines.push(`        return nil, fmt.Errorf("failed reading response body: %w", err)`);
  lines.push(`    }`);
  lines.push('');
  lines.push(`    if resp.StatusCode < 200 || resp.StatusCode >= 300 {`);
  lines.push(`        return nil, fmt.Errorf("unexpected status %d: %s", resp.StatusCode, string(respBody))`);
  lines.push(`    }`);
  lines.push('');
  lines.push(`    return respBody, nil`);
  lines.push('}');

  return {
    code: lines.join('\n'),
    language: 'go',
    suggestedFilename: `${funcName.toLowerCase()}.go`,
  };
}
