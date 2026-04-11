const accessCode = localStorage.getItem("accessCode");
const nickname = localStorage.getItem("nickname");

const nicknameText = document.getElementById("nicknameText");
const scoreText = document.getElementById("scoreText");
const resultMessage = document.getElementById("resultMessage");
const sessionCodeText = document.getElementById("sessionCodeText");
const gameModeText = document.getElementById("gameModeText");
const statusText = document.getElementById("statusText");
const backToJoinBtn = document.getElementById("backToJoinBtn");

function formatGameMode(gameMode) {
  if (gameMode === "battleRoyale") return "Battle Royale";
  if (gameMode === "tacticalDuel") return "Tactical Duel";
  if (gameMode === "classic") return "Classic";
  return "Unknown";
}

function buildResultMessage(session, participant) {
  if (!participant) {
    return "Your result could not be matched to this session.";
  }

  if (session.gameMode === "battleRoyale") {
    if (participant.status === "winner") {
      return "You won the Battle Royale. Strong performance through the elimination rounds.";
    }

    if (participant.status === "eliminated") {
      return "You were eliminated from the Battle Royale. Your final score is shown above.";
    }

    return "Your Battle Royale session is complete.";
  }

  if (session.gameMode === "tacticalDuel") {
    if (session.tacticalDuelState?.duel?.winner === nickname) {
      return "You won the Tactical Duel. Your tactical decisions and answers secured the match.";
    }

    if (session.tacticalDuelState?.duel?.winner && session.tacticalDuelState.duel.winner !== nickname) {
      return "You lost the Tactical Duel. Your final score is shown above.";
    }

    return "Your Tactical Duel session is complete.";
  }

  return "Your quiz is complete. Review your final score above.";
}

async function loadResult() {
  if (!accessCode || !nickname) {
    nicknameText.textContent = "Player: ----";
    scoreText.textContent = "--";
    resultMessage.textContent = "Missing session information. Please join a session again.";
    sessionCodeText.textContent = "----";
    gameModeText.textContent = "----";
    statusText.textContent = "Unavailable";
    return;
  }

  nicknameText.textContent = `Player: ${nickname}`;
  sessionCodeText.textContent = accessCode;

  try {
    const response = await fetch(`/api/sessions/${accessCode}`);
    const data = await response.json();

    if (!response.ok) {
      scoreText.textContent = "--";
      resultMessage.textContent = data.message || "Session not found.";
      gameModeText.textContent = "Unknown";
      statusText.textContent = "Unavailable";
      return;
    }

    const participant = (data.participants || []).find(
      (p) => p.nickname === nickname
    );

    gameModeText.textContent = formatGameMode(data.gameMode);
    statusText.textContent = data.status || "Unknown";

    if (!participant) {
      scoreText.textContent = "--";
      resultMessage.textContent = "You are not listed in this session anymore.";
      return;
    }

    scoreText.textContent = participant.score ?? 0;
    resultMessage.textContent = buildResultMessage(data, participant);
  } catch (error) {
    console.error("Load result error:", error);
    scoreText.textContent = "--";
    resultMessage.textContent = "Server error while loading your result.";
    gameModeText.textContent = "Unknown";
    statusText.textContent = "Unavailable";
  }
}

backToJoinBtn.addEventListener("click", () => {
  localStorage.removeItem("accessCode");
  localStorage.removeItem("nickname");
  window.location.href = "join-session.html";
});

loadResult();