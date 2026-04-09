const questionContainer = document.getElementById("questionContainer");
const nextBtn = document.getElementById("nextBtn");
const quizTitle = document.getElementById("quizTitle");
const battleStatusText = document.getElementById("battleStatusText");
const accessCode = localStorage.getItem("accessCode");
const nickname = localStorage.getItem("nickname");
const battleRoundInfo = document.getElementById("battleRoundInfo");
const battleOpponentInfo = document.getElementById("battleOpponentInfo");

let questions = [];
let currentQuestionIndex = 0;
let selectedAnswer = null;
let isBattleMode = false;
let startTime = 0;
let lastLoadedRound = null;
let lastLoadedQuestionInRound = null;
let studentCountdownTimer = null;
let studentCountdownStartedForRound = null;
let resultRedirectStarted = false;




async function detectGameMode() {
  try {
    const res = await fetch(`/api/sessions/${accessCode}/battle-state`);
    const data = await res.json();

    if (data.gameMode === "battleRoyale") {
      isBattleMode = true;
      loadBattleQuestion(data);
    } else {
      isBattleMode = false;
      loadClassicQuiz();
    }
  } catch (error) {
    console.error("Error detecting game mode:", error);
    alert("Could not load quiz mode.");
  }
}

function loadBattleQuestion(data) {
  if (data.battleState.phase !== "question") {
    battleRoundInfo.textContent = "";
    battleOpponentInfo.textContent = "";
    questionContainer.innerHTML = `<h3>Waiting for next round...</h3>`;
    nextBtn.style.display = "none";
    return;
  }

  const duel = data.battleState.duels.find(
    (d) =>
      d.player1?.nickname === nickname ||
      d.player2?.nickname === nickname
  );

  if (!duel) {
    battleRoundInfo.textContent = "";
    battleOpponentInfo.textContent = "";
    questionContainer.innerHTML = `<h3>No duel found.</h3>`;
    nextBtn.style.display = "none";
    return;
  }

  // Display round
  battleRoundInfo.textContent = `Round: ${data.battleState.currentRound}`;

  // Handle bye case
  if (duel.isBye) {
    battleOpponentInfo.textContent = "No opponent (bye round)";
    questionContainer.innerHTML = `<h3>You advance automatically!</h3>`;
    nextBtn.style.display = "none";
    return;
  }

  // Identify opponent
  let opponentName = "";

  if (duel.player1?.nickname === nickname) {
    opponentName = duel.player2?.nickname || "Waiting...";
  } else {
    opponentName = duel.player1?.nickname || "Waiting...";
  }

  battleOpponentInfo.textContent = `You vs ${opponentName}`;

  const question = data.quiz.questions[data.battleState.currentQuestionIndex];

  if (!question) {
    questionContainer.innerHTML = `<h3>No question found for this round.</h3>`;
    nextBtn.style.display = "none";
    return;
  }

  quizTitle.textContent = data.quiz.title || "Battle Royale Quiz";
  startTime = Date.now();
  nextBtn.style.display = "inline-block";

  if (studentCountdownTimer) {
    clearInterval(studentCountdownTimer);
    studentCountdownTimer = null;
  }

  studentCountdownStartedForRound = null;
  battleStatusText.textContent = "";

  displayBattleQuestion(question);
  lastLoadedRound = data.battleState.currentRound;
  lastLoadedQuestionInRound = data.battleState.currentQuestionInRound;
}

async function checkBattleUpdates() {
  if (!isBattleMode) return;

  try {
    const res = await fetch(`/api/sessions/${accessCode}/battle-state`);
    const data = await res.json();

    const player = data.participants.find((p) => p.nickname === nickname);

    if (!player) return;

    // 🔴 ELIMINATED
    if (player.status === "eliminated") {
      if (!resultRedirectStarted) {
        resultRedirectStarted = true;

        battleStatusText.textContent = "You were eliminated ❌ Redirecting to result page...";
        questionContainer.innerHTML = "";
        nextBtn.style.display = "none";

        if (studentCountdownTimer) {
          clearInterval(studentCountdownTimer);
          studentCountdownTimer = null;
        }

        setTimeout(() => {
          window.location.href = "result.html";
        }, 2000);
      }

      return;
    }

    // 🟢 WINNER
    if (player.status === "winner") {
      if (!resultRedirectStarted) {
        resultRedirectStarted = true;

        battleStatusText.textContent = "You won the battle royale 🏆 Redirecting to result page...";
        questionContainer.innerHTML = "";
        nextBtn.style.display = "none";

        if (studentCountdownTimer) {
          clearInterval(studentCountdownTimer);
          studentCountdownTimer = null;
        }

        setTimeout(() => {
          window.location.href = "result.html";
        }, 2000);
      }

      return;
    }

    // 🟡 ROUND RESULT (ADVANCED)
    if (data.battleState.phase === "roundResults" && player.status === "active") {
      battleStatusText.textContent = "You advanced to next round ✅";
      nextBtn.style.display = "none";
      questionContainer.innerHTML = "";

      if (studentCountdownStartedForRound !== data.battleState.currentRound) {
        studentCountdownStartedForRound = data.battleState.currentRound;

        let countdown = 5;

        if (studentCountdownTimer) {
          clearInterval(studentCountdownTimer);
        }

        studentCountdownTimer = setInterval(() => {
          battleStatusText.textContent = `You advanced to next round ✅ | Next round starts in ${countdown} seconds...`;
          countdown--;

          if (countdown < 0) {
            clearInterval(studentCountdownTimer);
            studentCountdownTimer = null;
          }
        }, 1000);
      }

      return;
    }

    // 🔵 LIVE QUESTION PHASE (OPPONENT STATUS)
    if (data.battleState.phase === "question" && player.status === "active") {
      const duel = data.battleState.duels.find(
        (d) =>
          d.player1?.nickname === nickname ||
          d.player2?.nickname === nickname
      );

      if (duel && !duel.isBye) {
        let opponentAnswered = false;

        if (duel.player1?.nickname === nickname) {
          opponentAnswered = duel.player2?.answered;
        } else {
          opponentAnswered = duel.player1?.answered;
        }

        if (opponentAnswered) {
          battleStatusText.textContent = "Opponent has answered ⚡";
        } else {
          battleStatusText.textContent = "Waiting for opponent...";
        }
      }
    }

    console.log("Battle debug:", {
  phase: data.battleState.phase,
  currentRound: data.battleState.currentRound,
  currentQuestionInRound: data.battleState.currentQuestionInRound,
  currentQuestionIndex: data.battleState.currentQuestionIndex,
  lastLoadedRound,
  lastLoadedQuestionInRound
});

    // 🧠 LOAD NEXT ROUND
   if (
  data.battleState.phase === "question" &&
  player.status === "active" &&
  (
    data.battleState.currentRound !== lastLoadedRound ||
    data.battleState.currentQuestionInRound !== lastLoadedQuestionInRound
  )
) {
  loadBattleQuestion(data);
}

  } catch (error) {
    console.error("Error checking battle updates:", error);
  }
}

async function loadClassicQuiz() {
  const data = await getSessionData(accessCode);

  if (!data) {
    alert("Session not found");
    window.location.href = "join-session.html";
    return;
  }

  const participantExists = data.participants.some((p) => p.nickname === nickname);

  if (!participantExists) {
    window.location.href = "join-session.html";
    return;
  }

  if (data.status === "ended") {
    window.location.href = "result.html";
    return;
  }

  if (data.status !== "live") {
    window.location.href = "waiting-room.html";
    return;
  }

  quizTitle.textContent = data.quizId.title;
  questions = data.quizId.questions;
  nextBtn.style.display = "inline-block";

  showQuestion();
}

function displayBattleQuestion(question) {
  selectedAnswer = null;

  questionContainer.innerHTML = `
    <h3>${question.text}</h3>
    ${question.options
      .map(
        (opt, index) => `
      <button class="option-btn" onclick="selectAnswer(${index})">
        ${opt}
      </button>
    `
      )
      .join("")}
  `;
}

// Display classic question
function showQuestion() {
  selectedAnswer = null;

  const question = questions[currentQuestionIndex];

  questionContainer.innerHTML = `
    <h3>${question.text}</h3>
    ${question.options
      .map(
        (opt, index) => `
      <button class="option-btn" onclick="selectAnswer(${index})">
        ${opt}
      </button>
    `
      )
      .join("")}
  `;
}



// Select answer
function selectAnswer(index) {
  selectedAnswer = index;

  const buttons = document.querySelectorAll(".option-btn");
  buttons.forEach((btn) => (btn.style.background = "#0078d4"));

  buttons[index].style.background = "#28a745";
}

async function submitBattleAnswer(selectedAnswer) {
  const responseTime = Date.now() - startTime;

  const response = await fetch(`/api/sessions/${accessCode}/submit-battle-answer`, {
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
    alert(data.message || "Failed to submit battle answer");
    return false;
  }

  battleStatusText.textContent = "Answer submitted. Waiting for opponent...";
  nextBtn.style.display = "none";

  const buttons = document.querySelectorAll(".option-btn");
buttons.forEach((btn) => {
  btn.disabled = true;
  btn.style.opacity = "0.6";
  btn.style.cursor = "not-allowed";
});

  return true;
}

// Submit answer + move next
nextBtn.addEventListener("click", async () => {
  if (selectedAnswer === null) {
    alert("Please select an answer");
    return;
  }

  if (isBattleMode) {
    const success = await submitBattleAnswer(selectedAnswer);
    if (success) {
      return;
    }
    return;
  }

  const question = questions[currentQuestionIndex];

  try {
    await fetch("http://localhost:5000/api/sessions/submit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        accessCode,
        nickname,
        questionId: question._id,
        selectedAnswer
      })
    });
  } catch (error) {
    console.error(error);
  }

  currentQuestionIndex++;

  if (currentQuestionIndex < questions.length) {
    showQuestion();
  } else {
    window.location.href = "result.html";
  }
});

detectGameMode();
setInterval(checkBattleUpdates, 2000);