const SUPABASE_URL = 'https://tprwplwiwmxqxgujlvny.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwcndwbHdpd214cXhndWpsdm55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzNjg0MjMsImV4cCI6MjEwNjk0NDQyM30.f8w1MVvAA8CLmDYXPVZ8FhHab8o4aYf0qfbiPuWgBoE';

// Initialize Supabase Client
const _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', () => {
    // Elements matching your HTML
    const form = document.getElementById('gb-form');
    const nameInput = document.getElementById('gb-name');
    const commentInput = document.getElementById('gb-comment');
    const charCount = document.getElementById('gb-count');
    const errorDiv = document.getElementById('gb-error');

    // Load existing comments on startup
    getComments();

    // Character counter logic
    if (commentInput && charCount) {
        commentInput.addEventListener('input', () => {
            charCount.textContent = commentInput.value.length;
        });
    }

    // Submit comment handler
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault(); // Stop page reload

            if (errorDiv) errorDiv.textContent = '';

            const name = nameInput ? nameInput.value.trim() : '';
            const message = commentInput ? commentInput.value.trim() : '';

            if (!name || !message) {
                if (errorDiv) errorDiv.textContent = 'Fyll i både namn och kommentar.';
                return;
            }

            await addComment(name, message);
        });
    }
});

// Fetch comments from Supabase
async function getComments() {
    const { data, error } = await _supabase
        .from('comments')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching comments:', error.message);
        const errorDiv = document.getElementById('gb-error');
        if (errorDiv) errorDiv.textContent = 'Kunde inte hämta kommentarer.';
        return;
    }

    renderComments(data || []);
}

// Add comment to Supabase
async function addComment(name, message) {
    const submitBtn = document.getElementById('gb-submit');
    const errorDiv = document.getElementById('gb-error');

    if (submitBtn) submitBtn.disabled = true;

    const { data, error } = await _supabase
        .from('comments')
        .insert([{ name, message }]);

    if (submitBtn) submitBtn.disabled = false;

    if (error) {
        console.error('Error adding comment:', error.message);
        if (errorDiv) errorDiv.textContent = 'Kunde inte spara kommentar: ' + error.message;
        return;
    }

    // Clear inputs
    const nameInput = document.getElementById('gb-name');
    const commentInput = document.getElementById('gb-comment');
    const charCount = document.getElementById('gb-count');

    if (nameInput) nameInput.value = '';
    if (commentInput) commentInput.value = '';
    if (charCount) charCount.textContent = '0';

    // Refresh comments list
    getComments();
}

// Render comments into HTML
function renderComments(comments) {
    const feed = document.getElementById('gb-feed');
    const emptyState = document.getElementById('gb-empty');
    const totalCount = document.getElementById('gb-total-count');
    const latestDate = document.getElementById('gb-latest-date');

    // Update Stats
    if (totalCount) totalCount.textContent = comments.length;

    if (latestDate) {
        latestDate.textContent = comments.length > 0
            ? new Date(comments[0].created_at).toLocaleDateString('sv-SE')
            : '—';
    }

    // Show Empty State if no comments
    if (comments.length === 0) {
        if (feed) feed.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
        return;
    }

    if (emptyState) emptyState.style.display = 'none';

    // Render List
    if (feed) {
        feed.innerHTML = comments.map(c => `
      <div class="panel theme-neutral reveal active">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
          <h3 style="margin: 0;">${escapeHtml(c.name)}</h3>
          <small style="opacity: 0.7;">${new Date(c.created_at).toLocaleString('sv-SE')}</small>
        </div>
        <p style="margin: 0;">${escapeHtml(c.message)}</p>
      </div>
    `).join('');
    }
}

// Security: Escape HTML to prevent XSS attacks
function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, m => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[m]);
}