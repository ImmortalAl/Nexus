#!/bin/bash

# Nexus Backend Deployment Script
# This script helps deploy backend changes to production

echo "🚀 Nexus Backend Deployment Helper"
echo "=================================="
echo ""

# Check current status
echo "📊 Current Git Status:"
git status --short
echo ""

# Show pending commits
echo "📝 Pending Commits to Deploy:"
git log origin/main..HEAD --oneline
echo ""

echo "🎯 Deployment Options:"
echo "1. Manual GitHub Push: Push changes to GitHub for auto-deploy"
echo "2. Render Dashboard: Use Render's manual deploy button"
echo "3. GitHub Integration: Ensure your GitHub account is connected to Render"
echo ""

echo "📋 Quick Commands for Manual Deployment:"
echo "  git add ."
echo "  git commit -m 'deploy: backend updates'"
echo "  git push origin main"
echo ""

echo "🔧 Files Changed:"
git diff --name-only HEAD~1
echo ""

echo "✅ Ready to deploy Nexus backend!"
echo "   Service URL: https://nexus-ytrg.onrender.com"