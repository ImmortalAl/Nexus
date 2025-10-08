#!/bin/bash

# Add z-index-system.css to all pages that don't have it
# Place it early in the CSS loading order (after base-theme, before global styles)

echo "🔧 Adding z-index-system.css to all pages..."

# Function to add z-index-system.css after base-theme.css
add_z_index_system() {
    local file=$1
    local prefix=$2
    
    if grep -q "z-index-system.css" "$file"; then
        echo "✓ $file already has z-index-system.css"
    else
        # Add after base-theme.css or after <title> if base-theme doesn't exist
        if grep -q "base-theme.css" "$file"; then
            sed -i '/base-theme.css/a\    \n    <!-- Z-INDEX SYSTEM - Centralized layering control -->\n    <link rel="stylesheet" href="'"$prefix"'css/z-index-system.css?v=1.2">' "$file"
            echo "✅ Added to $file (after base-theme)"
        elif grep -q "</title>" "$file"; then
            sed -i '/<\/title>/a\    \n    <!-- Z-INDEX SYSTEM - Centralized layering control -->\n    <link rel="stylesheet" href="'"$prefix"'css/z-index-system.css?v=1.2">' "$file"
            echo "✅ Added to $file (after title)"
        else
            echo "⚠️  Could not add to $file - manual intervention needed"
        fi
    fi
}

# Root level pages
add_z_index_system "index.html" ""
add_z_index_system "lander.html" ""

# Pages folder (use ../ prefix)
for file in pages/*.html; do
    if [ -f "$file" ]; then
        add_z_index_system "$file" "../"
    fi
done

# Souls folder (use ../ prefix)
for file in souls/*.html; do
    if [ -f "$file" ]; then
        add_z_index_system "$file" "../"
    fi
done

# Admin folder (use ../ prefix)
add_z_index_system "admin/index.html" "../"

# Other pages
add_z_index_system "performance-audit.html" ""
add_z_index_system "broadcast-scripts.html" ""
add_z_index_system "livestream-assistant.html" ""

echo "✨ Z-index system injection complete!"
