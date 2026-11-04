import { ParsedCurl, GenerateOptions, GeneratedCode } from './types.js';
import { parseCurl, tokenizeCommand } from './parser/curlParser.js';
import { generateTypeScript } from './generators/typescript.js';
import { generatePython } from './generators/python.js';
import { generateGo } from './generators/go.js';

export * from './types.js';
export { parseCurl, tokenizeCommand } from './parser/curlParser.js';
export { generateTypeScript } from './generators/typescript.js';
export { generatePython } from './generators/python.js';
export { generateGo } from './generators/go.js';
export {
  inferTypeScriptType,
  generateInterfacesFromValue,
  generateZodSchemaFromValue,
} from './inference/typeInference.js';

/**
 * Main entry point: Transform any raw cURL command or ParsedCurl into ready-to-use SDK code.
 */
export function generateSDK(
  input: string | ParsedCurl,
  options: GenerateOptions = {}
): GeneratedCode {
  const parsed = typeof input === 'string' ? parseCurl(input) : input;
  const lang = options.language ?? 'typescript';

  switch (lang) {
    case 'python':
      return generatePython(parsed, options);
    case 'go':
      return generateGo(parsed, options);
    case 'typescript':
    default:
      return generateTypeScript(parsed, options);
  }
}
