import { Router } from 'express';
import { supabase } from '../utils/supabase.js';
import { authenticate, requireRole } from '../middleware/auth.js';

const router = Router();

// Get all quizzes
router.get('/', authenticate, async (req, res) => {
  try {
    const { data: quizzes, error } = await supabase
      .from('quizzes')
      .select(`
        *,
        users (full_name),
        modules (title),
        questions (count)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const enriched = quizzes.map(q => {
      const base = {
        ...q,
        creator_name: q.users?.full_name || 'Unknown',
        module_title: q.modules?.title || null,
        question_count: q.questions?.[0]?.count || 0
      };

      // Teacher dashboard logic (needs effort since we can't easily count distinct student_id in one select)
      // For now, we'll return the base and the frontend can fetch counts if needed, 
      // or we can do a secondary fetch for stats.
      
      if (req.user.role === 'teacher') {
        // base.attempt_count could be added here if we had a view or RPC
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
    const { data: quiz, error } = await supabase
      .from('quizzes')
      .select(`
        *,
        users (full_name),
        modules (title),
        questions (*)
      `)
      .eq('id', req.params.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return res.status(404).json({ error: 'Quiz not found' });
      throw error;
    }

    let questions = (quiz.questions || []).sort((a, b) => a.sort_order - b.sort_order);

    // Don't send correct answers to students
    if (req.user.role !== 'teacher') {
      questions = questions.map(({ correct_option, explanation, ...q }) => q);
    }

    res.json({ 
      ...quiz, 
      creator_name: quiz.users?.full_name, 
      module_title: quiz.modules?.title, 
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
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .insert([{
        title, description, module_id: module_id || null,
        time_limit_minutes, total_points: totalPoints, is_active: true,
        created_by: req.user.id
      }])
      .select()
      .single();

    if (quizError) throw quizError;

    // 2. Create Questions
    const questionsToInsert = questions.map((q, i) => ({
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
    }));

    const { error: questionsError } = await supabase
      .from('questions')
      .insert(questionsToInsert);

    if (questionsError) throw questionsError;

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

    const { data: updated, error } = await supabase
      .from('quizzes')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') return res.status(404).json({ error: 'Quiz not found' });
      throw error;
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
    // Supabase DB is setup with ON DELETE CASCADE, so deleting quiz deletes questions/attempts/answers
    const { error } = await supabase
      .from('quizzes')
      .delete()
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Quiz deleted successfully' });
  } catch (err) {
    console.error('Delete quiz error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start quiz attempt
router.post('/:id/start', authenticate, requireRole('student'), async (req, res) => {
  try {
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .select('*, questions (*)')
      .eq('id', req.params.id)
      .eq('is_active', true)
      .single();

    if (quizError || !quiz) return res.status(404).json({ error: 'Quiz not found or inactive' });

    // Check existing in-progress attempt
    let { data: attempt, error: attemptError } = await supabase
      .from('quiz_attempts')
      .select('*, answers (*)')
      .eq('quiz_id', req.params.id)
      .eq('student_id', req.user.id)
      .eq('status', 'in_progress')
      .maybeSingle();

    if (attempt) {
      const questions = quiz.questions
        .sort((a, b) => a.sort_order - b.sort_order)
        .map(({ correct_option, explanation, ...q }) => q);
      return res.json({ attempt, quiz, questions, savedAnswers: attempt.answers || [] });
    }

    // Create new attempt
    const { data: newAttempt, error: createError } = await supabase
      .from('quiz_attempts')
      .insert([{
        quiz_id: req.params.id,
        student_id: req.user.id,
        total_points: quiz.total_points,
        status: 'in_progress'
      }])
      .select()
      .single();

    if (createError) throw createError;

    const questions = quiz.questions
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(({ correct_option, explanation, ...q }) => q);

    res.status(201).json({ attempt: newAttempt, quiz, questions, savedAnswers: [] });
  } catch (err) {
    console.error('Start quiz error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Submit quiz
router.post('/:id/submit', authenticate, requireRole('student'), async (req, res) => {
  try {
    const { attempt_id, answers: submittedAnswers } = req.body;

    const { data: attempt, error: attemptError } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('id', attempt_id)
      .eq('student_id', req.user.id)
      .eq('status', 'in_progress')
      .single();

    if (attemptError || !attempt) return res.status(404).json({ error: 'No active attempt found' });

    const { data: questions, error: qError } = await supabase
      .from('questions')
      .select('*')
      .eq('quiz_id', req.params.id);

    if (qError) throw qError;

    const questionMap = {};
    questions.forEach(q => { questionMap[q.id] = q; });

    // 1. Delete any existing answers for this attempt (cleanup before re-saving)
    await supabase.from('answers').delete().eq('attempt_id', attempt_id);

    // 2. Grade and prepare answers
    let score = 0;
    const answersToInsert = submittedAnswers.map(ans => {
      const question = questionMap[ans.question_id];
      if (!question) return null;
      const isCorrect = ans.selected_option === question.correct_option;
      if (isCorrect) score += question.points;

      return {
        attempt_id,
        question_id: ans.question_id,
        selected_option: ans.selected_option || null,
        is_correct: isCorrect
      };
    }).filter(Boolean);

    // 3. Insert new answers
    const { error: insertError } = await supabase
      .from('answers')
      .insert(answersToInsert);

    if (insertError) throw insertError;

    // 4. Update attempt
    const startedAt = new Date(attempt.started_at).getTime();
    const timeTaken = Math.round((Date.now() - startedAt) / 1000);

    const { data: updatedAttempt, error: updateError } = await supabase
      .from('quiz_attempts')
      .update({
        completed_at: new Date().toISOString(),
        score,
        time_taken_seconds: timeTaken,
        status: 'completed'
      })
      .eq('id', attempt_id)
      .select()
      .single();

    if (updateError) throw updateError;

    // 5. Get detailed answers for feedback
    const { data: detailedAnswers, error: detailError } = await supabase
      .from('answers')
      .select('*, questions (*)')
      .eq('attempt_id', attempt_id);

    if (detailError) throw detailError;

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
    const { data: quiz, error: quizError } = await supabase
      .from('quizzes')
      .insert([{
        title,
        description: description || `Imported quiz with ${parsedQuestions.length} questions`,
        module_id: module_id || null,
        time_limit_minutes: parseInt(time_limit_minutes) || 15,
        total_points: totalPoints,
        is_active: true,
        created_by: req.user.id
      }])
      .select()
      .single();

    if (quizError) throw quizError;

    // 2. Insert Questions
    const questionsToInsert = parsedQuestions.map((q, i) => ({
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
    }));

    const { error: qError } = await supabase
      .from('questions')
      .insert(questionsToInsert);

    if (qError) throw qError;

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
