const TACTICAL_DUEL_CONFIG = {
  STARTING_HP: 100,
  MATCH_TIME_LIMIT_SECONDS: 180,

  STRIKE_DAMAGE_CORRECT: 25,
  STRIKE_DAMAGE_WRONG: 10,

  GUARD_BLOCK_CORRECT: 15,
  GUARD_BLOCK_WRONG: 5,

  FOCUS_BONUS_CORRECT: 15,
  FOCUS_BONUS_WRONG: 5,

  RECOVER_HEAL_CORRECT: 20,
  RECOVER_HEAL_WRONG: 8,

  COUNTER_REFLECT_CORRECT: 20,
  COUNTER_REFLECT_WRONG: 8
};

function shuffleArray(arr) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function getActiveParticipants(session) {
  return session.participants.filter((p) => p.status === "active");
}

function getRandomStartingPlayer(player1Nickname, player2Nickname) {
  return Math.random() < 0.5 ? player1Nickname : player2Nickname;
}

function buildQuestionOrder(questions) {
  const indexes = questions.map((_, index) => index);
  return shuffleArray(indexes);
}

function getPlayerSlotByNickname(duel, nickname) {
  if (duel.player1?.nickname === nickname) return duel.player1;
  if (duel.player2?.nickname === nickname) return duel.player2;
  return null;
}

function getOpponentSlotByNickname(duel, nickname) {
  if (duel.player1?.nickname === nickname) return duel.player2;
  if (duel.player2?.nickname === nickname) return duel.player1;
  return null;
}

function appendBattleLog(duel, message) {
  duel.battleLog.push(message);

  // keep log from growing forever
  if (duel.battleLog.length > 50) {
    duel.battleLog = duel.battleLog.slice(-50);
  }
}

function assignNextQuestion(duel, quiz) {
  if (!quiz?.questions || quiz.questions.length === 0) {
    throw new Error("Quiz has no questions for Tactical Duel");
  }

  if (!duel.questionOrder || duel.questionOrder.length === 0) {
    duel.questionOrder = buildQuestionOrder(quiz.questions);
    duel.questionCursor = 0;
  }

  if (duel.questionCursor >= duel.questionOrder.length) {
    duel.questionOrder = buildQuestionOrder(quiz.questions);
    duel.questionCursor = 0;
  }

  const questionIndex = duel.questionOrder[duel.questionCursor];
  const question = quiz.questions[questionIndex];

  duel.currentQuestionIndex = questionIndex;
  duel.currentQuestionId = question?._id ? String(question._id) : null;

  return question;
}

function consumeCurrentQuestion(duel) {
  duel.questionCursor += 1;
}

function createTacticalDuel(session, quiz) {
  const activeParticipants = getActiveParticipants(session);

  if (activeParticipants.length !== 2) {
    throw new Error("Tactical Duel MVP requires exactly 2 active participants");
  }

  if (!quiz?.questions || quiz.questions.length === 0) {
    throw new Error("Quiz has no questions");
  }

  const [p1, p2] = activeParticipants;
  const now = new Date();
  const endsAt = new Date(now.getTime() + TACTICAL_DUEL_CONFIG.MATCH_TIME_LIMIT_SECONDS * 1000);

  session.status = "live";
  session.isActive = true;

  session.tacticalDuelState.duel = {
    player1: {
      nickname: p1.nickname,
      hp: TACTICAL_DUEL_CONFIG.STARTING_HP,
      guardValue: 0,
      focusBonus: 0,
      hasCounterAvailable: true,
      hiddenCounterArmed: false,
      hiddenCounterStrength: 0,
      lastAction: null,
      totalCorrectAnswers: 0,
      totalResponseTime: 0
    },
    player2: {
      nickname: p2.nickname,
      hp: TACTICAL_DUEL_CONFIG.STARTING_HP,
      guardValue: 0,
      focusBonus: 0,
      hasCounterAvailable: true,
      hiddenCounterArmed: false,
      hiddenCounterStrength: 0,
      lastAction: null,
      totalCorrectAnswers: 0,
      totalResponseTime: 0
    },
    activeTurnPlayer: getRandomStartingPlayer(p1.nickname, p2.nickname),
    phase: "actionSelection",
    turnNumber: 1,
    selectedAction: null,
    currentQuestionIndex: null,
    currentQuestionId: null,
    questionOrder: buildQuestionOrder(quiz.questions),
    questionCursor: 0,
    startedAt: now,
    endsAt,
    timeLimitSeconds: TACTICAL_DUEL_CONFIG.MATCH_TIME_LIMIT_SECONDS,
    battleLog: ["Tactical Duel started!"],
    winner: null
  };

  appendBattleLog(
    session.tacticalDuelState.duel,
    `${session.tacticalDuelState.duel.activeTurnPlayer} will act first.`
  );

  return session.tacticalDuelState.duel;
}

function getRemainingTimeSeconds(duel) {
  if (!duel.endsAt) return 0;
  const remainingMs = new Date(duel.endsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(remainingMs / 1000));
}

function isTimedOut(duel) {
  if (!duel.endsAt) return false;
  return Date.now() >= new Date(duel.endsAt).getTime();
}

function determineWinnerByTimeout(duel) {
  const p1 = duel.player1;
  const p2 = duel.player2;

  if (p1.hp > p2.hp) return p1.nickname;
  if (p2.hp > p1.hp) return p2.nickname;

  if (p1.totalCorrectAnswers > p2.totalCorrectAnswers) return p1.nickname;
  if (p2.totalCorrectAnswers > p1.totalCorrectAnswers) return p2.nickname;

  if (p1.totalResponseTime < p2.totalResponseTime) return p1.nickname;
  if (p2.totalResponseTime < p1.totalResponseTime) return p2.nickname;

  return Math.random() < 0.5 ? p1.nickname : p2.nickname;
}

function finishDuel(session, winnerNickname, finishReason = "normal") {
  const duel = session.tacticalDuelState.duel;
  duel.phase = "finished";
  duel.winner = winnerNickname;
  session.status = "ended";
  session.isActive = false;

  const loserNickname =
    duel.player1.nickname === winnerNickname
      ? duel.player2.nickname
      : duel.player1.nickname;

  session.participants.forEach((participant) => {
    if (participant.nickname === winnerNickname) {
      participant.status = "winner";
      participant.score += 1;
    } else if (participant.nickname === loserNickname) {
      participant.status = "eliminated";
    }
  });

  if (finishReason === "timeout") {
    appendBattleLog(duel, `Time is up! ${winnerNickname} wins by tie-break.`);
  } else {
    appendBattleLog(duel, `${winnerNickname} wins the Tactical Duel!`);
  }
}

function checkImmediateWinner(session) {
  const duel = session.tacticalDuelState.duel;

  if (duel.player1.hp <= 0 && duel.player2.hp <= 0) {
    const winner = determineWinnerByTimeout(duel);
    finishDuel(session, winner, "timeout");
    return winner;
  }

  if (duel.player1.hp <= 0) {
    finishDuel(session, duel.player2.nickname, "normal");
    return duel.player2.nickname;
  }

  if (duel.player2.hp <= 0) {
    finishDuel(session, duel.player1.nickname, "normal");
    return duel.player1.nickname;
  }

  return null;
}

function checkTimeoutAndResolve(session) {
  const duel = session.tacticalDuelState.duel;

  if (!duel || duel.phase === "finished") {
    return false;
  }

  if (!isTimedOut(duel)) {
    return false;
  }

  const winner = determineWinnerByTimeout(duel);
  finishDuel(session, winner, "timeout");
  return true;
}

function selectAction(session, quiz, nickname, action) {
  const duel = session.tacticalDuelState.duel;

  if (!duel) {
    throw new Error("Tactical duel not initialized");
  }

  if (duel.phase !== "actionSelection") {
    throw new Error("It is not currently the action selection phase");
  }

  if (duel.activeTurnPlayer !== nickname) {
    throw new Error("It is not this player's turn");
  }

  const allowedActions = ["strike", "guard", "focus", "recover", "counter"];
  if (!allowedActions.includes(action)) {
    throw new Error("Invalid tactical action");
  }

  const actor = getPlayerSlotByNickname(duel, nickname);
  if (!actor) {
    throw new Error("Player not found in duel");
  }

  if (action === "counter" && !actor.hasCounterAvailable) {
    throw new Error("Counter has already been used");
  }

  const question = assignNextQuestion(duel, quiz);

  duel.selectedAction = action;
  duel.phase = "question";

  appendBattleLog(duel, `${nickname} selected an action.`);

  return question;
}

function applyStrike(actor, target, isCorrect) {
  let damage = isCorrect
    ? TACTICAL_DUEL_CONFIG.STRIKE_DAMAGE_CORRECT
    : TACTICAL_DUEL_CONFIG.STRIKE_DAMAGE_WRONG;

  let focusUsed = 0;
  let guardBlocked = 0;
  let counterReflected = 0;

  if (actor.focusBonus > 0) {
    focusUsed = actor.focusBonus;
    damage += actor.focusBonus;
    actor.focusBonus = 0;
  }

  if (target.guardValue > 0) {
    guardBlocked = target.guardValue;
    damage = Math.max(0, damage - target.guardValue);
    target.guardValue = 0;
  }

  target.hp = Math.max(0, target.hp - damage);

  if (target.hiddenCounterArmed && target.hiddenCounterStrength > 0) {
    counterReflected = target.hiddenCounterStrength;
    actor.hp = Math.max(0, actor.hp - counterReflected);
    target.hiddenCounterArmed = false;
    target.hiddenCounterStrength = 0;
  }

  return {
    type: "strike",
    damage,
    focusUsed,
    guardBlocked,
    counterReflected
  };
}

function applyGuard(actor, isCorrect) {
  const blockValue = isCorrect
    ? TACTICAL_DUEL_CONFIG.GUARD_BLOCK_CORRECT
    : TACTICAL_DUEL_CONFIG.GUARD_BLOCK_WRONG;

  actor.guardValue = blockValue;

  return {
    type: "guard",
    blockValue
  };
}

function applyFocus(actor, isCorrect) {
  const focusValue = isCorrect
    ? TACTICAL_DUEL_CONFIG.FOCUS_BONUS_CORRECT
    : TACTICAL_DUEL_CONFIG.FOCUS_BONUS_WRONG;

  actor.focusBonus = focusValue;

  return {
    type: "focus",
    focusValue
  };
}

function applyRecover(actor, isCorrect) {
  const healValue = isCorrect
    ? TACTICAL_DUEL_CONFIG.RECOVER_HEAL_CORRECT
    : TACTICAL_DUEL_CONFIG.RECOVER_HEAL_WRONG;

  actor.hp = Math.min(TACTICAL_DUEL_CONFIG.STARTING_HP, actor.hp + healValue);

  return {
    type: "recover",
    healValue
  };
}

function applyCounter(actor, isCorrect) {
  const counterStrength = isCorrect
    ? TACTICAL_DUEL_CONFIG.COUNTER_REFLECT_CORRECT
    : TACTICAL_DUEL_CONFIG.COUNTER_REFLECT_WRONG;

  actor.hiddenCounterArmed = true;
  actor.hiddenCounterStrength = counterStrength;
  actor.hasCounterAvailable = false;

  return {
    type: "counter",
    counterStrength
  };
}

function buildResolutionMessage(actor, target, action, result, isCorrect) {
  switch (action) {
    case "strike":
      return `${actor.nickname} used Strike (${isCorrect ? "correct" : "wrong"}) and dealt ${result.damage} damage.` +
        (result.focusUsed > 0 ? ` Focus bonus used: ${result.focusUsed}.` : "") +
        (result.guardBlocked > 0 ? ` Guard blocked: ${result.guardBlocked}.` : "") +
        (result.counterReflected > 0 ? ` Counter reflected ${result.counterReflected} damage back.` : "");

    case "guard":
      return `${actor.nickname} used Guard (${isCorrect ? "correct" : "wrong"}) and prepared ${result.blockValue} block.`;

    case "focus":
      return `${actor.nickname} used Focus (${isCorrect ? "correct" : "wrong"}) and stored +${result.focusValue} strike bonus.`;

    case "recover":
      return `${actor.nickname} used Recover (${isCorrect ? "correct" : "wrong"}) and restored ${result.healValue} HP.`;

    case "counter":
      return `${actor.nickname} prepared a secret tactic.`;

    default:
      return `${actor.nickname} completed a turn.`;
  }
}

function switchTurn(duel) {
  duel.activeTurnPlayer =
    duel.activeTurnPlayer === duel.player1.nickname
      ? duel.player2.nickname
      : duel.player1.nickname;

  duel.turnNumber += 1;
  duel.selectedAction = null;
  duel.currentQuestionIndex = null;
  duel.currentQuestionId = null;
  duel.phase = "actionSelection";
}

function submitAnswer(session, quiz, nickname, selectedAnswer, responseTime = 0) {
  const duel = session.tacticalDuelState.duel;

  if (!duel) {
    throw new Error("Tactical duel not initialized");
  }

  if (duel.phase !== "question") {
    throw new Error("It is not currently the question phase");
  }

  if (duel.activeTurnPlayer !== nickname) {
    throw new Error("It is not this player's turn");
  }

  const actor = getPlayerSlotByNickname(duel, nickname);
  const target = getOpponentSlotByNickname(duel, nickname);

  if (!actor || !target) {
    throw new Error("Could not resolve duel players");
  }

  const question = quiz.questions[duel.currentQuestionIndex];
  if (!question) {
    throw new Error("Current tactical duel question not found");
  }

  const hpBeforeActor = actor.hp;
  const hpBeforeTarget = target.hp;

  const isCorrect = question.correctAnswer === selectedAnswer;
  actor.totalResponseTime += responseTime ?? 0;
  if (isCorrect) {
    actor.totalCorrectAnswers += 1;
  }

  actor.lastAction = duel.selectedAction;

  let result;
  switch (duel.selectedAction) {
    case "strike":
      result = applyStrike(actor, target, isCorrect);
      break;
    case "guard":
      result = applyGuard(actor, isCorrect);
      break;
    case "focus":
      result = applyFocus(actor, isCorrect);
      break;
    case "recover":
      result = applyRecover(actor, isCorrect);
      break;
    case "counter":
      result = applyCounter(actor, isCorrect);
      break;
    default:
      throw new Error("No selected tactical action to resolve");
  }

  consumeCurrentQuestion(duel);

  duel.phase = "resolution";

  const logMessage = buildResolutionMessage(actor, target, duel.selectedAction, result, isCorrect);
  appendBattleLog(duel, logMessage);

  const winner = checkImmediateWinner(session);

  const turnSummary = {
    action: duel.selectedAction,
    isCorrect,
    responseTime,
    hpBeforeActor,
    hpAfterActor: actor.hp,
    hpBeforeTarget,
    hpAfterTarget: target.hp,
    result,
    winner: winner || null
  };

  if (!winner) {
    switchTurn(duel);
  }

  return turnSummary;
}

module.exports = {
  TACTICAL_DUEL_CONFIG,
  createTacticalDuel,
  getRemainingTimeSeconds,
  checkTimeoutAndResolve,
  selectAction,
  submitAnswer,
  getPlayerSlotByNickname,
  getOpponentSlotByNickname
};