#!/bin/bash
# list-backups.sh - List all available backups
# Part of Claude Code Safety System

# Colors
BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

BACKUP_DIR=".backups"

echo -e "${BLUE}📦 Available Backups:${NC}"
echo ""

if [ ! -d "$BACKUP_DIR" ] || [ -z "$(ls -A $BACKUP_DIR/*-manifest.txt 2>/dev/null)" ]; then
    echo -e "${YELLOW}No backups found${NC}"
    echo ""
    echo "Create a backup with: ./scripts/backup-state.sh"
    exit 0
fi

# List all backups with details
ls -t "$BACKUP_DIR"/*-manifest.txt 2>/dev/null | while read -r manifest; do
    TIMESTAMP=$(basename "$manifest" | sed 's/-manifest.txt//')

    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${YELLOW}Backup: $TIMESTAMP${NC}"
    echo ""

    # Show key info from manifest
    grep -E "^Current Branch:|^Git Commit:|^Git Status:" "$manifest" || true
    echo ""

    # Show backed up files count
    GIT_FILES=$(ls -1 "$BACKUP_DIR/git/$TIMESTAMP"* 2>/dev/null | wc -l)
    DB_FILES=$(ls -1 "$BACKUP_DIR/database/$TIMESTAMP"* 2>/dev/null | wc -l)
    ENV_FILES=$(ls -1 "$BACKUP_DIR/env/$TIMESTAMP"* 2>/dev/null | wc -l)

    echo "Backup contains:"
    [ "$GIT_FILES" -gt 0 ] && echo "  • $GIT_FILES git state files"
    [ "$DB_FILES" -gt 0 ] && echo "  • $DB_FILES database files"
    [ "$ENV_FILES" -gt 0 ] && echo "  • $ENV_FILES environment files"

    echo ""
    echo "To restore: ./scripts/restore-backup.sh $TIMESTAMP"
    echo ""
done

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}💡 Tip: Backups are automatically created before commits${NC}"
echo -e "${BLUE}   Last 10 backups are kept automatically${NC}"
