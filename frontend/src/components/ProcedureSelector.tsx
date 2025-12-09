// components/ProcedureSelector.tsx
"use client";

import React from 'react';
import { MEDICAL_PROCEDURES } from '@/utils/procedures';

interface ProcedureSelectorProps {
  selectedProcedures: string[];
  onChange: (procedures: string[]) => void;
  required?: boolean;
}

export default function ProcedureSelector({ 
  selectedProcedures, 
  onChange, 
  required = false 
}: ProcedureSelectorProps) {
  
  const toggleProcedure = (procedureId: string) => {
    if (selectedProcedures.includes(procedureId)) {
      onChange(selectedProcedures.filter(id => id !== procedureId));
    } else {
      onChange([...selectedProcedures, procedureId]);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-3">
        Выберите процедуры {required && <span className="text-red-400">*</span>}
      </label>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {MEDICAL_PROCEDURES.map((procedure) => {
          const isSelected = selectedProcedures.includes(procedure.id);
          
          return (
            <button
              key={procedure.id}
              type="button"
              onClick={() => toggleProcedure(procedure.id)}
              className={`p-4 rounded-xl text-left transition-all border-2 ${
                isSelected
                  ? 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border-cyan-500 shadow-lg'
                  : 'bg-white/5 border-white/10 hover:border-white/20'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="text-3xl">{procedure.icon}</div>
                <div className="flex-1">
                  <div className="font-medium">{procedure.name}</div>
                  {isSelected && (
                    <div className="text-xs text-cyan-400 mt-1">✓ Выбрано</div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {selectedProcedures.length > 0 && (
        <div className="mt-4 p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/30">
          <div className="text-sm text-cyan-400 font-medium">
            Выбрано процедур: {selectedProcedures.length}
          </div>
        </div>
      )}
    </div>
  );
}