const accessCode = localStorage.getItem("accessCode");
const nickname = localStorage.getItem("nickname");

const waitingMessage = document.getElementById("waitingMessage");
const accessCodeText = document.getElementById("accessCodeText");
const nicknameText = document.getElementById("nicknameText");
const participantsList = document.getElementById("participantsList");
const participantsEmptyText = document.getElementById("participantsEmptyText");

if (accessCodeText) {
  accessCodeText.textContent = `Session Code: ${accessCode || "----"}`;
}

if (nicknameText) {
  nicknameText.textContent = nickname || "----";
}

function renderParticipants(participants = []) {
  if (!participantsList || !participantsEmptyText) return;

  participantsList.innerHTML = "";

  if (!participants.length) {
    participantsEmptyText.style.display = "block";
    return;
  }

  participantsEmptyText.style.display = "none";

  participants.forEach((participant) => {
    const li = document.createElement("li");
    li.textContent = participant.nickname;
    participantsList.appendChild(li);
  });
}

async function checkSessionStatus() {
  try {
    if (!accessCode || !nickname) {
      alert("Missing session information. Please join again.");
      window.location.href = "join-session.html";
      return;
    }

    const response = await fetch(`/api/sessions/${accessCode}`);
    const data = await response.json();

    if (!response.ok) {
      if (waitingMessage) {
        waitingMessage.textContent = data.message || "Session not found.";
      }
      return;
    }

    renderParticipants(data.participants || []);

    const participantExists = data.participants?.some(
      (p) => p.nickname === nickname
    );

    if (!participantExists) {
      alert("You are no longer part of this session.");
      window.location.href = "join-session.html";
      return;
    }

    if (data.status === "ended") {
      window.location.href = "result.html";
      return;
    }

    if (data.status !== "live") {
      if (waitingMessage) {
        waitingMessage.textContent = "Waiting for lecturer to start the session...";
      }
      return;
    }

    if (data.gameMode === "tacticalDuel") {
      window.location.href = "tactical-duel.html";
      return;
    }

    if (data.gameMode === "battleRoyale" || data.gameMode === "classic") {
      window.location.href = "quiz.html";
      return;
    }

    if (waitingMessage) {
      waitingMessage.textContent = "Unknown game mode.";
    }
  } catch (error) {
    console.error("Error checking session status:", error);
    if (waitingMessage) {
      waitingMessage.textContent = "Server error while checking session status.";
    }
  }
}

checkSessionStatus();
setInterval(checkSessionStatus, 2000);