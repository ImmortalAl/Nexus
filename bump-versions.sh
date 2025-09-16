#!/bin/bash

# Immortal Nexus Version Bump Automation Script
# Automatically updates CSS/JS version numbers across all HTML files

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Immortal Nexus Version Bump Script${NC}"
echo "==============================================="

# Check if we're in the correct directory
if [ ! -d "front" ]; then
    echo -e "${RED}❌ Error: Must be run from the Nexus root directory (where front/ folder exists)${NC}"
    exit 1
fi

# Function to bump version number
bump_version() {
    local current=$1
    local major=$(echo $current | cut -d. -f1)
    local minor=$(echo $current | cut -d. -f2)

    # Increment minor version
    minor=$((minor + 1))
    echo "${major}.${minor}"
}

# Function to update file versions
update_file_versions() {
    local file_pattern=$1
    local description=$2

    echo -e "${YELLOW}📝 Updating ${description}...${NC}"

    # Find all files with this pattern and get current version
    current_version=$(grep -h "${file_pattern}" front/**/*.html 2>/dev/null | head -1 | sed -n "s/.*${file_pattern//\./\\.}v=\([0-9.]*\).*/\1/p")

    if [ -z "$current_version" ]; then
        echo -e "${RED}   ⚠️  No current version found for ${file_pattern}${NC}"
        return
    fi

    new_version=$(bump_version $current_version)

    echo -e "   📊 ${file_pattern}: ${current_version} → ${new_version}"

    # Update all HTML files
    find front -name "*.html" -exec sed -i "s/${file_pattern//\./\\.}?v=[0-9.]*/${file_pattern}?v=${new_version}/g" {} \;

    echo -e "${GREEN}   ✅ Updated ${description}${NC}"
}

# Main execution
echo -e "${BLUE}🔍 Scanning for version parameters...${NC}"

# Update specific files if provided as arguments
if [ $# -gt 0 ]; then
    for file in "$@"; do
        update_file_versions "$file" "$file"
    done
else
    # Update all common versioned files
    echo -e "${YELLOW}📦 Updating all CSS/JS versions...${NC}"

    # CSS Files
    update_file_versions "styles.css" "Global Styles"
    update_file_versions "features.css" "Features CSS"
    update_file_versions "critical.css" "Critical CSS"
    update_file_versions "components.css" "Components CSS"
    update_file_versions "layout.css" "Layout CSS"
    update_file_versions "active-users.css" "Active Users CSS"
    update_file_versions "unified-modals.css" "Unified Modals CSS"
    update_file_versions "components/shared/styles.css" "Shared Component Styles"

    # JavaScript Files
    update_file_versions "main.js" "Main JavaScript"
    update_file_versions "components/shared/config.js" "Configuration"
    update_file_versions "components/shared/nexus-core.js" "Nexus Core"
    update_file_versions "components/shared/authModal.js" "Authentication Modal"
    update_file_versions "components/shared/authManager.js" "Authentication Manager"
    update_file_versions "components/shared/apiClient.js" "API Client"
    update_file_versions "components/shared/navigation.js" "Navigation"
    update_file_versions "components/shared/userMenu.js" "User Menu"
    update_file_versions "components/shared/activeUsers.js" "Active Users"
    update_file_versions "components/shared/messageModal.js" "Message Modal"
    update_file_versions "js/nexus-avatar-system.js" "Avatar System"
    update_file_versions "js/analytics-tracker.js" "Analytics Tracker"
fi

echo ""
echo -e "${GREEN}🎉 Version bump completed successfully!${NC}"
echo -e "${BLUE}💡 Remember to:${NC}"
echo -e "   1. Test the changes on your local environment"
echo -e "   2. Commit the changes: ${YELLOW}git add . && git commit -m 'bump: update CSS/JS versions'${NC}"
echo -e "   3. Push to deploy: ${YELLOW}git push origin main${NC}"
echo ""

# Optional: Show what changed
echo -e "${BLUE}📋 Summary of changes:${NC}"
git status --porcelain | grep ".html" | head -10
if [ $(git status --porcelain | grep ".html" | wc -l) -gt 10 ]; then
    echo "... and $(($(git status --porcelain | grep ".html" | wc -l) - 10)) more files"
fi

echo ""
echo -e "${GREEN}✨ Ready for deployment to Netlify!${NC}"