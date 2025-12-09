// utils/procedures.ts
export const MEDICAL_PROCEDURES = [
  { id: 'injections', name: 'Уколы', icon: '💉' },
  { id: 'iv_drip', name: 'Капельница', icon: '🩺' },
  { id: 'enema', name: 'Клизма', icon: '🏥' },
  { id: 'dressing', name: 'Перевязки', icon: '🩹' },
  { id: 'alcohol_detox', name: 'Снятие алкогольной интоксикации', icon: '🍷' },
  { id: 'poisoning_detox', name: 'Снятие интоксикации (отравление)', icon: '🤢' },
  { id: 'catheter_change', name: 'Смена катетера', icon: '🔧' },
  { id: 'coding', name: 'Кодировка', icon: '🚫' },
] as const;

export type ProcedureId = typeof MEDICAL_PROCEDURES[number]['id'];

export function getProcedureName(id: string): string {
  const procedure = MEDICAL_PROCEDURES.find(p => p.id === id);
  return procedure?.name || id;
}

export function getProcedureIcon(id: string): string {
  const procedure = MEDICAL_PROCEDURES.find(p => p.id === id);
  return procedure?.icon || '💊';
}