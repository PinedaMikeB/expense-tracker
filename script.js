// Expense Tracker Application - Firebase Cloud Sync Version
class ExpenseTracker {
    constructor() {
        this.expenses = [];
        this.income = [];
        this.pettyCash = [];
        this.categories = this.getDefaultCategories();
        this.incomeCategories = this.getDefaultIncomeCategories();
        this.selectedForPayment = new Set();
        this.currentUser = null;
        this.isOnline = true;
        
        // Wait for Firebase to initialize before starting the app
        this.waitForFirebase().then(() => {
            this.init();
        });
    }

    async waitForFirebase() {
        // Wait for Firebase to be available
        while (!window.firebase || !window.db || !window.auth) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Set up auth state listener
        window.auth.onAuthStateChanged((user) => {
            this.handleAuthStateChange(user);
        });
        
        console.log('🔥 Firebase ready');
    }

    handleAuthStateChange(user) {
        this.currentUser = user;
        
        const loginForm = document.getElementById('login-form');
        const userInfo = document.getElementById('user-info');
        const userEmail = document.getElementById('user-email');
        const syncStatus = document.getElementById('sync-status');
        
        if (user) {
            // User is signed in
            loginForm.style.display = 'none';
            userInfo.style.display = 'flex';
            userEmail.textContent = user.email;
            syncStatus.textContent = 'Cloud Sync';
            syncStatus.style.color = '#4caf50';
            
            console.log('👤 User signed in:', user.email);
            
            // Load data from cloud
            this.loadFromCloud();
        } else {
            // User is signed out
            loginForm.style.display = 'flex';
            userInfo.style.display = 'none';
            syncStatus.textContent = 'Local Storage';
            syncStatus.style.color = '#666';
            
            console.log('👤 User signed out');
            
            // Load from localStorage as fallback
            this.loadFromLocalStorage();
            this.updateUI();
        }
    }

    async init() {
        console.log('ExpenseTracker init() called');
        this.setupEventListeners();
        this.setupModalCloseHandler();
        this.loadCategories();
        this.loadFromLocalStorage();
        
        this.updateSummary();
        this.renderExpenses();
        this.renderIncome();
        this.renderReimbursements();
        this.renderPettyCash();
        this.updatePettyCashSummary();
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
            { id: 'petty-cash', name: 'Petty Cash', color: '#fd79a8' },
            { id: 'other', name: 'Other', color: '#5f27cd' }
        ];
    }

    getDefaultIncomeCategories() {
        return [
            { id: 'salary', name: 'Salary', color: '#4caf50' },
            { id: 'freelance', name: 'Freelance', color: '#2196f3' },
            { id: 'business', name: 'Business Income', color: '#ff9800' },
            { id: 'investment', name: 'Investment Returns', color: '#9c27b0' },
            { id: 'bonus', name: 'Bonus', color: '#00bcd4' },
            { id: 'reimbursement', name: 'Reimbursement', color: '#795548' },
            { id: 'gift', name: 'Gift/Award', color: '#e91e63' },
            { id: 'other-income', name: 'Other Income', color: '#607d8b' }
        ];
    }

    setDefaultDate() {
        const today = new Date().toISOString().split('T')[0];
        const expenseDate = document.getElementById('expense-date');
        const incomeDate = document.getElementById('income-date');
        const pettyCashDate = document.getElementById('petty-cash-date');
        if (expenseDate) expenseDate.value = today;
        if (incomeDate) incomeDate.value = today;
        if (pettyCashDate) pettyCashDate.value = today;
    }

    setupEventListeners() {
        console.log('Setting up event listeners');
        
        const expenseForm = document.getElementById('expense-form');
        const incomeForm = document.getElementById('income-form');
        const categoryForm = document.getElementById('category-form');
        
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

        if (categoryForm) {
            categoryForm.addEventListener('submit', (e) => {
                console.log('Category form submitted');
                e.preventDefault();
                this.addCategory();
            });
            console.log('Category form listener attached');
        } else {
            console.error('Category form not found!');
        }

        const pettyCashForm = document.getElementById('petty-cash-form');
        if (pettyCashForm) {
            pettyCashForm.addEventListener('submit', (e) => {
                console.log('Petty cash form submitted');
                e.preventDefault();
                this.addPettyCashTransaction(e);
            });
            console.log('Petty cash form listener attached');
        } else {
            console.error('Petty cash form not found!');
        }
    }

    addExpense() {
        console.log('addExpense() called');
        
        const description = document.getElementById('expense-description').value;
        const amount = parseFloat(document.getElementById('expense-amount').value);
        const category = document.getElementById('expense-category').value;
        const date = document.getElementById('expense-date').value;
        const isReimbursement = document.getElementById('expense-reimbursement').checked;
        const form = document.getElementById('expense-form');
        const editingId = form.dataset.editingId;

        console.log('Form values:', { description, amount, category, date, isReimbursement, editingId });

        if (!description || !amount || !category || !date) {
            console.log('Validation failed - missing fields');
            this.showNotification('Please fill in all fields', 'error');
            return;
        }

        if (editingId) {
            // Update existing expense
            const expenseIndex = this.expenses.findIndex(exp => exp.id == editingId);
            if (expenseIndex !== -1) {
                this.expenses[expenseIndex] = {
                    ...this.expenses[expenseIndex],
                    description,
                    amount,
                    category,
                    date,
                    isReimbursement
                };
                console.log('Updating expense:', this.expenses[expenseIndex]);
                this.showNotification('Expense updated successfully!', 'success');
            }
            
            // Reset form to add mode
            const submitButton = form.querySelector('button[type="submit"]');
            submitButton.innerHTML = submitButton.originalText || '<i class="fas fa-plus"></i> Add Expense';
            delete form.dataset.editingId;
            
        } else {
            // Create new expense
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

            console.log('Adding new expense:', expense);
            this.expenses.unshift(expense);
            this.showNotification('Expense added successfully!', 'success');
        }

        this.saveExpensesToCloud();
        this.renderExpenses();
        this.renderReimbursements();
        this.updateSummary();
        this.renderAnalytics();
        this.resetForm('expense-form');
        
        console.log('Expense operation completed successfully');
    }

    addIncome() {
        console.log('addIncome() called');
        
        const description = document.getElementById('income-description').value;
        const amount = parseFloat(document.getElementById('income-amount').value);
        const type = document.getElementById('income-type').value;
        const date = document.getElementById('income-date').value;
        const form = document.getElementById('income-form');
        const editingId = form.dataset.editingId;

        console.log('Income form values:', { description, amount, type, date, editingId });

        if (!description || !amount || !type || !date) {
            console.log('Validation failed - missing fields');
            this.showNotification('Please fill in all fields', 'error');
            return;
        }

        if (editingId) {
            // Update existing income
            const incomeIndex = this.income.findIndex(inc => inc.id == editingId);
            if (incomeIndex !== -1) {
                this.income[incomeIndex] = {
                    ...this.income[incomeIndex],
                    description,
                    amount,
                    type,
                    date
                };
                console.log('Updating income:', this.income[incomeIndex]);
                this.showNotification('Income updated successfully!', 'success');
            }
            
            // Reset form to add mode
            const submitButton = form.querySelector('button[type="submit"]');
            submitButton.innerHTML = submitButton.originalText || '<i class="fas fa-plus"></i> Add Income';
            delete form.dataset.editingId;
            
        } else {
            // Create new income
            const income = {
                id: Date.now(),
                description,
                amount,
                type,
                date,
                timestamp: new Date().toISOString()
            };

            console.log('Adding new income:', income);
            this.income.unshift(income);
            this.showNotification('Income added successfully!', 'success');
        }

        this.saveIncomeToCloud();
        this.renderIncome();
        this.updateSummary();
        this.renderAnalytics();
        this.resetForm('income-form');
        
        console.log('Income operation completed successfully');
    }

    addCategory() {
        console.log('addCategory() called');
        
        const name = document.getElementById('category-name').value;
        const color = document.getElementById('category-color').value;
        const type = document.getElementById('category-type')?.value || 'expense';

        console.log('Category form values:', { name, color, type });

        if (!name || !color) {
            console.log('Validation failed - missing fields');
            this.showNotification('Please fill in all fields', 'error');
            return;
        }

        const targetCategories = type === 'expense' ? this.categories : this.incomeCategories;

        // Check if category already exists
        if (targetCategories.some(cat => cat.name.toLowerCase() === name.toLowerCase())) {
            this.showNotification('Category already exists!', 'error');
            return;
        }

        const category = {
            id: name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now(),
            name,
            color
        };

        console.log('Adding category:', category);

        if (type === 'expense') {
            this.categories.push(category);
        } else {
            this.incomeCategories.push(category);
        }

        this.saveCategoriesToCloud();
        this.loadCategories();
        this.renderCategories();
        this.resetForm('category-form');
        this.showNotification(`${type} category added successfully!`, 'success');
        
        console.log('Category added successfully');
    }

    saveExpenses() {
        console.log('Saving expenses to localStorage');
        localStorage.setItem('expenses', JSON.stringify(this.expenses));
    }

    saveIncome() {
        console.log('Saving income to localStorage');
        localStorage.setItem('income', JSON.stringify(this.income));
    }

    savePettyCash() {
        console.log('Saving petty cash to localStorage');
        localStorage.setItem('pettyCash', JSON.stringify(this.pettyCash));
    }

    saveCategories() {
        console.log('Saving categories to localStorage');
        localStorage.setItem('categories', JSON.stringify(this.categories));
        localStorage.setItem('incomeCategories', JSON.stringify(this.incomeCategories));
    }

    loadCategories() {
        console.log('Loading categories into dropdown');
        
        // Load expense categories
        const categorySelect = document.getElementById('expense-category');
        if (categorySelect) {
            categorySelect.innerHTML = '<option value="">Select Category</option>';
            this.categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                categorySelect.appendChild(option);
            });
            console.log('Expense categories loaded:', this.categories.length);
        }

        // Load income categories
        const incomeTypeSelect = document.getElementById('income-type');
        if (incomeTypeSelect) {
            incomeTypeSelect.innerHTML = '<option value="">Select Type</option>';
            this.incomeCategories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                incomeTypeSelect.appendChild(option);
            });
            console.log('Income categories loaded:', this.incomeCategories.length);
        }

        // Load petty cash categories (same as expense categories, excluding petty-cash itself)
        const pettyCashCategorySelect = document.getElementById('petty-cash-category');
        if (pettyCashCategorySelect) {
            pettyCashCategorySelect.innerHTML = '<option value="">Select Category</option>';
            // Filter out 'petty-cash' category from dropdown to prevent circular allocation
            this.categories.filter(cat => cat.id !== 'petty-cash').forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                pettyCashCategorySelect.appendChild(option);
            });
            console.log('Petty cash categories loaded:', this.categories.length - 1);
        }
    }

    updateSummary() {
        console.log('Updating summary cards');
        
        // Calculate totals (exclude petty cash allocations)
        const totalIncome = this.income.reduce((sum, income) => sum + income.amount, 0);
        const totalExpenses = this.expenses
            .filter(expense => {
                const category = this.categories.find(cat => cat.id === expense.category);
                return category?.name !== 'Petty Cash';
            })
            .reduce((sum, expense) => sum + expense.amount, 0);
        const pendingReimbursements = this.expenses
            .filter(expense => expense.isReimbursement && !expense.isPaid)
            .reduce((sum, expense) => sum + expense.amount, 0);
        const netBalance = totalIncome - totalExpenses;

        // Update DOM elements
        const totalIncomeEl = document.getElementById('total-income');
        const totalExpensesEl = document.getElementById('total-expenses');
        const totalReimbursementsEl = document.getElementById('total-reimbursements');
        const netBalanceEl = document.getElementById('net-balance');

        if (totalIncomeEl) totalIncomeEl.textContent = this.formatCurrency(totalIncome);
        if (totalExpensesEl) totalExpensesEl.textContent = this.formatCurrency(totalExpenses);
        if (totalReimbursementsEl) totalReimbursementsEl.textContent = this.formatCurrency(pendingReimbursements);
        if (netBalanceEl) {
            netBalanceEl.textContent = this.formatCurrency(netBalance);
            netBalanceEl.style.color = netBalance >= 0 ? '#4caf50' : '#f44336';
        }

        console.log('Summary updated:', { totalIncome, totalExpenses, pendingReimbursements, netBalance });
    }

    formatCurrency(amount) {
        return `₱${amount.toLocaleString('en-PH', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
        })}`;
    }

    loadFromLocalStorage() {
        this.expenses = JSON.parse(localStorage.getItem('expenses')) || [];
        this.income = JSON.parse(localStorage.getItem('income')) || [];
        this.pettyCash = JSON.parse(localStorage.getItem('pettyCash')) || [];
        this.categories = JSON.parse(localStorage.getItem('categories')) || this.getDefaultCategories();
        this.incomeCategories = JSON.parse(localStorage.getItem('incomeCategories')) || this.getDefaultIncomeCategories();
    }

    async loadFromCloud() {
        if (!this.currentUser) return;
        
        try {
            console.log('☁️ Loading data from cloud...');
            
            // Load expenses
            const expensesSnapshot = await window.db
                .collection('users')
                .doc(this.currentUser.uid)
                .collection('expenses')
                .orderBy('timestamp', 'desc')
                .get();
            
            this.expenses = expensesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            // Load income
            const incomeSnapshot = await window.db
                .collection('users')
                .doc(this.currentUser.uid)
                .collection('income')
                .orderBy('timestamp', 'desc')
                .get();
            
            this.income = incomeSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Load petty cash
            const pettyCashSnapshot = await window.db
                .collection('users')
                .doc(this.currentUser.uid)
                .collection('pettyCash')
                .orderBy('timestamp', 'desc')
                .get();
            
            this.pettyCash = pettyCashSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            // Load categories
            const categoriesDoc = await window.db
                .collection('users')
                .doc(this.currentUser.uid)
                .collection('settings')
                .doc('categories')
                .get();
            
            if (categoriesDoc.exists) {
                const data = categoriesDoc.data();
                this.categories = data.categories || this.getDefaultCategories();
                this.incomeCategories = data.incomeCategories || this.getDefaultIncomeCategories();
            } else {
                this.categories = this.getDefaultCategories();
                this.incomeCategories = this.getDefaultIncomeCategories();
                await this.saveCategoriesToCloud();
            }
            
            console.log('✅ Data loaded from cloud');
            this.updateUI();
            
        } catch (error) {
            console.error('❌ Error loading from cloud:', error);
            this.showNotification('Failed to load data from cloud. Using local data.', 'warning');
            this.loadFromLocalStorage();
            this.updateUI();
        }
    }

    async saveExpensesToCloud() {
        if (!this.currentUser) {
            this.saveExpenses(); // Fallback to localStorage
            return;
        }
        
        try {
            const batch = window.db.batch();
            const userExpensesRef = window.db
                .collection('users')
                .doc(this.currentUser.uid)
                .collection('expenses');
            
            // Clear existing expenses and add new ones
            const existingExpenses = await userExpensesRef.get();
            existingExpenses.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
            
            // Add current expenses
            this.expenses.forEach(expense => {
                const docRef = userExpensesRef.doc(expense.id.toString());
                batch.set(docRef, expense);
            });
            
            await batch.commit();
            console.log('✅ Expenses saved to cloud');
            
        } catch (error) {
            console.error('❌ Error saving expenses to cloud:', error);
            this.saveExpenses(); // Fallback to localStorage
        }
    }

    async saveIncomeToCloud() {
        if (!this.currentUser) {
            this.saveIncome(); // Fallback to localStorage
            return;
        }
        
        try {
            const batch = window.db.batch();
            const userIncomeRef = window.db
                .collection('users')
                .doc(this.currentUser.uid)
                .collection('income');
            
            // Clear existing income and add new ones
            const existingIncome = await userIncomeRef.get();
            existingIncome.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
            
            // Add current income
            this.income.forEach(income => {
                const docRef = userIncomeRef.doc(income.id.toString());
                batch.set(docRef, income);
            });
            
            await batch.commit();
            console.log('✅ Income saved to cloud');
            
        } catch (error) {
            console.error('❌ Error saving income to cloud:', error);
            this.saveIncome(); // Fallback to localStorage
        }
    }

    async savePettyCashToCloud() {
        if (!this.currentUser) {
            this.savePettyCash(); // Fallback to localStorage
            return;
        }
        
        try {
            const batch = window.db.batch();
            const userPettyCashRef = window.db
                .collection('users')
                .doc(this.currentUser.uid)
                .collection('pettyCash');
            
            // Clear existing petty cash and add new ones
            const existingPettyCash = await userPettyCashRef.get();
            existingPettyCash.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
            
            // Add current petty cash
            this.pettyCash.forEach(transaction => {
                const docRef = userPettyCashRef.doc(transaction.id.toString());
                batch.set(docRef, transaction);
            });
            
            await batch.commit();
            console.log('✅ Petty cash saved to cloud');
            
        } catch (error) {
            console.error('❌ Error saving petty cash to cloud:', error);
            this.savePettyCash(); // Fallback to localStorage
        }
    }

    async saveCategoriesToCloud() {
        if (!this.currentUser) {
            this.saveCategories(); // Fallback to localStorage
            return;
        }
        
        try {
            await window.db
                .collection('users')
                .doc(this.currentUser.uid)
                .collection('settings')
                .doc('categories')
                .set({ 
                    categories: this.categories,
                    incomeCategories: this.incomeCategories 
                });
            
            console.log('✅ Categories saved to cloud');
            
        } catch (error) {
            console.error('❌ Error saving categories to cloud:', error);
            this.saveCategories(); // Fallback to localStorage
        }
    }

    updateUI() {
        this.updateSummary();
        this.renderExpenses();
        this.renderIncome();
        this.renderReimbursements();
        this.renderPettyCash();
        this.updatePettyCashSummary();
        this.renderCategories();
        this.renderAnalytics();
        this.loadCategories();
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
                <td>${this.formatCurrency(income.amount)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-primary btn-sm" onclick="expenseTracker.editIncome(${income.id})">
                            <i class="fas fa-edit"></i>
                        </button>
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

        const regularExpenses = this.expenses.filter(expense => {
            if (expense.isReimbursement) return false;
            
            // Check if this is a petty cash allocation by category name
            const category = this.categories.find(cat => cat.id === expense.category);
            const isPettyCashAllocation = category?.name === 'Petty Cash';
            
            return !isPettyCashAllocation;
        });

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
                <td>${this.formatCurrency(expense.amount)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-primary btn-sm" onclick="expenseTracker.editExpense(${expense.id})">
                            <i class="fas fa-edit"></i>
                        </button>
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
                <td>${this.formatCurrency(expense.amount)}</td>
                <td>
                    ${expense.paymentDate ? this.formatDate(expense.paymentDate) : '-'}
                </td>
                <td>
                    ${expense.isPaid ? 
                        `<span class="status-badge status-paid">Paid</span>` :
                        `<span class="status-badge status-pending" onclick="expenseTracker.openPaymentModal(${expense.id})">Pending</span>`
                    }
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    renderCategories() {
        const grid = document.getElementById('categories-grid');
        if (!grid) return;
        
        grid.innerHTML = '';

        // Expense Categories Section
        const expenseCategoriesSection = document.createElement('div');
        expenseCategoriesSection.innerHTML = '<h3>💸 Expense Categories</h3>';
        expenseCategoriesSection.className = 'category-section';
        
        this.categories.forEach(category => {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'category-item';
            categoryDiv.innerHTML = `
                <div class="category-info">
                    <div class="category-color" style="background-color: ${category.color}"></div>
                    <span class="category-name">${category.name}</span>
                </div>
                <div class="category-actions">
                    <button class="btn btn-sm btn-primary" onclick="expenseTracker.editCategory('${category.id}', 'expense')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="expenseTracker.deleteCategory('${category.id}', 'expense')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            expenseCategoriesSection.appendChild(categoryDiv);
        });
        
        // Income Categories Section
        const incomeCategoriesSection = document.createElement('div');
        incomeCategoriesSection.innerHTML = '<h3>💰 Income Categories</h3>';
        incomeCategoriesSection.className = 'category-section';
        
        this.incomeCategories.forEach(category => {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'category-item';
            categoryDiv.innerHTML = `
                <div class="category-info">
                    <div class="category-color" style="background-color: ${category.color}"></div>
                    <span class="category-name">${category.name}</span>
                </div>
                <div class="category-actions">
                    <button class="btn btn-sm btn-primary" onclick="expenseTracker.editCategory('${category.id}', 'income')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="expenseTracker.deleteCategory('${category.id}', 'income')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            incomeCategoriesSection.appendChild(categoryDiv);
        });

        grid.appendChild(expenseCategoriesSection);
        grid.appendChild(incomeCategoriesSection);
    }

    editCategory(categoryId, type) {
        const categories = type === 'expense' ? this.categories : this.incomeCategories;
        const category = categories.find(cat => cat.id === categoryId);
        if (!category) return;

        const newName = prompt(`Edit ${type} category name:`, category.name);
        if (newName && newName.trim()) {
            category.name = newName.trim();
            this.saveCategoriesToCloud();
            this.renderCategories();
            this.loadCategories();
            this.showNotification(`${type} category updated successfully!`, 'success');
        }
    }

    deleteCategory(categoryId, type) {
        if (!confirm(`Are you sure you want to delete this ${type} category?`)) return;

        if (type === 'expense') {
            this.categories = this.categories.filter(cat => cat.id !== categoryId);
        } else {
            this.incomeCategories = this.incomeCategories.filter(cat => cat.id !== categoryId);
        }

        this.saveCategoriesToCloud();
        this.renderCategories();
        this.loadCategories();
        this.showNotification(`${type} category deleted successfully!`, 'success');
    }

    renderAnalytics() {
        console.log('🔍 renderAnalytics called');
        console.log('🔍 Current expenses:', this.expenses);
        console.log('🔍 Current income:', this.income);
        
        // If no data exists, show sample data option
        if (this.expenses.length === 0) {
            console.log('🔍 No expenses found, showing empty analytics');
            this.renderEmptyAnalytics();
            return;
        }
        
        // Enhanced analytics calculations (excluding petty cash allocations AND reimbursements)
        const actualExpenses = this.expenses.filter(expense => {
            const category = this.categories.find(cat => cat.id === expense.category);
            return category?.name !== 'Petty Cash' && !expense.isReimbursement;
        });
        console.log('🔍 actualExpenses for analytics (excluding reimbursements):', actualExpenses.length, actualExpenses);
        
        const totalExpenses = actualExpenses.reduce((sum, expense) => sum + expense.amount, 0);
        const totalIncome = this.income.reduce((sum, income) => sum + income.amount, 0);
        const avgDaily = totalExpenses / 30;
        const pendingReimbursements = this.expenses
            .filter(expense => expense.isReimbursement && !expense.isPaid)
            .reduce((sum, expense) => sum + expense.amount, 0);
        const monthlyNet = totalIncome - totalExpenses;

        // Find top expense category (excluding petty cash allocations)
        const categoryTotals = {};
        actualExpenses.forEach(expense => {
            if (!categoryTotals[expense.category]) {
                categoryTotals[expense.category] = 0;
            }
            categoryTotals[expense.category] += expense.amount;
        });

        const topCategoryId = Object.keys(categoryTotals).reduce((a, b) => 
            categoryTotals[a] > categoryTotals[b] ? a : b, Object.keys(categoryTotals)[0]);
        
        const topCategory = this.categories.find(cat => cat.id === topCategoryId);
        const topCategoryName = topCategory ? topCategory.name : '-';

        // Update analytics display
        const monthlySpendingEl = document.getElementById('monthly-spending');
        const avgDailyEl = document.getElementById('avg-daily');
        const pendingReimburseEl = document.getElementById('pending-reimburse');
        const topCategoryEl = document.getElementById('top-category');

        if (monthlySpendingEl) monthlySpendingEl.textContent = this.formatCurrency(monthlyNet);
        if (avgDailyEl) avgDailyEl.textContent = this.formatCurrency(avgDaily);
        if (pendingReimburseEl) pendingReimburseEl.textContent = this.formatCurrency(pendingReimbursements);
        if (topCategoryEl) topCategoryEl.textContent = topCategoryName;

        // Generate smart financial tips
        this.generateFinancialTips(totalIncome, totalExpenses, categoryTotals, monthlyNet);
        
        // Generate category breakdown chart
        this.renderCategoryBreakdown(categoryTotals);
        
        // Generate monthly trend chart
        this.renderMonthlyTrend(actualExpenses);
    }

    renderEmptyAnalytics() {
        console.log('🔍 renderEmptyAnalytics called');
        // Show sample data option when no data exists
        const categoryContainer = document.getElementById('categoryChart');
        const trendContainer = document.getElementById('trendChart');
        
        console.log('🔍 categoryChart element:', categoryContainer);
        console.log('🔍 trendChart element:', trendContainer);
        
        if (categoryContainer) {
            categoryContainer.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <p style="color: #666; margin-bottom: 20px; font-size: 16px;">📊 No expenses recorded yet</p>
                    <button onclick="expenseTracker.addSampleData()" class="btn btn-primary" style="
                        background: linear-gradient(145deg, #51cf66, #40c057);
                        color: white;
                        padding: 15px 30px;
                        border: none;
                        border-radius: 8px;
                        font-size: 16px;
                        font-weight: 500;
                        cursor: pointer;
                        box-shadow: 0 4px 15px rgba(81, 207, 102, 0.3);
                    ">
                        🚀 Add Sample Data to Test Charts
                    </button>
                </div>
            `;
            console.log('🔍 Category chart HTML set');
        } else {
            console.error('🔍 categoryChart element not found!');
        }
        
        if (trendContainer) {
            trendContainer.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <p style="color: #666; font-size: 16px;">📈 Add some expenses to see monthly trends</p>
                </div>
            `;
            console.log('🔍 Trend chart HTML set');
        } else {
            console.error('🔍 trendChart element not found!');
        }
    }

    addSampleData() {
        // Add sample expenses for testing
        const sampleExpenses = [
            {
                id: Date.now() + 1,
                description: 'Groceries at Supermarket',
                amount: 2500,
                category: 'food',
                date: '2024-06-20',
                isReimbursement: false,
                isPaid: false,
                paymentDate: null,
                timestamp: new Date().toISOString()
            },
            {
                id: Date.now() + 2,
                description: 'Grab Transportation',
                amount: 350,
                category: 'transport',
                date: '2024-06-21',
                isReimbursement: false,
                isPaid: false,
                paymentDate: null,
                timestamp: new Date().toISOString()
            },
            {
                id: Date.now() + 3,
                description: 'Business Lunch Meeting',
                amount: 1200,
                category: 'business',
                date: '2024-06-22',
                isReimbursement: true,
                isPaid: false,
                paymentDate: null,
                timestamp: new Date().toISOString()
            },
            {
                id: Date.now() + 4,
                description: 'Movie Tickets',
                amount: 800,
                category: 'entertainment',
                date: '2024-06-23',
                isReimbursement: false,
                isPaid: false,
                paymentDate: null,
                timestamp: new Date().toISOString()
            },
            {
                id: Date.now() + 5,
                description: 'Electric Bill',
                amount: 3200,
                category: 'utilities',
                date: '2024-06-18',
                isReimbursement: false,
                isPaid: false,
                paymentDate: null,
                timestamp: new Date().toISOString()
            },
            {
                id: Date.now() + 6,
                description: 'Shopping - Clothes',
                amount: 4500,
                category: 'shopping',
                date: '2024-06-15',
                isReimbursement: false,
                isPaid: false,
                paymentDate: null,
                timestamp: new Date().toISOString()
            }
        ];

        // Add sample income
        const sampleIncome = [
            {
                id: Date.now() + 10,
                description: 'Monthly Salary',
                amount: 50000,
                type: 'salary',
                date: '2024-06-01',
                timestamp: new Date().toISOString()
            },
            {
                id: Date.now() + 11,
                description: 'Freelance Project',
                amount: 15000,
                type: 'freelance',
                date: '2024-06-10',
                timestamp: new Date().toISOString()
            }
        ];

        // Add to arrays
        this.expenses.push(...sampleExpenses);
        this.income.push(...sampleIncome);

        // Save and update UI
        this.saveExpensesToCloud();
        this.saveIncomeToCloud();
        this.updateUI();
        
        this.showNotification('Sample data added! Check out your analytics now.', 'success');
    }

    renderCategoryBreakdown(categoryTotals) {
        console.log('🔍 renderCategoryBreakdown called with:', categoryTotals);
        const container = document.getElementById('categoryChart');
        console.log('🔍 categoryChart container found:', !!container);
        
        if (!container) return;

        // Clear existing content
        container.innerHTML = '';
        
        // Create pie chart
        const total = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);
        console.log('🔍 Total amount for charts:', total);
        
        if (total === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">No actual expenses recorded yet</p>';
            return;
        }

        // Sort categories by amount (descending)
        const sortedCategories = Object.entries(categoryTotals)
            .sort(([,a], [,b]) => b - a);

        // Create pie chart using CSS conic-gradient
        let currentPercent = 0;
        let gradientStops = [];
        let legendHTML = '';

        sortedCategories.forEach(([categoryId, amount], index) => {
            const category = this.categories.find(cat => cat.id === categoryId);
            const percentage = (amount / total) * 100;
            const color = category?.color || `hsl(${index * 45}, 70%, 60%)`;
            
            // Add to gradient stops
            if (gradientStops.length > 0) {
                gradientStops.push(`${color} ${currentPercent}%`);
            } else {
                gradientStops.push(`${color} 0%`);
            }
            currentPercent += percentage;
            gradientStops.push(`${color} ${currentPercent}%`);
            
            // Add to legend with hover effects
            legendHTML += `
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; padding: 8px; border-radius: 6px; transition: all 0.3s ease; cursor: pointer;" 
                     onmouseover="this.style.backgroundColor='#f8f9fa'; this.style.transform='translateX(5px)'" 
                     onmouseout="this.style.backgroundColor='transparent'; this.style.transform='translateX(0)'">
                    <div style="display: flex; align-items: center;">
                        <div style="width: 16px; height: 16px; background: ${color}; border-radius: 50%; margin-right: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);"></div>
                        <span style="font-weight: 500; color: #333;">${category?.name || 'Unknown'}</span>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-weight: 600; color: #333;">${this.formatCurrency(amount)}</div>
                        <div style="font-size: 12px; color: #666;">${percentage.toFixed(1)}%</div>
                    </div>
                </div>
            `;
        });

        // Create responsive layout
        const pieChartHTML = `
            <div style="display: flex; flex-direction: column; gap: 25px; padding: 20px;">
                <!-- Mobile-first: stack on small screens -->
                <div style="display: flex; flex-wrap: wrap; gap: 25px; align-items: flex-start;">
                    <!-- Pie Chart -->
                    <div style="flex: 0 0 auto; margin: 0 auto;">
                        <div style="
                            width: 220px; 
                            height: 220px; 
                            border-radius: 50%; 
                            background: conic-gradient(${gradientStops.join(', ')});
                            box-shadow: 0 8px 25px rgba(0,0,0,0.15);
                            border: 4px solid white;
                            position: relative;
                            transition: transform 0.3s ease;
                        " 
                        onmouseover="this.style.transform='scale(1.05)'" 
                        onmouseout="this.style.transform='scale(1)'">
                            <!-- Center label -->
                            <div style="
                                position: absolute;
                                top: 50%;
                                left: 50%;
                                transform: translate(-50%, -50%);
                                background: white;
                                border-radius: 50%;
                                width: 80px;
                                height: 80px;
                                display: flex;
                                flex-direction: column;
                                align-items: center;
                                justify-content: center;
                                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                            ">
                                <div style="font-size: 12px; color: #666; font-weight: 500;">TOTAL</div>
                                <div style="font-size: 14px; color: #333; font-weight: 600;">${this.formatCurrency(total)}</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Legend -->
                    <div style="flex: 1; min-width: 280px;">
                        <h4 style="margin: 0 0 20px 0; color: #333; font-size: 18px; font-weight: 600;">💸 Spending Breakdown</h4>
                        <div style="max-height: 300px; overflow-y: auto; padding-right: 10px;">
                            ${legendHTML}
                        </div>
                        
                        <!-- Summary Stats -->
                        <div style="border-top: 2px solid #eee; padding-top: 15px; margin-top: 20px;">
                            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; text-align: center;">
                                <div>
                                    <div style="font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px;">Categories</div>
                                    <div style="font-size: 20px; font-weight: 600; color: #667eea;">${sortedCategories.length}</div>
                                </div>
                                <div>
                                    <div style="font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px;">Avg per Category</div>
                                    <div style="font-size: 20px; font-weight: 600; color: #667eea;">${this.formatCurrency(total / sortedCategories.length)}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Top 3 Categories Quick Stats -->
                <div style="background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1)); border-radius: 12px; padding: 20px;">
                    <h5 style="margin: 0 0 15px 0; color: #333; font-size: 16px;">🏆 Top 3 Categories</h5>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px;">
                        ${sortedCategories.slice(0, 3).map(([categoryId, amount], index) => {
                            const category = this.categories.find(cat => cat.id === categoryId);
                            const percentage = (amount / total) * 100;
                            const medal = ['🥇', '🥈', '🥉'][index];
                            return `
                                <div style="text-align: center; padding: 15px; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                                    <div style="font-size: 24px; margin-bottom: 5px;">${medal}</div>
                                    <div style="font-size: 14px; font-weight: 600; color: #333; margin-bottom: 5px;">${category?.name || 'Unknown'}</div>
                                    <div style="font-size: 16px; font-weight: 700; color: ${category?.color || '#667eea'};">${this.formatCurrency(amount)}</div>
                                    <div style="font-size: 12px; color: #666;">${percentage.toFixed(1)}%</div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        `;
        
        container.innerHTML = pieChartHTML;
    }

    renderMonthlyTrend(expenses) {
        console.log('🔍 renderMonthlyTrend called with expenses:', expenses.length);
        const container = document.getElementById('trendChart');
        console.log('🔍 trendChart container found:', !!container);

        if (!container) return;

        // Clear existing content
        container.innerHTML = '';
        
        if (expenses.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">No expenses recorded yet</p>';
            return;
        }

        // Group expenses by month
        const monthlyData = {};
        expenses.forEach(expense => {
            const date = new Date(expense.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = 0;
            }
            monthlyData[monthKey] += expense.amount;
        });

        // Get last 6 months or all available months
        const allMonths = Object.keys(monthlyData).sort();
        const months = allMonths.slice(-6);
        
        if (months.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666; padding: 40px;">No monthly data available</p>';
            return;
        }

        const maxAmount = Math.max(...months.map(month => monthlyData[month]));
        const minHeight = 20; // Minimum bar height for visibility
        
        let chartHTML = '<div style="padding: 20px;">';
        
        // Chart title and total
        const totalMonthlyExpenses = months.reduce((sum, month) => sum + monthlyData[month], 0);
        const avgMonthly = totalMonthlyExpenses / months.length;
        
        chartHTML += `
            <div style="margin-bottom: 20px; text-align: center;">
                <div style="color: #666; font-size: 14px; margin-bottom: 5px;">
                    Average Monthly: ${this.formatCurrency(avgMonthly)}
                </div>
            </div>
        `;
        
        // Chart bars
        chartHTML += '<div style="display: flex; align-items: end; justify-content: space-between; min-height: 180px; margin-bottom: 15px; padding: 0 10px;">';
        
        months.forEach((month, index) => {
            const amount = monthlyData[month] || 0;
            const barHeight = Math.max(minHeight, (amount / maxAmount) * 150);
            const date = new Date(month + '-01');
            const monthName = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
            
            // Color gradient based on amount
            const intensity = amount / maxAmount;
            const color = `hsl(${220 + intensity * 40}, 70%, ${60 - intensity * 10}%)`;
            
            chartHTML += `
                <div style="display: flex; flex-direction: column; align-items: center; flex: 1; margin: 0 2px;">
                    <div style="
                        width: 100%; 
                        max-width: 60px;
                        background: linear-gradient(to top, ${color}, ${color}CC);
                        height: ${barHeight}px; 
                        border-radius: 6px 6px 0 0; 
                        margin-bottom: 8px; 
                        position: relative;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                        transition: all 0.3s ease;
                        cursor: pointer;
                    " 
                    onmouseover="this.style.transform='scale(1.05)'; this.style.boxShadow='0 4px 15px rgba(0,0,0,0.2)'"
                    onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 2px 8px rgba(0,0,0,0.1)'"
                    title="${monthName}: ${this.formatCurrency(amount)}">
                        <div style="
                            position: absolute; 
                            bottom: 100%; 
                            left: 50%; 
                            transform: translateX(-50%); 
                            font-size: 11px; 
                            color: #333; 
                            white-space: nowrap; 
                            margin-bottom: 8px;
                            background: rgba(255,255,255,0.9);
                            padding: 4px 6px;
                            border-radius: 4px;
                            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                            opacity: 0;
                            transition: opacity 0.3s ease;
                        " class="amount-tooltip">
                            ${this.formatCurrency(amount)}
                        </div>
                    </div>
                    <span style="font-size: 12px; color: #666; font-weight: 500; text-align: center;">${monthName}</span>
                </div>
            `;
        });
        
        chartHTML += '</div>';
        
        // Summary stats
        const currentMonth = months[months.length - 1];
        const previousMonth = months[months.length - 2];
        let trendText = '';
        let trendColor = '#666';
        
        if (previousMonth && monthlyData[currentMonth] && monthlyData[previousMonth]) {
            const trend = monthlyData[currentMonth] - monthlyData[previousMonth];
            const trendPercent = (trend / monthlyData[previousMonth]) * 100;
            
            if (trend > 0) {
                trendText = `📈 ${Math.abs(trendPercent).toFixed(1)}% increase from last month`;
                trendColor = '#ff6b6b';
            } else if (trend < 0) {
                trendText = `📉 ${Math.abs(trendPercent).toFixed(1)}% decrease from last month`;
                trendColor = '#51cf66';
            } else {
                trendText = '➡️ No change from last month';
                trendColor = '#666';
            }
        }
        
        if (trendText) {
            chartHTML += `
                <div style="text-align: center; padding-top: 15px; border-top: 1px solid #eee;">
                    <span style="color: ${trendColor}; font-size: 14px; font-weight: 500;">
                        ${trendText}
                    </span>
                </div>
            `;
        }
        
        chartHTML += '</div>';
        
        // Add hover effects with CSS
        chartHTML += `
            <style>
                .amount-tooltip {
                    opacity: 0 !important;
                }
                [title]:hover .amount-tooltip {
                    opacity: 1 !important;
                }
            </style>
        `;
        
        container.innerHTML = chartHTML;
    }

    generateFinancialTips(income, expenses, categoryTotals, netBalance) {
        const tipsContainer = document.getElementById('financial-tips');
        if (!tipsContainer) return;

        const tips = [];
        
        // Income vs Expenses analysis
        if (netBalance > 0) {
            const savingsRate = (netBalance / income) * 100;
            if (savingsRate >= 20) {
                tips.push({
                    icon: '🌟',
                    title: 'Excellent Savings!',
                    message: `You're saving ${savingsRate.toFixed(1)}% of your income. Keep up the great work!`
                });
            } else if (savingsRate >= 10) {
                tips.push({
                    icon: '👍',
                    title: 'Good Savings Habit',
                    message: `You're saving ${savingsRate.toFixed(1)}% - try to reach 20% for better financial security.`
                });
            } else {
                tips.push({
                    icon: '📈',
                    title: 'Boost Your Savings',
                    message: `Currently saving ${savingsRate.toFixed(1)}%. Aim for at least 10% of your income.`
                });
            }
        } else {
            tips.push({
                icon: '⚠️',
                title: 'Spending Alert',
                message: `You're spending ${this.formatCurrency(Math.abs(netBalance))} more than you earn. Review your expenses.`
            });
        }

        // Category-specific tips
        const sortedCategories = Object.entries(categoryTotals)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3);

        if (sortedCategories.length > 0) {
            const topCategory = sortedCategories[0];
            const categoryName = this.categories.find(cat => cat.id === topCategory[0])?.name || topCategory[0];
            const percentage = (topCategory[1] / expenses) * 100;
            
            if (percentage > 40) {
                tips.push({
                    icon: '🎯',
                    title: 'Category Focus',
                    message: `${categoryName} takes up ${percentage.toFixed(1)}% of your spending. Consider optimizing this area.`
                });
            }
        }

        // Daily spending tips
        const dailyAvg = expenses / 30;
        if (dailyAvg > 1000) {
            tips.push({
                icon: '💡',
                title: 'Daily Spending Tip',
                message: `Your daily average is ${this.formatCurrency(dailyAvg)}. Try the 24-hour rule before big purchases.`
            });
        }

        // Motivational tips
        const motivationalTips = [
            {
                icon: '🏆',
                title: 'Financial Goal',
                message: 'Set up an emergency fund equal to 6 months of expenses for financial security.'
            },
            {
                icon: '💰',
                title: 'Smart Spending',
                message: 'Track every peso! Small expenses add up quickly over time.'
            },
            {
                icon: '🎯',
                title: 'Budgeting Tip',
                message: 'Follow the 50-30-20 rule: 50% needs, 30% wants, 20% savings.'
            },
            {
                icon: '📊',
                title: 'Review Regularly',
                message: 'Review your expenses weekly to stay on track with your financial goals.'
            }
        ];

        // Add a random motivational tip
        tips.push(motivationalTips[Math.floor(Math.random() * motivationalTips.length)]);

        // Render tips
        tipsContainer.innerHTML = '';
        tips.forEach(tip => {
            const tipDiv = document.createElement('div');
            tipDiv.className = 'tip-card';
            tipDiv.innerHTML = `
                <div class="tip-icon">${tip.icon}</div>
                <div class="tip-content">
                    <h4>${tip.title}</h4>
                    <p>${tip.message}</p>
                </div>
            `;
            tipsContainer.appendChild(tipDiv);
        });
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
            this.saveExpensesToCloud();
            this.renderExpenses();
            this.renderReimbursements();
            this.updateSummary();
            this.renderAnalytics();
            this.showNotification('Expense deleted successfully!', 'success');
        }
    }

    editExpense(id) {
        const expense = this.expenses.find(exp => exp.id === id);
        if (!expense) return;

        // Fill the form with existing data
        document.getElementById('expense-description').value = expense.description;
        document.getElementById('expense-amount').value = expense.amount;
        document.getElementById('expense-category').value = expense.category;
        document.getElementById('expense-date').value = expense.date;
        document.getElementById('expense-reimbursement').checked = expense.isReimbursement;

        // Change the form to edit mode
        const form = document.getElementById('expense-form');
        const submitButton = form.querySelector('button[type="submit"]');
        
        // Store the original text and update button
        if (!submitButton.originalText) {
            submitButton.originalText = submitButton.innerHTML;
        }
        submitButton.innerHTML = '<i class="fas fa-save"></i> Update Expense';
        
        // Store the ID being edited
        form.dataset.editingId = id;

        // Scroll to form
        form.scrollIntoView({ behavior: 'smooth' });
        this.showNotification('Editing expense - update the fields and click "Update Expense"', 'info');
    }

    editIncome(id) {
        const income = this.income.find(inc => inc.id === id);
        if (!income) return;

        // Fill the form with existing data
        document.getElementById('income-description').value = income.description;
        document.getElementById('income-amount').value = income.amount;
        document.getElementById('income-type').value = income.type;
        document.getElementById('income-date').value = income.date;

        // Change the form to edit mode
        const form = document.getElementById('income-form');
        const submitButton = form.querySelector('button[type="submit"]');
        
        // Store the original text and update button
        if (!submitButton.originalText) {
            submitButton.originalText = submitButton.innerHTML;
        }
        submitButton.innerHTML = '<i class="fas fa-save"></i> Update Income';
        
        // Store the ID being edited
        form.dataset.editingId = id;

        // Scroll to form
        form.scrollIntoView({ behavior: 'smooth' });
        this.showNotification('Editing income - update the fields and click "Update Income"', 'info');
    }

    deleteIncome(id) {
        if (confirm('Are you sure you want to delete this income entry?')) {
            this.income = this.income.filter(income => income.id !== id);
            this.saveIncomeToCloud();
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

    // Cloud sync methods
    async forceSyncToCloud() {
        if (!this.currentUser) {
            this.showNotification('Please sign in to sync to cloud', 'warning');
            return;
        }
        
        try {
            this.showNotification('Syncing to cloud...', 'info');
            
            await Promise.all([
                this.saveExpensesToCloud(),
                this.saveIncomeToCloud(),
                this.savePettyCashToCloud(),
                this.saveCategoriesToCloud()
            ]);
            
            this.showNotification('Successfully synced to cloud!', 'success');
        } catch (error) {
            console.error('Sync error:', error);
            this.showNotification('Failed to sync to cloud', 'error');
        }
    }

    async refreshFromCloud() {
        if (!this.currentUser) {
            this.showNotification('Please sign in to refresh from cloud', 'warning');
            return;
        }
        
        try {
            this.showNotification('Refreshing from cloud...', 'info');
            await this.loadFromCloud();
            this.showNotification('Successfully refreshed from cloud!', 'success');
        } catch (error) {
            console.error('Refresh error:', error);
            this.showNotification('Failed to refresh from cloud', 'error');
        }
    }

    // Reimbursement batch payment methods
    processBatchPayments() {
        this.showNotification('Batch payment processing coming soon!', 'info');
    }

    confirmBatchPayments() {
        this.showNotification('Batch payment confirmation coming soon!', 'info');
    }

    cancelBatchPayments() {
        this.showNotification('Batch payment cancelled', 'info');
    }

    // Payment Modal Functions
    openPaymentModal(expenseId) {
        const expense = this.expenses.find(exp => exp.id === expenseId);
        if (!expense || expense.isPaid) {
            this.showNotification('Expense not found or already paid', 'error');
            return;
        }

        // Populate modal with expense data
        document.getElementById('payment-date').value = new Date().toISOString().split('T')[0];
        document.getElementById('payment-amount').value = expense.amount;
        document.getElementById('payment-description').value = expense.description;
        
        // Store the expense ID for processing
        document.getElementById('payment-form').dataset.expenseId = expenseId;
        
        // Show modal
        document.getElementById('payment-modal').style.display = 'block';
        
        // Add form submit handler
        const form = document.getElementById('payment-form');
        form.onsubmit = (e) => this.processPayment(e);
    }

    closePaymentModal() {
        document.getElementById('payment-modal').style.display = 'none';
        document.getElementById('payment-form').reset();
        delete document.getElementById('payment-form').dataset.expenseId;
    }

    processPayment(event) {
        event.preventDefault();
        
        const form = document.getElementById('payment-form');
        const expenseId = parseInt(form.dataset.expenseId);
        const paymentDate = document.getElementById('payment-date').value;
        const paymentAmount = parseFloat(document.getElementById('payment-amount').value);
        
        if (!expenseId || !paymentDate || !paymentAmount) {
            this.showNotification('Please fill in all payment details', 'error');
            return;
        }

        // Find the expense
        const expenseIndex = this.expenses.findIndex(exp => exp.id === expenseId);
        if (expenseIndex === -1) {
            this.showNotification('Expense not found', 'error');
            return;
        }

        const expense = this.expenses[expenseIndex];

        // Update the expense as paid
        this.expenses[expenseIndex] = {
            ...expense,
            isPaid: true,
            paymentDate: paymentDate,
            paidAmount: paymentAmount
        };

        // Add the payment as income with "Reimbursement" category
        const reimbursementIncome = {
            id: Date.now() + Math.random(), // Unique ID
            description: `Reimbursement: ${expense.description}`,
            amount: paymentAmount,
            category: 'reimbursement',
            date: paymentDate,
            timestamp: new Date().toISOString()
        };

        this.income.push(reimbursementIncome);

        // Save to cloud and update UI
        this.saveExpensesToCloud();
        this.saveIncomeToCloud();
        this.updateUI();
        
        this.showNotification('Payment processed successfully! Added to income as reimbursement.', 'success');
        this.closePaymentModal();
    }

    // Close modal when clicking outside
    setupModalCloseHandler() {
        const modal = document.getElementById('payment-modal');
        if (modal) {
            modal.onclick = (event) => {
                if (event.target === modal) {
                    this.closePaymentModal();
                }
            };
        }
    }

    // Petty Cash Functions
    addPettyCashTransaction(event) {
        event.preventDefault();
        
        const description = document.getElementById('petty-cash-description').value.trim();
        const amount = parseFloat(document.getElementById('petty-cash-amount').value);
        const category = document.getElementById('petty-cash-category').value;
        const date = document.getElementById('petty-cash-date').value;
        
        if (!description || !amount || !category || !date) {
            this.showNotification('Please fill in all fields', 'error');
            return;
        }

        // Check if there's enough petty cash balance
        const currentBalance = this.getPettyCashBalance();
        if (amount > currentBalance) {
            this.showNotification(`Insufficient petty cash balance. Current balance: ${this.formatCurrency(currentBalance)}`, 'error');
            return;
        }

        // Add petty cash transaction
        const pettyCashTransaction = {
            id: Date.now() + Math.random(),
            description,
            amount,
            category,
            date,
            timestamp: new Date().toISOString()
        };

        this.pettyCash.push(pettyCashTransaction);

        // Also add as regular expense
        const expense = {
            id: Date.now() + Math.random() + 1,
            description: `[Cash] ${description}`,
            amount,
            category,
            date,
            isReimbursement: false,
            isPaid: false,
            paymentDate: null,
            timestamp: new Date().toISOString()
        };

        this.expenses.push(expense);

        // Save and update UI
        this.savePettyCash();
        this.saveExpenses();
        this.saveExpensesToCloud();
        this.savePettyCashToCloud();
        this.updateUI();
        this.resetForm('petty-cash-form');
        this.setDefaultDate();
        
        this.showNotification('Cash transaction recorded successfully!', 'success');
    }

    getPettyCashBalance() {
        // Calculate balance: allocated amount - spent amount
        const allocated = this.expenses
            .filter(expense => {
                const category = this.categories.find(cat => cat.id === expense.category);
                return category?.name === 'Petty Cash';
            })
            .reduce((sum, expense) => sum + expense.amount, 0);
            
        const spent = this.pettyCash
            .reduce((sum, transaction) => sum + transaction.amount, 0);
            
        return allocated - spent;
    }

    getPettyCashAllocated() {
        return this.expenses
            .filter(expense => {
                const category = this.categories.find(cat => cat.id === expense.category);
                return category?.name === 'Petty Cash';
            })
            .reduce((sum, expense) => sum + expense.amount, 0);
    }

    getPettyCashSpent() {
        return this.pettyCash
            .reduce((sum, transaction) => sum + transaction.amount, 0);
    }

    updatePettyCashSummary() {
        const balanceEl = document.getElementById('petty-cash-balance');
        const spentEl = document.getElementById('petty-cash-spent');
        const allocatedEl = document.getElementById('petty-cash-allocated');
        
        if (balanceEl) balanceEl.textContent = this.formatCurrency(this.getPettyCashBalance());
        if (spentEl) spentEl.textContent = this.formatCurrency(this.getPettyCashSpent());
        if (allocatedEl) allocatedEl.textContent = this.formatCurrency(this.getPettyCashAllocated());
    }

    renderPettyCash() {
        const tbody = document.getElementById('petty-cash-tbody');
        if (!tbody) return;
        
        tbody.innerHTML = '';

        if (this.pettyCash.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: #666;">No cash transactions recorded yet</td></tr>';
            return;
        }

        // Sort by date (newest first)
        const sortedTransactions = [...this.pettyCash].sort((a, b) => new Date(b.date) - new Date(a.date));

        sortedTransactions.forEach(transaction => {
            const category = this.categories.find(cat => cat.id === transaction.category);
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${this.formatDate(transaction.date)}</td>
                <td>${transaction.description}</td>
                <td>
                    <span style="display: inline-flex; align-items: center; gap: 8px;">
                        <span style="width: 12px; height: 12px; background: ${category?.color || '#ccc'}; border-radius: 50%;"></span>
                        ${category?.name || 'Unknown'}
                    </span>
                </td>
                <td>${this.formatCurrency(transaction.amount)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-danger btn-sm" onclick="expenseTracker.deletePettyCashTransaction(${transaction.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    deletePettyCashTransaction(id) {
        if (confirm('Are you sure you want to delete this cash transaction?')) {
            // Find the transaction first
            const transaction = this.pettyCash.find(t => t.id === id);
            
            // Remove from petty cash
            this.pettyCash = this.pettyCash.filter(t => t.id !== id);
            
            // Also remove the corresponding expense
            if (transaction) {
                this.expenses = this.expenses.filter(expense => 
                    !(expense.description === `[Cash] ${transaction.description}` && 
                      expense.amount === transaction.amount && 
                      expense.date === transaction.date)
                );
            }
            
            this.savePettyCash();
            this.saveExpenses();
            this.saveExpensesToCloud();
            this.savePettyCashToCloud();
            this.updateUI();
            this.showNotification('Cash transaction deleted successfully!', 'success');
        }
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

// Authentication functions
async function signUp() {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    
    if (!email || !password) {
        alert('Please enter both email and password');
        return;
    }
    
    if (password.length < 6) {
        alert('Password must be at least 6 characters long');
        return;
    }
    
    try {
        await window.auth.createUserWithEmailAndPassword(email, password);
        console.log('✅ User created successfully');
        
        // Clear form
        document.getElementById('auth-email').value = '';
        document.getElementById('auth-password').value = '';
        
    } catch (error) {
        console.error('❌ Sign up error:', error);
        alert('Sign up failed: ' + error.message);
    }
}

async function signIn() {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    
    if (!email || !password) {
        alert('Please enter both email and password');
        return;
    }
    
    try {
        await window.auth.signInWithEmailAndPassword(email, password);
        console.log('✅ User signed in successfully');
        
        // Clear form
        document.getElementById('auth-email').value = '';
        document.getElementById('auth-password').value = '';
        
    } catch (error) {
        console.error('❌ Sign in error:', error);
        alert('Sign in failed: ' + error.message);
    }
}

async function signOut() {
    try {
        await window.auth.signOut();
        console.log('✅ User signed out successfully');
    } catch (error) {
        console.error('❌ Sign out error:', error);
        alert('Sign out failed: ' + error.message);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded - Initializing Expense Tracker with Firebase');
    try {
        window.expenseTracker = new ExpenseTracker();
        console.log('Expense Tracker with Firebase initialized successfully');
    } catch (error) {
        console.error('Failed to initialize Expense Tracker:', error);
    }
});
