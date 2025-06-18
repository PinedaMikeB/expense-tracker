#!/bin/bash

echo "🔍 EXPENSE TRACKER DEPLOYMENT VERIFICATION"
echo "=========================================="

# Check if the site is accessible
echo "Testing site accessibility..."
curl -s -o /dev/null -w "%{http_code}" https://darling-toffee-b52fd4.netlify.app > /tmp/status_code.txt

STATUS_CODE=$(cat /tmp/status_code.txt)
if [ "$STATUS_CODE" = "200" ]; then
    echo "✅ Site accessible (HTTP $STATUS_CODE)"
else
    echo "❌ Site not accessible (HTTP $STATUS_CODE)"
    exit 1
fi

# Check if JavaScript is included
echo "Checking for JavaScript inclusion..."
curl -s https://darling-toffee-b52fd4.netlify.app | grep -q "script.js"
if [ $? -eq 0 ]; then
    echo "✅ script.js found in HTML"
else
    echo "❌ script.js not found in HTML"
fi

# Check if forms exist
echo "Checking for form elements..."
curl -s https://darling-toffee-b52fd4.netlify.app | grep -q 'id="expense-form"'
if [ $? -eq 0 ]; then
    echo "✅ Expense form found"
else
    echo "❌ Expense form not found"
fi

curl -s https://darling-toffee-b52fd4.netlify.app | grep -q 'id="income-form"'
if [ $? -eq 0 ]; then
    echo "✅ Income form found"
else
    echo "❌ Income form not found"
fi

# Check if debugging is enabled
echo "Checking for debug logging..."
curl -s https://darling-toffee-b52fd4.netlify.app/script.js | grep -q "console.log"
if [ $? -eq 0 ]; then
    echo "✅ Debug logging enabled"
else
    echo "❌ Debug logging not found"
fi

echo ""
echo "🎯 MANUAL TESTING INSTRUCTIONS:"
echo "1. Open: https://darling-toffee-b52fd4.netlify.app"
echo "2. Open browser console F12"
echo "3. Look for initialization messages"
echo "4. Try adding an expense/income"
echo "5. Check if data appears in tables"
echo ""
echo "🐛 If forms still don't work:"
echo "   - Copy contents of debug-console.js"
echo "   - Run testExpenseSubmission()"
