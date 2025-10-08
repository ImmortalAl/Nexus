#!/bin/bash

echo "🔧 Adding unifiedVoting.js to all pages that need it..."

# Function to add unifiedVoting.js after a specific script
add_unified_voting() {
    local file=$1
    local prefix=$2
    
    if grep -q "unifiedVoting.js" "$file"; then
        echo "✓ $file already has unifiedVoting.js"
    else
        # Add after nexus-avatar-system.js or before main closing scripts
        if grep -q "nexus-avatar-system.js" "$file"; then
            sed -i '/nexus-avatar-system.js/a\    \n    <!-- Unified Voting System -->\n    <script src="'"$prefix"'js/shared/unifiedVoting.js?v=1.2"></script>' "$file"
            echo "✅ Added unifiedVoting.js to $file"
        elif grep -q "messageModal.js" "$file"; then
            # Add before messageModal for pages that have it
            sed -i '/messageModal.js/i\    \n    <!-- Unified Voting System -->\n    <script src="'"$prefix"'js/shared/unifiedVoting.js?v=1.2"></script>\n' "$file"
            echo "✅ Added unifiedVoting.js to $file (before messageModal)"
        elif grep -q "</body>" "$file"; then
            # Add before closing body as last resort
            sed -i '/<\/body>/i\    \n    <!-- Unified Voting System -->\n    <script src="'"$prefix"'js/shared/unifiedVoting.js?v=1.2"></script>' "$file"
            echo "✅ Added unifiedVoting.js to $file (before body close)"
        else
            echo "⚠️  Could not add to $file - manual intervention needed"
        fi
    fi
}

# Root level pages
add_unified_voting "index.html" ""

# Pages folder (use ../ prefix)
add_unified_voting "pages/news.html" "../"
add_unified_voting "pages/archive.html" "../"
add_unified_voting "pages/celestial-commons.html" "../"
add_unified_voting "pages/debate.html" "../"

# Souls folder (use ../ prefix)
add_unified_voting "souls/index.html" "../"
add_unified_voting "souls/profile.html" "../"

echo "✨ Unified voting system injection complete!"
