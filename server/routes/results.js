import { Router } from 'express';
import { supabase } from '../utils/supabase.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// Student's own results
router.get('/my', authenticate, requireRole('student'), async (req, res) => {
  try {
    const { data: attempts, error } = await supabase
      .from('quiz_attempts')
      .select(`
        *,
        quizzes (title, time_limit_minutes, total_points)
      `)
      .eq('student_id', req.user.id)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false });

    if (error) throw error;

    const results = attempts.map(a => ({
      ...a,
      quiz_title: a.quizzes?.title || 'Unknown',
      time_limit_minutes: a.quizzes?.time_limit_minutes,
      quiz_total_points: a.quizzes?.total_points
    }));

    const totalAttempts = results.length;
    const avgScore = totalAttempts > 0 
      ? Math.round(results.reduce((sum, r) => sum + (r.score / r.total_points * 100), 0) / totalAttempts) 
      : 0;
    const bestScore = totalAttempts > 0 
      ? Math.max(...results.map(r => Math.round(r.score / r.total_points * 100))) 
      : 0;

    res.json({ results, stats: { totalAttempts, avgScore, bestScore } });
  } catch (err) {
    console.error('Get my results error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Results for a specific quiz (teacher)
router.get('/quiz/:quizId', authenticate, requireRole('teacher'), async (req, res) => {
  try {
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('*')
      .eq('id', req.params.quizId)
      .single();

    if (quizError || !quiz) return res.status(404).json({ error: 'Quiz not found' });

    const { data: attempts, error: attemptsError } = await supabase
      .from('quiz_attempts')
      .select(`
        *,
        users (full_name, username, email)
      `)
      .eq('quiz_id', req.params.quizId)
      .eq('status', 'completed')
      .order('score', { ascending: false });

    if (attemptsError) throw attemptsError;

    const results = attempts.map(a => ({
      ...a,
      student_name: a.users?.full_name,
      student_username: a.users?.username,
      student_email: a.users?.email
    }));

    const avgScore = results.length > 0 ? Math.round(results.reduce((s, r) => s + r.score, 0) / results.length) : 0;
    const highestScore = results.length > 0 ? Math.max(...results.map(r => r.score)) : 0;
    const lowestScore = results.length > 0 ? Math.min(...results.map(r => r.score)) : 0;

    res.json({ quiz, results, stats: { totalAttempts: results.length, avgScore, highestScore, lowestScore } });
  } catch (err) {
    console.error('Get quiz results error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// All students overview (teacher)
router.get('/students', authenticate, requireRole('teacher'), async (req, res) => {
  try {
    // This is more complex in SQL. We can fetch students and then aggregates, 
    // or use a view/RPC. For now, we'll fetch students and then perform a join/group in JS
    // OR we can use Supabase's powerful query to get attempts count per student
    
    const { data: students, error } = await supabase
      .from('users')
      .select(`
        id, full_name, username, email,
        quiz_attempts (score, total_points, status, completed_at)
      `)
      .eq('role', 'student');

    if (error) throw error;

    const enrichedStudents = students.map(s => {
      const attempts = (s.quiz_attempts || []).filter(a => a.status === 'completed');
      const quizzesTaken = attempts.length;
      const avgPct = quizzesTaken > 0 ? attempts.reduce((sum, a) => sum + (a.score / a.total_points * 100), 0) / quizzesTaken : 0;
      const bestPct = quizzesTaken > 0 ? Math.max(...attempts.map(a => a.score / a.total_points * 100)) : 0;
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
router.get('/attempt/:attemptId', authenticate, async (req, res) => {
  try {
    const { data: attempt, error } = await supabase
      .from('quiz_attempts')
      .select(`
        *,
        quizzes (title, time_limit_minutes),
        users (full_name),
        answers (
          *,
          questions (*)
        )
      `)
      .eq('id', req.params.attemptId)
      .single();

    if (error || !attempt) return res.status(404).json({ error: 'Attempt not found' });

    // Students can only see their own attempts
    if (req.user.role === 'student' && attempt.student_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const answers = (attempt.answers || []).map(ans => {
      const q = ans.questions;
      return { 
        ...ans, 
        question_text: q?.question_text, 
        option_a: q?.option_a, 
        option_b: q?.option_b, 
        option_c: q?.option_c, 
        option_d: q?.option_d, 
        correct_option: q?.correct_option, 
        explanation: q?.explanation, 
        points: q?.points, 
        sort_order: q?.sort_order 
      };
    }).sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

    res.json({
      attempt: { 
        ...attempt, 
        quiz_title: attempt.quizzes?.title, 
        time_limit_minutes: attempt.quizzes?.time_limit_minutes, 
        student_name: attempt.users?.full_name 
      },
      answers,
      percentage: Math.round((attempt.score / attempt.total_points) * 100)
    });
  } catch (err) {
    console.error('Get attempt error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
