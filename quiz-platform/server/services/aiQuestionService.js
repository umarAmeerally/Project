let OpenAI = require("openai");
OpenAI = OpenAI.default || OpenAI;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

function buildQuestionSchema() {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      questions: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            text: { type: "string" },
            options: {
              type: "array",
              items: { type: "string" },
              minItems: 4,
              maxItems: 4
            },
            correctAnswer: { type: "integer" }
          },
          required: ["text", "options", "correctAnswer"]
        }
      }
    },
    required: ["questions"]
  };
}

function validateGeneratedQuestions(questions) {
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error("AI did not return any questions");
  }

  return questions.map((q, index) => {
    if (
      !q ||
      typeof q.text !== "string" ||
      !Array.isArray(q.options) ||
      q.options.length !== 4 ||
      typeof q.correctAnswer !== "number"
    ) {
      throw new Error(`Invalid structure for generated question ${index + 1}`);
    }

    if (q.correctAnswer < 0 || q.correctAnswer > 3) {
      throw new Error(`Invalid correct answer index for question ${index + 1}`);
    }

    return {
      text: q.text.trim(),
      options: q.options.map((opt) => String(opt).trim()),
      correctAnswer: q.correctAnswer
    };
  });
}

async function generateQuestionsFromText({
  lectureText,
  numberOfQuestions = 5,
  difficulty = "medium",
  topic = ""
}) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY in environment");
  }

  if (!lectureText || lectureText.trim().length < 30) {
    throw new Error("Lecture text is too short to generate useful questions");
  }

  const safeQuestionCount = Math.min(Math.max(Number(numberOfQuestions) || 5, 1), 5);

  const prompt = `
You are generating multiple-choice quiz questions for a university lecturer.

Task:
Generate exactly ${safeQuestionCount} multiple-choice questions from the provided lecture content.

Rules:
- Each question must have exactly 4 options.
- Only one option must be correct.
- "correctAnswer" must be the zero-based index of the correct option.
- Questions should be clear, academically useful, and based only on the provided content.
- Avoid trick questions.
- Keep difficulty at: ${difficulty}.
- Topic context: ${topic || "General lecture content"}.
- Output must match the JSON schema exactly.

Lecture content:
${lectureText}
  `.trim();

  const response = await openai.responses.create({
    model: "gpt-4o-mini",
    input: prompt,
    text: {
      format: {
        type: "json_schema",
        name: "quiz_questions",
        strict: true,
        schema: buildQuestionSchema()
      }
    }
  });

  if (!response.output_text) {
    throw new Error("OpenAI returned an empty response");
  }

  let parsed;
  try {
    parsed = JSON.parse(response.output_text);
  } catch (error) {
    throw new Error("Failed to parse AI response as JSON");
  }

  return validateGeneratedQuestions(parsed.questions);
}

module.exports = {
  generateQuestionsFromText
};