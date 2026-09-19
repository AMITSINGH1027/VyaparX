import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('vyaparx_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [business, setBusiness] = useState(() => {
    const saved = localStorage.getItem('vyaparx_business');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      const token = localStorage.getItem('vyaparx_token');
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data);
          localStorage.setItem('vyaparx_user', JSON.stringify(res.data));

          // Fetch business info
          try {
            const bizRes = await api.get('/business/current');
            setBusiness(bizRes.data);
            localStorage.setItem('vyaparx_business', JSON.stringify(bizRes.data));
          } catch (e) {
            console.log('No active business profile');
          }
        } catch (err) {
          logout();
        }
      }
      setLoading(false);
    };
    verifyAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { access_token, refresh_token, user: loggedUser, business: biz } = res.data;
    localStorage.setItem('vyaparx_token', access_token);
    localStorage.setItem('vyaparx_refresh_token', refresh_token);
    localStorage.setItem('vyaparx_user', JSON.stringify(loggedUser));
    if (biz) {
      localStorage.setItem('vyaparx_business', JSON.stringify(biz));
      setBusiness(biz);
    }
    setUser(loggedUser);
    return res.data;
  };

  const register = async (data) => {
    const res = await api.post('/auth/register', data);
    const { access_token, refresh_token, user: newUser } = res.data;
    localStorage.setItem('vyaparx_token', access_token);
    localStorage.setItem('vyaparx_refresh_token', refresh_token);
    localStorage.setItem('vyaparx_user', JSON.stringify(newUser));
    setUser(newUser);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('vyaparx_token');
    localStorage.removeItem('vyaparx_refresh_token');
    localStorage.removeItem('vyaparx_user');
    localStorage.removeItem('vyaparx_business');
    setUser(null);
    setBusiness(null);
  };

  const isOwner = user?.role === 'BUSINESS_OWNER' || user?.role === 'SUPER_ADMIN';
  const isManager = isOwner || user?.role === 'MANAGER';
  const isEmployee = isManager || user?.role === 'EMPLOYEE';

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        business,
        setBusiness,
        login,
        register,
        logout,
        loading,
        isOwner,
        isManager,
        isEmployee,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
