/**
 * Type inference engine: Generates TypeScript interfaces and Zod schemas from JSON data.
 */

function sanitizeKey(key: string): string {
  if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key)) {
    return key;
  }
  return JSON.stringify(key);
}

export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function toPascalCase(str: string): string {
  return str
    .replace(/[-_./]([a-z0-9])/gi, (_, char) => char.toUpperCase())
    .replace(/^[a-z]/, (char) => char.toUpperCase())
    .replace(/[^a-zA-Z0-9]/g, '');
}

export function inferTypeScriptType(
  value: any,
  name: string = 'Root',
  collectedInterfaces: Map<string, string> = new Map()
): string {
  if (value === null || value === undefined) {
    return 'unknown';
  }

  const type = typeof value;

  if (type === 'string') return 'string';
  if (type === 'number') return 'number';
  if (type === 'boolean') return 'boolean';

  if (Array.isArray(value)) {
    if (value.length === 0) return 'unknown[]';
    const itemTypeName = `${name}Item`;
    const itemType = inferTypeScriptType(value[0], itemTypeName, collectedInterfaces);
    return `${itemType}[]`;
  }

  if (type === 'object') {
    const lines: string[] = [];
    lines.push(`export interface ${name} {`);

    for (const [key, val] of Object.entries(value)) {
      const fieldTypeName = `${name}${toPascalCase(key)}`;
      const fieldType = inferTypeScriptType(val, fieldTypeName, collectedInterfaces);
      const isOptional = val === null || val === undefined;
      const formattedKey = sanitizeKey(key);
      lines.push(`  ${formattedKey}${isOptional ? '?' : ''}: ${fieldType};`);
    }

    lines.push('}');
    collectedInterfaces.set(name, lines.join('\n'));
    return name;
  }

  return 'any';
}

export function generateInterfacesFromValue(value: any, rootName: string = 'RequestBody'): string {
  const collected = new Map<string, string>();
  inferTypeScriptType(value, rootName, collected);

  return Array.from(collected.values()).join('\n\n');
}

export function generateZodSchemaFromValue(value: any, rootName: string = 'RequestBodySchema'): string {
  function toZod(val: any, indentLevel: number = 1): string {
    const indent = '  '.repeat(indentLevel);
    const parentIndent = '  '.repeat(indentLevel - 1);

    if (val === null || val === undefined) {
      return 'z.unknown().optional()';
    }

    const type = typeof val;

    if (type === 'string') return 'z.string()';
    if (type === 'number') return 'z.number()';
    if (type === 'boolean') return 'z.boolean()';

    if (Array.isArray(val)) {
      if (val.length === 0) return 'z.array(z.unknown())';
      return `z.array(${toZod(val[0], indentLevel)})`;
    }

    if (type === 'object') {
      const entries = Object.entries(val);
      if (entries.length === 0) return 'z.record(z.unknown())';

      const fields = entries.map(([k, v]) => {
        const key = sanitizeKey(k);
        return `${indent}${key}: ${toZod(v, indentLevel + 1)},`;
      });

      return `z.object({\n${fields.join('\n')}\n${parentIndent}})`;
    }

    return 'z.any()';
  }

  return `export const ${rootName} = ${toZod(value)};\nexport type ${rootName.replace('Schema', '')} = z.infer<typeof ${rootName}>;`;
}
