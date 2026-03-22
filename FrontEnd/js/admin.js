
//-------------ADMIN LOGIN-------------------------------


document.addEventListener("DOMContentLoaded", () => {
  const adminIdInput = document.getElementById("admin-id");
  const sendOtpBtn = document.getElementById("send-otp-btn");
  const verifyOtpBtn = document.getElementById("verify-otp-btn");
  const otpInput = document.getElementById("admin-otp");
  const adminNameSpan = document.getElementById("adminName");

  if (adminNameSpan) {
    const adminId = localStorage.getItem("adminId");

    if (adminId) {
      fetch(`${BACKEND_URL}/admin/details/${adminId}`)
        .then(res => res.json())
        .then(data => {
          adminNameSpan.textContent = data.name || "Admin";
        })
        .catch(() => {
          adminNameSpan.textContent = "Admin";
        });
    }
  }

  let adminEmail = "";

  if (adminIdInput && sendOtpBtn && verifyOtpBtn && otpInput) {
    otpInput.style.display = "none";
    verifyOtpBtn.style.display = "none";

    sendOtpBtn.addEventListener("click", async () => {
      const adminId = adminIdInput.value.trim();
      if (!adminId) return alert("Enter Admin ID");

      const res = await fetch(`${BACKEND_URL}/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: adminId, role: "admin" })
      });

      const data = await res.json();
      if (!res.ok) return alert(data.message);

      adminEmail = data.email;
      alert("OTP sent");

      sendOtpBtn.style.display = "none";
      otpInput.style.display = "block";
      verifyOtpBtn.style.display = "block";
    });

    verifyOtpBtn.addEventListener("click", async () => {
      const otp = otpInput.value.trim();
      if (!otp) return alert("Enter OTP");

      const res = await fetch(`${BACKEND_URL}/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: adminEmail, otp })
      });

      const data = await res.json();
      if (!res.ok) return alert(data.message);

      localStorage.setItem("adminId", adminIdInput.value.trim());
      localStorage.setItem("adminEmail", adminEmail);

      window.location.href = "admin-dashboard.html";
    });

    return;
  }

//--------------------ADMIN DASHBOARD-----------------

  loadCandidates();
  loadVoters();
  loadElections();
  loadCandidateCheckboxes();

  document.getElementById("addCandidateBtn").addEventListener("click", addCandidate);
  document.getElementById("addVoterBtn").addEventListener("click", addVoter);
  document.getElementById("createElectionBtn").addEventListener("click", createElection);

  document.getElementById("updateElectionBtn")?.addEventListener("click", updateElection);
});

//-----------------DASHBOARD FUNCTIONS--------------

async function addCandidate() {
  const id = document.getElementById("candidate-id").value.trim();
  const name = document.getElementById("candidate-name").value.trim();
  const manifesto = document.getElementById("candidate-manifesto").value.trim();

  if (!id || !name) return alert("Candidate ID and Name required");

  const res = await fetch(`${BACKEND_URL}/admin/add-candidate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, name, manifesto })
  });

  const data = await res.json();
  alert(data.message);
  loadCandidates();
}

async function addVoter() {
  const voterId = document.getElementById("voter-id").value.trim();
  const voterName = document.getElementById("voter-name").value.trim();
  const email = document.getElementById("voter-email").value.trim();

  if (!voterId || !voterName || !email) return alert("Voter ID, voter Name and Email required");

  const res = await fetch(`${BACKEND_URL}/admin/add-voter`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ voterId, voterName, email })
  });

  const data = await res.json();
  alert(data.message);
  loadVoters();
}

async function createElection() {
  const id = document.getElementById("election-id").value.trim();
  const title = document.getElementById("election-title").value.trim();
  const startTime = document.getElementById("startTime").value;
  const endTime = document.getElementById("endTime").value;

  const candidateIds = Array.from(
    document.querySelectorAll("#candidateCheckboxes input:checked")
  ).map(cb => cb.value);

  if (!id || !title || candidateIds.length === 0)
    return alert("Election ID, title, and candidates required");

  const res = await fetch(`${BACKEND_URL}/admin/create-election`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id,
      title,
      candidateIds,
      startTime,
      endTime
    })
  });

  const data = await res.json();
  alert(data.message);
  loadElections();
}

//------------------LOADERS--------------

async function loadCandidates() {
  const res = await fetch(`${BACKEND_URL}/admin/candidates`);
  const data = await res.json();

  const list = document.getElementById("candidateList");
  list.innerHTML = `<div class="card-grid"></div>`;

  const grid = list.querySelector(".card-grid");

  data.forEach(c => {
    grid.innerHTML += `
      <div class="info-card">
        <img src="../assets/Candidate&Voter.png" alt="Candidate">

        <p><b>ID:</b> ${c.id}</p>
        <p><b>Name:</b> ${c.name}</p>
        <p><b>Manifesto:</b> ${c.manifesto}</p>

        ${
          c.active
            ? `<button onclick="removeCandidate('${c.id}')">Remove</button>`
            : `<p style="color:red;">Removed</p>`
        }
      </div>
    `;
  });
}

async function loadCandidates() {
  const res = await fetch(`${BACKEND_URL}/admin/candidates`);
  const data = await res.json();

  const list = document.getElementById("candidateList");
  list.innerHTML = `<div class="card-grid"></div>`;

  const grid = list.querySelector(".card-grid");

  data.forEach(c => {
    grid.innerHTML += `
      <div class="info-card">
        <img src="../assets/Candidate&Voter.png" alt="Candidate">

        <p><b>ID:</b> ${c.id}</p>
        <p><b>Name:</b> ${c.name}</p>
        <p><b>Manifesto:</b> ${c.manifesto}</p>

        ${
          c.active
            ? `<button onclick="removeCandidate('${c.id}')">Remove</button>`
            : `<p style="color:red;">Removed</p>`
        }
      </div>
    `;
  });
}

async function loadCandidateCheckboxes() {
  const res = await fetch(`${BACKEND_URL}/admin/candidates`);
  const candidates = await res.json();

  const box = document.getElementById("candidateCheckboxes");
  box.innerHTML = "";

  candidates.filter(c => c.active).forEach(c => {
    box.innerHTML += `<label><input type="checkbox" value="${c.id}"> ${c.name}</label><br>`;
  });
}

async function loadElections() {
  const res = await fetch(`${BACKEND_URL}/admin/elections`);
  const elections = await res.json();

  const active = document.getElementById("activeElectionList");
  const all = document.getElementById("allElectionList");

  if (!active && !all) return; // safety

  active && (active.innerHTML = "");
  all && (all.innerHTML = "");

  let hasActive = false;

  elections.forEach(e => {

    const html = `
      <div>
        <b>${e.id}</b> - ${e.title} [${e.status}]<br>
        Start: ${e.startTime ? new Date(e.startTime).toLocaleString() : "Not Scheduled"}<br>
        End: ${e.endTime ? new Date(e.endTime).toLocaleString() : "Not Scheduled"}<br>

        ${e.status === "CREATED" ? `<button onclick="requestStartElection('${e.id}')">Start Early</button>` : ""}
        ${e.status === "ACTIVE" ? `<button onclick="requestEndElection('${e.id}')">End Early</button>` : ""}
        ${e.status === "CREATED" ? `<button onclick="editElection('${e.id}')">Edit</button>` : ""}
      </div>
      <hr>
    `;

    // ACTIVE SECTION
    if (e.status === "ACTIVE") {
      hasActive = true;

      const div = document.createElement("div");
      div.innerHTML = html;
      if (active) active.appendChild(div);
    }

    // ALL SECTION
    const divAll = document.createElement("div");
    divAll.innerHTML = html;
    if (all) all.appendChild(divAll);
  });

 
  if (active && !hasActive) {
    active.innerHTML = "<p><b>No Active Elections</b></p>";
  }
}

//----------------GLOBAL ACTIONS-------------------------

window.requestStartElection = async function (electionId) {
  await adminOTPAction(electionId, "start");
};

window.requestEndElection = async function (electionId) {
  await adminOTPAction(electionId, "end");
};

async function adminOTPAction(electionId, action) {
  await fetch(`${BACKEND_URL}/send-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: localStorage.getItem("adminId"),
      role: "admin"
    })
  });

  const otp = prompt("Enter OTP:");
  if (!otp) return;

  const verify = await fetch(`${BACKEND_URL}/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: localStorage.getItem("adminEmail"),
      otp
    })
  });

  if (!verify.ok) return alert("OTP failed");

  const res = await fetch(`${BACKEND_URL}/admin/${action}-election`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: action === "start" ? JSON.stringify({ electionId }) : null
  });

  const data = await res.json();
  alert(data.message);
  loadElections();
}

window.removeCandidate = async function (id) {
  const res = await fetch(`${BACKEND_URL}/admin/remove-candidate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id })
  });

  const data = await res.json();
  alert(data.message);
  loadCandidates();
};

window.editElection = async function (electionId) {

  const res = await fetch(`${BACKEND_URL}/admin/elections`);
  const elections = await res.json();

  const election = elections.find(e => e.id === electionId);
  if (!election) return alert("Election not found");

  document.getElementById("updateElectionSection").style.display = "block";

  document.getElementById("update-election-id").value = election.id;
  document.getElementById("update-election-title").value = election.title;

  document.getElementById("update-startTime").value =
    election.startTime ? election.startTime.slice(0,16) : "";

  document.getElementById("update-endTime").value =
    election.endTime ? election.endTime.slice(0,16) : "";

  loadUpdateCandidateCheckboxes(election.candidateIds);
};

async function loadUpdateCandidateCheckboxes(selectedIds) {

  const res = await fetch(`${BACKEND_URL}/admin/candidates`);
  const candidates = await res.json();

  const box = document.getElementById("updateCandidateCheckboxes");

  box.innerHTML = "";

  candidates.filter(c => c.active).forEach(c => {

    const checked = selectedIds.includes(c.id) ? "checked" : "";

    box.innerHTML += `
      <label>
        <input type="checkbox" value="${c.id}" ${checked}>
        ${c.name}
      </label><br>
    `;
  });
}

async function updateElection() {

  await fetch(`${BACKEND_URL}/send-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: localStorage.getItem("adminId"),
      role: "admin"
    })
  });

  const otp = prompt("Enter OTP sent to email");
  if (!otp) return;

  const verify = await fetch(`${BACKEND_URL}/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: localStorage.getItem("adminEmail"),
      otp
    })
  });

  if (!verify.ok) return alert("OTP verification failed");

  const id = document.getElementById("update-election-id").value;
  const title = document.getElementById("update-election-title").value;
  const startTime = document.getElementById("update-startTime").value;
  const endTime = document.getElementById("update-endTime").value;

  const candidateIds = Array.from(
    document.querySelectorAll("#updateCandidateCheckboxes input:checked")
  ).map(cb => cb.value);

  const res = await fetch(`${BACKEND_URL}/admin/edit-election`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id,
      title,
      startTime,
      endTime,
      candidateIds
    })
  });

  const data = await res.json();

  if (!res.ok) {
    alert(data.message || "Update failed");
    return;
  }

  alert(data.message);
  document.getElementById("updateElectionSection").style.display = "none";

  loadElections();
}
function goHome() {
  window.location.href = "index.html";
}

// CARD CLICK HANDLER
document.querySelectorAll(".dashboard-card").forEach(card => {
  card.addEventListener("click", () => {
    const type = card.dataset.type;

    document.querySelector(".cards-container").classList.add("hide");
    document.getElementById("expandedView").style.display = "block";

    loadExpandedContent(type);
  });
});

// BACK BUTTON
function goBack() {
  document.getElementById("expandedView").style.display = "none";
  document.querySelector(".cards-container").classList.remove("hide");
}

// LOAD CONTENT
function loadExpandedContent(type) {
  const title = document.getElementById("expandedTitle");
  const container = document.getElementById("expandedContent");

  switch(type) {

    case "voters":
      title.textContent = "VOTERS";
      container.innerHTML = `<ul id="voterList"></ul>`;
      loadVoters();
      break;

    case "add-voter":
      title.textContent = "ADD VOTERS";
      container.innerHTML = `
        <input id="voter-id" placeholder="Voter ID">
        <input id="voter-name" placeholder="Voter Name">
        <input id="voter-email" placeholder="Email">
        <button onclick="addVoter()">Add Voter</button>
      `;
      break;

    case "candidates":
      title.textContent = "CANDIDATES";
      container.innerHTML = `<ul id="candidateList"></ul>`;
      loadCandidates();
      break;

    case "add-candidate":
      title.textContent = "ADD CANDIDATES";
      container.innerHTML = `
        <input id="candidate-id" placeholder="Candidate ID" />
        <input id="candidate-name" placeholder="Candidate Name" />
        <textarea id="candidate-manifesto" placeholder="Manifesto"></textarea>
        <button onclick="addCandidate()">Add Candidate</button>
      `;
      break;

    case "elections":
      title.textContent = "ALL ELECTIONS";
      container.innerHTML = `<ul id="allElectionList"></ul>`;
      loadElections();
      break;

    case "add-election":
      title.textContent = "CREATE ELECTIONS";
      container.innerHTML = `
        <input id="election-id" placeholder="Election ID" />
        <input id="election-title" placeholder="Election Title" />

        <label>Start Time</label>
        <input type="datetime-local" id="startTime">

        <label>End Time</label>
        <input type="datetime-local" id="endTime">

        <h4>Select Candidates</h4>
        <div id="candidateCheckboxes"></div>

        <button onclick="createElection()">Create Election</button>
      `;

      loadCandidateCheckboxes();
      break;
  }
}
