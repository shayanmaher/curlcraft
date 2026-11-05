import { cac } from 'cac';
import pc from 'picocolors';
import * as clack from '@clack/prompts';
import { promises as fs } from 'fs';
import path from 'path';
import { generateSDKAsync, parseCurl, probeEndpoint } from './index.js';
import { SupportedLanguage } from './types.js';

const cli = cac('curlcraft');

const BANNER = `
${pc.cyan('  ██████╗██╗   ██╗██████╗ ██╗      ██████╗██████╗  █████╗ ███████╗████████╗')}
${pc.cyan(' ██╔════╝██║   ██║██╔══██╗██║     ██╔════╝██╔══██╗██╔══██╗██╔════╝╚══██╔══╝')}
${pc.cyan(' ██║     ██║   ██║██████╔╝██║     ██║     ██████╔╝███████║█████╗     ██║   ')}
${pc.cyan(' ██║     ██║   ██║██╔══██╗██║     ██║     ██╔══██╗██╔══██║██╔══╝     ██║   ')}
${pc.cyan(' ╚██████╗╚██████╔╝██║  ██║███████╗╚██████╗██║  ██║██║  ██║██║        ██║   ')}
${pc.cyan('  ╚═════╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝ ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝╚═╝        ╚═╝   ')}
${pc.dim('  ⚡ Instant Type-Safe SDK Client Generator from any cURL command ⚡')}
`;

async function runInteractive() {
  console.log(BANNER);
  clack.intro(pc.bgCyan(pc.black(' Welcome to CurlCraft! ')));

  const curlInput = await clack.text({
    message: 'Paste your cURL command:',
    placeholder: 'curl -X POST https://api.example.com/items -H "Authorization: Bearer..." -d \'{"name":"item"}\'',
    validate(val) {
      if (!val || val.trim().length === 0) {
        return 'cURL command cannot be empty!';
      }
    },
  });

  if (clack.isCancel(curlInput)) {
    clack.cancel('Operation cancelled.');
    process.exit(0);
  }

  const language = (await clack.select({
    message: 'Select target language:',
    options: [
      { value: 'typescript', label: 'TypeScript (Native Fetch + Interfaces)' },
      { value: 'python', label: 'Python (HTTPX + Pydantic)' },
      { value: 'go', label: 'Go (net/http + Structs)' },
    ],
    initialValue: 'typescript',
  })) as SupportedLanguage;

  if (clack.isCancel(language)) {
    clack.cancel('Operation cancelled.');
    process.exit(0);
  }

  let includeZod = false;
  let reactQuery = false;
  let probe = false;

  if (language === 'typescript') {
    const zodChoice = await clack.confirm({
      message: 'Include Zod runtime validation schemas?',
      initialValue: true,
    });
    if (clack.isCancel(zodChoice)) {
      clack.cancel('Operation cancelled.');
      process.exit(0);
    }
    includeZod = Boolean(zodChoice);

    const reactChoice = await clack.confirm({
      message: 'Generate TanStack React Query hooks?',
      initialValue: false,
    });
    if (clack.isCancel(reactChoice)) {
      clack.cancel('Operation cancelled.');
      process.exit(0);
    }
    reactQuery = Boolean(reactChoice);

    const probeChoice = await clack.confirm({
      message: 'Probe live endpoint to infer real server response types?',
      initialValue: false,
    });
    if (clack.isCancel(probeChoice)) {
      clack.cancel('Operation cancelled.');
      process.exit(0);
    }
    probe = Boolean(probeChoice);
  }

  const spinner = clack.spinner();
  spinner.start(probe ? 'Probing endpoint & crafting SDK...' : 'Crafting your type-safe SDK...');

  try {
    const result = await generateSDKAsync(curlInput, {
      language,
      includeZod,
      reactQuery,
      probe,
    });

    spinner.stop(pc.green('SDK generated successfully! 🎉'));

    const action = await clack.select({
      message: 'What would you like to do with the generated code?',
      options: [
        { value: 'print', label: 'Print to terminal' },
        { value: 'file', label: `Save to file (${result.suggestedFilename})` },
      ],
      initialValue: 'print',
    });

    if (action === 'file') {
      const outputPath = path.resolve(process.cwd(), result.suggestedFilename);
      await fs.writeFile(outputPath, result.code, 'utf8');
      clack.outro(pc.green(`✔ Saved to ${pc.bold(outputPath)}`));
    } else {
      console.log('\n' + pc.dim('─'.repeat(60)));
      console.log(pc.yellow(result.code));
      console.log(pc.dim('─'.repeat(60)) + '\n');
      clack.outro(pc.green('Done! Ready to copy & paste into your codebase.'));
    }
  } catch (err: any) {
    spinner.stop(pc.red('Generation failed.'));
    clack.log.error(err.message || String(err));
    process.exit(1);
  }
}

cli
  .command('[curl]', 'Transform cURL command to SDK code')
  .option('-l, --lang <language>', 'Target language (typescript, python, go)', {
    default: 'typescript',
  })
  .option('-o, --out <file>', 'Output destination file')
  .option('-z, --zod', 'Include Zod runtime schema validation (TS only)')
  .option('-r, --react', 'Generate TanStack React Query hooks (TS only)')
  .option('-p, --probe', 'Send a live probe request to extract real response types')
  .option('-c, --class', 'Wrap in a reusable Client class (TS only)')
  .action(async (curlCommand, options) => {
    if (!curlCommand) {
      await runInteractive();
      return;
    }

    try {
      const result = await generateSDKAsync(curlCommand, {
        language: options.lang as SupportedLanguage,
        includeZod: options.zod,
        reactQuery: options.react,
        probe: options.probe,
        format: options.class ? 'class' : 'function',
      });

      if (options.out) {
        const outPath = path.resolve(process.cwd(), options.out);
        await fs.writeFile(outPath, result.code, 'utf8');
        console.log(pc.green(`✔ Generated ${result.language} SDK saved to: ${pc.bold(outPath)}`));
      } else {
        console.log(result.code);
      }
    } catch (err: any) {
      console.error(pc.red(`Error: ${err.message}`));
      process.exit(1);
    }
  });

cli.help();
cli.version('0.1.0');

cli.parse();
