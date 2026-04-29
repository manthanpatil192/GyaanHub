import { Router } from 'express';
import { supabase } from '../utils/supabase.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// Get student's previous results
router.get('/my', authenticate, requireRole('student'), async (req, res) => {
  try {
    const { data: attempts, error } = await supabase
      .from('quiz_attempts')
      .select(`
        *,
        quizzes(title, total_points)
      `)
      .eq('student_id', req.user.id)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false });

    if (error) throw error;
    
    const enrichedResults = attempts.map(a => ({
      ...a,
      quiz_title: a.quizzes?.title || 'Unknown',
      quiz_total_points: a.quizzes?.total_points || a.total_points
    }));

    const totalAttempts = enrichedResults.length;
    const avgScore = totalAttempts > 0 
      ? Math.round(enrichedResults.reduce((sum, r) => sum + (r.score / r.total_points * 100), 0) / totalAttempts) 
      : 0;
    const bestScore = totalAttempts > 0 
      ? Math.max(...enrichedResults.map(r => Math.round(r.score / r.total_points * 100))) 
      : 0;

    res.json({ 
      results: enrichedResults, 
      stats: { totalAttempts, avgScore, bestScore } 
    });
  } catch (err) {
    console.error('Get results error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all results for a specific quiz (teacher only)
router.get('/quiz/:quizId', authenticate, requireRole('teacher'), async (req, res) => {
  try {
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', req.params.quizId)
      .single();

    if (quizError || !quiz) return res.status(404).json({ error: 'Quiz not found' });

    const { data: attempts, error: attemptError } = await supabase
      .from('quiz_attempts')
      .select(`
        *,
        users!quiz_attempts_student_id_fkey(full_name, username, email)
      `)
      .eq('quiz_id', req.params.quizId)
      .eq('status', 'completed')
      .order('score', { ascending: false });
    
    if (attemptError) throw attemptError;

    const avgScore = attempts.length > 0 ? Math.round(attempts.reduce((s, r) => s + r.score, 0) / attempts.length) : 0;
    const highestScore = attempts.length > 0 ? Math.max(...attempts.map(r => r.score)) : 0;

    res.json({ 
      quiz, 
      results: attempts, 
      stats: { totalAttempts: attempts.length, avgScore, highestScore } 
    });
  } catch (err) {
    console.error('Get quiz results error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// All students overview (teacher)
router.get('/students', authenticate, requireRole('teacher'), async (req, res) => {
  try {
    const { data: students, error: studentError } = await supabase
      .from('users')
      .select(`
        id, full_name, username, email,
        quiz_attempts(*)
      `)
      .eq('role', 'student');

    if (studentError) throw studentError;

    const enrichedStudents = students.map(s => {
      const attempts = (s.quiz_attempts || []).filter(a => a.status === 'completed');
      const quizzesTaken = attempts.length;
      const avgPct = quizzesTaken > 0 ? attempts.reduce((sum, a) => sum + (a.score / (a.total_points || 1) * 100), 0) / quizzesTaken : 0;
      const bestPct = quizzesTaken > 0 ? Math.max(...attempts.map(a => a.score / (a.total_points || 1) * 100)) : 0;
      const lastActivity = attempts.length > 0 
        ? attempts.sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))[0]?.completed_at 
        : null;

      return {
        id: s.id, full_name: s.full_name, username: s.username, email: s.email,
        quizzes_taken: quizzesTaken,
        avg_percentage: Math.round(avgPct),
        best_percentage: Math.round(bestPct),
        last_activity: lastActivity
      };
    }).sort((a, b) => b.avg_percentage - a.avg_percentage);

    res.json(enrichedStudents);
  } catch (err) {
    console.error('Get students error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Detailed attempt review
router.get('/attempt/:id', authenticate, async (req, res) => {
  try {
    const { data: attempt, error: attemptError } = await supabase
      .from('quiz_attempts')
      .select(`
        *,
        quizzes(title, time_limit_minutes),
        users!quiz_attempts_student_id_fkey(full_name),
        answers(*, questions(*))
      `)
      .eq('id', req.params.id)
      .single();

    if (attemptError || !attempt) return res.status(404).json({ error: 'Attempt not found' });

    // Students can only see their own attempts
    if (req.user.role === 'student' && attempt.student_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const detailedAnswers = attempt.answers.map(ans => ({
      ...ans,
      ...ans.questions
    })).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

    res.json({
      attempt: { 
        ...attempt, 
        quiz_title: attempt.quizzes?.title, 
        time_limit_minutes: attempt.quizzes?.time_limit_minutes, 
        student_name: attempt.users?.full_name 
      },
      answers: detailedAnswers,
      percentage: Math.round((attempt.score / (attempt.total_points || 1)) * 100)
    });
  } catch (err) {
    console.error('Get attempt error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
