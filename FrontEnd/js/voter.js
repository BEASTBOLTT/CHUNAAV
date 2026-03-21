document.addEventListener("DOMContentLoaded", () => {
  let voterEmail = "";
  let loggedInVoterId = ""; //GLOBAL STATE

  const idInput = document.getElementById("voter-id");
  const otpInput = document.getElementById("voter-otp");
  const sendOtpBtn = document.getElementById("send-otp-btn");
  const verifyOtpBtn = document.getElementById("verify-otp-btn");

  otpInput.style.display = "none";
  verifyOtpBtn.style.display = "none";

  // SEND OTP
  sendOtpBtn.addEventListener("click", async () => {
    const id = idInput.value.trim();

    if (!id) {
      alert("Enter Voter ID");
      return;
    }

    loggedInVoterId = id; //STORE ID HERE

    const res = await fetch(`${BACKEND_URL}/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, role: "voter" })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message);
      return;
    }

    voterEmail = data.email;

    alert("OTP sent");
    sendOtpBtn.style.display = "none";
    otpInput.style.display = "block";
    verifyOtpBtn.style.display = "block";
  });

  // VERIFY OTP
  verifyOtpBtn.addEventListener("click", async () => {
    const otp = otpInput.value.trim();

    if (!otp) {
      alert("Enter OTP");
      return;
    }

    const res = await fetch(`${BACKEND_URL}/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: voterEmail, otp })
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message);
      return;
    }

    //STORE VOTER SESSION PROPERLY
    localStorage.setItem("voterId", loggedInVoterId);

    window.location.href = "voter-dashboard.html";
  });
});
