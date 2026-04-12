QUIZ PLATFORM – INSTRUCTIONS FOR LECTURER

--------------------------------------------------

REQUIREMENTS

Before running the project, please ensure the following are installed:

1. Node.js (version 16 or higher recommended)
2. MongoDB installed locally
3. MongoDB Compass (IMPORTANT – must be installed and running)

MongoDB must be running before starting the application.

--------------------------------------------------

SETUP STEPS

1. Extract the project folder

2. Open a terminal inside the project folder

3. Install dependencies by running:

   npm install

--------------------------------------------------

ENVIRONMENT FILE (.env)

The project includes a pre-configured .env file.

This file contains:
- The MongoDB connection URL (for local database)
- API key(s) used for AI-based question generation (OpenAI / Groq)

No changes are required for normal execution.

--------------------------------------------------

DATABASE SETUP

The system uses a local MongoDB database called:

   quiz_platform

Before starting the application, please ensure MongoDB is running.

You can verify this using MongoDB Compass.

--------------------------------------------------

CREATE DEMO DATA

To make the system ready for demonstration, run the following commands:

1. Create lecturer account:

   npm run create-lecturer

   This will create a lecturer with:
   Email: lecturer@example.com
   Password: password123

2. Create sample quiz:

   npm run create-sample-quiz

   This will create a quiz titled:
   "Basic Algebra Quiz"

--------------------------------------------------

RUN THE APPLICATION

Start the system using:

   npm start

Then open your browser and go to:

   http://localhost:5000

--------------------------------------------------

HOW TO USE THE SYSTEM

LECTURER:

1. Log in using the provided credentials
2. Access the dashboard
3. Select the available quiz
4. Start a session
5. Share the session code with students

STUDENTS:

1. Enter the session code
2. Choose a nickname
3. Wait in the lobby
4. Participate in the game

--------------------------------------------------

GAME MODES

1. CLASSIC MODE
- All students answer all questions
- No elimination
- Scores are shown at the end

2. BATTLE ROYALE MODE
- Students are eliminated after incorrect answers
- Game continues until one player remains

3. TACTICAL DUEL MODE (MAIN FEATURE)

- Players are matched in 1 vs 1 duels
- Each player takes turns answering questions
- Correct answers give advantage (e.g., damage opponent)
- Incorrect answers give no advantage
- The duel continues until one player wins

This mode introduces strategy and is the most advanced part of the system.

--------------------------------------------------

IMPORTANT NOTES

- MongoDB must be running before starting the application
- MongoDB Compass should be installed to verify the database
- If scripts are run multiple times, duplicate data will not be created
- The system is designed to run locally on the lecturer’s machine

--------------------------------------------------

END OF INSTRUCTIONS