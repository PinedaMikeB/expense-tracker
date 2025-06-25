// Firebase Data Backup Script
// Run this in browser console on your expense tracker app

async function backupFirebaseData() {
    if (!window.expenseTracker || !window.expenseTracker.currentUser) {
        console.log('❌ Please sign in first');
        return;
    }
    
    const backup = {
        timestamp: new Date().toISOString(),
        user: window.expenseTracker.currentUser.email,
        expenses: window.expenseTracker.expenses,
        income: window.expenseTracker.income,
        categories: window.expenseTracker.categories
    };
    
    // Download as JSON file
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `expense-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    console.log('✅ Backup downloaded!', backup);
}

// Call this function to backup
backupFirebaseData();
