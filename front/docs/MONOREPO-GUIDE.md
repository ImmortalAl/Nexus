# 🦇 Immortal Nexus Monorepo Guide

*"Two chambers, one eternal heartbeat"*

## 📖 Table of Contents
- [The Sacred Structure](#the-sacred-structure)
- [Frontend Sanctum](#frontend-sanctum)
- [Backend Crypt](#backend-crypt)
- [Deployment Rituals](#deployment-rituals)
- [Development Incantations](#development-incantations)
- [Common Séances](#common-séances)

## The Sacred Structure

```
Nexus/                      # The eternal monorepo tomb
├── front/                  # Frontend sanctum (Netlify)
│   ├── index.html         # Portal to immortality
│   ├── pages/             # Sacred scrolls
│   ├── css/               # Gothic aesthetics
│   ├── js/                # Dark sorcery
│   ├── components/        # Reusable relics
│   ├── docs/              # This very grimoire
│   └── _redirects         # Netlify path magic
├── back/                   # Backend crypt (Render)
│   ├── index.js           # Server awakening
│   ├── models/            # Data spirits
│   ├── routes/            # API pathways
│   ├── middleware/        # Guardian spells
│   └── package.json       # Dependency scrolls
├── netlify.toml           # Frontend deployment tome
└── README.md              # Monorepo introduction
```

## Frontend Sanctum

The frontend dwells in `front/` - a static site deployed through Netlify's dark mirrors.

### Key Locations
- **Entry Portal**: `front/index.html`
- **Soul Directory**: `front/souls/`
- **Sacred Pages**: `front/pages/`
- **Shared Components**: `front/components/shared/`
- **Configuration**: `front/components/shared/config.js`

### Deployment Configuration
```toml
# netlify.toml (root)
[build]
  base = "front"
  publish = "."
  command = ""  # No build needed for static site
```

### URL Redirects
The `front/_redirects` file channels spirits through proper paths:
```
/profile     /profile/index.html   200
/souls/:username    /souls/profile.html?user=:username   200
/souls       /souls/index.html     200
```

## Backend Crypt

The backend lurks in `back/` - a Node.js API deployed on Render's eternal servers.

### Key Components
- **Server Ritual**: `back/index.js`
- **Database Connection**: `back/config/db.js`
- **API Routes**: `back/routes/`
- **Data Models**: `back/models/`
- **WebSocket Sorcery**: `back/websocket.js`

### Current Deployment
- **URL**: `https://mlnf-auth.onrender.com/api`
- **Platform**: Render
- **Database**: MongoDB Atlas

## Deployment Rituals

### Frontend Deployment (Automatic)
Every push to `main` awakens Netlify:
```bash
git add .
git commit -m "feat: summon new darkness"
git push origin main
# Netlify automatically deploys from front/
```

### Backend Deployment
Currently deployed separately on Render. Future ritual:
```bash
cd back/
# Update dependencies if needed
npm install
# Test locally
npm start
# Push triggers Render deployment
```

### Version Bumping Incantation
When modifying CSS/JS files with `?v=` parameters:
```bash
# Update all pages with new version
find /home/immortalal/sites/Nexus/front -name "*.html" \
  -exec sed -i 's/styles.css?v=[0-9.]*/styles.css?v=11.0/g' {} \;
```

## Development Incantations

### Local Frontend Summoning
```bash
cd /home/immortalal/sites/Nexus/front
# Use any static server
python3 -m http.server 8000
# Or
npx serve
```

### Local Backend Awakening
```bash
cd /home/immortalal/sites/Nexus/back
npm install
npm run dev  # Uses nodemon for auto-restart
```

### Environment Variables
Frontend (`front/components/shared/config.js`):
```javascript
const isLocalDevelopment = window.location.hostname === 'localhost';
const API_BASE_URL = isLocalDevelopment 
  ? 'http://localhost:3001/api' 
  : 'https://mlnf-auth.onrender.com/api';
```

## Common Séances

### Adding a New Page
1. Create in `front/pages/new-ritual.html`
2. Add navigation in header components
3. Update `front/_redirects` if needed
4. Bump version numbers for modified files

### Updating Shared Styles
1. Modify `front/css/styles.css` or component CSS
2. Bump ALL version numbers in affected HTML files
3. Test across multiple pages
4. Commit with descriptive message

### Backend API Changes
1. Update routes in `back/routes/`
2. Modify models if needed
3. Test locally with frontend
4. Deploy to Render
5. Update frontend API calls if needed

### Emergency Rollback Ritual
```bash
# View recent commits
git log --oneline -10

# Revert to previous state
git revert HEAD
git push origin main

# Or reset to specific commit
git reset --hard [commit-hash]
git push --force origin main
```

## The Eternal Wisdom

### Remember Always
1. **Version Bump**: Always increment `?v=` for cached files
2. **Test Locally**: Summon locally before deploying
3. **Git Workflow**: Add → Commit → Push → Verify
4. **Documentation**: Update docs with significant changes
5. **Monorepo Mind**: Changes affect the whole tomb

### Gothic Best Practices
- 🦇 Keep frontend and backend concerns separated
- 🌙 Use descriptive commit messages with proper prefixes
- ⚰️ Document your dark magic for future necromancers
- 🕯️ Test across different pages and browsers
- 🗝️ Never commit secrets or API keys

---

*"In the monorepo's embrace, frontend and backend dance eternally as one."*

Last updated: ${new Date().toISOString()}