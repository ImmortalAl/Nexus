# Immortal Nexus

**A timeless sanctuary for liberated spirits to manifest truth and freedom.**

Immortal Nexus is a community platform built for free thinkers, featuring a vanilla JavaScript frontend and Express.js/MongoDB backend architecture. This monorepo contains both the frontend and backend components of the application.

## 🏗️ **Project Structure**

```
Nexus/
├── front/          # Frontend application (Netlify deployment)
│   ├── pages/      # Site pages
│   ├── components/ # Shared components
│   ├── css/        # Stylesheets
│   ├── js/         # JavaScript modules
│   └── docs/       # Documentation
└── back/           # Backend API (Render deployment)
    ├── routes/     # API routes
    ├── models/     # Database models
    ├── middleware/ # Express middleware
    └── scripts/    # Utility scripts
```

## 🚀 **Quick Start**

### Frontend Development
```bash
cd front
# No build process - static files served directly
# Use live server extension for development
```

### Backend Development 
```bash
cd back
npm install
npm start  # Port 3001
```

## 🌟 **Platform Features**

- **🔐 Authentication**: JWT-based secure login and registration system
- **👤 User Profiles**: Dynamic profile pages with custom URLs (`/souls/username`)
- **🏛️ Admin Panel**: Immortal's Sanctum for comprehensive site management
- **💬 Real-time Messaging**: WebSocket-based persistent messaging system
- **📝 Soul Scrolls**: Personal blogging platform with rich text editing
- **⭐ User Feedback**: Complete rating and feedback system
- **📱 Responsive Design**: Mobile-optimized experience across all devices
- **🎨 Modern UI**: CSS variable-based theming with smooth animations
- **⚡ Performance**: Vanilla JavaScript for optimal loading speeds

## 🌐 **Production URLs**

- **Frontend**: https://immortal.nexus (Netlify)
- **Backend API**: https://immortal-nexus-backend.onrender.com/api (Render)  
- **Database**: MongoDB Atlas (Cloud)

## 📖 **Development Resources**

For developers working on Immortal Nexus:

1. **Frontend Documentation**: [front/docs/README.md](./front/docs/README.md)
2. **Development Setup**: [front/docs/DEVELOPMENT.md](./front/docs/DEVELOPMENT.md)
3. **Current Features**: [front/docs/FEATURES.md](./front/docs/FEATURES.md)  
4. **AI Context**: [front/docs/AI-CONTEXT.md](./front/docs/AI-CONTEXT.md)
5. **Architecture**: [front/docs/ARCHITECTURE.md](./front/docs/ARCHITECTURE.md)

## 🔧 **Technology Stack**

- **Frontend**: Vanilla JavaScript, CSS3, HTML5
- **Backend**: Node.js, Express.js, MongoDB
- **Authentication**: JWT tokens
- **Real-time**: WebSockets
- **Deployment**: Netlify (frontend), Render (backend)
- **Database**: MongoDB Atlas

---

*A digital sanctuary built for free thinkers, by free thinkers.* 🌟 