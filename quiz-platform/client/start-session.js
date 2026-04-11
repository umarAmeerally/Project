const quizSelect = document.getElementById("quizSelect");
const gameModeSelect = document.getElementById("gameMode");
const startSessionForm = document.getElementById("startSessionForm");
const messageDiv = document.getElementById("message");

function setMessage(text, type = "") {
  messageDiv.textContent = text;
  messageDiv.className = type ? `status-message ${type}` : "status-message";
}

async function loadQuizzes() {
  try {
    const response = await fetch("http://localhost:5000/api/quizzes");
    const quizzes = await response.json();

    if (!response.ok) {
      setMessage("Could not load quizzes.", "error");
      quizSelect.innerHTML = `<option value="">No quizzes available</option>`;
      return;
    }

    quizSelect.innerHTML = `<option value="">Select a quiz</option>`;

    if (!Array.isArray(quizzes) || quizzes.length === 0) {
      quizSelect.innerHTML = `<option value="">No quizzes found</option>`;
      return;
    }

    quizzes.forEach((quiz) => {
      const option = document.createElement("option");
      option.value = quiz._id;
      option.textContent = quiz.title;
      quizSelect.appendChild(option);
    });
  } catch (error) {
    console.error("Load quizzes error:", error);
    setMessage("Server error while loading quizzes.", "error");
    quizSelect.innerHTML = `<option value="">No quizzes available</option>`;
  }
}

startSessionForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const quizId = quizSelect.value;
  const gameMode = gameModeSelect.value;

  if (!quizId) {
    setMessage("Please select a quiz first.", "error");
    return;
  }

  try {
    const response = await fetch("/api/sessions/start", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ quizId, gameMode })
    });

    const data = await response.json();

    if (!response.ok) {
      setMessage(data.message || "Could not create session.", "error");
      return;
    }

    localStorage.setItem("lecturerAccessCode", data.session.accessCode);
    setMessage("Session created successfully. Redirecting to live lobby...", "success");

    setTimeout(() => {
      window.location.href = "live-lobby.html";
    }, 700);
  } catch (error) {
    console.error("Start session error:", error);
    setMessage("Server error while creating session.", "error");
  }
});

loadQuizzes();