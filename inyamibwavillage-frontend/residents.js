// residents.js

const token = JSON.parse(localStorage.getItem("loggedUser"))?.token;

if (!token) {
  alert("Access denied.");
  window.location.href = "login.html";
}

const headers = {
  Authorization: "Bearer " + token,
};

// 🛡️ Decode token to get role
const role = JSON.parse(atob(token.split('.')[1]))?.role;
const canViewID = ['admin', 'cell_leader', 'isibo_leader', 'security'].includes(role);

// Masking function for national ID
function maskID(id) {
  return id?.length >= 4
    ? id.slice(0, 2) + '••••••••' + id.slice(-2)
    : '••••••••••';
}

const residentsTableBody = document.querySelector("#residentsTable tbody");
const isiboLeadersTableBody = document.querySelector("#isiboLeadersTable tbody");
const securityLeaderDiv = document.getElementById("securityLeaderInfo");
const cellLeaderDiv = document.getElementById("cellLeaderInfo");
const residentSearchInput = document.getElementById("residentSearch");

// ✅ Create a row for residents and isibo leaders
function createResidentRow(person) {
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td>${person.full_name}</td>
    <td>${canViewID ? person.national_id : maskID(person.national_id)}</td>
    <td>${person.phone_number}</td>
    <td>${person.email}</td>
    <td>${person.house}</td>
    <td>${person.isibo}</td>
    <td>${person.resident_type}</td>
  `;
  return tr;
}

// ✅ Fetch and display residents
fetch("http://localhost:5000/api/residents", { headers })
  .then((res) => res.json())
  .then((data) => {
    residentsTableBody.innerHTML = "";
    data.forEach((resident) => {
      const tr = createResidentRow(resident);
      residentsTableBody.appendChild(tr);
    });

    residentSearchInput.addEventListener("input", () => {
      const searchTerm = residentSearchInput.value.toLowerCase();
      const rows = residentsTableBody.querySelectorAll("tr");
      rows.forEach((row) => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm) ? "" : "none";
      });
    });
  })
  .catch((err) => {
    console.error("Error fetching residents:", err);
    residentsTableBody.innerHTML = "<tr><td colspan='7'>Habaye ikibazo mu kubona abaturage.</td></tr>";
  });

// ✅ Isibo Leaders
fetch("http://localhost:5000/api/leaders/isibo", { headers })
  .then((res) => res.json())
  .then((data) => {
    isiboLeadersTableBody.innerHTML = "";
    data.forEach((leader) => {
      const tr = createResidentRow(leader);
      isiboLeadersTableBody.appendChild(tr);
    });
  })
  .catch((err) => {
    console.error("Error fetching isibo leaders:", err);
    isiboLeadersTableBody.innerHTML = "<tr><td colspan='7'>Habaye ikibazo mu kubona abatwarasibo.</td></tr>";
  });

// ✅ Security Leader
fetch("http://localhost:5000/api/leaders/security", { headers })
  .then((res) => res.json())
  .then((leader) => {
    securityLeaderDiv.innerHTML = `
      <p><strong>Izina:</strong> ${leader.full_name}</p>
      <p><strong>Indangamuntu:</strong> ${canViewID ? leader.national_id : maskID(leader.national_id)}</p>
      <p><strong>Telefone:</strong> ${leader.phone_number}</p>
      <p><strong>Email:</strong> ${leader.email}</p>
      <p><strong>Inzu:</strong> ${leader.house}</p>
      <p><strong>Isibo:</strong> ${leader.isibo}</p>
      <p><strong>Uburyo atuyemo:</strong> ${leader.resident_type}</p>
    `;
  })
  .catch((err) => {
    console.error("Error fetching security leader:", err);
    securityLeaderDiv.innerHTML = "<p>Habaye ikibazo mu kubona Umukuru w’Umutekano.</p>";
  });

// ✅ Cell Leader
fetch("http://localhost:5000/api/leaders/cell", { headers })
  .then((res) => res.json())
  .then((leader) => {
    cellLeaderDiv.innerHTML = `
      <p><strong>Izina:</strong> ${leader.full_name}</p>
      <p><strong>Indangamuntu:</strong> ${canViewID ? leader.national_id : maskID(leader.national_id)}</p>
      <p><strong>Telefone:</strong> ${leader.phone_number}</p>
      <p><strong>Email:</strong> ${leader.email}</p>
      <p><strong>Inzu:</strong> ${leader.house}</p>
      <p><strong>Isibo:</strong> ${leader.isibo}</p>
      <p><strong>Uburyo atuyemo:</strong> ${leader.resident_type}</p>
    `;
  })
  .catch((err) => {
    console.error("Error fetching cell leader:", err);
    cellLeaderDiv.innerHTML = "<p>Habaye ikibazo mu kubona Umukuru w’Umudugudu.</p>";
  });
