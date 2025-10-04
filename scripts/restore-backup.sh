#!/bin/bash
# restore-backup.sh - Restore project state from backup
# Part of Claude Code Safety System

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

BACKUP_DIR=".backups"
TIMESTAMP=$1

if [ -z "$TIMESTAMP" ]; then
    echo -e "${RED}❌ Error: No backup timestamp provided${NC}"
    echo ""
    echo "Usage: $0 <timestamp>"
    echo ""
    echo "Available backups:"
    ./scripts/list-backups.sh
    exit 1
fi

# Check if backup exists
if [ ! -f "$BACKUP_DIR/$TIMESTAMP-manifest.txt" ]; then
    echo -e "${RED}❌ Error: Backup $TIMESTAMP not found${NC}"
    echo ""
    echo "Available backups:"
    ./scripts/list-backups.sh
    exit 1
fi

# Show manifest
echo -e "${BLUE}📋 Backup Manifest:${NC}"
cat "$BACKUP_DIR/$TIMESTAMP-manifest.txt"
echo ""

# Confirm
echo -e "${YELLOW}⚠️  WARNING: This will restore your project to the state from $TIMESTAMP${NC}"
echo -e "${YELLOW}   Current uncommitted changes will be lost!${NC}"
echo ""
read -p "Are you sure you want to continue? (type 'yes' to confirm): " -r
if [ "$REPLY" != "yes" ]; then
    echo -e "${BLUE}Restore cancelled${NC}"
    exit 0
fi

echo -e "${BLUE}🔄 Restoring backup: $TIMESTAMP${NC}"

# 1. Restore Git State
echo -e "${YELLOW}📦 Restoring git state...${NC}"

# Get the branch name from backup
BACKUP_BRANCH="backup-$TIMESTAMP"
if git rev-parse --verify "$BACKUP_BRANCH" >/dev/null 2>&1; then
    # Stash any current changes
    git stash push -m "Auto-stash before restore $TIMESTAMP" 2>/dev/null || true

    # Checkout the backup branch
    git checkout "$BACKUP_BRANCH"
    echo "  ✓ Checked out backup branch: $BACKUP_BRANCH"

    # Apply uncommitted changes if they exist
    if [ -f "$BACKUP_DIR/git/$TIMESTAMP-uncommitted.diff" ]; then
        if [ -s "$BACKUP_DIR/git/$TIMESTAMP-uncommitted.diff" ]; then
            git apply "$BACKUP_DIR/git/$TIMESTAMP-uncommitted.diff" 2>/dev/null || echo "  ⚠ Could not apply uncommitted changes"
        fi
    fi
    if [ -f "$BACKUP_DIR/git/$TIMESTAMP-staged.diff" ]; then
        if [ -s "$BACKUP_DIR/git/$TIMESTAMP-staged.diff" ]; then
            git apply --cached "$BACKUP_DIR/git/$TIMESTAMP-staged.diff" 2>/dev/null || echo "  ⚠ Could not apply staged changes"
        fi
    fi
else
    echo -e "${RED}  ❌ Backup branch not found${NC}"
fi

# 2. Restore Database(s)
echo -e "${YELLOW}💾 Restoring databases...${NC}"
find "$BACKUP_DIR/database" -name "$TIMESTAMP-*.db" 2>/dev/null | while read -r backup_db; do
    DB_NAME=$(basename "$backup_db" | sed "s/$TIMESTAMP-//")
    TARGET_PATH="prisma/$DB_NAME"

    # Find the original location (handle different paths)
    if [ ! -f "$TARGET_PATH" ] && [ -f "./$DB_NAME" ]; then
        TARGET_PATH="./$DB_NAME"
    fi

    cp "$backup_db" "$TARGET_PATH"
    echo "  ✓ Restored $TARGET_PATH"
done

# 3. Restore Environment Files
echo -e "${YELLOW}🔐 Restoring environment files...${NC}"
if [ -f "$BACKUP_DIR/env/$TIMESTAMP.env" ]; then
    cp "$BACKUP_DIR/env/$TIMESTAMP.env" ".env"
    echo "  ✓ Restored .env"
fi
if [ -f "$BACKUP_DIR/env/$TIMESTAMP.env.local" ]; then
    cp "$BACKUP_DIR/env/$TIMESTAMP.env.local" ".env.local"
    echo "  ✓ Restored .env.local"
fi

echo -e "${GREEN}✅ Restore complete!${NC}"
echo ""
echo -e "${BLUE}Current state:${NC}"
git status --short
echo ""
echo -e "${YELLOW}💡 Note: You are now on branch '$BACKUP_BRANCH'${NC}"
echo -e "${YELLOW}   To return to your original work, run: git checkout <your-branch>${NC}"
