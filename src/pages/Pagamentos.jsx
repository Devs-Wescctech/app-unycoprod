import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet, CreditCard, FileText, Search, RefreshCw, Loader2,
  ExternalLink, ChevronLeft, ChevronRight, Filter, ChevronDown, ChevronUp,
  DollarSign, Clock, CheckCircle2, XCircle, AlertCircle, Eye,
  Receipt, Building2, User, Calendar, Hash, ArrowUpDown
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import PageHeader from '@/components/ui/PageHeader';
import ModernStatsCard from '@/components/ui/ModernStatsCard';
import { toast } from 'sonner';

const STATUS_MAP = {
  pending: { label: 'Pendente', color: 'amber', icon: Clock },
  waiting: { label: 'Aguardando', color: 'amber', icon: Clock },
  processing: { label: 'Processando', color: 'blue', icon: Clock },
  paid: { label: 'Pago', color: 'emerald', icon: CheckCircle2 },
  canceled: { label: 'Cancelado', color: 'red', icon: XCircle },
  cancelled: { label: 'Cancelado', color: 'red', icon: XCircle },
  review: { label: 'Em Revisao', color: 'amber', icon: AlertCircle },
  attempted: { label: 'Tentativa', color: 'amber', icon: AlertCircle },
  charge_underpaid: { label: 'Pago Parcial', color: 'emerald', icon: CheckCircle2 },
};

const METHOD_MAP = {
  credit_card: { label: 'Cartao de Credito', icon: CreditCard },
  bank_slip: { label: 'Boleto', icon: FileText },
};

function formatCurrency(value) {
  return parseFloat(value || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatCPF(cpf) {
  if (!cpf) return '';
  const clean = cpf.replace(/\D/g, '');
  if (clean.length !== 11) return cpf;
  return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

export default function Pagamentos() {
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 15, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [refreshingId, setRefreshingId] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [vindiHealth, setVindiHealth] = useState(null);

  const fetchPayments = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(pagination.limit),
        sort: sortField,
        order: sortOrder,
      });
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (methodFilter !== 'all') params.set('method', methodFilter);
      if (search.trim()) params.set('search', search.trim());

      const res = await fetch(`/api/payments?${params}`);
      const data = await res.json();

      if (data.ok) {
        setPayments(data.data);
        setPagination(data.pagination);
        setStats(data.stats);
      } else {
        setError(data.error || 'Erro ao carregar pagamentos');
      }
    } catch (err) {
      setError('Erro de conexao ao carregar pagamentos');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, methodFilter, sortField, sortOrder, pagination.limit]);

  useEffect(() => {
    fetchPayments(1);
  }, [statusFilter, methodFilter, sortField, sortOrder]);

  useEffect(() => {
    fetch('/api/vindi/payment-methods')
      .then(r => r.json())
      .then(d => setVindiHealth(d.ok ? 'ok' : 'error'))
      .catch(() => setVindiHealth('error'));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchPayments(1);
  };

  const handleRefreshStatus = async (paymentId) => {
    setRefreshingId(paymentId);
    try {
      const res = await fetch(`/api/payments/${paymentId}/refresh`, { method: 'POST' });
      const data = await res.json();
      if (data.ok) {
        toast.success(`Status atualizado: ${STATUS_MAP[data.data.status]?.label || data.data.status}`);
        fetchPayments(pagination.page);
      } else {
        toast.error(data.error || 'Erro ao atualizar status');
      }
    } catch {
      toast.error('Erro ao comunicar com a Vindi');
    } finally {
      setRefreshingId(null);
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const totalAmount = parseFloat(stats?.total_amount || 0);
  const paidAmount = parseFloat(stats?.paid_amount || 0);
  const pendingAmount = parseFloat(stats?.pending_amount || 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <PageHeader
            title="Pagamentos"
            description="Gerenciamento de faturas e integracaoo Vindi"
            icon={Wallet}
          />
        </div>
        <div className="flex items-center gap-2">
          {vindiHealth && (
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
              vindiHealth === 'ok'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              <div className={`w-2 h-2 rounded-full ${vindiHealth === 'ok' ? 'bg-emerald-500' : 'bg-red-500'}`} />
              Vindi {vindiHealth === 'ok' ? 'Conectada' : 'Offline'}
            </div>
          )}
          <Button
            onClick={() => fetchPayments(pagination.page)}
            disabled={loading}
            variant="outline"
            className="border-[#2e6299] text-[#2e6299] hover:bg-[#2e6299]/10 rounded-lg"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="border-red-200 bg-red-50 rounded-xl">
          <AlertCircle className="h-5 w-5" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <ModernStatsCard
          title="Total de Pagamentos"
          value={stats?.total || 0}
          icon={Receipt}
          color="blue"
          subtitle={`${stats?.credit_card_count || 0} cartao / ${stats?.bank_slip_count || 0} boleto`}
        />
        <ModernStatsCard
          title="Valor Total"
          value={`R$ ${formatCurrency(totalAmount)}`}
          icon={DollarSign}
          color="purple"
          subtitle="todas as faturas"
        />
        <ModernStatsCard
          title="Recebido"
          value={`R$ ${formatCurrency(paidAmount)}`}
          icon={CheckCircle2}
          color="green"
          subtitle={`${stats?.paid || 0} pago(s)`}
        />
        <ModernStatsCard
          title="Pendente"
          value={`R$ ${formatCurrency(pendingAmount)}`}
          icon={Clock}
          color="amber"
          subtitle={`${stats?.pending || 0} aguardando`}
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <button
          onClick={() => setFiltersExpanded(!filtersExpanded)}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2e6299]/10 flex items-center justify-center">
              <Filter className="w-5 h-5 text-[#2e6299]" />
            </div>
            <div className="text-left">
              <h3 className="font-bold text-[#2e6299]">Filtros</h3>
              <p className="text-xs text-slate-500">
                {statusFilter !== 'all' ? `Status: ${STATUS_MAP[statusFilter]?.label}` : 'Todos os status'}
                {methodFilter !== 'all' ? ` | Metodo: ${METHOD_MAP[methodFilter]?.label}` : ''}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-500">{pagination.total} registro(s)</span>
            {filtersExpanded ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </div>
        </button>

        <AnimatePresence>
          {filtersExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="px-6 pb-6 border-t border-slate-100">
                <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-2 block">Buscar</label>
                    <div className="relative">
                      <Input
                        placeholder="Nome, CPF, localizador, hotel..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-10 rounded-xl border-slate-200 pr-9"
                      />
                      <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-[#2e6299]">
                        <Search className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-2 block">Status</label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="waiting">Aguardando</SelectItem>
                        <SelectItem value="paid">Pago</SelectItem>
                        <SelectItem value="canceled">Cancelado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-600 mb-2 block">Metodo</label>
                    <Select value={methodFilter} onValueChange={setMethodFilter}>
                      <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="credit_card">Cartao de Credito</SelectItem>
                        <SelectItem value="bank_slip">Boleto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end gap-2">
                    <Button type="submit" className="h-10 rounded-xl bg-[#2e6299] hover:bg-[#2e6299]/90 flex-1">
                      <Search className="w-4 h-4 mr-2" /> Filtrar
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-10 rounded-xl"
                      onClick={() => { setSearch(''); setStatusFilter('all'); setMethodFilter('all'); }}
                    >
                      Limpar
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading && payments.length === 0 ? (
          <div className="p-12 text-center">
            <Loader2 className="w-10 h-10 text-[#2e6299] mx-auto animate-spin" />
            <p className="text-slate-500 mt-4">Carregando pagamentos...</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Receipt className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-base font-semibold text-slate-700">Nenhum pagamento encontrado</h3>
            <p className="text-sm text-slate-500 mt-1">Os pagamentos realizados pela Landing Page aparecerão aqui.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <SortHeader label="Data" field="created_at" current={sortField} order={sortOrder} onSort={handleSort} />
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Hospede</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Hotel / Localizador</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Metodo</th>
                    <SortHeader label="Valor" field="amount" current={sortField} order={sortOrder} onSort={handleSort} />
                    <SortHeader label="Status" field="status" current={sortField} order={sortOrder} onSort={handleSort} />
                    <th className="px-4 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Acoes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.map((payment) => {
                    const statusInfo = STATUS_MAP[payment.status] || STATUS_MAP.pending;
                    const StatusIcon = statusInfo.icon;
                    const methodInfo = METHOD_MAP[payment.payment_method] || METHOD_MAP.credit_card;
                    const MethodIcon = methodInfo.icon;

                    return (
                      <motion.tr
                        key={payment.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-slate-50/80 transition-colors group"
                      >
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div className="text-sm font-medium text-slate-700">
                            {format(new Date(payment.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                          </div>
                          <div className="text-xs text-slate-400">
                            {format(new Date(payment.created_at), 'HH:mm', { locale: ptBR })}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-[#2e6299]/10 flex items-center justify-center shrink-0">
                              <User className="w-4 h-4 text-[#2e6299]" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-700 truncate max-w-[180px]">{payment.guest_name}</p>
                              <p className="text-xs text-slate-400">{formatCPF(payment.guest_cpf)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="min-w-0">
                            <p className="text-sm text-slate-700 truncate max-w-[200px]">{payment.hotel_name || '-'}</p>
                            {payment.booking_locator && (
                              <p className="text-xs text-slate-400 font-mono">{payment.booking_locator}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-1.5">
                            <MethodIcon className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-xs font-medium text-slate-600">{methodInfo.label}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className="text-sm font-bold text-slate-800">R$ {formatCurrency(payment.amount)}</span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-${statusInfo.color}-50 text-${statusInfo.color}-700 border border-${statusInfo.color}-200`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setSelectedPayment(payment)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-[#2e6299] hover:bg-[#2e6299]/10 transition-all"
                              title="Ver detalhes"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleRefreshStatus(payment.id)}
                              disabled={refreshingId === payment.id}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all disabled:opacity-50"
                              title="Atualizar status na Vindi"
                            >
                              {refreshingId === payment.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <RefreshCw className="w-4 h-4" />
                              )}
                            </button>
                            {payment.print_url && (
                              <a
                                href={payment.print_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                                title="Abrir boleto/fatura"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {pagination.pages > 1 && (
              <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                <p className="text-sm text-slate-500">
                  Mostrando {((pagination.page - 1) * pagination.limit) + 1} a {Math.min(pagination.page * pagination.limit, pagination.total)} de {pagination.total}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page <= 1}
                    onClick={() => fetchPayments(pagination.page - 1)}
                    className="rounded-lg"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  {Array.from({ length: Math.min(pagination.pages, 5) }, (_, i) => {
                    let pageNum;
                    if (pagination.pages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.page >= pagination.pages - 2) {
                      pageNum = pagination.pages - 4 + i;
                    } else {
                      pageNum = pagination.page - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === pagination.page ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => fetchPayments(pageNum)}
                        className={`rounded-lg w-9 ${pageNum === pagination.page ? 'bg-[#2e6299]' : ''}`}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page >= pagination.pages}
                    onClick={() => fetchPayments(pagination.page + 1)}
                    className="rounded-lg"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <AnimatePresence>
        {selectedPayment && (
          <PaymentDetailModal payment={selectedPayment} onClose={() => setSelectedPayment(null)} onRefresh={() => { handleRefreshStatus(selectedPayment.id); }} refreshing={refreshingId === selectedPayment.id} />
        )}
      </AnimatePresence>
    </div>
  );
}

function SortHeader({ label, field, current, order, onSort }) {
  const isActive = current === field;
  return (
    <th
      className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer hover:text-[#2e6299] transition-colors select-none"
      onClick={() => onSort(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        <ArrowUpDown className={`w-3 h-3 ${isActive ? 'text-[#2e6299]' : 'text-slate-300'}`} />
        {isActive && (
          <span className="text-[9px] text-[#2e6299]">{order === 'asc' ? 'A-Z' : 'Z-A'}</span>
        )}
      </div>
    </th>
  );
}

function PaymentDetailModal({ payment, onClose, onRefresh, refreshing }) {
  const statusInfo = STATUS_MAP[payment.status] || STATUS_MAP.pending;
  const StatusIcon = statusInfo.icon;
  const methodInfo = METHOD_MAP[payment.payment_method] || METHOD_MAP.credit_card;
  const MethodIcon = methodInfo.icon;

  const details = [
    { icon: Hash, label: 'ID Pagamento', value: `#${payment.id}` },
    { icon: User, label: 'Hospede', value: payment.guest_name },
    { icon: FileText, label: 'CPF', value: formatCPF(payment.guest_cpf) },
    { icon: Building2, label: 'Hotel', value: payment.hotel_name || '-' },
    { icon: Hash, label: 'Localizador', value: payment.booking_locator || '-' },
    { icon: DollarSign, label: 'Valor', value: `R$ ${formatCurrency(payment.amount)}` },
    { icon: MethodIcon, label: 'Metodo', value: methodInfo.label },
    { icon: Calendar, label: 'Criado em', value: format(new Date(payment.created_at), "dd/MM/yyyy 'as' HH:mm", { locale: ptBR }) },
    { icon: Receipt, label: 'Vindi Bill ID', value: payment.vindi_bill_id ? `#${payment.vindi_bill_id}` : '-' },
    { icon: Receipt, label: 'Vindi Charge ID', value: payment.vindi_charge_id ? `#${payment.vindi_charge_id}` : '-' },
    { icon: User, label: 'Vindi Customer ID', value: payment.vindi_customer_id ? `#${payment.vindi_customer_id}` : '-' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-[#2e6299] to-[#3a73b0] px-6 py-5 flex items-center justify-between">
          <div>
            <h3 className="text-white font-bold text-lg">Detalhes do Pagamento</h3>
            <p className="text-white/60 text-xs mt-0.5">ID #{payment.id}</p>
          </div>
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white/20 text-white`}>
            <StatusIcon className="w-3.5 h-3.5" />
            {statusInfo.label}
          </span>
        </div>

        <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
          {details.map((d) => (
            <div key={d.label} className="flex items-center gap-3 py-2">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                <d.icon className="w-4 h-4 text-slate-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">{d.label}</p>
                <p className="text-sm font-semibold text-slate-700 truncate">{d.value}</p>
              </div>
            </div>
          ))}

          {payment.guest_email && (
            <div className="flex items-center gap-3 py-2">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                <AlertCircle className="w-4 h-4 text-slate-500" />
              </div>
              <div className="flex-1">
                <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">E-mail</p>
                <p className="text-sm font-semibold text-slate-700">{payment.guest_email}</p>
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between gap-3">
          <div className="flex gap-2">
            {payment.print_url && (
              <a
                href={payment.print_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-sm font-medium transition-colors"
              >
                <ExternalLink className="w-4 h-4" /> Abrir Fatura
              </a>
            )}
            <Button
              onClick={onRefresh}
              disabled={refreshing}
              variant="outline"
              className="rounded-xl"
            >
              {refreshing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              Atualizar Status
            </Button>
          </div>
          <Button onClick={onClose} variant="outline" className="rounded-xl">
            Fechar
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
