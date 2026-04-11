const accessCode = localStorage.getItem("lecturerAccessCode");

if (!accessCode) {
  window.location.href = "lecturer-dashboard.html";
}

const monitorAccessCodeText = document.getElementById("monitorAccessCodeText");
const monitorGameModeText = document.getElementById("monitorGameModeText");
const monitorStatusText = document.getElementById("monitorStatusText");
const quizTitleText = document.getElementById("quizTitleText");
const participantCountText = document.getElementById("participantCountText");
const monitorParticipantsList = document.getElementById("monitorParticipantsList");
const monitorMessage = document.getElementById("monitorMessage");
const endGameBtn = document.getElementById("endGameBtn");

const classicMonitorSection = document.getElementById("classicMonitorSection");
const battleRoyaleMonitorSection = document.getElementById("battleRoyaleMonitorSection");
const tacticalDuelMonitorSection = document.getElementById("tacticalDuelMonitorSection");

const classicMonitorText = document.getElementById("classicMonitorText");
const classicQuestionCountText = document.getElementById("classicQuestionCountText");

const battleRoundText = document.getElementById("battleRoundText");
const battlePhaseText = document.getElementById("battlePhaseText");
const nextRoundCountdownText = document.getElementById("nextRoundCountdownText");
const duelsContainer = document.getElementById("duelsContainer");
const eliminatedList = document.getElementById("eliminatedList");
const battleWinnerText = document.getElementById("battleWinnerText");

const tacticalTimerText = document.getElementById("tacticalTimerText");
const tacticalTurnText = document.getElementById("tacticalTurnText");
const tacticalPhaseText = document.getElementById("tacticalPhaseText");
const tacticalActivePlayerText = document.getElementById("tacticalActivePlayerText");
const tacticalWinnerText = document.getElementById("tacticalWinnerText");

const tacticalPlayer1Name = document.getElementById("tacticalPlayer1Name");
const tacticalPlayer1Hp = document.getElementById("tacticalPlayer1Hp");
const tacticalPlayer1Guard = document.getElementById("tacticalPlayer1Guard");
const tacticalPlayer1Focus = document.getElementById("tacticalPlayer1Focus");
const tacticalPlayer1Counter = document.getElementById("tacticalPlayer1Counter");

const tacticalPlayer2Name = document.getElementById("tacticalPlayer2Name");
const tacticalPlayer2Hp = document.getElementById("tacticalPlayer2Hp");
const tacticalPlayer2Guard = document.getElementById("tacticalPlayer2Guard");
const tacticalPlayer2Focus = document.getElementById("tacticalPlayer2Focus");
const tacticalPlayer2Counter = document.getElementById("tacticalPlayer2Counter");

const tacticalBattleLog = document.getElementById("tacticalBattleLog");

let nextRoundTimer = null;
let isNextRoundTriggered = false;

let currentRenderedMode = null;
let lastSharedInfoSignature = "";
let lastParticipantsSignature = "";
let lastClassicSignature = "";
let lastBattleSignature = "";
let lastTacticalSignature = "";

function setMessage(text, type = "") {
  monitorMessage.textContent = text;
  monitorMessage.className = type
    ? `status-message ${type}`
    : "status-message";
}

function clearNextRoundTimer() {
  if (nextRoundTimer) {
    clearInterval(nextRoundTimer);
    nextRoundTimer = null;
  }
}

function formatTime(seconds) {
  const safeSeconds = Math.max(0, Number(seconds) || 0);
  const mins = String(Math.floor(safeSeconds / 60)).padStart(2, "0");
  const secs = String(safeSeconds % 60).padStart(2, "0");
  return `${mins}:${secs}`;
}

function getQuizPayload(data) {
  return data.quiz || data.quizId || null;
}

function setActiveModeSection(mode) {
  if (currentRenderedMode === mode) {
    return;
  }

  classicMonitorSection.hidden = mode !== "classic";
  battleRoyaleMonitorSection.hidden = mode !== "battleRoyale";
  tacticalDuelMonitorSection.hidden = mode !== "tacticalDuel";

  currentRenderedMode = mode;
}

function renderSharedInfo(data) {
  const quiz = getQuizPayload(data);
  const participants = data.participants || [];

  const signature = JSON.stringify({
    accessCode,
    gameMode: data.gameMode || "",
    status: data.status || "",
    quizTitle: quiz?.title || "",
    participantCount: participants.length
  });

  if (signature === lastSharedInfoSignature) {
    return;
  }

  lastSharedInfoSignature = signature;

  monitorAccessCodeText.textContent = `Session Code: ${accessCode}`;
  monitorGameModeText.textContent = `Mode: ${data.gameMode || "----"}`;
  monitorStatusText.textContent = `Status: ${data.status || "----"}`;
  quizTitleText.textContent = `Quiz: ${quiz?.title || "----"}`;
  participantCountText.textContent = `Participants: ${participants.length}`;
}

function renderParticipants(participants = []) {
  const signature = JSON.stringify(
    participants.map((p) => ({
      nickname: p.nickname,
      score: p.score,
      status: p.status
    }))
  );

  if (signature === lastParticipantsSignature) {
    return;
  }

  lastParticipantsSignature = signature;
  monitorParticipantsList.innerHTML = "";

  if (!participants.length) {
    const li = document.createElement("li");
    li.textContent = "No participants found.";
    monitorParticipantsList.appendChild(li);
    return;
  }

  const sortedParticipants = [...participants].sort((a, b) => b.score - a.score);

  sortedParticipants.forEach((participant) => {
    const li = document.createElement("li");
    li.className = "participant-item";
    li.textContent = `${participant.nickname} — Score: ${participant.score} — Status: ${participant.status}`;
    monitorParticipantsList.appendChild(li);
  });
}

function renderClassicMonitor(data) {
  const quiz = getQuizPayload(data);

  const signature = JSON.stringify({
    status: data.status,
    questionCount: quiz?.questions?.length || 0
  });

  if (signature === lastClassicSignature) {
    return;
  }

  lastClassicSignature = signature;

  classicMonitorText.textContent =
    "Classic mode is live. Students answer independently and the scoreboard updates as correct answers are submitted.";
  classicQuestionCountText.textContent = `Question Count: ${quiz?.questions?.length || 0}`;
}

function buildBattleDuelCard(duel, index) {
  const card = document.createElement("article");
  card.className = "monitor-card lobby-duel-card";

  const title = document.createElement("h4");
  title.textContent = `Duel ${index + 1}`;
  card.appendChild(title);

  if (duel.isBye) {
    const line1 = document.createElement("p");
    line1.textContent = `${duel.player1.nickname} gets a bye`;
    card.appendChild(line1);

    const line2 = document.createElement("p");
    line2.textContent = `Winner: ${duel.winner || "Pending"}`;
    card.appendChild(line2);

    return card;
  }

  const matchup = document.createElement("p");
  matchup.textContent = `${duel.player1.nickname} vs ${duel.player2.nickname}`;
  card.appendChild(matchup);

  const p1Status = document.createElement("p");
  p1Status.textContent = `${duel.player1.nickname}: ${duel.player1.answered ? "Answered" : "Waiting"}`;
  card.appendChild(p1Status);

  const p2Status = document.createElement("p");
  p2Status.textContent = `${duel.player2.nickname}: ${duel.player2.answered ? "Answered" : "Waiting"}`;
  card.appendChild(p2Status);

  const duelStatus = document.createElement("p");
  duelStatus.textContent = `Status: ${duel.status}`;
  card.appendChild(duelStatus);

  const duelWinner = document.createElement("p");
  duelWinner.textContent = `Winner: ${duel.winner || "Pending"}`;
  card.appendChild(duelWinner);

  return card;
}

async function triggerNextRound() {
  try {
    const response = await fetch(`/api/sessions/${accessCode}/next-round`, {
      method: "POST"
    });

    const data = await response.json();

    if (!response.ok) {
      setMessage(data.message || "Could not start next round.", "error");
    }
  } catch (error) {
    console.error("Next round error:", error);
    setMessage("Server error while starting next round.", "error");
  }
}

function handleAutoNextRound(session) {
  if (session.gameMode !== "battleRoyale") {
    clearNextRoundTimer();
    nextRoundCountdownText.textContent = "";
    isNextRoundTriggered = false;
    return;
  }

  const phase = session.battleState?.phase;

  if (phase === "roundResults") {
    if (isNextRoundTriggered) {
      return;
    }

    isNextRoundTriggered = true;
    let countdown = 5;
    nextRoundCountdownText.textContent = `Next round starts in ${countdown} seconds...`;

    nextRoundTimer = setInterval(async () => {
      countdown -= 1;
      nextRoundCountdownText.textContent = `Next round starts in ${countdown} seconds...`;

      if (countdown <= 0) {
        clearNextRoundTimer();
        nextRoundCountdownText.textContent = "Starting next round...";
        await triggerNextRound();
        isNextRoundTriggered = false;
      }
    }, 1000);

    return;
  }

  if (phase === "question" || phase === "finished") {
    clearNextRoundTimer();
    nextRoundCountdownText.textContent = "";
    isNextRoundTriggered = false;
  }
}

function renderBattleRoyaleMonitor(data) {
  const battleState = data.battleState || {};

  const signature = JSON.stringify({
    currentRound: battleState.currentRound,
    phase: battleState.phase,
    winner: battleState.winner,
    eliminatedPlayers: battleState.eliminatedPlayers,
    duels: battleState.duels
  });

  if (signature === lastBattleSignature) {
    handleAutoNextRound(data);
    return;
  }

  lastBattleSignature = signature;

  battleRoundText.textContent = `Round: ${battleState.currentRound ?? 0}`;
  battlePhaseText.textContent = `Phase: ${battleState.phase || "----"}`;

  eliminatedList.innerHTML = "";
  (battleState.eliminatedPlayers || []).forEach((player) => {
    const li = document.createElement("li");
    li.textContent = player;
    eliminatedList.appendChild(li);
  });

  if (!battleState.eliminatedPlayers || battleState.eliminatedPlayers.length === 0) {
    const li = document.createElement("li");
    li.textContent = "No eliminated players yet.";
    eliminatedList.appendChild(li);
  }

  battleWinnerText.textContent = battleState.winner || "No winner yet";

  duelsContainer.innerHTML = "";
  (battleState.duels || []).forEach((duel, index) => {
    duelsContainer.appendChild(buildBattleDuelCard(duel, index));
  });

  if (!battleState.duels || battleState.duels.length === 0) {
    const empty = document.createElement("p");
    empty.textContent = "No duels available yet.";
    duelsContainer.appendChild(empty);
  }

  handleAutoNextRound(data);
}

function formatCounterState(player) {
  if (!player) return "--";
  if (player.hasCounterAvailable) return "Ready";
  if (player.hiddenCounterArmed) return "Armed";
  return "Used";
}

function renderTacticalPlayerCard(player, nameEl, hpEl, guardEl, focusEl, counterEl) {
  if (!player) {
    nameEl.textContent = "Player";
    hpEl.textContent = "HP: --";
    guardEl.textContent = "Guard: --";
    focusEl.textContent = "Focus: --";
    counterEl.textContent = "Counter: --";
    return;
  }

  nameEl.textContent = player.nickname;
  hpEl.textContent = `HP: ${player.hp}`;
  guardEl.textContent = `Guard: ${player.guardValue || 0}`;
  focusEl.textContent = `Focus: ${player.focusBonus || 0}`;
  counterEl.textContent = `Counter: ${formatCounterState(player)}`;
}

function renderTacticalMonitor(data) {
  const duel = data?.tacticalDuelState?.duel;

  const signature = JSON.stringify({
    remainingTimeSeconds: data.remainingTimeSeconds,
    duel
  });

  if (signature === lastTacticalSignature) {
    return;
  }

  lastTacticalSignature = signature;

  if (!duel) {
    tacticalTimerText.textContent = "Timer: --:--";
    tacticalTurnText.textContent = "Turn: --";
    tacticalPhaseText.textContent = "Phase: --";
    tacticalActivePlayerText.textContent = "Active Player: --";
    tacticalWinnerText.textContent = "Winner: Pending";
    tacticalBattleLog.innerHTML = "<p>Duel state not available yet.</p>";
    return;
  }

  tacticalTimerText.textContent = `Timer: ${formatTime(data.remainingTimeSeconds)}`;
  tacticalTurnText.textContent = `Turn: ${duel.turnNumber}`;
  tacticalPhaseText.textContent = `Phase: ${duel.phase}`;
  tacticalActivePlayerText.textContent = `Active Player: ${duel.activeTurnPlayer || "----"}`;
  tacticalWinnerText.textContent = `Winner: ${duel.winner || "Pending"}`;

  renderTacticalPlayerCard(
    duel.player1,
    tacticalPlayer1Name,
    tacticalPlayer1Hp,
    tacticalPlayer1Guard,
    tacticalPlayer1Focus,
    tacticalPlayer1Counter
  );

  renderTacticalPlayerCard(
    duel.player2,
    tacticalPlayer2Name,
    tacticalPlayer2Hp,
    tacticalPlayer2Guard,
    tacticalPlayer2Focus,
    tacticalPlayer2Counter
  );

  tacticalBattleLog.innerHTML = "";

  const logs = Array.isArray(duel.battleLog) ? duel.battleLog : [];

  if (!logs.length) {
    tacticalBattleLog.innerHTML = "<p>No battle log yet.</p>";
    return;
  }

  logs.slice(-10).reverse().forEach((entry) => {
    const item = document.createElement("div");
    item.className = "log-item";
    item.textContent = entry;
    tacticalBattleLog.appendChild(item);
  });
}

async function fetchBaseSession() {
  const response = await fetch(`/api/sessions/${accessCode}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Session not found");
  }

  return data;
}

async function fetchTacticalSession() {
  const response = await fetch(`/api/sessions/${accessCode}/tactical-duel-state`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Could not load Tactical Duel state");
  }

  return data;
}

async function loadMonitoring() {
  try {
    const baseSession = await fetchBaseSession();

    if (baseSession.status === "waiting") {
      window.location.href = "live-lobby.html";
      return;
    }

    let data = baseSession;

    if (baseSession.gameMode === "tacticalDuel") {
      data = await fetchTacticalSession();
    }

    if (data.status === "ended") {
      window.location.href = "lecturer-results.html";
      return;
    }

    renderSharedInfo(data);
    renderParticipants(data.participants || []);

    if (data.gameMode === "classic") {
      setActiveModeSection("classic");
      renderClassicMonitor(data);
      clearNextRoundTimer();
      nextRoundCountdownText.textContent = "";
      isNextRoundTriggered = false;
    } else if (data.gameMode === "battleRoyale") {
      setActiveModeSection("battleRoyale");
      renderBattleRoyaleMonitor(data);
    } else if (data.gameMode === "tacticalDuel") {
      setActiveModeSection("tacticalDuel");
      clearNextRoundTimer();
      nextRoundCountdownText.textContent = "";
      isNextRoundTriggered = false;
      renderTacticalMonitor(data);
    }
  } catch (error) {
    console.error("Monitoring load error:", error);
    setMessage(error.message || "Error loading monitoring page.", "error");
  }
}

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

loadMonitoring();
setInterval(loadMonitoring, 2000);

window.addEventListener("beforeunload", () => {
  clearNextRoundTimer();
});