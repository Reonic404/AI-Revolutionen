/**
 * gastbok.js — Gästbok (Guestbook) API Client
 * Uses a Node.js backend to connect to a real SQL Server database.
 * Supports: Create, Read, Delete (with confirmation)
 */

const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:3000/api/comments' 
    : '/api/comments';

// ─── Database API ────────────────────────────────────────────────────────────

/** Load all comments from the server. Returns an array. */
async function dbLoad() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Failed to fetch from real DB');
        return await response.json();
    } catch (err) {
        console.error('Database load error:', err);
        return [];
    }
}

/** Add a new comment and persist it to SQL. Returns the saved comment. */
async function dbCreate(name, text) {
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, text })
        });
        if (!response.ok) throw new Error('Failed to save to real DB');
        return await response.json();
    } catch (err) {
        console.error('Database create error:', err);
        throw err;
    }
}

/** Delete a comment by its id from SQL. */
async function dbDelete(id) {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete from real DB');
    } catch (err) {
        console.error('Database delete error:', err);
    }
}

/** Clear every comment from the database. */
async function dbClear() {
    try {
        const response = await fetch(API_URL, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to clear real DB');
    } catch (err) {
        console.error('Database clear error:', err);
    }
}

// ─── Rendering ───────────────────────────────────────────────────────────────

function formatDate(isoString) {
    const d = new Date(isoString);
    return d.toLocaleDateString('sv-SE', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
}

function avatarColor(name) {
    const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#06b6d4', '#ef4444', '#6366f1'];
    let hash = 0;
    for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) & 0xFFFFFF;
    return colors[Math.abs(hash) % colors.length];
}

function createCommentCard(comment) {
    // Note: SQL Server returns 'Name' and 'Text' (camelCase or PascalCase depending on driver)
    // server.js returns them as they are in the database mapping.
    const name = comment.Name || comment.name;
    const text = comment.Text || comment.text;
    const id   = comment.Id   || comment.id;
    const ts   = comment.Timestamp || comment.timestamp;

    const initials = name
        .split(' ')
        .map(w => w[0] || '')
        .join('')
        .toUpperCase()
        .slice(0, 2);

    const card = document.createElement('article');
    card.className = 'gb-card';
    card.dataset.id = id;

    card.innerHTML = `
        <div class="gb-card-header">
            <div class="gb-avatar" style="background:${avatarColor(name)}">${initials}</div>
            <div class="gb-card-meta">
                <strong class="gb-card-name">${escapeHTML(name)}</strong>
                <time class="gb-card-time" datetime="${ts}">${formatDate(ts)}</time>
            </div>
        </div>
        <p class="gb-card-text">${escapeHTML(text)}</p>
    `;

    return card;
}

function escapeHTML(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

// ─── UI Update ───────────────────────────────────────────────────────────────

async function renderFeed() {
    const feed = document.getElementById('gb-feed');
    const emptyState = document.getElementById('gb-empty');
    if (!feed) return;

    const comments = await dbLoad();
    feed.innerHTML = '';

    if (comments.length === 0) {
        emptyState.style.display = 'flex';
        feed.style.display = 'none';
    } else {
        emptyState.style.display = 'none';
        feed.style.display = 'flex';
        comments.forEach(c => feed.appendChild(createCommentCard(c)));
    }

    updateStats(comments);
}

function updateStats(comments) {
    const totalEl = document.getElementById('gb-total-count');
    const latestEl = document.getElementById('gb-latest-date');
    if (!totalEl) return;

    totalEl.textContent = comments.length;
    if (comments.length > 0) {
        const ts = comments[0].Timestamp || comments[0].timestamp;
        const latest = new Date(ts);
        latestEl.textContent = latest.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' });
    } else {
        latestEl.textContent = '—';
    }
}

// ─── Event Handlers ──────────────────────────────────────────────────────────

async function handleSubmit(e) {
    e.preventDefault();
    const nameInput    = document.getElementById('gb-name');
    const commentInput = document.getElementById('gb-comment');
    
    const name = nameInput.value.trim();
    const text = commentInput.value.trim();

    if (!name || text.length < 5) {
        showError('Ange namn och minst 5 tecken text.');
        return;
    }

    clearError();

    try {
        // Save to SQL Database via API
        const comment = await dbCreate(name, text);

        // UI Update
        const feed = document.getElementById('gb-feed');
        const emptyState = document.getElementById('gb-empty');
        emptyState.style.display = 'none';
        feed.style.display = 'flex';

        const card = createCommentCard(comment);
        card.classList.add('gb-card-enter');
        feed.prepend(card);
        requestAnimationFrame(() => card.classList.add('gb-card-enter-active'));

        nameInput.value = '';
        commentInput.value = '';
        document.getElementById('gb-count').textContent = '0';

        const updatedComments = await dbLoad();
        updateStats(updatedComments);

        // Flash success
        const btn = document.getElementById('gb-submit');
        btn.classList.add('gb-btn-success');
        btn.querySelector('span').textContent = 'Postat i SQL! ✓';
        setTimeout(() => {
            btn.classList.remove('gb-btn-success');
            btn.querySelector('span').textContent = 'Posta kommentar';
        }, 2000);
    } catch (err) {
        showError('Kunde inte ansluta till backend-servern. Är den igång?');
    }
}


function showError(msg) {
    const errorEl = document.getElementById('gb-error');
    errorEl.textContent = msg;
    errorEl.style.display = 'block';
}

function clearError() {
    const errorEl = document.getElementById('gb-error');
    errorEl.style.display = 'none';
}

// ─── Initialise ───────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('gb-form');
    if (!form) return;

    form.addEventListener('submit', handleSubmit);

    const commentInput = document.getElementById('gb-comment');
    commentInput.addEventListener('input', () => {
        document.getElementById('gb-count').textContent = commentInput.value.length;
    });


    renderFeed();
});
