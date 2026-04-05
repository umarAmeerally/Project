const scoreText = document.getElementById("scoreText");
const details = document.getElementById("details");

const accessCode = localStorage.getItem("accessCode");
const nickname = localStorage.getItem("nickname");

async function loadResult() {
  const data = await getSessionData(accessCode);

  if (!data) {
    scoreText.textContent = "Session not found";
    setTimeout(() => {
      window.location.href = "join-session.html";
    }, 1500);
    return;
  }

  const participant = data.participants.find(p => p.nickname === nickname);

  if (!participant) {
    scoreText.textContent = "User not found";
    setTimeout(() => {
      window.location.href = "join-session.html";
    }, 1500);
    return;
  }

  const totalQuestions = data.quizId.questions.length;

  scoreText.textContent = `Your Score: ${participant.score} / ${totalQuestions}`;

  details.innerHTML = `
    <p>Total Questions: ${totalQuestions}</p>
    <p>Correct Answers: ${participant.score}</p>
    <p>Accuracy: ${Math.round((participant.score / totalQuestions) * 100)}%</p>
  `;
}

function goHome() {
  localStorage.removeItem("accessCode");
  localStorage.removeItem("nickname");
  window.location.href = "index.html";
}

loadResult();