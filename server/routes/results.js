import { Router } from 'express';
import db from '../db/schema.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// Get student's previous results
router.get('/student', authenticate, requireRole('student'), async (req, res) => {
  try {
    const attempts = db.findAll('quiz_attempts', a => a.student_id === req.user.id && a.status === 'completed');
    
    const enriched = attempts.map(a => {
      const quiz = db.findOne('quizzes', q => q.id === a.quiz_id);
      return {
        ...a,
        quizzes: quiz
      };
    }).sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at));

    res.json(enriched);
  } catch (err) {
    console.error('Get results error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all results for a specific quiz (teacher only)
router.get('/quiz/:quizId', authenticate, requireRole('teacher'), async (req, res) => {
  try {
    const quiz = db.findOne('quizzes', q => q.id === req.params.quizId);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found' });

    const attempts = db.findAll('quiz_attempts', a => a.quiz_id === req.params.quizId && a.status === 'completed');
    
    const enrichedResults = attempts.map(a => {
      const user = db.findOne('users', u => u.id === a.student_id);
      return {
        ...a,
        users: { full_name: user?.full_name || 'Unknown', username: user?.username, email: user?.email }
      };
    }).sort((a, b) => b.score - a.score);

    const avgScore = enrichedResults.length > 0 ? Math.round(enrichedResults.reduce((s, r) => s + r.score, 0) / enrichedResults.length) : 0;
    const highestScore = enrichedResults.length > 0 ? Math.max(...enrichedResults.map(r => r.score)) : 0;

    res.json({ 
      quiz, 
      results: enrichedResults, 
      stats: { totalAttempts: enrichedResults.length, avgScore, highestScore } 
    });
  } catch (err) {
    console.error('Get quiz results error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// All students overview (teacher)
router.get('/students', authenticate, requireRole('teacher'), async (req, res) => {
  try {
    const students = db.findAll('users', u => u.role === 'student');

    const enrichedStudents = students.map(s => {
      const attempts = db.findAll('quiz_attempts', a => a.student_id === s.id && a.status === 'completed');
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
router.get('/attempt/:id', authenticate, async (req, res) => {
  try {
    const attempt = db.findOne('quiz_attempts', a => a.id === req.params.id);
    if (!attempt) return res.status(404).json({ error: 'Attempt not found' });

    // Students can only see their own attempts
    if (req.user.role === 'student' && attempt.student_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const quiz = db.findOne('quizzes', q => q.id === attempt.quiz_id);
    const user = db.findOne('users', u => u.id === attempt.student_id);
    
    const detailedAnswers = db.findAll('answers', ans => ans.attempt_id === attempt.id)
      .map(ans => {
        const q = db.findOne('questions', que => que.id === ans.question_id);
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
        quiz_title: quiz?.title, 
        time_limit_minutes: quiz?.time_limit_minutes, 
        student_name: user?.full_name 
      },
      answers: detailedAnswers,
      percentage: Math.round((attempt.score / attempt.total_points) * 100)
    });
  } catch (err) {
    console.error('Get attempt error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
