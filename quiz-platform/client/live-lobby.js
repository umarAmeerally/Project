const accessCode = localStorage.getItem("lecturerAccessCode");

const accessCodeText = document.getElementById("accessCodeText");
const participantsList = document.getElementById("participantsList");
const startGameBtn = document.getElementById("startGameBtn");
const messageDiv = document.getElementById("message");
const endGameBtn = document.getElementById("endGameBtn");
const classicControls = document.getElementById("classicControls");
const battleControls = document.getElementById("battleControls");
const startBattleBtn = document.getElementById("startBattleBtn");

const battleRoundText = document.getElementById("battleRoundText");
const battlePhaseText = document.getElementById("battlePhaseText");
const eliminatedList = document.getElementById("eliminatedList");
const battleWinnerText = document.getElementById("battleWinnerText");
const duelsContainer = document.getElementById("duelsContainer");
const nextRoundCountdownText = document.getElementById("nextRoundCountdownText");

let nextRoundTimer = null;
let isNextRoundTriggered = false;

accessCodeText.textContent = `Session Code: ${accessCode}`;

function updateControlVisibility(session) {
  if (session.gameMode === "battleRoyale") {
    classicControls.style.display = "none";
    battleControls.style.display = "block";
  } else {
    classicControls.style.display = "block";
    battleControls.style.display = "none";
  }
}

function updateBattleMonitor(session) {
  if (session.gameMode !== "battleRoyale") {
    battleRoundText.textContent = "";
    battlePhaseText.textContent = "";
    eliminatedList.innerHTML = "";
    battleWinnerText.textContent = "";
    duelsContainer.innerHTML = "";
    return;
  }

  battleRoundText.textContent = `Round: ${session.battleState.currentRound}`;
  battlePhaseText.textContent = `Phase: ${session.battleState.phase}`;

  eliminatedList.innerHTML = "";
  session.battleState.eliminatedPlayers.forEach((player) => {
    const li = document.createElement("li");
    li.textContent = player;
    eliminatedList.appendChild(li);
  });

  battleWinnerText.textContent = session.battleState.winner
    ? session.battleState.winner
    : "No winner yet";

  duelsContainer.innerHTML = "";

  session.battleState.duels.forEach((duel, index) => {
    const duelDiv = document.createElement("div");
    duelDiv.style.border = "1px solid #ccc";
    duelDiv.style.padding = "10px";
    duelDiv.style.marginBottom = "10px";
    duelDiv.style.borderRadius = "8px";
    duelDiv.style.backgroundColor = "#f9f9f9";

    if (duel.isBye) {
      duelDiv.innerHTML = `
        <strong>Duel ${index + 1}</strong><br>
        ${duel.player1.nickname} gets a bye<br>
        Winner: ${duel.winner || "Pending"}
      `;
    } else {
      duelDiv.innerHTML = `
        <strong>Duel ${index + 1}</strong><br>
        ${duel.player1.nickname} vs ${duel.player2.nickname}<br>
        ${duel.player1.nickname}: ${duel.player1.answered ? "Answered" : "Waiting"}<br>
        ${duel.player2.nickname}: ${duel.player2.answered ? "Answered" : "Waiting"}<br>
        Status: ${duel.status}<br>
        Winner: ${duel.winner || "Pending"}
      `;
    }

    duelsContainer.appendChild(duelDiv);
  });
}

function handleAutoNextRound(session) {
  if (session.gameMode !== "battleRoyale") return;

  if (session.battleState.phase === "roundResults") {

    // prevent multiple timers
    if (isNextRoundTriggered) return;

    isNextRoundTriggered = true;

    let countdown = 5;

    nextRoundCountdownText.textContent = `Next round starts in ${countdown} seconds...`;

    nextRoundTimer = setInterval(async () => {
      countdown--;

      nextRoundCountdownText.textContent = `Next round starts in ${countdown} seconds...`;

      if (countdown <= 0) {
        clearInterval(nextRoundTimer);
        nextRoundCountdownText.textContent = "Starting next round...";

        try {
          await fetch(`/api/sessions/${accessCode}/next-round`, {
            method: "POST"
          });
        } catch (error) {
          console.error("Error starting next round:", error);
        }

        isNextRoundTriggered = false;
      }

    }, 1000);

  }

  // reset flag when new round begins
  if (session.battleState.phase === "question") {
    nextRoundCountdownText.textContent = "";
    isNextRoundTriggered = false;
  }

  if (session.battleState.phase === "finished") {
    nextRoundCountdownText.textContent = "";
  }
}

async function loadLobby() {
  try {
    const response = await fetch(`/api/sessions/${accessCode}`);
    const data = await response.json();

    if (!response.ok) {
      messageDiv.textContent = "Session not found.";
      messageDiv.style.color = "red";
      return;
    }

    updateControlVisibility(data);
    updateBattleMonitor(data);
    handleAutoNextRound(data);

    participantsList.innerHTML = "";

    data.participants.forEach((participant) => {
      const li = document.createElement("li");
      li.textContent = participant.nickname;
      participantsList.appendChild(li);
    });

    if (data.status === "live" && data.gameMode === "classic") {
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

startBattleBtn.addEventListener("click", async () => {
  try {
    const response = await fetch(`/api/sessions/${accessCode}/start-battle`, {
      method: "POST"
    });

    const data = await response.json();

    if (response.ok) {
      messageDiv.textContent = "Battle Royale started!";
      messageDiv.style.color = "green";
    } else {
      messageDiv.textContent = data.message || "Could not start battle royale.";
      messageDiv.style.color = "red";
    }
  } catch (error) {
    console.error(error);
    messageDiv.textContent = "Server error while starting battle royale.";
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