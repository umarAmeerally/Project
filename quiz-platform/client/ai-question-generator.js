const topicInput = document.getElementById("topic");
const difficultySelect = document.getElementById("difficulty");
const numberSelect = document.getElementById("numberOfQuestions");
const lectureTextInput = document.getElementById("lectureText");
const generateBtn = document.getElementById("generateBtn");
const clearBtn = document.getElementById("clearBtn");
const messageDiv = document.getElementById("message");
const resultsDiv = document.getElementById("results");

function renderQuestions(questions) {
  if (!Array.isArray(questions) || questions.length === 0) {
    resultsDiv.innerHTML = "<p>No questions generated.</p>";
    return;
  }

  resultsDiv.innerHTML = questions
    .map((q, index) => {
      const optionsHtml = q.options
        .map((opt, optIndex) => {
          const className = optIndex === q.correctAnswer ? "correct-option" : "";
          return `<li class="${className}">${opt}</li>`;
        })
        .join("");

      return `
        <div class="generated-question">
          <h4>Question ${index + 1}</h4>
          <p><strong>${q.text}</strong></p>
          <ul>${optionsHtml}</ul>
          <p><strong>Correct answer index:</strong> ${q.correctAnswer}</p>
        </div>
      `;
    })
    .join("");
}

generateBtn.addEventListener("click", async () => {
  const lectureText = lectureTextInput.value.trim();
  const topic = topicInput.value.trim();
  const difficulty = difficultySelect.value;
  const numberOfQuestions = Number(numberSelect.value);

  if (lectureText.length < 30) {
    messageDiv.textContent = "Please paste more lecture text first.";
    messageDiv.style.color = "red";
    return;
  }

  try {
    generateBtn.disabled = true;
    generateBtn.textContent = "Generating...";
    messageDiv.textContent = "Generating questions...";
    messageDiv.style.color = "#333";

    const response = await fetch("/api/ai/generate-questions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        lectureText,
        topic,
        difficulty,
        numberOfQuestions
      })
    });

    const data = await response.json();

    if (!response.ok) {
      messageDiv.textContent = data.message || "Failed to generate questions.";
      messageDiv.style.color = "red";
      return;
    }

    renderQuestions(data.questions);
    messageDiv.textContent = "Questions generated successfully.";
    messageDiv.style.color = "green";
  } catch (error) {
    console.error("Generate question error:", error);
    messageDiv.textContent = "Server error while generating questions.";
    messageDiv.style.color = "red";
  } finally {
    generateBtn.disabled = false;
    generateBtn.textContent = "Generate Questions";
  }
});

clearBtn.addEventListener("click", () => {
  topicInput.value = "";
  lectureTextInput.value = "";
  difficultySelect.value = "medium";
  numberSelect.value = "5";
  resultsDiv.innerHTML = "<p>No generated questions yet.</p>";
  messageDiv.textContent = "";
});