# Documentation Guide - What You Actually Need

**Last Updated**: 2025-10-21

This file explains which documentation to use for different purposes, and which can be archived/dropped.

---

## 📌 Essential Documentation (Keep These)

### 1. **CLAUDE.md** ✅ KEEP
**Purpose**: Project instructions for Claude AI
**Contains**: Overview, patterns, key files, common tasks
**Use**: Reference when asking Claude for help
**Frequency**: Update whenever architecture changes

### 2. **README.md** ✅ KEEP
**Purpose**: Project setup and getting started
**Contains**: Install steps, dev commands, basic architecture
**Use**: When onboarding new developers
**Frequency**: Update before shipping to new team members

### 3. **docs/AI_PLAYBOOK.md** ✅ KEEP
**Purpose**: Work guidelines and patterns
**Contains**: How to make changes, code standards, workflows
**Use**: Reference for development standards
**Frequency**: Update when patterns change

### 4. **docs/AI_AGENT_BRIEF.md** ✅ KEEP
**Purpose**: Complete architecture overview
**Contains**: System design, file structure, components
**Use**: Understanding the full system design
**Frequency**: Update major architectural changes

### 5. **CHAT_HISTORY_FEATURE.md** ✅ KEEP
**Purpose**: Chat history feature implementation guide
**Contains**: How chat persistence works, API endpoints, flows
**Use**: When working on chat-related features
**Frequency**: Update when chat system changes

### 6. **docs/CHAT_HISTORY_ARCHITECTURE.md** ✅ KEEP
**Purpose**: Visual diagrams and flows for chat system
**Contains**: System flow diagrams, database schema, data flows
**Use**: Understanding chat architecture visually
**Frequency**: Update when chat flows change

### 7. **TODO.md** ✅ KEEP
**Purpose**: Prioritized task list
**Contains**: Current work items, blockers, upcoming features
**Use**: Track project progress
**Frequency**: Update weekly

### 8. **CONTRIBUTING.md** ✅ KEEP
**Purpose**: Contribution guidelines
**Contains**: PR process, testing requirements, commit format
**Use**: When contributing to the project
**Frequency**: Update when workflows change

### 9. **AGENTS.md** ✅ KEEP (AI-specific)
**Purpose**: AI agent instructions and capabilities
**Contains**: Instructions for AI assistants working with the codebase
**Use**: By AI assistants to understand project context
**Frequency**: Update when agent patterns change
**Important**: Do NOT drop - essential for AI collaboration

---

## 📚 Reference Documentation (Keep for Now - Useful)

### 10. **IMPLEMENTATION_COMPLETE.md** 🟠 KEEP
**Purpose**: Record of the consolidation work completed
**Contains**: What was implemented, files changed, metrics
**Use**: Understand recent changes and improvements
**Frequency**: Keep as historical record

### 11. **docs/API_AGENT_BRIEF.md** 🟠 KEEP
**Purpose**: Detailed API specifications and routing
**Contains**: Endpoint definitions, UI routing system
**Use**: When working with API or UI routing
**Frequency**: Update when APIs change

---

## 🗑️ Review & Analysis Files (Can Drop After Review)

These were created for the code review process. They're useful for understanding the analysis, but redundant once implemented:

### ❌ DROP These Files:
- **CODE_REVIEW.md** - Detailed issue analysis (30 min read) - ARCHIVE
- **REVIEW_SUMMARY.md** - Issue table with priorities - ARCHIVE
- **REVIEW_CONSENSUS.md** - Architecture decisions - ARCHIVE
- **REVIEW_INDEX.md** - Navigation guide for review docs - ARCHIVE
- **ARCHITECTURE_ANALYSIS.md** - Visual analysis of issues - ARCHIVE
- **ACTION_PLAN.md** - Implementation plan (now completed) - ARCHIVE
- **EXECUTIVE_SUMMARY.md** - Executive overview - ARCHIVE
- **QUICK_START.txt** - Quick start guide (now outdated) - ARCHIVE
- **IMPLEMENTATION_SUMMARY.md** - Implementation summary - ARCHIVE
- **CHANGES_SUMMARY.txt** - List of changes - ARCHIVE

**Why drop?**
- They document the review/analysis process, not the final system
- Implementation is complete; plan is no longer needed
- They add noise for active development
- Can be recovered from git history if needed

---

## 📋 Minimum Documentation Set for Active Development

If space/clutter is an issue, you only need:

**Tier 1 (Absolutely Essential - DO NOT DROP):**
1. CLAUDE.md (AI instructions)
2. AGENTS.md (AI collaboration)
3. README.md
4. docs/AI_PLAYBOOK.md
5. TODO.md

**Tier 2 (Highly Useful):**
6. docs/AI_AGENT_BRIEF.md
7. CHAT_HISTORY_FEATURE.md
8. docs/CHAT_HISTORY_ARCHITECTURE.md
9. CONTRIBUTING.md

**Tier 3 (Reference):**
10. IMPLEMENTATION_COMPLETE.md
11. docs/API_AGENT_BRIEF.md

---

## 🎯 How to Use Docs Effectively

### For New Team Members
1. Start with: README.md
2. Read: docs/AI_PLAYBOOK.md (for patterns)
3. Reference: docs/AI_AGENT_BRIEF.md (for architecture)

### For Claude AI Help
1. Mention: CLAUDE.md is your guide
2. Reference: docs/AI_PLAYBOOK.md for patterns
3. Point to: Specific .md file for context

### For Active Development
1. Check: TODO.md for priorities
2. Reference: docs/AI_AGENT_BRIEF.md for arch
3. Follow: docs/AI_PLAYBOOK.md for patterns

### For Code Reviews
1. Use: CONTRIBUTING.md for standards
2. Reference: docs/AI_PLAYBOOK.md for patterns

---

## 📊 Documentation Maintenance

### Update Frequency:
- **CLAUDE.md**: When major architecture changes
- **README.md**: Before shipping to new people
- **AI_PLAYBOOK.md**: When development standards change
- **AI_AGENT_BRIEF.md**: When system design changes
- **CHAT_HISTORY_FEATURE.md**: When chat features change
- **TODO.md**: Weekly or when priorities shift
- **CONTRIBUTING.md**: When workflows change

### Archive (Keep in Git, Remove from Root):
- All REVIEW_*.md files → git history only
- All *_ANALYSIS.md files → git history only
- All *_SUMMARY.* files → git history only
- ACTION_PLAN.md → git history only

---

## 🗂️ Recommended Structure

After cleanup, your root should only have:
```
.
├── CLAUDE.md              (← AI instructions for Claude Code - DO NOT DROP)
├── AGENTS.md              (← AI collaboration patterns - DO NOT DROP)
├── README.md              (← Setup guide)
├── CONTRIBUTING.md        (← How to contribute)
├── TODO.md                (← Current priorities)
├── IMPLEMENTATION_COMPLETE.md  (← Recent changes)
│
├── docs/
│   ├── AI_PLAYBOOK.md     (← Dev standards)
│   ├── AI_AGENT_BRIEF.md  (← Architecture)
│   ├── CHAT_HISTORY_ARCHITECTURE.md
│   ├── API_AGENT_BRIEF.md
│   └── api/               (← API docs if needed)
│
├── CHAT_HISTORY_FEATURE.md (← Feature guide)
│
└── [source code]
```

**Key Notes:**
- CLAUDE.md and AGENTS.md are essential for AI collaboration - never drop them
- These enable Claude Code to work effectively with your codebase
- Keep them updated as architecture evolves

---

## 💾 Archive Process

To clean up, you can:

1. **Remove from root:**
   ```bash
   rm CODE_REVIEW.md REVIEW_*.md ARCHITECTURE_ANALYSIS.md
   rm ACTION_PLAN.md EXECUTIVE_SUMMARY.md QUICK_START.txt
   rm IMPLEMENTATION_SUMMARY.md CHANGES_SUMMARY.txt
   ```

2. **Add to .gitignore (optional):**
   ```
   # Archived documentation
   # See git history if needed
   ```

3. **They're preserved in git**, so you can always recover them:
   ```bash
   git log --diff-filter=D --summary | grep delete
   git checkout <commit>^ -- <filename>
   ```

---

## ✅ Final Checklist

**DO NOT DROP (Essential for AI & Development):**
- ✅ CLAUDE.md - Keep (AI instructions for Claude Code)
- ✅ AGENTS.md - Keep (AI collaboration patterns)
- ✅ README.md - Keep (onboarding)
- ✅ docs/AI_PLAYBOOK.md - Keep (patterns)
- ✅ docs/AI_AGENT_BRIEF.md - Keep (architecture)
- ✅ CHAT_HISTORY_FEATURE.md - Keep (feature doc)
- ✅ docs/CHAT_HISTORY_ARCHITECTURE.md - Keep (diagrams)
- ✅ TODO.md - Keep (active list)
- ✅ CONTRIBUTING.md - Keep (guidelines)
- ✅ IMPLEMENTATION_COMPLETE.md - Keep (recent work)
- ✅ docs/API_AGENT_BRIEF.md - Keep (API specs)

**Archive These (Review/Analysis docs - no longer needed):**
- ❌ CODE_REVIEW.md - Archive
- ❌ REVIEW_*.md - Archive
- ❌ ARCHITECTURE_ANALYSIS.md - Archive
- ❌ ACTION_PLAN.md - Archive
- ❌ EXECUTIVE_SUMMARY.md - Archive
- ❌ QUICK_START.txt - Archive
- ❌ IMPLEMENTATION_SUMMARY.md - Archive
- ❌ CHANGES_SUMMARY.txt - Archive

---

**Result**: Clean documentation set focused on active development, not review history.
