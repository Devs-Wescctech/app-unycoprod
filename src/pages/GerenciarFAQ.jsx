import React, { useState, useEffect } from 'react';
import { HelpCircle, Plus, Pencil, Trash2, Eye, EyeOff, Loader2, X, Save, ChevronUp, ChevronDown, Search } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = ['Associação', 'Economia', 'Reservas', 'Praticidade', 'Plataforma', 'Pós-venda', 'Categorias', 'Valores'];

const EMPTY_FORM = { category: 'Associação', question: '', answer: '', display_order: 0, active: true };

function Modal({ item, onClose, onSaved }) {
  const [form, setForm] = useState(item || EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const isEdit = !!item?.id;

  const handleSave = async () => {
    if (!form.question.trim() || !form.answer.trim()) {
      toast.error('Pergunta e resposta são obrigatórias');
      return;
    }
    setSaving(true);
    try {
      const method = isEdit ? 'PUT' : 'POST';
      const url = isEdit ? `/api/admin/faq/${item.id}` : '/api/admin/faq';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      toast.success(isEdit ? 'Item atualizado' : 'Item criado');
      onSaved(data.data);
    } catch (err) {
      toast.error(err.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-800">{isEdit ? 'Editar Pergunta' : 'Nova Pergunta'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Categoria</label>
            <select
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Pergunta</label>
            <input
              type="text"
              value={form.question}
              onChange={e => setForm(f => ({ ...f, question: e.target.value }))}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              placeholder="Digite a pergunta..."
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Resposta</label>
            <textarea
              value={form.answer}
              onChange={e => setForm(f => ({ ...f, answer: e.target.value }))}
              rows={5}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 resize-none"
              placeholder="Digite a resposta..."
            />
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-500 mb-1">Ordem</label>
              <input
                type="number"
                value={form.display_order}
                onChange={e => setForm(f => ({ ...f, display_order: parseInt(e.target.value) || 0 }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
            </div>
            <div className="flex items-center gap-2 mt-5">
              <button
                onClick={() => setForm(f => ({ ...f, active: !f.active }))}
                className={`relative w-11 h-6 rounded-full transition-colors ${form.active ? 'bg-blue-500' : 'bg-gray-200'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.active ? 'translate-x-5' : ''}`} />
              </button>
              <span className="text-sm text-gray-600">{form.active ? 'Ativo' : 'Inativo'}</span>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancelar</button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GerenciarFAQ() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('Todas');

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/faq');
      const data = await res.json();
      if (data.ok) setItems(data.data);
    } catch {
      toast.error('Erro ao carregar FAQ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleToggleActive = async (item) => {
    try {
      const res = await fetch(`/api/admin/faq/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !item.active }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setItems(prev => prev.map(i => i.id === item.id ? data.data : i));
    } catch (err) {
      toast.error(err.message || 'Erro ao alterar status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Excluir esta pergunta?')) return;
    try {
      const res = await fetch(`/api/admin/faq/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error);
      setItems(prev => prev.filter(i => i.id !== id));
      toast.success('Pergunta excluída');
    } catch (err) {
      toast.error(err.message || 'Erro ao excluir');
    }
  };

  const handleMove = async (item, direction) => {
    const idx = items.findIndex(i => i.id === item.id);
    const swapIdx = idx + direction;
    if (swapIdx < 0 || swapIdx >= items.length) return;
    const swap = items[swapIdx];
    try {
      await Promise.all([
        fetch(`/api/admin/faq/${item.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ display_order: swap.display_order }) }),
        fetch(`/api/admin/faq/${swap.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ display_order: item.display_order }) }),
      ]);
      load();
    } catch {
      toast.error('Erro ao reordenar');
    }
  };

  const handleSaved = (saved) => {
    setItems(prev => {
      const exists = prev.find(i => i.id === saved.id);
      if (exists) return prev.map(i => i.id === saved.id ? saved : i);
      return [...prev, saved].sort((a, b) => a.display_order - b.display_order);
    });
    setModal(null);
  };

  const categories = ['Todas', ...CATEGORIES.filter(c => items.some(i => i.category === c))];

  const filtered = items.filter(item => {
    const matchCat = filterCategory === 'Todas' || item.category === filterCategory;
    const matchSearch = !search || item.question.toLowerCase().includes(search.toLowerCase()) || item.category.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const activeCount = items.filter(i => i.active).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <HelpCircle className="w-6 h-6 text-blue-600" />
            Gerenciar FAQ
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {items.length} {items.length === 1 ? 'pergunta' : 'perguntas'} cadastradas · {activeCount} {activeCount === 1 ? 'ativa' : 'ativas'}
          </p>
        </div>
        <button
          onClick={() => setModal({})}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-xl hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nova Pergunta
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar pergunta..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
            />
          </div>
          <select
            value={filterCategory}
            onChange={e => setFilterCategory(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
          >
            {categories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">Nenhuma pergunta encontrada.</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map((item, idx) => (
              <div key={item.id} className={`flex items-start gap-4 px-5 py-4 hover:bg-gray-50/50 transition-colors ${!item.active ? 'opacity-50' : ''}`}>
                <div className="flex flex-col gap-1 pt-0.5">
                  <button onClick={() => handleMove(item, -1)} disabled={idx === 0} className="text-gray-300 hover:text-gray-500 disabled:opacity-20">
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleMove(item, 1)} disabled={idx === filtered.length - 1} className="text-gray-300 hover:text-gray-500 disabled:opacity-20">
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{item.category}</span>
                    {!item.active && <span className="text-[10px] font-bold bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">Inativo</span>}
                  </div>
                  <p className="text-sm font-semibold text-gray-800 mb-0.5">{item.question}</p>
                  <p className="text-xs text-gray-500 line-clamp-2">{item.answer}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleToggleActive(item)}
                    title={item.active ? 'Desativar' : 'Ativar'}
                    className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {item.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => setModal(item)}
                    title="Editar"
                    className="p-2 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    title="Excluir"
                    className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modal !== null && (
        <Modal
          item={modal?.id ? modal : null}
          onClose={() => setModal(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}
