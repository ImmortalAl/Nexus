#!/bin/bash

# Update all HTML files with new immortal enhancements

echo "🌟 Adding Immortal Nexus enhanced design system..."

# Find all HTML files (excluding docs, debug, test, performance)
FILES=$(find . -name "*.html" -type f ! -path "./docs/*" ! -path "./*debug*" ! -path "./*test*" ! -path "./*performance*")

for file in $FILES; do
    echo "Updating: $file"
    
    # Check if immortal-enhanced.css is already added
    if grep -q "immortal-enhanced.css" "$file"; then
        echo "  ✓ Already has immortal-enhanced.css"
    else
        # Add immortal-enhanced.css after mobile-enhanced.css
        sed -i '/mobile-enhanced\.css/a\    \n    <!-- IMMORTAL ENHANCED DESIGN SYSTEM -->\n    <link rel="stylesheet" href="css/immortal-enhanced.css?v=1.0">\n    <link rel="stylesheet" href="css/mobile-immortal-enhanced.css?v=1.0">' "$file"
        echo "  ✓ Added CSS enhancements"
    fi
    
    # Check if mystical-effects.js is already added
    if grep -q "mystical-effects.js" "$file"; then
        echo "  ✓ Already has mystical-effects.js"
    else
        # Add mystical-effects.js before closing body tag
        sed -i 's|</body>|    <!-- Mystical Effects -->\n    <script src="js/mystical-effects.js?v=1.0"></script>\n</body>|' "$file"
        echo "  ✓ Added JS effects"
    fi
    
    echo ""
done

echo "✨ Enhancement complete! Updated $(echo "$FILES" | wc -w) files"
