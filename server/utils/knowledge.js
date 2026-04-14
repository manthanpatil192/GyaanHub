/**
 * Local Knowledge Base for DBMS Doubts
 * Provides instant answers for common database concepts for the GyaanHub platform.
 */
export const knowledgeBase = [
  {
    keywords: ["normalization", "normal forms", "1nf", "2nf", "3nf", "bcnf"],
    answer: "Normalization is the process of organizing data in a database to reduce redundancy and improve data integrity. \n\n- **1NF**: Atomic values, no repeating groups.\n- **2NF**: 1NF + no partial functional dependencies.\n- **3NF**: 2NF + no transitive functional dependencies.\n- **BCNF**: A stronger version of 3NF where every determinant is a candidate key."
  },
  {
    keywords: ["sql", "structured query language", "what is sql"],
    answer: "SQL (Structured Query Language) is the standard language for managing and manipulating relational databases. It includes sub-languages like:\n- **DDL**: Data Definition (CREATE, ALTER, DROP)\n- **DML**: Data Manipulation (SELECT, INSERT, UPDATE, DELETE)\n- **DCL**: Data Control (GRANT, REVOKE)\n- **TCL**: Transaction Control (COMMIT, ROLLBACK)"
  },
  {
    keywords: ["joins", "inner join", "outer join", "left join", "right join", "cross join"],
    answer: "Joins combine rows from two or more tables based on a related column.\n- **Inner Join**: Returns records with matching values in both tables.\n- **Left Join**: All records from the left table + matches from the right.\n- **Right Join**: All records from the right table + matches from the left.\n- **Full Outer Join**: All records when there is a match in either table."
  },
  {
    keywords: ["primary key", "foreign key", "candidate key", "super key", "unique key"],
    answer: "Keys are used to identify rows uniquely and establish relationships:\n- **Primary Key**: Uniquely identifies each record. Cannot be NULL.\n- **Foreign Key**: A column that refers to the Primary Key of another table.\n- **Candidate Key**: A set of columns that can serve as a primary key.\n- **Unique Key**: Similar to Primary Key but allows one NULL value."
  },
  {
    keywords: ["acid", "transactions", "atomicity", "consistency", "isolation", "durability"],
    answer: "ACID properties ensure reliable database transactions:\n- **Atomicity**: 'All or nothing' execution.\n- **Consistency**: Database stays valid according to rules.\n- **Isolation**: Concurrent transactions don't interfere.\n- **Durability**: Changes are permanent after commit."
  },
  {
    keywords: ["indexes", "indexing", "b-tree", "hash index"],
    answer: "Indexes are data structures used to speed up the retrieval of records. Common types include B-Trees (good for range queries) and Hash Indexes (good for point lookups). However, indexes can slow down INSERT and UPDATE operations."
  },
  {
    keywords: ["er diagram", "entity relationship", "entities", "attributes", "attributes"],
    answer: "An ER Diagram (Entity-Relationship Diagram) visualizes the logical structure of a database using:\n- **Entities**: Objects or concepts (Rectangles).\n- **Attributes**: Properties of entities (Ovals).\n- **Relationships**: Associations between entities (Diamonds)."
  },
  {
    keywords: ["nosql", "relational", "rdbms"],
    answer: "RDBMS (Relational) uses tables with fixed schemas and SQL. NoSQL (Non-relational) uses flexible schemas like Document (MongoDB), Key-Value (Redis), or Graph (Neo4j), making them highly scalable for unstructured data."
  },
  {
    keywords: ["dbms", "database management system", "benefits"],
    answer: "A DBMS (Database Management System) is software that interacts with users, applications, and the database. Benefits include data security, integrity, reduced redundancy, and concurrent access control."
  }
];

export function findAnswer(query) {
  const normalizedQuery = query.toLowerCase();
  
  // Scoring system for best match
  let bestMatch = null;
  let maxScore = 0;

  for (const item of knowledgeBase) {
    let score = 0;
    for (const keyword of item.keywords) {
      if (normalizedQuery.includes(keyword)) {
        score += keyword.length; // Longer matches carry more weight
      }
    }
    
    if (score > maxScore) {
      maxScore = score;
      bestMatch = item.answer;
    }
  }

  return bestMatch;
}
