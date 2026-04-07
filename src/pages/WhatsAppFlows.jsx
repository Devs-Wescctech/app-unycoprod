import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { MessageCircle, Plus, Zap, Power, PowerOff, Clock, Send, Pencil, Trash2, X, Loader2, ChevronDown, ChevronUp, Eye, BarChart3, CheckCircle2, AlertCircle, Copy, Check, History, Settings2, Sparkles, Phone, ArrowRight, RefreshCw, Search, Hotel, XCircle, Timer, Star, CreditCard, Coins, PartyPopper, UserCheck, Mail, GripVertical, ArrowDown, Type, Variable, Image, Smile, Bold, AlignLeft, MousePointer, GitBranch, MessageSquare, CornerDownRight, ChevronRight, PlayCircle, PauseCircle, ToggleLeft, ToggleRight, Workflow, Bot, CircleDot } from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import PageHeader from '@/components/ui/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const TRIGGER_EVENTS = [
  { value: 'booking_confirmed', label: 'Reserva Confirmada', Icon: Hotel, color: '#10b981' },
  { value: 'booking_cancelled', label: 'Reserva Cancelada', Icon: XCircle, color: '#ef4444' },
  { value: 'booking_reminder', label: 'Lembrete de Hospedagem', Icon: Timer, color: '#f59e0b' },
  { value: 'booking_completed', label: 'Pos Check-out', Icon: Star, color: '#8b5cf6' },
  { value: 'payment_status_changed', label: 'Status de Pagamento', Icon: CreditCard, color: '#3b82f6' },
  { value: 'payment_pending_reminder', label: 'Pagamento Pendente', Icon: Coins, color: '#f97316' },
  { value: 'subscription_created', label: 'Novo Plano Assinado', Icon: PartyPopper, color: '#06b6d4' },
  { value: 'registration_completed', label: 'Cadastro Finalizado', Icon: UserCheck, color: '#22c55e' },
];

const TEMPLATE_VARS = [
  { key: 'nome', desc: 'Nome do cliente', icon: UserCheck },
  { key: 'hotel', desc: 'Nome do hotel', icon: Hotel },
  { key: 'checkin', desc: 'Data check-in', icon: Clock },
  { key: 'checkout', desc: 'Data check-out', icon: Clock },
  { key: 'localizador', desc: 'Localizador', icon: Search },
  { key: 'valor', desc: 'Valor da reserva', icon: Coins },
  { key: 'plano', desc: 'Nome do plano', icon: Star },
  { key: 'status_pagamento', desc: 'Status do pagamento', icon: CreditCard },
  { key: 'mensagem_extra', desc: 'Mensagem adicional', icon: MessageSquare },
];

const NODE_TYPES = {
  trigger: { label: 'Gatilho', color: '#10b981', Icon: Zap },
  delay: { label: 'Atraso', color: '#f59e0b', Icon: Clock },
  message: { label: 'Mensagem', color: '#25d366', Icon: MessageCircle },
  condition: { label: 'Condição', color: '#8b5cf6', Icon: GitBranch },
};

function FlowCard({ flow, onEdit, onToggle, onDelete, onTest, onViewLogs }) {
  const [showPreview, setShowPreview] = useState(false);
  const trigger = TRIGGER_EVENTS.find(t => t.value === flow.trigger_event) || { label: flow.trigger_event, Icon: Mail, color: '#64748b' };
  const TriggerIcon = trigger.Icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all duration-300 hover:shadow-md ${flow.enabled ? 'border-slate-200' : 'border-slate-100 opacity-75'}`}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: trigger.color + '15' }}>
              <TriggerIcon className="w-5 h-5" style={{ color: trigger.color }} />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-slate-800 text-sm truncate">{flow.name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ backgroundColor: trigger.color + '15', color: trigger.color }}>
                  <Zap className="w-2.5 h-2.5" />
                  {trigger.label}
                </span>
                {flow.delay_minutes > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-600">
                    <Clock className="w-2.5 h-2.5" />
                    {flow.delay_minutes >= 1440 ? `${Math.floor(flow.delay_minutes / 1440)}d` : flow.delay_minutes >= 60 ? `${Math.floor(flow.delay_minutes / 60)}h` : `${flow.delay_minutes}min`}
                  </span>
                )}
              </div>
              {flow.description && (
                <p className="text-xs text-slate-400 mt-1.5 line-clamp-2">{flow.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={() => onToggle(flow)} className={`p-1.5 rounded-lg transition-all ${flow.enabled ? 'bg-emerald-50 text-emerald-500 hover:bg-emerald-100' : 'bg-slate-50 text-slate-300 hover:bg-slate-100'}`} title={flow.enabled ? 'Desativar' : 'Ativar'}>
              {flow.enabled ? <Power className="w-4 h-4" /> : <PowerOff className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <Send className="w-3 h-3" />
              {flow.send_count || 0} envios
            </span>
            {flow.last_sent_at && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {format(new Date(flow.last_sent_at), "dd/MM HH:mm")}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setShowPreview(!showPreview)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all" title="Preview">
              <Eye className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onViewLogs(flow)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all" title="Logs">
              <History className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onTest(flow)} className="p-1.5 rounded-lg text-slate-400 hover:bg-blue-50 hover:text-blue-500 transition-all" title="Testar">
              <Phone className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onEdit(flow)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-50 hover:text-[#2e6299] transition-all" title="Editar">
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onDelete(flow)} className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all" title="Excluir">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showPreview && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-5 pb-5 pt-2 border-t border-slate-100 bg-slate-50/50">
              <div className="bg-[#e5ddd5] rounded-xl p-4 max-w-sm">
                <div className="bg-[#dcf8c6] rounded-lg p-3 shadow-sm text-sm whitespace-pre-wrap text-slate-800 leading-relaxed relative">
                  {flow.message_template}
                  <div className="text-[10px] text-slate-400 text-right mt-1 flex items-center justify-end gap-0.5">
                    {format(new Date(), 'HH:mm')} <CheckCircle2 className="w-3 h-3 text-blue-400" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function VisualNode({ type, data, index, isLast, onUpdate, onRemove, canRemove, isDraggable, onAddAfter }) {
  const config = NODE_TYPES[type];
  const NodeIcon = config.Icon;
  const [expanded, setExpanded] = useState(type === 'message');

  return (
    <div className="relative">
      <div className={`relative border-2 rounded-2xl bg-white shadow-sm transition-all duration-200 hover:shadow-md ${expanded ? 'border-l-4' : 'border'}`} style={{ borderLeftColor: expanded ? config.color : undefined }}>
        <div
          className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
          onClick={() => setExpanded(!expanded)}
        >
          {isDraggable && (
            <div className="flex-shrink-0 cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 transition-colors" onPointerDown={e => e.stopPropagation()}>
              <GripVertical className="w-4 h-4" />
            </div>
          )}
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: config.color + '15' }}>
            <NodeIcon className="w-4.5 h-4.5" style={{ color: config.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: config.color }}>{config.label}</span>
              {type === 'trigger' && data.trigger_event && (
                <span className="text-[10px] text-slate-400">
                  {TRIGGER_EVENTS.find(t => t.value === data.trigger_event)?.label || data.trigger_event}
                </span>
              )}
            </div>
            {!expanded && (
              <p className="text-xs text-slate-500 truncate mt-0.5">
                {type === 'message' ? (data.message_template?.substring(0, 60) || 'Configure a mensagem...') + (data.message_template?.length > 60 ? '...' : '') : ''}
                {type === 'delay' ? `Aguardar ${data.delay_minutes >= 1440 ? Math.floor(data.delay_minutes / 1440) + ' dia(s)' : data.delay_minutes >= 60 ? Math.floor(data.delay_minutes / 60) + 'h' : (data.delay_minutes || 0) + ' min'}` : ''}
                {type === 'trigger' ? 'Quando o evento ocorrer' : ''}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {canRemove && (
              <button
                onClick={(e) => { e.stopPropagation(); onRemove(); }}
                className="p-1 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
            <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </div>
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 border-t border-slate-100 pt-3">
                {type === 'trigger' && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 mb-1.5 block uppercase tracking-wider">Evento Disparador</label>
                      <div className="grid grid-cols-2 gap-2">
                        {TRIGGER_EVENTS.map(t => {
                          const EventIcon = t.Icon;
                          return (
                            <button
                              key={t.value}
                              onClick={() => onUpdate({ trigger_event: t.value })}
                              className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-medium transition-all text-left ${
                                data.trigger_event === t.value
                                  ? 'ring-2 ring-offset-1 bg-white shadow-sm'
                                  : 'bg-slate-50 hover:bg-slate-100'
                              }`}
                              style={data.trigger_event === t.value ? { ringColor: t.color, borderColor: t.color } : {}}
                            >
                              <EventIcon className="w-4 h-4 flex-shrink-0" style={{ color: t.color }} />
                              <span className="truncate">{t.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {type === 'delay' && (
                  <div className="space-y-3">
                    <label className="text-[11px] font-semibold text-slate-500 mb-1.5 block uppercase tracking-wider">Tempo de espera</label>
                    <div className="flex gap-2">
                      {[
                        { label: 'Imediato', value: 0 },
                        { label: '5 min', value: 5 },
                        { label: '30 min', value: 30 },
                        { label: '1 hora', value: 60 },
                        { label: '6 horas', value: 360 },
                        { label: '1 dia', value: 1440 },
                        { label: '2 dias', value: 2880 },
                      ].map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => onUpdate({ delay_minutes: opt.value })}
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                            data.delay_minutes === opt.value
                              ? 'bg-amber-100 text-amber-700 ring-1 ring-amber-300'
                              : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Input
                        type="number"
                        min="0"
                        value={data.delay_minutes || 0}
                        onChange={e => onUpdate({ delay_minutes: parseInt(e.target.value) || 0 })}
                        className="h-9 rounded-xl w-24 text-sm"
                      />
                      <span className="text-xs text-slate-400">minutos</span>
                    </div>
                  </div>
                )}

                {type === 'message' && (
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Mensagem WhatsApp</label>
                        <span className="text-[10px] text-slate-400">{(data.message_template || '').length} caracteres</span>
                      </div>
                      <textarea
                        value={data.message_template || ''}
                        onChange={e => onUpdate({ message_template: e.target.value })}
                        placeholder="Digite a mensagem..."
                        rows={6}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#25d366]/30 resize-none font-mono leading-relaxed"
                      />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 mb-1.5 uppercase tracking-wider font-semibold flex items-center gap-1">
                        <Variable className="w-3 h-3" /> Variaveis (clique para inserir)
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {TEMPLATE_VARS.map(v => {
                          const VarIcon = v.icon;
                          return (
                            <button
                              key={v.key}
                              onClick={() => onUpdate({ message_template: (data.message_template || '') + `{{${v.key}}}` })}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-mono bg-slate-100 text-slate-600 hover:bg-[#25d366]/10 hover:text-[#25d366] transition-all"
                              title={v.desc}
                            >
                              <VarIcon className="w-2.5 h-2.5" />
                              {`{{${v.key}}}`}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    {data.message_template && (
                      <div>
                        <p className="text-[10px] text-slate-400 mb-1.5 uppercase tracking-wider font-semibold flex items-center gap-1">
                          <Eye className="w-3 h-3" /> Preview
                        </p>
                        <div className="bg-[#e5ddd5] rounded-xl p-3">
                          <div className="bg-[#dcf8c6] rounded-lg p-3 shadow-sm text-xs whitespace-pre-wrap text-slate-700 leading-relaxed max-h-32 overflow-auto">
                            {data.message_template}
                            <div className="text-[9px] text-slate-400 text-right mt-1 flex items-center justify-end gap-0.5">
                              {format(new Date(), 'HH:mm')} <CheckCircle2 className="w-2.5 h-2.5 text-blue-400" />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {!isLast && (
        <div className="flex flex-col items-center py-1">
          <div className="w-0.5 h-3 bg-slate-200" />
          {onAddAfter && (
            <div className="flex items-center gap-1 my-1">
              <button
                onClick={(e) => { e.stopPropagation(); onAddAfter('delay'); }}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium bg-amber-50 text-amber-600 hover:bg-amber-100 transition-all"
                title="Adicionar Atraso"
              >
                <Clock className="w-3 h-3" />
                <Plus className="w-2.5 h-2.5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onAddAfter('message'); }}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all"
                title="Adicionar Mensagem"
              >
                <MessageCircle className="w-3 h-3" />
                <Plus className="w-2.5 h-2.5" />
              </button>
            </div>
          )}
          <div className="w-0.5 h-3 bg-slate-200" />
          <ArrowDown className="w-4 h-4 text-slate-300 -mt-1" />
        </div>
      )}
    </div>
  );
}

function VisualFlowBuilder({ flow, onSave, onClose, saving }) {
  const [form, setForm] = useState({
    name: flow?.name || '',
    description: flow?.description || '',
    enabled: flow?.enabled !== false,
  });

  const [nodes, setNodes] = useState(() => {
    const initial = [
      { id: 'trigger', type: 'trigger', data: { trigger_event: flow?.trigger_event || 'booking_confirmed' } },
    ];
    const savedNodes = flow?.metadata?.flow_nodes;
    if (savedNodes && Array.isArray(savedNodes) && savedNodes.length > 0) {
      savedNodes.forEach((n, i) => {
        initial.push({ id: `${n.type}_${i}`, type: n.type, data: n.data || {} });
      });
    } else {
      if (flow?.delay_minutes > 0) {
        initial.push({ id: 'delay_0', type: 'delay', data: { delay_minutes: flow?.delay_minutes || 0 } });
      }
      const msgTemplate = flow?.message_template || '';
      if (msgTemplate.includes('---MSG---')) {
        const parts = msgTemplate.split('---MSG---');
        parts.forEach((part, i) => {
          initial.push({ id: `message_${i}`, type: 'message', data: { message_template: part } });
        });
      } else {
        initial.push({ id: 'message_0', type: 'message', data: { message_template: msgTemplate } });
      }
    }
    return initial;
  });

  const updateNode = useCallback((nodeId, updates) => {
    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, data: { ...n.data, ...updates } } : n));
  }, []);

  const removeNode = useCallback((nodeId) => {
    setNodes(prev => prev.filter(n => n.id !== nodeId));
  }, []);

  const addNode = useCallback((type, afterIndex) => {
    const newNode = {
      id: `${type}_${Date.now()}`,
      type,
      data: type === 'delay' ? { delay_minutes: 60 } : type === 'message' ? { message_template: '' } : {},
    };
    setNodes(prev => {
      const next = [...prev];
      next.splice(afterIndex + 1, 0, newNode);
      return next;
    });
  }, []);

  const handleSave = () => {
    const triggerNode = nodes.find(n => n.type === 'trigger');
    const nonTriggerNodes = nodes.filter(n => n.type !== 'trigger');
    const flowNodes = nonTriggerNodes.map(n => ({ type: n.type, data: n.data }));
    const messageNodes = nodes.filter(n => n.type === 'message');
    const delayNode = nodes.find(n => n.type === 'delay');
    const combinedMessages = messageNodes.map(n => n.data.message_template || '').join('---MSG---');

    onSave({
      ...form,
      trigger_event: triggerNode?.data.trigger_event || 'booking_confirmed',
      message_template: combinedMessages,
      delay_minutes: delayNode?.data.delay_minutes || 0,
      metadata: { flow_nodes: flowNodes },
    });
  };

  const draggableNodes = nodes.filter(n => n.type !== 'trigger');

  const handleReorder = useCallback((newDraggable) => {
    setNodes(prev => {
      const trigger = prev.find(n => n.type === 'trigger');
      return [trigger, ...newDraggable];
    });
  }, []);

  const triggerEvent = nodes.find(n => n.type === 'trigger')?.data.trigger_event;
  const triggerInfo = TRIGGER_EVENTS.find(t => t.value === triggerEvent);

  return (
    <div className="fixed inset-0 z-50 flex" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative bg-slate-50 w-full max-w-4xl mx-auto my-4 rounded-2xl shadow-2xl overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#25d366] to-[#128c7e] flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">{flow ? 'Editar Fluxo' : 'Novo Fluxo'}</h3>
              <p className="text-xs text-slate-400">Construtor visual de automacao</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-0 min-h-full">
            <div className="lg:col-span-2 bg-white border-r border-slate-200 p-5 space-y-4 overflow-auto">
              <div>
                <label className="text-[11px] font-semibold text-slate-500 mb-1.5 block uppercase tracking-wider">Nome do Fluxo</label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Confirmacao de Reserva" className="h-10 rounded-xl" />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-500 mb-1.5 block uppercase tracking-wider">Descricao</label>
                <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Breve descricao..." className="h-10 rounded-xl" />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-500 mb-1.5 block uppercase tracking-wider">Status</label>
                <button
                  onClick={() => setForm(f => ({ ...f, enabled: !f.enabled }))}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${form.enabled ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-50 text-slate-500 border border-slate-200'}`}
                >
                  {form.enabled ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                  {form.enabled ? 'Ativo' : 'Inativo'}
                </button>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <p className="text-[11px] font-semibold text-slate-500 mb-3 uppercase tracking-wider flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Adicionar etapa
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      const triggerIdx = nodes.findIndex(n => n.type === 'trigger');
                      addNode('delay', triggerIdx);
                    }}
                    className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 transition-all text-xs font-medium"
                  >
                    <Clock className="w-4 h-4" />
                    Atraso
                  </button>
                  {nodes.filter(n => n.type === 'message').length < 5 && (
                    <button
                      onClick={() => addNode('message', nodes.length - 1)}
                      className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-all text-xs font-medium"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Mensagem
                    </button>
                  )}
                </div>
              </div>

              {triggerInfo && (
                <div className="border-t border-slate-100 pt-4">
                  <p className="text-[11px] font-semibold text-slate-500 mb-2 uppercase tracking-wider">Resumo do fluxo</p>
                  <div className="bg-slate-50 rounded-xl p-3 space-y-2">
                    <div className="flex items-center gap-2 text-xs">
                      <Zap className="w-3.5 h-3.5" style={{ color: triggerInfo.color }} />
                      <span className="text-slate-600">Quando: <strong>{triggerInfo.label}</strong></span>
                    </div>
                    {nodes.filter(n => n.type === 'delay').map((delayNode, i) => (
                      <div key={delayNode.id} className="flex items-center gap-2 text-xs">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-slate-600">
                          Aguardar {nodes.filter(n => n.type === 'delay').length > 1 ? `#${i + 1}` : ''}: <strong>
                          {(() => {
                            const d = delayNode.data.delay_minutes || 0;
                            return d >= 1440 ? `${Math.floor(d / 1440)} dia(s)` : d >= 60 ? `${Math.floor(d / 60)}h` : `${d} min`;
                          })()}
                          </strong>
                        </span>
                      </div>
                    ))}
                    <div className="flex items-center gap-2 text-xs">
                      <MessageCircle className="w-3.5 h-3.5 text-[#25d366]" />
                      <span className="text-slate-600">
                        Enviar: <strong>{nodes.filter(n => n.type === 'message').length} mensagem(ns)</strong>
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-3 p-6 overflow-auto">
              <div className="flex items-center gap-2 mb-5">
                <Workflow className="w-5 h-5 text-[#2e6299]" />
                <h4 className="font-bold text-[#2e6299] text-sm">Fluxo de Automacao</h4>
              </div>

              <div className="max-w-md mx-auto space-y-0">
                {(() => {
                  const triggerNode = nodes.find(n => n.type === 'trigger');
                  const triggerIdx = nodes.indexOf(triggerNode);
                  return (
                    <VisualNode
                      key={triggerNode.id}
                      type={triggerNode.type}
                      data={triggerNode.data}
                      index={0}
                      isLast={nodes.length === 1}
                      onUpdate={(updates) => updateNode(triggerNode.id, updates)}
                      onRemove={() => {}}
                      canRemove={false}
                      isDraggable={false}
                      onAddAfter={nodes.length > 1 ? (type) => addNode(type, triggerIdx) : null}
                    />
                  );
                })()}
                <Reorder.Group axis="y" values={draggableNodes} onReorder={handleReorder} className="space-y-0">
                  {draggableNodes.map((node, idx) => {
                    const globalIdx = idx + 1;
                    const isLast = globalIdx === nodes.length - 1;
                    return (
                      <Reorder.Item key={node.id} value={node} className="list-none">
                        <VisualNode
                          type={node.type}
                          data={node.data}
                          index={globalIdx}
                          isLast={isLast}
                          onUpdate={(updates) => updateNode(node.id, updates)}
                          onRemove={() => removeNode(node.id)}
                          canRemove={node.type !== 'trigger' && !(node.type === 'message' && nodes.filter(n => n.type === 'message').length === 1)}
                          isDraggable={true}
                          onAddAfter={!isLast ? (type) => addNode(type, globalIdx) : null}
                        />
                      </Reorder.Item>
                    );
                  })}
                </Reorder.Group>

                <div className="flex justify-center pt-2">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-600 text-xs font-medium">
                    <CheckCircle2 className="w-4 h-4" />
                    Fim do fluxo
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border-t border-slate-200 px-6 py-4 flex justify-between items-center flex-shrink-0">
          <div className="text-xs text-slate-400">
            {nodes.length} etapa(s) configurada(s)
          </div>
          <div className="flex gap-3">
            <Button onClick={onClose} variant="outline" className="rounded-xl">Cancelar</Button>
            <Button
              onClick={handleSave}
              disabled={saving || !form.name || !nodes.some(n => n.type === 'message' && n.data.message_template)}
              className="rounded-xl bg-[#25d366] hover:bg-[#128c7e] text-white shadow-lg shadow-emerald-500/20"
            >
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
              {flow ? 'Salvar Alteracoes' : 'Criar Fluxo'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TestModal({ flow, onClose, onSend, sending }) {
  const [phone, setPhone] = useState('');
  const [testState, setTestState] = useState(null);
  const [testId, setTestId] = useState(null);

  const flowNodes = flow.metadata?.flow_nodes || [];
  const messages = flowNodes.filter(n => n.type === 'message');
  const delays = flowNodes.filter(n => n.type === 'delay');
  const hasMultipleSteps = flowNodes.length > 1;

  useEffect(() => {
    if (!testId) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/whatsapp/test/${testId}`);
        const data = await res.json();
        if (data.ok) {
          setTestState(data);
          if (data.status === 'completed' || data.status === 'error' || data.status === 'not_found') {
            clearInterval(interval);
          }
        }
      } catch {}
    }, 2000);
    return () => clearInterval(interval);
  }, [testId]);

  const handleSend = async () => {
    const result = await onSend(phone, flow);
    if (result?.testId) {
      setTestId(result.testId);
      setTestState({ status: 'running', sent: 0, total: result.total, currentStep: 'Iniciando fluxo...', schedule: [] });
    }
  };

  const getStepIcon = (status) => {
    if (status === 'sent') return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
    if (status === 'sending' || status === 'delaying') return <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" />;
    if (status === 'error') return <AlertCircle className="w-3.5 h-3.5 text-red-500" />;
    return <Clock className="w-3.5 h-3.5 text-slate-300" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
            <Phone className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Enviar Teste</h3>
            <p className="text-xs text-slate-400">{flow.name}</p>
          </div>
        </div>
        <div className="p-6 space-y-4">
          {!testState ? (
            <>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Numero (com DDD)</label>
                <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(51) 99999-9999" className="h-10 rounded-xl" />
              </div>

              {hasMultipleSteps && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                  <p className="text-xs font-semibold text-blue-700 mb-2">Cronograma do fluxo:</p>
                  <div className="space-y-1.5">
                    {flowNodes.map((node, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-blue-600">
                        {node.type === 'delay' ? (
                          <><Timer className="w-3.5 h-3.5 text-amber-500" /><span>Pausa de {node.data.delay_minutes} min</span></>
                        ) : (
                          <><MessageCircle className="w-3.5 h-3.5 text-emerald-500" /><span className="truncate">Mensagem: {(node.data.message_template || '').substring(0, 40)}...</span></>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!hasMultipleSteps && (
                <div className="bg-[#e5ddd5] rounded-xl p-3 max-h-48 overflow-auto">
                  <div className="bg-[#dcf8c6] rounded-lg p-3 shadow-sm text-xs whitespace-pre-wrap text-slate-700 leading-relaxed">
                    {flow.message_template}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                {testState.status === 'completed' ? (
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  </div>
                ) : testState.status === 'error' ? (
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    {testState.status === 'completed' ? 'Fluxo concluido!' : testState.status === 'error' ? 'Erro no fluxo' : 'Executando fluxo...'}
                  </p>
                  <p className="text-xs text-slate-500">{testState.currentStep}</p>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-600">Progresso</span>
                  <span className="text-xs text-slate-500">{testState.sent}/{testState.total} enviada(s)</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${testState.total > 0 ? (testState.sent / testState.total) * 100 : 0}%` }} />
                </div>
              </div>

              {testState.schedule?.length > 0 && (
                <div className="space-y-1.5">
                  {testState.schedule.map((step, i) => (
                    <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${step.status === 'sent' ? 'bg-emerald-50' : step.status === 'sending' || step.status === 'delaying' ? 'bg-blue-50' : step.status === 'error' ? 'bg-red-50' : 'bg-slate-50'}`}>
                      {getStepIcon(step.status)}
                      <span className="font-medium text-slate-700">Mensagem {step.step}</span>
                      {step.delay > 0 && <span className="text-slate-400 ml-auto">(+{step.delay}min)</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
          <Button onClick={onClose} variant="outline" className="rounded-xl">
            {testState ? 'Fechar' : 'Cancelar'}
          </Button>
          {!testState && (
            <Button onClick={handleSend} disabled={!phone || sending} className="rounded-xl bg-[#25d366] hover:bg-[#128c7e] text-white">
              {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              Iniciar Teste
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function LogsModal({ flow, onClose }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/whatsapp/logs?flow_id=${flow.id}&limit=30`)
      .then(r => r.json())
      .then(d => { setLogs(d.data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [flow.id]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
              <History className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <h3 className="font-bold text-slate-800">Logs de Envio</h3>
              <p className="text-xs text-slate-400">{flow.name} - {logs.length} registro(s)</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 text-slate-400 animate-spin" /></div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-sm text-slate-400">Nenhum envio registrado</div>
          ) : (
            <div className="space-y-2">
              {logs.map(log => (
                <div key={log.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${log.status === 'sent' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-700 truncate">{log.phone}</p>
                    <p className="text-[10px] text-slate-400 truncate">{log.message?.substring(0, 80)}...</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={`text-[10px] font-semibold ${log.status === 'sent' ? 'text-emerald-600' : 'text-red-500'}`}>
                      {log.status === 'sent' ? 'Enviado' : 'Erro'}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {log.created_at ? format(new Date(log.created_at), 'dd/MM HH:mm', { locale: ptBR }) : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DeleteConfirmModal({ flow, onConfirm, onClose, deleting }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6" onClick={e => e.stopPropagation()}>
        <div className="text-center">
          <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 className="w-7 h-7 text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">Excluir Fluxo</h3>
          <p className="text-sm text-slate-500 mb-4">Tem certeza que deseja excluir <strong>{flow.name}</strong>? Esta acao nao pode ser desfeita.</p>
          <div className="flex gap-3">
            <Button onClick={onClose} variant="outline" className="flex-1 rounded-xl" disabled={deleting}>Cancelar</Button>
            <Button onClick={onConfirm} className="flex-1 rounded-xl bg-red-500 hover:bg-red-600 text-white" disabled={deleting}>
              {deleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Excluir
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WhatsAppFlows() {
  const [flows, setFlows] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editorFlow, setEditorFlow] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [testFlow, setTestFlow] = useState(null);
  const [logsFlow, setLogsFlow] = useState(null);
  const [deleteFlow, setDeleteFlow] = useState(null);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEvent, setFilterEvent] = useState('all');
  const [toast, setToast] = useState(null);
  const [showConfig, setShowConfig] = useState(false);
  const [whaConfig, setWhaConfig] = useState({ api_url: '', access_token: '' });
  const [savingConfig, setSavingConfig] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchWhatsAppConfig = async () => {
    try {
      const r = await fetch('/api/whatsapp/config');
      const d = await r.json();
      if (d.ok) setWhaConfig(d.data);
    } catch {}
  };

  const handleSaveConfig = async () => {
    setSavingConfig(true);
    try {
      const r = await fetch('/api/whatsapp/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(whaConfig)
      });
      const d = await r.json();
      if (d.ok) {
        showToast('Configuração salva!');
        setShowConfig(false);
        fetchWhatsAppConfig();
      } else {
        showToast(d.error || 'Erro ao salvar', 'error');
      }
    } catch {
      showToast('Erro ao salvar configuração', 'error');
    } finally {
      setSavingConfig(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [fRes, sRes] = await Promise.all([
        fetch('/api/whatsapp/flows'),
        fetch('/api/whatsapp/stats'),
      ]);
      const fData = await fRes.json();
      const sData = await sRes.json();
      setFlows(fData.ok ? fData.data : []);
      setStats(sData.ok ? sData.data : null);
    } catch (err) {
      showToast('Erro ao carregar dados', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); fetchWhatsAppConfig(); }, []);

  const filtered = useMemo(() => {
    return flows.filter(f => {
      if (searchTerm) {
        const s = searchTerm.toLowerCase();
        if (!f.name.toLowerCase().includes(s) && !f.description?.toLowerCase().includes(s)) return false;
      }
      if (filterEvent !== 'all' && f.trigger_event !== filterEvent) return false;
      return true;
    });
  }, [flows, searchTerm, filterEvent]);

  const handleSave = async (formData) => {
    setSaving(true);
    try {
      const isEdit = !!editorFlow?.id;
      const url = isEdit ? `/api/whatsapp/flows/${editorFlow.id}` : '/api/whatsapp/flows';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
      const data = await res.json();
      if (data.ok) {
        showToast(isEdit ? 'Fluxo atualizado!' : 'Fluxo criado!');
        setShowEditor(false);
        setEditorFlow(null);
        fetchData();
      } else {
        showToast(data.error || 'Erro ao salvar', 'error');
      }
    } catch {
      showToast('Erro ao salvar', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (flow) => {
    try {
      const res = await fetch(`/api/whatsapp/flows/${flow.id}/toggle`, { method: 'PATCH' });
      const data = await res.json();
      if (data.ok) {
        setFlows(fs => fs.map(f => f.id === flow.id ? { ...f, enabled: !f.enabled } : f));
        showToast(data.data.enabled ? 'Fluxo ativado!' : 'Fluxo desativado!');
      }
    } catch {
      showToast('Erro ao alternar', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deleteFlow) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/whatsapp/flows/${deleteFlow.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.ok) {
        showToast('Fluxo excluido!');
        setDeleteFlow(null);
        fetchData();
      } else {
        showToast(data.error || 'Erro', 'error');
      }
    } catch {
      showToast('Erro ao excluir', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleTest = async (phone, flow) => {
    setSending(true);
    try {
      const res = await fetch('/api/whatsapp/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, flow_id: flow.id })
      });
      const data = await res.json();
      if (data.ok) {
        if (data.testId) {
          showToast(data.message || 'Fluxo de teste iniciado!');
          return data;
        } else {
          showToast('Mensagem de teste enviada!');
          setTestFlow(null);
          return null;
        }
      } else {
        showToast(data.error || 'Erro ao enviar', 'error');
        return null;
      }
    } catch {
      showToast('Erro ao enviar teste', 'error');
      return null;
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <PageHeader title="Automacoes WhatsApp" description="Gerencie fluxos de envio automatico" icon={MessageCircle} />
        </div>
        <Button onClick={() => setShowConfig(!showConfig)} variant="outline" className="rounded-xl border-slate-300">
          <Settings2 className="w-4 h-4 mr-2" />
          Configurar API
        </Button>
        <Button onClick={() => { setEditorFlow(null); setShowEditor(true); }} className="rounded-xl bg-[#25d366] hover:bg-[#128c7e] text-white shadow-lg shadow-[#25d366]/20">
          <Plus className="w-4 h-4 mr-2" />
          Novo Fluxo
        </Button>
      </div>

      <AnimatePresence>
        {showConfig && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <Settings2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Configuração da API WhatsApp</h3>
                  <p className="text-xs text-slate-500">Token e URL da API WESCCTECH para envio de mensagens</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">URL da API</label>
                  <Input
                    value={whaConfig.api_url}
                    onChange={e => setWhaConfig(prev => ({ ...prev, api_url: e.target.value }))}
                    placeholder="https://api.wescctech.com.br/..."
                    className="h-10 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Access Token</label>
                  <Input
                    value={whaConfig.access_token}
                    onChange={e => setWhaConfig(prev => ({ ...prev, access_token: e.target.value }))}
                    placeholder="Token de acesso da API"
                    className="h-10 rounded-xl text-sm font-mono"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setShowConfig(false)} className="rounded-xl text-sm h-9">
                  Cancelar
                </Button>
                <Button onClick={handleSaveConfig} disabled={savingConfig} className="rounded-xl text-sm h-9 bg-[#25d366] hover:bg-[#128c7e] text-white">
                  {savingConfig ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                  Salvar
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Fluxos Ativos', value: stats.flows?.active || 0, total: stats.flows?.total || 0, IconComp: Zap, color: '#25d366', bg: 'bg-emerald-50' },
            { label: 'Total Enviados', value: stats.messages?.total_sent || 0, IconComp: Send, color: '#2e6299', bg: 'bg-blue-50' },
            { label: 'Ultimas 24h', value: stats.messages?.last_24h || 0, IconComp: Clock, color: '#f59e0b', bg: 'bg-amber-50' },
            { label: 'Erros', value: stats.messages?.errors || 0, IconComp: AlertCircle, color: '#ef4444', bg: 'bg-red-50' },
          ].map((s, idx) => {
            const StatIcon = s.IconComp;
            return (
              <div key={idx} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}>
                    <StatIcon className="w-5 h-5" style={{ color: s.color }} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">{s.label}</p>
                    <p className="text-xl font-bold text-slate-800">{s.value}</p>
                    {s.total !== undefined && <p className="text-[10px] text-slate-400">{s.total} total</p>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar fluxos..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 h-10 rounded-xl"
            />
          </div>
          <select
            value={filterEvent}
            onChange={e => setFilterEvent(e.target.value)}
            className="h-10 rounded-xl border border-slate-200 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2e6299]/20"
          >
            <option value="all">Todos os eventos</option>
            {TRIGGER_EVENTS.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
          <Loader2 className="w-8 h-8 text-[#25d366] mx-auto animate-spin" />
          <p className="text-slate-500 mt-3">Carregando fluxos...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="w-8 h-8 text-emerald-300" />
          </div>
          <h3 className="font-semibold text-slate-700 mb-1">Nenhum fluxo encontrado</h3>
          <p className="text-sm text-slate-400">Crie seu primeiro fluxo de automacao</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {filtered.map(flow => (
              <FlowCard
                key={flow.id}
                flow={flow}
                onEdit={(f) => { setEditorFlow(f); setShowEditor(true); }}
                onToggle={handleToggle}
                onDelete={setDeleteFlow}
                onTest={setTestFlow}
                onViewLogs={setLogsFlow}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-6 right-6 z-[60] px-5 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 ${toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-[#25d366] text-white'}`}
          >
            {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {showEditor && (
        <VisualFlowBuilder
          flow={editorFlow}
          onSave={handleSave}
          onClose={() => { setShowEditor(false); setEditorFlow(null); }}
          saving={saving}
        />
      )}

      {testFlow && (
        <TestModal
          flow={testFlow}
          onClose={() => setTestFlow(null)}
          onSend={handleTest}
          sending={sending}
        />
      )}

      {logsFlow && (
        <LogsModal flow={logsFlow} onClose={() => setLogsFlow(null)} />
      )}

      {deleteFlow && (
        <DeleteConfirmModal
          flow={deleteFlow}
          onConfirm={handleDelete}
          onClose={() => setDeleteFlow(null)}
          deleting={deleting}
        />
      )}
    </div>
  );
}
