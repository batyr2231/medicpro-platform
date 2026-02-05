// Медицинские процедуры
export interface MedicalProcedure {
  id: string;
  name: string;
  nameKey: string; // ← ключ для переводов
  icon: string;
  description?: string;
}

export const MEDICAL_PROCEDURES: MedicalProcedure[] = [
  {
    id: 'injection',
    name: 'Укол (внутримышечный/внутривенный)',
    nameKey: 'procedures.injection',
    icon: '💉',
    description: 'Внутримышечные и внутривенные инъекции'
  },
  {
    id: 'iv_drip',
    name: 'Капельница',
    nameKey: 'procedures.ivDrip',
    icon: '💧',
    description: 'Внутривенное капельное введение препаратов'
  },
  {
    id: 'enema',
    name: 'Клизма',
    nameKey: 'procedures.enema',
    icon: '🚿',
    description: 'Очистительная или лечебная клизма'
  },
  {
    id: 'dressing',
    name: 'Перевязки',
    nameKey: 'procedures.dressing',
    icon: '🩹',
    description: 'Обработка ран и смена повязок'
  },
  {
    id: 'alcohol_detox',
    name: 'Снятие алкогольной интоксикации',
    nameKey: 'procedures.alcoholDetox',
    icon: '🍺',
    description: 'Детоксикация при алкогольном отравлении'
  },
  {
    id: 'food_detox',
    name: 'Снятие пищевой интоксикации',
    nameKey: 'procedures.foodDetox',
    icon: '🤢',
    description: 'Детоксикация при пищевом отравлении'
  },
  {
    id: 'catheter_change',
    name: 'Смена катетера',
    nameKey: 'procedures.catheterChange',
    icon: '🔧',
    description: 'Замена мочевого катетера'
  },
  {
    id: 'coding',
    name: 'Кодировка',
    nameKey: 'procedures.coding',
    icon: '🚫',
    description: 'Медикаментозное кодирование от алкоголизма'
  }
];

// Получить процедуру по ID
export function getProcedureById(id: string): MedicalProcedure | undefined {
  return MEDICAL_PROCEDURES.find(p => p.id === id);
}

// Получить названия процедур по ID (с поддержкой переводов)
export function getProcedureNames(ids: string[], t?: (key: string) => string): string[] {
  return ids.map(id => {
    const proc = getProcedureById(id);
    if (!proc) return id;
    
    // Если есть функция перевода - используем её
    if (t && proc.nameKey) {
      return t(proc.nameKey);
    }
    
    // Иначе возвращаем русское название
    return proc.name;
  });
}