import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import db from '../db/schema.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// Get all quizzes
router.get('/', authenticate, async (req, res) => {
  try {
    const quizzes = db.findAll('quizzes');
    
    const enriched = quizzes.map(q => {
      const user = db.findOne('users', u => u.id === q.created_by);
      const mod = db.findOne('modules', m => m.id === q.module_id);
      const questionCount = db.count('questions', ques => ques.quiz_id === q.id);

      const base = {
        ...q,
        creator_name: user?.full_name || 'Unknown',
        module_title: mod?.title || null,
        question_count: questionCount
      };

      if (req.user.role === 'teacher') {
        const attempts = db.findAll('quiz_attempts', a => a.quiz_id === q.id);
        base.attempt_count = attempts.length;
      } else {
        // Student only sees active quizzes
        if (!q.is_active) return null;
      }

      return base;
    }).filter(Boolean);

    res.json(enriched);
  } catch (err) {
    console.error('Get quizzes error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single quiz
router.get('/:id', authenticate, async (req, res) => {
  try {
    const quiz = db.findOne('quizzes', q => q.id === req.params.id);

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    const user = db.findOne('users', u => u.id === quiz.created_by);
    const mod = db.findOne('modules', m => m.id === quiz.module_id);
    let questions = db.findAll('questions', q => q.quiz_id === quiz.id)
      .sort((a, b) => a.sort_order - b.sort_order);

    // Don't send correct answers to students
    if (req.user.role !== 'teacher') {
      questions = questions.map(({ correct_option, explanation, ...q }) => q);
    }

    res.json({ 
      ...quiz, 
      creator_name: user?.full_name, 
      module_title: mod?.title, 
      questions 
    });
  } catch (err) {
    console.error('Get quiz error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create quiz (teacher only)
router.post('/', authenticate, requireRole('teacher'), async (req, res) => {
  try {
    const { title, description, module_id, time_limit_minutes, questions } = req.body;

    if (!title || !description || !time_limit_minutes || !questions || questions.length === 0) {
      return res.status(400).json({ error: 'Title, description, time limit, and at least one question required' });
    }

    const totalPoints = questions.reduce((sum, q) => sum + (q.points || 1), 0);

    // 1. Create Quiz
    const quiz = db.insert('quizzes', {
      id: uuid(),
      title, description, module_id: module_id || null,
      time_limit_minutes, total_points: totalPoints, is_active: true,
      created_by: req.user.id,
      created_at: new Date().toISOString()
    });

    // 2. Create Questions
    questions.forEach((q, i) => {
      db.insert('questions', {
        id: uuid(),
        quiz_id: quiz.id,
        question_text: q.question_text,
        option_a: q.option_a,
        option_b: q.option_b,
        option_c: q.option_c,
        option_d: q.option_d,
        correct_option: q.correct_option,
        explanation: q.explanation || '',
        points: q.points || 1,
        sort_order: i + 1
      });
    });

    res.status(201).json(quiz);
  } catch (err) {
    console.error('Create quiz error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update quiz
router.put('/:id', authenticate, requireRole('teacher'), async (req, res) => {
  try {
    const updates = {};
    for (const key of ['title', 'description', 'module_id', 'time_limit_minutes', 'is_active']) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const updated = db.update('quizzes', q => q.id === req.params.id, updates);

    if (!updated) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    res.json(updated);
  } catch (err) {
    console.error('Update quiz error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete quiz
router.delete('/:id', authenticate, requireRole('teacher'), async (req, res) => {
  try {
    db.delete('quizzes', q => q.id === req.params.id);
    db.delete('questions', q => q.quiz_id === req.params.id);
    db.delete('quiz_attempts', q => q.quiz_id === req.params.id);
    // Note: Answers are linked to attempts, would need nested delete in real DB
    // For local store, we'll try to keep it simple or clean up if needed.

    res.json({ message: 'Quiz deleted successfully' });
  } catch (err) {
    console.error('Delete quiz error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start quiz attempt
router.post('/:id/start', authenticate, requireRole('student'), async (req, res) => {
  try {
    const quiz = db.findOne('quizzes', q => q.id === req.params.id && q.is_active);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found or inactive' });

    const questions = db.findAll('questions', q => q.quiz_id === req.params.id);

    // Check existing in-progress attempt
    const attempt = db.findOne('quiz_attempts', a => 
      a.quiz_id === req.params.id && 
      a.student_id === req.user.id && 
      a.status === 'in_progress'
    );

    if (attempt) {
      const answers = db.findAll('answers', ans => ans.attempt_id === attempt.id);
      const safeQuestions = questions
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(({ correct_option, explanation, ...q }) => q);
      return res.json({ attempt, quiz, questions: safeQuestions, savedAnswers: answers || [] });
    }

    // Create new attempt
    const newAttempt = db.insert('quiz_attempts', {
      id: uuid(),
      quiz_id: req.params.id,
      student_id: req.user.id,
      total_points: quiz.total_points,
      status: 'in_progress',
      started_at: new Date().toISOString()
    });

    const safeQuestions = questions
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(({ correct_option, explanation, ...q }) => q);

    res.status(201).json({ attempt: newAttempt, quiz, questions: safeQuestions, savedAnswers: [] });
  } catch (err) {
    console.error('Start quiz error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Submit quiz
router.post('/:id/submit', authenticate, requireRole('student'), async (req, res) => {
  try {
    const { attempt_id, answers: submittedAnswers } = req.body;

    const attempt = db.findOne('quiz_attempts', a => 
      a.id === attempt_id && 
      a.student_id === req.user.id && 
      a.status === 'in_progress'
    );

    if (!attempt) return res.status(404).json({ error: 'No active attempt found' });

    const questions = db.findAll('questions', q => q.quiz_id === req.params.id);
    const questionMap = {};
    questions.forEach(q => { questionMap[q.id] = q; });

    // 1. Delete any existing answers for this attempt
    db.delete('answers', ans => ans.attempt_id === attempt_id);

    // 2. Grade and prepare answers
    let score = 0;
    const answersToInsert = submittedAnswers.map(ans => {
      const question = questionMap[ans.question_id];
      if (!question) return null;
      const isCorrect = ans.selected_option === question.correct_option;
      if (isCorrect) score += question.points;

      return {
        id: uuid(),
        attempt_id,
        question_id: ans.question_id,
        selected_option: ans.selected_option || null,
        is_correct: isCorrect
      };
    }).filter(Boolean);

    // 3. Insert new answers
    answersToInsert.forEach(ans => db.insert('answers', ans));

    // 4. Update attempt
    const startedAt = new Date(attempt.started_at).getTime();
    const timeTaken = Math.round((Date.now() - startedAt) / 1000);

    const updatedAttempt = db.update('quiz_attempts', a => a.id === attempt_id, {
      completed_at: new Date().toISOString(),
      score,
      time_taken_seconds: timeTaken,
      status: 'completed'
    });

    // 5. Get detailed answers for feedback
    const detailedAnswers = db.findAll('answers', ans => ans.attempt_id === attempt_id)
      .map(ans => {
        const q = db.findOne('questions', que => que.id === ans.question_id);
        return { ...ans, questions: q };
      });

    const sortedAnswers = detailedAnswers
      .map(ans => ({ ...ans, ...ans.questions }))
      .sort((a, b) => a.sort_order - b.sort_order);

    res.json({
      attempt: updatedAttempt,
      answers: sortedAnswers,
      score,
      total_points: attempt.total_points,
      percentage: Math.round((score / attempt.total_points) * 100)
    });
  } catch (err) {
    console.error('Submit quiz error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Bulk import quizzes from text/JSON
router.post('/bulk-import', authenticate, requireRole('teacher'), async (req, res) => {
  try {
    const { title, description, module_id, time_limit_minutes, format, content } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    let parsedQuestions = [];

    if (format === 'json') {
      try {
        parsedQuestions = JSON.parse(content);
        if (!Array.isArray(parsedQuestions)) parsedQuestions = [parsedQuestions];
      } catch {
        return res.status(400).json({ error: 'Invalid JSON format' });
      }
    } else {
      parsedQuestions = parseTextQuestions(content);
    }

    if (parsedQuestions.length === 0) {
      return res.status(400).json({ error: 'No valid questions found.' });
    }

    const totalPoints = parsedQuestions.reduce((sum, q) => sum + (q.points || 1), 0);

    // 1. Create Quiz
    const quiz = db.insert('quizzes', {
      id: uuid(),
      title,
      description: description || `Imported quiz with ${parsedQuestions.length} questions`,
      module_id: module_id || null,
      time_limit_minutes: parseInt(time_limit_minutes) || 15,
      total_points: totalPoints,
      is_active: true,
      created_by: req.user.id,
      created_at: new Date().toISOString()
    });

    // 2. Insert Questions
    parsedQuestions.forEach((q, i) => {
      db.insert('questions', {
        id: uuid(),
        quiz_id: quiz.id,
        question_text: q.question_text || q.text || q.question || '',
        option_a: q.option_a || q.a || '',
        option_b: q.option_b || q.b || '',
        option_c: q.option_c || q.c || '',
        option_d: q.option_d || q.d || '',
        correct_option: (q.correct_option || q.correct || q.answer || 'A').toUpperCase(),
        explanation: q.explanation || '',
        points: q.points || 1,
        sort_order: i + 1
      });
    });

    res.status(201).json({
      quiz,
      questions_imported: parsedQuestions.length,
      message: `Successfully imported ${parsedQuestions.length} questions`
    });
  } catch (err) {
    console.error('Bulk import error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper for parsing (remains same logic, just inside router)
function parseTextQuestions(text) {
  const questions = [];
  const blocks = text.split(/(?=(?:^|\n)\s*(?:Q\d*[\.\):\-]|Question\s*\d*))/i)
    .filter(b => b.trim().length > 0);

  for (const block of blocks) {
    const lines = block.trim().split('\n').map(l => l.trim()).filter(l => l);
    if (lines.length < 3) continue;

    const q = { points: 1 };
    q.question_text = lines[0].replace(/^Q\d*[\.\):\-]\s*/i, '').replace(/^Question\s*\d*[\.\):\-]?\s*/i, '').trim();

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const optMatch = line.match(/^[\(\s]*([A-Da-d])[\)\.\s\-:]+\s*(.*)/);
      if (optMatch) {
        const letter = optMatch[1].toUpperCase();
        const text = optMatch[2].trim();
        const cleanText = text.replace(/^\*\s*|\s*\*$/g, '').trim();
        if (letter === 'A') q.option_a = cleanText;
        else if (letter === 'B') q.option_b = cleanText;
        else if (letter === 'C') q.option_c = cleanText;
        else if (letter === 'D') q.option_d = cleanText;
        if (text.startsWith('*') || text.endsWith('*')) q.correct_option = letter;
        continue;
      }
      const ansMatch = line.match(/^(?:answer|correct|ans|key)[\s:\-]+([A-Da-d])/i);
      if (ansMatch) { q.correct_option = ansMatch[1].toUpperCase(); continue; }
      const expMatch = line.match(/^(?:explanation|explain|note|reason)[\s:\-]+(.*)/i);
      if (expMatch) { q.explanation = expMatch[1].trim(); continue; }
      const ptsMatch = line.match(/^(?:points|marks|score)[\s:\-]+(\d+)/i);
      if (ptsMatch) { q.points = parseInt(ptsMatch[1]) || 1; continue; }
    }
    if (q.question_text && q.option_a && q.option_b) {
      q.correct_option = q.correct_option || 'A';
      questions.push(q);
    }
  }
  return questions;
}

export default router;
