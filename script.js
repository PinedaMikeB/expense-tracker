// Expense Tracker Application - Cloud Storage Version
class ExpenseTracker {
    constructor() {
        this.expenses = [];
        this.income = [];
        this.categories = this.getDefaultCategories();
        this.selectedForPayment = new Set();
        
        // Cloud storage configuration
        this.cloudConfig = {
            provider: 'jsonbin',
            binId: localStorage.getItem('cloudBinId') || null,
            accessKey: 'your-jsonbin-access-key', // We'll make this configurable
            autoSync: true,
            lastSync: localStorage.getItem('lastSync') || null
        };
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.loadCategories();
        
        // Try to load from cloud first, fallback to localStorage
        await this.loadFromCloud();
        
        this.updateSummary();
        this.renderExpenses();
        this.renderIncome();
        this.renderReimbursements();
        this.renderCategories();
        this.renderAnalytics();
        this.setDefaultDate();
        
        // Setup auto-sync every 30 seconds
        if (this.cloudConfig.autoSync) {
            setInterval(() => this.syncToCloud(), 30000);
        }
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
        document.getElementById('expense-date').value = today;
        document.getElementById('income-date').value = today;
    }

    setupEventListeners() {
        // Form submissions
        document.getElementById('expense-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addExpense();
        });

        document.getElementById('income-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addIncome();
        });

        document.getElementById('category-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addCategory();
        });
    }

    addExpense() {
        const description = document.getElementById('expense-description').value;
        const amount = parseFloat(document.getElementById('expense-amount').value);
        const category = document.getElementById('expense-category').value;
        const date = document.getElementById('expense-date').value;
        const isReimbursement = document.getElementById('expense-reimbursement').checked;

        if (!description || !amount || !category || !date) {
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

        this.expenses.unshift(expense);
        this.saveExpenses();
        this.renderExpenses();
        this.renderReimbursements();
        this.updateSummary();
        this.renderAnalytics();
        this.resetForm('expense-form');
        this.showNotification('Expense added successfully!', 'success');
    }

    addIncome() {
        const description = document.getElementById('income-description').value;
        const amount = parseFloat(document.getElementById('income-amount').value);
        const type = document.getElementById('income-type').value;
        const date = document.getElementById('income-date').value;

        if (!description || !amount || !type || !date) {
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

        this.income.unshift(income);
        this.saveIncome();
        this.renderIncome();
        this.updateSummary();
        this.renderAnalytics();
        this.resetForm('income-form');
        this.showNotification('Income added successfully!', 'success');
    }

    addCategory() {
        const name = document.getElementById('category-name').value;
        const color = document.getElementById('category-color').value;

        if (!name) {
            this.showNotification('Please enter a category name', 'error');
            return;
        }

        if (this.categories.some(cat => cat.name.toLowerCase() === name.toLowerCase())) {
            this.showNotification('Category already exists', 'error');
            return;
        }

        const category = {
            id: Date.now().toString(),
            name,
            color
        };

        this.categories.push(category);
        this.saveCategories();
        this.loadCategories();
        this.renderCategories();
        this.renderAnalytics();
        this.resetForm('category-form');
        this.showNotification('Category added successfully!', 'success');
    }

    // Data persistence methods
    saveExpenses() {
        localStorage.setItem('expenses', JSON.stringify(this.expenses));
        this.syncToCloud(); // Auto-sync to cloud
    }

    saveIncome() {
        localStorage.setItem('income', JSON.stringify(this.income));
        this.syncToCloud(); // Auto-sync to cloud
    }

    saveCategories() {
        localStorage.setItem('categories', JSON.stringify(this.categories));
        this.syncToCloud(); // Auto-sync to cloud
    }

    // Rendering methods
    renderExpenses() {
        const tbody = document.getElementById('expenses-tbody');
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
        tbody.innerHTML = '';

        const reimbursements = this.expenses.filter(expense => expense.isReimbursement);

        if (reimbursements.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #666;">No reimbursement expenses recorded yet</td></tr>';
            return;
        }

        reimbursements.forEach(expense => {
            const category = this.categories.find(cat => cat.id === expense.category);
            const row = document.createElement('tr');
            const isSelected = this.selectedForPayment.has(expense.id);
            
            if (isSelected) {
                row.classList.add('selected-for-payment');
            }
            
            row.innerHTML = `
                <td>
                    ${!expense.isPaid ? `<input type="checkbox" class="table-checkbox" 
                          ${isSelected ? 'checked' : ''} 
                          onchange="expenseTracker.toggleSelection(${expense.id}, this.checked)">` : ''}
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
        grid.innerHTML = '';

        this.categories.forEach(category => {
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'category-item';
            categoryDiv.innerHTML = `
                <div class="category-info">
                    <div class="category-color" style="background-color: ${category.color}"></div>
                    <span class="category-name">${category.name}</span>
                </div>
                <button class="btn btn-danger btn-sm" onclick="expenseTracker.deleteCategory('${category.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            grid.appendChild(categoryDiv);
        });
    }

    renderAnalytics() {
        this.updateAnalyticsStats();
        this.renderCategoryChart();
        this.renderTrendChart();
        this.generateFinancialTips();
    }

    updateAnalyticsStats() {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        // This month's spending
        const monthlyExpenses = this.expenses.filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate.getMonth() === currentMonth && 
                   expenseDate.getFullYear() === currentYear;
        });
        
        // This month's income
        const monthlyIncome = this.income.filter(income => {
            const incomeDate = new Date(income.date);
            return incomeDate.getMonth() === currentMonth && 
                   incomeDate.getFullYear() === currentYear;
        });
        
        const monthlyExpenseTotal = monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0);
        const monthlyIncomeTotal = monthlyIncome.reduce((sum, income) => sum + income.amount, 0);
        const currentDay = now.getDate();
        const avgDaily = monthlyExpenseTotal / currentDay;
        
        // Top category
        const categoryTotals = {};
        this.expenses.forEach(expense => {
            const category = this.categories.find(cat => cat.id === expense.category);
            const categoryName = category ? category.name : 'Unknown';
            categoryTotals[categoryName] = (categoryTotals[categoryName] || 0) + expense.amount;
        });
        
        const topCategory = Object.keys(categoryTotals).reduce((a, b) => 
            categoryTotals[a] > categoryTotals[b] ? a : b, '-');
        
        // Pending reimbursements
        const pendingReimbursements = this.expenses
            .filter(expense => expense.isReimbursement && !expense.isPaid)
            .reduce((sum, expense) => sum + expense.amount, 0);
        
        // Update DOM - use monthly net instead of just spending
        const monthlyNet = monthlyIncomeTotal - monthlyExpenseTotal;
        document.getElementById('monthly-spending').textContent = `$${monthlyNet.toFixed(2)}`;
        document.getElementById('avg-daily').textContent = `$${avgDaily.toFixed(2)}`;
        document.getElementById('top-category').textContent = topCategory;
        document.getElementById('pending-reimburse').textContent = `$${pendingReimbursements.toFixed(2)}`;
    }

    renderCategoryChart() {
        const canvas = document.getElementById('categoryChart');
        const ctx = canvas.getContext('2d');
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Calculate category totals
        const categoryTotals = {};
        this.expenses.forEach(expense => {
            const category = this.categories.find(cat => cat.id === expense.category);
            if (category) {
                categoryTotals[category.name] = (categoryTotals[category.name] || 0) + expense.amount;
            }
        });
        
        const categories = Object.keys(categoryTotals);
        if (categories.length === 0) {
            ctx.fillStyle = '#666';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('No data available', canvas.width / 2, canvas.height / 2);
            return;
        }
        
        // Draw pie chart
        const total = Object.values(categoryTotals).reduce((sum, val) => sum + val, 0);
        let currentAngle = 0;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 40;
        
        categories.forEach((category, index) => {
            const categoryObj = this.categories.find(cat => cat.name === category);
            const percentage = categoryTotals[category] / total;
            const sliceAngle = percentage * 2 * Math.PI;
            
            // Draw slice
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
            ctx.closePath();
            ctx.fillStyle = categoryObj ? categoryObj.color : '#ccc';
            ctx.fill();
            
            // Draw label
            const labelAngle = currentAngle + sliceAngle / 2;
            const labelX = centerX + Math.cos(labelAngle) * (radius + 20);
            const labelY = centerY + Math.sin(labelAngle) * (radius + 20);
            
            ctx.fillStyle = '#333';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${category}: $${categoryTotals[category].toFixed(0)}`, labelX, labelY);
            
            currentAngle += sliceAngle;
        });
    }

    renderTrendChart() {
        const canvas = document.getElementById('trendChart');
        const ctx = canvas.getContext('2d');
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Get last 6 months data
        const monthlyData = {};
        const now = new Date();
        
        for (let i = 5; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
            monthlyData[monthKey] = 0;
        }
        
        this.expenses.forEach(expense => {
            const expenseDate = new Date(expense.date);
            const monthKey = `${expenseDate.getFullYear()}-${(expenseDate.getMonth() + 1).toString().padStart(2, '0')}`;
            if (monthlyData.hasOwnProperty(monthKey)) {
                monthlyData[monthKey] += expense.amount;
            }
        });
        
        const months = Object.keys(monthlyData);
        const values = Object.values(monthlyData);
        const maxValue = Math.max(...values) || 100;
        
        if (maxValue === 0) {
            ctx.fillStyle = '#666';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('No data available', canvas.width / 2, canvas.height / 2);
            return;
        }
        
        // Draw chart
        const padding = 40;
        const chartWidth = canvas.width - 2 * padding;
        const chartHeight = canvas.height - 2 * padding;
        const barWidth = chartWidth / months.length;
        
        months.forEach((month, index) => {
            const barHeight = (values[index] / maxValue) * chartHeight;
            const x = padding + index * barWidth;
            const y = padding + chartHeight - barHeight;
            
            // Draw bar
            ctx.fillStyle = '#667eea';
            ctx.fillRect(x + 10, y, barWidth - 20, barHeight);
            
            // Draw month label
            ctx.fillStyle = '#333';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(month.slice(5), x + barWidth / 2, canvas.height - 10);
            
            // Draw value
            ctx.fillStyle = '#333';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`$${values[index].toFixed(0)}`, x + barWidth / 2, y - 5);
        });
    }

    generateFinancialTips() {
        const tips = [];
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        // Calculate monthly data
        const monthlyExpenses = this.expenses.filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate.getMonth() === currentMonth && 
                   expenseDate.getFullYear() === currentYear;
        });
        
        const monthlyIncome = this.income.filter(income => {
            const incomeDate = new Date(income.date);
            return incomeDate.getMonth() === currentMonth && 
                   incomeDate.getFullYear() === currentYear;
        });
        
        const monthlyExpenseTotal = monthlyExpenses.reduce((sum, expense) => sum + expense.amount, 0);
        const monthlyIncomeTotal = monthlyIncome.reduce((sum, income) => sum + income.amount, 0);
        const monthlyNet = monthlyIncomeTotal - monthlyExpenseTotal;
        const avgDaily = monthlyExpenseTotal / now.getDate();
        
        // Income vs Expense ratio
        if (monthlyIncomeTotal > 0) {
            const expenseRatio = (monthlyExpenseTotal / monthlyIncomeTotal) * 100;
            
            if (expenseRatio > 80) {
                tips.push({
                    type: 'warning',
                    icon: '⚠️',
                    title: 'High Expense Ratio',
                    description: `You're spending ${expenseRatio.toFixed(1)}% of your income this month ($${monthlyExpenseTotal.toFixed(2)} of $${monthlyIncomeTotal.toFixed(2)}).`,
                    action: 'Consider reducing non-essential expenses to improve your savings rate.'
                });
            } else if (expenseRatio < 50) {
                tips.push({
                    type: 'success',
                    icon: '🎯',
                    title: 'Excellent Savings Rate!',
                    description: `You're only spending ${expenseRatio.toFixed(1)}% of your income. Great financial discipline!`,
                    action: 'Consider investing the surplus or building your emergency fund.'
                });
            }
        }
        
        // Monthly net analysis
        if (monthlyNet < 0) {
            tips.push({
                type: 'warning',
                icon: '📉',
                title: 'Negative Monthly Balance',
                description: `Your expenses exceed income by $${Math.abs(monthlyNet).toFixed(2)} this month.`,
                action: 'Review your expenses and consider additional income sources or expense reduction.'
            });
        } else if (monthlyNet > 1000) {
            tips.push({
                type: 'success',
                icon: '💪',
                title: 'Strong Financial Position',
                description: `You have a positive balance of $${monthlyNet.toFixed(2)} this month.`,
                action: 'Consider investing this surplus or increasing your emergency fund.'
            });
        }
        
        // Calculate category breakdown
        const categoryTotals = {};
        monthlyExpenses.forEach(expense => {
            const category = this.categories.find(cat => cat.id === expense.category);
            const categoryName = category ? category.name : 'Unknown';
            categoryTotals[categoryName] = (categoryTotals[categoryName] || 0) + expense.amount;
        });
        
        // Pending reimbursements
        const pendingReimbursements = this.expenses.filter(expense => 
            expense.isReimbursement && !expense.isPaid
        );
        
        if (pendingReimbursements.length > 0) {
            const totalPending = pendingReimbursements.reduce((sum, expense) => sum + expense.amount, 0);
            const oldestPending = pendingReimbursements.reduce((oldest, current) => 
                new Date(current.date) < new Date(oldest.date) ? current : oldest
            );
            const daysPending = Math.floor((now - new Date(oldestPending.date)) / (1000 * 60 * 60 * 24));
            
            if (daysPending > 30) {
                tips.push({
                    type: 'warning',
                    icon: '⏰',
                    title: 'Old Pending Reimbursements',
                    description: `You have reimbursements pending for ${daysPending} days totaling $${totalPending.toFixed(2)}.`,
                    action: 'Follow up on old reimbursements to improve your cash flow.'
                });
            } else {
                tips.push({
                    type: 'info',
                    icon: '💰',
                    title: 'Pending Reimbursements',
                    description: `You have $${totalPending.toFixed(2)} in pending reimbursements.`,
                    action: 'Use the batch payment feature to quickly mark multiple reimbursements as paid.'
                });
            }
        }
        
        // General financial tips if we need more
        if (tips.length < 3) {
            const generalTips = [
                {
                    type: 'success',
                    icon: '📊',
                    title: 'Track Income Sources',
                    description: 'Diversifying income sources provides financial security and growth opportunities.',
                    action: 'Consider adding freelance work, investments, or side businesses to your income mix.'
                },
                {
                    type: 'info',
                    icon: '💡',
                    title: 'Automate Savings',
                    description: 'Set up automatic transfers to savings when you receive income.',
                    action: 'Save 20% of income automatically before you have a chance to spend it.'
                },
                {
                    type: 'success',
                    icon: '🎯',
                    title: 'Regular Financial Reviews',
                    description: 'Monthly reviews help identify spending patterns and opportunities.',
                    action: 'Use the analytics tab to review your financial patterns monthly.'
                }
            ];
            
            tips.push(...generalTips.slice(0, 3 - tips.length));
        }
        
        // Render tips
        const tipsContainer = document.getElementById('financial-tips');
        tipsContainer.innerHTML = '';
        
        tips.forEach(tip => {
            const tipElement = document.createElement('div');
            tipElement.className = `tip-card ${tip.type}`;
            tipElement.innerHTML = `
                <div class="tip-header">
                    <span class="tip-icon">${tip.icon}</span>
                    <span class="tip-title">${tip.title}</span>
                </div>
                <div class="tip-description">${tip.description}</div>
                <div class="tip-action">${tip.action}</div>
            `;
            tipsContainer.appendChild(tipElement);
        });
    }

    // Utility methods
    loadCategories() {
        const select = document.getElementById('expense-category');
        select.innerHTML = '<option value="">Select Category</option>';
        
        this.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            select.appendChild(option);
        });
    }

    updateSummary() {
        const totalExpenses = this.expenses.reduce((sum, expense) => sum + expense.amount, 0);
        const totalIncome = this.income.reduce((sum, income) => sum + income.amount, 0);
        const totalReimbursements = this.expenses
            .filter(expense => expense.isReimbursement && !expense.isPaid)
            .reduce((sum, expense) => sum + expense.amount, 0);
        const netBalance = totalIncome + totalReimbursements - totalExpenses;

        document.getElementById('total-income').textContent = `$${totalIncome.toFixed(2)}`;
        document.getElementById('total-expenses').textContent = `$${totalExpenses.toFixed(2)}`;
        document.getElementById('total-reimbursements').textContent = `$${totalReimbursements.toFixed(2)}`;
        document.getElementById('net-balance').textContent = `$${netBalance.toFixed(2)}`;
        
        // Color coding for net balance
        const balanceElement = document.getElementById('net-balance');
        if (netBalance > 0) {
            balanceElement.style.color = '#51cf66';
        } else if (netBalance < 0) {
            balanceElement.style.color = '#ff6b6b';
        } else {
            balanceElement.style.color = '#2c3e50';
        }
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
        document.getElementById(formId).reset();
        if (formId === 'expense-form') {
            this.setDefaultDate();
        } else if (formId === 'income-form') {
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('income-date').value = today;
        }
    }

    // Payment toggle for reimbursements
    togglePayment(expenseId, isPaid) {
        const expense = this.expenses.find(e => e.id === expenseId);
        if (expense) {
            expense.isPaid = isPaid;
            expense.paymentDate = isPaid ? new Date().toISOString().split('T')[0] : null;
            this.saveExpenses();
            this.renderReimbursements();
            this.updateSummary();
            this.renderAnalytics();
            
            const message = isPaid ? 'Reimbursement marked as paid!' : 'Payment status updated!';
            this.showNotification(message, 'success');
        }
    }

    // Delete methods
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

    deleteCategory(id) {
        // Check if category is being used
        const isUsed = this.expenses.some(expense => expense.category === id);
        if (isUsed) {
            this.showNotification('Cannot delete category that is being used by expenses', 'error');
            return;
        }

        if (confirm('Are you sure you want to delete this category?')) {
            this.categories = this.categories.filter(category => category.id !== id);
            this.saveCategories();
            this.loadCategories();
            this.renderCategories();
            this.renderAnalytics();
            this.showNotification('Category deleted successfully!', 'success');
        }
    }

    // Notification system
    showNotification(message, type = 'info') {
        const container = document.getElementById('notification-container');
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
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    // Add active class to clicked button
    document.querySelector(`[onclick="showTab('${tabName}')"]`).classList.add('active');
    
    // Refresh analytics when analytics tab is shown
    if (tabName === 'analytics' && window.expenseTracker) {
        window.expenseTracker.renderAnalytics();
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.expenseTracker = new ExpenseTracker();
});

    renderIncome() {
        const tbody = document.getElementById('income-tbody');
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

    // Batch payment methods
    toggleSelection(expenseId, isSelected) {
        if (isSelected) {
            this.selectedForPayment.add(expenseId);
        } else {
            this.selectedForPayment.delete(expenseId);
        }
        this.renderReimbursements();
    }

    processBatchPayments() {
        if (this.selectedForPayment.size === 0) {
            this.showNotification('Please select at least one reimbursement to process', 'warning');
            return;
        }

        // Show payment date input
        const paymentDateGroup = document.querySelector('.payment-date-group');
        paymentDateGroup.style.display = 'flex';
        
        // Set default date to today
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('payment-date-input').value = today;
        
        this.showNotification(`${this.selectedForPayment.size} reimbursement(s) selected for payment`, 'info');
    }

    confirmBatchPayments() {
        const paymentDate = document.getElementById('payment-date-input').value;
        
        if (!paymentDate) {
            this.showNotification('Please select a payment date', 'error');
            return;
        }

        let processedCount = 0;
        
        // Process all selected reimbursements
        this.selectedForPayment.forEach(expenseId => {
            const expense = this.expenses.find(e => e.id === expenseId);
            if (expense && !expense.isPaid) {
                expense.isPaid = true;
                expense.paymentDate = paymentDate;
                processedCount++;
            }
        });

        // Save and update UI
        this.saveExpenses();
        this.selectedForPayment.clear();
        this.renderReimbursements();
        this.updateSummary();
        this.renderAnalytics();
        
        // Hide payment controls
        this.cancelBatchPayments();
        
        this.showNotification(`${processedCount} reimbursement(s) marked as paid on ${this.formatDate(paymentDate)}`, 'success');
    }

    cancelBatchPayments() {
        const paymentDateGroup = document.querySelector('.payment-date-group');
        paymentDateGroup.style.display = 'none';
        
        // Clear selections
        this.selectedForPayment.clear();
        this.renderReimbursements();
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

    // Cloud Storage Methods
    async loadFromCloud() {
        try {
            // First try to load from cloud
            const cloudData = await this.fetchFromCloud();
            if (cloudData) {
                this.expenses = cloudData.expenses || [];
                this.income = cloudData.income || [];
                this.categories = cloudData.categories || this.getDefaultCategories();
                
                // Also save to localStorage as backup
                this.saveToLocalStorage();
                
                this.showNotification('Data loaded from cloud!', 'success');
                this.updateSyncStatus('synced', 'Data loaded from cloud storage');
                return true;
            }
        } catch (error) {
            console.log('Cloud load failed, using local storage:', error);
        }
        
        // Fallback to localStorage
        this.loadFromLocalStorage();
        this.updateSyncStatus('local', 'Using local storage only');
        return false;
    }

    loadFromLocalStorage() {
        this.expenses = JSON.parse(localStorage.getItem('expenses')) || [];
        this.income = JSON.parse(localStorage.getItem('income')) || [];
        this.categories = JSON.parse(localStorage.getItem('categories')) || this.getDefaultCategories();
    }

    saveToLocalStorage() {
        localStorage.setItem('expenses', JSON.stringify(this.expenses));
        localStorage.setItem('income', JSON.stringify(this.income));
        localStorage.setItem('categories', JSON.stringify(this.categories));
        localStorage.setItem('lastSync', new Date().toISOString());
    }

    async fetchFromCloud() {
        if (!this.cloudConfig.binId) {
            // No cloud storage setup yet
            return null;
        }

        const response = await fetch(`https://api.jsonbin.io/v3/b/${this.cloudConfig.binId}/latest`, {
            method: 'GET',
            headers: {
                'X-Master-Key': this.cloudConfig.accessKey || '$2a$10$8EjB7rH.oOGV6I6EJwH7OOdYgZVZE.xK8fZxG.2n4QN3KQE4yJ8VG'
            }
        });

        if (response.ok) {
            const data = await response.json();
            return data.record;
        }
        
        throw new Error(`Cloud fetch failed: ${response.status}`);
    }

    async syncToCloud() {
        try {
            const data = {
                expenses: this.expenses,
                income: this.income,
                categories: this.categories,
                lastUpdated: new Date().toISOString(),
                version: '1.0'
            };

            let url, method;
            if (this.cloudConfig.binId) {
                // Update existing bin
                url = `https://api.jsonbin.io/v3/b/${this.cloudConfig.binId}`;
                method = 'PUT';
            } else {
                // Create new bin
                url = 'https://api.jsonbin.io/v3/b';
                method = 'POST';
            }

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': this.cloudConfig.accessKey || '$2a$10$8EjB7rH.oOGV6I6EJwH7OOdYgZVZE.xK8fZxG.2n4QN3KQE4yJ8VG',
                    'X-Bin-Name': 'expense-tracker-data',
                    'X-Bin-Private': 'true'
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                const result = await response.json();
                
                if (!this.cloudConfig.binId) {
                    // Save the new bin ID
                    this.cloudConfig.binId = result.metadata.id;
                    localStorage.setItem('cloudBinId', this.cloudConfig.binId);
                }
                
                // Also save locally
                this.saveToLocalStorage();
                
                console.log('Data synced to cloud successfully');
                return true;
            } else {
                throw new Error(`Sync failed: ${response.status}`);
            }
        } catch (error) {
            console.error('Cloud sync failed:', error);
            // Always save locally as backup
            this.saveToLocalStorage();
            return false;
        }
    }

    // Manual sync methods for user control
    async forceSyncToCloud() {
        const success = await this.syncToCloud();
        if (success) {
            this.showNotification('Data synced to cloud successfully!', 'success');
        } else {
            this.showNotification('Cloud sync failed, data saved locally', 'warning');
        }
    }

    async refreshFromCloud() {
        const success = await this.loadFromCloud();
        if (success) {
            this.updateSummary();
            this.renderExpenses();
            this.renderIncome();
            this.renderReimbursements();
            this.renderCategories();
            this.renderAnalytics();
        } else {
            this.showNotification('Could not refresh from cloud', 'error');
        }
    }

    updateSyncStatus(status, message = '') {
        const statusElement = document.getElementById('sync-status');
        if (!statusElement) return;
        
        statusElement.className = `sync-status ${status}`;
        
        switch (status) {
            case 'synced':
                statusElement.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> Cloud Synced';
                break;
            case 'syncing':
                statusElement.innerHTML = '<i class="fas fa-sync fa-spin"></i> Syncing...';
                break;
            case 'error':
                statusElement.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Sync Error';
                break;
            case 'local':
            default:
                statusElement.innerHTML = '<i class="fas fa-database"></i> Local Storage';
                break;
        }
        
        if (message) {
            statusElement.title = message;
        }
    }
