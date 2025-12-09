// components/ProcedureList.tsx
"use client";

import React from 'react';
import { getProcedureName, getProcedureIcon } from '@/utils/procedures';

interface ProcedureListProps {
  procedures: string[];
  compact?: boolean;
}

export default function ProcedureList({ procedures, compact = false }: ProcedureListProps) {
  if (!procedures || procedures.length === 0) {
    return (
      <div className="text-slate-400 text-sm italic">
        Процедуры не указаны
      </div>
    );
  }

  if (compact) {
    // Компактный режим - иконки в строку
    return (
      <div className="flex items-center space-x-2">
        {procedures.map((procedureId, index) => (
          <div
            key={index}
            className="flex items-center space-x-1 px-3 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30"
            title={getProcedureName(procedureId)}
          >
            <span className="text-lg">{getProcedureIcon(procedureId)}</span>
            <span className="text-xs text-cyan-400 hidden sm:inline">
              {getProcedureName(procedureId)}
            </span>
          </div>
        ))}
      </div>
    );
  }

  // Полный режим - список с деталями
  return (
    <div className="space-y-2">
      {procedures.map((procedureId, index) => (
        <div
          key={index}
          className="flex items-center space-x-3 p-3 rounded-xl bg-white/5 border border-white/10"
        >
          <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center text-2xl">
            {getProcedureIcon(procedureId)}
          </div>
          <div className="font-medium">{getProcedureName(procedureId)}</div>
        </div>
      ))}
    </div>
  );
}