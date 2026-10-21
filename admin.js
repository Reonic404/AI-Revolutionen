document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const loginSection = document.getElementById('login-section');
    const adminPanel = document.getElementById('admin-panel');
    const loginError = document.getElementById('login-error');
    const logoutBtn = document.getElementById('logout-btn');
    const clearCommentsBtn = document.getElementById('clear-comments-btn');
    const commentCount = document.getElementById('comment-count');
    const logList = document.getElementById('log-list');
    const adminCommentList = document.getElementById('admin-comment-list');

    // Same API URL pattern as gastbok.js
    const API_URL =
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1'
            ? 'http://localhost:3000/api/comments'
            : '/api/comments';

    // Check existing session
    if (sessionStorage.getItem('adminAuth') === 'true') {
        showPanel();
    }

    // Login

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch(
                API_URL.replace(/\/comments$/, '/login'),
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password })
                }
            );

            const data = await response.json();

            if (response.ok && data.success) {
                sessionStorage.setItem('adminAuth', 'true');
                sessionStorage.setItem('adminPassword', password);

                showPanel();
                addLog('[SUCCESS] Authentication successful.');
            } else {
                loginError.innerText =
                    data.error || 'Felaktigt användarnamn eller lösenord.';
                loginError.style.display = 'block';
                addLog('[ERROR] Invalid login attempt.');
            }
        } catch (err) {
            console.error('Login error:', err);
            loginError.innerText = 'Server Connection Error';
            loginError.style.display = 'block';
        }
    });

    // Logout

    logoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem('adminAuth');
        sessionStorage.removeItem('adminPassword');
        window.location.reload();
    });

    // Clear All Comments

    clearCommentsBtn.addEventListener('click', async () => {
        if (!confirm(
            'Är du säker på att du vill radera ALLA kommentarer? Detta kan inte ångras.'
        )) {
            return;
        }

        const password = sessionStorage.getItem('adminPassword');

        try {
            const response = await fetch(API_URL, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ password })
            });

            if (response.ok) {
                alert('Alla kommentarer har raderats.');
                addLog('[ACTION] Database cleared.');
                await updateStats();
            } else {
                const error = await response.text();
                console.error(
                    'Clear error:',
                    response.status,
                    error
                );

                alert(
                    'Misslyckades att radera kommentarer. Kontrollera behörighet.'
                );
                addLog(`[ERROR] Failed to clear comments (${response.status})`);
            }
        } catch (err) {
            console.error('Clear error:', err);
            addLog('[ERROR] Server error while clearing comments.');
            alert('Kunde inte ansluta till servern.');
        }
    });

    // Admin Panel

    function showPanel() {
        loginSection.style.display = 'none';
        adminPanel.style.display = 'block';
        document.body.style.background = '#050505';

        updateStats();
    }

    // Statistics

    async function updateStats() {
        try {
            const response = await fetch(API_URL);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const comments = await response.json();

            commentCount.innerText =
                `Antal kommentarer i databasen: ${comments.length}`;

            renderCommentList(comments);
        } catch (err) {
            console.error('Stats error:', err);
            commentCount.innerText = 'Kunde inte hämta statistik.';
        }
    }

    // Render Comments

    function renderCommentList(comments) {
        adminCommentList.innerHTML = '';

        if (!Array.isArray(comments) || comments.length === 0) {
            adminCommentList.innerHTML =
                '<p style="padding: 1rem; color: #666;">Inga kommentarer att visa.</p>';
            return;
        }

        comments.forEach(comment => {
            const name = comment.Name ?? comment.name ?? 'Anonym';
            const text = comment.Text ?? comment.text ?? '';
            const id = comment.Id ?? comment.id;
            const ts =
                comment.Timestamp ??
                comment.timestamp ??
                comment.created_at ??
                comment.createdAt;

            const item = document.createElement('div');
            item.className = 'admin-comment-item';

            const info = document.createElement('div');
            info.className = 'comment-info';

            const strong = document.createElement('strong');
            strong.textContent = name;

            const paragraph = document.createElement('p');
            paragraph.textContent = text;

            const timestamp = document.createElement('span');
            const date = new Date(ts);
            timestamp.textContent =
                `${Number.isNaN(date.getTime()) ? 'Okänt datum' : date.toLocaleString('sv-SE')} (ID: ${id})`;

            info.append(strong, paragraph, timestamp);

            const button = document.createElement('button');
            button.className = 'btn-danger delete-comment-btn';
            button.dataset.id = id ?? '';
            button.style.padding = '0.3rem 0.6rem';
            button.style.fontSize = '0.8rem';
            button.textContent = 'Radera';

            button.addEventListener('click', async () => {
                if (!confirm(`Vill du radera kommentaren från ${name}?`)) {
                    return;
                }

                await deleteIndividualComment(id, name);
            });

            item.append(info, button);
            adminCommentList.appendChild(item);
        });
    }

    // Delete Individual Comment

    async function deleteIndividualComment(id, name) {
        const password = sessionStorage.getItem('adminPassword');

        try {
            const response = await fetch(
                `${API_URL}/${encodeURIComponent(id)}`,
                {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ password })
                }
            );

            if (response.ok) {
                addLog(`[ACTION] Deleted comment ${id} from ${name}`);
                await updateStats();
            } else {
                const error = await response.text();

                console.error(
                    'Delete error:',
                    response.status,
                    error
                );

                alert('Kunde inte radera kommentaren.');
                addLog(`[ERROR] Failed to delete comment ${id}`);
            }
        } catch (err) {
            console.error('Delete error:', err);
            addLog(`[ERROR] Server error during deletion of ${id}`);
        }
    }

    // Logging

    function addLog(msg) {
        const li = document.createElement('li');
        const time = new Date().toLocaleTimeString();

        li.textContent = `[${time}] ${msg}`;
        logList.prepend(li);
    }
});