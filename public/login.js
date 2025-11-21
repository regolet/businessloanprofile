// Use relative URL for API calls (works in both dev and production)
const API_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:3000/api'
    : '/api';

// Check if already logged in
document.addEventListener('DOMContentLoaded', () => {
    const sessionToken = localStorage.getItem('adminSession');
    if (sessionToken) {
        // Verify token is still valid
        verifySession(sessionToken);
    }
});

// Handle login form submission
document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorMessage = document.getElementById('errorMessage');
    const loginBtn = document.getElementById('loginBtn');

    // Hide error message
    errorMessage.style.display = 'none';

    // Disable button during login
    loginBtn.disabled = true;
    loginBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 1s linear infinite;">
            <circle cx="12" cy="12" r="10"/>
        </svg>
        Signing In...
    `;

    try {
        const response = await fetch(`${API_URL}/admin/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok && data.success) {
            // Store session token
            localStorage.setItem('adminSession', data.token);

            // Show success message
            loginBtn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"/>
                </svg>
                Success! Redirecting...
            `;

            // Redirect to admin panel
            setTimeout(() => {
                window.location.href = 'admin.html';
            }, 500);
        } else {
            throw new Error(data.message || 'Invalid credentials');
        }
    } catch (error) {
        // Show error message
        errorMessage.textContent = error.message || 'Login failed. Please try again.';
        errorMessage.style.display = 'flex';

        // Reset button
        loginBtn.disabled = false;
        loginBtn.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
                <polyline points="10 17 15 12 10 7"/>
                <line x1="15" y1="12" x2="3" y2="12"/>
            </svg>
            Sign In
        `;
    }
});

// Verify session token
async function verifySession(token) {
    try {
        const response = await fetch(`${API_URL}/admin/verify`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            // Token is valid, redirect to admin
            window.location.href = 'admin.html';
        } else {
            // Token invalid, clear it
            localStorage.removeItem('adminSession');
        }
    } catch (error) {
        console.error('Session verification failed:', error);
        localStorage.removeItem('adminSession');
    }
}

// Add keyframe animation for spinner
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);
