# Immortal Nexus Development Grimoire

## 📜 Table of Dark Contents

1. [Awakening the Nexus](#awakening-the-nexus)
2. [The Monorepo Crypt](#the-monorepo-crypt)
3. [Development Rituals](#development-rituals)
4. [Frontend Sorcery](#frontend-sorcery)
5. [Backend Necromancy](#backend-necromancy)
6. [Deployment Ceremonies](#deployment-ceremonies)
7. [Troubleshooting Séances](#troubleshooting-séances)
8. [Gothic Best Practices](#gothic-best-practices)

---

## 🌙 Awakening the Nexus

### **The Sacred Monorepo Structure**

```
/home/immortalal/sites/Nexus/     # The eternal monorepo
├── front/                        # Frontend sanctum (Netlify)
│   ├── .git/                     # Version control spirits
│   ├── components/shared/        # Reusable relics
│   ├── css/                      # Gothic aesthetics
│   ├── js/                       # Dark JavaScript arts
│   ├── pages/                    # Sacred scrolls
│   ├── souls/                    # Spirit directory
│   ├── admin/                    # Immortal's Sanctum
│   ├── _redirects                # Path channeling (CRITICAL)
│   └── docs/                     # This grimoire collection
├── back/                         # Backend tomb (Render)
│   ├── routes/                   # API passages
│   ├── models/                   # Data spirits
│   ├── middleware/               # Guardian spells
│   └── config/                   # Configuration runes
└── netlify.toml                  # Frontend deployment tome
```

### **Summoning the Development Environment**

#### **Frontend Awakening**
```bash
cd /home/immortalal/sites/Nexus/front
# Use any static server incantation
python3 -m http.server 8000
# Or the npm familiar
npx serve
```

#### **Backend Resurrection**
```bash
cd /home/immortalal/sites/Nexus/back
npm install          # Summon dependencies
npm run dev         # Awaken with nodemon
```

## 🦇 The Monorepo Crypt

### **Git Operations from the Tomb Root**
```bash
# Always perform git rituals from monorepo root
cd /home/immortalal/sites/Nexus

# The sacred workflow
git add .
git commit -m "feat: summon new darkness"
git push origin main
```

### **Frontend vs Backend Separation**
- Frontend dwells in `front/` - deployed to Netlify
- Backend lurks in `back/` - deployed to Render
- Never shall they merge, yet forever they communicate

## ⚡ Development Rituals

### **The Sacred Version Bumping**
When modifying files with `?v=` parameters:

```bash
# Update all HTML files with new CSS version
find /home/immortalal/sites/Nexus/front -name "*.html" \
  -exec sed -i 's/styles.css?v=[0-9.]*/styles.css?v=11.0/g' {} \;

# Update specific component versions
sed -i 's/main.js?v=[0-9.]*/main.js?v=3.0/g' front/index.html
```

### **Component Creation Ceremony**
1. Study existing components in `front/components/shared/`
2. Follow the established patterns (see nexus-core.js)
3. Use CSS variables from base-theme.css
4. Test across multiple pages
5. Bump versions for all affected files

## 🎨 Frontend Sorcery

### **CSS Architecture of Shadows**
```
css/
├── base-theme.css       # Dark variable definitions
├── critical.css         # Above-fold essentials
├── styles.css           # Global incantations
├── components/          # Component-specific styles
└── features.css         # Enhanced experience layer
```

### **JavaScript Dark Arts**
```
js/
├── main.js              # Primary initialization
├── nexus-avatar-system.js # Soul visualization
├── mindmap/             # Infinite Nexus engine
└── components/shared/   # Reusable sorcery
```

### **Sacred Page Patterns**
- All pages inherit from common header structure
- Use semantic HTML for accessibility
- Implement proper ARIA labels
- Follow mobile-first responsive design

## 💀 Backend Necromancy

### **API Endpoint Structure**
```javascript
// Example route incantation
router.get('/souls/:username', async (req, res) => {
    try {
        const soul = await User.findOne({ 
            username: req.params.username 
        });
        res.json(soul);
    } catch (error) {
        res.status(500).json({ 
            error: 'Soul not found in the ether' 
        });
    }
});
```

### **Database Spirits (MongoDB)**
- Models define the shape of eternal data
- Middleware guards the sacred routes
- WebSocket channels for real-time communion

## 🚀 Deployment Ceremonies

### **Frontend Deployment (Automatic)**
```bash
# From monorepo root
git add .
git commit -m "feat: enhance the eternal darkness"
git push origin main
# Netlify automatically awakens
```

### **Backend Deployment**
Currently deployed on Render from separate repository.
Future integration planned for monorepo deployment.

### **Production Portals**
- **Frontend**: https://immortal.nexus
- **Backend**: https://nexus-ytrg.onrender.com/api
- **Repository**: https://github.com/ImmortalAl/Nexus

## 🔮 Troubleshooting Séances

### **Common Apparitions**
1. **404 Errors**: Check `_redirects` file and netlify.toml
2. **CORS Issues**: Verify backend middleware configuration
3. **Cache Problems**: Bump version numbers!
4. **Auth Failures**: Check JWT token handling

### **Debugging Incantations**
```javascript
// Console debugging pattern
console.log('[ComponentName] Summoning:', data);

// Network debugging
fetch(url)
  .then(res => {
    console.log('[API] Response status:', res.status);
    return res.json();
  })
  .catch(err => {
    console.error('[API] Dark forces intervened:', err);
  });
```

## 🌟 Gothic Best Practices

### **Code Quality Standards**
- ⚰️ Follow existing patterns religiously
- 🦇 Use descriptive variable names
- 🌙 Comment complex sorcery
- 🕯️ Test across browsers and devices
- 🗝️ Never commit secrets or keys

### **Performance Necromancy**
- Lazy load non-critical CSS
- Optimize images (prefer SVG for icons)
- Minify production assets
- Use CDN for external libraries
- Implement proper caching strategies

### **Accessibility Rites**
- Semantic HTML structure
- ARIA labels for interactive elements
- Keyboard navigation support
- Screen reader compatibility
- Color contrast compliance

### **The Eternal Workflow**
1. Create feature branch (optional)
2. Implement with proper patterns
3. Test locally across pages
4. Bump version numbers
5. Commit with descriptive message
6. Push to awaken deployment
7. Verify in production realm

---

*"In code we trust, in darkness we dwell, through documentation we achieve immortality."*

Last updated by the Gothic Scribe: ${new Date().toISOString()}