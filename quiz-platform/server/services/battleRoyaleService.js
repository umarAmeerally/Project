function shufflePlayers(players) {
  const arr = [...players];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function getActivePlayers(session) {
  return session.participants.filter((p) => p.status === "active");
}

function generateDuels(activePlayers) {
  const shuffled = shufflePlayers(activePlayers);
  const duels = [];
  const byePlayers = [];

  for (let i = 0; i < shuffled.length; i += 2) {
    const player1 = shuffled[i];
    const player2 = shuffled[i + 1];

    if (!player2) {
      byePlayers.push(player1.nickname);
      duels.push({
  duelId: `duel_${Date.now()}_${i}`,
  player1: {
    nickname: player1.nickname,
    answered: true,
    selectedAnswer: null,
    isCorrect: false,
    responseTime: 0
  },
  player2: null,
  winner: player1.nickname,
  loser: null,
  isBye: true,
  status: "completed",

  // ✅ ADD THESE (same as normal duel)
  questionCount: 0,
  maxQuestions: 2,
  player1Score: 0,
  player2Score: 0
});
      continue;
    }

    duels.push({
  duelId: `duel_${Date.now()}_${i}`,
  player1: {
    nickname: player1.nickname,
    answered: false,
    selectedAnswer: null,
    isCorrect: false,
    responseTime: null
  },
  player2: {
    nickname: player2.nickname,
    answered: false,
    selectedAnswer: null,
    isCorrect: false,
    responseTime: null
  },
  winner: null,
  loser: null,
  isBye: false,
  status: "pending",

  
  questionCount: 0,
  maxQuestions: 2,
  player1Score: 0,
  player2Score: 0
});
  }

  return { duels, byePlayers };
}

function resolveDuel(player1, player2) {
  if (player1.isCorrect && !player2.isCorrect) {
    return { winner: player1.nickname, loser: player2.nickname };
  }

  if (!player1.isCorrect && player2.isCorrect) {
    return { winner: player2.nickname, loser: player1.nickname };
  }

  const time1 = player1.responseTime ?? Number.MAX_SAFE_INTEGER;
  const time2 = player2.responseTime ?? Number.MAX_SAFE_INTEGER;

  if (time1 < time2) {
    return { winner: player1.nickname, loser: player2.nickname };
  }

  if (time2 < time1) {
    return { winner: player2.nickname, loser: player1.nickname };
  }

  return Math.random() < 0.5
    ? { winner: player1.nickname, loser: player2.nickname }
    : { winner: player2.nickname, loser: player1.nickname };
}

function findDuelByNickname(duels, nickname) {
  return duels.find(
    (duel) =>
      duel.player1?.nickname === nickname || duel.player2?.nickname === nickname
  );
}

function areAllNonByeDuelsAnsweredForCurrentQuestion(duels) {
  return duels
    .filter((duel) => !duel.isBye)
    .every(
      (duel) =>
        duel.player1?.answered === true &&
        duel.player2?.answered === true
    );
}

function areAllNonByeDuelsCompleted(duels) {
  return duels
    .filter((duel) => !duel.isBye)
    .every((duel) => duel.status === "completed");
}

function applyRoundResults(session) {
  const winners = [];
  const eliminated = [];

  session.battleState.duels.forEach((duel) => {
    if (duel.winner) winners.push(duel.winner);
    if (duel.loser) eliminated.push(duel.loser);
  });

  session.participants.forEach((participant) => {
    if (winners.includes(participant.nickname)) {
      participant.status = "active";
      participant.streak += 1;
    }

    if (eliminated.includes(participant.nickname)) {
      participant.status = "eliminated";
      participant.streak = 0;
    }
  });

  session.battleState.roundWinners = winners;
  session.battleState.eliminatedPlayers.push(...eliminated);

  const activePlayers = session.participants.filter((p) => p.status === "active");

  if (activePlayers.length === 1) {
    activePlayers[0].status = "winner";
    session.status = "ended";
    session.isActive = false;
    session.battleState.phase = "finished";
    session.battleState.winner = activePlayers[0].nickname;
  } else {
    session.battleState.phase = "roundResults";
  }
}

module.exports = {
  shufflePlayers,
  getActivePlayers,
  generateDuels,
  resolveDuel,
  findDuelByNickname,
  areAllNonByeDuelsCompleted,
  applyRoundResults,
  areAllNonByeDuelsAnsweredForCurrentQuestion,
};