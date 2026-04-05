const accessCode = localStorage.getItem("lecturerAccessCode");

const sessionCodeText = document.getElementById("sessionCodeText");
const summaryText = document.getElementById("summaryText");
const resultsList = document.getElementById("resultsList");

async function loadResults() {
  try {
    const response = await fetch(`/api/sessions/${accessCode}`);
    const data = await response.json();

    if (!response.ok) {
      summaryText.textContent = "Session not found.";
      return;
    }

    sessionCodeText.textContent = `Session Code: ${accessCode}`;

    const participants = data.participants || [];
    const scores = participants.map(p => p.score);

    const totalParticipants = participants.length;
    const averageScore =
      totalParticipants > 0
        ? (scores.reduce((sum, s) => sum + s, 0) / totalParticipants).toFixed(2)
        : 0;

    const highestScore = totalParticipants > 0 ? Math.max(...scores) : 0;
    const lowestScore = totalParticipants > 0 ? Math.min(...scores) : 0;

    summaryText.innerHTML = `
      <p>Total Participants: <strong>${totalParticipants}</strong></p>
      <p>Average Score: <strong>${averageScore}</strong></p>
      <p>Highest Score: <strong>${highestScore}</strong></p>
      <p>Lowest Score: <strong>${lowestScore}</strong></p>
    `;

    resultsList.innerHTML = "";

    participants
      .sort((a, b) => b.score - a.score)
      .forEach((participant, index) => {
        const li = document.createElement("li");
        li.textContent = `${index + 1}. ${participant.nickname} - ${participant.score}`;
        resultsList.appendChild(li);
      });
  } catch (error) {
    console.error(error);
    summaryText.textContent = "Error loading results.";
  }
}

function goBackToDashboard() {
  window.location.href = "lecturer-dashboard.html";
}

loadResults();