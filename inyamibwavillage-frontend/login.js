document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const national_id = document.getElementById('national_id').value.trim();
  const password = document.getElementById('password').value.trim();
  const API = window.API_BASE_URL;

  try {
    const res = await fetch(`${API}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ national_id, password })
    });

    const raw = await res.text();

    let data;
    try {
      data = JSON.parse(raw);
    } catch (err) {
      throw new Error(`Invalid JSON response: ${raw}`);
    }

    if (!res.ok) {
      alert(data.error || 'Login failed');
      return;
    }

    const token = data.token;
    const payload = JSON.parse(atob(token.split('.')[1]));
    const role = payload.role;
    const userId = payload.id;

    if (!role || !userId) {
      throw new Error('Missing user info in token');
    }

    localStorage.setItem('loggedUser', JSON.stringify({
      token: token,
      user: {
        id: userId,
        role: role
      }
    }));

    console.log(`✅ Login successful as ${role}`);

    switch (role) {
      case 'admin':
        window.location.href = 'admin_dashboard.html';
        break;
      case 'cell_leader':
        window.location.href = 'cell_inbox.html';
        break;
      case 'isibo_leader':
        window.location.href = 'isibo_inbox.html';
        break;
      case 'security':
        window.location.href = 'security_dashboard.html';
        break;
      default:
        window.location.href = 'home.html';
    }

  } catch (err) {
    console.error('❌ Login error:', err);
    alert('Server error during login.\n' + err.message);
  }
});
