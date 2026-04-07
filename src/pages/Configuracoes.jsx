import React, { useState, useEffect, useCallback } from 'react';
import { Settings, CreditCard, Loader2, RefreshCw, Save, Hotel, Sparkles, Crown, Gem, CheckCircle2, AlertTriangle, Sun, Snowflake, Calendar } from 'lucide-react';
import { useSystemConfig, useUpdateConfig } from '@/hooks/useSystemConfig';
import { Toaster, toast } from 'sonner';

function formatCurrency(value) {
  return (value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const CATEGORY_ICONS = {
  'Silver': Sparkles,
  'Gold': Crown,
  'Diamante': Gem,
};

const CATEGORY_COLORS = {
  'Silver': { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200', accent: 'from-slate-400 to-slate-500' },
  'Gold': { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', accent: 'from-amber-400 to-amber-500' },
  'Diamante': { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', accent: 'from-blue-400 to-indigo-500' },
};

const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function SeasonConfigSection() {
  const [months, setMonths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch('/api/season-config')
      .then(r => r.json())
      .then(data => {
        if (data.ok) setMonths(data.data.high_season_months || []);
      })
      .catch(() => toast.error('Erro ao carregar temporada'))
      .finally(() => setLoading(false));
  }, []);

  const toggleMonth = (m) => {
    setMonths(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m].sort((a, b) => a - b));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/season-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ high_season_months: months }),
      });
      const data = await res.json();
      if (data.ok) toast.success('Meses de alta temporada atualizados');
      else toast.error(data.error || 'Erro ao salvar');
    } catch {
      toast.error('Erro de conexão');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="px-6 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-orange-500" />
          <h2 className="text-lg font-semibold text-slate-700">Configuração de Temporada</h2>
        </div>
        <p className="text-sm text-slate-500 mt-0.5">
          Selecione os meses que são considerados <strong>alta temporada</strong>. Os demais serão baixa temporada.
        </p>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-2 mb-4">
          {MONTH_NAMES.map((name, i) => {
            const monthNum = i + 1;
            const isHigh = months.includes(monthNum);
            return (
              <button
                key={monthNum}
                onClick={() => toggleMonth(monthNum)}
                className={`flex flex-col items-center gap-1 px-3 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                  isHigh
                    ? 'border-orange-400 bg-orange-50 text-orange-700 shadow-sm shadow-orange-200'
                    : 'border-slate-200 bg-slate-50 text-slate-500 hover:border-slate-300'
                }`}
              >
                {isHigh ? <Sun className="w-4 h-4 text-orange-500" /> : <Snowflake className="w-4 h-4 text-blue-400" />}
                {name}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1"><Sun className="w-3.5 h-3.5 text-orange-500" /> Alta temporada: {months.length} mês(es)</span>
            <span className="flex items-center gap-1"><Snowflake className="w-3.5 h-3.5 text-blue-400" /> Baixa temporada: {12 - months.length} mês(es)</span>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-300 text-white font-semibold rounded-lg text-sm transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Salvando...' : 'Salvar Temporada'}
          </button>
        </div>
      </div>
    </div>
  );
}

function CategoryRatesSection() {
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [saving, setSaving] = useState(null);
  const [editValues, setEditValues] = useState({});

  const fetchRates = useCallback(async () => {
    try {
      const res = await fetch('/api/category-rates');
      const data = await res.json();
      if (data.ok) {
        setRates(data.data);
        const vals = {};
        data.data.forEach(r => {
          vals[`${r.category_id}_low`] = String(r.low_season_rate || '');
          vals[`${r.category_id}_high`] = String(r.high_season_rate || '');
          if (r.category_name === 'Diamante') {
            vals[`${r.category_id}_diamante`] = String(r.low_season_rate || '');
          }
        });
        setEditValues(vals);
      }
    } catch (e) {
      toast.error('Erro ao carregar categorias');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRates(); }, [fetchRates]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch('/api/category-rates/sync', { method: 'POST' });
      const data = await res.json();
      if (data.ok) {
        setRates(data.data);
        const vals = {};
        data.data.forEach(r => {
          vals[`${r.category_id}_low`] = String(r.low_season_rate || '');
          vals[`${r.category_id}_high`] = String(r.high_season_rate || '');
          if (r.category_name === 'Diamante') {
            vals[`${r.category_id}_diamante`] = String(r.low_season_rate || '');
          }
        });
        setEditValues(vals);
        toast.success('Categorias sincronizadas com a API');
      } else {
        toast.error(data.error || 'Erro ao sincronizar');
      }
    } catch {
      toast.error('Erro de conexão ao sincronizar');
    } finally {
      setSyncing(false);
    }
  };

  const handleSave = async (categoryId) => {
    const lowVal = parseFloat(editValues[`${categoryId}_low`]?.replace(',', '.') || '0');
    const highVal = parseFloat(editValues[`${categoryId}_high`]?.replace(',', '.') || '0');
    if (isNaN(lowVal) || lowVal < 0 || isNaN(highVal) || highVal < 0) {
      toast.error('Valor inválido');
      return;
    }
    setSaving(categoryId);
    try {
      const res = await fetch(`/api/category-rates/${categoryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ low_season_rate: lowVal, high_season_rate: highVal }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success('Valores atualizados com sucesso');
        fetchRates();
      } else {
        toast.error(data.error || 'Erro ao salvar');
      }
    } catch {
      toast.error('Erro de conexão');
    } finally {
      setSaving(null);
    }
  };

  const handleSaveDiamante = async (categoryId) => {
    const val = parseFloat(editValues[`${categoryId}_diamante`]?.replace(',', '.') || '0');
    if (isNaN(val) || val < 0) {
      toast.error('Valor inválido');
      return;
    }
    setSaving(categoryId);
    try {
      const res = await fetch(`/api/category-rates/${categoryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ low_season_rate: val, high_season_rate: val }),
      });
      const data = await res.json();
      if (data.ok) {
        toast.success('Valor Diamante atualizado com sucesso');
        fetchRates();
      } else {
        toast.error(data.error || 'Erro ao salvar');
      }
    } catch {
      toast.error('Erro de conexão');
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Hotel className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-slate-700">Valor da Diária por Categoria</h2>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">
            Defina os valores de diária para alta e baixa temporada em cada categoria.
          </p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Sincronizando...' : 'Sincronizar Categorias'}
        </button>
      </div>

      <div className="p-6">
        {rates.length === 0 ? (
          <div className="text-center py-8">
            <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-3" />
            <p className="text-sm text-slate-600 font-medium">Nenhuma categoria encontrada</p>
            <p className="text-xs text-slate-400 mt-1">Clique em "Sincronizar Categorias" para buscar da API</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {rates.map(rate => {
              const isDiamante = rate.category_name === 'Diamante';
              const colors = CATEGORY_COLORS[rate.category_name] || CATEGORY_COLORS['Silver'];
              const Icon = CATEGORY_ICONS[rate.category_name] || Sparkles;
              const hasLow = rate.low_season_rate > 0;
              const hasHigh = rate.high_season_rate > 0;

              return (
                <div key={rate.category_id} className={`rounded-xl border ${colors.border} overflow-hidden transition-all hover:shadow-md`}>
                  <div className={`bg-gradient-to-r ${colors.accent} px-4 py-3 flex items-center gap-3`}>
                    <div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">{rate.category_name}</h3>
                      <p className="text-[10px] text-white/70 uppercase tracking-wider">Categoria {rate.category_id}</p>
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    {isDiamante ? (
                      <>
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-2.5 text-center mb-2">
                          <p className="text-[10px] text-blue-600 font-medium">Valor único — sem distinção de temporada</p>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                            <Gem className="w-3 h-3 text-blue-500" /> Valor Diária (R$)
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-medium">R$</span>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={editValues[`${rate.category_id}_diamante`] || ''}
                              onChange={(e) => setEditValues(prev => ({ ...prev, [`${rate.category_id}_diamante`]: e.target.value }))}
                              placeholder="0,00"
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                            />
                          </div>
                          {rate.low_season_rate > 0 && (
                            <p className="flex items-center gap-1 text-[10px] text-emerald-600 mt-1">
                              <CheckCircle2 className="w-3 h-3" /> R$ {formatCurrency(rate.low_season_rate)}/noite
                            </p>
                          )}
                        </div>
                        <button
                          onClick={() => handleSaveDiamante(rate.category_id)}
                          disabled={saving === rate.category_id}
                          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-300 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
                        >
                          {saving === rate.category_id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4" />
                          )}
                          {saving === rate.category_id ? 'Salvando...' : 'Salvar'}
                        </button>
                      </>
                    ) : (
                      <>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                            <Snowflake className="w-3 h-3 text-blue-400" /> Baixa Temporada (R$)
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-medium">R$</span>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={editValues[`${rate.category_id}_low`] || ''}
                              onChange={(e) => setEditValues(prev => ({ ...prev, [`${rate.category_id}_low`]: e.target.value }))}
                              placeholder="0,00"
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                            />
                          </div>
                          {hasLow && (
                            <p className="flex items-center gap-1 text-[10px] text-emerald-600 mt-1">
                              <CheckCircle2 className="w-3 h-3" /> R$ {formatCurrency(rate.low_season_rate)}/noite
                            </p>
                          )}
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                            <Sun className="w-3 h-3 text-orange-500" /> Alta Temporada (R$)
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-medium">R$</span>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={editValues[`${rate.category_id}_high`] || ''}
                              onChange={(e) => setEditValues(prev => ({ ...prev, [`${rate.category_id}_high`]: e.target.value }))}
                              placeholder="0,00"
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all"
                            />
                          </div>
                          {hasHigh && (
                            <p className="flex items-center gap-1 text-[10px] text-emerald-600 mt-1">
                              <CheckCircle2 className="w-3 h-3" /> R$ {formatCurrency(rate.high_season_rate)}/noite
                            </p>
                          )}
                        </div>

                        {!hasLow && !hasHigh && (
                          <div className="flex items-center gap-1.5 text-xs text-amber-600">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>Valores não configurados</span>
                          </div>
                        )}

                        <button
                          onClick={() => handleSave(rate.category_id)}
                          disabled={saving === rate.category_id}
                          className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-300 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
                        >
                          {saving === rate.category_id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4" />
                          )}
                          {saving === rate.category_id ? 'Salvando...' : 'Salvar'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-4 bg-blue-50 border border-blue-100 rounded-lg p-3.5">
          <p className="text-xs text-blue-700 leading-relaxed">
            <strong>Como funciona:</strong> O sistema verifica automaticamente se o período da reserva cai em alta ou baixa temporada (conforme os meses configurados acima) e aplica o valor correspondente. 
            Os valores adicionais (extras/taxas) da API continuam sendo aplicados normalmente. 
            O total para o hóspede será: <strong>(Diária da temporada + Extras) × Número de noites</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Configuracoes() {
  const { config, plansEnabled, isLoading } = useSystemConfig();
  const updateConfig = useUpdateConfig();

  const handleTogglePlans = async () => {
    const newValue = !plansEnabled;
    try {
      await updateConfig.mutateAsync({ key: 'plans_enabled', value: newValue });
      toast.success(`Módulo de Planos ${newValue ? 'ativado' : 'desativado'} com sucesso`);
    } catch (err) {
      toast.error('Erro ao atualizar configuração');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="w-7 h-7 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Configurações</h1>
          <p className="text-sm text-slate-500 mt-0.5">Gerencie os módulos e funcionalidades do sistema</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-700">Módulos do Sistema</h2>
          <p className="text-sm text-slate-500 mt-0.5">Ative ou desative módulos para personalizar o sistema</p>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${plansEnabled ? 'bg-blue-100' : 'bg-slate-200'}`}>
                <CreditCard className={`w-6 h-6 ${plansEnabled ? 'text-blue-600' : 'text-slate-400'}`} />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">Gestão de Planos</h3>
                <p className="text-sm text-slate-500 mt-0.5">
                  Planos de assinatura, checkout e gestão de assinaturas no CRM e Landing Page
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    plansEnabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {plansEnabled ? 'Ativo' : 'Desativado'}
                  </span>
                  <span className="text-xs text-slate-400">
                    Afeta: Menu Planos, Cadastros, Dashboard, LP Checkout
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={handleTogglePlans}
              disabled={updateConfig.isPending}
              className="relative shrink-0"
            >
              {updateConfig.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
              ) : (
                <div className={`w-14 h-7 rounded-full transition-colors duration-200 ${plansEnabled ? 'bg-blue-600' : 'bg-slate-300'}`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 translate-y-1 ${
                    plansEnabled ? 'translate-x-8' : 'translate-x-1'
                  }`} />
                </div>
              )}
            </button>
          </div>
        </div>
      </div>

      <SeasonConfigSection />
      <CategoryRatesSection />
    </div>
  );
}
