import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert
} from '@mui/material';
import { useAuthStore } from '../../store/authStore';

const Verify = () => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const { verify, resendCode, verificationData, loading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!verificationData?.userId) {
      setError('Dados de verificação não encontrados');
      return;
    }

    const result = await verify(verificationData.userId, code);
    
    if (result.success) {
      navigate('/');
    } else {
      setError(result.error || 'Código inválido');
    }
  };

  const handleResend = async () => {
    if (!verificationData?.userId) {
      setError('Dados de verificação não encontrados');
      return;
    }

    const result = await resendCode(verificationData.userId);
    if (!result.success) {
      setError(result.error || 'Erro ao reenviar código');
    }
  };

  if (!verificationData) {
    navigate('/login');
    return null;
  }

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%'
          }}
        >
          <Typography component="h1" variant="h4" color="primary" gutterBottom>
            Ozo
          </Typography>
          <Typography component="h2" variant="h6" gutterBottom>
            Verificar conta
          </Typography>
          
          <Typography variant="body2" color="textSecondary" align="center" sx={{ mb: 3 }}>
            Enviamos um código de verificação para {verificationData.contact}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1, width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="code"
              label="Código de verificação"
              name="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              inputProps={{ maxLength: 6 }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Verificar'}
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Button
                variant="text"
                color="primary"
                onClick={handleResend}
                disabled={loading}
              >
                Reenviar código
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Verify;
