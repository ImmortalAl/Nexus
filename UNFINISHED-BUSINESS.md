# Immortal Nexus - Unfinished Business Log

**Purpose:** Track incomplete tasks and technical debt for future completion

---

## 🚧 ACTIVE TASKS (Currently Being Worked On)

### Task B: Z-Index System Overhaul (NEXT IN QUEUE)
- **Status:** Not started
- **Priority:** CRITICAL
- **Issue:** 6 competing z-index systems causing modal/overlay conflicts
- **Files Affected:**
  - `front/css/z-index-system.css` (centralized system being ignored)
  - `front/components/shared/styles.css` (945 !important declarations)
  - `front/components/shared/active-users.css` (z-index wars)
- **Estimated Effort:** 2-3 hours
- **Decision Required:** Enforce centralized system OR acknowledge chaos

---

## ✅ COMPLETED TASKS

### Task A: Console Spam Removal (COMPLETED ✅)
- **Status:** 100% complete (All debug spam eliminated!)
- **Completed:** 2025-10-08
- **Assignee:** Immortal Claude (Professor Oak - Bug Hunter)
- **Files Cleaned:**
  - ✅ `front/sw.js` (9 console.log removed)
  - ✅ `front/components/shared/activeUsers.js` (1 console.warn removed)
  - ✅ `front/js/shared/unifiedVoting.js` (2 console.log removed)
  - ✅ `front/components/shared/authorIdentityCard.js` (2 console.log removed)
  - **Total: 14 debug statements removed**
- **Final Console Statement Count:**
  - console.log: 0 (ALL CLEANED! ✅)
  - console.warn: 41 (all legitimate warnings)
  - console.error: 205 (all legitimate error logging)
  - **Total: 247 console statements (all legitimate)**
- **Achievement:** Frontend is now production-clean! No more debug spam cluttering browser consoles.

---

## 📋 QUEUED TASKS (Path 2 - Bug Hunt)

### Task C: Split blog.js Monolith (MAJOR REFACTOR)
- **Status:** Not started
- **Priority:** HIGH
- **Issue:** `front/js/blog.js` is 1997 lines (should be <300 per file)
- **Target:** Split into modules:
  - `blog-api.js` - API calls and data fetching
  - `blog-modal.js` - Modal management
  - `blog-voting.js` - Voting system
  - `blog-comments.js` - Comments system
  - `blog-editor.js` - Rich text editing
  - `blog-ui.js` - UI state management
- **Estimated Effort:** 4-6 hours
- **Recommendation:** Use Claude Opus for this task
- **User Decision:** Awaiting approval to enable Opus

---

## 🐛 BACKLOG (Path 2 - Remaining Bugs)

### Priority: CRITICAL
1. **Empty Catch Blocks** (9 instances) - Silent error swallowing
2. **Service Worker Complete Audit** - Beyond console cleanup

### Priority: HIGH
3. **Hardcoded API URLs** (23 files) - Config system being ignored
4. **File Splitting** - Additional monolithic files:
   - `front/js/admin/analytics.js` (948 lines)
   - `front/js/main.js` (852 lines)
   - `front/js/scripts.js` (797 lines)
5. **Inline Styles Removal** (67 instances) - Break theme switching

### Priority: MEDIUM
6. **!important Overload** (945 declarations) - CSS specificity arms race
7. **Deep Nesting Refactor** (4 files) - Cognitive complexity reduction
8. **Global Namespace Cleanup** (106 window.* assignments)
9. **setTimeout/setInterval Audit** (58 instances) - Replace with better patterns
10. **Magic Numbers** - Add named constants throughout codebase
11. **Duplicate Code Extraction** - Centralize repeated patterns

### Priority: LOW
12. **Error Message Standardization** - Consistent user-facing messages
13. **Variable Naming Convention** - Choose and enforce one style
14. **Dead Code Removal** - Remove unused files (news-hotfix.js, etc.)

---

## 📊 PATH PLANNING

### ✅ Path 1: Fix Avatars & Sidebar (COMPLETED)
- Fixed script loading order
- Added missing CSS files
- Sidebar now consistent across all pages

### 🔄 Path 2: Bug Hunt (IN PROGRESS - 20% complete)
- ✅ Task A: Console cleanup (COMPLETED - All debug spam eliminated!)
- ⏳ Task B: Z-index overhaul (NEXT IN QUEUE)
- ⏳ Task C: Split blog.js (QUEUED)

### ⏳ Path 3: Enhancements (AWAITING PLAN MODE)
- **REMINDER:** User must be reminded to use PLAN MODE before starting Path 3
- Will require discussion and planning
- No specific tasks defined yet

### ⏳ Path 4: Code Quality Crusade (NOT STARTED)
- Clean up remaining issues from Path 2
- Performance optimizations
- Refactor duplicated code

### ⏳ Path 5: Documentation & Organization (NOT STARTED)
- Update documentation
- Create developer guides
- Organize project structure

---

## 📝 NOTES & DECISIONS

### Architectural Decisions Needed
1. **Z-Index System:** Enforce centralized OR delete and document chaos?
2. **API Config:** Enforce centralized OR accept hardcoded fallbacks?
3. **Module System:** Migrate to ES6 modules OR keep window.* pattern?
4. **CSS Methodology:** Implement BEM/similar OR accept current approach?

### User Preferences
- Prefers thorough, careful work over speed
- Values being kept informed of progress
- Wants major features planned in PLAN MODE first
- Appreciates Immortal Claude's characterization 🧙‍♂️

---

**Last Updated:** 2025-10-08
**Maintained By:** Immortal Claude (Merlin the CSS Wizard / Professor Oak the Bug Hunter)
