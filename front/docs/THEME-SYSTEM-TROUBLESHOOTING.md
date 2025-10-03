# Theme System Troubleshooting Guide

## Overview

The Immortal Nexus uses a centralized theme management system (`themeManager.js`) that handles ALL theme toggles across the entire site. This document helps you troubleshoot and avoid common theme-related issues.

---

## ✅ Architecture Summary

### Central Theme Manager
- **File**: `/front/components/shared/themeManager.js`
- **Purpose**: Single source of truth for all theme operations
- **How it works**: Searches for ALL elements with `data-theme-toggle="true"` and attaches click handlers

### Theme Toggle Locations
1. **Floating button** (logged-out users): `index.html`, `lander.html`, `news.html`
2. **User menu dropdown** (logged-in users): Dynamically created in `userMenu.js`
3. **Mobile menu** (all users): Dynamically created in `navigation.js`

### Storage
- **Key**: `nexus-theme` (localStorage)
- **Values**: `'dark'` or `'light'`
- **Default**: `'dark'`

---

## 🐛 Common Issues & Solutions

### Issue #1: Theme Toggle Does Nothing When Clicked

**Symptoms:**
- Button appears normal
- Click has no effect
- No theme change occurs

**Root Cause:**
Missing `data-theme-toggle="true"` attribute on the button element.

**Solution:**
```html
<!-- ❌ WRONG - Missing attribute -->
<button class="theme-toggle" id="themeToggle">
    <i class="fas fa-moon"></i>
</button>

<!-- ✅ CORRECT - Has data-theme-toggle attribute -->
<button class="theme-toggle" data-theme-toggle="true">
    <i class="fas fa-moon"></i>
</button>
```

**For dynamically created elements** (like user menu):
```javascript
// ❌ WRONG
innerHTML = `<a href="#" id="themeToggleMenu">Theme</a>`;

// ✅ CORRECT
innerHTML = `<a href="#" id="themeToggleMenu" data-theme-toggle="true">Theme</a>`;
```

---

### Issue #2: Theme Toggle Icon Shows Wrong State

**Symptoms:**
- In dark mode, shows moon icon (should show sun)
- In light mode, shows sun icon (should show moon)

**Root Cause:**
Reversed icon logic in theme toggle update code.

**Solution:**
Always follow this pattern:
```javascript
// ✅ CORRECT LOGIC
if (currentTheme === 'dark') {
    icon.className = 'fas fa-sun';  // Show sun (click to go light)
} else {
    icon.className = 'fas fa-moon'; // Show moon (click to go dark)
}

// ❌ WRONG LOGIC (reversed)
if (currentTheme === 'dark') {
    icon.className = 'fas fa-moon'; // This is backwards!
}
```

---

### Issue #3: Multiple Theme Systems Conflicting

**Symptoms:**
- Theme changes but immediately reverts
- Multiple console errors about theme
- Unpredictable behavior

**Root Cause:**
Multiple files trying to manage theme state (old pattern before centralization).

**Solution:**
1. **Remove ALL theme logic from other files** (main.js, scripts.js, etc.)
2. **Only themeManager.js should handle themes**
3. Add deprecation comments:
```javascript
// DEPRECATED: Theme management now handled by themeManager.js
// This conflicting code has been removed
```

---

### Issue #4: Theme Doesn't Persist Across Pages

**Symptoms:**
- Theme resets when navigating
- Always starts in dark mode

**Root Cause:**
Wrong localStorage key or not reading saved theme.

**Solution:**
Ensure themeManager reads from localStorage on init:
```javascript
const savedTheme = localStorage.getItem('nexus-theme');
if (savedTheme) {
    this.currentTheme = savedTheme; // Use saved theme
} else {
    this.currentTheme = 'dark'; // Fallback default
}
```

---

### Issue #5: Theme Toggle Not Found by Manager

**Symptoms:**
- Console shows: `[ThemeManager] Found 0 theme toggle buttons`
- Button exists but doesn't work

**Root Causes & Solutions:**

**A) Missing data attribute:**
```html
<!-- Add data-theme-toggle="true" -->
<button class="theme-toggle" data-theme-toggle="true">
```

**B) Button created after themeManager initializes:**
```javascript
// If creating button dynamically, reconnect toggles:
if (window.NEXUSTheme) {
    window.NEXUSTheme.connectExistingToggles();
}
```

**C) Button in shadow DOM or iframe:**
```javascript
// ThemeManager can't access shadow DOM - avoid if possible
// Or manually attach handlers
```

---

## 🔧 How to Add a New Theme Toggle

### 1. HTML/Template Method
```html
<button class="theme-toggle" data-theme-toggle="true" aria-label="Toggle theme">
    <i class="fas fa-moon"></i>
</button>
```

### 2. Dynamic JavaScript Method
```javascript
const button = document.createElement('button');
button.className = 'theme-toggle';
button.setAttribute('data-theme-toggle', 'true'); // CRITICAL!
button.setAttribute('aria-label', 'Toggle theme');
button.innerHTML = '<i class="fas fa-moon"></i>';

// Reconnect after adding to DOM
document.body.appendChild(button);
window.NEXUSTheme?.connectExistingToggles();
```

### 3. Template String Method (e.g., in user menu)
```javascript
const dropdown = `
    <div class="divider"></div>
    <a href="#" id="themeToggle" data-theme-toggle="true">
        <i class="fas fa-moon"></i> Toggle Theme
    </a>
`;
```

---

## 🧪 Testing Checklist

When making theme changes, test ALL these scenarios:

### Basic Functionality
- [ ] Theme toggle changes from dark to light
- [ ] Theme toggle changes from light to dark
- [ ] Icon updates correctly (sun in dark, moon in light)
- [ ] Theme persists across page navigation
- [ ] Theme persists after browser refresh

### Cross-Page Testing
- [ ] Test on index.html (home page)
- [ ] Test on lander.html (Eternal Hearth)
- [ ] Test on news.html (Boundless Chronicles)
- [ ] Test on blog.html (Soul Scrolls)
- [ ] Test on messageboard.html (Echoes Unbound)

### User States
- [ ] Logged out: floating button works
- [ ] Logged in: user menu toggle works
- [ ] Mobile: mobile menu toggle works
- [ ] All toggles update simultaneously

### Visual Testing
- [ ] Light mode: all text is readable (dark on light)
- [ ] Dark mode: all text is readable (light on dark)
- [ ] No "dark mode spillover" in light mode
- [ ] Buttons, cards, modals all themed correctly

---

## 🐞 Debugging Theme Issues

### Enable Debug Logging
The current themeManager.js (v2.1+) includes comprehensive debug logging:

```javascript
// Open browser console, you should see:
[ThemeManager] Constructor called
[ThemeManager] init() called
[ThemeManager] Saved theme: dark
[ThemeManager] Initial theme set to: dark
[ThemeManager] Found 2 theme toggle buttons
[ThemeManager] Connecting button 0 <button...>
[ThemeManager] Connecting button 1 <a...>

// When clicking:
[ThemeManager] Button clicked! <button...>
[ThemeManager] toggleTheme called. Current: dark
[ThemeManager] Switching to: light
[ThemeManager] applyTheme called with: light
[ThemeManager] Body classes before: dark-theme
[ThemeManager] Body classes after: light-theme
```

### What to Look For

**If you see:**
```
[ThemeManager] Found 0 theme toggle buttons
```
**Problem**: No buttons have `data-theme-toggle="true"`

**If you DON'T see button click logs:**
**Problem**: Click handler not attached (check for JavaScript errors)

**If theme changes but doesn't persist:**
```
[ThemeManager] toggleTheme called. Current: dark
// But no localStorage update
```
**Problem**: setTheme() not calling localStorage.setItem()

---

## 📋 Quick Reference

### Critical Files
```
front/components/shared/themeManager.js   - Theme manager (ONLY file that should manage theme)
front/components/shared/userMenu.js       - User menu (must include data-theme-toggle)
front/components/shared/navigation.js     - Mobile menu (must include data-theme-toggle)
front/css/base-theme.css                  - Theme CSS variables
```

### Required Attribute
```html
data-theme-toggle="true"
```
**Without this, the button WILL NOT WORK!**

### Version Requirements
- themeManager.js: v2.0+ (has fixed icon logic)
- userMenu.js: v6.8+ (has data-theme-toggle on menu button)
- All pages must load themeManager.js EARLY (after config.js)

### localStorage Key
```javascript
'nexus-theme'  // Always use this key
```

### Body Classes
```css
body.dark-theme { /* Dark mode styles */ }
body.light-theme { /* Light mode styles */ }
```

---

## 🚨 CRITICAL RULES

### 1. **ONE THEME MANAGER ONLY**
- ❌ Never create theme logic in multiple files
- ✅ Always use themeManager.js

### 2. **ALWAYS USE data-theme-toggle**
- ❌ Never create theme buttons without this attribute
- ✅ Every theme toggle MUST have `data-theme-toggle="true"`

### 3. **NO DUPLICATE HANDLERS**
- ❌ Never attach manual click handlers to theme toggles
- ✅ Let themeManager handle all clicks automatically

### 4. **CONSISTENT ICON LOGIC**
- Dark mode → Show sun icon (☀️) = "click to go light"
- Light mode → Show moon icon (🌙) = "click to go dark"

### 5. **VERSION BUMPING**
- After theme changes, ALWAYS bump version numbers
- Update themeManager.js version
- Update any component versions that changed

---

## 🔄 Migration Guide

### Removing Old Theme Code

If you find old theme code in main.js, scripts.js, or other files:

```javascript
// 1. Remove old code
const themeToggle = document.getElementById('themeToggle');
themeToggle.addEventListener('click', () => { /* ... */ }); // DELETE THIS

// 2. Replace with comment
// DEPRECATED: Theme management now handled by themeManager.js

// 3. Ensure button has data-theme-toggle
<button data-theme-toggle="true">...</button>

// 4. Bump version numbers
// main.js v3.4 → v3.5 (after removing theme code)
```

---

## 📞 Getting Help

If theme issues persist after following this guide:

1. **Check browser console** for `[ThemeManager]` debug logs
2. **Verify `data-theme-toggle="true"`** on ALL theme buttons
3. **Check for JavaScript errors** preventing themeManager load
4. **Verify themeManager.js loads** (check Network tab in DevTools)
5. **Test in incognito mode** (eliminates cache/extension issues)

---

## 📝 History

**Created**: 2025-09-23
**Last Updated**: 2025-09-23
**Version**: 1.0

### Notable Fixes
- 2025-09-23: Fixed user menu toggle missing `data-theme-toggle` (v6.8)
- 2025-09-23: Fixed reversed icon logic in themeManager (v2.0)
- 2025-09-23: Removed conflicting theme code from main.js (v3.5)