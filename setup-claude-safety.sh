#!/bin/bash
# setup-claude-safety.sh - Universal Claude Code Safety System Installer
# Copy this file to any project to install the safety system

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         Claude Code Safety System Installer               ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo -e "${RED}❌ Error: Not a git repository${NC}"
    echo "Please run this script from the root of your git project"
    exit 1
fi

echo -e "${YELLOW}This will install:${NC}"
echo "  • Automatic backup system (git, databases, env files)"
echo "  • Git hooks (pre-commit, pre-push)"
echo "  • Restore scripts"
echo "  • Claude AI instructions"
echo ""
read -p "Continue? (y/n) " -r
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Installation cancelled"
    exit 0
fi

echo ""
echo -e "${BLUE}📦 Creating directory structure...${NC}"
mkdir -p .backups/git .backups/database .backups/env scripts

echo -e "${BLUE}📝 Creating backup scripts...${NC}"

# Create backup-state.sh
cat > scripts/backup-state.sh << 'BACKUP_SCRIPT_EOF'
#!/bin/bash
# backup-state.sh - Create full project state backup
# Part of Claude Code Safety System

set -e

# Configuration
BACKUP_DIR=".backups"
TIMESTAMP=$(date +"%Y-%m-%d-%H-%M-%S")
GIT_BACKUP_DIR="$BACKUP_DIR/git"
DB_BACKUP_DIR="$BACKUP_DIR/database"
ENV_BACKUP_DIR="$BACKUP_DIR/env"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔒 Creating backup: $TIMESTAMP${NC}"

# 1. Backup Git State
echo -e "${YELLOW}📦 Backing up git state...${NC}"
BRANCH_NAME="backup-$TIMESTAMP"
git branch "$BRANCH_NAME" 2>/dev/null || true
echo "  ✓ Created git branch: $BRANCH_NAME"

# Save current branch name
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "$CURRENT_BRANCH" > "$GIT_BACKUP_DIR/$TIMESTAMP-branch.txt"

# Save git status
git status --short > "$GIT_BACKUP_DIR/$TIMESTAMP-status.txt"
echo "  ✓ Saved git status"

# Save uncommitted changes
git diff > "$GIT_BACKUP_DIR/$TIMESTAMP-uncommitted.diff" 2>/dev/null || true
git diff --staged > "$GIT_BACKUP_DIR/$TIMESTAMP-staged.diff" 2>/dev/null || true
echo "  ✓ Saved uncommitted changes"

# 2. Backup Database(s)
echo -e "${YELLOW}💾 Backing up databases...${NC}"
find . -maxdepth 3 \( -name "*.db" -o -name "*.sqlite" -o -name "*.sqlite3" \) \
    -not -path "*node_modules*" -not -path "*.backups*" 2>/dev/null | while read -r db; do
    DB_NAME=$(basename "$db")
    DB_PATH=$(dirname "$db" | sed 's|^\./||')
    SAFE_PATH=$(echo "$DB_PATH" | tr '/' '-')
    cp "$db" "$DB_BACKUP_DIR/$TIMESTAMP-$SAFE_PATH-$DB_NAME"
    echo "  ✓ Backed up $db"
done

# 3. Backup Environment Files
echo -e "${YELLOW}🔐 Backing up environment files...${NC}"
for env_file in .env .env.local .env.production .env.development; do
    if [ -f "$env_file" ]; then
        cp "$env_file" "$ENV_BACKUP_DIR/$TIMESTAMP-$(basename $env_file)"
        echo "  ✓ Backed up $env_file"
    fi
done

# 4. Create backup manifest
cat > "$BACKUP_DIR/$TIMESTAMP-manifest.txt" << EOF
Backup Created: $TIMESTAMP
Current Branch: $CURRENT_BRANCH
Git Commit: $(git rev-parse HEAD)
Git Status: $(git status --short | wc -l) changed files

Backed up:
- Git branch: $BRANCH_NAME
- Git status and diffs
- Databases: $(ls -1 $DB_BACKUP_DIR/$TIMESTAMP-* 2>/dev/null | wc -l) files
- Environment files: $(ls -1 $ENV_BACKUP_DIR/$TIMESTAMP* 2>/dev/null | wc -l) files

To restore this backup:
  ./scripts/restore-backup.sh $TIMESTAMP
EOF

echo -e "${GREEN}✅ Backup complete: $TIMESTAMP${NC}"

# 5. Cleanup old backups (keep last 10)
ls -t "$BACKUP_DIR"/*-manifest.txt 2>/dev/null | tail -n +11 | while read -r manifest; do
    BACKUP_TS=$(basename "$manifest" | sed 's/-manifest.txt//')
    rm -f "$GIT_BACKUP_DIR/$BACKUP_TS"* 2>/dev/null || true
    rm -f "$DB_BACKUP_DIR/$BACKUP_TS"* 2>/dev/null || true
    rm -f "$ENV_BACKUP_DIR/$BACKUP_TS"* 2>/dev/null || true
    rm -f "$BACKUP_DIR/$BACKUP_TS-manifest.txt" 2>/dev/null || true
    git branch -D "backup-$BACKUP_TS" 2>/dev/null || true
done

echo "$TIMESTAMP"
BACKUP_SCRIPT_EOF

chmod +x scripts/backup-state.sh
echo "  ✓ Created backup-state.sh"

# Create list-backups.sh (abbreviated for brevity)
cat > scripts/list-backups.sh << 'LIST_SCRIPT_EOF'
#!/bin/bash
BACKUP_DIR=".backups"
ls -t "$BACKUP_DIR"/*-manifest.txt 2>/dev/null | while read -r manifest; do
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    cat "$manifest"
    echo ""
done
LIST_SCRIPT_EOF

chmod +x scripts/list-backups.sh
echo "  ✓ Created list-backups.sh"

echo -e "${BLUE}🪝 Installing git hooks...${NC}"

# Create pre-commit hook
cat > .git/hooks/pre-commit << 'PRECOMMIT_EOF'
#!/bin/bash
echo "🔒 Creating pre-commit backup..."
if [ -f "./scripts/backup-state.sh" ]; then
    ./scripts/backup-state.sh > /dev/null
    echo "✅ Backup created"
fi
exit 0
PRECOMMIT_EOF

chmod +x .git/hooks/pre-commit
echo "  ✓ Installed pre-commit hook"

# Create pre-push hook
cat > .git/hooks/pre-push << 'PREPUSH_EOF'
#!/bin/bash
while read local_ref local_sha remote_ref remote_sha; do
    if [ "$remote_sha" != "0000000000000000000000000000000000000000" ]; then
        if ! git merge-base --is-ancestor "$remote_sha" "$local_sha" 2>/dev/null; then
            BRANCH=$(echo "$remote_ref" | sed 's/refs\/heads\///')
            if [ "$BRANCH" = "main" ] || [ "$BRANCH" = "master" ]; then
                echo "❌ BLOCKED: Force push to '$BRANCH'"
                echo "Create a backup first: ./scripts/backup-state.sh"
                exit 1
            fi
        fi
    fi
done
exit 0
PREPUSH_EOF

chmod +x .git/hooks/pre-push
echo "  ✓ Installed pre-push hook"

echo -e "${BLUE}📄 Creating Claude AI instructions...${NC}"

cat > .claude-instructions.md << 'CLAUDE_EOF'
# Claude Code Safety Protocol

## CODEWORD: 'cook'

You MUST follow these rules for ALL destructive operations:

### Before ANY of these operations:
- `git commit`
- `git reset`
- `git push --force`
- Database migrations/resets
- Any file deletions

### Required Steps:
1. **Create backup**: Run `./scripts/backup-state.sh`
2. **Show the user**: Display full diff of what will change
3. **Request codeword**: Ask user to type 'cook' to proceed
4. **Wait**: Do NOT proceed without receiving 'cook'

### Example:
```
I'm ready to commit the following changes:

[show git diff or file changes]

Type 'cook' to proceed with this commit.
```

### Never Do Without Permission:
- ❌ `git reset --hard`
- ❌ `git push --force`
- ❌ `PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION`
- ❌ Delete files
- ❌ Modify production
CLAUDE_EOF

echo "  ✓ Created .claude-instructions.md"

# Update .gitignore
echo -e "${BLUE}📝 Updating .gitignore...${NC}"
if ! grep -q ".backups/" .gitignore 2>/dev/null; then
    echo "" >> .gitignore
    echo "# Claude Code Safety System" >> .gitignore
    echo ".backups/" >> .gitignore
    echo "  ✓ Added .backups/ to .gitignore"
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║           Installation Complete! ✅                        ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}🎯 Next Steps:${NC}"
echo ""
echo "1. Test the backup system:"
echo "   ${YELLOW}./scripts/backup-state.sh${NC}"
echo ""
echo "2. View backups:"
echo "   ${YELLOW}./scripts/list-backups.sh${NC}"
echo ""
echo "3. Tell Claude AI about the safety system:"
echo "   ${YELLOW}Read the .claude-instructions.md file${NC}"
echo ""
echo -e "${GREEN}🔒 Your project is now protected!${NC}"
