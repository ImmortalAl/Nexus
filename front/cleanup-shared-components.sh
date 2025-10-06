#!/bin/bash

# Script to clean up hardcoded shared components from HTML files

echo "Cleaning up hardcoded shared components from HTML files..."

# Function to remove hardcoded components from a file
cleanup_file() {
    local file=$1
    echo "Processing: $file"

    # Check if file exists
    if [ ! -f "$file" ]; then
        echo "  File not found: $file"
        return
    fi

    # Create a temporary file
    temp_file="${file}.tmp"

    # Process the file
    awk '
    BEGIN {
        skip = 0
        in_sidebar = 0
        in_floating = 0
        in_modal = 0
    }

    # Detect start of components to remove
    /<aside class="active-users"/ { in_sidebar = 1; skip = 1 }
    /<div class="floating-buttons">/ { in_floating = 1; skip = 1 }
    /<div id="messageModal"/ { in_modal = 1; skip = 1 }

    # Detect end of components
    /<\/aside>/ && in_sidebar { in_sidebar = 0; skip = 0; next }
    /<\/div>/ && in_floating && /floating-buttons/ { in_floating = 0; skip = 0; next }
    /<\/div>/ && in_modal && />[\s]*$/ {
        # Count div depth for modal
        if (in_modal == 1) {
            in_modal = 2
        } else if (in_modal == 2) {
            in_modal = 0
            skip = 0
            next
        }
    }

    # Print line if not skipping
    !skip { print }

    # If we just finished removing something, add the injection comment
    END {
        if (NR > 0) {
            print "    <!-- Active Users Sidebar, Floating Buttons, and Message Modal will be dynamically injected by shared components -->"
        }
    }
    ' "$file" > "$temp_file"

    # Check if changes were made
    if ! diff -q "$file" "$temp_file" > /dev/null 2>&1; then
        mv "$temp_file" "$file"
        echo "  ✓ Cleaned up hardcoded components"
    else
        rm "$temp_file"
        echo "  No hardcoded components found"
    fi
}

# List of files to process
files=(
    "souls/profile.html"
    "admin/index.html"
    "templates/page-template.html"
)

# Process each file
for file in "${files[@]}"; do
    cleanup_file "$file"
done

echo "Cleanup complete!"