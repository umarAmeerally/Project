const accessCode = localStorage.getItem("lecturerAccessCode");

if (!accessCode) {
  window.location.href = "lecturer-dashboard.html";
}

const accessCodeText = document.getElementById("accessCodeText");
const gameModeText = document.getElementById("gameModeText");
const participantsList = document.getElementById("participantsList");
const startGameBtn = document.getElementById("startGameBtn");
const startBattleBtn = document.getElementById("startBattleBtn");
const startTacticalDuelBtn = document.getElementById("startTacticalDuelBtn");
const endGameBtn = document.getElementById("endGameBtn");
const messageDiv = document.getElementById("message");

const classicLobbySection = document.getElementById("classicLobbySection");
const battleRoyaleLobbySection = document.getElementById("battleRoyaleLobbySection");
const tacticalDuelLobbySection = document.getElementById("tacticalDuelLobbySection");

accessCodeText.textContent = `Session Code: ${accessCode}`;

function setMessage(text, type = "") {
  messageDiv.textContent = text;
  messageDiv.className = type
    ? `status-message ${type}`
    : "status-message";
}

function hideAllModeSections() {
  classicLobbySection.hidden = true;
  battleRoyaleLobbySection.hidden = true;
  tacticalDuelLobbySection.hidden = true;
}

function updateLobbyMode(session) {
  hideAllModeSections();

  gameModeText.textContent = `Mode: ${session.gameMode || "----"}`;

  if (session.gameMode === "classic") {
    classicLobbySection.hidden = false;
  } else if (session.gameMode === "battleRoyale") {
    battleRoyaleLobbySection.hidden = false;
  } else if (session.gameMode === "tacticalDuel") {
    tacticalDuelLobbySection.hidden = false;
  }
}

function renderParticipants(participants = []) {
  participantsList.innerHTML = "";

  if (!participants.length) {
    const li = document.createElement("li");
    li.textContent = "No students joined yet.";
    participantsList.appendChild(li);
    return;
  }

  participants.forEach((participant) => {
    const li = document.createElement("li");
    li.className = "participant-item";
    li.textContent = participant.nickname;
    participantsList.appendChild(li);
  });
}

async function loadLobby() {
  try {
    const response = await fetch(`/api/sessions/${accessCode}`);
    const data = await response.json();

    if (!response.ok) {
      setMessage(data.message || "Session not found.", "error");
      return;
    }

    if (data.status === "live") {
      window.location.href = "monitoring.html";
      return;
    }

    if (data.status === "ended") {
      window.location.href = "lecturer-results.html";
      return;
    }

    updateLobbyMode(data);
    renderParticipants(data.participants || []);
  } catch (error) {
    console.error("Load lobby error:", error);
    setMessage("Error loading lobby.", "error");
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

    if (!response.ok) {
      setMessage(data.message || "Could not start game.", "error");
      return;
    }

    setMessage("Classic session started.", "success");
    window.location.href = "monitoring.html";
  } catch (error) {
    console.error("Start classic error:", error);
    setMessage("Server error while starting classic session.", "error");
  }
});

startBattleBtn.addEventListener("click", async () => {
  try {
    const response = await fetch(`/api/sessions/${accessCode}/start-battle`, {
      method: "POST"
    });

    const data = await response.json();

    if (!response.ok) {
      setMessage(data.message || "Could not start Battle Royale.", "error");
      return;
    }

    setMessage("Battle Royale started.", "success");
    window.location.href = "monitoring.html";
  } catch (error) {
    console.error("Start battle error:", error);
    setMessage("Server error while starting Battle Royale.", "error");
  }
});

startTacticalDuelBtn.addEventListener("click", async () => {
  try {
    const response = await fetch(`/api/sessions/${accessCode}/start-tactical-duel`, {
      method: "POST"
    });

    const data = await response.json();

    if (!response.ok) {
      setMessage(data.message || "Could not start Tactical Duel.", "error");
      return;
    }

    setMessage("Tactical Duel started.", "success");
    window.location.href = "monitoring.html";
  } catch (error) {
    console.error("Start tactical duel error:", error);
    setMessage("Server error while starting Tactical Duel.", "error");
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

    if (!response.ok) {
      setMessage(data.message || "Could not end session.", "error");
      return;
    }

    setMessage("Session ended.", "success");
    window.location.href = "lecturer-results.html";
  } catch (error) {
    console.error("End session error:", error);
    setMessage("Server error while ending session.", "error");
  }
});

loadLobby();
setInterval(loadLobby, 2000);