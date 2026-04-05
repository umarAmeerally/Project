function requireLecturerLogin() {
  const isLoggedIn = localStorage.getItem("lecturerLoggedIn");
  if (isLoggedIn !== "true") {
    window.location.href = "lecturer-login.html";
  }
}

function requireStudentSession() {
  const accessCode = localStorage.getItem("accessCode");
  const nickname = localStorage.getItem("nickname");

  if (!accessCode || !nickname) {
    window.location.href = "join-session.html";
  }
}

async function getSessionData(accessCode) {
  try {
    const response = await fetch(`/api/sessions/${accessCode}`);
    const data = await response.json();

    if (!response.ok) {
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error fetching session:", error);
    return null;
  }
}