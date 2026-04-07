import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Search, 
  User, 
  Building2, 
  Mail, 
  Phone, 
  MapPin,
  Loader2,
  AlertCircle,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Alert, AlertDescription } from '@/components/ui/alert';
import PageHeader from '@/components/ui/PageHeader';

export default function SearchTotvs() {
  const [cpf, setCpf] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResult, setSearchResult] = useState(null);
  const [error, setError] = useState(null);
  const [totvsHealth, setTotvsHealth] = useState(null);

  React.useEffect(() => {
    fetch('/api/totvs/health').then(r => r.json()).then(setTotvsHealth).catch(() => {});
  }, []);
  
  const formatCPF = (value) => {
    const numbers = value.replace(/\D/g, '');
    return numbers.slice(0, 11);
  };

  const handleSearch = async () => {
    if (!cpf || cpf.length < 11) {
      setError('Digite um CPF válido com 11 dígitos');
      return;
    }

    setIsSearching(true);
    setError(null);
    setSearchResult(null);

    const cleanCpf = cpf.replace(/\D/g, '');
    
    const url = '/api/totvs/search';

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ cpf: cleanCpf })
      });

      const text = await response.text();
      

      if (!response.ok) {
        throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error('Resposta inválida do servidor TOTVS');
      }

      if (!data.success) {
        setError(data.error || 'Erro ao buscar dados no TOTVS');
        return;
      }

      const clientData = data.data;
      if (!clientData || !clientData.A1_COD) {
        setError('Cliente não encontrado no TOTVS');
        return;
      }

      setSearchResult(clientData);
    } catch (err) {
      console.error('Erro na busca TOTVS:', err);
      setError(err.message || 'Erro ao buscar dados no TOTVS');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-6">
      {totvsHealth && totvsHealth.status !== 'ok' && (
        <div className="rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <AlertCircle className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-amber-800 text-sm">API TOTVS indisponivel</p>
              <p className="text-amber-700 text-sm mt-0.5">{totvsHealth.message}</p>
              {totvsHealth.status === 'password_expired' && (
                <p className="text-amber-600 text-xs mt-2 bg-amber-100/50 rounded-lg px-3 py-1.5 inline-block">
                  Enquanto a senha nao for renovada no sistema TOTVS, as buscas e sincronizacoes nao funcionarao.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <PageHeader 
        title="Pesquisa TOTVS" 
        description="Busque clientes cadastrados no sistema TOTVS"
        icon={Search}
      />

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Search Form */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 h-fit"
        >
          <h2 className="text-lg font-bold text-[#2e6299] mb-6 pb-3 border-b border-slate-100">Buscar</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="cpf" className="text-sm font-medium text-slate-700">
                Nome, e-mail ou CPF
              </Label>
              <Input
                id="cpf"
                placeholder="Digite o CPF (apenas números)"
                value={cpf}
                onChange={(e) => setCpf(formatCPF(e.target.value))}
                className="mt-2 h-11 rounded-lg border-slate-200"
                maxLength={11}
              />
              <p className="text-xs text-slate-400 mt-2">
                {cpf.length}/11 dígitos
              </p>
            </div>
            <Button
              onClick={handleSearch}
              disabled={isSearching || cpf.length < 11}
              className="w-full h-12 bg-gradient-to-r from-[#2e6299] to-[#3a73b0] hover:from-[#2e6299]/90 hover:to-[#3a73b0]/90 text-white shadow-xl hover:shadow-2xl transition-all duration-300 rounded-xl"
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Buscando...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5 mr-2" />
                  Filtrar
                </>
              )}
            </Button>
          </div>
        </motion.div>

        {/* Right Column - Results */}
        <div className="lg:col-span-2">
          {/* Error Alert */}
          <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Alert variant="destructive" className="border-red-200 bg-red-50 rounded-xl shadow-sm">
              <AlertCircle className="h-5 w-5" />
              <AlertDescription className="text-sm font-medium">{error}</AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Result */}
      <AnimatePresence>
        {searchResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"
          >
            {/* Result Header */}
            <div className="bg-gradient-to-r from-[#2e6299] to-[#3a73b0] p-8 text-white">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <User className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">
                    {searchResult.A1_NOME}
                  </h2>
                  <p className="text-white/90 mt-1">CPF: {searchResult.A1_CGC}</p>
                  <p className="text-white/70 text-sm mt-1">Código: {searchResult.A1_COD} - Loja: {searchResult.A1_LOJA}</p>
                </div>
              </div>
            </div>

            {/* Result Details */}
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <InfoCard
                icon={Building2}
                label="Nome Reduzido"
                value={searchResult.A1_NREDUZ}
              />
              <InfoCard
                icon={Mail}
                label="Email"
                value={searchResult.A1_EMAIL}
              />
              <InfoCard
                icon={Phone}
                label="Telefone"
                value={`(${searchResult.A1_DDD}) ${searchResult.A1_TEL}`}
              />
              <InfoCard
                icon={MapPin}
                label="Endereço"
                value={`${searchResult.A1_END}, ${searchResult.A1_BAIRRO}`}
              />
              <InfoCard
                icon={MapPin}
                label="Cidade/Estado"
                value={`${searchResult.A1_MUN} - ${searchResult.A1_EST}`}
              />
              <InfoCard
                icon={FileText}
                label="CEP"
                value={searchResult.A1_CEP}
              />
              <InfoCard
                icon={User}
                label="Data de Nascimento"
                value={searchResult.A1_DTNASC ? `${searchResult.A1_DTNASC.slice(6,8)}/${searchResult.A1_DTNASC.slice(4,6)}/${searchResult.A1_DTNASC.slice(0,4)}` : '-'}
              />
              <InfoCard
                icon={FileText}
                label="Tipo de Pessoa"
                value={searchResult.A1_PFISICA === 'S' ? 'Pessoa Física' : 'Pessoa Jurídica'}
              />
            </div>

            {/* Raw Data */}
            <div className="p-8 border-t border-slate-100">
              <details className="group">
                <summary className="cursor-pointer text-sm font-medium text-slate-600 hover:text-[#2e6299] transition-colors flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Ver dados completos (JSON)
                </summary>
                <pre className="mt-4 p-6 bg-slate-50 rounded-xl overflow-auto text-xs text-slate-600 border border-slate-200">
                  {JSON.stringify(searchResult, null, 2)}
                </pre>
              </details>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

          {/* Empty State */}
          {!searchResult && !error && !isSearching && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white rounded-2xl p-20 text-center shadow-sm border border-slate-200"
            >
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#2e6299]/10 to-[#3a73b0]/10 flex items-center justify-center mx-auto">
                <Search className="w-12 h-12 text-[#2e6299]" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mt-6">Pesquise um cliente</h3>
              <p className="text-slate-500 mt-2 max-w-sm mx-auto">
                Digite o CPF do cliente para buscar seus dados no sistema TOTVS
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoCard({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-4 p-5 bg-slate-50 rounded-xl border border-slate-100 hover:bg-slate-100 transition-all">
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#2e6299]/10 to-[#3a73b0]/10 flex items-center justify-center flex-shrink-0">
        <Icon className="w-6 h-6 text-[#2e6299]" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">{label}</p>
        <p className="text-slate-900 font-semibold text-sm break-words">{value || '-'}</p>
      </div>
    </div>
  );
}