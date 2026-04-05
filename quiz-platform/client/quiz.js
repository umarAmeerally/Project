const questionContainer = document.getElementById("questionContainer");
const nextBtn = document.getElementById("nextBtn");
const quizTitle = document.getElementById("quizTitle");

const accessCode = localStorage.getItem("accessCode");
const nickname = localStorage.getItem("nickname");

let questions = [];
let currentQuestionIndex = 0;
let selectedAnswer = null;

// Load session + quiz
async function loadQuiz() {
  const data = await getSessionData(accessCode);

  if (!data) {
    alert("Session not found");
    window.location.href = "join-session.html";
    return;
  }

  const participantExists = data.participants.some(p => p.nickname === nickname);

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

  showQuestion();
}

// Display question
function showQuestion() {
  selectedAnswer = null;

  const question = questions[currentQuestionIndex];

  questionContainer.innerHTML = `
    <h3>${question.text}</h3>
    ${question.options.map((opt, index) => `
      <button class="option-btn" onclick="selectAnswer(${index})">
        ${opt}
      </button>
    `).join("")}
  `;
}

// Select answer
function selectAnswer(index) {
  selectedAnswer = index;

  const buttons = document.querySelectorAll(".option-btn");
  buttons.forEach(btn => btn.style.background = "#0078d4");

  buttons[index].style.background = "#28a745";
}

// Submit answer + move next
nextBtn.addEventListener("click", async () => {
  if (selectedAnswer === null) {
    alert("Please select an answer");
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
    // quiz finished
    window.location.href = "result.html";
  }
});

loadQuiz();