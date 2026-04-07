import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const USERS_STORAGE_KEY = 'unyco_platform_users';
const AUTH_STORAGE_KEY = 'unyco_auth_user';

const DEFAULT_ADMIN = {
  id: '1',
  name: 'Administrador',
  email: 'admin@unyco.com',
  password: 'admin123',
  role: 'admin',
  permissions: ['dashboard', 'cadastros', 'planos', 'sync', 'search_totvs', 'usuarios', 'pagamentos', 'whatsapp'],
  active: true,
  createdAt: new Date().toISOString()
};

const ROLES = {
  admin: {
    name: 'Administrador',
    permissions: ['dashboard', 'cadastros', 'planos', 'sync', 'search_totvs', 'usuarios', 'pagamentos', 'whatsapp']
  },
  manager: {
    name: 'Gerente',
    permissions: ['dashboard', 'cadastros', 'planos', 'sync', 'search_totvs', 'pagamentos', 'whatsapp']
  },
  operator: {
    name: 'Operador',
    permissions: ['dashboard', 'cadastros']
  },
  viewer: {
    name: 'Visualizador',
    permissions: ['dashboard']
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);
    if (storedUsers) {
      setUsers(JSON.parse(storedUsers));
    } else {
      const initialUsers = [DEFAULT_ADMIN];
      setUsers(initialUsers);
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(initialUsers));
    }

    const storedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
    if (storedAuth) {
      setUser(JSON.parse(storedAuth));
    }
    
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (users.length > 0) {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    }
  }, [users]);

  const login = (email, password) => {
    const foundUser = users.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.password === password && u.active
    );
    
    if (foundUser) {
      const userSession = { ...foundUser };
      delete userSession.password;
      setUser(userSession);
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userSession));
      return { success: true };
    }
    
    return { success: false, error: 'E-mail ou senha inválidos' };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  const hasPermission = (permission) => {
    if (!user) return false;
    return user.permissions?.includes(permission) || user.role === 'admin';
  };

  const createUser = (userData) => {
    const exists = users.some(u => u.email.toLowerCase() === userData.email.toLowerCase());
    if (exists) {
      return { success: false, error: 'E-mail já cadastrado' };
    }

    const rolePermissions = ROLES[userData.role]?.permissions || [];
    
    const newUser = {
      id: Date.now().toString(),
      name: userData.name,
      email: userData.email,
      password: userData.password,
      role: userData.role,
      permissions: userData.permissions || rolePermissions,
      active: true,
      createdAt: new Date().toISOString()
    };

    setUsers(prev => [...prev, newUser]);
    return { success: true, user: newUser };
  };

  const updateUser = (userId, userData) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const updated = { ...u, ...userData };
        if (userData.role && userData.role !== u.role) {
          updated.permissions = ROLES[userData.role]?.permissions || u.permissions;
        }
        return updated;
      }
      return u;
    }));
    return { success: true };
  };

  const deleteUser = (userId) => {
    if (userId === '1') {
      return { success: false, error: 'Não é possível excluir o administrador principal' };
    }
    setUsers(prev => prev.filter(u => u.id !== userId));
    return { success: true };
  };

  const toggleUserStatus = (userId) => {
    if (userId === '1') {
      return { success: false, error: 'Não é possível desativar o administrador principal' };
    }
    setUsers(prev => prev.map(u => 
      u.id === userId ? { ...u, active: !u.active } : u
    ));
    return { success: true };
  };

  return (
    <AuthContext.Provider value={{
      user,
      users,
      isLoading,
      isAuthenticated: !!user,
      login,
      logout,
      hasPermission,
      createUser,
      updateUser,
      deleteUser,
      toggleUserStatus,
      roles: ROLES
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
