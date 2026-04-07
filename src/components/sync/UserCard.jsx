import React from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Phone, MapPin, Send, Loader2, CheckCircle2, Edit, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import StatusBadge from '@/components/ui/StatusBadge';
import ActionMenu from '@/components/ui/ActionMenu';

export default function UserCard({ user, onSync, isSyncing, index }) {
  const menuItems = [
    { icon: Eye, label: 'Ver detalhes', action: 'view' },
    { icon: Edit, label: 'Editar', action: 'edit' },
    { separator: true },
    { icon: Trash2, label: 'Excluir', action: 'delete', danger: true }
  ];

  const handleMenuAction = (action) => {
    console.log('Ação:', action, 'Usuário:', user.id);
    // Implementar ações aqui
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 hover:shadow-lg transition-all duration-300 group"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-[#2e6299]/10 flex items-center justify-center text-[#2e6299] font-bold text-lg">
            {user.nome?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">
              {user.nome} {user.sobrenome}
            </h3>
            <p className="text-sm text-slate-500">{user.cpf}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={user.status} />
          <ActionMenu items={menuItems} onItemClick={handleMenuAction} />
        </div>
      </div>

      <div className="space-y-2 mb-5">
        {user.email && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Mail className="w-4 h-4 text-slate-400" />
            <span>{user.email}</span>
          </div>
        )}
        {user.telefone && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Phone className="w-4 h-4 text-slate-400" />
            <span>({user.ddd}) {user.telefone}</span>
          </div>
        )}
        {user.cidade && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <MapPin className="w-4 h-4 text-slate-400" />
            <span>{user.cidade} - {user.estado}</span>
          </div>
        )}
      </div>

      {user.status === 'pendente' && (
        <Button
          onClick={() => onSync(user)}
          disabled={isSyncing}
          className="w-full bg-[#2e6299] hover:bg-[#2e6299]/90 text-white shadow-md hover:shadow-lg transition-all duration-300 rounded-lg"
        >
          {isSyncing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Enviar para TOTVS
            </>
          )}
        </Button>
      )}

      {user.status === 'sincronizado' && (
        <div className="flex items-center justify-center gap-2 py-2.5 text-emerald-600 bg-emerald-50 rounded-lg">
          <CheckCircle2 className="w-4 h-4" />
          <span className="text-sm font-semibold">Sincronizado com sucesso</span>
        </div>
      )}

      {user.status === 'erro' && user.totvs_response && (
        <div className="p-3 bg-red-50 rounded-lg border-0">
          <p className="text-xs text-red-600 font-medium">{user.totvs_response}</p>
        </div>
      )}
    </motion.div>
  );
}