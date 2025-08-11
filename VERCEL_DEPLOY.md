# 🚀 Deploy no Vercel - Instruções Completas

## 📋 Pré-requisitos
- Conta no Vercel: https://vercel.com
- Conta no MongoDB Atlas: https://cloud.mongodb.com
- Conta no Firebase: https://console.firebase.google.com
- Conta no Twilio (opcional): https://twilio.com

## 🔧 Configuração do MongoDB Atlas

1. **Criar cluster gratuito:**
   - Acesse MongoDB Atlas
   - Crie um novo projeto "WhatsApp Clone"
   - Crie um cluster gratuito (M0)
   - Configure Network Access (0.0.0.0/0 para Vercel)
   - Crie um usuário do banco de dados

2. **Obter string de conexão:**
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/whatsapp-clone?retryWrites=true&w=majority
   ```

## 🔔 Configuração do Firebase

1. **Criar projeto:**
   - Acesse Firebase Console
   - Crie novo projeto "WhatsApp Clone"
   - Ative Authentication e Cloud Messaging

2. **Gerar chave de serviço:**
   - Project Settings → Service Accounts
   - Generate New Private Key
   - Baixe o arquivo JSON

3. **Extrair variáveis do JSON:**
   ```json
   {
     "project_id": "seu-project-id",
     "private_key_id": "sua-private-key-id",
     "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
     "client_email": "firebase-adminsdk@projeto.iam.gserviceaccount.com",
     "client_id": "seu-client-id"
   }
   ```

## 📱 Deploy no Vercel

### 1. Conectar repositório
1. Acesse [Vercel Dashboard](https://vercel.com/dashboard)
2. Clique "New Project"
3. Import from GitHub: `juliocamposmachado/Ozo`
4. Configure como **Monorepo**

### 2. Configurar variáveis de ambiente
No painel do Vercel, vá em **Settings → Environment Variables** e adicione:

#### Variáveis obrigatórias:
```env
# MongoDB
MONGODB_URI=mongodb+srv://usuario:senha@cluster0.xxxxx.mongodb.net/whatsapp-clone?retryWrites=true&w=majority

# JWT
JWT_SECRET=sua_chave_jwt_super_segura_com_32_caracteres_ou_mais
JWT_EXPIRE=7d

# Servidor
NODE_ENV=production
CLIENT_URL=https://seu-app.vercel.app

# Firebase (Push Notifications)
FIREBASE_PROJECT_ID=seu-project-id
FIREBASE_PRIVATE_KEY_ID=sua-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nsua-private-key-aqui\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@projeto.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=seu-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token

# Configurações de Upload
MAX_FILE_SIZE=50mb
UPLOAD_PATH=./uploads

# Criptografia
ENCRYPTION_KEY=sua_chave_de_criptografia_de_32_caracteres
IV_LENGTH=16
```

#### Variáveis opcionais (Twilio para SMS):
```env
TWILIO_ACCOUNT_SID=seu_twilio_account_sid
TWILIO_AUTH_TOKEN=seu_twilio_auth_token  
TWILIO_PHONE_NUMBER=+1234567890
```

### 3. Configurar build settings
```
Framework Preset: Other
Build Command: cd frontend && npm install && npm run build
Output Directory: frontend/build
Install Command: npm install
```

### 4. Deploy
1. Clique "Deploy"
2. Aguarde o build completar
3. Teste a aplicação

## 🔧 Configurações Avançadas

### Domínio customizado
1. Settings → Domains
2. Adicione seu domínio
3. Configure DNS conforme instruções

### Configurar Socket.IO para produção
O Socket.IO funcionará automaticamente com as configurações do `vercel.json`.

### Monitoramento
1. Vercel Analytics (automático)
2. Error tracking via logs
3. Performance monitoring

## ⚡ Otimizações

### 1. Configurar CDN para uploads
Para arquivos de mídia em produção, use:
- AWS S3 + CloudFront
- Cloudinary
- Vercel Blob Storage

### 2. Cache estratégico
```javascript
// Headers para cache
const headers = {
  'Cache-Control': 'public, max-age=31536000',
  'CDN-Cache-Control': 'max-age=31536000'
};
```

### 3. Compressão de imagens
Ativar compressão automática no Vercel:
```json
// vercel.json
{
  "images": {
    "domains": ["seu-dominio.com"],
    "formats": ["image/webp"]
  }
}
```

## 🐛 Troubleshooting

### Build falha
```bash
# Verificar logs no Vercel Dashboard
# Testar build local:
cd frontend
npm install
npm run build
```

### Socket.IO não conecta
1. Verificar `CLIENT_URL` nas env vars
2. Verificar configuração CORS no backend
3. Testar WebSocket connectivity

### MongoDB timeout
1. Verificar string de conexão
2. Configurar Network Access no Atlas
3. Aumentar timeout de conexão

### Firebase não funciona
1. Verificar todas as env vars do Firebase
2. Formato correto da private_key (com \n)
3. Ativar APIs necessárias no console

## 📊 Monitoramento pós-deploy

### 1. Logs em tempo real
```bash
vercel logs https://seu-app.vercel.app --follow
```

### 2. Métricas importantes
- Response time < 200ms
- Error rate < 1%
- Socket.IO connections
- Database performance

### 3. Alertas recomendados
- Erro 500 > 10/minuto
- Database connection fails
- High memory usage
- Socket disconnections em massa

## 🔄 CI/CD Automático

O Vercel faz deploy automático quando você faz push para GitHub:

1. **Desenvolvimento:** Pushes para branches → Preview deployments
2. **Produção:** Pushes para `main/master` → Production deployment

### Workflow recomendado:
```bash
# Desenvolvimento
git checkout -b feature/nova-funcionalidade
git push origin feature/nova-funcionalidade
# → Preview deploy automático

# Produção  
git checkout master
git merge feature/nova-funcionalidade
git push origin master
# → Production deploy automático
```

## ✅ Checklist pós-deploy

- [ ] Aplicação carrega corretamente
- [ ] Login/registro funcionando
- [ ] Socket.IO conectando
- [ ] Mensagens em tempo real funcionando
- [ ] Upload de arquivos funcionando
- [ ] Notificações push funcionando
- [ ] Modo escuro/claro funcionando
- [ ] Responsividade em mobile
- [ ] PWA instalável
- [ ] SSL/HTTPS ativo

## 📞 Suporte

Se encontrar problemas:

1. **Logs do Vercel:** Dashboard → Functions → View Logs
2. **Console do browser:** F12 → Console (erros frontend)
3. **MongoDB logs:** Atlas → Clusters → Metrics
4. **Firebase logs:** Console → Cloud Messaging

---

## 🎉 Parabéns!

Seu WhatsApp Clone está online e funcionando! 

**URL de acesso:** https://ozo-whatsapp-clone.vercel.app

Compartilhe com seus usuários e monitore o desempenho. 🚀
