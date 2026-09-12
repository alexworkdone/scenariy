import type { Block } from './parseScript'
import { isScriptHeading } from './scriptHeading'

export function headingLabel(text: string): string {
    if (/^(?:\s*[А-ЯІЇЄҐ]\s+){3,}/u.test(text)) {
        const compact = text.replace(/\s+/g, '')
        return compact.endsWith('ДІЯ') ? compact.slice(0, -3) + ' ДІЯ' : compact
    }
    return text
}

// Split only at sentence boundaries outside parenthetical directions.
// Original characters, punctuation and whitespace are retained in the slices.
export function dialogueParagraphs(text: string): string[] {
    if (text.length < 500) return [text]
    const parts: string[] = []
    let start = 0
    let depth = 0
    for (let i = 0; i < text.length; i++) {
        if (text[i] === '(') depth++
        if (text[i] === ')') depth = Math.max(0, depth - 1)
        if (!depth && i - start >= 280 && /[.!?…]/.test(text[i]) && /\s/.test(text[i + 1] || '') && text.length - i > 100) {
            parts.push(text.slice(start, i + 1))
            start = i + 1
        }
    }
    parts.push(text.slice(start))
    return parts
}

export function readerBlocks(blocks: Block[]) {
    return blocks.flatMap((block, index) => {
        const previous = blocks[index - 1]
        const isScene = block.type === 'stage' && isScriptHeading(block.text) && /СЦЕНА/i.test(block.text)
        const isSubtitle = block.type === 'stage' && /^«.*»$/.test(block.text)
            && previous?.type === 'stage' && isScriptHeading(previous.text) && /СЦЕНА/i.test(previous.text)
        if (isSubtitle) return []
        const next = blocks[index + 1]
        return [{ ...block, index, heading: block.type === 'stage' && isScriptHeading(block.text),
            label: headingLabel(block.text),
            subtitle: isScene && next?.type === 'stage' && /^«.*»$/.test(next.text) ? next.text : '',
            paragraphs: block.type === 'dialogue' ? dialogueParagraphs(block.text) : [],
        }]
    })
}
