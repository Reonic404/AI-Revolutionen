document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const loginSection = document.getElementById('login-section');
    const adminPanel = document.getElementById('admin-panel');
    const loginError = document.getElementById('login-error');
    const logoutBtn = document.getElementById('logout-btn');
    const clearCommentsBtn = document.getElementById('clear-comments-btn');
    const commentCount = document.getElementById('comment-count');
    const logList = document.getElementById('log-list');

    // API URL - Adjust based on environment
    const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'http://localhost:3000/api' 
        : '/api';

    // Check if already logged in (simple session)
    if (sessionStorage.getItem('adminAuth') === 'true') {
        showPanel();
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (data.success) {
                sessionStorage.setItem('adminAuth', 'true');
                sessionStorage.setItem('adminPassword', password); // Store password for subsequent delete requests
                showPanel();
                addLog('[SUCCESS] Authentication successful.');
            } else {
                loginError.style.display = 'block';
                addLog('[ERROR] Invalid login attempt.');
            }
        } catch (err) {
            console.error('Login error:', err);
            loginError.innerText = 'Server Connection Error';
            loginError.style.display = 'block';
        }
    });

    logoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem('adminAuth');
        sessionStorage.removeItem('adminPassword');
        window.location.reload();
    });

    clearCommentsBtn.addEventListener('click', async () => {
        if (!confirm('Är du säker på att du vill radera ALLA kommentarer? Detta kan inte ångras.')) return;

        const password = sessionStorage.getItem('adminPassword');
        
        try {
            const response = await fetch(`${API_URL}/comments`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });

            if (response.ok) {
                alert('Alla kommentarer har raderats.');
                addLog('[ACTION] Database cleared.');
                updateStats();
            } else {
                alert('Misslyckades att radera kommentarer. Kontrollera behörighet.');
            }
        } catch (err) {
            console.error('Clear error:', err);
        }
    });

    function showPanel() {
        loginSection.style.display = 'none';
        adminPanel.style.display = 'block';
        document.body.style.background = '#050505';
        updateStats();
    }

    async function updateStats() {
        try {
            const response = await fetch(`${API_URL}/comments`);
            const comments = await response.json();
            commentCount.innerText = `Antal kommentarer i databasen: ${comments.length}`;
        } catch (err) {
            commentCount.innerText = 'Kunde inte hämta statistik.';
        }
    }

    function addLog(msg) {
        const li = document.createElement('li');
        const time = new Date().toLocaleTimeString();
        li.innerText = `[${time}] ${msg}`;
        logList.prepend(li);
    }
});
