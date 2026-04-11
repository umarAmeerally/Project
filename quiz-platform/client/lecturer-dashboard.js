const quizCountValue = document.getElementById("quizCountValue");
const dashboardMessage = document.getElementById("dashboardMessage");

const goToCreateQuizBtn = document.getElementById("goToCreateQuizBtn");
const goToStartSessionBtn = document.getElementById("goToStartSessionBtn");
const goToResultsBtn = document.getElementById("goToResultsBtn");
const logoutBtn = document.getElementById("logoutBtn");

function setMessage(text, type = "") {
  dashboardMessage.textContent = text;
  dashboardMessage.className = type
    ? `status-message ${type}`
    : "status-message";
}

async function loadDashboardStats() {
  try {
    const response = await fetch("http://localhost:5000/api/quizzes");
    const quizzes = await response.json();

    if (!response.ok) {
      quizCountValue.textContent = "--";
      setMessage("Could not load dashboard quiz statistics.", "error");
      return;
    }

    const quizCount = Array.isArray(quizzes) ? quizzes.length : 0;
    quizCountValue.textContent = quizCount;
    setMessage("Dashboard loaded successfully.", "success");
  } catch (error) {
    console.error("Dashboard stats error:", error);
    quizCountValue.textContent = "--";
    setMessage("Server error while loading dashboard data.", "error");
  }
}

goToCreateQuizBtn.addEventListener("click", () => {
  window.location.href = "create-quiz.html";
});

goToStartSessionBtn.addEventListener("click", () => {
  window.location.href = "start-session.html";
});

goToResultsBtn.addEventListener("click", () => {
  const lecturerAccessCode = localStorage.getItem("lecturerAccessCode");

  if (!lecturerAccessCode) {
    setMessage("No recent session code found. Start or complete a session first.", "warning");
    return;
  }

  window.location.href = "lecturer-results.html";
});

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("lecturerAccessCode");
  window.location.href = "lecturer-login.html";
});

loadDashboardStats();