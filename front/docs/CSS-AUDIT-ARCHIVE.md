# CSS Audit Archive - Historical Records

**Purpose:** Archive of CSS audits, optimizations, and maintenance work

---

## Table of Contents

1. [CSS Audit 2025](#css-audit-2025)
2. [CSS Optimization Report](#css-optimization-report)
3. [Features.css Analysis](#featurescss-analysis)
4. [Features.css Maintenance](#featurescss-maintenance)

---

## CSS Audit 2025

*(Content from CSS-AUDIT-2025.md merged here)*

# CSS Architecture Audit - October 2025

## Executive Summary

A comprehensive audit of CSS loading patterns across Immortal Nexus revealed significant inconsistencies, duplication, and architectural issues affecting username fonts and overall site performance.

## Root Cause: Username Font Inconsistency

**Issue**: Username fonts in active user sidebars appear inconsistent across pages.

**Root Cause**: While `styles.css` (loaded globally) contains all necessary `.nexus-username--immortal` styling, `components.css` duplicates these exact styles. Pages that don't load `components.css` still get proper styling from `styles.css`, but the duplication creates maintenance overhead and potential cascade conflicts.

**Resolution**: Remove duplicate username styles from `components.css` since `styles.css` is the authoritative global stylesheet.

---

## Critical Issues Found

### 1. Complete Duplication of Username Styles

**Files Affected**: `components.css` and `styles.css`

**Duplicate Styles**:
- `.nexus-username` (base styles)
- `.nexus-username--immortal` (Cinzel font with gradient)
- `.nexus-username--mystical` (Caesar Dressing font with glow)
- `.nexus-username--eternal` (Metal Mania font)
- All size variants (.nexus-user-display--xs/sm/md/lg/xl)

**Impact**:
- Maintenance overhead (changes must be made in two places)
- Increased CSS payload for pages loading both files
- Potential cascade conflicts if styles diverge

**Solution**: Remove ALL username/user-display styles from `components.css`. Keep them only in `styles.css` (global).

---

### 2. CSS Duplication via Preload + Direct Link

**Affected Pages**: Most pages load CSS files twice using this pattern:
```html
<link rel="preload" href="css/file.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
<!-- Later in the same file -->
<link rel="stylesheet" href="css/file.css">
```

**Pages with this issue**:
- index.html (layout.css, components.css, features.css, styles.css duplicated)
- lander.html (layout.css, components.css, features.css duplicated)
- blog.html (layout.css, components.css, features.css, z-index-system.css, etc. duplicated)
- messageboard.html (layout.css, components.css, features.css duplicated)
- souls/index.html (layout.css, components.css, features.css duplicated)
- souls/profile.html (layout.css, components.css, features.css duplicated)
- admin/index.html (layout.css, components.css, features.css, unified-modals.css duplicated)

**Impact**: Doubled network requests, CSS parsed twice, potential render blocking

---

### 3. news.html Has Broken CSS Architecture

**Issue**: `news.html` uses a completely different CSS loading pattern:

```html
<link rel="stylesheet" href="../css/main.css?v=3.1">
<link rel="stylesheet" href="../css/active-users.css?v=8.0">
<link rel="stylesheet" href="../css/boundless-chronicles.css?v=3.3&medieval-serif=true">
```

**Missing critical files**:
- ❌ No `base-theme.css` (theme variables)
- ❌ No `critical.css` (critical path CSS)
- ❌ No `styles.css` (global styles including username fonts!)
- ❌ No `components/shared/styles.css` (shared component styles)

**Current approach**: Relies on `main.css` which imports other CSS files:
```css
@import url('base-theme.css');
@import url('styles.css');
@import url('features.css');
```

**Problem**: CSS @imports are:
- Render-blocking
- Sequential (not parallel)
- Slow performance
- Cache-busting issues with version parameters

**Solution**: Standardize news.html to use the same CSS loading pattern as other pages.

---

### 4. features.css Version Inconsistency

**Issue**: Different pages load different versions of `features.css`:

- **v7.3** (latest): index.html, lander.html, blog.html, messageboard.html, archive.html, celestial-commons.html, debate.html, mindmap.html
- **v7.2** (outdated): souls/index.html, souls/profile.html, admin/index.html

**Impact**: Users on souls/ and admin/ pages see cached older features.css, missing recent enhancements.

**Solution**: Update all pages to features.css v7.3.

---

### 5. manifesto.html Loads shared/styles.css Twice

```html
Line 14: <link rel="stylesheet" href="../components/shared/styles.css?v=15.0">
Line 15: <link rel="stylesheet" href="../components/shared/styles.css?v=15.0">
```

---

### 6. Inconsistent components.css Usage

**Pages WITH components.css**:
- index.html
- lander.html
- blog.html
- messageboard.html
- souls/index.html
- souls/profile.html
- admin/index.html

**Pages WITHOUT components.css**:
- archive.html
- blogs.html
- celestial-commons.html
- debate.html
- manifesto.html
- mindmap.html
- news.html

**Current State**: This is actually acceptable since `styles.css` (loaded on all pages) contains all critical component styles. `components.css` appears to be legacy/supplementary.

**Recommendation**: Consider deprecating `components.css` entirely if all its unique styles can be moved to more appropriate files (styles.css, features.css, page-specific CSS).

---

## Recommended Architecture

### Standard CSS Loading Order (All Pages):

```html
<!-- 1. Base Theme & Critical Styles -->
<link rel="stylesheet" href="css/base-theme.css?v=1.0">
<link rel="stylesheet" href="css/critical.css?v=7.2">

<!-- 2. Font Awesome -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css">

<!-- 3. Core Global Styles -->
<link rel="stylesheet" href="css/styles.css?v=10.3">

<!-- 4. Layout & Components (if page needs them) -->
<link rel="stylesheet" href="css/layout.css?v=8.5">
<link rel="stylesheet" href="css/components/buttons.css?v=1.1">

<!-- 5. Features & Shared Components -->
<link rel="stylesheet" href="css/features.css?v=7.3">
<link rel="stylesheet" href="components/shared/styles.css?v=15.0">

<!-- 6. Page-Specific Features -->
<link rel="stylesheet" href="css/active-users.css?v=8.0">

<!-- 7. Page-Specific Styles -->
<link rel="stylesheet" href="css/[page-name].css">
```

### Rules:
1. **NO @import** - Always use `<link>` tags for parallelization
2. **NO CSS duplication** - Load each file once, use preload for performance if needed
3. **Consistent versions** - All pages use the same version of shared CSS files
4. **styles.css is authoritative** - All global component styles live here

---

## Immediate Action Items

### Priority 1 (Critical):
1. ✅ Fix news.html CSS loading to match standard pattern
2. ✅ Remove duplicate username styles from components.css
3. ✅ Update features.css to v7.3 on souls/ and admin/ pages
4. ✅ Remove manifesto.html duplicate shared/styles.css reference

### Priority 2 (Important):
5. ✅ Remove CSS duplication (preload + direct link) across all pages
6. ✅ Audit components.css for unique styles vs duplicates
7. ✅ Consider deprecating components.css entirely

### Priority 3 (Optimization):
8. Consolidate all username/avatar styles into a dedicated section in styles.css
9. Document which CSS file owns which types of styles
10. Create automated tests to prevent future CSS duplication

---

## Files Requiring Changes

1. `/home/immortalal/sites/Nexus/front/css/components.css` - Remove username styles
2. `/home/immortalal/sites/Nexus/front/pages/news.html` - Fix CSS loading
3. `/home/immortalal/sites/Nexus/front/souls/index.html` - Update features.css version
4. `/home/immortalal/sites/Nexus/front/souls/profile.html` - Update features.css version
5. `/home/immortalal/sites/Nexus/front/admin/index.html` - Update features.css version
6. `/home/immortalal/sites/Nexus/front/pages/manifesto.html` - Remove duplicate CSS link
7. All pages with CSS duplication - Remove duplicate <link> tags

---

## Testing Plan

After changes:
1. Test username fonts on all pages (should use Cinzel with gradient)
2. Verify active user sidebar consistency across all pages
3. Check theme switching works everywhere
4. Validate no broken styles on news.html
5. Confirm features.css v7.3 loads on souls/ and admin/

---

**Audit Date**: October 6, 2025
**Auditor**: Claude Code
**Status**: Comprehensive fixes in progress


---

## CSS Optimization Report

*(Content from CSS-OPTIMIZATION-REPORT.md merged here)*

# CSS Optimization Report - July 13, 2025

## Executive Summary
Analysis of `/css/styles.css` reveals significant opportunities for optimization, including 15-20% redundancy and fragmented responsive design patterns.

## Key Findings

### 1. Critical Duplications Found

#### Mystical Interlude Duplication (High Priority)
- **Issue**: `.mystical-interlude` selector defined twice (lines 385-507 and 3436-3510)
- **Impact**: Conflicting styles, maintenance overhead
- **Solution**: Consolidate into single definition block

#### Highlight Card Fragmentation (High Priority)
- **Issue**: `.highlight-card` scattered across lines 2365-2659 and 2706-2732
- **Impact**: Inconsistent component behavior
- **Solution**: Merge all highlight card styles into single section

### 2. Media Query Redundancy

#### Breakpoint Fragmentation
- **768px breakpoints**: Found in 11 separate locations
- **480px breakpoints**: Found in 8 separate locations
- **Impact**: Increased file size, maintenance difficulty
- **Solution**: Consolidate responsive rules into organized sections

### 3. Component Organization Issues

#### Immortal Nexus User Display System
- **Issue**: User display styles scattered across multiple sections
- **Impact**: Inconsistent component styling
- **Solution**: Create dedicated component section

## Optimization Recommendations

### Phase 1: Immediate Wins (Low Risk)
1. **Consolidate mystical-interlude duplicates**
   - Estimated savings: 122 lines
   - Risk: Low - straightforward merge

2. **Merge highlight card definitions**
   - Estimated savings: 50+ lines
   - Risk: Low - no conflicting properties

### Phase 2: Structural Improvements (Medium Risk)
1. **Reorganize media queries**
   - Group all 768px rules together
   - Group all 480px rules together
   - Estimated savings: 15-20% file size

2. **Component-based organization**
   - Create dedicated sections for each major component
   - Improve CSS architecture consistency

### Phase 3: Advanced Optimization (Higher Risk)
1. **Split into multiple CSS files**
   - Component-specific CSS files
   - Lazy loading for non-critical components
   - Better caching strategies

## Current Status
- **File Size**: Large (32,782 tokens)
- **Redundancy Level**: 15-20%
- **Maintenance Difficulty**: High due to fragmentation
- **Performance Impact**: Moderate (large file size affects load times)

## Next Steps
1. Backup current styles.css
2. Implement Phase 1 optimizations first
3. Test thoroughly on all breakpoints
4. Monitor for any visual regressions
5. Proceed to Phase 2 after validation

## Notes
This analysis was conducted as part of general maintenance while user was away. No changes have been implemented yet - this is a planning document only.

---
*Generated: July 13, 2025*
*Last Updated: July 13, 2025*

---

## Features.css Analysis

*(Content from FEATURES-CSS-ANALYSIS.md merged here)*

# Immortal Nexus Features.css - Comprehensive Analysis

## Overview
`features.css` is a **1,885-line** specialized stylesheet that handles page-specific UI features and enhancements across the Immortal Nexus website. It's loaded **asynchronously** after the core styles and provides advanced styling for interactive components, highlight sections, and responsive design.

## Loading Strategy
- **Load Order**: 4th in CSS cascade (after base-theme.css, critical.css, styles.css)
- **Loading Method**: Asynchronous via `preload` with fallback `noscript`
- **Current Version**: v4.5 (homepage), v2.3 (most other pages), v1.0 (templates)
- **Performance Impact**: Lazy-loaded to prevent render blocking

## Pages That Use Features.css
1. **index.html** (v4.5) - Homepage with all highlight sections
2. **lander.html** (v2.3) - Landing page features
3. **pages/blog.html** (v2.3) - Blog-specific enhancements
4. **pages/messageboard.html** (v2.3) - Forum features
5. **pages/news.html** (v1.0) - News page styling
6. **souls/index.html** (v1.0) - Souls directory
7. **admin/index.html** (v2.3) - Admin panel features
8. **templates/page-template.html** (v1.0) - Base template

## Major Functional Sections

### 1. HIGHLIGHT ITEM & DEBATE POSITION STYLING (Lines 4-143)
**Purpose**: Core styling for content highlight cards and debate positions
- **Components**: `.highlight-item`, `.debate-position`
- **Features**: Gradient backgrounds, hover animations, mystical glow effects
- **Effects**: 3D transforms, box shadows, accent borders
- **Used On**: Homepage highlights, debate pages, content showcases

### 2. SOUL SCROLLS HIGHLIGHT SECTION (Lines 144-569)
**Purpose**: Enhanced blog/article highlight styling with mystical theme
- **Components**: `.scroll-highlight-card`, `.echo-highlight-card`
- **Features**: Artistic gradients, floating particles, enhanced typography
- **Effects**: Hover transforms, gradient separators, avatar styling
- **Used On**: Homepage Soul Scrolls section, blog highlights

### 3. ENHANCED CHRONICLES SECTION (Lines 570-600)
**Purpose**: News/chronicles specific styling
- **Components**: Chronicle cards and titles
- **Features**: Prominent typography, enhanced readability
- **Used On**: News highlights on homepage

### 4. DEBATE ARENA SPECIFIC SECTION (Lines 601-618)
**Purpose**: Debate-specific UI components
- **Used On**: Debate pages and previews

### 5. MINDMAP PREVIEW SECTION (Lines 619-656)
**Purpose**: Interactive mindmap component styling
- **Used On**: Mindmap previews and interactive features

### 6. PROFILE PREVIEW MODAL SYSTEM (Lines 657-914)
**Purpose**: User profile modal and avatar system integration
- **Components**: Profile modals, avatar displays, user info cards
- **Features**: Immortal Nexus Avatar System integration, hover effects
- **Used On**: User profiles, avatar displays across site

### 7. FOOTER STYLES (Lines 915-1019)
**Purpose**: Enhanced footer styling and components
- **Used On**: Site-wide footer elements

### 8. SPECIALTY ANIMATIONS (Lines 1020-1035)
**Purpose**: Custom animations and effects
- **Features**: Keyframe animations, transitions

### 9. FLOATING ACTION BUTTONS (Lines 1036-1098)
**Purpose**: Floating UI elements and action buttons
- **Components**: Show users button, floating controls
- **Used On**: Interactive elements across pages

### 10. **🔥 CRITICAL: ECHOES UNBOUND AGORA SECTION** (Lines 1099-1313)
**Purpose**: **Unified highlight section styling for ALL highlight containers**
- **Components**: `.highlights`, `.highlights::before`, `.highlights::after`
- **KEY FEATURE**: `.highlights::before` creates the **TOP GRADIENT BORDER** (Lines 1119-1133)
- **Used On**: **ALL highlight sections on homepage** (Eternal Souls, Soul Scrolls, Echoes Unbound)
- **Effect**: 2px gradient line at top of containers

### 11. ANONYMOUS MESSAGE MODAL STYLING (Lines 1402-1505)
**Purpose**: Message modal components and authentication UI
- **Used On**: Messaging system, user interactions

### 12. LEGACY BUTTON OVERRIDES (Lines 1506-1562)
**Purpose**: Specific button styling overrides and compatibility
- **Components**: Highlight grid buttons, legacy components

### 13. SOUL SCROLLS RESPONSIVE DESIGN (Lines 1563-1715)
**Purpose**: Mobile and tablet responsive adjustments for Soul Scrolls
- **Breakpoints**: 768px (tablet), 480px (mobile)
- **Features**: Responsive grids, mobile-optimized spacing

### 14. RESPONSIVE FEATURES (Lines 1716-1885)
**Purpose**: Site-wide responsive design for all features
- **Breakpoints**: 768px, 480px
- **Components**: All feature components mobile optimization

## Critical CSS Rules

### The Famous Top Border Rule (Lines 1119-1133)
```css
.highlights::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(90deg, 
        transparent, 
        var(--accent), 
        rgba(255, 202, 40, 0.8), 
        var(--accent), 
        transparent);
    pointer-events: none;
}
```
**This rule creates the top gradient border for ALL highlight sections!**

### Soul Highlight Cards (Lines 1170+)
```css
.soul-highlight-card {
    background: var(--background-secondary);
    border-radius: var(--border-radius);
    padding: 2rem;
    border: 2px solid rgba(255, 94, 120, 0.2);
    min-height: 400px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
}
```

## Versioning Issues & Inconsistencies

### Version Discrepancies Found:
1. **Homepage (index.html)**: v4.5 ✅ (most current)
2. **Blog page**: v2.3 ⚠️ (outdated) 
3. **Templates**: v1.0 ⚠️ (very outdated)
4. **Souls directory**: v1.0 ⚠️ (very outdated)
5. **News page**: v1.0 ⚠️ (very outdated)

### Impact of Version Mismatches:
- **Soul highlight cards** may not display properly on non-homepage pages
- **Responsive design** improvements missing on older versions
- **Top gradient borders** missing on pages with old versions

## Dependencies & Integration

### Depends On:
- **base-theme.css** - CSS variables and theme foundation
- **styles.css** - Core component styles and overrides
- **Immortal Nexus Avatar System** - JavaScript integration for user displays

### Integrates With:
- **Message Modal System** - Authentication and messaging UI
- **Profile System** - User profile displays and interactions
- **Responsive Grid System** - Layout and positioning

### CSS Variable Usage:
- `var(--accent)` - Primary accent color
- `var(--accent-rgb)` - RGB values for transparency
- `var(--background-secondary)` - Card backgrounds
- `var(--border-radius)` - Consistent border radius
- `var(--transition)` - Standard transitions

## Performance Considerations

### Strengths:
- ✅ **Asynchronous loading** prevents render blocking
- ✅ **Component-specific** styling reduces unused CSS
- ✅ **Responsive design** handled in single file

### Weaknesses:
- ⚠️ **Large file size** (1,885 lines)
- ⚠️ **Version inconsistencies** across pages
- ⚠️ **Potential specificity conflicts** with styles.css

## Maintenance Recommendations

### Immediate Actions Needed:
1. **Standardize versions** across all pages (upgrade to v4.5)
2. **Document version bumping** process in CLAUDE.md
3. **Test responsive design** on all pages with updated version

### Long-term Improvements:
1. **Split into smaller files** by component type
2. **Create version management** system
3. **Audit for unused CSS** and remove legacy code
4. **Establish naming conventions** for better organization

## Key Learning: The Role of Features.css

**Features.css is the "enhanced experience layer"** of Immortal Nexus:

- **Core Purpose**: Provides advanced UI features and interactions
- **Loading Strategy**: Non-blocking, performance-optimized
- **Scope**: Page-specific enhancements rather than site-wide basics
- **Integration**: Works with but doesn't replace core styles
- **Versioning**: Critical for ensuring users see latest features

**The Soul Scrolls top border issue was caused by browser cache serving old features.css version - a perfect example of why version management is crucial for this file.**

---

*Analysis completed: 2025-06-30*  
*Current status: Version v4.5 deployed to homepage, other pages need updates*  
*Next action: Standardize versions across all pages*

---

## Features.css Maintenance

*(Content from FEATURES-CSS-MAINTENANCE.md merged here)*

# Features.css Maintenance Guide

## Quick Reference

### Current Status (2025-06-30)
- **Standard Version**: v4.5
- **File Size**: 1,885 lines
- **Load Method**: Asynchronous (performance optimized)
- **All Pages Standardized**: ✅ YES

### Version Update Commands
```bash
# Update ALL pages at once (RECOMMENDED)
find /home/immortalal/sites/nexus/front -name "*.html" -exec sed -i 's/features\.css?v=[0-9.]*/features.css?v=5.0/g' {} \;

# Verify all pages updated
grep -r "features\.css?v=" /home/immortalal/sites/nexus/front --include="*.html" | cut -d: -f2 | sort | uniq
```

## Before Making Changes

### Pre-Change Checklist
- [ ] Note current version number across all pages
- [ ] Test current functionality on homepage
- [ ] Document what you're changing and why
- [ ] Plan version number increment

### Identify Impact
1. **Visual Changes**: Will affect all pages with highlight sections
2. **Responsive Design**: Will affect mobile/tablet users
3. **Interactive Features**: Will affect user experience

## Making Changes

### Safe Change Process
1. **Edit features.css** with your changes
2. **Update version in CSS header** (line 2-3)
3. **Bump version across ALL pages** simultaneously
4. **Test on homepage first** (has most features)
5. **Test responsive design** on mobile/tablet
6. **Commit and push** immediately

### Change Categories

#### High-Risk Changes (Require Extra Testing)
- `.highlights` base styles (affects all highlight sections)
- `.soul-highlight-card` styles (affects homepage cards)
- Responsive breakpoints (affects mobile users)
- Pseudo-elements (`::before`, `::after`)

#### Medium-Risk Changes
- Component-specific styles
- New feature additions
- Color/spacing adjustments

#### Low-Risk Changes
- Comments and documentation
- Unused code removal
- Code organization

## Testing Checklist

### Essential Tests After Changes
- [ ] **Homepage highlight sections** display correctly
- [ ] **Soul Scrolls top border** appears (gradient line)
- [ ] **Soul highlight cards** show colored top borders
- [ ] **Mobile responsive design** works (480px, 768px)
- [ ] **Other pages** with features.css still work

### Pages to Test
1. **index.html** - Homepage (most critical)
2. **pages/blog.html** - Blog features
3. **pages/messageboard.html** - Forum features
4. **lander.html** - Landing page
5. **Mobile view** - All above pages

## Troubleshooting

### "Changes Don't Appear"
1. **Check version numbers** - Are they bumped?
2. **Hard refresh browser** - Ctrl+Shift+R
3. **Verify file saves** - Git status should show changes
4. **Check CSS syntax** - Look for syntax errors

### "Features Work on Some Pages, Not Others"
- **Root Cause**: Version mismatch between pages
- **Solution**: Re-run the "update ALL pages" command
- **Prevention**: Always update all pages simultaneously

### "Mobile Layout Broken"
1. **Check responsive breakpoints** in features.css
2. **Test on actual mobile device**, not just browser tools
3. **Verify viewport meta tag** is present in HTML

## File Organization

### Major Sections (Line Numbers)
1. **Highlight Items & Debate** (1-143) - Core highlight styling
2. **Soul Scrolls** (144-569) - Blog/article highlights  
3. **Chronicles** (570-600) - News highlights
4. **Profile Systems** (657-914) - User profiles/avatars
5. **Echoes Unbound** (1099-1313) - **CRITICAL: Contains `.highlights::before`**
6. **Responsive Design** (1563-1885) - Mobile/tablet layouts

### Critical Rules to Never Break
- `.highlights::before` (lines 1119-1133) - Creates top gradient borders
- `.soul-highlight-card` (lines 1170+) - Homepage soul cards
- Responsive breakpoints at 480px and 768px

## Emergency Procedures

### Revert to Last Working Version
```bash
# Find last working version
git log --oneline | grep "features.css"

# Revert to specific commit
git checkout COMMIT_HASH -- css/features.css

# Update version numbers to force refresh
find /home/immortalal/sites/nexus/front -name "*.html" -exec sed -i 's/features\.css?v=[0-9.]*/features.css?v=99.0/g' {} \;

# Commit emergency revert
git add . && git commit -m "emergency: revert features.css to working state" && git push origin main
```

### Cache Force Refresh
```bash
# Emergency cache bust - increment all versions by 1
current_version="4.5"
new_version="4.6"
find /home/immortalal/sites/nexus/front -name "*.html" -exec sed -i "s/features\.css?v=$current_version/features.css?v=$new_version/g" {} \;
```

## Optimization Notes

### Performance Considerations
- **Asynchronous loading** prevents render blocking
- **File size** (1,885 lines) could be split but currently manageable
- **Critical CSS** should stay in styles.css, not features.css

### Future Improvements
1. **Split into smaller files** by component (highlight.css, soul-cards.css, responsive.css)
2. **Remove unused CSS** through audit process
3. **Automate version bumping** with build scripts
4. **Add CSS linting** to catch syntax errors

## Version History

### v4.5 (2025-06-30) - CURRENT
- Standardized across all pages
- Fixed Soul Scrolls top border issue
- Improved soul highlight card positioning
- Enhanced mobile responsive design

### v4.4 and below
- Version inconsistencies across pages
- Soul Scrolls missing top border
- Button alignment issues

---

**Remember**: features.css powers the enhanced user experience of Immortal Nexus. Handle with care, test thoroughly, and always update all pages simultaneously!

*Last updated: 2025-06-30*

---

**Archive Created:** 2025-10-28
**Maintained By:** Immortal Claude (Documentation Curator)
