import db from './schema.js';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';

// Clear all data
db.clearAll();
console.log('🗑️  Cleared existing data');

const passwordHash = bcrypt.hashSync('password123', 10);
const now = new Date().toISOString();

// --- Users ---
const teacherId = uuid();
const student1Id = uuid();
const student2Id = uuid();
const student3Id = uuid();

db.insert('users', { id: teacherId, username: 'prof_sharma', email: 'sharma@university.edu', password_hash: passwordHash, full_name: 'Prof. Anil Sharma', role: 'teacher', created_at: now });
db.insert('users', { id: student1Id, username: 'rahul_student', email: 'rahul@student.edu', password_hash: passwordHash, full_name: 'Rahul Kumar', role: 'student', created_at: now });
db.insert('users', { id: student2Id, username: 'priya_student', email: 'priya@student.edu', password_hash: passwordHash, full_name: 'Priya Patel', role: 'student', created_at: now });
db.insert('users', { id: student3Id, username: 'amit_student', email: 'amit@student.edu', password_hash: passwordHash, full_name: 'Amit Singh', role: 'student', created_at: now });

console.log('👤 Created users (password for all: password123)');

// --- Modules ---
const modules = [
  {
    id: uuid(), title: 'Introduction to DBMS',
    description: 'Learn the fundamentals of Database Management Systems, their types, and advantages over file systems.',
    content: `# Introduction to DBMS\n\n## What is a Database?\nA **database** is an organized collection of structured information, or data, typically stored electronically in a computer system.\n\n## What is a DBMS?\nA **Database Management System** is a software system designed to manage and organize data in a structured way.\n\n## Types of DBMS\n1. **Hierarchical DBMS** — Data organized in a tree-like structure\n2. **Network DBMS** — Uses a graph structure with many-to-many relationships\n3. **Relational DBMS (RDBMS)** — Data stored in tables with rows and columns (e.g., MySQL, PostgreSQL)\n4. **Object-oriented DBMS** — Data stored as objects\n5. **NoSQL DBMS** — Non-relational databases for unstructured data (e.g., MongoDB)\n\n## Advantages of DBMS over File Systems\n| Feature | File System | DBMS |\n|---------|------------|------|\n| Data Redundancy | High | Controlled |\n| Data Consistency | Difficult | Ensured |\n| Data Sharing | Limited | Easy |\n| Security | Basic | Advanced |\n| Backup & Recovery | Manual | Automatic |\n\n## ACID Properties\n- **Atomicity**: All or nothing — a transaction is either fully completed or fully aborted\n- **Consistency**: Database moves from one valid state to another\n- **Isolation**: Concurrent transactions don't interfere with each other\n- **Durability**: Once committed, changes persist even after system failure`,
    category: 'Fundamentals', difficulty: 'beginner', icon: '🗄️', created_by: teacherId, created_at: now
  },
  {
    id: uuid(), title: 'ER Diagrams & Data Modeling',
    description: 'Master Entity-Relationship diagrams, entities, attributes, relationships, and cardinality.',
    content: `# Entity-Relationship (ER) Diagrams\n\n## What is an ER Diagram?\nAn **ER Diagram** is a visual representation of entities and the relationships between them within a database.\n\n## Components\n\n### 1. Entity\n- **Strong Entity**: Can be uniquely identified by its own attributes\n- **Weak Entity**: Cannot be identified without a strong entity\n\n### 2. Attributes\n- **Simple**: Cannot be divided further (e.g., Age)\n- **Composite**: Can be divided (e.g., Full Name → First + Last)\n- **Derived**: Calculated from other attributes (e.g., Age from DOB)\n- **Multi-valued**: Can have multiple values (e.g., Phone Numbers)\n- **Key**: Uniquely identifies an entity\n\n### 3. Relationships\n- **One-to-One (1:1)**\n- **One-to-Many (1:N)**\n- **Many-to-Many (M:N)**\n\n## Participation Constraints\n- **Total Participation**: Every entity must participate (double line)\n- **Partial Participation**: Some entities may not participate (single line)`,
    category: 'Data Modeling', difficulty: 'beginner', icon: '📊', created_by: teacherId, created_at: now
  },
  {
    id: uuid(), title: 'Normalization',
    description: 'Understand database normalization from 1NF to BCNF with practical examples.',
    content: `# Database Normalization\n\n## What is Normalization?\n**Normalization** is the process of organizing data in a database to reduce redundancy and improve data integrity.\n\n## Normal Forms\n\n### First Normal Form (1NF)\n- All columns contain atomic (indivisible) values\n- Each row is uniquely identifiable\n\n### Second Normal Form (2NF)\n- It is in 1NF\n- All non-key attributes are fully functionally dependent on the primary key\n\n### Third Normal Form (3NF)\n- It is in 2NF\n- No transitive dependencies exist\n\n### Boyce-Codd Normal Form (BCNF)\n- It is in 3NF\n- For every functional dependency X → Y, X is a super key\n\n## Functional Dependencies\nA functional dependency **X → Y** means the value of X uniquely determines the value of Y.\n\n## Denormalization\nSometimes we intentionally introduce redundancy for **performance optimization** in read-heavy applications.`,
    category: 'Database Design', difficulty: 'intermediate', icon: '🔧', created_by: teacherId, created_at: now
  },
  {
    id: uuid(), title: 'SQL Fundamentals',
    description: 'Learn SQL from basics — DDL, DML, DCL commands with practical query examples.',
    content: "# SQL Fundamentals\n\n## What is SQL?\n**Structured Query Language (SQL)** is a standard language for managing and manipulating relational databases.\n\n## SQL Command Categories\n\n### DDL (Data Definition Language)\n```sql\nCREATE TABLE students (\n    id INT PRIMARY KEY AUTO_INCREMENT,\n    name VARCHAR(100) NOT NULL,\n    email VARCHAR(150) UNIQUE\n);\n\nALTER TABLE students ADD COLUMN phone VARCHAR(15);\nDROP TABLE students;\nTRUNCATE TABLE students;\n```\n\n### DML (Data Manipulation Language)\n```sql\nINSERT INTO students (name, email) VALUES ('Rahul', 'rahul@email.com');\nSELECT name, email FROM students WHERE age > 18 ORDER BY name;\nUPDATE students SET department = 'IT' WHERE id = 1;\nDELETE FROM students WHERE id = 5;\n```\n\n### Important Clauses\n```sql\nSELECT department, COUNT(*) as total, AVG(age) as avg_age\nFROM students\nGROUP BY department\nHAVING COUNT(*) > 5;\n\nSELECT s.name, c.course_name\nFROM students s\nINNER JOIN enrollments e ON s.id = e.student_id\nINNER JOIN courses c ON e.course_id = c.id;\n```",
    category: 'SQL', difficulty: 'beginner', icon: '💻', created_by: teacherId, created_at: now
  },
  {
    id: uuid(), title: 'Transactions & Concurrency Control',
    description: 'Deep dive into transaction management, ACID properties, locking, and deadlocks.',
    content: `# Transactions & Concurrency Control\n\n## What is a Transaction?\nA **transaction** is a sequence of database operations treated as a single logical unit.\n\n## Transaction States\n1. **Active** — Being executed\n2. **Partially Committed** — Final operation executed\n3. **Committed** — Successfully completed\n4. **Failed** — Error occurred\n5. **Aborted** — Rolled back\n\n## Concurrency Problems\n1. **Lost Update** — Two transactions update same data; one is lost\n2. **Dirty Read** — Reading uncommitted data\n3. **Non-repeatable Read** — Different values on re-reading\n4. **Phantom Read** — New rows appear in re-executed query\n\n## Isolation Levels\n| Level | Dirty Read | Non-repeatable | Phantom |\n|-------|-----------|----------------|--------|\n| Read Uncommitted | Possible | Possible | Possible |\n| Read Committed | Prevented | Possible | Possible |\n| Repeatable Read | Prevented | Prevented | Possible |\n| Serializable | Prevented | Prevented | Prevented |\n\n## Locking Mechanisms\n- **Shared Lock (S)**: Multiple transactions can read\n- **Exclusive Lock (X)**: Only one transaction can write\n- **Two-Phase Locking (2PL)**: Growing phase + Shrinking phase`,
    category: 'Transactions', difficulty: 'advanced', icon: '🔒', created_by: teacherId, created_at: now
  },
  {
    id: uuid(), title: 'Indexing & Query Optimization',
    description: 'Learn about B-Trees, hashing, indexing strategies, and how to optimize SQL queries.',
    content: `# Indexing & Query Optimization\n\n## What is Indexing?\nAn **index** improves the speed of data retrieval at the cost of additional storage and slower writes.\n\n## Types of Indexes\n- **Primary Index**: On the primary key column\n- **Secondary Index**: On non-primary key columns\n- **Clustered Index**: Determines physical order of data\n- **Non-Clustered Index**: Separate structure with pointers\n\n## Index Data Structures\n\n### B-Tree\n- Self-balancing tree\n- Search, Insert, Delete: O(log n)\n\n### B+ Tree\n- All data in leaf nodes\n- Leaves linked like a linked list\n- Better for range queries\n\n### Hash Index\n- Excellent for exact-match: O(1)\n- Poor for range queries\n\n## Optimization Tips\n- Use indexes on WHERE, JOIN, ORDER BY columns\n- Avoid SELECT * (fetch only needed columns)\n- Use EXISTS instead of IN for subqueries\n- Avoid functions on indexed columns in WHERE`,
    category: 'Performance', difficulty: 'advanced', icon: '⚡', created_by: teacherId, created_at: now
  }
];

for (const m of modules) db.insert('modules', m);
console.log(`📚 Created ${modules.length} learning modules`);

// --- Quizzes ---
const quiz1Id = uuid();
const quiz2Id = uuid();
const quiz3Id = uuid();
const quiz4Id = uuid();

db.insert('quizzes', { id: quiz1Id, title: 'DBMS Fundamentals Quiz', description: 'Test your knowledge of basic DBMS concepts, types, and ACID properties.', module_id: modules[0].id, time_limit_minutes: 10, total_points: 10, is_active: 1, created_by: teacherId, created_at: now });
db.insert('quizzes', { id: quiz2Id, title: 'SQL Basics Quiz', description: 'Test your SQL knowledge — DDL, DML, and basic query writing.', module_id: modules[3].id, time_limit_minutes: 15, total_points: 10, is_active: 1, created_by: teacherId, created_at: now });
db.insert('quizzes', { id: quiz3Id, title: 'Normalization Quiz', description: 'Test your understanding of database normalization from 1NF to BCNF.', module_id: modules[2].id, time_limit_minutes: 12, total_points: 8, is_active: 1, created_by: teacherId, created_at: now });
db.insert('quizzes', { id: quiz4Id, title: 'Transactions & Concurrency Quiz', description: 'Advanced quiz on transaction management and concurrency control.', module_id: modules[4].id, time_limit_minutes: 15, total_points: 8, is_active: 1, created_by: teacherId, created_at: now });

// Quiz 1 Questions
const q1 = [
  { text: 'What does DBMS stand for?', a: 'Data Base Management System', b: 'Database Management System', c: 'Data Basic Management System', d: 'Database Machine System', correct: 'B', explanation: 'DBMS stands for Database Management System.' },
  { text: 'Which of the following is NOT an ACID property?', a: 'Atomicity', b: 'Consistency', c: 'Independence', d: 'Durability', correct: 'C', explanation: 'ACID = Atomicity, Consistency, Isolation, and Durability.' },
  { text: 'Which type of DBMS stores data in tables?', a: 'Hierarchical', b: 'Network', c: 'Relational', d: 'Object-oriented', correct: 'C', explanation: 'RDBMS stores data in tables with rows and columns.' },
  { text: 'What is a Schema in a database?', a: 'The actual data stored', b: 'A query language', c: 'The structure/blueprint of the database', d: 'A type of index', correct: 'C', explanation: 'A schema defines the structure of the database.' },
  { text: 'Which property ensures "all or nothing"?', a: 'Consistency', b: 'Isolation', c: 'Durability', d: 'Atomicity', correct: 'D', explanation: 'Atomicity ensures all operations complete or none do.' },
  { text: 'Data redundancy is better controlled in:', a: 'File System', b: 'DBMS', c: 'Both equally', d: 'Neither', correct: 'B', explanation: 'DBMS uses normalization to control redundancy.' },
  { text: 'What does Data Independence mean?', a: 'Data can exist without a database', b: 'Schema can change without affecting data', c: 'Data is independent of users', d: 'Data does not need backup', correct: 'B', explanation: 'Data independence: change schema without affecting data.' },
  { text: 'Which is a NoSQL database?', a: 'MySQL', b: 'PostgreSQL', c: 'MongoDB', d: 'Oracle', correct: 'C', explanation: 'MongoDB is a NoSQL document-oriented database.' },
  { text: 'A database instance refers to:', a: 'The schema definition', b: 'The data at a particular moment', c: 'The database software', d: 'The query optimizer', correct: 'B', explanation: 'An instance is the actual data at a moment in time.' },
  { text: 'Which ACID property ensures committed data persists?', a: 'Atomicity', b: 'Consistency', c: 'Isolation', d: 'Durability', correct: 'D', explanation: 'Durability guarantees committed data remains permanent.' }
];

q1.forEach((q, i) => db.insert('questions', {
  id: uuid(), quiz_id: quiz1Id, question_text: q.text, option_a: q.a, option_b: q.b, option_c: q.c, option_d: q.d,
  correct_option: q.correct, explanation: q.explanation, points: 1, sort_order: i + 1
}));

// Quiz 2 Questions
const q2 = [
  { text: 'Which SQL command creates a new table?', a: 'MAKE TABLE', b: 'NEW TABLE', c: 'CREATE TABLE', d: 'ADD TABLE', correct: 'C', explanation: 'CREATE TABLE is the DDL command.' },
  { text: 'Which SQL clause filters rows?', a: 'SELECT', b: 'WHERE', c: 'FROM', d: 'ORDER BY', correct: 'B', explanation: 'WHERE filters rows based on conditions.' },
  { text: 'What does DML stand for?', a: 'Data Manipulation Language', b: 'Data Management Language', c: 'Data Modeling Language', d: 'Database Manipulation Language', correct: 'A', explanation: 'DML = Data Manipulation Language.' },
  { text: 'Which command removes all rows but keeps structure?', a: 'DELETE', b: 'DROP', c: 'TRUNCATE', d: 'REMOVE', correct: 'C', explanation: 'TRUNCATE removes data, preserves table structure.' },
  { text: 'Which JOIN returns all rows from both tables?', a: 'INNER', b: 'LEFT', c: 'RIGHT', d: 'FULL OUTER', correct: 'D', explanation: 'FULL OUTER JOIN returns all rows from both tables.' },
  { text: 'Correct order of SQL clauses?', a: 'SELECT, WHERE, FROM', b: 'SELECT, FROM, WHERE, ORDER BY', c: 'FROM, SELECT, WHERE', d: 'SELECT, FROM, ORDER BY, WHERE', correct: 'B', explanation: 'SELECT, FROM, WHERE, GROUP BY, HAVING, ORDER BY.' },
  { text: 'Which aggregate function counts rows?', a: 'SUM()', b: 'AVG()', c: 'COUNT()', d: 'TOTAL()', correct: 'C', explanation: 'COUNT() returns the number of matching rows.' },
  { text: 'LIKE operator with "R%" matches?', a: 'Strings ending with R', b: 'Strings containing R', c: 'Strings starting with R', d: 'Exact match R%', correct: 'C', explanation: '"R%" matches strings starting with "R".' },
  { text: 'Which SQL command gives permissions?', a: 'ALLOW', b: 'PERMIT', c: 'GRANT', d: 'ENABLE', correct: 'C', explanation: 'GRANT is the DCL command for permissions.' },
  { text: 'What does COMMIT do?', a: 'Starts transaction', b: 'Saves all changes permanently', c: 'Rolls back changes', d: 'Pauses transaction', correct: 'B', explanation: 'COMMIT saves changes permanently.' }
];

q2.forEach((q, i) => db.insert('questions', {
  id: uuid(), quiz_id: quiz2Id, question_text: q.text, option_a: q.a, option_b: q.b, option_c: q.c, option_d: q.d,
  correct_option: q.correct, explanation: q.explanation, points: 1, sort_order: i + 1
}));

// Quiz 3 Questions
const q3 = [
  { text: 'Main goal of normalization?', a: 'Increase redundancy', b: 'Reduce redundancy and anomalies', c: 'Speed up queries', d: 'Add more tables', correct: 'B', explanation: 'Normalization reduces redundancy and prevents anomalies.' },
  { text: 'A table is in 1NF if:', a: 'No redundant data', b: 'All attributes are atomic', c: 'No transitive dependencies', d: 'Every determinant is candidate key', correct: 'B', explanation: '1NF requires atomic (indivisible) values.' },
  { text: 'What does 2NF eliminate?', a: 'Transitive dependencies', b: 'Multi-valued dependencies', c: 'Partial dependencies', d: 'All redundancy', correct: 'C', explanation: '2NF eliminates partial dependencies.' },
  { text: '3NF eliminates which dependency?', a: 'Partial', b: 'Transitive', c: 'Full', d: 'Multi-valued', correct: 'B', explanation: '3NF eliminates transitive dependencies.' },
  { text: 'BCNF is stricter than:', a: '1NF only', b: '2NF only', c: '3NF', d: 'None', correct: 'C', explanation: 'BCNF is a stricter version of 3NF.' },
  { text: 'What is a Functional Dependency?', a: 'Relationship between tables', b: 'When X uniquely determines Y', c: 'A type of JOIN', d: 'Constraint on data types', correct: 'B', explanation: 'X→Y means X uniquely determines Y.' },
  { text: 'Denormalization is done for:', a: 'Better integrity', b: 'Performance optimization', c: 'Reducing tables', d: 'Best practices', correct: 'B', explanation: 'Denormalization improves read performance.' },
  { text: 'Multi-valued attribute like "Phone: 123, 456" violates:', a: '2NF', b: '3NF', c: '1NF', d: 'BCNF', correct: 'C', explanation: '1NF requires atomic values.' }
];

q3.forEach((q, i) => db.insert('questions', {
  id: uuid(), quiz_id: quiz3Id, question_text: q.text, option_a: q.a, option_b: q.b, option_c: q.c, option_d: q.d,
  correct_option: q.correct, explanation: q.explanation, points: 1, sort_order: i + 1
}));

// Quiz 4 Questions
const q4 = [
  { text: 'Transaction states are:', a: 'Start, Run, Stop', b: 'Active, Partially Committed, Committed, Failed, Aborted', c: 'Begin, Process, End', d: 'Open, Closed, Pending', correct: 'B', explanation: 'Active → Partially Committed → Committed (or Failed → Aborted).' },
  { text: 'A "Dirty Read" occurs when:', a: 'Data is corrupted', b: 'An uncommitted value is read', c: 'A transaction reads own data', d: 'Query returns empty', correct: 'B', explanation: 'Dirty read: reading uncommitted data from another transaction.' },
  { text: 'Which isolation level prevents all issues?', a: 'Read Uncommitted', b: 'Read Committed', c: 'Repeatable Read', d: 'Serializable', correct: 'D', explanation: 'Serializable is the strictest isolation level.' },
  { text: 'Exclusive Lock (X) allows:', a: 'Multiple reads', b: 'Multiple writes', c: 'Only one transaction to read/write', d: 'No access', correct: 'C', explanation: 'Exclusive lock: only the holding transaction can access.' },
  { text: 'What is a deadlock?', a: 'Slow query', b: 'Database crash', c: 'Transactions waiting for each other', d: 'Data corruption', correct: 'C', explanation: 'Deadlock: transactions waiting for each other indefinitely.' },
  { text: 'Two-Phase Locking phases:', a: 'Read and Write', b: 'Growing and Shrinking', c: 'Lock and Unlock', d: 'Commit and Rollback', correct: 'B', explanation: '2PL: Growing (acquire locks) and Shrinking (release locks).' },
  { text: 'Write-Ahead Logging (WAL) ensures:', a: 'Atomicity', b: 'Isolation', c: 'Durability', d: 'Consistency', correct: 'C', explanation: 'WAL ensures durability by writing logs before data changes.' },
  { text: 'In Wait-Die, a younger transaction:', a: 'Waits', b: 'Dies (aborts)', c: 'Continues', d: 'Restarts', correct: 'B', explanation: 'Wait-Die: younger transaction aborts if needing a lock from older.' }
];

q4.forEach((q, i) => db.insert('questions', {
  id: uuid(), quiz_id: quiz4Id, question_text: q.text, option_a: q.a, option_b: q.b, option_c: q.c, option_d: q.d,
  correct_option: q.correct, explanation: q.explanation, points: 1, sort_order: i + 1
}));

console.log('📝 Created 4 quizzes with questions');

// --- Sample Attempts ---
const questions1 = db.findAll('questions', q => q.quiz_id === quiz1Id).sort((a,b) => a.sort_order - b.sort_order);
const questions2 = db.findAll('questions', q => q.quiz_id === quiz2Id).sort((a,b) => a.sort_order - b.sort_order);

// Rahul: Quiz 1 — 8/10
const a1Id = uuid();
db.insert('quiz_attempts', { id: a1Id, quiz_id: quiz1Id, student_id: student1Id, started_at: '2026-04-10T10:00:00Z', completed_at: '2026-04-10T10:07:30Z', score: 8, total_points: 10, time_taken_seconds: 450, status: 'completed' });
const r1Answers = ['B', 'C', 'C', 'C', 'D', 'B', 'B', 'C', 'B', 'D'];
questions1.forEach((q, i) => db.insert('answers', { id: uuid(), attempt_id: a1Id, question_id: q.id, selected_option: r1Answers[i], is_correct: r1Answers[i] === q.correct_option ? 1 : 0 }));

// Priya: Quiz 1 — 9/10
const a2Id = uuid();
db.insert('quiz_attempts', { id: a2Id, quiz_id: quiz1Id, student_id: student2Id, started_at: '2026-04-10T11:00:00Z', completed_at: '2026-04-10T11:06:00Z', score: 9, total_points: 10, time_taken_seconds: 360, status: 'completed' });
const p1Answers = ['B', 'C', 'C', 'C', 'D', 'B', 'B', 'C', 'B', 'D'];
questions1.forEach((q, i) => db.insert('answers', { id: uuid(), attempt_id: a2Id, question_id: q.id, selected_option: p1Answers[i], is_correct: p1Answers[i] === q.correct_option ? 1 : 0 }));

// Rahul: Quiz 2 — 7/10
const a3Id = uuid();
db.insert('quiz_attempts', { id: a3Id, quiz_id: quiz2Id, student_id: student1Id, started_at: '2026-04-11T14:00:00Z', completed_at: '2026-04-11T14:10:00Z', score: 7, total_points: 10, time_taken_seconds: 600, status: 'completed' });
const r2Answers = ['C', 'B', 'A', 'C', 'D', 'B', 'C', 'C', 'C', 'B'];
questions2.forEach((q, i) => db.insert('answers', { id: uuid(), attempt_id: a3Id, question_id: q.id, selected_option: r2Answers[i], is_correct: r2Answers[i] === q.correct_option ? 1 : 0 }));

console.log('✅ Created sample quiz attempts');

// --- Study Materials: Video Lectures ---
const videoMaterials = [
  {
    id: uuid(), title: 'DBMS Complete Course — Introduction', description: 'Full introduction to DBMS covering architecture, data models, and schema design. Perfect for beginners starting the DBMS journey.',
    type: 'video', url: 'https://www.youtube.com/embed/kBdlM6hNDAE', module_id: modules[0].id,
    thumbnail: 'https://img.youtube.com/vi/kBdlM6hNDAE/maxresdefault.jpg', created_by: teacherId, created_at: now
  },
  {
    id: uuid(), title: 'ER Diagram Tutorial — Complete Guide', description: 'Step-by-step tutorial on creating Entity-Relationship diagrams with real-world examples. Covers entities, attributes, relationships, and cardinality.',
    type: 'video', url: 'https://www.youtube.com/embed/QpdhBUYk7Kk', module_id: modules[1].id,
    thumbnail: 'https://img.youtube.com/vi/QpdhBUYk7Kk/maxresdefault.jpg', created_by: teacherId, created_at: now
  },
  {
    id: uuid(), title: 'Database Normalization — 1NF, 2NF, 3NF, BCNF', description: 'Clear explanation of all normal forms with practical table decomposition examples. Includes anomaly identification and resolution.',
    type: 'video', url: 'https://www.youtube.com/embed/GFQaEYEc8_8', module_id: modules[2].id,
    thumbnail: 'https://img.youtube.com/vi/GFQaEYEc8_8/maxresdefault.jpg', created_by: teacherId, created_at: now
  },
  {
    id: uuid(), title: 'SQL Full Course for Beginners', description: 'Comprehensive SQL tutorial covering SELECT, JOIN, GROUP BY, subqueries, and advanced functions with hands-on examples.',
    type: 'video', url: 'https://www.youtube.com/embed/HXV3zeQKqGY', module_id: modules[3].id,
    thumbnail: 'https://img.youtube.com/vi/HXV3zeQKqGY/maxresdefault.jpg', created_by: teacherId, created_at: now
  },
  {
    id: uuid(), title: 'Transactions & Concurrency Control in DBMS', description: 'Detailed lecture on ACID properties, serializability, locking protocols, deadlock detection and recovery mechanisms.',
    type: 'video', url: 'https://www.youtube.com/embed/P80Js_qClUE', module_id: modules[4].id,
    thumbnail: 'https://img.youtube.com/vi/P80Js_qClUE/maxresdefault.jpg', created_by: teacherId, created_at: now
  },
  {
    id: uuid(), title: 'Indexing and B+ Trees Explained', description: 'Visual explanation of indexing data structures including B-Trees, B+ Trees, hash indexes and their performance characteristics.',
    type: 'video', url: 'https://www.youtube.com/embed/aZjYr87r1b8', module_id: modules[5].id,
    thumbnail: 'https://img.youtube.com/vi/aZjYr87r1b8/maxresdefault.jpg', created_by: teacherId, created_at: now
  },
  {
    id: uuid(), title: 'Relational Algebra — Complete Lecture', description: 'Covers all relational algebra operations: selection, projection, union, intersection, difference, join, and division with examples.',
    type: 'video', url: 'https://www.youtube.com/embed/jMVRz55CqOY', module_id: null,
    thumbnail: 'https://img.youtube.com/vi/jMVRz55CqOY/maxresdefault.jpg', created_by: teacherId, created_at: now
  },
  {
    id: uuid(), title: 'SQL Joins Visualized — Inner, Left, Right, Full', description: 'Visual diagrams and animated examples of all SQL JOIN types. Includes self-joins and cross joins with real-world scenarios.',
    type: 'video', url: 'https://www.youtube.com/embed/9yeOJ0ZMUYw', module_id: modules[3].id,
    thumbnail: 'https://img.youtube.com/vi/9yeOJ0ZMUYw/maxresdefault.jpg', created_by: teacherId, created_at: now
  }
];

for (const v of videoMaterials) db.insert('materials', v);
console.log(`🎥 Created ${videoMaterials.length} video lectures`);

// --- Study Materials: In-Browser Presentations ---
const pptMaterials = [
  {
    id: uuid(), title: 'Introduction to DBMS — Lecture Slides', description: 'Comprehensive lecture slides covering DBMS fundamentals, architecture, data models, schema, and three-schema architecture.',
    type: 'ppt', url: '#', module_id: modules[0].id, thumbnail: null, created_by: teacherId, created_at: now,
    slides: [
      { title: 'Introduction to DBMS', subtitle: 'Database Management Systems — Fundamentals', layout: 'cover', color: '#7C4DFF' },
      { title: 'What is a Database?', bullets: ['An organized collection of structured data stored electronically', 'Managed by a Database Management System (DBMS)', 'Enables efficient storage, retrieval, and manipulation of data', 'Examples: Student records, banking systems, e-commerce catalogs'], icon: '🗄️' },
      { title: 'What is a DBMS?', bullets: ['Software system for creating and managing databases', 'Acts as an interface between users and the database', 'Provides data abstraction, security, and integrity', 'Examples: MySQL, PostgreSQL, Oracle, MongoDB, SQL Server'], icon: '⚙️' },
      { title: 'Types of DBMS', bullets: ['🏗️ Hierarchical DBMS — Tree-like structure (IBM IMS)', '🕸️ Network DBMS — Graph with many-to-many relationships', '📊 Relational DBMS — Tables with rows and columns (most popular)', '📦 Object-Oriented DBMS — Data stored as objects', '🍃 NoSQL DBMS — Flexible schemas for unstructured data'], icon: '📋' },
      { title: 'Three-Schema Architecture', bullets: ['External Level — User views (how users see data)', 'Conceptual Level — Logical structure (what data is stored)', 'Internal Level — Physical storage (how data is stored on disk)', '✅ Provides data independence and abstraction'], icon: '🏛️' },
      { title: 'File System vs DBMS', table: { headers: ['Feature', 'File System', 'DBMS'], rows: [['Data Redundancy', '❌ High', '✅ Controlled'], ['Data Consistency', '❌ Difficult', '✅ Enforced'], ['Concurrent Access', '❌ Limited', '✅ Supported'], ['Security', '❌ Basic', '✅ Advanced'], ['Backup & Recovery', '❌ Manual', '✅ Automatic'], ['Data Integrity', '❌ No constraints', '✅ Constraints enforced']] } },
      { title: 'ACID Properties', bullets: ['⚛️ Atomicity — All or nothing, transactions complete fully or not at all', '🔄 Consistency — Database moves from one valid state to another', '🔒 Isolation — Concurrent transactions don\'t interfere', '💾 Durability — Committed changes survive system failures'], icon: '🛡️' },
      { title: 'Key Takeaways', bullets: ['DBMS provides structured, efficient data management', 'Three-schema architecture ensures data independence', 'ACID properties guarantee transaction reliability', 'RDBMS (relational) is the most widely used model', 'DBMS is essential for any modern application'], layout: 'summary', icon: '🎯' }
    ]
  },
  {
    id: uuid(), title: 'ER Model & ER Diagrams', description: 'Detailed slides on Entity-Relationship model, Chen notation, weak entities, attributes, relationships, and participation constraints.',
    type: 'ppt', url: '#', module_id: modules[1].id, thumbnail: null, created_by: teacherId, created_at: now,
    slides: [
      { title: 'Entity-Relationship Model', subtitle: 'Data Modeling with ER Diagrams', layout: 'cover', color: '#10b981' },
      { title: 'What is an ER Diagram?', bullets: ['A visual representation of entities and their relationships', 'Used in the conceptual design phase of database development', 'Proposed by Peter Chen in 1976', 'Translated into relational schema for implementation'], icon: '📊' },
      { title: 'Entities', bullets: ['🔲 Entity — A real-world object (Student, Course, Employee)', '🔲 Strong Entity — Can be uniquely identified by its own attributes', '🔲🔲 Weak Entity — Depends on a strong entity for identification', 'Entity Set — Collection of similar entities', 'Represented as rectangles in ER diagrams'], icon: '📦' },
      { title: 'Attributes', bullets: ['⬭ Simple — Cannot be divided (e.g., Age, Salary)', '⬭ Composite — Divisible (e.g., Name → First + Last)', '⬭ Derived — Calculated from others (e.g., Age from DOB) — shown with dashed ellipse', '⬭ Multi-valued — Multiple values (e.g., Phone Numbers) — shown with double ellipse', '🔑 Key Attribute — Uniquely identifies entity — shown with underlined text'], icon: '📝' },
      { title: 'Relationships', bullets: ['◇ Relationship — Association between entities', '1:1 — One-to-One (Person ↔ Passport)', '1:N — One-to-Many (Department ↔ Employees)', 'M:N — Many-to-Many (Students ↔ Courses)', 'Represented as diamonds connecting entities'], icon: '🔗' },
      { title: 'Cardinality & Participation', bullets: ['Cardinality — Maximum number of relationship instances (1:1, 1:N, M:N)', 'Total Participation — Every entity MUST participate (double line ═══)', 'Partial Participation — Some entities may not participate (single line ———)', 'Example: Every Employee MUST belong to a Department (total)', 'Some Employees MAY manage a Department (partial)'], icon: '📐' },
      { title: 'ER → Relational Mapping', bullets: ['Strong entity → Table with all simple attributes', 'Weak entity → Table with foreign key to owner entity', '1:1 Relationship → Add FK to either entity table', '1:N Relationship → Add FK to the "many" side table', 'M:N Relationship → Create a new junction/bridge table', 'Multi-valued attribute → Separate table with FK'], icon: '🗃️' },
      { title: 'Summary', bullets: ['ER diagrams model real-world data relationships visually', 'Entities = nouns, Relationships = verbs, Attributes = properties', 'Cardinality defines how many entities participate', 'Participation constraints define mandatory vs optional', 'ER diagrams are mapped to relational tables for implementation'], layout: 'summary', icon: '🎯' }
    ]
  },
  {
    id: uuid(), title: 'Normalization in DBMS', description: 'Lecture slides on normalization: functional dependencies, 1NF through BCNF, decomposition algorithms, and lossless joins.',
    type: 'ppt', url: '#', module_id: modules[2].id, thumbnail: null, created_by: teacherId, created_at: now,
    slides: [
      { title: 'Database Normalization', subtitle: 'Eliminating Redundancy & Anomalies', layout: 'cover', color: '#f59e0b' },
      { title: 'Why Normalize?', bullets: ['❌ Insertion Anomaly — Cannot add data without other data', '❌ Update Anomaly — Changing one fact requires multiple row updates', '❌ Deletion Anomaly — Deleting data unintentionally removes other data', '✅ Normalization eliminates these anomalies systematically', '✅ Reduces data redundancy and improves integrity'], icon: '🎯' },
      { title: 'Functional Dependencies', bullets: ['X → Y means: value of X uniquely determines value of Y', 'Example: StudentID → StudentName (one ID = one name)', 'Trivial FD: X → Y where Y ⊆ X', 'Closure of FDs: all dependencies derivable from a set', 'Armstrong\'s Axioms: Reflexivity, Augmentation, Transitivity'], icon: '🔗' },
      { title: 'First Normal Form (1NF)', bullets: ['✅ All attributes must contain atomic (indivisible) values', '✅ No repeating groups or arrays in a single cell', '✅ Each row must be uniquely identifiable', '❌ Violation: Student(Name, Phones: "123,456,789")', '✅ Fix: Create separate rows or a Phone table'], icon: '1️⃣' },
      { title: 'Second Normal Form (2NF)', bullets: ['✅ Must be in 1NF', '✅ No partial dependencies (non-key depends on PART of composite key)', 'Only relevant when table has a composite primary key', '❌ Violation: (StudentID, CourseID) → CourseName (depends only on CourseID)', '✅ Fix: Decompose into Student_Course and Course tables'], icon: '2️⃣' },
      { title: 'Third Normal Form (3NF)', bullets: ['✅ Must be in 2NF', '✅ No transitive dependencies (A→B→C, so A→C indirectly)', '❌ Violation: StudentID → DeptID → DeptName (transitive)', '✅ Fix: Split into Student(SID, DeptID) and Dept(DeptID, DeptName)', 'Rule: Every non-key attribute depends on the key, the whole key, and nothing but the key'], icon: '3️⃣' },
      { title: 'BCNF (Boyce-Codd Normal Form)', bullets: ['✅ Must be in 3NF', '✅ For every FD X→Y, X must be a superkey', 'Stricter than 3NF — handles cases 3NF misses', 'Example: If a non-candidate-key determines another attribute', '✅ Always achievable through decomposition, but may lose dependency preservation'], icon: '🔒' },
      { title: 'Normal Forms Summary', table: { headers: ['NF', 'Requirement', 'Eliminates'], rows: [['1NF', 'Atomic values, unique rows', 'Repeating groups'], ['2NF', '1NF + no partial dependencies', 'Partial dependencies'], ['3NF', '2NF + no transitive dependencies', 'Transitive dependencies'], ['BCNF', 'Every determinant is a superkey', 'All remaining anomalies']] } }
    ]
  },
  {
    id: uuid(), title: 'SQL Commands & Query Processing', description: 'Complete SQL reference slides: DDL, DML, DCL, TCL with examples, subqueries, joins, views, and stored procedures.',
    type: 'ppt', url: '#', module_id: modules[3].id, thumbnail: null, created_by: teacherId, created_at: now,
    slides: [
      { title: 'SQL — Structured Query Language', subtitle: 'Complete Command Reference & Query Processing', layout: 'cover', color: '#3b82f6' },
      { title: 'SQL Command Categories', table: { headers: ['Category', 'Commands', 'Purpose'], rows: [['DDL', 'CREATE, ALTER, DROP, TRUNCATE', 'Define/modify schema'], ['DML', 'SELECT, INSERT, UPDATE, DELETE', 'Manipulate data'], ['DCL', 'GRANT, REVOKE', 'Control access'], ['TCL', 'COMMIT, ROLLBACK, SAVEPOINT', 'Manage transactions']] } },
      { title: 'DDL — Data Definition', bullets: ['CREATE TABLE students (id INT PRIMARY KEY, name VARCHAR(100));', 'ALTER TABLE students ADD COLUMN email VARCHAR(150);', 'DROP TABLE students; — removes table permanently', 'TRUNCATE TABLE students; — removes all rows, keeps structure', 'DDL commands auto-commit (cannot be rolled back)'], icon: '🏗️', code: true },
      { title: 'DML — Data Manipulation', bullets: ['INSERT INTO students VALUES (1, \'Rahul\', \'rahul@mail.com\');', 'SELECT name, email FROM students WHERE id > 5;', 'UPDATE students SET email = \'new@mail.com\' WHERE id = 1;', 'DELETE FROM students WHERE id = 10;', 'DML changes can be rolled back before COMMIT'], icon: '✏️', code: true },
      { title: 'JOINs — Combining Tables', bullets: ['INNER JOIN — Only matching rows from both tables', 'LEFT JOIN — All rows from left + matching from right', 'RIGHT JOIN — All rows from right + matching from left', 'FULL OUTER JOIN — All rows from both tables', 'CROSS JOIN — Cartesian product (every combination)', 'SELF JOIN — Table joined with itself'], icon: '🔗' },
      { title: 'Aggregate Functions & Grouping', bullets: ['COUNT(*) — Count all rows; COUNT(col) — Count non-NULL', 'SUM(salary), AVG(salary), MIN(salary), MAX(salary)', 'GROUP BY department — Groups rows for aggregation', 'HAVING COUNT(*) > 5 — Filters groups (not rows)', 'ORDER BY salary DESC — Sorts results', 'LIMIT 10 OFFSET 20 — Pagination'], icon: '📊' },
      { title: 'Subqueries & Advanced', bullets: ['Scalar subquery: WHERE salary > (SELECT AVG(salary) FROM emp)', 'IN subquery: WHERE dept IN (SELECT dept FROM active_depts)', 'EXISTS: WHERE EXISTS (SELECT 1 FROM orders WHERE ...)', 'Correlated: references outer query — runs once per row', 'Views: CREATE VIEW active_students AS SELECT ...', 'Indexes: CREATE INDEX idx_name ON students(name);'], icon: '🧠' },
      { title: 'Query Execution Order', bullets: ['1. FROM & JOINs — Identify source tables', '2. WHERE — Filter individual rows', '3. GROUP BY — Group remaining rows', '4. HAVING — Filter groups', '5. SELECT — Choose columns & compute expressions', '6. DISTINCT — Remove duplicates', '7. ORDER BY — Sort results', '8. LIMIT/OFFSET — Pagination'], layout: 'summary', icon: '📋' }
    ]
  },
  {
    id: uuid(), title: 'Transaction Management & Recovery', description: 'Slides covering transaction processing, ACID, serializability, recovery techniques, log-based recovery, and checkpointing.',
    type: 'ppt', url: '#', module_id: modules[4].id, thumbnail: null, created_by: teacherId, created_at: now,
    slides: [
      { title: 'Transaction Management', subtitle: 'ACID, Concurrency Control & Recovery', layout: 'cover', color: '#ef4444' },
      { title: 'What is a Transaction?', bullets: ['A logical unit of work — a sequence of operations on the database', 'Must satisfy ACID properties for reliability', 'Examples: Bank transfer, order placement, seat booking', 'Either ALL operations succeed (commit) or NONE do (rollback)', 'Transactions are the foundation of database reliability'], icon: '🔄' },
      { title: 'Transaction States', bullets: ['🟢 Active — Currently executing operations', '🟡 Partially Committed — Final operation executed, awaiting confirmation', '✅ Committed — Successfully completed and saved permanently', '❌ Failed — An error/abort occurred during execution', '⏪ Aborted — Rolled back, database restored to prior state', 'After abort: Restart transaction or Kill it'], icon: '📊' },
      { title: 'Concurrency Problems', bullets: ['👻 Lost Update — T1 writes, T2 writes same data → T1\'s update is lost', '💀 Dirty Read — T2 reads uncommitted data from T1 (T1 may rollback!)', '🔄 Non-Repeatable Read — T1 reads X twice, gets different values (T2 modified X)', '👤 Phantom Read — T1 re-runs query, new rows appear (T2 inserted rows)', 'Solution: Isolation levels and locking protocols'], icon: '⚠️' },
      { title: 'Isolation Levels', table: { headers: ['Level', 'Dirty Read', 'Non-Repeatable', 'Phantom'], rows: [['Read Uncommitted', '⚠️ Possible', '⚠️ Possible', '⚠️ Possible'], ['Read Committed', '✅ Prevented', '⚠️ Possible', '⚠️ Possible'], ['Repeatable Read', '✅ Prevented', '✅ Prevented', '⚠️ Possible'], ['Serializable', '✅ Prevented', '✅ Prevented', '✅ Prevented']] } },
      { title: 'Locking Protocols', bullets: ['🔓 Shared Lock (S-lock) — Multiple transactions can READ', '🔒 Exclusive Lock (X-lock) — Only ONE transaction can WRITE', 'Two-Phase Locking (2PL):', '   📈 Growing Phase — Acquire locks, never release', '   📉 Shrinking Phase — Release locks, never acquire', 'Strict 2PL: Hold all locks until commit/abort (prevents cascading rollback)'], icon: '🔐' },
      { title: 'Deadlock', bullets: ['🔄 Deadlock — Two+ transactions waiting for each other\'s locks', 'Prevention: Wait-Die (older waits, younger dies) or Wound-Wait', 'Detection: Build wait-for graph → cycle = deadlock', 'Resolution: Abort one transaction (choose victim with least cost)', 'Timeout: Abort transaction if waiting too long for a lock'], icon: '🚫' },
      { title: 'Recovery Techniques', bullets: ['📝 Write-Ahead Logging (WAL) — Write log BEFORE modifying data', 'Undo Recovery — Rollback uncommitted transactions after crash', 'Redo Recovery — Re-apply committed transactions after crash', '🏁 Checkpointing — Save consistent state periodically', 'Reduces recovery time by limiting how far back to scan logs', 'ARIES algorithm: Analysis → Redo → Undo phases'], layout: 'summary', icon: '🛡️' }
    ]
  },
  {
    id: uuid(), title: 'Indexing, B-Trees & Hashing', description: 'Visual slides on indexing methods, B-Tree/B+ Tree structures, hash indexing, and query optimization strategies.',
    type: 'ppt', url: '#', module_id: modules[5].id, thumbnail: null, created_by: teacherId, created_at: now,
    slides: [
      { title: 'Indexing & Query Optimization', subtitle: 'B-Trees, Hashing, and Performance Tuning', layout: 'cover', color: '#8b5cf6' },
      { title: 'Why Indexing?', bullets: ['Without index: Full table scan → O(n) for every query', 'With index: Direct lookup → O(log n) or O(1)', 'Trade-off: Faster reads, slightly slower writes (index maintenance)', 'Like a book\'s index — find info without reading every page', 'Crucial for tables with millions+ rows'], icon: '⚡' },
      { title: 'Types of Indexes', bullets: ['📌 Primary Index — On the primary key column (one per table)', '📎 Secondary Index — On non-key columns (multiple per table)', '📕 Clustered Index — Data physically sorted by index key (only one)', '📗 Non-Clustered Index — Separate structure with pointers to data', '🔢 Dense Index — Entry for EVERY record', '📊 Sparse Index — Entry for some records (e.g., one per block)'], icon: '📁' },
      { title: 'B-Tree Structure', bullets: ['Self-balancing search tree with multiple keys per node', 'All leaves at same level → guaranteed O(log n)', 'Order m: each node has at most m children, ⌈m/2⌉ minimum', 'Used for exact match AND range queries', 'Root has at least 2 children (unless it\'s a leaf)', 'Insertion may cause node splits; deletion may cause merges'], icon: '🌳' },
      { title: 'B+ Tree — The Standard', bullets: ['Improved B-Tree: ALL data stored in leaf nodes only', 'Internal nodes only store keys for navigation', 'Leaf nodes are linked as a doubly-linked sorted list', '✅ Excellent for range queries (scan linked leaves)', '✅ More keys fit in internal nodes → shorter tree', '✅ Used by MySQL InnoDB, PostgreSQL, Oracle, SQL Server'], icon: '🌲' },
      { title: 'Hash Indexing', bullets: ['Uses hash function: h(key) → bucket address', '✅ Perfect for exact-match lookups: O(1) average', '❌ Cannot support range queries (WHERE salary > 50000)', '❌ Hash collisions require chaining or open addressing', 'Static Hashing: Fixed number of buckets', 'Dynamic (Extendible) Hashing: Grows/shrinks automatically'], icon: '#️⃣' },
      { title: 'Index Comparison', table: { headers: ['Feature', 'B+ Tree', 'Hash Index'], rows: [['Exact match', 'O(log n)', 'O(1) avg'], ['Range query', '✅ Excellent', '❌ Not supported'], ['Sorted output', '✅ Yes (leaves linked)', '❌ No'], ['Space usage', 'Moderate', 'Variable'], ['Most common', '✅ Default in RDBMS', 'Memory-optimized tables']] } },
      { title: 'Query Optimization Tips', bullets: ['📌 Create indexes on WHERE, JOIN, and ORDER BY columns', '❌ Avoid SELECT * — fetch only needed columns', '✅ Use EXISTS instead of IN for correlated subqueries', '❌ Avoid functions on indexed columns: WHERE YEAR(date) = 2024', '✅ Use EXPLAIN/ANALYZE to view execution plans', '📊 Update statistics regularly for accurate optimizer decisions'], layout: 'summary', icon: '🎯' }
    ]
  },
  {
    id: uuid(), title: 'Relational Algebra & Relational Calculus', description: 'Formal foundations: relational algebra operators, tuple/domain calculus, with solved examples.',
    type: 'ppt', url: '#', module_id: null, thumbnail: null, created_by: teacherId, created_at: now,
    slides: [
      { title: 'Relational Algebra', subtitle: 'Formal Query Languages & Operations', layout: 'cover', color: '#06b6d4' },
      { title: 'What is Relational Algebra?', bullets: ['A procedural query language (step-by-step operations)', 'Foundation of SQL — SQL is based on relational algebra', 'Operations take one or two relations as input, produce one as output', 'Used by query optimizers internally to plan query execution', 'Two types: Unary (one table) and Binary (two tables)'], icon: '🧮' },
      { title: 'Unary Operations', bullets: ['σ (Selection) — Filter rows: σ_age>20(Students)', 'π (Projection) — Choose columns: π_name,age(Students)', 'ρ (Rename) — Rename table/columns: ρ_S(Students)', 'Selection = WHERE clause in SQL', 'Projection = Column list in SELECT clause'], icon: '🔍' },
      { title: 'Binary Operations — Set', bullets: ['∪ (Union) — All tuples from both relations (no duplicates)', '∩ (Intersection) — Only tuples present in BOTH relations', '— (Difference) — Tuples in R1 but NOT in R2', '× (Cartesian Product) — Every combination of tuples', 'Union-compatible: same number of columns, same domains'], icon: '➕' },
      { title: 'Join Operations', bullets: ['⋈ (Natural Join) — Match on ALL common attributes automatically', '⋈_θ (Theta Join) — Join with any condition (=, <, >, ≠)', '⋈_= (Equi-Join) — Theta join with only equality conditions', '⟕ (Left Outer Join) — All left tuples + matching right', '⟖ (Right Outer Join) — All right tuples + matching left', '⟗ (Full Outer Join) — All tuples from both sides'], icon: '🔗' },
      { title: 'Division Operation', bullets: ['R ÷ S — Find tuples in R associated with ALL tuples in S', 'Example: "Find students enrolled in ALL courses"', 'Equivalent to double NOT EXISTS in SQL', 'R(A,B) ÷ S(B) = π_A(R) — π_A((π_A(R) × S) — R)', 'One of the most complex relational algebra operations'], icon: '➗' },
      { title: 'Relational Calculus', bullets: ['Tuple Relational Calculus (TRC) — Non-procedural, declarative', '{ t | P(t) } — "Set of tuples t such that predicate P is true"', 'Domain Relational Calculus (DRC) — Operates on domain values', '{ <x₁, x₂> | P(x₁, x₂) } — "Set of domain values satisfying P"', 'SQL is primarily based on TRC', 'Algebra = HOW (procedural), Calculus = WHAT (declarative)'], icon: '📐' },
      { title: 'Algebra ↔ SQL Equivalence', table: { headers: ['Algebra', 'SQL Equivalent', 'Example'], rows: [['σ (Select)', 'WHERE clause', 'σ_age>20(S) → WHERE age>20'], ['π (Project)', 'SELECT columns', 'π_name(S) → SELECT name'], ['⋈ (Join)', 'JOIN ... ON', '⋈ → INNER JOIN'], ['∪ (Union)', 'UNION', 'R ∪ S → R UNION S'], ['— (Diff)', 'EXCEPT', 'R-S → R EXCEPT S'], ['÷ (Division)', 'NOT EXISTS NOT EXISTS', 'Double negation pattern']] } }
    ]
  },
  {
    id: uuid(), title: 'Database Security & Authorization', description: 'Database security concepts: access control, SQL injection prevention, RBAC, audit trails, and encryption.',
    type: 'ppt', url: '#', module_id: null, thumbnail: null, created_by: teacherId, created_at: now,
    slides: [
      { title: 'Database Security', subtitle: 'Authorization, Access Control & Threat Prevention', layout: 'cover', color: '#e11d48' },
      { title: 'Why Database Security?', bullets: ['Databases store the most valuable asset — DATA', 'Breaches cost millions in damages and reputation', 'Regulatory compliance: GDPR, HIPAA, PCI-DSS', 'Insider threats are as dangerous as external attacks', 'Security must be implemented at multiple layers'], icon: '🛡️' },
      { title: 'Access Control Models', bullets: ['DAC (Discretionary) — Owner grants/revokes permissions', 'MAC (Mandatory) — System-enforced security labels (Top Secret, Secret, etc.)', 'RBAC (Role-Based) — Permissions assigned to roles, users get roles', 'GRANT SELECT ON students TO professor_role;', 'REVOKE INSERT ON grades FROM student_role;'], icon: '🔐' },
      { title: 'SQL Injection', bullets: ['#1 web application vulnerability (OWASP Top 10)', 'Attacker injects malicious SQL through user input', 'Example: Input: \' OR 1=1 -- bypasses login', 'Query becomes: SELECT * FROM users WHERE user=\'\' OR 1=1 --\'', '❌ Never concatenate user input into SQL strings', '✅ Use parameterized queries / prepared statements ALWAYS'], icon: '💉' },
      { title: 'Prevention Techniques', bullets: ['✅ Parameterized Queries — Separate code from data', '✅ Input Validation — Whitelist allowed characters', '✅ Least Privilege — Give minimum required permissions', '✅ Stored Procedures — Pre-compiled, harder to inject', '✅ WAF (Web Application Firewall) — Filter malicious requests', '✅ Regular Security Audits — Scan for vulnerabilities'], icon: '🧱' },
      { title: 'Encryption', bullets: ['🔒 Encryption at Rest — Data encrypted on disk (AES-256)', '🔐 Encryption in Transit — TLS/SSL for network communication', '🔑 Transparent Data Encryption (TDE) — Automatic, app-transparent', '#️⃣ Hashing — One-way for passwords (bcrypt, argon2)', 'Never store passwords in plain text!', 'Column-level encryption for sensitive fields (SSN, credit cards)'], icon: '🔒' },
      { title: 'Audit & Monitoring', bullets: ['📋 Audit Trails — Log all data access and modifications', '👁️ Monitor failed login attempts and unusual queries', '⏰ Real-time alerting for suspicious activity', '📊 Regular compliance reporting', '🔍 Database Activity Monitoring (DAM) tools', 'Retain logs for regulatory required periods'], layout: 'summary', icon: '📋' }
    ]
  }
];

for (const p of pptMaterials) db.insert('materials', p);
console.log(`📑 Created ${pptMaterials.length} in-browser presentations`);

// --- Quiz 5: Advanced Scenario-Based Quiz ---
const quiz5Id = uuid();
db.insert('quizzes', {
  id: quiz5Id, title: 'Advanced DBMS Scenarios', description: 'Challenging scenario-based questions testing deep understanding of DBMS concepts. Requires analytical thinking and application of multiple concepts.',
  module_id: null, time_limit_minutes: 20, total_points: 12, is_active: 1, created_by: teacherId, created_at: now
});

const q5 = [
  {
    text: 'A university database has: Student(SID, Name, DeptID), Department(DeptID, DeptName, HOD_ID), Faculty(FID, Name). The functional dependencies are: SID→Name,DeptID; DeptID→DeptName,HOD_ID; FID→Name. The Student table is in which normal form?',
    a: '1NF — because it has repeating groups',
    b: '2NF — because all non-key attributes depend on the full primary key',
    c: '3NF — because there are no transitive dependencies in Student',
    d: 'BCNF — because every determinant is a superkey',
    correct: 'C',
    explanation: 'Student(SID→Name,DeptID) has SID as the only candidate key. Name and DeptID both depend directly on SID with no transitive dependency within this table. DeptID→DeptName,HOD_ID is a dependency in the Department table, not Student. So Student is in 3NF.',
    points: 2
  },
  {
    text: 'Consider two transactions: T1 reads A, writes A, reads B, writes B. T2 reads A, reads B, writes B. Schedule: T1:R(A), T2:R(A), T1:W(A), T2:R(B), T1:R(B), T1:W(B), T2:W(B). Is this schedule conflict-serializable?',
    a: 'Yes, it is equivalent to T1→T2',
    b: 'Yes, it is equivalent to T2→T1',
    c: 'No, because the precedence graph has a cycle',
    d: 'Cannot be determined without knowing the values',
    correct: 'C',
    explanation: 'Build precedence graph: T1:R(A) before T2:R(A) — no conflict (both reads). T2:R(A) before T1:W(A) — conflict: T2→T1. T1:R(B) before T2:W(B) — conflict: T1→T2. This creates a cycle T1→T2→T1, so NOT conflict-serializable.',
    points: 2
  },
  {
    text: 'A B+ tree of order 4 (max 3 keys per node) contains values 1-15 inserted in order. After deleting keys 5, 7, and 11, what is the minimum height of the resulting tree?',
    a: '1 (just root with children)',
    b: '2 (root, one level of internal nodes, leaves)',
    c: '3 (three levels)',
    d: '0 (all data fits in root)',
    correct: 'B',
    explanation: 'With 12 remaining values in a B+ tree of order 4, each leaf can hold 2-3 keys. Minimum leaves needed = ceil(12/3) = 4 leaves. An internal node can hold 2-4 children. 4 leaves need at least 2 internal nodes under a root, giving height = 2.',
    points: 1
  },
  {
    text: 'Given relation R(A,B,C,D,E) with FDs: A→BC, CD→E, B→D, E→A. What are all the candidate keys?',
    a: 'A only',
    b: 'A and E',
    c: 'A, E, BC, and CD',
    d: 'A, E, and CD',
    correct: 'C',
    explanation: 'A→BC→D(via B→D), and CD→E, so A→ABCDE (A is a candidate key). E→A→ABCDE (E is a candidate key). BC: B→D, so BC→BCD, CD→E, so BC→BCDE, E→A, so BC→ABCDE. CD: CD→E→A→BC, so CD→ABCDE. All four are candidate keys.',
    points: 2
  },
  {
    text: 'In a distributed database, a transaction T needs to update records on servers S1, S2, and S3. During 2-Phase Commit, S1 votes YES, S2 votes YES, but S3 crashes before voting. What should the coordinator do?',
    a: 'Commit the transaction on S1 and S2, abort on S3',
    b: 'Wait indefinitely for S3 to recover and vote',
    c: 'Abort the entire transaction (global abort)',
    d: 'Commit because majority voted YES',
    correct: 'C',
    explanation: 'In 2PC, ALL participants must vote YES for a commit. If any participant fails to vote (or votes NO), the coordinator must issue a global ABORT. 2PC requires unanimity, not majority.',
    points: 1
  },
  {
    text: 'A query "SELECT * FROM Employees WHERE salary > 50000 AND department = \'CS\' ORDER BY name" runs on a table with 100,000 rows. An index exists on (department, salary). Which optimization would the query optimizer most likely choose?',
    a: 'Full table scan with filesort',
    b: 'Use the composite index for department="CS", then filter salary, then filesort for name',
    c: 'Use the index for salary > 50000 only',
    d: 'Create a temporary index on name, then scan',
    correct: 'B',
    explanation: 'The composite index (department, salary) can be used to efficiently find department="CS" rows (first column match), then the index can further narrow by salary > 50000 (range on second column). The ORDER BY name would require a filesort since name is not in the index. This is the most efficient plan.',
    points: 1
  },
  {
    text: 'A table OrderDetails(OrderID, ProductID, Qty, Price, Total) has Total = Qty × Price. Which anomaly does storing Total introduce, and what is the best fix?',
    a: 'Insertion anomaly — add a CHECK constraint',
    b: 'Update anomaly — use a computed/generated column or view',
    c: 'Deletion anomaly — add a trigger',
    d: 'No anomaly — storing derived data is always fine',
    correct: 'B',
    explanation: 'Total is a derived attribute (Qty × Price). Storing it creates an UPDATE anomaly: if Qty or Price changes, Total must also be updated or it becomes inconsistent. The best fix is to use a computed column (generated as Qty*Price) or a view, so Total is always calculated, never stored.',
    points: 1
  },
  {
    text: 'Two transactions execute under Strict 2PL: T1 holds X-lock on record R1 and requests S-lock on R2. T2 holds X-lock on R2 and requests S-lock on R1. What happens?',
    a: 'Both transactions proceed normally',
    b: 'Deadlock occurs — one transaction must be rolled back',
    c: 'T1 proceeds, T2 waits',
    d: 'Both requests are converted to X-locks',
    correct: 'B',
    explanation: 'T1 holds X(R1), wants S(R2) — but T2 holds X(R2), so T1 must wait. T2 holds X(R2), wants S(R1) — but T1 holds X(R1), so T2 must wait. Circular wait = deadlock. The DBMS deadlock detector must abort one transaction.',
    points: 2
  }
];

q5.forEach((q, i) => db.insert('questions', {
  id: uuid(), quiz_id: quiz5Id, question_text: q.text, option_a: q.a, option_b: q.b, option_c: q.c, option_d: q.d,
  correct_option: q.correct, explanation: q.explanation, points: q.points, sort_order: i + 1
}));

// --- Quiz 6: SQL Mastery (Application Level) ---
const quiz6Id = uuid();
db.insert('quizzes', {
  id: quiz6Id, title: 'SQL Mastery Challenge', description: 'Advanced SQL questions requiring query analysis, output prediction, and optimization knowledge. Not for beginners!',
  module_id: modules[3].id, time_limit_minutes: 18, total_points: 10, is_active: 1, created_by: teacherId, created_at: now
});

const q6 = [
  {
    text: 'Given: Employees(EID, Name, DeptID, Salary, MgrID). Write the correct query to find departments where the average salary exceeds the company-wide average salary. Which query is correct?',
    a: 'SELECT DeptID FROM Employees GROUP BY DeptID HAVING AVG(Salary) > AVG(Salary)',
    b: 'SELECT DeptID FROM Employees GROUP BY DeptID HAVING AVG(Salary) > (SELECT AVG(Salary) FROM Employees)',
    c: 'SELECT DeptID FROM Employees WHERE AVG(Salary) > (SELECT AVG(Salary) FROM Employees)',
    d: 'SELECT DeptID, AVG(Salary) FROM Employees HAVING AVG(Salary) > ALL(SELECT AVG(Salary) FROM Employees)',
    correct: 'B',
    explanation: 'Option B correctly uses a correlated subquery in HAVING. Option A compares AVG with itself (always false). Option C uses AVG in WHERE (not allowed). Option D has syntax issues with GROUP BY missing.',
    points: 1
  },
  {
    text: 'What is the output of: SELECT COUNT(*), COUNT(commission) FROM employees; if the table has 10 rows and 3 rows have NULL commission?',
    a: '10, 10',
    b: '10, 7',
    c: '7, 7',
    d: '10, 3',
    correct: 'B',
    explanation: 'COUNT(*) counts ALL rows including NULLs = 10. COUNT(commission) counts only non-NULL values = 10-3 = 7. This is a key distinction in SQL aggregate functions.',
    points: 1
  },
  {
    text: 'To find employees who earn more than EVERY employee in department 10, which operator should be used?',
    a: 'salary > ANY (SELECT salary FROM emp WHERE dept=10)',
    b: 'salary > ALL (SELECT salary FROM emp WHERE dept=10)',
    c: 'salary > SOME (SELECT salary FROM emp WHERE dept=10)',
    d: 'salary IN (SELECT MAX(salary) FROM emp WHERE dept=10)',
    correct: 'B',
    explanation: '> ALL means greater than the maximum value in the subquery result. > ANY/SOME means greater than at least one (the minimum). To beat EVERY employee in dept 10, we need > ALL.',
    points: 1
  },
  {
    text: 'What does this query return? SELECT e1.Name FROM Employees e1 WHERE NOT EXISTS (SELECT 1 FROM Projects p WHERE NOT EXISTS (SELECT 1 FROM Works_On w WHERE w.EID = e1.EID AND w.PID = p.PID))',
    a: 'Employees who work on at least one project',
    b: 'Employees who work on no projects',
    c: 'Employees who work on ALL projects (division)',
    d: 'All employees regardless of projects',
    correct: 'C',
    explanation: 'This is the relational division pattern in SQL. Double NOT EXISTS reads as: "find employees where there is NO project that they do NOT work on" = employees who work on ALL projects.',
    points: 2
  },
  {
    text: 'Given a self-join query: SELECT e.Name AS Employee, m.Name AS Manager FROM Employees e LEFT JOIN Employees m ON e.MgrID = m.EID; — What does LEFT JOIN ensure here?',
    a: 'Only employees with managers are shown',
    b: 'All employees are shown, even those without a manager (CEO)',
    c: 'All managers are shown even if they have no reports',
    d: 'Duplicate rows are added for each manager',
    correct: 'B',
    explanation: 'LEFT JOIN ensures ALL rows from the left table (employees) are included. If an employee has no matching MgrID (like a CEO), they still appear with NULL in the Manager column.',
    points: 1
  },
  {
    text: 'Which of these prevents SQL injection most effectively?',
    a: 'Escaping single quotes in user input',
    b: 'Using parameterized/prepared statements',
    c: 'Validating input length',
    d: 'Using LIMIT 1 in queries',
    correct: 'B',
    explanation: 'Parameterized/prepared statements separate SQL code from data, making injection impossible. Escaping quotes can be bypassed. Input validation and LIMIT don\'t prevent injection at the root cause.',
    points: 1
  },
  {
    text: 'A query runs: SELECT dept, salary, RANK() OVER (PARTITION BY dept ORDER BY salary DESC) as rnk FROM employees; — What does RANK() return for two employees with the same highest salary in a department?',
    a: 'Both get rank 1, next gets rank 2',
    b: 'Both get rank 1, next gets rank 3',
    c: 'First gets rank 1, second gets rank 2',
    d: 'Both get rank 0',
    correct: 'B',
    explanation: 'RANK() assigns the same rank for ties and SKIPS the next rank(s). Two employees tied at rank 1, so the next employee gets rank 3 (not 2). DENSE_RANK() would give rank 2 instead.',
    points: 1
  },
  {
    text: 'What is wrong with this query? DELETE FROM orders WHERE order_date < "2024-01-01" AND customer_id IN (SELECT customer_id FROM orders WHERE total > 1000)',
    a: 'Cannot use subquery in DELETE',
    b: 'The subquery references the same table being deleted (may cause issues in MySQL)',
    c: 'AND cannot combine with IN',
    d: 'Nothing is wrong',
    correct: 'B',
    explanation: 'In MySQL, you cannot modify a table and select from the same table in a subquery within the same statement. This throws an error. Solution: use a derived table/CTE, or a temporary table. PostgreSQL handles this correctly though.',
    points: 2
  }
];

q6.forEach((q, i) => db.insert('questions', {
  id: uuid(), quiz_id: quiz6Id, question_text: q.text, option_a: q.a, option_b: q.b, option_c: q.c, option_d: q.d,
  correct_option: q.correct, explanation: q.explanation, points: q.points, sort_order: i + 1
}));

console.log('📝 Created 6 quizzes (including 2 advanced scenario-based)');

console.log('');
console.log('🎉 Database seeded successfully!');
console.log('');
console.log('=== Demo Credentials ===');
console.log('Teacher: prof_sharma / password123');
console.log('Student: rahul_student / password123');
console.log('Student: priya_student / password123');
console.log('Student: amit_student / password123');
