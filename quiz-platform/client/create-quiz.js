const questionsContainer = document.getElementById("questionsContainer");
const addQuestionBtn = document.getElementById("addQuestionBtn");
const quizForm = document.getElementById("quizForm");
const messageDiv = document.getElementById("message");

const topicInput = document.getElementById("topic");
const difficultySelect = document.getElementById("difficulty");
const numberSelect = document.getElementById("numberOfQuestions");
const lectureTextInput = document.getElementById("lectureText");
const generateBtn = document.getElementById("generateBtn");
const clearAiBtn = document.getElementById("clearAiBtn");
const aiMessageDiv = document.getElementById("aiMessage");
const generatedResultsDiv = document.getElementById("generatedResults");
const appendGeneratedBtn = document.getElementById("appendGeneratedBtn");
const replaceGeneratedBtn = document.getElementById("replaceGeneratedBtn");
const clearGeneratedBtn = document.getElementById("clearGeneratedBtn");

let questionCount = 0;
let generatedQuestions = [];

function setMessage(target, text, type = "") {
  target.textContent = text;
  target.className = type ? `status-message ${type}` : "status-message";
}

function updateQuestionNumbers() {
  const headings = questionsContainer.querySelectorAll(".question-block h3");
  headings.forEach((heading, index) => {
    heading.textContent = `Question ${index + 1}`;
  });
  questionCount = headings.length;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function createQuestionBlock(questionData = {}) {
  questionCount += 1;

  const block = document.createElement("div");
  block.className = "question-block";

  const safeOptions = Array.isArray(questionData.options) ? questionData.options : [];
  const correctAnswer = Number.isInteger(questionData.correctAnswer)
    ? questionData.correctAnswer
    : "";

  block.innerHTML = `
    <div class="question-block-top">
      <h3>Question ${questionCount}</h3>
      <button type="button" class="danger-btn remove-question-btn">Remove</button>
    </div>

    <div class="form-row">
      <label>Question Text</label>
      <input
        type="text"
        class="question-text"
        placeholder="Enter question text"
        required
        value="${questionData.text ? escapeHtml(questionData.text) : ""}"
      />
    </div>

    <div class="form-row">
      <label>Option 1</label>
      <input
        type="text"
        class="option"
        placeholder="Option 1"
        required
        value="${safeOptions[0] ? escapeHtml(safeOptions[0]) : ""}"
      />
    </div>

    <div class="form-row">
      <label>Option 2</label>
      <input
        type="text"
        class="option"
        placeholder="Option 2"
        required
        value="${safeOptions[1] ? escapeHtml(safeOptions[1]) : ""}"
      />
    </div>

    <div class="form-row">
      <label>Option 3</label>
      <input
        type="text"
        class="option"
        placeholder="Option 3"
        required
        value="${safeOptions[2] ? escapeHtml(safeOptions[2]) : ""}"
      />
    </div>

    <div class="form-row">
      <label>Option 4</label>
      <input
        type="text"
        class="option"
        placeholder="Option 4"
        required
        value="${safeOptions[3] ? escapeHtml(safeOptions[3]) : ""}"
      />
    </div>

    <div class="form-row">
      <label>Correct Answer Index (0-3)</label>
      <input
        type="number"
        class="correct-answer"
        min="0"
        max="3"
        required
        value="${correctAnswer}"
      />
    </div>
  `;

  const removeBtn = block.querySelector(".remove-question-btn");
  removeBtn.addEventListener("click", () => {
    block.remove();

    if (!questionsContainer.querySelector(".question-block")) {
      questionCount = 0;
      createQuestionBlock();
    } else {
      updateQuestionNumbers();
    }
  });

  questionsContainer.appendChild(block);
  updateQuestionNumbers();
}

function setGeneratedActionButtonsDisabled(disabled) {
  appendGeneratedBtn.disabled = disabled;
  replaceGeneratedBtn.disabled = disabled;
  clearGeneratedBtn.disabled = disabled;
}

function renderGeneratedQuestions() {
  if (!Array.isArray(generatedQuestions) || generatedQuestions.length === 0) {
    generatedResultsDiv.innerHTML = `<p class="helper-text">No generated questions yet.</p>`;
    setGeneratedActionButtonsDisabled(true);
    return;
  }

  generatedResultsDiv.innerHTML = generatedQuestions
    .map((q, index) => {
      const optionsHtml = q.options
        .map((opt, optIndex) => {
          const optionClass = optIndex === q.correctAnswer ? "correct-option" : "";
          return `<li class="${optionClass}">${escapeHtml(opt)}</li>`;
        })
        .join("");

      return `
        <article class="generated-question">
          <h4>Generated Question ${index + 1}</h4>
          <p><strong>${escapeHtml(q.text)}</strong></p>
          <ul>${optionsHtml}</ul>
          <p class="question-meta"><strong>Correct answer index:</strong> ${q.correctAnswer}</p>
        </article>
      `;
    })
    .join("");

  setGeneratedActionButtonsDisabled(false);
}

function clearGeneratedPreview() {
  generatedQuestions = [];
  renderGeneratedQuestions();
}

function insertGeneratedQuestions(mode = "append") {
  if (!generatedQuestions.length) {
    setMessage(aiMessageDiv, "Generate questions first.", "error");
    return;
  }

  if (mode === "replace") {
    questionsContainer.innerHTML = "";
    questionCount = 0;
  }

  generatedQuestions.forEach((question) => {
    createQuestionBlock(question);
  });

  setMessage(
    aiMessageDiv,
    mode === "replace"
      ? "Generated questions replaced the quiz form."
      : "Generated questions were added to the quiz form.",
    "success"
  );
}

async function generateQuestionsWithAi() {
  const lectureText = lectureTextInput.value.trim();
  const topic = topicInput.value.trim();
  const difficulty = difficultySelect.value;
  const numberOfQuestions = Number(numberSelect.value);

  if (lectureText.length < 30) {
    setMessage(aiMessageDiv, "Please paste more lecture text first.", "error");
    return;
  }

  try {
    generateBtn.disabled = true;
    generateBtn.textContent = "Generating...";
    setMessage(aiMessageDiv, "Generating questions...", "");

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
      setMessage(aiMessageDiv, data.message || "Failed to generate questions.", "error");
      return;
    }

    generatedQuestions = Array.isArray(data.questions) ? data.questions : [];
    renderGeneratedQuestions();
    setMessage(aiMessageDiv, "Questions generated successfully. Review them before inserting.", "success");
  } catch (error) {
    console.error("Generate question error:", error);
    setMessage(aiMessageDiv, "Server error while generating questions.", "error");
  } finally {
    generateBtn.disabled = false;
    generateBtn.textContent = "Generate Questions";
  }
}

addQuestionBtn.addEventListener("click", () => createQuestionBlock());

generateBtn.addEventListener("click", generateQuestionsWithAi);

clearAiBtn.addEventListener("click", () => {
  topicInput.value = "";
  lectureTextInput.value = "";
  difficultySelect.value = "medium";
  numberSelect.value = "5";
  setMessage(aiMessageDiv, "", "");
});

appendGeneratedBtn.addEventListener("click", () => {
  insertGeneratedQuestions("append");
});

replaceGeneratedBtn.addEventListener("click", () => {
  insertGeneratedQuestions("replace");
});

clearGeneratedBtn.addEventListener("click", () => {
  clearGeneratedPreview();
  setMessage(aiMessageDiv, "Generated preview cleared.", "");
});

createQuestionBlock();
renderGeneratedQuestions();

quizForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const title = document.getElementById("title").value.trim();
  const questionBlocks = document.querySelectorAll(".question-block");

  const questions = [];

  for (const block of questionBlocks) {
    const text = block.querySelector(".question-text").value.trim();
    const options = Array.from(block.querySelectorAll(".option")).map((input) => input.value.trim());
    const correctAnswer = parseInt(block.querySelector(".correct-answer").value, 10);

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

    if (!response.ok) {
      setMessage(messageDiv, data.error || "Failed to create quiz.", "error");
      return;
    }

    setMessage(messageDiv, "Quiz created successfully!", "success");
    quizForm.reset();
    questionsContainer.innerHTML = "";
    questionCount = 0;
    createQuestionBlock();
    clearGeneratedPreview();
    setMessage(aiMessageDiv, "", "");
  } catch (error) {
    console.error("Create quiz error:", error);
    setMessage(messageDiv, "Server error. Could not create quiz.", "error");
  }
});