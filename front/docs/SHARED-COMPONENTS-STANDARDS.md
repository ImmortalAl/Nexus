# Immortal Nexus Shared Components Standards

## 🎯 Core Principle: True Component Sharing

**Every shared component must be a single source of truth - defined in ONE place, used EVERYWHERE.**

---

## ✅ Component Architecture Rules

### Rule 1: JavaScript Owns HTML
- **Shared components MUST inject their own HTML dynamically**
- **NEVER hardcode shared component HTML in page files**
- **Exception:** Page-specific elements (like scroll-to-top buttons)

### Rule 2: Single Definition
- **Component HTML structure defined ONLY in JavaScript**
- **Component CSS defined in ONE CSS file**
- **Component behavior defined in ONE JavaScript file**

### Rule 3: Consistent Versioning
- **All pages must use the SAME version of each component**
- **Update version numbers when modifying components**
- **Use cache-busting: `component.js?v=X.X`**

---

## 📦 Shared Components Registry

### 1. Active Users Sidebar (`activeUsers.js`)
**Version:** v2.1
**Auto-Injects:**
- `<aside class="active-users" id="activeUsers">` - The sidebar panel
- `<div class="floating-buttons">` - Container for floating buttons
- `<button id="showUsersBtn">` - Show users button
- `<button data-theme-toggle="true">` - Theme toggle (when logged out)
- `<div id="activeUsersOverlay">` - Click-to-close overlay

**CSS:** `active-users.css?v=8.0`

### 2. Message Modal (`messageModal.js`)
**Version:** v1.6
**Auto-Injects:**
- `<div id="messageModal" class="modal">` - Direct message modal

**CSS:** Included in component styles

### 3. Navigation (`navigation.js`)
**Version:** v2.3
**Replaces:** `<!-- SHARED_HEADER -->` comment
**Injects:** Complete header with navigation, logo, and user menu

### 4. Theme Manager (`themeManager.js`)
**Version:** v2.2
**Pattern:** Searches for all `[data-theme-toggle]` elements
**Storage:** `localStorage['nexus-theme']`

### 5. User Menu (`userMenu.js`)
**Version:** v7.2
**Injects:** User dropdown menu in navigation
**Contains:** Theme toggle for logged-in users

### 6. Auth Modal (`authModal.js`)
**Version:** v4.2
**Auto-Injects:** Login/registration modal when needed

---

## 🚫 What NOT to Do

### ❌ NEVER: Hardcode Shared HTML
```html
<!-- WRONG - Never do this in page files -->
<aside class="active-users" id="activeUsers">
    <div class="active-users-header">
        <h3>Eternal Seekers</h3>
        ...
    </div>
</aside>
```

### ❌ NEVER: Use Different Versions
```html
<!-- WRONG - Inconsistent versions -->
<!-- index.html -->
<link rel="stylesheet" href="active-users.css?v=7.0">

<!-- blog.html -->
<link rel="stylesheet" href="active-users.css?v=8.0">
```

### ❌ NEVER: Mix Patterns
```html
<!-- WRONG - Using both id and data attribute patterns -->
<button id="themeToggle">...</button>  <!-- Old pattern -->
<button data-theme-toggle="true">...</button>  <!-- New pattern -->
```

---

## ✅ What TO Do

### ✅ DO: Use Injection Comments
```html
<!-- CORRECT - Let JavaScript inject components -->
<body>
    <!-- Active Users Sidebar, Floating Buttons, and Message Modal will be dynamically injected by shared components -->

    <header>
        <!-- SHARED_HEADER -->
    </header>
```

### ✅ DO: Use Consistent Versions
```html
<!-- CORRECT - Same version everywhere -->
<script src="activeUsers.js?v=2.1"></script>
<link rel="stylesheet" href="active-users.css?v=8.0">
```

### ✅ DO: Use Data Attributes for Behavior
```html
<!-- CORRECT - Declarative pattern -->
<button data-theme-toggle="true">Toggle Theme</button>
```

---

## 📝 Standard Page Template

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <!-- ... meta tags ... -->

    <!-- Core CSS -->
    <link rel="stylesheet" href="../css/base-theme.css?v=1.0">
    <link rel="stylesheet" href="../css/critical.css?v=7.1">
    <link rel="stylesheet" href="../css/styles.css?v=10.0">

    <!-- Shared Component CSS -->
    <link rel="stylesheet" href="../components/shared/styles.css?v=15.0">
    <link rel="stylesheet" href="../css/active-users.css?v=8.0">

    <!-- Page-specific CSS -->
    <!-- ... your page styles ... -->
</head>
<body>
    <!-- Shared components will be injected here by JavaScript -->
    <!-- Active Users Sidebar, Floating Buttons, and Message Modal will be dynamically injected by shared components -->

    <header>
        <!-- SHARED_HEADER -->
    </header>

    <main>
        <!-- Your page content -->
    </main>

    <footer>
        <!-- Footer content -->
    </footer>

    <!-- Scripts (order matters!) -->
    <script src="../components/shared/config.js?v=2.0"></script>
    <script src="../components/shared/nexus-core.js?v=1.5"></script>
    <script src="../components/shared/themeManager.js?v=2.2"></script>
    <script src="../components/shared/navigation.js?v=2.3"></script>
    <script src="../components/shared/userMenu.js?v=7.2"></script>
    <script src="../components/shared/activeUsers.js?v=2.1"></script>
    <script src="../components/shared/messageModal.js?v=1.6"></script>

    <!-- Page-specific scripts -->
</body>
</html>
```

---

## 🔄 Component Initialization Flow

1. **Page loads** → Static HTML renders
2. **DOMContentLoaded** → `nexus-core.js` runs
3. **Component init** → Each component:
   - Checks if its HTML exists
   - Injects HTML if missing
   - Attaches event handlers
   - Updates UI state
4. **Ready** → Page fully interactive

---

## 🧪 Testing Checklist

When modifying a shared component:

- [ ] Update version number in ALL pages
- [ ] Test on at least 3 different page types
- [ ] Verify HTML injection works
- [ ] Check console for errors
- [ ] Test logged-in and logged-out states
- [ ] Test mobile responsiveness
- [ ] Verify no duplicate elements in DOM

---

## 🚀 Future Improvements

1. **Build System Integration**
   - Automate version bumping
   - Bundle shared components
   - Minification and optimization

2. **Component Registry**
   - Central manifest file
   - Dependency management
   - Auto-loading system

3. **Testing Framework**
   - Automated component tests
   - Visual regression testing
   - Cross-browser validation

---

## 📚 Related Documentation

- [SHARED-COMPONENTS-FIX.md](./SHARED-COMPONENTS-FIX.md) - How we fixed the original issue
- [CLAUDE.md](../../CLAUDE.md) - Development guidelines
- [CSS-GUIDE.md](./CSS-GUIDE.md) - CSS architecture

---

*Last Updated: January 2025*
*Immortal Nexus - True Component Sharing for Eternal Consistency*