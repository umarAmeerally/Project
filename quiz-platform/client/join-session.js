const joinForm = document.getElementById("joinForm");
const messageDiv = document.getElementById("message");

joinForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const accessCode = document.getElementById("accessCode").value.trim();
  const nickname = document.getElementById("nickname").value.trim();

  try {
    const response = await fetch("http://localhost:5000/api/sessions/join", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ accessCode, nickname })
    });

    const data = await response.json();

    if (response.ok) {
      messageDiv.textContent = "Joined session successfully!";
      messageDiv.style.color = "green";

      // Save details for quiz page
      localStorage.setItem("accessCode", accessCode);
      localStorage.setItem("nickname", nickname);

      // Redirect to quiz page
      setTimeout(() => {
        window.location.href = "waiting-room.html";
      }, 1000);
    } else {
      messageDiv.textContent = data.message || "Failed to join session.";
      messageDiv.style.color = "red";
    }
  } catch (error) {
    messageDiv.textContent = "Server error. Could not join session.";
    messageDiv.style.color = "red";
    console.error(error);
  }
});