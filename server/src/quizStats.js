/** Test natijalari statistikasi (admin va muallif uchun umumiy). Admin urinishlari hisobga olinmaydi. */
export const pct = (a) => (a.total ? Math.round((a.score / a.total) * 100) : 0);

export function quizStats(quiz, attempts) {
  const right = quiz.questions.map(() => 0);
  for (const a of attempts) quiz.questions.forEach((q, i) => { if (a.answers?.[i] === q.correct) right[i] += 1; });
  const students = new Set(attempts.map((a) => String(a.student?._id || a.student)));
  return {
    saved: attempts.length,
    students: students.size,
    avgPct: attempts.length ? Math.round(attempts.reduce((s, a) => s + pct(a), 0) / attempts.length) : null,
    questions: quiz.questions.map((q, i) => ({ text: q.text, rightPct: attempts.length ? Math.round((right[i] / attempts.length) * 100) : null })),
  };
}
