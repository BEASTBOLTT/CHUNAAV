# 🗳️ CHUNAAV – Online Voting System with Blockchain Integration

> A secure and transparent voting platform built using full-stack web technologies and blockchain concepts to ensure integrity and trust in elections.

---

## 🚀 Overview

**CHUNAAV** is a web-based voting system designed to digitize and secure the election process. It provides separate interfaces for administrators and voters, enabling efficient election management and seamless voting.

The project also integrates **blockchain technology (via Hardhat and Solidity)** to enhance transparency and prevent tampering with voting data.

---

## ✨ Features

### 👨‍💼 Admin Panel

* Create and manage elections
* Add and manage candidates
* View election results
* Monitor voter activity

### 🧑‍💻 Voter Panel

* Secure login system
* View active elections
* Cast vote easily
* Ensures one vote per user

### 🔐 Security & Control

* Role-based access (Admin / Voter)
* Controlled voting process
* Input validation and structured data handling

### ⛓️ Blockchain Integration

* Smart contract support using Hardhat
* Tamper-resistant architecture (conceptual implementation)
* Transparent and verifiable voting logic

---

## 🛠️ Tech Stack

| Layer        | Technology Used                   |
| ------------ | --------------------------------- |
| Frontend     | HTML, CSS, JavaScript             |
| Backend      | Node.js, Express.js               |
| Blockchain   | Hardhat, Solidity                 |
| Data Storage | JSON (for demonstration purposes) |

---

## 📁 Project Structure

```
CHUNAAV/
│
├── FrontEnd/        # User Interface
├── BackEnd/         # Server & APIs
│   └── data/        # JSON-based demo data
├── Blockchain/      # Smart Contracts (Hardhat)
├── .gitignore
├── LICENSE
└── README.md
```

---

## ⚙️ Setup & Installation

### 🔧 1. Clone the Repository

```
git clone https://github.com/BEASTBOLTT/CHUNAAV.git
cd CHUNAAV
```

---

### 📦 2. Install Dependencies

#### Backend

```
cd BackEnd
npm install
```

#### Blockchain

```
cd ../Blockchain
npm install
```

---

## ⛓️ Blockchain Setup (Required)

### 1. Start Local Blockchain

```
npx hardhat node
```

---

### 2. Deploy Smart Contract

Open a new terminal:

```
npx hardhat run scripts/deploy.js --network localhost
```

---

### 3. Configure Environment Variables

Create a `.env` file inside `BackEnd/`:

```

EMAIL=your_email@gmail.com
EMAIL_PASS=your_app_password

RPC_URL=http://127.0.0.1:8545
PRIVATE_KEY=your_wallet_private_key
CONTRACT_ADDRESS=your_deployed_contract_address
```

---

### ⚠️ Important Notes

* Do NOT upload your `.env` file to GitHub
* Keep the Hardhat node running while using the application
* Use test/demo credentials only

---

## ▶️ Running the Application

### Start Backend Server

```
cd BackEnd
node server.js
```

---

### Run Frontend

* Open `FrontEnd/index.html` in browser
  OR
* Use Live Server (recommended)

---


## 🔄 Future Improvements

* MongoDB integration (replace JSON storage)
* JWT-based authentication system
* Full blockchain-based vote storage
* Cloud deployment support
* Enhanced UI/UX

---

## 🚀 Deployment Plan

| Component  | Platform                   |
| ---------- | -------------------------- |
| Frontend   | Vercel                     |
| Backend    | Render                     |
| Blockchain | Sepolia / Alchemy (future) |

---

## 📄 License

This project is licensed under the **MIT License**.

You are free to use, modify, and distribute this software in accordance with the license terms provided in the `LICENSE` file.

---

## ⭐ Support

If you find this project useful, consider giving it a ⭐ on GitHub!

---
