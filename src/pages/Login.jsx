import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Eye, 
  EyeOff, 
  Lock, 
  Mail, 
  Loader2, 
  Users,
  LayoutDashboard,
  UserPlus,
  CreditCard,
  RefreshCw,
  Search,
  FileBarChart
} from 'lucide-react';
import { toast } from 'sonner';

const features = [
  {
    icon: LayoutDashboard,
    title: 'Dashboard Analítico',
    description: 'Visualize métricas e gráficos em tempo real'
  },
  {
    icon: UserPlus,
    title: 'Gestão de Cadastros',
    description: 'Gerencie usuários e assinaturas facilmente'
  },
  {
    icon: CreditCard,
    title: 'Controle de Planos',
    description: 'Crie e gerencie planos de assinatura'
  },
  {
    icon: RefreshCw,
    title: 'Sincronização TOTVS',
    description: 'Integração automática com ERP TOTVS'
  },
  {
    icon: Search,
    title: 'Pesquisa Avançada',
    description: 'Busque clientes por CPF no TOTVS'
  },
  {
    icon: FileBarChart,
    title: 'Relatórios e Exportação',
    description: 'Exporte dados em PDF, Excel e CSV'
  }
];

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    await new Promise(r => setTimeout(r, 500));

    const result = login(email, password);
    
    if (result.success) {
      toast.success('Login realizado com sucesso!');
    } else {
      setError(result.error);
      toast.error(result.error);
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 bg-gradient-to-br from-[#1e4976] via-[#2e6299] to-[#3a73b0] p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-4">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_68feb8f95830b2b2b9c148e2/70558c4a2_Designsemnome2.png"
              alt="UNYCO"
              className="h-14 object-contain"
            />
          </div>
          <div className="flex items-center gap-3 mb-2">
            <Users className="w-8 h-8 text-white/90" />
            <span className="text-3xl font-bold text-white tracking-wider">
              CRM
            </span>
          </div>
          <p className="text-white/70 text-lg max-w-md">
            Sistema completo de gestão de relacionamento com clientes
          </p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="relative z-10 grid grid-cols-1 xl:grid-cols-2 gap-4"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 hover:bg-white/15 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                  <feature.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm">
                    {feature.title}
                  </h3>
                  <p className="text-white/60 text-xs mt-1">
                    {feature.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <div className="relative z-10">
          <p className="text-white/40 text-sm">
            UNYCO CRM v1.1.0
          </p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 xl:w-2/5 bg-white flex items-center justify-center p-8 lg:p-12">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden flex flex-col items-center mb-8">
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/user_68feb8f95830b2b2b9c148e2/70558c4a2_Designsemnome2.png"
              alt="UNYCO"
              className="h-12 object-contain mb-3"
            />
            <div className="flex items-center gap-2">
              <Users className="w-6 h-6 text-[#2e6299]" />
              <span className="text-2xl font-bold text-[#2e6299]">CRM</span>
            </div>
          </div>

          <div className="text-center lg:text-left mb-8">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              Bem-vindo de volta
            </h1>
            <p className="text-slate-500">
              Faça login para acessar o sistema
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700 font-medium">
                E-mail
              </Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="pl-12 h-12 rounded-xl border-slate-200 focus:border-[#2e6299] focus:ring-[#2e6299]"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-700 font-medium">
                Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite sua senha"
                  className="pl-12 pr-12 h-12 rounded-xl border-slate-200 focus:border-[#2e6299] focus:ring-[#2e6299]"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm text-center"
              >
                {error}
              </motion.div>
            )}

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-[#2e6299] hover:bg-[#245080] text-white rounded-xl text-base font-semibold transition-all hover:shadow-lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-200">
            <p className="text-xs text-slate-400 text-center">
              Acesso padrão: admin@unyco.com / admin123
            </p>
          </div>

          <p className="lg:hidden text-center text-slate-400 text-xs mt-6">
            UNYCO CRM v1.1.0
          </p>
        </motion.div>
      </div>
    </div>
  );
}
