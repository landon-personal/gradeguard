export function sortLeaderboard(results = []) {
  return [...results].sort((a, b) => {
    if ((b.score_pct || 0) !== (a.score_pct || 0)) {
      return (b.score_pct || 0) - (a.score_pct || 0);
    }

    if ((b.correct_count || 0) !== (a.correct_count || 0)) {
      return (b.correct_count || 0) - (a.correct_count || 0);
    }

    const aTime = a.created_date ? new Date(a.created_date).getTime() : Number.MAX_SAFE_INTEGER;
    const bTime = b.created_date ? new Date(b.created_date).getTime() : Number.MAX_SAFE_INTEGER;
    return aTime - bTime;
  });
}

export function buildLeaderboardEntries(results = [], memberEmails = [], memberNames = []) {
  const sortedResults = sortLeaderboard(results);
  const finishedEmails = new Set(sortedResults.map((result) => result.user_email));

  const pendingEntries = memberEmails
    .filter((email) => !finishedEmails.has(email))
    .map((email, index) => ({
      user_email: email,
      user_name: memberNames[memberEmails.indexOf(email)] || email.split("@")[0],
      status: "in_progress",
      rank: sortedResults.length + index + 1,
    }));

  return [
    ...sortedResults.map((result, index) => ({
      ...result,
      status: "finished",
      rank: index + 1,
    })),
    ...pendingEntries,
  ];
}