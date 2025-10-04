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
if [ -f "prisma/dev.db" ]; then
    cp "prisma/dev.db" "$DB_BACKUP_DIR/$TIMESTAMP-dev.db"
    echo "  ✓ Backed up prisma/dev.db"
fi

# Backup any other databases found
find . -maxdepth 3 -name "*.db" -not -path "*node_modules*" -not -path "*.backups*" 2>/dev/null | while read -r db; do
    DB_NAME=$(basename "$db")
    cp "$db" "$DB_BACKUP_DIR/$TIMESTAMP-$DB_NAME"
    echo "  ✓ Backed up $db"
done

# 3. Backup Environment Files
echo -e "${YELLOW}🔐 Backing up environment files...${NC}"
if [ -f ".env" ]; then
    cp ".env" "$ENV_BACKUP_DIR/$TIMESTAMP.env"
    echo "  ✓ Backed up .env"
fi
if [ -f ".env.local" ]; then
    cp ".env.local" "$ENV_BACKUP_DIR/$TIMESTAMP.env.local"
    echo "  ✓ Backed up .env.local"
fi

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
echo -e "${BLUE}📋 Manifest saved to: $BACKUP_DIR/$TIMESTAMP-manifest.txt${NC}"

# 5. Cleanup old backups (keep last 10)
echo -e "${YELLOW}🧹 Cleaning up old backups...${NC}"
ls -t "$BACKUP_DIR"/*-manifest.txt 2>/dev/null | tail -n +11 | while read -r manifest; do
    BACKUP_TS=$(basename "$manifest" | sed 's/-manifest.txt//')
    echo "  Removing old backup: $BACKUP_TS"

    # Remove associated files
    rm -f "$GIT_BACKUP_DIR/$BACKUP_TS"* 2>/dev/null || true
    rm -f "$DB_BACKUP_DIR/$BACKUP_TS"* 2>/dev/null || true
    rm -f "$ENV_BACKUP_DIR/$BACKUP_TS"* 2>/dev/null || true
    rm -f "$BACKUP_DIR/$BACKUP_TS-manifest.txt" 2>/dev/null || true

    # Remove git branch
    git branch -D "backup-$BACKUP_TS" 2>/dev/null || true
done

echo -e "${GREEN}✨ Backup system ready${NC}"
echo "$TIMESTAMP"
