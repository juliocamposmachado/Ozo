import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [usePhone, setUsePhone] = useState(false);
  const [error, setError] = useState('');

  const { register, loading } = useAuthStore();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Senhas não coincidem');
      return;
    }

    if (formData.password.length < 6) {
      setError('Senha deve ter pelo menos 6 caracteres');
      return;
    }

    const registerData = {
      name: formData.name,
      password: formData.password
    };

    if (usePhone) {
      registerData.phone = formData.phone;
    } else {
      registerData.email = formData.email;
    }

    const result = await register(registerData);
    
    if (result.success && result.needsVerification) {
      navigate('/verify');
    } else if (!result.success) {
      setError(result.error || 'Erro no cadastro');
    }
  };

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
            Criar nova conta
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
              id="name"
              label="Nome completo"
              name="name"
              autoComplete="name"
              value={formData.name}
              onChange={handleChange}
            />

            <Box sx={{ display: 'flex', mb: 2, mt: 2 }}>
              <Button
                variant={!usePhone ? 'contained' : 'outlined'}
                onClick={() => setUsePhone(false)}
                sx={{ mr: 1, flex: 1 }}
              >
                Email
              </Button>
              <Button
                variant={usePhone ? 'contained' : 'outlined'}
                onClick={() => setUsePhone(true)}
                sx={{ flex: 1 }}
              >
                Telefone
              </Button>
            </Box>

            {usePhone ? (
              <TextField
                margin="normal"
                required
                fullWidth
                id="phone"
                label="Número de telefone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+55 11 99999-9999"
              />
            ) : (
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email"
                name="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
              />
            )}

            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Senha"
              type="password"
              id="password"
              value={formData.password}
              onChange={handleChange}
            />

            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirmar senha"
              type="password"
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Cadastrar'}
            </Button>

            <Box sx={{ textAlign: 'center' }}>
              <Link to="/login" style={{ textDecoration: 'none' }}>
                <Typography variant="body2" color="primary">
                  Já tem uma conta? Entrar
                </Typography>
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Register;
