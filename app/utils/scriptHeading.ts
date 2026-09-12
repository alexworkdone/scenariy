// Розпізнавання лише структурних позначок, а не довільних ремарок.
export function isScriptHeading(text: string): boolean {
    const normalized = text.toLocaleUpperCase('uk-UA')
        .replace(/[’ʼ`]/g, "'")
        .replace(/\s+/g, '')
        .replace(/[:.!]$/, '');
    const ordinal = "(?:ПЕРША|ДРУГА|ТРЕТЯ|ЧЕТВЕРТА|П'ЯТА|ШОСТА|ШЕСТА|СЬОМА|ВОСЬМА|ДЕВ'ЯТА|ДЕСЯТА|\\d+|[IVX]+)";
    return /^(АНТРАКТ|ЗАВІСА|ДІЙОВІОСОБИ)$/.test(normalized)
        || new RegExp(`^(?:${ordinal}(?:СЦЕНА|ДІЯ|ЯВА)|(?:СЦЕНА|ДІЯ|ЯВА)${ordinal})$`).test(normalized);
}
