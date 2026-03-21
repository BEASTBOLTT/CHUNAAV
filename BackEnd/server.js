require("dotenv").config();

const express = require("express");
const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");
const { ethers } = require("ethers");

const app = express();
app.use(express.json());
app.use(require("cors")());

// -------------------- BLOCKCHAIN SETUP --------------------
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const contractABI = require("../blockchain/artifacts/contracts/Voting.sol/Voting.json").abi;
const votingContract = new ethers.Contract(
  process.env.CONTRACT_ADDRESS,
  contractABI,
  wallet
);

// -------------------- OTP SETUP --------------------
const otpStore = {};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASS
  }
});

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// -------------------- UTIL --------------------
function readJSON(file) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, "data", file)));
}

function writeJSON(file, data) {
  fs.writeFileSync(
    path.join(__dirname, "data", file),
    JSON.stringify(data, null, 2)
  );
}

// -------------------- AUTH ROUTES --------------------
app.post("/send-otp", (req, res) => {
  const { id, role } = req.body;

  const file = role === "admin" ? "admins.json" : "voters.json";
  const users = readJSON(file);

  const user =
    role === "admin"
      ? users.find(a => a.adminId === id)
      : users.find(v => v.voterId === id);

  if (!user) return res.status(404).json({ message: "Invalid ID" });

  const otp = generateOTP();
  otpStore[user.email] = {
    otp,
    role
  };

  const roleName = role === "admin" ? "Administrator" : "Voter";

  transporter.sendMail({
    from: process.env.EMAIL,
    to: user.email,
    subject: "Secure Login OTP - CHUNAAV",
    html: `
      <div style="font-family: Arial, sans-serif; line-height:1.6;">
        
        <p>Dear ${roleName},</p>

        <p>
          A login attempt has been made to access the 
          <b>${role === "admin" ? "admin panel" : "voting portal"}</b> 
          of the e-Voting system.
        </p>

        <p>Your One-Time Password (OTP) for secure authentication is:</p>

        <h2 style="color:#2c3e50;">🔐 ${otp}</h2>

        <p>This OTP is valid for the next <b>5 minutes</b> and can be used only once.</p>

        <p style="color:red;">
          ⚠️ If you did not initiate this request, please ignore this email immediately 
          and ensure your account security.
        </p>

        <p>For any concerns, contact the system administrator.</p>

        <br>

        <p>Regards,<br>
        <b>CHUNAAV</b><br>
        Secure Blockchain Voting System</p>

      </div>
    `
  });

  res.json({ message: "OTP sent", email: user.email });
});

app.post("/verify-otp", (req, res) => {
  const { email, otp } = req.body;

  const currentTime = new Date().toLocaleString();

  
  const record = otpStore[email];
  const roleName = record.role === "admin" ? "Administrator" : "Voter";

  if (!record || record.otp !== otp) {
    transporter.sendMail({
      from: process.env.EMAIL,
      to: email,
      subject: "Failed Login Attempt - CHUNAAV",
      html: `
        <div style="font-family: Arial, sans-serif; line-height:1.6;">
          
          <p>Dear ${roleName},</p>

          <p>
            A <b>failed login attempt</b> was detected on your account 
            in the e-Voting system.
          </p>

          <p><b>🕒 Time:</b> ${currentTime}</p>

          <p style="color:red;">
            ⚠️ If this was not you, please secure your account immediately.
          </p>

          <p>Regards,<br>
          <b>CHUNAAV</b><br>
          Secure Blockchain Voting System</p>

        </div>
      `
    });

    return res.status(401).json({ message: "Invalid OTP" });
  }

  
  delete otpStore[email];

  transporter.sendMail({
    from: process.env.EMAIL,
    to: email,
    subject: "Login Successful - CHUNAAV",
    html: `
      <div style="font-family: Arial, sans-serif; line-height:1.6;">
        
        <p>Dear ${roleName},</p>

        <p>
          This is to inform you that your login to the admin panel 
          of the e-Voting system was successful.
        </p>

        <p><b>🕒 Login Time:</b> ${currentTime}</p>

        <p>If this was you, no further action is required.</p>

        <p style="color:red;">
          ⚠️ If you do not recognize this activity, please secure your account 
          immediately by changing your credentials and contacting the system administrator.
        </p>

        <p>Regards,<br>
        <b>CHUNAAV</b><br>
        Secure Blockchain Voting System</p>

      </div>
    `
  });

  res.json({ message: "Verified" });
});

// -------------------- ADMIN ROUTES --------------------

// Get candidates
app.get("/admin/candidates", (req, res) => {
  res.json(readJSON("candidates.json"));
});

app.get("/admin/details/:adminId", (req, res) => {
  const { adminId } = req.params;

  const admins = readJSON("admins.json");

  const admin = admins.find(a => a.adminId === adminId);

  if (!admin) {
    return res.status(404).json({ message: "Admin not found" });
  }

  res.json(admin);
});

// Add candidate (JSON + Blockchain)
app.post("/admin/add-candidate", (req, res) => {
  const { id, name, manifesto } = req.body;
  const candidates = readJSON("candidates.json");

  candidates.push({
    id,
    name,
    manifesto,
    active: true
  });

  writeJSON("candidates.json", candidates);

  res.json({ message: "Candidate saved" });
});


// Delete candidate
app.post("/admin/remove-candidate", (req, res) => {
  const { id } = req.body;
  const candidates = readJSON("candidates.json");

  const c = candidates.find(x => x.id === id);
  if (!c) return res.status(404).json({ message: "Not found" });

  c.active = false;
  writeJSON("candidates.json", candidates);

  res.json({ message: "Candidate removed (soft delete)" });
});

// Add voter
app.post("/admin/add-voter", (req, res) => {
  const voters = readJSON("voters.json");
  voters.push(req.body);
  writeJSON("voters.json", voters);
  res.json({ message: "Voter added" });
});
// Get all voters (Admin)
app.get("/admin/voters", (req, res) => {
  const voters = readJSON("voters.json");
  res.json(voters);
});


// Elections
app.post("/admin/create-election", async (req, res) => {
  try {
    const { id, title, candidateIds, startTime, endTime } = req.body;

    const elections = readJSON("elections.json");
    const newStart = new Date(startTime);
    const newEnd = new Date(endTime);

    for (const e of elections) {
      const existingStart = new Date(e.startTime);
      const existingEnd = new Date(e.endTime);

      if (
        (newStart >= existingStart && newStart <= existingEnd) ||
        (newEnd >= existingStart && newEnd <= existingEnd) ||
        (newStart <= existingStart && newEnd >= existingEnd)
      ) {
        return res.status(400).json({
          message: "Election time overlaps with another election"
        });
      }
    }
    const candidates = readJSON("candidates.json");

    const blockchainCandidateIndexes = [];


    elections.push({
      id,
      title,
      candidateIds,
      blockchainCandidateIndexes: [],
      status: "CREATED",
      startTime,
      endTime,
      votedVoters: []
    });

    writeJSON("elections.json", elections);

    res.json({ message: "Election created successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Election creation failed" });
  }
});

app.post("/admin/edit-election", (req, res) => {

  const { id, title, startTime, endTime, candidateIds } = req.body;

  const elections = readJSON("elections.json");

  const election = elections.find(e => e.id === id);

  if (!election) {
    return res.status(404).json({ message: "Election not found" });
  }

  if (election.status !== "CREATED") {
    return res.status(400).json({
      message: "Election cannot be edited after it has started"
    });
  }

  if (title) election.title = title;
  if (startTime) election.startTime = startTime;
  if (endTime) election.endTime = endTime;
  if (candidateIds) election.candidateIds = candidateIds;

  writeJSON("elections.json", elections);

  res.json({ message: "Election updated successfully" });
});

// Get all elections (Admin)
app.get("/admin/elections", (req, res) => {
  const elections = readJSON("elections.json");
  res.json(elections);
});

app.post("/admin/start-election", async (req, res) => {
  try {
    const { electionId } = req.body;

    const elections = readJSON("elections.json");
    const activeElection = elections.find(e => e.status === "ACTIVE");

    if (activeElection) {
      return res.status(400).json({
        message: "Another election is already active"
      });
    }
    const candidates = readJSON("candidates.json");

    elections.forEach(e => (e.status = "ENDED"));

    const active = elections.find(e => e.id === electionId);

    if (!active)
      return res.status(404).json({ message: "Election not found" });

    const now = new Date();
    const start = new Date(active.startTime);

    if (now >= start) {
      return res.status(400).json({
        message: "Election will start automatically at scheduled time"
      });
    }

    active.status = "ACTIVE";

    // ADD BLOCKCHAIN CANDIDATES ONLY NOW
    active.blockchainCandidateIndexes = [];

    let nonce = await wallet.getNonce();

    for (const candidateId of active.candidateIds) {
      const candidate = candidates.find(c => c.id === candidateId);
      if (!candidate) continue;

      const tx = await votingContract.addCandidate(
        candidate.name,
        electionId,
        { nonce: nonce++ }
      );

      await tx.wait();

      const count = await votingContract.getCandidateCount();
      active.blockchainCandidateIndexes.push(Number(count) - 1);
    }


    writeJSON("elections.json", elections);

    res.json({ message: "Election started successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to start election" });
  }
});



app.post("/admin/end-election", (req, res) => {
  const elections = readJSON("elections.json");

  const active = elections.find(e => e.status === "ACTIVE");
  const now = new Date();
    const end = new Date(active.endTime);

    if (now >= end) {
      return res.status(400).json({
        message: "Election will end automatically at scheduled time"
      });
    }

  if (!active) {
    return res.status(400).json({ message: "No active election" });
  }

  active.status = "ENDED";

  writeJSON("elections.json", elections);

  res.json({ message: "Election ended successfully" });
});


// -------------------- VOTER ROUTES --------------------

app.get("/voter/elections", (req, res) => {
  const elections = readJSON("elections.json");
  res.json(elections);
});

app.get("/voter/active-election", (req, res) => {
  const elections = readJSON("elections.json");
  const active = elections.find(e => e.status === "ACTIVE");
  res.json(active || null);
});

app.post("/voter/vote", async (req, res) => {
  try {
    const { voterId, candidateId } = req.body;

    const elections = readJSON("elections.json");
    const activeElection = elections.find(e => e.status === "ACTIVE");

    if (!activeElection)
      return res.status(400).json({ message: "No active election" });

    activeElection.votedVoters ||= [];

    if (activeElection.votedVoters.includes(voterId))
      return res.status(403).json({ message: "You have already voted" });

    if (!activeElection.candidateIds.includes(candidateId))
      return res.status(400).json({ message: "Invalid candidate" });

    const candidates = readJSON("candidates.json");
    const candidate = candidates.find(c => c.id === candidateId);

    if (!candidate)
      return res.status(400).json({ message: "Candidate not found" });

    //BLOCKCHAIN
    const voterHash = ethers.id(voterId);

    const election = elections.find(e => e.status === "ACTIVE");

    const indexPosition = election.candidateIds.indexOf(candidateId);

    if (indexPosition === -1) {
      return res.status(400).json({ message: "Candidate not found in election" });
    }

    if (!election.blockchainCandidateIndexes || election.blockchainCandidateIndexes.length === 0) {
      return res.status(500).json({
        message: "Election not initialized properly. Please restart election."
      });
    }

    const blockchainIndex = election.blockchainCandidateIndexes[indexPosition];

    if (blockchainIndex === undefined) {
      return res.status(500).json({
        message: "Blockchain mapping missing. Restart election."
      });
    }

    const tx = await votingContract.vote(
      blockchainIndex,
      election.id,
      voterHash
    );

    await tx.wait();

    // Save off-chain
    activeElection.votedVoters.push(voterId);
    writeJSON("elections.json", elections);

    res.json({ message: "Vote cast successfully" });
  } catch (err) {
    console.error("Voting error:", err);
    res.status(500).json({ message: "Voting failed" });
  }
});

async function autoManageElections() {
  const elections = readJSON("elections.json");
  const now = new Date();

  let changed = false;

  for (const e of elections) {

    if (!e.startTime || !e.endTime) return;

    const start = new Date(e.startTime);
    const end = new Date(e.endTime);

    const activeElection = elections.find(x => x.status === "ACTIVE");

    if (e.status === "CREATED" && now >= start && !activeElection) {

      console.log(`Auto-starting election ${e.id}`);

      const candidates = readJSON("candidates.json");

      e.status = "ACTIVE";
      e.blockchainCandidateIndexes = [];

      let nonce = await wallet.getNonce();

      for (const candidateId of e.candidateIds) {
        const candidate = candidates.find(c => c.id === candidateId);
        if (!candidate) continue;

        try {
          const tx = await votingContract.addCandidate(
            candidate.name,
            e.id,
            { nonce: nonce++ }
          );

          await tx.wait();

          const count = await votingContract.getCandidateCount();
          e.blockchainCandidateIndexes.push(Number(count) - 1);

        } catch (err) {
          console.error("Auto-start blockchain error:", err);
        }
      }

      changed = true;
    }

    if (e.status === "ACTIVE" && now >= end) {
      e.status = "ENDED";
      changed = true;
      console.log(`Election ${e.id} auto ended`);
    }
  };

  if (changed) {
    writeJSON("elections.json", elections);
  }
}

// -------------------- START SERVER --------------------
setInterval(autoManageElections, 10000);
app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});

// -------------------- RESULTS --------------------
app.get("/results", async (req, res) => {
  try {
    const elections = readJSON("elections.json");

    // get latest ended election
    const endedElection = [...elections]
      .reverse()
      .find(e => e.status === "ENDED");

    if (!endedElection) {
      return res.json([]);
    }

    const candidates = readJSON("candidates.json");
    const results = [];

    for (const candidateId of endedElection.candidateIds) {
      const candidate = candidates.find(c => c.id === candidateId);
      if (!candidate) continue;

      const [name, votes] = await votingContract.getCandidate(
        candidate.blockchainIndex
      );

      results.push({
        id: candidate.id,
        name,
        votes: votes.toString()
      });
    }

    res.json({
      electionId: endedElection.id,
      title: endedElection.title,
      results
    });
  } catch (err) {
    console.error("Results error:", err);
    res.status(500).json({ message: "Failed to fetch results" });
  }
});
// -------------------- RESULTS PER ELECTION --------------------
app.get("/results/:electionId", async (req, res) => {
  try {
    const { electionId } = req.params;

    const elections = readJSON("elections.json");
    const election = elections.find(e => e.id === electionId);

    if (!election || election.status !== "ENDED") {
      return res.status(404).json({ message: "Election not ended or not found" });
    }

    const candidates = readJSON("candidates.json");
    const results = [];

    let maxVotes = -1;
    let winners = [];

    const total = Number(await votingContract.getCandidateCount());

    for (let i = 0; i < total; i++) {
      const [name, eId, votesBN] =
        await votingContract.getCandidate(i);

      if (eId === election.id) {
        const votes = Number(votesBN);

        results.push({ name, votes });

        if (votes > maxVotes) {
          maxVotes = votes;
          winners = [name];
        } else if (votes === maxVotes) {
          winners.push(name);
        }
      }
    }


    res.json({
      electionId: election.id,
      title: election.title,
      results,
      summary:
        winners.length === 1
          ? {
              type: "WINNER",
              winner: winners[0],
              margin:
                maxVotes -
                Math.max(
                  ...results
                    .filter(r => r.name !== winners[0])
                    .map(r => r.votes)
                )
            }
          : {
              type: "TIE",
              winners,
              votes: maxVotes
            }
    });
  } catch (err) {
    console.error("Result fetch error:", err);
    res.status(500).json({ message: "Failed to fetch results" });
  }
});

// Get voter details
app.get("/voter/details/:voterId", (req, res) => {
  const { voterId } = req.params;

  const voters = readJSON("voters.json");
  const voter = voters.find(v => v.voterId === voterId);

  if (!voter) {
    return res.status(404).json({ message: "Voter not found" });
  }

  res.json(voter);
});