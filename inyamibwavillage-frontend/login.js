document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const national_id = document.getElementById('national_id').value.trim();
  const password = document.getElementById('password').value.trim();

  try {
    const res = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ national_id, password })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.error || 'Login failed');
      return;
    }

    // ✅ Decode the JWT payload to extract user info
    const payloadBase64 = data.token.split('.')[1];
    const decodedPayload = JSON.parse(atob(payloadBase64));

    const role = decodedPayload.role;
    const userId = decodedPayload.id;

    if (!role || !userId) {
      throw new Error('Missing role or ID in token');
    }

    // ✅ Save token + user info to localStorage
    localStorage.setItem('loggedUser', JSON.stringify({
      token: data.token,
      user: {
        id: userId,
        role: role
      }
    }));

    console.log(`✅ Login successful as ${role}`);

    // ✅ Redirect based on role
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
      case 'resident':
      default:
        window.location.href = 'home.html';
        break;
    }

  } catch (err) {
    console.error('❌ Login error:', err);
    alert('Server error during login.');
  }
});
