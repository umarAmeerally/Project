const accessCode = localStorage.getItem("accessCode");
const nickname = localStorage.getItem("nickname");

const sessionText = document.getElementById("sessionText");
const nicknameText = document.getElementById("nicknameText");
const statusMessage = document.getElementById("statusMessage");

sessionText.textContent = `Session Code: ${accessCode}`;
nicknameText.textContent = `Nickname: ${nickname}`;

async function checkSessionStatus() {
  const data = await getSessionData(accessCode);

  if (!data) {
    statusMessage.textContent = "Session not found.";
    statusMessage.style.color = "red";
    setTimeout(() => {
      window.location.href = "join-session.html";
    }, 1500);
    return;
  }

  if (data.status === "live") {
    window.location.href = "quiz.html";
    return;
  }

  if (data.status === "ended") {
    window.location.href = "result.html";
    return;
  }

  statusMessage.textContent = "Waiting for lecturer...";
  statusMessage.style.color = "green";
}

checkSessionStatus();
setInterval(checkSessionStatus, 2000);