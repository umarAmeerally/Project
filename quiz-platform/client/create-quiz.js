const questionsContainer = document.getElementById("questionsContainer");
const addQuestionBtn = document.getElementById("addQuestionBtn");
const quizForm = document.getElementById("quizForm");
const messageDiv = document.getElementById("message");

let questionCount = 0;

function createQuestionBlock() {
  questionCount++;

  const block = document.createElement("div");
  block.classList.add("question-block");
  block.innerHTML = `
    <h3>Question ${questionCount}</h3>
    <label>Question Text</label>
    <input type="text" class="question-text" placeholder="Enter question text" required />

    <label>Option 1</label>
    <input type="text" class="option" placeholder="Option 1" required />

    <label>Option 2</label>
    <input type="text" class="option" placeholder="Option 2" required />

    <label>Option 3</label>
    <input type="text" class="option" placeholder="Option 3" required />

    <label>Option 4</label>
    <input type="text" class="option" placeholder="Option 4" required />

    <label>Correct Answer Index (0-3)</label>
    <input type="number" class="correct-answer" min="0" max="3" required />
  `;

  questionsContainer.appendChild(block);
}

addQuestionBtn.addEventListener("click", createQuestionBlock);

// Add one question block by default
createQuestionBlock();

quizForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = document.getElementById("title").value;
  const questionBlocks = document.querySelectorAll(".question-block");

  const questions = [];

  for (const block of questionBlocks) {
    const text = block.querySelector(".question-text").value;
    const options = Array.from(block.querySelectorAll(".option")).map(input => input.value);
    const correctAnswer = parseInt(block.querySelector(".correct-answer").value);

    questions.push({
      text,
      options,
      correctAnswer
    });
  }

  const quizData = {
    title,
    questions
  };

  try {
    const response = await fetch("http://localhost:5000/api/quizzes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(quizData)
    });

    const data = await response.json();

    if (response.ok) {
      messageDiv.textContent = "Quiz created successfully!";
      messageDiv.style.color = "green";
      quizForm.reset();
      questionsContainer.innerHTML = "";
      questionCount = 0;
      createQuestionBlock();
      console.log("Created quiz:", data);
    } else {
      messageDiv.textContent = data.error || "Failed to create quiz.";
      messageDiv.style.color = "red";
    }
  } catch (error) {
    messageDiv.textContent = "Server error. Could not create quiz.";
    messageDiv.style.color = "red";
    console.error(error);
  }
});