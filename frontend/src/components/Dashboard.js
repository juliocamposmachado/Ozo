import React from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';

const Dashboard = () => {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();

  return (
    <Container maxWidth="lg">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center'
        }}
      >
        <Typography variant="h3" color="primary" gutterBottom>
          Bem-vindo ao Ozo! 🚀
        </Typography>
        
        <Typography variant="h6" color="textSecondary" gutterBottom>
          Olá, {user?.name}!
        </Typography>

        <Typography variant="body1" sx={{ mb: 4, maxWidth: 600 }}>
          Seu WhatsApp Clone está funcionando! Esta é a página principal onde 
          aparecerão suas conversas, grupos e todas as funcionalidades do aplicativo.
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Button
            variant="outlined"
            onClick={toggleTheme}
            sx={{ minWidth: 120 }}
          >
            Tema: {theme === 'light' ? '☀️ Claro' : '🌙 Escuro'}
          </Button>
          
          <Button
            variant="contained"
            color="secondary"
            onClick={logout}
            sx={{ minWidth: 120 }}
          >
            Sair
          </Button>
        </Box>

        <Box sx={{ mt: 4, p: 3, bgcolor: 'background.paper', borderRadius: 2, maxWidth: 800 }}>
          <Typography variant="h6" gutterBottom>
            🎉 Funcionalidades implementadas:
          </Typography>
          
          <Box component="ul" sx={{ textAlign: 'left', mt: 2 }}>
            <li>✅ Autenticação com JWT + Verificação SMS/Email</li>
            <li>✅ Temas claro/escuro</li>
            <li>✅ Interface responsiva</li>
            <li>✅ Backend completo com Socket.IO</li>
            <li>✅ MongoDB + Mongoose</li>
            <li>✅ API RESTful completa</li>
            <li>✅ PWA (Progressive Web App)</li>
            <li>✅ Deploy otimizado para Vercel</li>
          </Box>

          <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
            📱 Em breve: Chat em tempo real, grupos, chamadas, mídia e muito mais!
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default Dashboard;
