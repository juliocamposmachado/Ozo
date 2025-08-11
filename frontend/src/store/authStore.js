import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../config/api';
import toast from 'react-hot-toast';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      loading: false,
      verificationData: null,

      // Registrar usuário
      register: async (userData) => {
        set({ loading: true });
        try {
          const response = await api.post('/auth/register', userData);
          
          if (response.data.needsVerification) {
            set({ 
              verificationData: {
                userId: response.data.userId,
                contact: userData.email || userData.phone
              }
            });
            toast.success(response.data.message);
            return { success: true, needsVerification: true };
          }
          
          return { success: true };
        } catch (error) {
          const message = error.response?.data?.message || 'Erro ao registrar usuário';
          toast.error(message);
          return { success: false, error: message };
        } finally {
          set({ loading: false });
        }
      },

      // Verificar código
      verify: async (userId, code) => {
        set({ loading: true });
        try {
          const response = await api.post('/auth/verify', { userId, code });
          
          const { token, user } = response.data;
          
          // Armazenar token
          localStorage.setItem('token', token);
          
          set({ 
            user, 
            token, 
            verificationData: null 
          });
          
          toast.success('Conta verificada com sucesso!');
          return { success: true };
        } catch (error) {
          const message = error.response?.data?.message || 'Erro na verificação';
          toast.error(message);
          return { success: false, error: message };
        } finally {
          set({ loading: false });
        }
      },

      // Reenviar código
      resendCode: async (userId) => {
        set({ loading: true });
        try {
          await api.post('/auth/resend-code', { userId });
          toast.success('Código reenviado com sucesso!');
          return { success: true };
        } catch (error) {
          const message = error.response?.data?.message || 'Erro ao reenviar código';
          toast.error(message);
          return { success: false, error: message };
        } finally {
          set({ loading: false });
        }
      },

      // Login
      login: async (credentials) => {
        set({ loading: true });
        try {
          const response = await api.post('/auth/login', credentials);
          
          if (response.data.needsVerification) {
            set({ 
              verificationData: {
                userId: response.data.userId,
                contact: credentials.email || credentials.phone
              }
            });
            toast.error(response.data.message);
            return { success: false, needsVerification: true };
          }
          
          const { token, user } = response.data;
          
          // Armazenar token
          localStorage.setItem('token', token);
          
          set({ user, token });
          
          toast.success('Login realizado com sucesso!');
          return { success: true };
        } catch (error) {
          const message = error.response?.data?.message || 'Erro no login';
          toast.error(message);
          return { success: false, error: message };
        } finally {
          set({ loading: false });
        }
      },

      // Logout
      logout: async () => {
        try {
          await api.post('/auth/logout');
        } catch (error) {
          console.error('Erro no logout:', error);
        } finally {
          // Limpar dados locais
          localStorage.removeItem('token');
          set({ user: null, token: null });
          toast.success('Logout realizado com sucesso!');
        }
      },

      // Verificar autenticação
      checkAuth: async () => {
        const token = localStorage.getItem('token');
        
        if (!token) {
          set({ loading: false });
          return;
        }

        set({ loading: true });
        try {
          const response = await api.get('/auth/me');
          set({ 
            user: response.data.user, 
            token 
          });
        } catch (error) {
          console.error('Erro na verificação de autenticação:', error);
          localStorage.removeItem('token');
          set({ user: null, token: null });
        } finally {
          set({ loading: false });
        }
      },

      // Esqueci a senha
      forgotPassword: async (contact) => {
        set({ loading: true });
        try {
          await api.post('/auth/forgot-password', contact);
          toast.success('Código de redefinição enviado!');
          return { success: true };
        } catch (error) {
          const message = error.response?.data?.message || 'Erro ao enviar código';
          toast.error(message);
          return { success: false, error: message };
        } finally {
          set({ loading: false });
        }
      },

      // Redefinir senha
      resetPassword: async (token, newPassword) => {
        set({ loading: true });
        try {
          await api.post('/auth/reset-password', { token, newPassword });
          toast.success('Senha redefinida com sucesso!');
          return { success: true };
        } catch (error) {
          const message = error.response?.data?.message || 'Erro ao redefinir senha';
          toast.error(message);
          return { success: false, error: message };
        } finally {
          set({ loading: false });
        }
      },

      // Alterar senha
      changePassword: async (currentPassword, newPassword) => {
        set({ loading: true });
        try {
          await api.post('/auth/change-password', { 
            currentPassword, 
            newPassword 
          });
          toast.success('Senha alterada com sucesso!');
          return { success: true };
        } catch (error) {
          const message = error.response?.data?.message || 'Erro ao alterar senha';
          toast.error(message);
          return { success: false, error: message };
        } finally {
          set({ loading: false });
        }
      },

      // Atualizar dados do usuário
      updateUser: (userData) => {
        set(state => ({
          user: { ...state.user, ...userData }
        }));
      },

      // Limpar dados de verificação
      clearVerificationData: () => {
        set({ verificationData: null });
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        verificationData: state.verificationData
      })
    }
  )
);
