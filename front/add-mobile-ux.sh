#!/bin/bash

echo "📱 Adding Mobile UX Enhancements..."

FILES=$(find . -name "*.html" -type f ! -path "./docs/*" ! -path "./*debug*" ! -path "./*test*" ! -path "./*performance*")

for file in $FILES; do
    if grep -q "mobile-ux-enhanced.css" "$file"; then
        echo "  ✓ $file already has mobile-ux-enhanced.css"
    else
        sed -i '/mobile-immortal-enhanced\.css/a\    <link rel="stylesheet" href="css/mobile-ux-enhanced.css?v=1.0">' "$file"
        echo "  ✓ Added to $file"
    fi
done

echo "✨ Mobile UX enhancements added!"
