# Immortal Nexus Development Instructions for Claude

## Critical Git Workflow

**ALWAYS follow this sequence after making ANY code changes:**

1. **FIRST: Update version numbers** for any modified CSS/JS files
2. **Git add all changes**: `git add .`
3. **Git commit with descriptive message**: `git commit -m "type: description"`
4. **Git push immediately**: `git push origin main`
5. **Test changes live on internet** (Netlify deployment)

**NEVER skip the push step** - all changes must be deployed to Netlify immediately.

## 🚨 CRITICAL VERSIONING RULE 🚨

**MANDATORY: ALWAYS bump version numbers when modifying files with ?v= parameters**

### Files That REQUIRE Version Bumps:
- **CSS Files**: `styles.css?v=X.X`, `components/shared/styles.css?v=X.X`
- **JavaScript Files**: `main.js?v=X.X`, `messageModal.js?v=X.X`, etc.
- **ANY file loaded with ?v= parameter**

### When to Bump Versions:
- ✅ **CSS changes**: Layout, styling, responsive design, animations
- ✅ **JavaScript changes**: Functionality, event handlers, API calls, UI behavior
- ✅ **Feature additions**: New buttons, modals, forms, interactions
- ✅ **Bug fixes**: Any code modification that affects user experience
- ✅ **Content changes in versioned files**: Even small text updates

### Version Bump Examples:
```bash
# CSS Changes
sed -i 's/styles.css?v=[0-9.]*/styles.css?v=6.0/g' index.html

# JavaScript Changes  
sed -i 's/main.js?v=[0-9.]*/main.js?v=2.0/g' index.html

# Shared Components
sed -i 's/shared\/styles.css?v=[0-9.]*/shared\/styles.css?v=6.0/g' index.html
```

### ⚠️ CONSEQUENCES OF NOT VERSIONING:
- Users see cached old functionality
- Changes appear to "not work" 
- Inconsistent user experience
- Debugging nightmare ("it works on my machine")
- Lost development time troubleshooting cache issues

## 🎨 FEATURES.CSS SPECIAL GUIDELINES

**features.css is the "Enhanced Experience Layer" - handle with extra care!**

### When features.css Changes:
1. **ALWAYS update ALL pages** that use features.css (not just one page)
2. **Current Standard Version**: v4.5 (as of 2025-06-30)
3. **Pages that need updates**: index.html, lander.html, blog.html, messageboard.html, news.html, souls/index.html, admin/index.html, templates/page-template.html

### Features.css Version Bump Commands:
```bash
# Update ALL pages at once - CRITICAL for consistency
find /home/immortalal/sites/Nexus/front -name "*.html" -exec sed -i 's/features\.css?v=[0-9.]*/features.css?v=5.0/g' {} \;

# Or individual pages:
sed -i 's/features\.css?v=[0-9.]*/features.css?v=5.0/g' index.html
sed -i 's/features\.css?v=[0-9.]*/features.css?v=5.0/g' lander.html
sed -i 's/\.\.\/css\/features\.css?v=[0-9.]*/../css/features.css?v=5.0/g' pages/*.html
sed -i 's/\.\.\/css\/features\.css?v=[0-9.]*/../css/features.css?v=5.0/g' souls/index.html
sed -i 's/\.\.\/css\/features\.css?v=[0-9.]*/../css/features.css?v=5.0/g' admin/index.html
```

### What features.css Controls:
- ✅ **Highlight container top borders** (Soul Scrolls, Eternal Souls, Echoes Unbound)
- ✅ **Soul highlight cards** (founder/featured cards with colored borders)
- ✅ **Responsive design** for all interactive features
- ✅ **Modal systems** (profile previews, messages, authentication)
- ✅ **Advanced animations** and hover effects

### 🚨 FEATURES.CSS VERSION MISMATCH WARNING:
If features.css versions are inconsistent across pages:
- Highlight sections break on some pages
- Soul cards lose styling
- Mobile responsiveness fails
- Top gradient borders disappear
- User experience becomes inconsistent

**Solution**: Always keep ALL pages on the same features.css version!

## Commit Message Format
- `feat: description` - New features
- `fix: description` - Bug fixes  
- `update: description` - Updates to existing features
- `style: description` - CSS/styling changes
- `refactor: description` - Code restructuring
- `docs: description` - Documentation updates

## 🎨 THEME SYSTEM CRITICAL GUIDELINES

**The theme system is centralized in `themeManager.js` - NO other file should manage themes!**

### Theme Toggle Requirements

**CRITICAL: Every theme toggle button MUST have this attribute:**
```html
data-theme-toggle="true"
```

**Without this attribute, the button WILL NOT WORK!**

### Correct Theme Toggle Patterns

**Static HTML:**
```html
<!-- ✅ CORRECT -->
<button class="theme-toggle" data-theme-toggle="true" aria-label="Toggle theme">
    <i class="fas fa-moon"></i>
</button>

<!-- ❌ WRONG - Missing data attribute -->
<button class="theme-toggle" id="themeToggle">
    <i class="fas fa-moon"></i>
</button>
```

**Dynamic JavaScript (User Menu, Mobile Menu):**
```javascript
// ✅ CORRECT - Has data-theme-toggle
innerHTML = `<a href="#" id="themeToggle" data-theme-toggle="true">
    <i class="fas fa-moon"></i> Toggle Theme
</a>`;

// ❌ WRONG - Missing data attribute
innerHTML = `<a href="#" id="themeToggle">Theme</a>`;
```

### Theme System Architecture

**Single Source of Truth:**
- File: `front/components/shared/themeManager.js`
- Searches for ALL elements with `[data-theme-toggle]`
- Attaches click handlers automatically
- Updates all toggles simultaneously

**Theme Toggle Locations:**
1. Floating button (logged-out): Has `data-theme-toggle="true"` ✓
2. User menu (logged-in): Must have `data-theme-toggle="true"` in userMenu.js
3. Mobile menu: Must have `data-theme-toggle="true"` in navigation.js

**Storage:**
- Key: `'nexus-theme'` (localStorage)
- Values: `'dark'` or `'light'`
- Default: `'dark'`

### Theme System Rules

**🚨 NEVER DO THESE:**
- ❌ Create theme logic in main.js, scripts.js, or other files
- ❌ Add manual click handlers to theme toggle buttons
- ❌ Create theme toggles without `data-theme-toggle="true"`
- ❌ Use different localStorage keys for theme

**✅ ALWAYS DO THESE:**
- ✅ Add `data-theme-toggle="true"` to every theme toggle
- ✅ Let themeManager.js handle all theme operations
- ✅ Call `window.NEXUSTheme?.connectExistingToggles()` after creating dynamic toggles
- ✅ Use consistent icon logic (dark mode = sun icon, light mode = moon icon)

### Icon Logic (CRITICAL)

```javascript
// ✅ CORRECT - Icon shows OPPOSITE of current state (what it will BECOME)
if (currentTheme === 'dark') {
    icon.className = 'fas fa-sun';  // Show sun (click to go LIGHT)
} else {
    icon.className = 'fas fa-moon'; // Show moon (click to go DARK)
}

// ❌ WRONG - This is backwards!
if (currentTheme === 'light') {
    icon.className = 'fas fa-sun';  // NO! Light mode should show moon!
}
```

### Theme System Version Requirements

- **themeManager.js**: v2.0+ (fixed icon logic, debug logging)
- **userMenu.js**: v6.8+ (has data-theme-toggle attribute)
- **navigation.js**: v2.0+ (has data-theme-toggle attribute)

### Troubleshooting

**If theme toggle doesn't work:**
1. Check browser console for `[ThemeManager]` debug logs
2. Verify `data-theme-toggle="true"` exists on button
3. Check if themeManager.js is loading (Network tab)
4. Look for JavaScript errors blocking execution

**See full troubleshooting guide:** `/front/docs/THEME-SYSTEM-TROUBLESHOOTING.md`

## Development Best Practices

### Architecture-First Development
- **Always audit existing systems** before making any changes
- **Understand CSS dependencies** - know which CSS files load on which pages
- **Test across multiple page types** for site-wide features
- **Never assume existing patterns** - always verify current implementation

### Online Status System Notes
- Online status styles MUST be in `styles.css` (global) not component-specific CSS
- Avatar system creates DOM elements, not HTML strings
- Test avatar functionality across: Active Users, Comments, Blog, Profiles, Souls Directory

### CSS Architecture Awareness
- `styles.css` - Global styles, loaded on ALL pages
- `components/shared/styles.css` - Shared components, loaded on MOST pages  
- `active-users.css` - Component-specific, loaded only where needed
- Page-specific CSS - loaded only on individual pages

### Cross-Site Feature Development
1. Map which pages will use the feature
2. Ensure required CSS files are loaded on those pages
3. Test functionality on multiple page types
4. Verify integration points work consistently

## Console Cleanup & Debugging Guidelines

### Debug Statement Management
- **Production**: Remove debug console.log statements before deployment
- **Development**: Use `console.log('[ComponentName] DEBUG: message')` format for clarity
- **Error Handling**: Keep error console.error statements for production debugging
- **Performance**: Remove performance timing logs in production

### Systematic Console Error Resolution
1. **Document each error** before fixing (screenshot/copy error text)
2. **One error at a time** - fix completely before moving to next
3. **Test thoroughly** after each fix to ensure no regression
4. **Verify fix across all affected pages** before moving on
5. **Update CSS version numbers** when making style changes for cache busting

### Debug Statement Removal Process
- Search for `console.log` site-wide and evaluate each one
- Keep error logging: `console.error`, `console.warn`
- Remove development logs: `console.log('[DEBUG]')`, timing logs
- Replace with proper error handling where needed

## Auto-Push Reminder
After completing any task involving file changes, Claude must:
1. Run git status to verify changes
2. Add, commit, and push all changes
3. Confirm successful deployment

This ensures continuous deployment and prevents work loss.

## Available Tooling & Scripts

### Version Management
- **`./bump-versions.sh`** - Automatically updates CSS/JS version numbers across all HTML files
  - Usage: `./bump-versions.sh` (updates all files)
  - Usage: `./bump-versions.sh styles.css` (updates specific file)
  - Located at: `/home/immortalal/sites/Nexus/bump-versions.sh`

### Performance Monitoring
- **`performance-audit.html`** - Real-time performance monitoring dashboard
  - Tracks Core Web Vitals (LCP, FID, CLS, TTFB, FCP)
  - Browser compatibility testing
  - Network performance analysis
  - Located at: `/home/immortalal/sites/Nexus/front/performance-audit.html`
  - Access via: `https://immortalnexus.netlify.app/performance-audit.html`

### Launch Planning
- **`LAUNCH-PLAN.md`** - Comprehensive beta and official launch checklist
  - Phase 0-5 roadmap with go/no-go criteria
  - Risk mitigation strategies
  - Success metrics and KPIs
  - Located at: `/home/immortalal/sites/Nexus/LAUNCH-PLAN.md`

## Monorepo Structure

**The Immortal Nexus now dwells in a monorepo tomb:**
- `front/` - Frontend crypt (Netlify deployment)
- `back/` - Backend sanctum (Render deployment)
- Root `netlify.toml` - Configures frontend deployment from `front/` directory

### Important Monorepo Notes:
- All frontend work happens in `/home/immortalal/sites/Nexus/front/`
- Backend API remains at `https://nexus-ytrg.onrender.com/api`
- Git operations should be run from the root `/home/immortalal/sites/Nexus/`
- The `front/` folder contains its own `_redirects` for Netlify routing

// Additional Note for Future Iterations:
// The user prefers to be asked (pestered) if anything is unclear or unknown during development. This ensures all changes are approved and minimizes the need for backtracking or reworking. Always confirm uncertainties before proceeding.

## User Communication Preferences

**CRITICAL: The user values constructive disagreement over agreement**
- NEVER be a "yes man" - the user explicitly dislikes this
- ALWAYS challenge ideas and propose better alternatives when possible
- Debate and discuss before implementing solutions
- Disagreement creates greatness - embrace it
- Present counterarguments and alternative approaches
- Only execute code after healthy debate and user approval
- If you think the user is wrong, SAY SO and explain why