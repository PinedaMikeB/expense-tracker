/* 🧪 EXPENSE TRACKER DEBUG CONSOLE
   Copy and paste this into your browser console at darling-toffee-b52fd4.netlify.app
   This will help us identify what's broken */

console.log('🔧 EXPENSE TRACKER DEBUGGING STARTED');
console.log('=====================================');

// Test 1: Check if main objects exist
console.log('📋 1. CHECKING GLOBAL OBJECTS:');
console.log('ExpenseTracker class:', typeof ExpenseTracker);
console.log('expenseTracker instance:', typeof window.expenseTracker);
console.log('showTab function:', typeof showTab);

// Test 2: Check DOM elements
console.log('\n📋 2. CHECKING DOM ELEMENTS:');
const criticalElements = [
    'expense-form', 'income-form', 'expense-category', 
    'total-income', 'total-expenses', 'expenses-tbody'
];

criticalElements.forEach(id => {
    const element = document.getElementById(id);
    console.log(`${id}:`, element ? '✅ Found' : '❌ Missing');
});

// Test 3: Check category dropdown specifically
console.log('\n📋 3. CHECKING CATEGORY DROPDOWN:');
const categorySelect = document.getElementById('expense-category');
if (categorySelect) {
    const options = categorySelect.querySelectorAll('option');
    console.log(`Category options found: ${options.length}`);
    if (options.length > 1) {
        console.log('Categories:', Array.from(options).slice(1).map(opt => opt.textContent));
    } else {
        console.log('❌ Category dropdown is empty - loadCategories() not working');
    }
} else {
    console.log('❌ Category select element not found');
}

// Test 4: Try to manually call methods
console.log('\n📋 4. TESTING MANUAL METHOD CALLS:');
if (window.expenseTracker) {
    try {
        console.log('Tracker categories:', window.expenseTracker.categories?.length || 'None');
        console.log('Trying to call loadCategories...');
        window.expenseTracker.loadCategories();
        console.log('✅ loadCategories() called successfully');
        
        console.log('Trying to call updateSummary...');
        window.expenseTracker.updateSummary();
        console.log('✅ updateSummary() called successfully');
    } catch (error) {
        console.log('❌ Error calling methods:', error.message);
    }
} else {
    console.log('❌ expenseTracker not available for testing');
}

// Test 5: Check for JavaScript errors
console.log('\n📋 5. CHECKING FOR SCRIPT ERRORS:');
window.addEventListener('error', function(e) {
    console.log('🚨 JavaScript Error:', e.message, 'at line', e.lineno);
});

// Test 6: Try to manually fix category dropdown
console.log('\n📋 6. MANUAL CATEGORY FIX:');
function fixCategoryDropdown() {
    const categorySelect = document.getElementById('expense-category');
    if (categorySelect && categorySelect.options.length <= 1) {
        const defaultCategories = [
            { id: 'food', name: 'Food & Dining' },
            { id: 'transport', name: 'Transportation' },
            { id: 'utilities', name: 'Utilities' },
            { id: 'healthcare', name: 'Healthcare' },
            { id: 'entertainment', name: 'Entertainment' },
            { id: 'shopping', name: 'Shopping' },
            { id: 'business', name: 'Business' },
            { id: 'other', name: 'Other' }
        ];
        
        defaultCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            categorySelect.appendChild(option);
        });
        
        console.log('✅ Manually fixed category dropdown');
        return true;
    }
    return false;
}

if (fixCategoryDropdown()) {
    console.log('Category dropdown has been fixed manually');
}

// Test 7: Try to manually fix showTab function
console.log('\n📋 7. MANUAL SHOWTAB FIX:');
if (typeof showTab === 'undefined') {
    window.showTab = function(tabName) {
        console.log('Manual showTab called for:', tabName);
        
        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });

        // Remove active class from all tab buttons
        document.querySelectorAll('.tab-button').forEach(button => {
            button.classList.remove('active');
        });

        // Show selected tab
        const tabElement = document.getElementById(`${tabName}-tab`);
        if (tabElement) {
            tabElement.classList.add('active');
        }
        
        // Add active class to clicked button
        const buttonElement = document.querySelector(`[onclick="showTab('${tabName}')"]`);
        if (buttonElement) {
            buttonElement.classList.add('active');
        }
        
        console.log(`✅ Switched to ${tabName} tab`);
    };
    console.log('✅ showTab function created manually');
}

console.log('\n🎯 DEBUGGING COMPLETE!');
console.log('Now try:');
console.log('1. Click on different tabs');
console.log('2. Try adding an expense');
console.log('3. Check if category dropdown works');
