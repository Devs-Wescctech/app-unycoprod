import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe, RefreshCw, CheckCircle2, XCircle, AlertTriangle, Clock,
  ChevronDown, ChevronUp, Activity, Shield, Zap, Server,
  CreditCard, MessageCircle, MapPin, Database, ExternalLink,
  Wifi, WifiOff, Loader2, ArrowRight, TrendingUp, Lock, Unlock,
  Settings, X, Save, Eye, EyeOff
} from 'lucide-react';

const API_ICONS = {
  TOTVS: Database,
  Coobmais: Server,
  Vindi: CreditCard,
  WhatsApp: MessageCircle,
  ViaCEP: MapPin
};

const API_COLORS = {
  TOTVS: { bg: 'from-blue-500 to-blue-700', light: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', ring: 'ring-blue-500/20' },
  Coobmais: { bg: 'from-purple-500 to-purple-700', light: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', ring: 'ring-purple-500/20' },
  Vindi: { bg: 'from-emerald-500 to-emerald-700', light: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', ring: 'ring-emerald-500/20' },
  WhatsApp: { bg: 'from-green-500 to-green-700', light: 'bg-green-50', text: 'text-green-700', border: 'border-green-200', ring: 'ring-green-500/20' },
  ViaCEP: { bg: 'from-amber-500 to-amber-700', light: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', ring: 'ring-amber-500/20' }
};

const STATUS_CONFIG = {
  online: { label: 'Online', color: 'bg-emerald-500', textColor: 'text-emerald-700', bgColor: 'bg-emerald-50', icon: CheckCircle2 },
  degraded: { label: 'Degradado', color: 'bg-amber-500', textColor: 'text-amber-700', bgColor: 'bg-amber-50', icon: AlertTriangle },
  offline: { label: 'Offline', color: 'bg-red-500', textColor: 'text-red-700', bgColor: 'bg-red-50', icon: XCircle },
  error: { label: 'Erro', color: 'bg-red-500', textColor: 'text-red-700', bgColor: 'bg-red-50', icon: XCircle },
  checking: { label: 'Verificando...', color: 'bg-slate-400', textColor: 'text-slate-600', bgColor: 'bg-slate-50', icon: Loader2 },
  unknown: { label: 'Desconhecido', color: 'bg-slate-400', textColor: 'text-slate-600', bgColor: 'bg-slate-50', icon: Clock }
};

function getLatencyColor(ms) {
  if (ms < 500) return 'bg-emerald-500';
  if (ms < 1000) return 'bg-amber-500';
  if (ms < 3000) return 'bg-orange-500';
  return 'bg-red-500';
}

function getLatencyLabel(ms) {
  if (ms < 500) return 'Excelente';
  if (ms < 1000) return 'Boa';
  if (ms < 3000) return 'Lenta';
  return 'Muito Lenta';
}

function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.unknown;
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${config.bgColor} ${config.textColor}`}>
      <Icon className={`w-3.5 h-3.5 ${status === 'checking' ? 'animate-spin' : ''}`} />
      {config.label}
    </span>
  );
}

function StatsCard({ title, value, icon: Icon, color, subtitle }) {
  const colorMap = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-emerald-500 to-emerald-600',
    red: 'from-red-500 to-red-600',
    amber: 'from-amber-500 to-amber-600'
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colorMap[color]} flex items-center justify-center shadow-lg`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <span className="text-2xl font-bold text-slate-900">{value}</span>
      </div>
      <p className="text-sm font-medium text-slate-600">{title}</p>
      {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
    </motion.div>
  );
}

function ApiCard({ api, health, onTest, isTesting, onEdit }) {
  const [expanded, setExpanded] = useState(false);
  const Icon = API_ICONS[api.name] || Globe;
  const colors = API_COLORS[api.name] || API_COLORS.TOTVS;
  const status = health?.status || 'unknown';
  const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.unknown;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-lg transition-all overflow-hidden`}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors.bg} flex items-center justify-center shadow-lg`}>
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{api.name}</h3>
              <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${colors.light} ${colors.text}`}>
                {api.category}
              </span>
            </div>
          </div>
          <StatusBadge status={isTesting ? 'checking' : status} />
        </div>

        <p className="text-sm text-slate-500 mb-4 leading-relaxed">{api.description}</p>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className={`rounded-xl p-3 ${colors.light} border ${colors.border}`}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Autenticacao</p>
            <div className="flex items-center gap-1.5">
              {api.hasToken ? <Lock className="w-3.5 h-3.5 text-emerald-600" /> : <Unlock className="w-3.5 h-3.5 text-red-500" />}
              <span className="text-xs font-semibold text-slate-700">{api.authType}</span>
            </div>
          </div>
          <div className={`rounded-xl p-3 ${colors.light} border ${colors.border}`}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Latencia</p>
            {health?.latency != null ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700">{health.latency}ms</span>
                <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${getLatencyColor(health.latency)} transition-all`}
                    style={{ width: `${Math.min(100, (health.latency / 5000) * 100)}%` }}
                  />
                </div>
                <span className={`text-[10px] font-semibold ${health.latency < 1000 ? 'text-emerald-600' : health.latency < 3000 ? 'text-amber-600' : 'text-red-600'}`}>
                  {getLatencyLabel(health.latency)}
                </span>
              </div>
            ) : (
              <span className="text-xs text-slate-400">--</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <a
            href={api.baseUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-xs font-mono text-slate-500 bg-slate-50 rounded-lg px-3 py-2 truncate hover:text-slate-700 transition-colors border border-slate-100"
          >
            {api.baseUrl}
          </a>
          <a href={api.baseUrl} target="_blank" rel="noopener noreferrer" className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <ExternalLink className="w-4 h-4 text-slate-400" />
          </a>
        </div>

        {health?.message && status !== 'online' && (
          <div className={`rounded-xl p-3 mb-3 ${statusConfig.bgColor} border ${status === 'degraded' ? 'border-amber-200' : 'border-red-200'}`}>
            <p className={`text-xs font-medium ${statusConfig.textColor}`}>
              {health.message}
            </p>
          </div>
        )}

        <div className="flex items-center justify-between">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {api.endpoints?.length || 0} Endpoints
          </button>

          <div className="flex items-center gap-2">
            {health?.lastChecked && (
              <span className="text-[10px] text-slate-400">
                {new Date(health.lastChecked).toLocaleTimeString('pt-BR')}
              </span>
            )}
            <button
              onClick={() => onEdit(api)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all"
            >
              <Settings className="w-3.5 h-3.5" />
              Editar
            </button>
            <button
              onClick={() => onTest(api.name)}
              disabled={isTesting}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r ${colors.bg} hover:opacity-90 disabled:opacity-50 transition-all shadow-sm`}
            >
              {isTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
              Testar
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-5 pt-2 border-t border-slate-100">
              <div className="space-y-2">
                {api.endpoints?.map((ep, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wider ${
                      ep.method === 'GET' ? 'bg-emerald-100 text-emerald-700' :
                      ep.method === 'POST' ? 'bg-blue-100 text-blue-700' :
                      ep.method === 'PUT' ? 'bg-amber-100 text-amber-700' :
                      ep.method === 'PATCH' ? 'bg-orange-100 text-orange-700' :
                      ep.method === 'DELETE' ? 'bg-red-100 text-red-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {ep.method}
                    </span>
                    <code className="text-xs font-mono text-slate-600 flex-1">{ep.path}</code>
                    <span className="text-xs text-slate-400 hidden sm:block">{ep.description}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function CentralAPIs() {
  const [apis, setApis] = useState([]);
  const [healthData, setHealthData] = useState({});
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [testingApi, setTestingApi] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [autoRefreshCountdown, setAutoRefreshCountdown] = useState(60);
  const [editingApi, setEditingApi] = useState(null);
  const [editForm, setEditForm] = useState({ baseUrl: '', token: '', username: '', password: '' });
  const [showToken, setShowToken] = useState(false);
  const [saving, setSaving] = useState(false);
  const [apiConfig, setApiConfig] = useState({});

  const fetchApis = useCallback(async () => {
    try {
      const res = await fetch('/api/central/apis');
      const data = await res.json();
      if (data.success) setApis(data.apis);
    } catch (err) {
      console.error('Erro ao carregar APIs:', err);
    }
  }, []);

  const checkAllHealth = useCallback(async () => {
    setChecking(true);
    try {
      const res = await fetch('/api/central/health');
      const data = await res.json();
      if (data.success) {
        const mapped = {};
        data.apis.forEach(api => { mapped[api.name] = api; });
        setHealthData(mapped);
        setLastRefresh(new Date());
        setAutoRefreshCountdown(60);
      }
    } catch (err) {
      console.error('Erro ao verificar saúde das APIs:', err);
    } finally {
      setChecking(false);
      setLoading(false);
    }
  }, []);

  const testSingleApi = useCallback(async (apiName) => {
    setTestingApi(apiName);
    try {
      const res = await fetch('/api/central/health');
      const data = await res.json();
      if (data.success) {
        const result = data.apis.find(a => a.name === apiName);
        if (result) {
          setHealthData(prev => ({ ...prev, [apiName]: result }));
        }
      }
    } catch (err) {
      console.error('Erro ao testar API:', err);
    } finally {
      setTestingApi(null);
    }
  }, []);

  const fetchConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/central/config');
      const data = await res.json();
      if (data.success) setApiConfig(data.config || {});
    } catch (err) { console.error('Erro ao carregar config:', err); }
  }, []);

  const isBasicAuth = (api) => api?.authType === 'Basic Auth';

  const handleEditApi = (api) => {
    const config = apiConfig[api.name] || {};
    setEditForm({
      baseUrl: config.baseUrl || api.baseUrl || '',
      token: config.token || '',
      username: '',
      password: ''
    });
    setShowToken(false);
    setEditingApi(api);
  };

  const handleSaveConfig = async () => {
    if (!editingApi) return;
    setSaving(true);
    try {
      const payload = { baseUrl: editForm.baseUrl };
      if (isBasicAuth(editingApi)) {
        if (editForm.username && editForm.password) {
          payload.username = editForm.username;
          payload.password = editForm.password;
        }
      } else {
        if (editForm.token) payload.token = editForm.token;
      }
      const res = await fetch(`/api/central/apis/${editingApi.name}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setApiConfig(prev => ({ ...prev, [editingApi.name]: { ...prev[editingApi.name], ...editForm } }));
        setEditingApi(null);
      }
    } catch (err) { console.error('Erro ao salvar config:', err); }
    finally { setSaving(false); }
  };

  useEffect(() => {
    fetchApis();
    fetchConfig();
    checkAllHealth();
  }, [fetchApis, fetchConfig, checkAllHealth]);

  useEffect(() => {
    const interval = setInterval(() => {
      setAutoRefreshCountdown(prev => {
        if (prev <= 1) {
          checkAllHealth();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [checkAllHealth]);

  const onlineCount = Object.values(healthData).filter(h => h.status === 'online').length;
  const offlineCount = Object.values(healthData).filter(h => h.status === 'offline' || h.status === 'error').length;
  const degradedCount = Object.values(healthData).filter(h => h.status === 'degraded').length;
  const avgLatency = Object.values(healthData).length > 0
    ? Math.round(Object.values(healthData).reduce((s, h) => s + (h.latency || 0), 0) / Object.values(healthData).length)
    : 0;

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#2e6299] to-[#1a4a7a] flex items-center justify-center shadow-xl">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
        <p className="text-slate-500 font-medium">Verificando APIs...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2e6299] to-[#1a4a7a] flex items-center justify-center shadow-lg">
              <Globe className="w-5 h-5 text-white" />
            </div>
            Central de APIs
          </h1>
          <p className="text-sm text-slate-500 mt-1 ml-[52px]">
            Monitore e gerencie todas as integrações externas do sistema
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
            <Clock className="w-3.5 h-3.5" />
            <span>Atualiza em {autoRefreshCountdown}s</span>
          </div>
          <button
            onClick={checkAllHealth}
            disabled={checking}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#2e6299] to-[#1a4a7a] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-blue-500/20"
          >
            <RefreshCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
            Verificar Todas
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total de APIs" value={apis.length} icon={Globe} color="blue" subtitle="Integrações configuradas" />
        <StatsCard title="Online" value={onlineCount} icon={Wifi} color="green" subtitle={`de ${apis.length} APIs`} />
        <StatsCard title="Indisponíveis" value={offlineCount + degradedCount} icon={WifiOff} color={offlineCount > 0 ? 'red' : 'amber'} subtitle={degradedCount > 0 ? `${degradedCount} degradada(s)` : 'Nenhuma com problema'} />
        <StatsCard title="Latência Média" value={`${avgLatency}ms`} icon={Activity} color="amber" subtitle={getLatencyLabel(avgLatency)} />
      </div>

      {lastRefresh && (
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          Última verificação: {lastRefresh.toLocaleTimeString('pt-BR')} em {lastRefresh.toLocaleDateString('pt-BR')}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
        {apis.map((api, i) => (
          <motion.div key={api.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <ApiCard
              api={api}
              health={healthData[api.name]}
              onTest={testSingleApi}
              isTesting={testingApi === api.name}
              onEdit={handleEditApi}
            />
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
          <TrendingUp className="w-5 h-5 text-[#2e6299]" />
          <h2 className="text-base font-bold text-slate-900">Resumo de Conectividade</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50">
                <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">API</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Latência</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Autenticação</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Endpoints</th>
                <th className="text-left px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Mensagem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {apis.map(api => {
                const h = healthData[api.name];
                const Icon = API_ICONS[api.name] || Globe;
                const colors = API_COLORS[api.name] || API_COLORS.TOTVS;
                return (
                  <tr key={api.name} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${colors.bg} flex items-center justify-center`}>
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{api.name}</p>
                          <p className="text-[10px] text-slate-400 font-medium uppercase">{api.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={h?.status || 'unknown'} />
                    </td>
                    <td className="px-6 py-4">
                      {h?.latency != null ? (
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${getLatencyColor(h.latency)}`} />
                          <span className="text-sm font-semibold text-slate-700">{h.latency}ms</span>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">--</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        {api.hasToken ? (
                          <Shield className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                        )}
                        <span className="text-xs text-slate-600">{api.authType}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-slate-700">{api.endpoints?.length || 0}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs text-slate-500 max-w-[200px] truncate block">{h?.message || '--'}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>

      <AnimatePresence>
        {editingApi && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm"
            onClick={() => setEditingApi(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${(API_COLORS[editingApi.name] || API_COLORS.TOTVS).bg} flex items-center justify-center`}>
                    {(() => { const I = API_ICONS[editingApi.name] || Globe; return <I className="w-5 h-5 text-white" />; })()}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Editar {editingApi.name}</h3>
                    <p className="text-xs text-slate-500">{editingApi.category}</p>
                  </div>
                </div>
                <button onClick={() => setEditingApi(null)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-2 block">Base URL</label>
                  <input
                    type="text"
                    value={editForm.baseUrl}
                    onChange={(e) => setEditForm(prev => ({ ...prev, baseUrl: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                    placeholder="https://api.example.com"
                  />
                </div>

                {isBasicAuth(editingApi) ? (
                <>
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-2 block">Login (Usuário)</label>
                  <input
                    type="text"
                    value={editForm.username}
                    onChange={(e) => setEditForm(prev => ({ ...prev, username: e.target.value }))}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                    placeholder="Usuário de acesso"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-2 block">Senha</label>
                  <div className="relative">
                    <input
                      type={showToken ? 'text' : 'password'}
                      value={editForm.password}
                      onChange={(e) => setEditForm(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full px-4 py-2.5 pr-12 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                      placeholder="Senha de acesso"
                    />
                    <button
                      type="button"
                      onClick={() => setShowToken(!showToken)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      {showToken ? <EyeOff className="w-4 h-4 text-slate-400" /> : <Eye className="w-4 h-4 text-slate-400" />}
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5">Preencha login e senha para atualizar a autenticação</p>
                </div>
                </>
                ) : (
                <div>
                  <label className="text-sm font-semibold text-slate-700 mb-2 block">Token / API Key</label>
                  <div className="relative">
                    <input
                      type={showToken ? 'text' : 'password'}
                      value={editForm.token}
                      onChange={(e) => setEditForm(prev => ({ ...prev, token: e.target.value }))}
                      className="w-full px-4 py-2.5 pr-12 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                      placeholder="Insira o token ou API key..."
                    />
                    <button
                      type="button"
                      onClick={() => setShowToken(!showToken)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      {showToken ? <EyeOff className="w-4 h-4 text-slate-400" /> : <Eye className="w-4 h-4 text-slate-400" />}
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5">Deixe em branco para manter o valor atual</p>
                </div>
                )}

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <p className="text-xs text-amber-700">
                    <AlertTriangle className="w-3.5 h-3.5 inline mr-1" />
                    Alteracoes de token serao aplicadas em memoria. Para persistir entre reinicializacoes, atualize tambem as variaveis de ambiente.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50">
                <button
                  onClick={() => setEditingApi(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-600 hover:bg-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveConfig}
                  disabled={saving}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#2e6299] to-[#1a4a7a] text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-all shadow-lg"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Salvar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
