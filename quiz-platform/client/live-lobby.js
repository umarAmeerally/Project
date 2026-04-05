const accessCode = localStorage.getItem("lecturerAccessCode");

const accessCodeText = document.getElementById("accessCodeText");
const participantsList = document.getElementById("participantsList");
const startGameBtn = document.getElementById("startGameBtn");
const messageDiv = document.getElementById("message");
const endGameBtn = document.getElementById("endGameBtn");

accessCodeText.textContent = `Session Code: ${accessCode}`;

async function loadLobby() {
  try {
    const response = await fetch(`/api/sessions/${accessCode}`);
    const data = await response.json();

    if (!response.ok) {
      messageDiv.textContent = "Session not found.";
      messageDiv.style.color = "red";
      return;
    }

    participantsList.innerHTML = "";

    data.participants.forEach(participant => {
      const li = document.createElement("li");
      li.textContent = participant.nickname;
      participantsList.appendChild(li);
    });

    if (data.status === "live") {
      window.location.href = "lecturer-results.html";
    }
  } catch (error) {
    console.error(error);
    messageDiv.textContent = "Error loading lobby.";
    messageDiv.style.color = "red";
  }
}

startGameBtn.addEventListener("click", async () => {
  try {
    const response = await fetch("/api/sessions/begin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ accessCode })
    });

    const data = await response.json();

    if (response.ok) {
      messageDiv.textContent = "Game started!";
      messageDiv.style.color = "green";
    } else {
      messageDiv.textContent = data.message || "Could not start game.";
      messageDiv.style.color = "red";
    }
  } catch (error) {
    console.error(error);
    messageDiv.textContent = "Server error.";
    messageDiv.style.color = "red";
  }
});

endGameBtn.addEventListener("click", async () => {
  try {
    const response = await fetch("/api/sessions/end", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ accessCode })
    });

    const data = await response.json();

    if (response.ok) {
      messageDiv.textContent = "Session ended.";
      messageDiv.style.color = "green";
      window.location.href = "lecturer-results.html";
    } else {
      messageDiv.textContent = data.message || "Could not end session.";
      messageDiv.style.color = "red";
    }
  } catch (error) {
    console.error(error);
    messageDiv.textContent = "Server error while ending session.";
    messageDiv.style.color = "red";
  }
});

loadLobby();
setInterval(loadLobby, 2000);