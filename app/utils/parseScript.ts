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

export type Block = StageDirection | Dialogue;

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
    const isProbablyTitle = !/^\(.*\)$/.test(first) && !first.includes(':');
    if (isProbablyTitle && first.length < 120) {
      title = first;
      lines.shift();
    }
  }

  // Combine lines into paragraphs separated by blank lines (already trimmed out),
  // but retain existing line concatenation as simple continuous parsing.
  const stageLineRe = /^\((.*)\)$/; // whole line in parentheses

  for (const line of lines) {
    const stageMatch = line.match(stageLineRe);
    if (stageMatch) {
      blocks.push({ type: 'stage', text: stageMatch[1].trim() });
      continue;
    }

    // Try to parse dialogue
    // Patterns:
    // 1) Name: Text
    // 2) Name(aside) Text
    // 3) Name (aside): Text
    // We try to capture name + optional parenthetical immediately after name
    const dialoguePatterns: RegExp[] = [
      new RegExp(`^${nameRe.source}\\s*:\\s*(.*)$`),
      new RegExp(`^${nameRe.source}\\s*\\(([^)]*)\\)\\s*(.*)$`),
      new RegExp(`^${nameRe.source}\\s*\\(([^)]*)\\)\\s*:\\s*(.*)$`),
    ];

    let matched = false;
    for (const re of dialoguePatterns) {
      const m = line.match(re);
      if (m) {
        matched = true;
        const nameRaw = m[1];
        let aside = '';
        let text = '';
        if (re === dialoguePatterns[0]) {
          text = m[2]?.trim() ?? '';
        } else if (re === dialoguePatterns[1]) {
          aside = m[2]?.trim() ?? '';
          text = m[3]?.trim() ?? '';
        } else {
          aside = m[2]?.trim() ?? '';
          text = m[3]?.trim() ?? '';
        }
        const name = normalizeName(nameRaw);
        if (name) charactersSet.add(name);
        blocks.push({ type: 'dialogue', character: name, aside: aside || undefined, text });
        break;
      }
    }

    if (matched) continue;

    // If line contains stage direction inside but not entire line, split it naïvely
    // Example: Наталка(цілує її): Ти така...
    const inlineStage = line.match(new RegExp(`^${nameRe.source}\\s*\\(([^)]*)\\)\\s*:?\\s*(.*)$`));
    if (inlineStage) {
      const name = normalizeName(inlineStage[1]);
      const aside = inlineStage[2]?.trim();
      const text = inlineStage[3]?.trim() ?? '';
      if (name) charactersSet.add(name);
      blocks.push({ type: 'dialogue', character: name, aside: aside || undefined, text });
      continue;
    }

    // Otherwise, it's a free text line; treat as stage direction paragraph
    blocks.push({ type: 'stage', text: line });
  }

  const characters = Array.from(charactersSet);
  return { title, characters, blocks };
}
