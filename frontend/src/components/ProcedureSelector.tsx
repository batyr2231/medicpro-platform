"use client";

import React from 'react';
import { MEDICAL_PROCEDURES, MedicalProcedure } from 'utils/procedures';

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
    <div className="space-y-3">
      {MEDICAL_PROCEDURES.map((procedure) => (
        <button
          key={procedure.id}
          type="button"
          onClick={() => toggleProcedure(procedure.id)}
          className={`w-full p-4 rounded-xl text-left transition-all ${
            selectedProcedures.includes(procedure.id)
              ? 'bg-purple-500/20 border-2 border-purple-500'
              : 'bg-white/5 border-2 border-white/10 hover:border-white/20'
          }`}
        >
          <div className="flex items-start space-x-3">
            {/* Иконка */}
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-2xl flex-shrink-0 ${
              selectedProcedures.includes(procedure.id)
                ? 'bg-purple-500/30'
                : 'bg-white/10'
            }`}>
              {procedure.icon}
            </div>
            
            {/* Текст */}
            <div className="flex-1 min-w-0">
              <div className={`font-semibold text-sm sm:text-base ${
                selectedProcedures.includes(procedure.id)
                  ? 'text-purple-300'
                  : 'text-white'
              }`}>
                {procedure.name}
              </div>
              {procedure.description && (
                <div className="text-xs text-slate-400 mt-1">
                  {procedure.description}
                </div>
              )}
            </div>

            {/* Чекбокс */}
            <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 ${
              selectedProcedures.includes(procedure.id)
                ? 'bg-purple-500 border-purple-500'
                : 'border-white/30'
            }`}>
              {selectedProcedures.includes(procedure.id) && (
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          </div>
        </button>
      ))}

      {/* Счётчик выбранных */}
      <div className={`p-3 rounded-lg ${
        selectedProcedures.length > 0 
          ? 'bg-purple-500/10 border border-purple-500/30' 
          : 'bg-white/5 border border-white/10'
      }`}>
        <div className={`text-sm ${
          selectedProcedures.length > 0 
            ? 'text-purple-400' 
            : 'text-slate-400'
        }`}>
          {selectedProcedures.length > 0 
            ? `✓ Выбрано процедур: ${selectedProcedures.length}`
            : required 
              ? '⚠️ Выберите хотя бы одну процедуру'
              : 'Процедуры не выбраны'
          }
        </div>
      </div>
    </div>
  );
}