import { ParsedCurl, ProbeResult } from '../types.js';

export async function probeEndpoint(
  parsed: ParsedCurl,
  timeoutMs: number = 8000
): Promise<ProbeResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const fetchHeaders: Record<string, string> = { ...parsed.headers };

    const res = await fetch(parsed.url, {
      method: parsed.method,
      headers: fetchHeaders,
      body: parsed.body,
      signal: controller.signal,
    });

    const contentType = res.headers.get('content-type');
    let data: any = undefined;

    if (contentType && contentType.includes('application/json')) {
      try {
        data = await res.json();
      } catch {
        data = await res.text();
      }
    } else {
      const text = await res.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }

    return {
      status: res.status,
      statusText: res.statusText,
      contentType,
      data,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
