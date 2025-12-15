// Медицинские процедуры
export interface MedicalProcedure {
  id: string;
  name: string;
  icon: string;
  description?: string;
}

export const MEDICAL_PROCEDURES: MedicalProcedure[] = [
  {
    id: 'injection',
    name: 'Укол (внутримышечный/внутривенный)',
    icon: '💉',
    description: 'Внутримышечные и внутривенные инъекции'
  },
  {
    id: 'iv_drip',
    name: 'Капельница',
    icon: '💧',
    description: 'Внутривенное капельное введение препаратов'
  },
  {
    id: 'enema',
    name: 'Клизма',
    icon: '🚿',
    description: 'Очистительная или лечебная клизма'
  },
  {
    id: 'dressing',
    name: 'Перевязки',
    icon: '🩹',
    description: 'Обработка ран и смена повязок'
  },
  {
    id: 'alcohol_detox',
    name: 'Снятие алкогольной интоксикации',
    icon: '🍺',
    description: 'Детоксикация при алкогольном отравлении'
  },
  {
    id: 'food_detox',
    name: 'Снятие пищевой интоксикации',
    icon: '🤢',
    description: 'Детоксикация при пищевом отравлении'
  },
  {
    id: 'catheter_change',
    name: 'Смена катетера',
    icon: '🔧',
    description: 'Замена мочевого катетера'
  },
  {
    id: 'coding',
    name: 'Кодировка',
    icon: '🚫',
    description: 'Медикаментозное кодирование от алкоголизма'
  }
];

// Получить процедуру по ID
export function getProcedureById(id: string): MedicalProcedure | undefined {
  return MEDICAL_PROCEDURES.find(p => p.id === id);
}

// Получить названия процедур по ID
export function getProcedureNames(ids: string[]): string[] {
  return ids.map(id => {
    const proc = getProcedureById(id);
    return proc ? proc.name : id;
  });
}