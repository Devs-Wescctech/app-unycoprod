import { lazy, Suspense } from 'react';
import Layout from "./Layout.jsx";
import Login from "./Login";
import LPHome from "./lp/LPHome";
import { useAuth } from '@/contexts/AuthContext';
import { useSystemConfig } from '@/hooks/useSystemConfig';
import { Route, Routes, useLocation, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const Dashboard = lazy(() => import('./Dashboard'));
const Sync = lazy(() => import('./Sync'));
const SearchTotvs = lazy(() => import('./SearchTotvs'));
const Cadastros = lazy(() => import('./Cadastros'));
const Planos = lazy(() => import('./Planos'));
const Usuarios = lazy(() => import('./Usuarios'));
const Pagamentos = lazy(() => import('./Pagamentos'));
const DashboardReservas = lazy(() => import('./DashboardReservas'));
const WhatsAppFlows = lazy(() => import('./WhatsAppFlows'));
const EmailFlows = lazy(() => import('./EmailFlows'));
const CentralAPIs = lazy(() => import('./CentralAPIs'));
const Configuracoes = lazy(() => import('./Configuracoes'));
const GerenciarFAQ = lazy(() => import('./GerenciarFAQ'));

function PageLoader() {
    return (
        <div className="flex items-center justify-center h-full min-h-[400px]">
            <Loader2 className="animate-spin h-8 w-8 text-[#2e6299]" />
        </div>
    );
}

const PAGES = {
    Dashboard, Sync, SearchTotvs, Cadastros, Planos,
    Usuarios, Pagamentos, DashboardReservas, WhatsAppFlows, EmailFlows,
    CentralAPIs, Configuracoes, GerenciarFAQ,
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

function ProtectedRoute({ children, permission, requirePlans }) {
    const { hasPermission } = useAuth();
    const { plansEnabled, isLoading } = useSystemConfig();
    
    if (permission && !hasPermission(permission)) {
        return <Navigate to="/crm" replace />;
    }

    if (requirePlans) {
        if (isLoading) {
            return <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin h-8 w-8 text-gray-400" /></div>;
        }
        if (!plansEnabled) {
            return <Navigate to="/crm" replace />;
        }
    }
    
    return children;
}

function AuthenticatedRoutes() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Suspense fallback={<PageLoader />}>
            <Routes>            
                <Route path="/" element={
                    <ProtectedRoute permission="dashboard">
                        <Dashboard />
                    </ProtectedRoute>
                } />
                
                <Route path="/Dashboard" element={
                    <ProtectedRoute permission="dashboard">
                        <Dashboard />
                    </ProtectedRoute>
                } />
                
                <Route path="/Sync" element={
                    <ProtectedRoute permission="sync">
                        <Sync />
                    </ProtectedRoute>
                } />
                
                <Route path="/SearchTotvs" element={
                    <ProtectedRoute permission="search_totvs">
                        <SearchTotvs />
                    </ProtectedRoute>
                } />
                
                <Route path="/Cadastros" element={
                    <ProtectedRoute permission="cadastros">
                        <Cadastros />
                    </ProtectedRoute>
                } />
                
                <Route path="/Planos" element={
                    <ProtectedRoute permission="planos" requirePlans>
                        <Planos />
                    </ProtectedRoute>
                } />

                <Route path="/Usuarios" element={
                    <ProtectedRoute permission="usuarios">
                        <Usuarios />
                    </ProtectedRoute>
                } />

                <Route path="/Pagamentos" element={
                    <ProtectedRoute permission="pagamentos">
                        <Pagamentos />
                    </ProtectedRoute>
                } />

                <Route path="/DashboardReservas" element={
                    <ProtectedRoute permission="pagamentos">
                        <DashboardReservas />
                    </ProtectedRoute>
                } />

                <Route path="/WhatsAppFlows" element={
                    <ProtectedRoute permission="whatsapp">
                        <WhatsAppFlows />
                    </ProtectedRoute>
                } />

                <Route path="/EmailFlows" element={
                    <ProtectedRoute permission="whatsapp">
                        <EmailFlows />
                    </ProtectedRoute>
                } />

                <Route path="/CentralAPIs" element={
                    <ProtectedRoute permission="admin">
                        <CentralAPIs />
                    </ProtectedRoute>
                } />

                <Route path="/Configuracoes" element={
                    <ProtectedRoute permission="admin">
                        <Configuracoes />
                    </ProtectedRoute>
                } />

                <Route path="/GerenciarFAQ" element={
                    <ProtectedRoute permission="admin">
                        <GerenciarFAQ />
                    </ProtectedRoute>
                } />

                <Route path="*" element={<Navigate to="/crm" replace />} />
            </Routes>
            </Suspense>
        </Layout>
    );
}

export default function Pages() {
    const { isAuthenticated, isLoading } = useAuth();
    
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <Loader2 className="w-8 h-8 text-[#2e6299] animate-spin" />
            </div>
        );
    }

    return (
        <Routes>
            <Route path="/" element={<LPHome />} />
            <Route path="/home" element={<LPHome />} />
            <Route 
                path="/crm/login" 
                element={isAuthenticated ? <Navigate to="/crm" replace /> : <Login />} 
            />
            <Route 
                path="/login" 
                element={<Navigate to="/crm/login" replace />} 
            />
            <Route 
                path="/crm/*" 
                element={isAuthenticated ? <AuthenticatedRoutes /> : <Navigate to="/crm/login" replace />} 
            />
            <Route path="/lp/home" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
