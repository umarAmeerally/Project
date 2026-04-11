const accessCode = localStorage.getItem("accessCode");
const nickname = localStorage.getItem("nickname");

// Header / identity
const quizTitle = document.getElementById("quizTitle");
const sessionCodeBadge = document.getElementById("sessionCodeBadge");
const playerBadge = document.getElementById("playerBadge");

// Core duel info
const tacticalTimerInfo = document.getElementById("tacticalTimerInfo");
const tacticalTurnInfo = document.getElementById("tacticalTurnInfo");
const tacticalTurnOwner = document.getElementById("tacticalTurnOwner");
const tacticalPhaseInfo = document.getElementById("tacticalPhaseInfo");
const tacticalStatusText = document.getElementById("tacticalStatusText");
const liveStatusBanner = document.getElementById("liveStatusBanner");

// Question area
const questionTitle = document.getElementById("questionTitle");
const questionContainer = document.getElementById("questionContainer");
const nextBtn = document.getElementById("nextBtn");

// Player cards
const yourName = document.getElementById("yourName");
const yourAvatar = document.getElementById("yourAvatar");
const yourHpText = document.getElementById("yourHpText");
const yourHpBar = document.getElementById("yourHpBar");
const yourGuardStatus = document.getElementById("yourGuardStatus");
const yourFocusStatus = document.getElementById("yourFocusStatus");
const yourCounterStatus = document.getElementById("yourCounterStatus");

const opponentName = document.getElementById("opponentName");
const opponentAvatar = document.getElementById("opponentAvatar");
const opponentHpText = document.getElementById("opponentHpText");
const opponentHpBar = document.getElementById("opponentHpBar");
const opponentGuardStatus = document.getElementById("opponentGuardStatus");
const opponentFocusStatus = document.getElementById("opponentFocusStatus");
const opponentSecretStatus = document.getElementById("opponentSecretStatus");

// Action buttons
const tacticalActionButtons = document.getElementById("tacticalActionButtons");
const strikeBtn = document.getElementById("strikeBtn");
const guardBtn = document.getElementById("guardBtn");
const focusBtn = document.getElementById("focusBtn");
const recoverBtn = document.getElementById("recoverBtn");
const counterBtn = document.getElementById("counterBtn");

// Log
const battleLogList = document.getElementById("battleLogList");

let selectedAnswer = null;
let currentQuestion = null;
let questionActive = false;
let answerStartTime = 0;
let pollingHandle = null;
let resultRedirectStarted = false;
let currentSelectedAction = null;
let duelEndsAtMs = null;
let visibleTimerInterval = null;

function formatTime(seconds) {
  const safeSeconds = Math.max(0, Number(seconds) || 0);
  const mins = String(Math.floor(safeSeconds / 60)).padStart(2, "0");
  const secs = String(safeSeconds % 60).padStart(2, "0");
  return `${mins}:${secs}`;
}

function getInitial(name) {
  if (!name || typeof name !== "string") return "?";
  return name.trim().charAt(0).toUpperCase() || "?";
}

function setHpBar(barElement, hp) {
  const safeHp = Math.max(0, Math.min(100, Number(hp) || 0));
  barElement.style.setProperty("--hp", `${safeHp}%`);
}

function clearActionHighlights() {
  [strikeBtn, guardBtn, focusBtn, recoverBtn].forEach((btn) => {
    btn.classList.remove("selected");
  });
}

function setActionSelected(action) {
  clearActionHighlights();
  currentSelectedAction = action;

  const map = {
    strike: strikeBtn,
    guard: guardBtn,
    focus: focusBtn,
    recover: recoverBtn
  };

  if (map[action]) {
    map[action].classList.add("selected");
  }
}

function disableActions(disabled) {
  [strikeBtn, guardBtn, focusBtn, recoverBtn].forEach((btn) => {
    btn.disabled = disabled;
    btn.style.opacity = disabled ? "0.6" : "1";
    btn.style.cursor = disabled ? "not-allowed" : "pointer";
  });
}

function resetQuestionAreaToIdle() {
  selectedAnswer = null;
  currentQuestion = null;
  questionActive = false;
  answerStartTime = 0;
  questionTitle.textContent = "Your next decision will shape the duel.";
  questionContainer.innerHTML = `
    <div class="question-note">
      Select an action when it is your turn. A question will appear here to resolve it.
    </div>
  `;
  nextBtn.style.display = "none";
}

function renderQuestion(question) {
  selectedAnswer = null;
  currentQuestion = question;
  questionActive = true;
  answerStartTime = Date.now();

  questionTitle.textContent = question.text;
  questionContainer.innerHTML = `
    <div class="options-grid">
      ${question.options
        .map(
          (opt, index) => `
            <button class="option-btn" data-index="${index}">
              ${opt}
            </button>
          `
        )
        .join("")}
    </div>
  `;

  document.querySelectorAll(".option-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      selectedAnswer = Number(btn.dataset.index);

      document.querySelectorAll(".option-btn").forEach((b) => {
        b.classList.remove("selected");
      });

      btn.classList.add("selected");
    });
  });

  nextBtn.style.display = "inline-block";
  tacticalStatusText.textContent = "Answer the question to resolve your action.";
  liveStatusBanner.textContent = currentSelectedAction
    ? `Action selected: ${currentSelectedAction}. Now answer the quiz question.`
    : "Answer the quiz question to resolve your move.";
}

function renderBattleLog(logs) {
  battleLogList.innerHTML = "";

  const items = Array.isArray(logs) && logs.length ? [...logs].slice(-10).reverse() : ["No actions yet."];

  items.forEach((entry) => {
    const div = document.createElement("div");
    div.className = "log-item";
    div.textContent = entry;
    battleLogList.appendChild(div);
  });
}

function getMeAndOpponent(duel) {
  if (!duel?.player1 || !duel?.player2) {
    return { me: null, opponent: null };
  }

  if (duel.player1.nickname === nickname) {
    return { me: duel.player1, opponent: duel.player2 };
  }

  if (duel.player2.nickname === nickname) {
    return { me: duel.player2, opponent: duel.player1 };
  }

  return { me: null, opponent: null };
}

function renderPlayerCards(duel) {
  const { me, opponent } = getMeAndOpponent(duel);

  if (!me || !opponent) {
    liveStatusBanner.textContent = "Could not find your player state in this duel.";
    return;
  }

  yourName.textContent = me.nickname;
  yourAvatar.textContent = getInitial(me.nickname);
  yourHpText.textContent = `${me.hp} / 100`;
  setHpBar(yourHpBar, me.hp);
  yourGuardStatus.textContent = `Guard: ${me.guardValue || 0}`;
  yourFocusStatus.textContent = `Focus: ${me.focusBonus || 0}`;
  yourCounterStatus.textContent = me.hasCounterAvailable
    ? "Counter Ready"
    : me.hiddenCounterArmed
      ? "Counter Armed"
      : "Counter Used";

  opponentName.textContent = opponent.nickname;
  opponentAvatar.textContent = getInitial(opponent.nickname);
  opponentHpText.textContent = `${opponent.hp} / 100`;
  setHpBar(opponentHpBar, opponent.hp);
  opponentGuardStatus.textContent = `Guard: ${opponent.guardValue || 0}`;
  opponentFocusStatus.textContent = `Focus: ${opponent.focusBonus || 0}`;
  opponentSecretStatus.textContent = opponent.hiddenCounterArmed
    ? "Secret Tactic: Active"
    : "Secret Tactic: Unknown";
}

function renderPhaseAndTurn(duel, remainingTimeSeconds) {
  tacticalTurnInfo.textContent = `Turn ${duel.turnNumber} — ${duel.activeTurnPlayer}'s move`;

  const nicePhaseMap = {
    lobby: "Lobby",
    actionSelection: "Action Selection",
    question: "Question",
    resolution: "Resolution",
    finished: "Finished"
  };

  tacticalPhaseInfo.textContent = `Phase: ${nicePhaseMap[duel.phase] || duel.phase}`;

  if (duel.phase === "finished") {
    tacticalTurnOwner.textContent = "Match Finished";
  } else if (duel.activeTurnPlayer === nickname) {
    tacticalTurnOwner.textContent = "Your Move";
  } else {
    tacticalTurnOwner.textContent = "Opponent's Move";
  }
}

function renderIdleQuestionState(message) {
  resetQuestionAreaToIdle();
  tacticalStatusText.textContent = message;
}

function renderDuelState(data) {
  const duel = data?.tacticalDuelState?.duel;

  if (!duel) {
    stopVisibleTimer();
    tacticalTimerInfo.textContent = "00:00";
    liveStatusBanner.textContent = "Duel state is not available yet.";
    return;
  }

  if (duel.phase === "finished") {
    stopVisibleTimer();
    tacticalTimerInfo.textContent = "00:00";
  } else {
    startVisibleTimer(duel.endsAt);
  }

  sessionCodeBadge.textContent = `Session Code: ${accessCode || "----"}`;
  playerBadge.textContent = `Player: ${nickname || "----"}`;
  quizTitle.textContent = data?.quiz?.title ? `${data.quiz.title} — Tactical Duel` : "Tactical Duel";

  renderPhaseAndTurn(duel, data.remainingTimeSeconds);
  renderPlayerCards(duel);
  renderBattleLog(duel.battleLog || []);

  const { me } = getMeAndOpponent(duel);

  if (!me) {
    liveStatusBanner.textContent = "You are not part of this duel.";
    disableActions(true);
    nextBtn.style.display = "none";
    return;
  }

  if (duel.phase === "finished") {
    disableActions(true);
    counterBtn.disabled = true;
    nextBtn.style.display = "none";

    if (duel.winner === nickname) {
      tacticalStatusText.textContent = "You won the Tactical Duel 🏆";
      liveStatusBanner.textContent = "Victory secured. Redirecting to results...";
    } else {
      tacticalStatusText.textContent = "You lost the Tactical Duel.";
      liveStatusBanner.textContent = "Match complete. Redirecting to results...";
    }

    if (!resultRedirectStarted) {
      resultRedirectStarted = true;
      setTimeout(() => {
        window.location.href = "result.html";
      }, 2500);
    }

    return;
  }

  const isMyTurn = duel.activeTurnPlayer === nickname;

  if (!isMyTurn) {
    disableActions(true);
    counterBtn.disabled = true;
    counterBtn.style.opacity = "0.6";
    counterBtn.style.cursor = "not-allowed";

    if (!questionActive) {
      renderIdleQuestionState("Waiting for opponent's move...");
    }

    liveStatusBanner.textContent = "Your opponent is making a move. Watch the battle state and prepare your next turn.";
    return;
  }

  if (duel.phase === "actionSelection") {
    questionActive = false;
    selectedAnswer = null;
    currentQuestion = null;
    nextBtn.style.display = "none";

    disableActions(false);

    if (me.hasCounterAvailable) {
      counterBtn.disabled = false;
      counterBtn.style.opacity = "1";
      counterBtn.style.cursor = "pointer";
    } else {
      counterBtn.disabled = true;
      counterBtn.style.opacity = "0.5";
      counterBtn.style.cursor = "not-allowed";
    }

    if (!currentSelectedAction) {
      renderIdleQuestionState("Choose your action.");
    }

    tacticalStatusText.textContent = currentSelectedAction
      ? `Action selected: ${currentSelectedAction}.`
      : "Choose your action.";
    liveStatusBanner.textContent = "It is your turn. Pick a tactical move, then answer the question that follows.";
    return;
  }

  if (duel.phase === "question") {
    disableActions(true);
    counterBtn.disabled = true;
    counterBtn.style.opacity = "0.5";
    counterBtn.style.cursor = "not-allowed";

    nextBtn.style.display = "inline-block";
    tacticalStatusText.textContent = "Answer the question to resolve your move.";
    liveStatusBanner.textContent = currentSelectedAction
      ? `Resolving ${currentSelectedAction}. Select the best answer below.`
      : "Answer the current question to resolve your action.";
    return;
  }

  if (duel.phase === "resolution") {
    disableActions(true);
    counterBtn.disabled = true;
    nextBtn.style.display = "none";
    liveStatusBanner.textContent = "Move resolved. Preparing next turn...";
  }
}

async function fetchTacticalDuelState() {
  try {
    const response = await fetch(`/api/sessions/${accessCode}/tactical-duel-state`);
    const data = await response.json();

    if (!response.ok) {
      liveStatusBanner.textContent = data.message || "Could not load Tactical Duel state.";
      return null;
    }

    renderDuelState(data);
    return data;
  } catch (error) {
    console.error("Error fetching Tactical Duel state:", error);
    liveStatusBanner.textContent = "Server error while loading Tactical Duel state.";
    return null;
  }
}

async function selectAction(action) {
  try {
    disableActions(true);
    counterBtn.disabled = true;
    setActionSelected(action);

    const response = await fetch(`/api/sessions/${accessCode}/tactical-duel/select-action`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        nickname,
        action
      })
    });

    const data = await response.json();

    if (!response.ok) {
      liveStatusBanner.textContent = data.message || "Could not select action.";
      clearActionHighlights();
      currentSelectedAction = null;
      await fetchTacticalDuelState();
      return;
    }

    if (data.question) {
      renderQuestion(data.question);
    }

    renderDuelState(data);
  } catch (error) {
    console.error("Error selecting action:", error);
    liveStatusBanner.textContent = "Server error while selecting action.";
    clearActionHighlights();
    currentSelectedAction = null;
    await fetchTacticalDuelState();
  }
}

async function submitAnswer() {
  if (selectedAnswer === null) {
    alert("Please select an answer.");
    return;
  }

  if (!questionActive || !currentQuestion) {
    return;
  }

  try {
    nextBtn.disabled = true;
    nextBtn.style.opacity = "0.6";

    const responseTime = Date.now() - answerStartTime;

    const response = await fetch(`/api/sessions/${accessCode}/tactical-duel/submit-answer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        nickname,
        selectedAnswer,
        responseTime
      })
    });

    const data = await response.json();

    if (!response.ok) {
      liveStatusBanner.textContent = data.message || "Could not submit answer.";
      nextBtn.disabled = false;
      nextBtn.style.opacity = "1";
      return;
    }

    questionActive = false;
    currentQuestion = null;
    selectedAnswer = null;
    currentSelectedAction = null;
    clearActionHighlights();
    nextBtn.disabled = false;
    nextBtn.style.opacity = "1";

    renderIdleQuestionState("Move resolved.");
    renderDuelState(data);
  } catch (error) {
    console.error("Error submitting answer:", error);
    liveStatusBanner.textContent = "Server error while submitting answer.";
    nextBtn.disabled = false;
    nextBtn.style.opacity = "1";
  }
}

function bindActionButtons() {
  strikeBtn.addEventListener("click", () => selectAction("strike"));
  guardBtn.addEventListener("click", () => selectAction("guard"));
  focusBtn.addEventListener("click", () => selectAction("focus"));
  recoverBtn.addEventListener("click", () => selectAction("recover"));
  counterBtn.addEventListener("click", () => selectAction("counter"));

  nextBtn.addEventListener("click", async () => {
    await submitAnswer();
  });
}

async function initTacticalDuelPage() {
  if (!accessCode || !nickname) {
    alert("Missing session information. Please join the session again.");
    window.location.href = "join-session.html";
    return;
  }

  sessionCodeBadge.textContent = `Session Code: ${accessCode}`;
  playerBadge.textContent = `Player: ${nickname}`;
  yourName.textContent = nickname;
  yourAvatar.textContent = getInitial(nickname);

  resetQuestionAreaToIdle();
  bindActionButtons();

  await fetchTacticalDuelState();

  pollingHandle = setInterval(async () => {
    await fetchTacticalDuelState();
  }, 2000);
}


function stopVisibleTimer() {
  if (visibleTimerInterval) {
    clearInterval(visibleTimerInterval);
    visibleTimerInterval = null;
  }
}

function startVisibleTimer(endsAt) {
  if (!endsAt) {
    stopVisibleTimer();
    tacticalTimerInfo.textContent = "00:00";
    return;
  }

  const newEndsAtMs = new Date(endsAt).getTime();

  // Do not restart timer every poll if it is the same deadline
  if (duelEndsAtMs === newEndsAtMs && visibleTimerInterval) {
    return;
  }

  duelEndsAtMs = newEndsAtMs;
  stopVisibleTimer();

  const updateTimer = () => {
    const remainingMs = duelEndsAtMs - Date.now();
    const remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
    tacticalTimerInfo.textContent = formatTime(remainingSeconds);

    if (remainingSeconds <= 0) {
      stopVisibleTimer();
    }
  };

  updateTimer();
  visibleTimerInterval = setInterval(updateTimer, 1000);
}

initTacticalDuelPage();

window.addEventListener("beforeunload", () => {
  stopVisibleTimer();
});