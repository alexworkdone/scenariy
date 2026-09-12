export interface ScriptEntry {
    id: string;
    title: string;
    author?: string;
}

// Текст кожного сценарію: public/scripts/<id>.txt.
// Порядок записів визначає порядок кнопок; перший сценарій завантажується за замовчуванням.
export const availableScripts: ScriptEntry[] = [
    { id: 'po-modnomu', title: '«По-модньому»', author: 'Старицький' },
    { id: 'pomru-nazlo-vsim', title: 'ПОМРУ НАЗЛО ВСІМ' },
];
