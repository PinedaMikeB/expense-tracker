# Expense Tracker Web App

A comprehensive expense tracking web application with reimbursement management, categories, and reminders.

## Features

- ✅ **Expense Tracking**: Add, view, and manage your expenses
- 💰 **Reimbursement Management**: Track reimbursements with status updates
- 🏷️ **Categories**: Create custom categories with color coding
- 🔔 **Reminders**: Set reminders for payments and follow-ups
- 📊 **Dashboard**: Real-time summary of expenses and reimbursements
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile
- 🌙 **Dark Mode**: Automatic dark mode support
- 💾 **Local Storage**: All data is stored locally in your browser

## Quick Start

1. **Download or Clone**: Download all files to a folder
2. **Open in Browser**: Open `index.html` in any modern web browser
3. **Start Tracking**: Begin adding your expenses and reimbursements!

## Deployment Options

### Option 1: Static Website Hosting
Upload the files to any static hosting service:
- **Netlify**: Drag and drop the folder to netlify.com
- **Vercel**: Connect to a Git repository or use CLI
- **GitHub Pages**: Upload to a GitHub repository and enable Pages
- **Firebase Hosting**: Use Firebase CLI to deploy

### Option 2: Local Development Server
For local development with live reload:

```bash
# Using Python
python -m http.server 8000

# Using Node.js (http-server)
npx http-server

# Using PHP
php -S localhost:8000
```

### Option 3: Upload to Web Server
Upload files via FTP/SFTP to any web hosting provider:
- cPanel hosting
- Shared hosting providers
- VPS/Cloud servers

## File Structure

```
expense-tracker/
├── index.html          # Main application page
├── styles.css          # Styling and responsive design
├── script.js           # Application logic and functionality
├── README.md           # This documentation
├── manifest.json       # PWA manifest for mobile installation
└── sw.js              # Service worker for offline functionality
```

## Browser Compatibility

- ✅ Chrome/Chromium (recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ✅ Mobile browsers

## Data Storage

All data is stored locally in your browser using localStorage. This means:
- ✅ No server required
- ✅ Data stays private on your device
- ⚠️ Data is tied to the specific browser/device
- ⚠️ Clearing browser data will remove your records

## Usage Tips

1. **Categories**: Set up categories first for better expense organization
2. **Reimbursements**: Use status updates to track payment progress
3. **Reminders**: Set due date reminders for important payments
4. **Regular Backups**: Export/copy your data periodically
5. **Notifications**: Allow browser notifications for reminder alerts

## Customization

The app can be easily customized:
- **Colors**: Modify the CSS variables in `styles.css`
- **Features**: Add/remove functionality in `script.js`
- **Layout**: Adjust the HTML structure in `index.html`

## Support

This is a client-side web application that requires no backend server. If you encounter issues:
1. Ensure JavaScript is enabled in your browser
2. Try a different browser or incognito mode
3. Check browser console for any error messages

---

**Enjoy tracking your expenses!** 🎯
