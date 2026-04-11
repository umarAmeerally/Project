const joinForm = document.getElementById("joinForm");
const accessCodeInput = document.getElementById("accessCode");
const nicknameInput = document.getElementById("nickname");
const messageDiv = document.getElementById("message");

function setMessage(text, type = "") {
  messageDiv.textContent = text;
  messageDiv.className = type
    ? `status-message ${type}`
    : "status-message";
}

joinForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const accessCode = accessCodeInput.value.trim().toUpperCase();
  const nickname = nicknameInput.value.trim();

  if (!accessCode || !nickname) {
    setMessage("Please enter both session code and nickname.", "error");
    return;
  }

  try {
    const response = await fetch("/api/sessions/join", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ accessCode, nickname })
    });

    const data = await response.json();

    if (!response.ok) {
      setMessage(data.message || "Could not join session.", "error");
      return;
    }

    localStorage.setItem("accessCode", accessCode);
    localStorage.setItem("nickname", nickname);

    setMessage("Joined successfully. Redirecting to waiting room...", "success");

    setTimeout(() => {
      window.location.href = "waiting-room.html";
    }, 500);
  } catch (error) {
    console.error("Join session error:", error);
    setMessage("Server error while joining session.", "error");
  }
});