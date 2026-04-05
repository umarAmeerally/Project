const quizSelect = document.getElementById("quizSelect");
const startSessionBtn = document.getElementById("startSessionBtn");
const sessionInfo = document.getElementById("sessionInfo");

async function loadQuizzes() {
  try {
    const response = await fetch("/api/quizzes");
    const quizzes = await response.json();

    quizSelect.innerHTML = "";

    quizzes.forEach(quiz => {
      const option = document.createElement("option");
      option.value = quiz._id;
      option.textContent = quiz.title;
      quizSelect.appendChild(option);
    });
  } catch (error) {
    console.error("Failed to load quizzes:", error);
  }
}

startSessionBtn.addEventListener("click", async () => {
  const quizId = quizSelect.value;

  try {
    const response = await fetch("/api/sessions/start", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ quizId })
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem("lecturerAccessCode", data.accessCode);

      sessionInfo.innerHTML = `
        <p><strong>Session started successfully!</strong></p>
        <p>Access Code: <strong>${data.accessCode}</strong></p>
        <button onclick="goToLobby()">Go to Live Lobby</button>
      `;
    } else {
      sessionInfo.textContent = data.message || "Failed to start session.";
    }
  } catch (error) {
    console.error("Error starting session:", error);
  }
});

function goToLobby() {
  window.location.href = "live-lobby.html";
}

loadQuizzes();