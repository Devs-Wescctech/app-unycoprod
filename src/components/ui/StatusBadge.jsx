import React from 'react';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';

const statusConfig = {
  pendente: {
    label: 'Pendente',
    icon: Clock,
    className: 'bg-amber-50 text-amber-700 border-0'
  },
  sincronizado: {
    label: 'Sincronizado',
    icon: CheckCircle2,
    className: 'bg-emerald-50 text-emerald-700 border-0'
  },
  erro: {
    label: 'Erro',
    icon: XCircle,
    className: 'bg-red-50 text-red-700 border-0'
  }
};

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig.pendente;
  const Icon = config.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${config.className}`}>
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  );
}