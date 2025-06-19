#!/bin/bash

echo "🔍 CHECKING DEPLOYMENT STATUS"
echo "============================="

# Check last commit
echo "Last commit:"
git log -1 --oneline

echo ""
echo "🔍 Testing live site JavaScript..."

# Create a simple test to check if our methods exist
curl -s "https://darling-toffee-b52fd4.netlify.app/script.js" | grep -c "loadCategories" > /tmp/loadcat_count.txt
curl -s "https://darling-toffee-b52fd4.netlify.app/script.js" | grep -c "updateSummary" > /tmp/updatesummary_count.txt

LOADCAT_COUNT=$(cat /tmp/loadcat_count.txt)
UPDATESUMMARY_COUNT=$(cat /tmp/updatesummary_count.txt)

echo "loadCategories method found: $LOADCAT_COUNT times"
echo "updateSummary method found: $UPDATESUMMARY_COUNT times"

if [ "$LOADCAT_COUNT" -gt "0" ] && [ "$UPDATESUMMARY_COUNT" -gt "0" ]; then
    echo "✅ Updated methods are deployed!"
else
    echo "❌ Updated methods are NOT deployed yet!"
    echo "   This might mean:"
    echo "   - Netlify is still building"
    echo "   - Build failed"
    echo "   - Cache needs to clear"
fi

echo ""
echo "🔍 Checking for specific error patterns..."
curl -s "https://darling-toffee-b52fd4.netlify.app/script.js" | grep -n "(" | head -5

echo ""
echo "You can manually check deployment at:"
echo "https://app.netlify.com/sites/darling-toffee-b52fd4/deploys"