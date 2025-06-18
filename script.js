// Expense Tracker Application - Fixed Version
class ExpenseTracker {
    constructor() {
        this.expenses = [];
        this.income = [];
        this.categories = this.getDefaultCategories();
        this.selectedForPayment = new Set();
        
        this.init();
    }

    async init() {
        console.log('ExpenseTracker init() called');
        this.setupEventListeners();
        this.loadCategories();
        this.loadFromLocalStorage();
        
        this.updateSummary();
        this.renderExpenses();
        this.renderIncome();
        this.renderReimbursements();
        this.renderCategories();
        this.renderAnalytics();
        this.setDefaultDate();
        
        console.log('ExpenseTracker init() completed');
    }

    getDefaultCategories() {
        return [
            { id: 'food', name: 'Food & Dining', color: '#ff6b6b' },
            { id: 'transport', name: 'Transportation', color: '#4ecdc4' },
            { id: 'utilities', name: 'Utilities', color: '#45b7d1' },
            { id: 'healthcare', name: 'Healthcare', color: '#96ceb4' },
            { id: 'entertainment', name: 'Entertainment', color: '#feca57' },
            { id: 'shopping', name: 'Shopping', color: '#ff9ff3' },
            { id: 'business', name: 'Business', color: '#54a0ff' },
            { id: 'other', name: 'Other', color: '#5f27cd' }
        ];
    }

    setDefaultDate() {
        const today = new Date().toISOString().split('T')[0];
        const expenseDate = document.getElementById('expense-date');
        const incomeDate = document.getElementById('income-date');
        if (expenseDate) expenseDate.value = today;
        if (incomeDate) incomeDate.value = today;
    }

    setupEventListeners() {
        console.log('Setting up event listeners');
        
        const expenseForm = document.getElementById('expense-form');
        const incomeForm = document.getElementById('income-form');
        
        if (expenseForm) {
            expenseForm.addEventListener('submit', (e) => {
                console.log('Expense form submitted');
                e.preventDefault();
                this.addExpense();
            });
            console.log('Expense form listener attached');
        } else {
            console.error('Expense form not found!');
        }

        if (incomeForm) {
            incomeForm.addEventListener('submit', (e) => {
                console.log('Income form submitted');
                e.preventDefault();
                this.addIncome();
            });
            console.log('Income form listener attached');
        } else {
            console.error('Income form not found!');
        }
    }

    addExpense() {
        console.log('addExpense() called');
        
        const description = document.getElementById('expense-description').value;
        const amount = parseFloat(document.getElementById('expense-amount').value);
        const category = document.getElementById('expense-category').value;
        const date = document.getElementById('expense-date').value;
        const isReimbursement = document.getElementById('expense-reimbursement').checked;

        console.log('Form values:', { description, amount, category, date, isReimbursement });

        if (!description || !amount || !category || !date) {
            console.log('Validation failed - missing fields');
            this.showNotification('Please fill in all fields', 'error');
            return;
        }

        const expense = {
            id: Date.now(),
            description,
            amount,
            category,
            date,
            isReimbursement,
            isPaid: false,
            paymentDate: null,
            timestamp: new Date().toISOString()
        };

        console.log('Adding expense:', expense);

        this.expenses.unshift(expense);
        this.saveExpenses();
        this.renderExpenses();
        this.renderReimbursements();
        this.updateSummary();
        this.renderAnalytics();
        this.resetForm('expense-form');
        this.showNotification('Expense added successfully!', 'success');
        
        console.log('Expense added successfully');
    }

    addIncome() {
        console.log('addIncome() called');
        
        const description = document.getElementById('income-description').value;
        const amount = parseFloat(document.getElementById('income-amount').value);
        const type = document.getElementById('income-type').value;
        const date = document.getElementById('income-date').value;

        console.log('Income form values:', { description, amount, type, date });

        if (!description || !amount || !type || !date) {
            console.log('Validation failed - missing fields');
            this.showNotification('Please fill in all fields', 'error');
            return;
        }

        const income = {
            id: Date.now(),
            description,
            amount,
            type,
            date,
            timestamp: new Date().toISOString()
        };

        console.log('Adding income:', income);

        this.income.unshift(income);
        this.saveIncome();
        this.renderIncome();
        this.updateSummary();
        this.renderAnalytics();
        this.resetForm('income-form');
        this.showNotification('Income added successfully!', 'success');
        
        console.log('Income added successfully');
    }

    saveExpenses() {
        console.log('Saving expenses to localStorage');
        localStorage.setItem('expenses', JSON.stringify(this.expenses));
    }

    saveIncome() {
        console.log('Saving income to localStorage');
        localStorage.setItem('income', JSON.stringify(this.income));
    }

    loadFromLocalStorage() {
        this.expenses = JSON.parse(localStorage.getItem('expenses')) || [];
        this.income = JSON.parse(localStorage.getItem('income')) || [];
        this.categories = JSON.parse(localStorage.getItem('categories')) || this.getDefaultCategories();
    }

    renderIncome() {
        const tbody = document.getElementById('income-tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';

        if (this.income.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #666;">No income recorded yet</td></tr>';
            return;
        }

        this.income.forEach(income => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${this.formatDate(income.date)}</td>
                <td>${income.description}</td>
                <td><span class="income-type-badge income-${income.type}">${income.type}</span></td>
                <td>$${income.amount.toFixed(2)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-danger btn-sm" onclick="expenseTracker.deleteIncome(${income.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    renderExpenses() {
        const tbody = document.getElementById('expenses-tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';

        const regularExpenses = this.expenses.filter(expense => !expense.isReimbursement);

        if (regularExpenses.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #666;">No expenses recorded yet</td></tr>';
            return;
        }

        regularExpenses.forEach(expense => {
            const category = this.categories.find(cat => cat.id === expense.category);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${this.formatDate(expense.date)}</td>
                <td>${expense.description}</td>
                <td>
                    <span style="display: inline-flex; align-items: center; gap: 8px;">
                        <span style="width: 12px; height: 12px; background: ${category?.color || '#ccc'}; border-radius: 50%;"></span>
                        ${category?.name || 'Unknown'}
                    </span>
                </td>
                <td>$${expense.amount.toFixed(2)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-danger btn-sm" onclick="expenseTracker.deleteExpense(${expense.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    renderReimbursements() {
        const tbody = document.getElementById('reimbursements-tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';

        const reimbursements = this.expenses.filter(expense => expense.isReimbursement);

        if (reimbursements.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #666;">No reimbursement expenses recorded yet</td></tr>';
            return;
        }

        reimbursements.forEach(expense => {
            const category = this.categories.find(cat => cat.id === expense.category);
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>
                    ${!expense.isPaid ? `<input type="checkbox" class="table-checkbox">` : ''}
                </td>
                <td>${this.formatDate(expense.date)}</td>
                <td>${expense.description}</td>
                <td>
                    <span style="display: inline-flex; align-items: center; gap: 8px;">
                        <span style="width: 12px; height: 12px; background: ${category?.color || '#ccc'}; border-radius: 50%;"></span>
                        ${category?.name || 'Unknown'}
                    </span>
                </td>
                <td>$${expense.amount.toFixed(2)}</td>
                <td>
                    ${expense.paymentDate ? this.formatDate(expense.paymentDate) : '-'}
                </td>
                <td>
                    <span class="status-badge status-${expense.isPaid ? 'paid' : 'pending'}">
                        ${expense.isPaid ? 'Paid' : 'Pending'}
                    </span>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    renderCategories() {
        const grid = document.getElementById('categories-grid');
        if (!grid) return;
        
        grid.innerHTML = '';

        this.categories.forEach(category => {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'category-item';
            categoryDiv.innerHTML = `
                <div class="category-info">
                    <div class="category-color" style="background-color: ${category.color}"></div>
                    <span class="category-name">${category.name}</span>
                </div>
            `;
            grid.appendChild(categoryDiv);
        });
    }

    renderAnalytics() {
        // Simple analytics
        const monthlyExpenseTotal = this.expenses.reduce((sum, expense) => sum + expense.amount, 0);
        const avgDaily = monthlyExpenseTotal / 30;
        const pendingReimbursements = this.expenses
            .filter(expense => expense.isReimbursement && !expense.isPaid)
            .reduce((sum, expense) => sum + expense.amount, 0);

        const monthlySpendingEl = document.getElementById('monthly-spending');
        const avgDailyEl = document.getElementById('avg-daily');
        const pendingReimburseEl = document.getElementById('pending-reimburse');

        if (monthlySpendingEl) monthlySpendingEl.textContent = `$${monthlyExpenseTotal.toFixed(2)}`;
        if (avgDailyEl) avgDailyEl.textContent = `$${avgDaily.toFixed(2)}`;
        if (pendingReimburseEl) pendingReimburseEl.textContent = `$${pendingReimbursements.toFixed(2)}`;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    resetForm(formId) {
        const form = document.getElementById(formId);
        if (form) {
            form.reset();
            this.setDefaultDate();
        }
    }

    deleteExpense(id) {
        if (confirm('Are you sure you want to delete this expense?')) {
            this.expenses = this.expenses.filter(expense => expense.id !== id);
            this.saveExpenses();
            this.renderExpenses();
            this.renderReimbursements();
            this.updateSummary();
            this.renderAnalytics();
            this.showNotification('Expense deleted successfully!', 'success');
        }
    }

    deleteIncome(id) {
        if (confirm('Are you sure you want to delete this income entry?')) {
            this.income = this.income.filter(income => income.id !== id);
            this.saveIncome();
            this.renderIncome();
            this.updateSummary();
            this.renderAnalytics();
            this.showNotification('Income deleted successfully!', 'success');
        }
    }

    showNotification(message, type = 'info') {
        const container = document.getElementById('notification-container');
        if (!container) return;
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            ${message}
            <button class="notification-close" onclick="this.parentElement.remove()">×</button>
        `;
        
        container.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
}

// Global functions for HTML onclick events
function showTab(tabName) {
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
    
    // Refresh analytics when analytics tab is shown
    if (tabName === 'analytics' && window.expenseTracker) {
        window.expenseTracker.renderAnalytics();
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded - Initializing Expense Tracker');
    try {
        window.expenseTracker = new ExpenseTracker();
        console.log('Expense Tracker initialized successfully');
    } catch (error) {
        console.error('Failed to initialize Expense Tracker:', error);
    }
});
