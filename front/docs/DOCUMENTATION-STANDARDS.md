# Documentation Standards & Maintenance Guide

**Purpose:** Keep Immortal Nexus documentation organized, up-to-date, and discoverable

**Last Updated:** 2025-10-28

---

## 🎯 Core Principles

### 1. **One Source of Truth**
- Never create overlapping documentation on the same topic
- If a topic has multiple docs, consolidate them immediately
- Check existing docs before creating new ones

### 2. **Document As You Go**
- Create documentation **during** development, not after
- Update relevant docs when making changes
- Don't let documentation debt accumulate

### 3. **Archive, Don't Delete**
- Completed work → archive with date
- Obsolete docs → archive with reason
- Historical context is valuable

### 4. **Master Index is Sacred**
- Every new doc must be added to `/front/docs/README.md`
- Update master index in the same commit as new doc
- Keep categories organized and logical

---

## 📝 When to Create Documentation

### **ALWAYS Document:**
- ✅ New features or systems
- ✅ Major refactors or architectural changes
- ✅ Troubleshooting procedures
- ✅ API changes or new endpoints
- ✅ Deployment procedures
- ✅ Development workflows

### **NEVER Document:**
- ❌ Temporary debugging notes (use comments instead)
- ❌ Personal TODO lists (use UNFINISHED-BUSINESS.md)
- ❌ One-off fixes that don't need reference
- ❌ Code that's self-documenting

### **MAYBE Document:**
- 🤔 Complex algorithms (consider code comments first)
- 🤔 Edge cases (might belong in code comments)
- 🤔 Implementation details (check if ARCHITECTURE.md covers it)

---

## 📂 Where to Put Documentation

### **Root Level (`/`):**
- **CLAUDE.md** - Instructions for AI assistants
- **README.md** - Project overview
- **UNFINISHED-BUSINESS.md** - Active task tracker

**Rule:** Keep root minimal - only 3-4 files max

### **Main Docs (`/front/docs/`):**
All other documentation goes here, organized by category.

### **Archives (`/front/docs/archive/`):**
Use dated folders: `archive/YYYY-MM/category-name/`

**Example:**
```
archive/
├── 2025-10/
│   ├── css-docs/
│   └── voting-docs/
└── 2025-11/
    └── feature-audits/
```

---

## ✍️ Documentation Workflow

### **Creating New Documentation:**

1. **Check for existing docs first**
   ```bash
   grep -ri "your topic" front/docs/
   ```

2. **Choose appropriate location**
   - Feature system? → `FEATURE-NAME-SYSTEM.md`
   - Troubleshooting? → Update `SITE-TROUBLESHOOTING.md` or create specific guide
   - Architecture? → Update `ARCHITECTURE.md` or create component doc

3. **Use standard header:**
   ```markdown
   # Document Title

   **Purpose:** Brief description
   **Last Updated:** YYYY-MM-DD
   **Status:** Active | Archived | In Progress

   ---
   ```

4. **Add to master index** (`front/docs/README.md`)
   - Find appropriate category
   - Add link with brief description
   - Commit together with new doc

5. **Update CHANGELOG.md**
   - Note significant documentation additions

### **Updating Existing Documentation:**

1. **Change the date**
   - Update "Last Updated" field
   - Add entry in changelog section if major update

2. **Keep history**
   - Don't delete old sections without reason
   - Mark deprecated sections clearly
   - Consider moving old content to archive

3. **Check for references**
   - Search for links to doc you're updating
   - Ensure changes don't break references

### **Archiving Documentation:**

**When to Archive:**
- ✅ Completed audit/investigation work
- ✅ Superseded by newer documentation
- ✅ Historical reference only
- ✅ Outdated guides (but keep for context)

**How to Archive:**

1. **Create dated archive folder:**
   ```bash
   mkdir -p front/docs/archive/YYYY-MM/category-name/
   ```

2. **Move file(s):**
   ```bash
   git mv front/docs/OLD-DOC.md front/docs/archive/YYYY-MM/category-name/
   ```

3. **Update master index:**
   - Remove from main listings
   - Add to "Archives" section

4. **Add archive note to new doc** (if superseding):
   ```markdown
   **Note:** This supersedes archived documentation:
   - [Old Doc Name](./archive/YYYY-MM/category-name/OLD-DOC.md)
   ```

---

## 🔍 Regular Maintenance

### **Quarterly Audit (Every 3 Months):**

**Checklist:**
- [ ] Review all active docs for accuracy
- [ ] Check for overlapping content
- [ ] Archive completed work
- [ ] Update master index
- [ ] Review UNFINISHED-BUSINESS.md
- [ ] Update CHANGELOG.md with quarter summary

**Schedule:**
- End of January, April, July, October

### **Per-Session Maintenance:**

**Before ending work session:**
- [ ] Updated all modified docs with new date
- [ ] Added new docs to master index
- [ ] Archived any completed audit/investigation docs
- [ ] Updated UNFINISHED-BUSINESS.md

---

## 📋 Documentation Templates

### **Feature Documentation Template:**

```markdown
# [Feature Name] System

**Purpose:** [One-line description]
**Status:** Active | In Development | Deprecated
**Last Updated:** YYYY-MM-DD

---

## Overview

[High-level description of what this feature does]

## Architecture

[How it's built, major components]

## Usage

[How to use/implement this feature]

## Files

- `path/to/file.js` - Description
- `path/to/style.css` - Description

## Related Documentation

- [Other Doc](./OTHER-DOC.md)

---

**Maintained By:** [Your name or AI assistant name]
```

### **Troubleshooting Entry Template:**

```markdown
## [Problem Description]

**Symptoms:**
- What the user sees
- Error messages

**Cause:**
- Why it happens

**Solution:**
1. Step-by-step fix
2. With code examples
3. And verification steps

**Prevention:**
- How to avoid this in future

**Related Issues:**
- Link to similar problems
```

### **Audit/Investigation Template:**

```markdown
# [Topic] Audit

**Date:** YYYY-MM-DD
**Purpose:** [Why this audit was performed]
**Status:** Complete | In Progress

---

## Findings

### Issues Discovered
1. [Issue description]
2. [Issue description]

### Recommendations
1. [Recommendation]
2. [Recommendation]

## Actions Taken

- [ ] Action item 1
- [ ] Action item 2

## Results

[What changed, metrics if applicable]

---

**Note:** This audit should be archived after completion to:
`front/docs/archive/YYYY-MM/audits/`
```

---

## 🚨 Red Flags - Signs Documentation Needs Attention

### **Immediate Action Required:**
- 🚩 Multiple docs covering same topic
- 🚩 Master index missing docs
- 🚩 Docs with "TEMPORARY" or "TODO" in title
- 🚩 More than 5 completed audits in root or main docs/

### **Schedule Cleanup:**
- ⚠️ Docs with dates >6 months old
- ⚠️ "Archive" folder with >10 items
- ⚠️ Master index has duplicate entries
- ⚠️ UNFINISHED-BUSINESS.md with completed items not archived

---

## 🎓 Best Practices

### **Writing Style:**

✅ **DO:**
- Use clear, descriptive titles
- Include "Last Updated" dates
- Link to related docs
- Use code examples
- Keep it scannable (headers, bullets, code blocks)
- Write for future you (or future developers)

❌ **DON'T:**
- Use vague titles ("Notes", "Stuff", "Misc")
- Leave docs without dates
- Duplicate content from other docs
- Use first-person unless in a decision log
- Write novels (be concise)

### **File Naming:**

✅ **GOOD:**
- `FEATURE-NAME-SYSTEM.md` - Feature documentation
- `COMPONENT-NAME-GUIDE.md` - Component guide
- `TOPIC-TROUBLESHOOTING.md` - Troubleshooting guide
- `AUDIT-TOPIC-2025.md` - Audit/investigation

❌ **BAD:**
- `notes.md`
- `temp-doc.md`
- `DRAFT-maybe-delete-later.md`
- `new-new-final-FINAL.md`

### **Linking:**

Always use **relative links** in markdown:
```markdown
✅ GOOD: [Architecture](./ARCHITECTURE.md)
❌ BAD:  [Architecture](/home/user/sites/Nexus/front/docs/ARCHITECTURE.md)
```

---

## 📊 Documentation Health Metrics

**Healthy Documentation:**
- ✅ Master index is 100% complete
- ✅ No overlapping docs on same topic
- ✅ All docs have update dates
- ✅ Completed work is archived
- ✅ Less than 40 active docs
- ✅ Archive is organized by date

**Needs Attention:**
- ⚠️ Master index <90% complete
- ⚠️ 2+ docs on same topic
- ⚠️ Some docs missing dates
- ⚠️ 40-50 active docs
- ⚠️ Completed work not archived

**Crisis Mode:**
- 🚨 Master index <75% complete
- 🚨 3+ overlapping docs
- 🚨 >50% docs without dates
- 🚨 >50 active docs
- 🚨 No archive structure

---

## 🔄 Documentation Lifecycle

```
┌─────────────────────────────────────────┐
│         CREATE DOCUMENTATION            │
│  - Check for existing docs first        │
│  - Use appropriate template             │
│  - Add to master index                  │
└──────────────┬──────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────┐
│         MAINTAIN DOCUMENTATION          │
│  - Update dates when modified           │
│  - Keep content accurate                │
│  - Consolidate if overlapping           │
└──────────────┬──────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────┐
│         ARCHIVE DOCUMENTATION           │
│  - When work is complete                │
│  - When superseded by new doc           │
│  - Move to dated archive folder         │
│  - Update master index                  │
└─────────────────────────────────────────┘
```

---

## 🤖 AI Assistant Responsibilities

When working with AI assistants (like Claude), they should:

1. **Check existing docs** before creating new ones
2. **Update master index** when adding docs
3. **Archive completed work** at end of sessions
4. **Update dates** on modified docs
5. **Flag overlapping** documentation for consolidation
6. **Suggest quarterly audits** when appropriate

---

## 📚 Further Reading

- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [DEVELOPMENT.md](./DEVELOPMENT.md) - Development workflow
- [CHANGELOG.md](./CHANGELOG.md) - Change history
- [AI-CONTEXT.md](./AI-CONTEXT.md) - AI assistant guidelines

---

**Last Major Overhaul:** 2025-10-28 (47 docs audited, consolidated, organized)

**Maintained By:** Immortal Claude (Documentation Curator) & Team
