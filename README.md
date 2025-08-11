# WhatsApp Clone - Aplicativo de Mensagens Instantâneas

![WhatsApp Clone](https://img.shields.io/badge/WhatsApp-Clone-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-010101?style=for-the-badge&logo=socketdotio&logoColor=white)

Um aplicativo completo de mensagens instantâneas inspirado no WhatsApp, desenvolvido com tecnologias modernas e recursos avançados.

## 🚀 Características Principais

### 🔐 Autenticação Segura
- ✅ Cadastro com email ou telefone
- ✅ Verificação por código SMS/email
- ✅ Login seguro com JWT
- ✅ Recuperação de senha
- ✅ Autenticação de dois fatores

### 💬 Mensagens em Tempo Real
- ✅ Mensagens instantâneas via WebSocket
- ✅ Confirmação de entrega e leitura (checkmarks)
- ✅ Status de digitação em tempo real
- ✅ Mensagens de texto, emoji e formatação
- ✅ Resposta a mensagens específicas
- ✅ Encaminhamento de mensagens
- ✅ Edição e exclusão de mensagens

### 📱 Multimídia Avançada
- ✅ Envio de imagens, vídeos e documentos
- ✅ Gravação e envio de áudios
- ✅ Mensagens de voz com visualização de onda sonora
- ✅ Visualização de mídia com zoom
- ✅ Thumbnails automáticos
- ✅ Compressão inteligente de arquivos

### 👥 Grupos Completos
- ✅ Criação de grupos com foto e descrição
- ✅ Adicionar e remover participantes
- ✅ Administradores com permissões especiais
- ✅ Link de convite para grupos
- ✅ Configurações avançadas de grupo

### 📞 Chamadas de Voz e Vídeo
- ✅ Chamadas individuais de voz
- ✅ Chamadas de vídeo em alta qualidade
- ✅ Chamadas em grupo (até 8 participantes)
- ✅ Compartilhamento de tela
- ✅ Efeitos de áudio e vídeo

### 🔒 Segurança e Privacidade
- ✅ Criptografia ponta a ponta
- ✅ Mensagens autodestrutivas
- ✅ Controle de privacidade granular
- ✅ Bloqueio de usuários
- ✅ Backup criptografado

### 🎨 Interface Moderna
- ✅ Design inspirado no WhatsApp
- ✅ Modo claro e escuro
- ✅ Temas personalizáveis
- ✅ Interface responsiva
- ✅ Animações suaves
- ✅ Suporte a PWA

### 📊 Recursos Avançados
- ✅ Status online/última vez visto
- ✅ Notificações push
- ✅ Arquivamento de conversas
- ✅ Busca avançada de mensagens
- ✅ Localização em tempo real
- ✅ Compartilhamento de contatos

## 🛠️ Tecnologias Utilizadas

### Backend
- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **Socket.IO** - Comunicação em tempo real
- **MongoDB** - Banco de dados NoSQL
- **Mongoose** - ODM para MongoDB
- **JWT** - Autenticação via tokens
- **Bcrypt** - Hash de senhas
- **Multer** - Upload de arquivos
- **Twilio** - Envio de SMS
- **Firebase** - Push notifications

### Frontend
- **React 18** - Biblioteca UI
- **Material-UI** - Componentes UI
- **Zustand** - Gerenciamento de estado
- **Socket.IO Client** - Cliente WebSocket
- **Axios** - Cliente HTTP
- **React Hook Form** - Formulários
- **Framer Motion** - Animações
- **React Hot Toast** - Notificações

### Infraestrutura
- **WebRTC** - Chamadas de voz/vídeo
- **PWA** - Progressive Web App
- **Service Workers** - Cache offline
- **WebPush** - Notificações push

## 📋 Pré-requisitos

- Node.js (versão 16 ou superior)
- MongoDB (local ou MongoDB Atlas)
- Conta Twilio (para SMS)
- Conta Firebase (para push notifications)

## 🔧 Instalação

### 1. Clone o repositório
```bash
git clone https://github.com/seu-usuario/whatsapp-clone.git
cd whatsapp-clone
```

### 2. Instale as dependências do backend
```bash
cd backend
npm install
```

### 3. Instale as dependências do frontend
```bash
cd ../frontend
npm install
```

### 4. Configure as variáveis de ambiente

#### Backend (.env)
```bash
cd ../backend
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:

```env
# Banco de dados
MONGODB_URI=mongodb://localhost:27017/whatsapp-clone

# JWT
JWT_SECRET=seu_jwt_secret_super_seguro_aqui
JWT_EXPIRE=7d

# Servidor
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# Twilio (SMS)
TWILIO_ACCOUNT_SID=seu_twilio_account_sid
TWILIO_AUTH_TOKEN=seu_twilio_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Firebase (Push Notifications)
FIREBASE_PROJECT_ID=seu_project_id
FIREBASE_PRIVATE_KEY_ID=sua_private_key_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nsua_private_key_aqui\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@seu-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=seu_client_id
```

### 5. Inicie o MongoDB
```bash
# MongoDB local
mongod

# Ou use MongoDB Atlas (cloud)
```

### 6. Execute o projeto

#### Terminal 1 - Backend
```bash
cd backend
npm run dev
```

#### Terminal 2 - Frontend  
```bash
cd frontend
npm start
```

O aplicativo estará disponível em:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## 📱 Como Usar

### 1. Registro
1. Acesse http://localhost:3000
2. Clique em "Criar conta"
3. Preencha seus dados (nome, email/telefone, senha)
4. Verifique sua conta com o código recebido

### 2. Login
1. Use seu email/telefone e senha
2. Acesse o dashboard principal

### 3. Conversas
1. Clique no ícone "+" para iniciar nova conversa
2. Selecione um contato ou crie um grupo
3. Comece a conversar!

### 4. Recursos Avançados
- **Modo escuro**: Configurações → Tema
- **Notificações**: Permita notificações no navegador
- **Chamadas**: Clique no ícone de telefone/vídeo
- **Mídia**: Arraste arquivos ou use o ícone de anexo

## 🔧 Configurações Avançadas

### HTTPS (Produção)
Para usar HTTPS em produção, configure um proxy reverso (Nginx) ou use certificados SSL.

### WebRTC STUN/TURN
Para chamadas funcionarem em redes corporativas, configure servidores STUN/TURN:

```javascript
// frontend/src/config/webrtc.js
const rtcConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { 
      urls: 'turn:seu-turn-server.com:3478',
      username: 'usuario',
      credential: 'senha'
    }
  ]
};
```

### Escalabilidade
Para alta escala, considere:
- Redis para sessões do Socket.IO
- CDN para arquivos de mídia
- Load balancer para múltiplas instâncias
- Sharding do MongoDB

## 🚀 Deploy

### Heroku
```bash
# Backend
git subtree push --prefix backend heroku master

# Frontend (Netlify/Vercel)
cd frontend
npm run build
# Deploy da pasta build/
```

### Docker
```bash
# Build das imagens
docker-compose up -d
```

## 🧪 Testes

```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm test
```

## 📚 API Documentation

A API está documentada e disponível em:
- Swagger UI: http://localhost:5000/api/docs
- Postman Collection: `docs/postman_collection.json`

### Principais Endpoints

#### Autenticação
- `POST /api/auth/register` - Registrar usuário
- `POST /api/auth/login` - Login
- `POST /api/auth/verify` - Verificar código

#### Mensagens  
- `GET /api/messages/:chatId` - Buscar mensagens
- `POST /api/messages` - Enviar mensagem
- `PUT /api/messages/:id` - Editar mensagem

#### Chats
- `GET /api/chats` - Listar chats
- `POST /api/chats/direct` - Criar chat direto
- `POST /api/groups` - Criar grupo

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🐛 Problemas Conhecidos

- **Safari**: Algumas funcionalidades de WebRTC podem ter limitações
- **iOS**: Push notifications requerem configuração adicional
- **Rede corporativa**: Chamadas podem precisar de servidor TURN

## 💡 Roadmap

- [ ] Chamadas de vídeo em grupo (mais de 8 pessoas)
- [ ] Stories/Status temporários
- [ ] Bot API para integrações
- [ ] App nativo (React Native)
- [ ] Desktop app (Electron)
- [ ] Integração com calendário
- [ ] Tradução automática

## 📞 Suporte

- 📧 Email: seuemail@exemplo.com
- 💬 Discord: [Link do servidor](https://discord.gg/...)
- 📖 Wiki: [Wiki do projeto](https://github.com/seu-usuario/whatsapp-clone/wiki)

## 🙏 Agradecimentos

- WhatsApp por inspirar o design
- Comunidade open source pelas bibliotecas
- Beta testers pelas sugestões

---

⭐ **Se este projeto foi útil para você, considere dar uma estrela no GitHub!** ⭐

## 📸 Screenshots

### Interface Principal
![Dashboard](docs/screenshots/dashboard.png)

### Chat Individual  
![Chat](docs/screenshots/chat.png)

### Chamada de Vídeo
![Video Call](docs/screenshots/video-call.png)

### Modo Escuro
![Dark Mode](docs/screenshots/dark-mode.png)

---

**Desenvolvido com ❤️ para a comunidade open source**
