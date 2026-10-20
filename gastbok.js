// 1. Project URL (NO /rest/v1/ at the end)
const SUPABASE_URL = 'https://tprwplwiwmxqxgujlvny.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwcndwbHdpd214cXhndWpsdm55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzNjg0MjMsImV4cCI6MjEwNjk0NDQyM30.f8w1MVvAA8CLmDYXPVZ8FhHab8o4aYf0qfbiPuWgBoE';

// 2. Initialize Supabase Client
const _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

document.addEventListener('DOMContentLoaded', () => {
    // Load existing comments when page finishes loading
    getComments();

    // Attach submit handler to form
    const form = document.querySelector('form'); // Adjust selector if your form has an ID like #guestbook-form
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault(); // Stop page reload

            const nameInput = document.querySelector('input[name="name"]'); // Adjust selector to your HTML input
            const messageInput = document.querySelector('textarea[name="message"]'); // Adjust selector to your HTML textarea

            if (nameInput && messageInput) {
                await addComment(nameInput.value, messageInput.value);
                nameInput.value = '';
                messageInput.value = '';
            }
        });
    }
});

// Fetch all comments from Supabase
async function getComments() {
    const { data, error } = await _supabase
        .from('comments')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching comments:', error.message);
        return;
    }

    renderComments(data);
}

// Add a new comment to Supabase
async function addComment(name, message) {
    const { data, error } = await _supabase
        .from('comments')
        .insert([{ name, message }]);

    if (error) {
        console.error('Error inserting comment:', error.message);
        alert('Could not save comment: ' + error.message);
        return;
    }

    // Refresh comment list
    getComments();
}

// Render comments into HTML
function renderComments(comments) {
    const container = document.getElementById('comments-container'); // Make sure you have a div with id="comments-container"
    if (!container) return;

    container.innerHTML = comments.map(c => `
    <div class="comment-card">
      <h4>${escapeHtml(c.name)}</h4>
      <p>${escapeHtml(c.message)}</p>
      <small>${new Date(c.created_at).toLocaleString()}</small>
    </div>
  `).join('');
}

// Prevent XSS security issues
function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, m => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[m]);
} 