// 🧪 EXPENSE TRACKER DEBUGGING SCRIPT
// Copy and paste this into the browser console at darling-toffee-b52fd4.netlify.app

console.log('🧪 Starting Expense Tracker Debug Tests...');

// Test 1: Check if app is initialized
if (window.expenseTracker) {
    console.log('✅ ExpenseTracker instance found');
    console.log('App state:', {
        expenses: window.expenseTracker.expenses.length,
        income: window.expenseTracker.income.length,
        categories: window.expenseTracker.categories.length
    });
} else {
    console.error('❌ ExpenseTracker not found on window object');
}

// Test 2: Check DOM elements
const elements = {
    expenseForm: document.getElementById('expense-form'),
    incomeForm: document.getElementById('income-form'),
    expenseDesc: document.getElementById('expense-description'),
    expenseAmount: document.getElementById('expense-amount'),
    expenseCategory: document.getElementById('expense-category'),
    incomeDesc: document.getElementById('income-description'),
    incomeAmount: document.getElementById('income-amount'),
    incomeType: document.getElementById('income-type')
};

console.log('🔍 DOM Elements Check:');
Object.entries(elements).forEach(([name, element]) => {
    if (element) {
        console.log(`✅ ${name}: Found`);
    } else {
        console.error(`❌ ${name}: Missing`);
    }
});

// Test 3: Test form submission manually
function testExpenseSubmission() {
    console.log('🧪 Testing expense submission...');
    
    // Fill in test data
    if (elements.expenseDesc) elements.expenseDesc.value = 'Test Expense';
    if (elements.expenseAmount) elements.expenseAmount.value = '25.50';
    if (elements.expenseCategory) elements.expenseCategory.value = 'food';
    
    // Set today's date
    const today = new Date().toISOString().split('T')[0];
    const expenseDate = document.getElementById('expense-date');
    if (expenseDate) expenseDate.value = today;
    
    console.log('Form values set:', {
        description: elements.expenseDesc?.value,
        amount: elements.expenseAmount?.value,
        category: elements.expenseCategory?.value,
        date: expenseDate?.value
    });
    
    // Try to call addExpense directly
    if (window.expenseTracker && window.expenseTracker.addExpense) {
        try {
            window.expenseTracker.addExpense();
            console.log('✅ addExpense() called successfully');
        } catch (error) {
            console.error('❌ addExpense() failed:', error);
        }
    }
}

function testIncomeSubmission() {
    console.log('🧪 Testing income submission...');
    
    // Fill in test data
    if (elements.incomeDesc) elements.incomeDesc.value = 'Test Income';
    if (elements.incomeAmount) elements.incomeAmount.value = '1000.00';
    if (elements.incomeType) elements.incomeType.value = 'salary';
    
    // Set today's date
    const today = new Date().toISOString().split('T')[0];
    const incomeDate = document.getElementById('income-date');
    if (incomeDate) incomeDate.value = today;
    
    console.log('Income form values set:', {
        description: elements.incomeDesc?.value,
        amount: elements.incomeAmount?.value,
        type: elements.incomeType?.value,
        date: incomeDate?.value
    });
    
    // Try to call addIncome directly
    if (window.expenseTracker && window.expenseTracker.addIncome) {
        try {
            window.expenseTracker.addIncome();
            console.log('✅ addIncome() called successfully');
        } catch (error) {
            console.error('❌ addIncome() failed:', error);
        }
    }
}

// Test 4: Check localStorage
function checkLocalStorage() {
    console.log('💾 LocalStorage Check:');
    const expenses = localStorage.getItem('expenses');
    const income = localStorage.getItem('income');
    
    console.log('Expenses in localStorage:', expenses ? JSON.parse(expenses).length + ' items' : 'Empty');
    console.log('Income in localStorage:', income ? JSON.parse(income).length + ' items' : 'Empty');
}

// Test 5: Form event listener test
function testFormEvents() {
    console.log('📝 Testing form event listeners...');
    
    if (elements.expenseForm) {
        // Simulate form submission
        const event = new Event('submit', { bubbles: true, cancelable: true });
        elements.expenseForm.dispatchEvent(event);
        console.log('✅ Expense form submit event triggered');
    }
    
    if (elements.incomeForm) {
        // Simulate form submission  
        const event = new Event('submit', { bubbles: true, cancelable: true });
        elements.incomeForm.dispatchEvent(event);
        console.log('✅ Income form submit event triggered');
    }
}

// Run all tests
console.log('🏃‍♂️ Running all debug tests...');
checkLocalStorage();

// Make test functions available globally
window.testExpenseSubmission = testExpenseSubmission;
window.testIncomeSubmission = testIncomeSubmission;
window.testFormEvents = testFormEvents;
window.checkLocalStorage = checkLocalStorage;

console.log('📋 Available test functions:');
console.log('  - testExpenseSubmission()');
console.log('  - testIncomeSubmission()');
console.log('  - testFormEvents()');
console.log('  - checkLocalStorage()');

console.log('🎯 Try running: testExpenseSubmission() then check the expenses table!');
