// Show/hide isibo input depending on recipient
document.getElementById('recipient').addEventListener('change', (e) => {
  const isiboInput = document.getElementById('isiboInput');
  isiboInput.style.display = e.target.value === 'isibo_leader' ? 'block' : 'none';
});

// Submit contact form
document.getElementById('contactForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const token = JSON.parse(localStorage.getItem('loggedUser'))?.token;
  if (!token) {
    alert("Sohoka wongere winjire.");
    return;
  }

  const to = document.getElementById('recipient').value;
  const message = document.getElementById('message').value.trim();
  const isibo = document.getElementById('isibo').value.trim();
  const file = document.getElementById('attachment').files[0];

  if (!message) {
    alert("Andika ubutumwa bwawe mbere yo kohereza.");
    return;
  }

  const formData = new FormData();
  formData.append('to', to);
  formData.append('message', message);
  if (to === 'isibo_leader' && isibo) {
    formData.append('isibo', isibo);
  }
  if (file) {
    formData.append('attachment', file);
  }

  try {
    const res = await fetch('http://localhost:5000/api/messages', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + token
      },
      body: formData
    });

    const data = await res.json();

    if (res.ok) {
      const statusDiv = document.getElementById('statusMessage');
      statusDiv.style.display = 'block';
      statusDiv.style.color = 'green';
      statusDiv.textContent = 'Ubutumwa bwoherejwe!';
      setTimeout(() => (statusDiv.style.display = 'none'), 4000);
      e.target.reset();
      document.getElementById('isiboInput').style.display = 'none';
    } else {
      alert(data?.error || 'Ntibyagenze neza.');
    }

  } catch (err) {
    console.error('❌ Error sending message:', err);
    alert('Habaye ikibazo cyo kohereza ubutumwa.');
  }
});
