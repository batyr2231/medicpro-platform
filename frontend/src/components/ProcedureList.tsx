"use client";

import React from 'react';
import { getProcedureById } from 'utils/procedures';

interface ProcedureListProps {
  procedures: string[];
  compact?: boolean;
}

export default function ProcedureList({ procedures, compact = false }: ProcedureListProps) {
  if (!procedures || procedures.length === 0) {
    return null;
  }

  return (
    <div className={compact ? 'flex flex-wrap gap-2' : 'space-y-2'}>
      {procedures.map((procId, idx) => {
        const procedure = getProcedureById(procId);
        
        if (!procedure) {
          return (
            <div 
              key={idx} 
              className="px-3 py-1 rounded-lg bg-slate-500/20 border border-slate-500/30"
            >
              <span className="text-xs text-slate-400">{procId}</span>
            </div>
          );
        }

        if (compact) {
          return (
            <div 
              key={idx} 
              className="flex items-center space-x-1 px-2 py-1 rounded-lg bg-purple-500/20 border border-purple-500/30"
            >
              <span className="text-sm">{procedure.icon}</span>
              <span className="text-xs text-purple-300">{procedure.name}</span>
            </div>
          );
        }

        return (
          <div 
            key={idx} 
            className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-purple-500/10 border border-purple-500/30"
          >
            <span className="text-xl">{procedure.icon}</span>
            <span className="font-medium text-purple-300">{procedure.name}</span>
          </div>
        );
      })}
    </div>
  );
}