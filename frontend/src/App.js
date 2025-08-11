import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { Toaster } from 'react-hot-toast';

// Stores
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';

// Components
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Verify from './components/auth/Verify';
import Dashboard from './components/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import LoadingSpinner from './components/common/LoadingSpinner';

// Hooks
import { useSocket } from './hooks/useSocket';

function App() {
  const { user, loading, checkAuth } = useAuthStore();
  const { theme } = useThemeStore();
  
  // Inicializar socket quando usuário estiver logado
  useSocket();

  // Verificar autenticação na inicialização
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Criar tema Material-UI baseado no tema do usuário
  const muiTheme = createTheme({
    palette: {
      mode: theme,
      primary: {
        main: '#25d366', // Verde WhatsApp
        dark: '#1ebe57',
        light: '#4ce081',
      },
      secondary: {
        main: '#128c7e', // Verde escuro WhatsApp
        dark: '#0d695d',
        light: '#41a297',
      },
      background: {
        default: theme === 'light' ? '#f5f5f5' : '#111b21',
        paper: theme === 'light' ? '#ffffff' : '#202c33',
      },
      text: {
        primary: theme === 'light' ? '#111b21' : '#e9edef',
        secondary: theme === 'light' ? '#667781' : '#8696a0',
      },
    },
    typography: {
      fontFamily: '"Segoe UI", "Helvetica Neue", Helvetica, sans-serif',
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            margin: 0,
            padding: 0,
            fontFamily: '"Segoe UI", "Helvetica Neue", Helvetica, sans-serif',
            backgroundColor: theme === 'light' ? '#f5f5f5' : '#111b21',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
          },
        },
      },
    },
  });

  if (loading) {
    return (
      <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        <Box 
          display="flex" 
          justifyContent="center" 
          alignItems="center" 
          minHeight="100vh"
          bgcolor="background.default"
        >
          <LoadingSpinner size={60} />
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <Router>
        <Box 
          minHeight="100vh" 
          bgcolor="background.default"
          color="text.primary"
        >
          <Routes>
            {/* Rotas públicas */}
            <Route 
              path="/login" 
              element={user ? <Navigate to="/" replace /> : <Login />} 
            />
            <Route 
              path="/register" 
              element={user ? <Navigate to="/" replace /> : <Register />} 
            />
            <Route 
              path="/verify" 
              element={user ? <Navigate to="/" replace /> : <Verify />} 
            />
            
            {/* Rotas protegidas */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/chat/:chatId" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Rota de fallback */}
            <Route 
              path="*" 
              element={<Navigate to={user ? "/" : "/login"} replace />} 
            />
          </Routes>
          
          {/* Toast notifications */}
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: theme === 'light' ? '#fff' : '#202c33',
                color: theme === 'light' ? '#111b21' : '#e9edef',
                border: `1px solid ${theme === 'light' ? '#e5e7eb' : '#3b4a54'}`,
              },
              success: {
                iconTheme: {
                  primary: '#25d366',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#dc2626',
                  secondary: '#fff',
                },
              },
            }}
          />
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;
