const fs = require('fs');
const data = JSON.parse(fs.readFileSync('server/db/data.json', 'utf8'));
let sql = '-- Full Data Migration (Correct E-String Fix)\n';

function escapeSql(str) {
    if (str === null || str === undefined) return 'NULL';
    // Escape single quotes and newlines for E'' syntax
    const escaped = (str + '').replace(/'/g, "''").replace(/\n/g, '\\n').replace(/\r/g, '\\r');
    return `E'${escaped}'`;
}

// 1. Modules
data.modules.forEach(m => {
    const values = [m.id, m.title, m.description, m.content, m.category, m.difficulty, m.icon, m.created_by, m.created_at]
        .map(v => escapeSql(v))
        .join(', ');
    sql += `INSERT INTO public.modules (id, title, description, content, category, difficulty, icon, created_by, created_at) VALUES (${values}) ON CONFLICT (id) DO NOTHING;\n`;
});

// 2. Quizzes
data.quizzes.forEach(q => {
    const values = [q.id, q.title, q.description, q.module_id, q.time_limit_minutes, q.total_points, q.is_active, q.created_by, q.created_at]
        .map(v => escapeSql(v))
        .join(', ');
    sql += `INSERT INTO public.quizzes (id, title, description, module_id, time_limit_minutes, total_points, is_active, created_by, created_at) VALUES (${values}) ON CONFLICT (id) DO NOTHING;\n`;
});

// 3. Questions
data.questions.forEach(q => {
    const values = [q.id, q.quiz_id, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_option, q.explanation, q.points, q.sort_order]
        .map(v => escapeSql(v))
        .join(', ');
    sql += `INSERT INTO public.questions (id, quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation, points, sort_order) VALUES (${values}) ON CONFLICT (id) DO NOTHING;\n`;
});

// 4. Materials
data.materials.forEach(m => {
    const values = [m.id, m.title, m.description, m.type, m.url, m.thumbnail, m.price, m.module_id, m.created_by, m.created_at]
        .map(v => escapeSql(v))
        .join(', ');
    sql += `INSERT INTO public.materials (id, title, description, type, url, thumbnail, price, module_id, created_by, created_at) VALUES (${values}) ON CONFLICT (id) DO NOTHING;\n`;
});

fs.writeFileSync('data_migration.sql', sql);
console.log('Successfully generated corrected data_migration.sql');
