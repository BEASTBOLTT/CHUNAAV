document.addEventListener("DOMContentLoaded", () => {
  loadVoterName(); 
  loadActiveElection();    
});

async function loadVoterName() {
  const voterId = localStorage.getItem("voterId");

  if (!voterId) return;

  try {
    const res = await fetch(`${BACKEND_URL}/voter/details/${voterId}`);
    const voter = await res.json();

    document.getElementById("voterName").textContent = voter.voterName;
  } catch (err) {
    console.error("Failed to load voter name", err);
  }
}

async function loadActiveElection() {
  const voterId = localStorage.getItem("voterId");

  const res = await fetch(`${BACKEND_URL}/voter/active-election`);
  const election = await res.json();

  const box = document.getElementById("activeElectionVoter");

  if (!election) {
    box.innerHTML = "<p><b>No Active Election</b></p>";
    return;
  }

  const hasVoted = election.votedVoters.includes(voterId);

  let html = `
    <h3>
      ${election.title}
      <span style="font-size:14px; margin-left:10px;">
        [${hasVoted ? "VOTED" : "NOT VOTED"}]
      </span>
    </h3>

    <p>Start: ${new Date(election.startTime).toLocaleString()}</p>
    <p>End: ${new Date(election.endTime).toLocaleString()}</p>

    <p id="countdownTimer"></p>
    <hr>
  `;

  const candidatesRes = await fetch(`${BACKEND_URL}/admin/candidates`);
  const candidates = await candidatesRes.json();

  election.candidateIds.forEach(id => {
    const c = candidates.find(x => x.id === id);
    if (!c) return;

    html += `
      <div style="margin-bottom:15px;">
        <b>${c.name}</b><br>
        <small>${c.manifesto}</small><br>

        ${
          hasVoted
            ? `<button disabled>Voted</button>`
            : `<button onclick="castVote('${c.id}')">Vote</button>`
        }
      </div>
      <hr>
    `;
  });

  box.innerHTML = html;

  startCountdown(election.endTime);
}

function startCountdown(endTime) {
  const timer = document.getElementById("countdownTimer");

  function update() {
    const now = new Date();
    const end = new Date(endTime);

    const diff = end - now;

    if (diff <= 0) {
      timer.innerHTML = "<b>Election Ended</b>";
      return;
    }

    const hrs = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff / (1000 * 60)) % 60);
    const secs = Math.floor((diff / 1000) % 60);

    timer.innerHTML = `⏳ Ends in: ${hrs}h ${mins}m ${secs}s`;
  }

  update();
  setInterval(update, 1000);
} 

async function castVote(candidateId) {
  const voterId = localStorage.getItem("voterId");

  const res = await fetch(`${BACKEND_URL}/voter/vote`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ voterId, candidateId })
  });

  const data = await res.json();
  alert(data.message);

  if (res.ok) {
    loadActiveElection(); 
  }
}
async function loadPastElections() {
  const res = await fetch(`${BACKEND_URL}/voter/elections`);
  const elections = await res.json();

  const pastList = document.getElementById("past-elections");
  pastList.innerHTML = "";

  elections
    .filter(e => e.status === "ENDED")
    .forEach(e => {
      const li = document.createElement("li");
      li.innerHTML = `
        <strong>${e.title}</strong> (${e.id})
        <button onclick="viewResult('${e.id}')">View Result</button>
      `;
      pastList.appendChild(li);
    });
}

async function viewResult(electionId) {
  const res = await fetch(`${BACKEND_URL}/results/${electionId}`);
  const data = await res.json();

  const box = document.getElementById("resultsContainer");
  box.innerHTML = "";

  box.innerHTML += `<h3>${data.title} (${data.electionId})</h3>`;


  // Votes per candidate
  data.results.forEach(r => {
    const p = document.createElement("p");
    p.innerHTML = `${r.name}: <strong>${r.votes}</strong> votes`;
    box.appendChild(p);
  });

  box.innerHTML += "<hr />";

  // Winner / Tie summary
  if (data.summary.type === "WINNER") {
    box.innerHTML += `
      🏆 <strong>Winner:</strong> ${data.summary.winner}<br/>
      📊 <strong>Winning Margin:</strong> ${data.summary.margin} votes
    `;
  } else {
    box.innerHTML += `
      🤝 <strong>Tie between:</strong> ${data.summary.winners.join(", ")}<br/>
      📊 <strong>Votes each:</strong> ${data.summary.votes}
    `;
  }
}


document.querySelectorAll(".dashboard-card").forEach(card => {
  card.addEventListener("click", () => {
    const type = card.dataset.type;

    document.querySelector(".cards-container").classList.add("hide");
    document.getElementById("expandedView").style.display = "block";

    loadExpandedContent(type);
  });
});

function goBack() {
  document.getElementById("expandedView").style.display = "none";
  document.querySelector(".cards-container").classList.remove("hide");
}

function goHome() {
  window.location.href = "index.html";
}


function loadExpandedContent(type) {
  const title = document.getElementById("expandedTitle");
  const container = document.getElementById("expandedContent");

  if (type === "candidates") {
    title.textContent = "CANDIDATES";
    container.innerHTML = `<div id="candidateList"></div>`;
    loadCandidatesForVoter();
  }

  if (type === "past-elections") {
    title.textContent = "PAST ELECTIONS";
    container.innerHTML = `
      <ul id="past-elections"></ul>
      <div id="resultsContainer"></div>
    `;
    loadPastElections();
  }
}

async function loadCandidatesForVoter() {
  const res = await fetch(`${BACKEND_URL}/admin/candidates`);
  const data = await res.json();

  const container = document.getElementById("candidateList");
  container.innerHTML = "";

  data.filter(c => c.active).forEach(c => {
    container.innerHTML += `
      <div style="margin-bottom:15px;">
        <h3>${c.name}</h3>
        <p>${c.manifesto}</p>
        <hr/>
      </div>
    `;
  });
}