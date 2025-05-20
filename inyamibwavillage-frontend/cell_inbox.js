const token = localStorage.getItem('token');

fetch('http://localhost:5000/api/messages/for-leader?role=cell_leader', {
  headers: {
    Authorization: 'Bearer ' + token
  }
})
  .then(res => res.json())
  .then(data => {
    const container = document.getElementById('messageList');
    if (!data.length) {
      container.innerHTML = '<p>Nta butumwa bwabonetse.</p>';
      return;
    }

    container.innerHTML = data.map(msg => `
      <div class="update">
        <p><strong>Ubutumwa:</strong> ${msg.message}</p>
        <p>
          <strong>👤 Yoherejwe na:</strong> ${msg.full_name || 'Izina ritazwi'} 
          (${msg.phone_number || 'Nta telefone'}) - Isibo: ${msg.isibo || 'Ntabwo yamenyekanye'}
        </p>
        ${msg.attachment ? `<p><a href="http://localhost:5000/uploads/messages/${msg.attachment}" target="_blank">📎 Reba inyandiko</a></p>` : ''}
        <small>⏱ Koherejwe: ${new Date(msg.created_at).toLocaleString('rw-RW')}</small>

        ${
          msg.reply
            ? `<p style="color:green; margin-top:10px;"><strong>✔️ Igisubizo cyoherejwe:</strong> ${msg.reply}</p>`
            : `
              <div class="reply-section" style="margin-top:10px;">
                <textarea id="reply-${msg.id}" rows="2" placeholder="Andika igisubizo hano..." style="width: 100%;"></textarea>
                <button onclick="sendReply(${msg.id})" class="reply-btn">Ohereza Igisubizo</button>
              </div>
            `
        }
      </div>
    `).join('');
  })
  .catch(err => {
    console.error('🚫 Message load failed:', err);
    document.getElementById('messageList').innerHTML = '<p>Ntibyagenze neza.</p>';
  });

function sendReply(messageId) {
  const token = localStorage.getItem('token');
  const textarea = document.getElementById(`reply-${messageId}`);
  const replyText = textarea.value.trim();

  if (!replyText) {
    alert('Andika igisubizo mbere yo kohereza.');
    return;
  }

  fetch(`http://localhost:5000/api/messages/reply/${messageId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + token
    },
    body: JSON.stringify({ reply: replyText })
  })
    .then(res => res.json())
    .then(data => {
      if (data.error) throw new Error(data.error);
      alert('Igisubizo cyoherejwe!');
      window.location.reload();
    })
    .catch(err => {
      console.error('🚫 Ntibyakunze kohereza igisubizo:', err);
      alert('Ntibyakunze kohereza igisubizo.');
    });
}
