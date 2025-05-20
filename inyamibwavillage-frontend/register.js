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

  try {
    const res = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await res.json();

    if (res.ok) {
      alert('Iyandikishwa ryagenze neza! Injira none.');
      window.location.href = 'login.html';
    } else {
      alert(data.error || 'Registration failed');
    }
  } catch (err) {
    alert('Error connecting to server');
    console.error('Registration error:', err);
  }
});
