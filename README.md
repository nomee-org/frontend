# Nomee.social

A modern web3 domain marketplace built with React, TypeScript, and Tailwind CSS. Buy, sell, and manage DOMA Protocol domain names with social and messaging integrated.

## ✨ Features

### 🔐 **Wallet Integration**
- Connect with popular Web3 wallets
- Secure transaction handling
- Multi-chain support

### 🏷️ **Domain Management** 
- Browse and search available domains
- View domain details and ownership information
- Transfer lock and fractionalization support
- Name server configuration
- Domain verification system

### 💰 **Marketplace**
- List domains for sale
- Make and receive offers
- Accept/reject offers with confirmation popups
- Real-time price tracking
- Activity history and analytics

### 💬 **Social Features**
- Follow/unfollow domain owners
- Create and share posts
- Comment and like system
- Direct messaging between users
- Group conversations with member tagging
- Voice messages and media sharing

### 📱 **Responsive Design**
- Mobile-first approach
- Bottom drawer modals on mobile
- Desktop dialog modals
- Touch-friendly interface
- Progressive Web App (PWA) ready

### 🎨 **Modern UI/UX**
- Beautiful gradients and animations
- Dark/light theme support
- Semantic color system
- Loading states and error handling
- Infinite scroll for better performance

## 🛠️ Tech Stack

### **Frontend**
- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **React Router** - Client-side routing
- **Tailwind CSS** - Utility-first styling
- **Radix UI** - Accessible component primitives
- **Shadcn/ui** - Beautiful component library

### **State Management**
- **TanStack Query** - Server state management
- **React Context** - Global app state
- **Custom hooks** - Reusable logic

### **Web3 Integration**
- **Wagmi** - React hooks for Ethereum
- **Viem** - TypeScript Ethereum library
- **RainbowKit/Reown** - Wallet connection

### **Real-time Features**
- **WebSocket** - Live messaging and notifications
- **Socket.io** - Real-time communication
- **Push notifications** - Firebase messaging

### **Media & Files**
- **FFmpeg.wasm** - Video/audio processing
- **React Image Crop** - Image editing
- **File upload** - Drag & drop support

### **Developer Experience**
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript** - Static type checking
- **Hot reload** - Fast development

## 🚀 Getting Started

### Prerequisites
- **Node.js** 18+ 
- **npm** or **yarn**
- **Web3 wallet** (MetaMask, WalletConnect, etc.)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/nomee-org/frontend.git
```

2. **Install dependencies**
```bash
npm i
```

3. **Start development server**
```bash
npm run dev
```

4. **Open in browser**
```
http://localhost:5173
```

### Build for Production
```bash
npm run build
npm run preview
```

## 📱 Key Components

### **Domain Details Page** (`/names/:domain`)
- Complete domain information
- Ownership and registration details  
- Current offers and marketplace data
- Name servers configuration
- Owner verification system
- Accept/reject offer functionality with responsive popups

### **Marketplace** (`/discover`)
- Browse available domains
- Advanced search and filtering
- Sort by price, date, popularity
- Watchlist functionality

### **Messaging** (`/messages`)
- Direct conversations with domain owners
- Group messaging with member tagging
- Voice messages and file sharing
- Real-time typing indicators
- Message reactions and replies

### **Portfolio** (`/portfolio`)
- Manage owned domains
- Track domain values
- Transaction history
- Earnings overview

### **Community** (`/community`)
- Social feed with posts
- Follow system
- Like and comment interactions
- Media sharing capabilities

## 🔧 Configuration

### Environment Variables
Create a `.env.local` file:
```env
VITE_APP_NAME=

VITE_NOMEE_BACKEND_URL=
VITE_NOMEE_BACKEND_WS_URL=

VITE_NOMEE_BACKEND_URL=
VITE_NOMEE_BACKEND_WS_URL=

VITE_DOMA_URL=
VITE_DOMA_API_KEY=
VITE_DOMA_GRAPHQL_URL=

VITE_REOWN_PROJECT_ID=

VITE_FIREBASE_VAPID=
```

### Customization
- **Theme**: Edit `src/index.css` for colors and design tokens
- **Config**: Update `src/configs/` for app settings
- **Types**: Modify `src/types/` for TypeScript definitions

## 📦 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Base shadcn/ui components
│   ├── common/         # Shared app components  
│   ├── domain/         # Domain-specific components
│   ├── messaging/      # Chat and messaging components
│   └── posts/          # Social media components
├── pages/              # Route pages
├── hooks/              # Custom React hooks
├── services/           # API and external services
├── data/               # Data fetching and caching
├── types/              # TypeScript type definitions
├── lib/                # Utility functions
└── assets/             # Static assets (images, icons)
```

### Manual Deployment
```bash
npm run build
# Deploy dist/ folder to your hosting provider
```

## 📋 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run type-check` | Check TypeScript types |

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)  
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Use semantic commit messages
- Add tests for new features
- Update documentation as needed
- Ensure responsive design

## 🐛 Troubleshooting

### Common Issues

**Build Errors**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Wallet Connection Issues**
- Ensure MetaMask is installed and unlocked
- Check network configuration
- Verify WalletConnect project ID

**Styling Issues**  
- Clear browser cache
- Check Tailwind CSS configuration
- Verify CSS imports order

## 📄 License

This project is licensed under the **MIT License**.

## 🌟 Acknowledgments

- **Shadcn/ui** - Beautiful component library
- **Radix UI** - Accessible primitives
- **TanStack Query** - Powerful data fetching
- **Wagmi** - Ethereum React hooks
- **Tailwind CSS** - Utility-first CSS framework

---