export interface StageDirection {
  type: 'stage';
  text: string;
}

export interface Dialogue {
  type: 'dialogue';
  character: string;
  aside?: string; // text in parentheses right after the name
  text: string; // spoken text (may include sentences and punctuation)
}

export interface QuoteBlock {
  type: 'quote';
  text: string; // quoted text inside double quotes, may span multiple lines
}

export type Block = StageDirection | Dialogue | QuoteBlock;

export interface ParsedPlay {
  title: string;
  characters: string[];
  blocks: Block[];
}

// Normalize Ukrainian letters and trim punctuation around a potential name
function normalizeName(raw: string): string {
  return raw
    .replace(/[().]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Heuristics:
// - Stage directions are enclosed in parentheses like: (Входить Овсій)
// - Speaker lines may look like:
//    Name: Text
//    Name(aside) Text
//    Name (aside): Text
// - Names start with a capital letter (Cyrillic allowed) and contain letters/ʼ/’- and possibly spaces
const nameRe = /([A-ЯІЇЄҐA-Z][A-Яа-яІіЇїЄєҐґ'’\-]+(?:\s+[A-Яа-яІіЇїЄєҐґ'’\-]+)*)/;

export function parseScript(input: string, titleFallback = 'Назва пʼєси'): ParsedPlay {
  const lines = input
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0);

  const blocks: Block[] = [];
  const charactersSet = new Set<string>();

  // If first non-empty line looks like a title (no colon, not entirely in parentheses), treat it as title
  let title = titleFallback;
  if (lines.length) {
    const first = lines[0];
    const isProbablyTitle = !/^\(.*\)$/.test(first) && !first.includes(':') && !first.startsWith('"');
    if (isProbablyTitle && first.length < 120) {
      title = first;
      lines.shift();
    }
  }

  // Combine lines into paragraphs separated by blank lines (already trimmed out),
  // but retain existing line concatenation as simple continuous parsing.
  const stageLineRe = /^\((.*)\)$/; // whole line in parentheses

  // Within quote blocks, lines may be wrapped in round brackets. Strip a single outer pair.
  const stripOuterParensOnce = (s: string): string => {
    let out = s.trim();
    if (out.startsWith('(') && out.endsWith(')') && out.length >= 2) {
      out = out.slice(1, -1).trim();
    } else {
      if (out.startsWith('(')) out = out.slice(1).trim();
      if (out.endsWith(')')) out = out.slice(0, -1).trim();
    }
    return out;
  };

  let inQuote = false;
  let quoteParts: string[] = [];

  for (const line of lines) {
    // Handle quote blocks enclosed in double quotes, may span multiple lines
    if (!inQuote && line.startsWith('"')) {
      // Begin a quote block. Remove the opening quote and look for a closing one anywhere in the line.
      const rest = line.slice(1);
      const closePos = rest.indexOf('"');
      if (closePos >= 0) {
        // Quote starts and ends on the same line
        const between = stripOuterParensOnce(rest.slice(0, closePos));
        blocks.push({ type: 'quote', text: between });
        const trailing = rest.slice(closePos + 1).trim();
        // If trailing contains only closing parentheses, ignore; otherwise fall through to normal parsing by continuing to next line
        // (we just continue, remaining trailing text is ignored for simplicity as common cases are only ")")
        inQuote = false;
        quoteParts = [];
        continue;
      } else {
        inQuote = true;
        quoteParts = [stripOuterParensOnce(rest)];
        continue;
      }
    } else if (inQuote) {
      // We are inside a multi-line quote. Look for a closing quote anywhere in this line.
      const closePos = line.indexOf('"');
      if (closePos >= 0) {
        const before = stripOuterParensOnce(line.slice(0, closePos));
        quoteParts.push(before);
        const text = quoteParts.join('\n');
        blocks.push({ type: 'quote', text });
        inQuote = false;
        quoteParts = [];
        // Ignore any trailing content after the closing quote if it's only ")" or whitespace
        const trailing = line.slice(closePos + 1).trim();
        if (trailing && trailing.replace(/\)+/g, '') !== '') {
          // Non-parenthesis trailing content exists; treat as a freetext stage line
          blocks.push({ type: 'stage', text: trailing });
        }
        continue;
      } else {
        quoteParts.push(stripOuterParensOnce(line));
        continue;
      }
    }

    const stageMatch = line.match(stageLineRe);
    if (stageMatch) {
      blocks.push({ type: 'stage', text: stageMatch[1].trim() });
      continue;
    }

    // Try to parse dialogue
    // New rules: capture aside ONLY after the colon, e.g. "Name: (aside) Text"
    // Supported patterns (order matters):
    // 1) Name: (aside) Text
    // 2) Name: Text
    // 3) Name (anything before colon): Text  -> treat as plain dialogue without aside
    const dialoguePatterns: RegExp[] = [
      // Aside right after colon
      new RegExp(`^${nameRe.source}\\s*:\\s*\\(([^)]*)\\)\\s*(.*)$`),
      // Plain dialogue after colon
      new RegExp(`^${nameRe.source}\\s*:\\s*(.*)$`),
      // Name with parentheses BEFORE colon — do NOT capture as aside
      new RegExp(`^${nameRe.source}\\s*\\([^)]*\\)\\s*:\\s*(.*)$`),
    ];

    let matched = false;
    for (let idx = 0; idx < dialoguePatterns.length; idx++) {
      const re = dialoguePatterns[idx];
      const m = line.match(re);
      if (m) {
        matched = true;
        let nameRaw = '';
        let aside = '';
        let text = '';
        if (idx === 0) {
          // Name: (aside) Text
          nameRaw = m[1];
          aside = m[2]?.trim() ?? '';
          text = m[3]?.trim() ?? '';
        } else if (idx === 1) {
          // Name: Text
          nameRaw = m[1];
          text = m[2]?.trim() ?? '';
        } else {
          // Name (something): Text -> ignore the pre-colon parentheses for aside
          nameRaw = m[1];
          text = m[2]?.trim() ?? '';
        }
        const name = normalizeName(nameRaw);
        if (name) charactersSet.add(name);
        blocks.push({ type: 'dialogue', character: name, aside: aside || undefined, text });
        break;
      }
    }

    if (matched) continue;

    // Otherwise, it's a free text line; treat as stage direction paragraph

    // Otherwise, it's a free text line; treat as stage direction paragraph
    blocks.push({ type: 'stage', text: line });
  }

  // If input ended while still in quote, flush as quote
  if (inQuote) {
    const text = quoteParts.join('\n');
    blocks.push({ type: 'quote', text });
  }

  const characters = Array.from(charactersSet);
  return { title, characters, blocks };
}
