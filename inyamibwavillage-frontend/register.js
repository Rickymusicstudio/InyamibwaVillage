document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const full_name = document.getElementById('full_name').value;
  const national_id = document.getElementById('national_id').value;
  const email = document.getElementById('email').value;
  const phone_number = document.getElementById('phone_number').value;
  const house = document.getElementById('house').value;
  const isibo = document.getElementById('isibo').value;
  const resident_type = document.getElementById('resident_type').value;
  const has_house_worker = document.getElementById('has_house_worker').value === 'true';
  const password = document.getElementById('password').value;
  const role = document.getElementById('role').value;

  const body = {
    full_name,
    national_id,
    email,
    phone_number,
    house,
    isibo,
    resident_type,
    has_house_worker,
    password,
    role
  };

  const status = document.getElementById('statusMessage');
  const API = window.API_BASE_URL;

  try {
    const res = await fetch(`${API}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await res.json();

    if (res.ok) {
      status.textContent = 'Iyandikishwa ryagenze neza! Turakuyobora ku injira...';
      status.style.color = 'green';
      document.getElementById('registerForm').reset();
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 2000);
    } else {
      status.textContent = data.error || 'Registration failed';
      status.style.color = 'red';
    }
  } catch (err) {
    console.error('Registration error:', err);
    status.textContent = 'Habaye ikibazo mu guhura na server.';
    status.style.color = 'red';
  }
});
