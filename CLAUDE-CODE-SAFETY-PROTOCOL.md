# Claude Code Safety Protocol

## Universal Safety System for All Projects

**Version:** 1.0
**Codeword:** `cook`
**Author:** For use with Anthropic Claude Code CLI

---

## 🎯 Purpose

This safety system prevents data loss from AI-initiated git operations by:
1. **Automatic backups** before every commit
2. **Codeword confirmation** for destructive operations
3. **Easy restoration** from any backup point
4. **Blocking dangerous operations** (force push to main, hard resets)

---

## 📦 Quick Start

### Installation (New Project)

```bash
# Copy setup-claude-safety.sh to your project root
# Then run:
./setup-claude-safety.sh
```

This creates:
- `.backups/` - Backup storage (gitignored)
- `scripts/backup-state.sh` - Create backups
- `scripts/restore-backup.sh` - Restore backups
- `scripts/list-backups.sh` - View all backups
- `.git/hooks/pre-commit` - Auto-backup before commits
- `.git/hooks/pre-push` - Block dangerous pushes
- `.claude-instructions.md` - AI instructions

---

## 🔒 How It Works

### Automatic Backups

**Every commit automatically backs up:**
- ✅ Full git state (as a branch: `backup-YYYY-MM-DD-HH-MM-SS`)
- ✅ All databases (`.db`, `.sqlite`, `.sqlite3`)
- ✅ Environment files (`.env`, `.env.local`, etc.)
- ✅ Uncommitted changes (diffs)

**Retention:** Last 10 backups kept automatically

### The Codeword System

Before Claude can perform ANY of these operations:
- `git commit`
- `git reset` (especially `--hard`)
- `git push --force`
- Database migrations/resets (`prisma migrate reset`)
- File deletions

**Claude MUST:**
1. Create a backup (`./scripts/backup-state.sh`)
2. Show you the full diff/changes
3. Ask: `"Type 'cook' to proceed"`
4. **WAIT** for you to type `cook`

**Example Interaction:**

```
Claude: I'm ready to commit these changes:

  M src/app/page.tsx
  M src/components/Header.tsx
  A src/lib/new-feature.ts

Changes:
[shows full git diff]

Type 'cook' to proceed with this commit.

You: cook

Claude: [creates backup, then commits]
✅ Backup created: 2025-10-04-07-30-15
✅ Committed: "Add new feature"
```

---

## 📚 Commands Reference

### Create Manual Backup

```bash
./scripts/backup-state.sh
```

**Output:**
```
🔒 Creating backup: 2025-10-04-07-30-15
📦 Backing up git state...
  ✓ Created git branch: backup-2025-10-04-07-30-15
  ✓ Saved git status
  ✓ Saved uncommitted changes
💾 Backing up databases...
  ✓ Backed up prisma/dev.db
🔐 Backing up environment files...
  ✓ Backed up .env
✅ Backup complete: 2025-10-04-07-30-15
```

### List All Backups

```bash
./scripts/list-backups.sh
```

### Restore From Backup

```bash
# List backups first to find the timestamp
./scripts/list-backups.sh

# Restore specific backup
./scripts/restore-backup.sh 2025-10-04-07-30-15
```

**⚠️ Warning:** This will:
- Checkout the backup git branch
- Restore all databases
- Restore environment files
- **Lose any uncommitted changes** since the backup

---

## 🚫 Blocked Operations

### Force Push to Main/Master

The `pre-push` hook **blocks** force pushes to `main` or `master`:

```bash
git push --force origin main
# ❌ BLOCKED: Force push to 'main' is not allowed
#    Create a backup first: ./scripts/backup-state.sh
```

**To override** (not recommended):
```bash
# 1. Create backup first!
./scripts/backup-state.sh

# 2. Then force push without hook verification
git push --no-verify --force origin main
```

---

## 📁 File Structure

```
your-project/
├── .backups/                    # ⚠️ Gitignored
│   ├── git/                     # Git state backups
│   │   ├── 2025-10-04-07-30-15-branch.txt
│   │   ├── 2025-10-04-07-30-15-status.txt
│   │   ├── 2025-10-04-07-30-15-uncommitted.diff
│   │   └── 2025-10-04-07-30-15-staged.diff
│   ├── database/                # Database backups
│   │   └── 2025-10-04-07-30-15-dev.db
│   ├── env/                     # Environment file backups
│   │   └── 2025-10-04-07-30-15.env
│   └── 2025-10-04-07-30-15-manifest.txt
│
├── scripts/
│   ├── backup-state.sh          # Create backups
│   ├── restore-backup.sh        # Restore from backup
│   └── list-backups.sh          # List all backups
│
├── .git/hooks/
│   ├── pre-commit               # Auto-backup before commits
│   └── pre-push                 # Block dangerous pushes
│
├── .claude-instructions.md      # Instructions for Claude AI
├── setup-claude-safety.sh       # Universal installer
└── CLAUDE-CODE-SAFETY-PROTOCOL.md  # This file
```

---

## 🤖 Claude AI Instructions

**For Claude Code CLI:**

Read the `.claude-instructions.md` file in each project. Key rules:

### MUST ALWAYS:

1. **Before commits:**
   ```bash
   ./scripts/backup-state.sh
   git status
   git diff
   # Show user the changes
   # Ask: "Type 'cook' to proceed"
   # WAIT for codeword
   ```

2. **Before rollbacks:**
   ```bash
   ./scripts/backup-state.sh
   git log --oneline -5
   # Show user what will be lost
   # Ask: "Type 'cook' to proceed"
   # WAIT for codeword
   ```

3. **Before database resets:**
   ```bash
   ./scripts/backup-state.sh
   # Show user current database state
   # Ask: "Type 'cook' to proceed"
   # WAIT for codeword
   ```

### NEVER WITHOUT CODEWORD:

- ❌ `git reset --hard`
- ❌ `git push --force`
- ❌ `git commit` (even with -m)
- ❌ `PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION="go"`
- ❌ Delete files
- ❌ Overwrite production

---

## 🔧 Customization

### Change Codeword

Edit `.claude-instructions.md`:
```markdown
## CODEWORD: 'your-new-codeword'
```

### Change Backup Retention

Edit `scripts/backup-state.sh`, line with `tail -n +11`:
```bash
# Keep last 20 backups instead of 10
ls -t "$BACKUP_DIR"/*-manifest.txt 2>/dev/null | tail -n +21 | while read -r manifest; do
```

### Add Custom Backup Locations

Edit `scripts/backup-state.sh`, add to backup section:
```bash
# Backup custom directory
if [ -d "my-data" ]; then
    tar -czf "$BACKUP_DIR/custom/$TIMESTAMP-my-data.tar.gz" my-data/
fi
```

---

## 💡 Best Practices

### 1. Create Backups Before Major Changes

```bash
# Before starting a big refactor
./scripts/backup-state.sh

# Do your work...

# If something goes wrong
./scripts/restore-backup.sh <timestamp>
```

### 2. Test Restores Periodically

```bash
# Create a test backup
./scripts/backup-state.sh

# Make some changes
echo "test" > test.txt

# Restore
./scripts/restore-backup.sh <latest-timestamp>

# Verify test.txt is gone
```

### 3. Review Backups Weekly

```bash
./scripts/list-backups.sh
# Clean up any you don't need manually
```

---

## 🆘 Emergency Recovery

### "I lost my work!"

```bash
# 1. List all backups
./scripts/list-backups.sh

# 2. Find the most recent before your loss
#    Backups are named: YYYY-MM-DD-HH-MM-SS

# 3. Restore
./scripts/restore-backup.sh 2025-10-04-07-30-15

# 4. Check what was restored
git status
git log
```

### "Claude force-pushed to main!"

```bash
# 1. List backups
./scripts/list-backups.sh

# 2. Find backup from before the push
./scripts/restore-backup.sh <timestamp>

# 3. Force push the backup (after verifying!)
git push --force origin main --no-verify
```

### "Database was wiped!"

```bash
# Databases are backed up in .backups/database/

# Find the backup
ls -lah .backups/database/

# Manually copy it back
cp .backups/database/2025-10-04-07-30-15-dev.db prisma/dev.db
```

---

## 📋 Checklist for New Projects

- [ ] Copy `setup-claude-safety.sh` to project root
- [ ] Run `./setup-claude-safety.sh`
- [ ] Test backup: `./scripts/backup-state.sh`
- [ ] Test list: `./scripts/list-backups.sh`
- [ ] Tell Claude to read `.claude-instructions.md`
- [ ] Make a test commit to verify pre-commit hook works
- [ ] Verify `.backups/` is in `.gitignore`

---

## ⚖️ License

Free to use in all your projects. No attribution required.

---

## 🤝 Support

Issues or improvements? Update this file and share with your other projects!

**Remember:** This safety system only works if Claude follows the rules in `.claude-instructions.md`. Always verify the codeword system is working before trusting it with important operations.
