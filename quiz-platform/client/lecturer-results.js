const accessCode = localStorage.getItem("lecturerAccessCode");

const sessionCodeText = document.getElementById("sessionCodeText");
const summaryText = document.getElementById("summaryText");
const resultsList = document.getElementById("resultsList");

const totalParticipantsValue = document.getElementById("totalParticipantsValue");
const averageScoreValue = document.getElementById("averageScoreValue");
const highestScoreValue = document.getElementById("highestScoreValue");
const lowestScoreValue = document.getElementById("lowestScoreValue");

const backToDashboardBtn = document.getElementById("backToDashboardBtn");

async function loadResults() {
  try {
    const response = await fetch(`/api/sessions/${accessCode}`);
    const data = await response.json();

    if (!response.ok) {
      summaryText.textContent = "Session not found.";
      summaryText.className = "status-message error";
      return;
    }

    sessionCodeText.textContent = `Session Code: ${accessCode}`;

    const participants = data.participants || [];
    const scores = participants.map((p) => Number(p.score) || 0);

    const totalParticipants = participants.length;
    const averageScore =
      totalParticipants > 0
        ? (scores.reduce((sum, score) => sum + score, 0) / totalParticipants).toFixed(2)
        : "0";
    const highestScore = totalParticipants > 0 ? Math.max(...scores) : 0;
    const lowestScore = totalParticipants > 0 ? Math.min(...scores) : 0;

    totalParticipantsValue.textContent = totalParticipants;
    averageScoreValue.textContent = averageScore;
    highestScoreValue.textContent = highestScore;
    lowestScoreValue.textContent = lowestScore;

    summaryText.textContent = totalParticipants
      ? "Final session statistics loaded successfully."
      : "No participant data is available for this session.";
    summaryText.className = totalParticipants
      ? "status-message success"
      : "status-message";

    resultsList.innerHTML = "";

    if (!participants.length) {
      const emptyState = document.createElement("div");
      emptyState.className = "result-item";
      emptyState.textContent = "No participant scores available.";
      resultsList.appendChild(emptyState);
      return;
    }

    participants
      .sort((a, b) => (Number(b.score) || 0) - (Number(a.score) || 0))
      .forEach((participant, index) => {
        const item = document.createElement("article");
        item.className = "result-item";

        const rank = document.createElement("div");
        rank.className = "result-rank";
        rank.textContent = `#${index + 1}`;

        const name = document.createElement("div");
        name.className = "result-name";
        name.textContent = participant.nickname;

        const score = document.createElement("div");
        score.className = "result-score";
        score.textContent = `Score: ${participant.score}`;

        item.appendChild(rank);
        item.appendChild(name);
        item.appendChild(score);

        resultsList.appendChild(item);
      });
  } catch (error) {
    console.error("Load results error:", error);
    summaryText.textContent = "Error loading results.";
    summaryText.className = "status-message error";
  }
}

function goBackToDashboard() {
  window.location.href = "lecturer-dashboard.html";
}

backToDashboardBtn.addEventListener("click", goBackToDashboard);

loadResults();