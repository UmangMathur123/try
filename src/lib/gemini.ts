// Intelligent AI Interview Engine - No external API needed
// Uses comprehensive question banks + NLP-based evaluation

interface QuestionGenResult {
  question: string;
  category: string;
  difficulty: number;
}

interface EvaluationResult {
  relevanceScore: number;
  clarityScore: number;
  depthScore: number;
  correctnessScore: number;
  totalScore: number;
  feedback: string;
}

// ============================================================
// COMPREHENSIVE QUESTION BANKS
// ============================================================

const introQuestions = [
  "Tell me about yourself and your professional journey so far.",
  "What motivated you to apply for this position?",
  "Walk me through your most impactful project or accomplishment.",
  "What are your key strengths that make you suitable for this role?",
  "Where do you see yourself professionally in the next 3-5 years?",
];

const technicalQuestionsBySkill: Record<string, { easy: string[]; medium: string[]; hard: string[] }> = {
  javascript: {
    easy: [
      "Explain the difference between var, let, and const in JavaScript.",
      "What are closures in JavaScript? Give an example.",
      "Explain the concept of hoisting in JavaScript.",
      "What is the difference between == and === operators?",
    ],
    medium: [
      "Explain the event loop in JavaScript. How does asynchronous code execution work?",
      "What are Promises and how do they differ from callbacks? Explain async/await.",
      "Describe prototypal inheritance in JavaScript. How does it differ from classical inheritance?",
      "Explain the concept of debouncing and throttling. When would you use each?",
    ],
    hard: [
      "Design a custom implementation of Promise.all(). Handle edge cases like empty arrays and rejected promises.",
      "Explain memory leaks in JavaScript applications. How would you detect and prevent them?",
      "Describe how you would implement a virtual DOM diffing algorithm from scratch.",
      "Explain the internals of JavaScript engines like V8. How does JIT compilation work?",
    ],
  },
  python: {
    easy: [
      "What are the key differences between lists and tuples in Python?",
      "Explain decorators in Python with an example.",
      "What is the difference between deep copy and shallow copy?",
      "Describe Python's garbage collection mechanism.",
    ],
    medium: [
      "Explain Python's GIL (Global Interpreter Lock). How does it affect multithreading?",
      "What are generators in Python? How do they differ from regular functions?",
      "Describe metaclasses in Python. When would you use them?",
      "Explain context managers in Python. How would you implement a custom one?",
    ],
    hard: [
      "Design a thread-safe singleton pattern in Python that works with multiprocessing.",
      "Explain how Python's memory management works internally, including reference counting and the gc module.",
      "How would you implement a concurrent web scraper in Python handling rate limiting and retries?",
      "Describe how you would build a custom ORM in Python using descriptors and metaclasses.",
    ],
  },
  react: {
    easy: [
      "What is the virtual DOM and how does React use it?",
      "Explain the difference between functional and class components.",
      "What are React hooks? Name the most commonly used ones.",
      "How does state management work in React?",
    ],
    medium: [
      "Explain the React reconciliation algorithm. How does diffing work?",
      "What is the purpose of useMemo and useCallback? When should you use them?",
      "Describe the Context API. When would you use it vs Redux?",
      "How do you handle error boundaries in React?",
    ],
    hard: [
      "How would you implement server-side rendering from scratch in a React application?",
      "Design a state management solution that handles optimistic updates and rollbacks.",
      "Explain React Fiber architecture. How does time-slicing work?",
      "How would you build a custom React renderer for a non-DOM target?",
    ],
  },
  java: {
    easy: [
      "Explain the difference between abstract classes and interfaces in Java.",
      "What is the significance of the final keyword in Java?",
      "Describe the Java Collections framework. Name key interfaces and implementations.",
      "What is the difference between checked and unchecked exceptions?",
    ],
    medium: [
      "Explain the Java Memory Model. What are the different memory areas in JVM?",
      "How does garbage collection work in Java? Describe different GC algorithms.",
      "What are design patterns? Explain the Observer and Strategy patterns with examples.",
      "Describe multithreading in Java. What are thread pools and ExecutorService?",
    ],
    hard: [
      "Design a custom thread-safe connection pool in Java with proper resource management.",
      "Explain how ClassLoaders work in Java. How would you implement a custom ClassLoader?",
      "How would you design a distributed caching solution using Java?",
      "Describe how you would implement a custom annotation processor in Java.",
    ],
  },
  'data structures': {
    easy: [
      "Explain the difference between arrays and linked lists. When would you use each?",
      "What is a hash table? How does hashing work?",
      "Describe the stack and queue data structures with real-world examples.",
      "What is a binary search tree? What are its time complexities?",
    ],
    medium: [
      "Explain balanced binary trees (AVL/Red-Black). Why are they important?",
      "Describe graph traversal algorithms (BFS and DFS). Compare their use cases.",
      "What is a trie? How would you use it for autocomplete functionality?",
      "Explain the heap data structure. How is it used in priority queues?",
    ],
    hard: [
      "Design a data structure that supports insert, delete, and getRandom in O(1) time.",
      "Explain B-trees and B+ trees. Why are they used in databases?",
      "How would you implement an LRU cache with O(1) time complexity for all operations?",
      "Describe skip lists and their advantages over balanced BSTs.",
    ],
  },
  'system design': {
    easy: [
      "What is the difference between horizontal and vertical scaling?",
      "Explain the concept of load balancing. Name different load balancing strategies.",
      "What is caching? Describe different caching strategies.",
      "Explain the CAP theorem and its implications.",
    ],
    medium: [
      "How would you design a URL shortening service like bit.ly?",
      "Explain microservices architecture. What are its pros and cons vs monolithic?",
      "How would you design a notification system that handles millions of notifications?",
      "Describe database sharding strategies. When would you use each?",
    ],
    hard: [
      "Design a scalable API service handling one million requests per day with high availability.",
      "How would you design a real-time chat application like WhatsApp?",
      "Design a distributed file storage system similar to Google Drive.",
      "How would you architect a recommendation engine for an e-commerce platform?",
    ],
  },
  sql: {
    easy: [
      "What is the difference between INNER JOIN, LEFT JOIN, and RIGHT JOIN?",
      "Explain database normalization. What are the normal forms?",
      "What are indexes in databases? How do they improve query performance?",
      "Describe the difference between WHERE and HAVING clauses.",
    ],
    medium: [
      "Explain ACID properties in databases. Why are they important?",
      "What are database transactions? Explain isolation levels.",
      "How would you optimize a slow-performing SQL query?",
      "Describe window functions in SQL with practical examples.",
    ],
    hard: [
      "Design a database schema for an e-commerce platform handling millions of products and orders.",
      "Explain database replication strategies. How do you handle consistency?",
      "How would you implement a full-text search engine using SQL databases?",
      "Describe how database query optimizers work internally.",
    ],
  },
  nodejs: {
    easy: [
      "What is Node.js and how does it differ from browser JavaScript?",
      "Explain the Node.js event loop and its phases.",
      "What is npm? How does package management work in Node.js?",
      "Describe the difference between require and import in Node.js.",
    ],
    medium: [
      "How does Node.js handle concurrent requests despite being single-threaded?",
      "Explain streams in Node.js. What are the different types of streams?",
      "How would you implement error handling in an Express.js application?",
      "Describe clustering in Node.js. How does it improve performance?",
    ],
    hard: [
      "Design a real-time collaborative editing system using Node.js.",
      "How would you implement a task queue system with Node.js for handling background jobs?",
      "Explain how you would detect and fix memory leaks in a Node.js production application.",
      "Build a custom middleware framework similar to Express.js from scratch.",
    ],
  },
  'machine learning': {
    easy: [
      "What is the difference between supervised and unsupervised learning?",
      "Explain overfitting and underfitting. How do you prevent them?",
      "What is the bias-variance tradeoff?",
      "Describe the K-Nearest Neighbors algorithm.",
    ],
    medium: [
      "Explain gradient descent and its variants (SGD, Adam, RMSProp).",
      "What are neural networks? Describe forward and backward propagation.",
      "How do you handle imbalanced datasets in classification problems?",
      "Explain regularization techniques (L1, L2, Dropout).",
    ],
    hard: [
      "Design an end-to-end ML pipeline for a recommendation system.",
      "Explain transformer architecture. How does self-attention work?",
      "How would you deploy and serve ML models at scale with low latency?",
      "Describe how you would implement a custom loss function for a multi-task learning problem.",
    ],
  },
  'cloud computing': {
    easy: [
      "What is cloud computing? Explain IaaS, PaaS, and SaaS.",
      "What are containers? How does Docker work?",
      "Explain the concept of serverless computing.",
      "What is a CDN and how does it improve performance?",
    ],
    medium: [
      "Describe Kubernetes and container orchestration.",
      "How would you design a CI/CD pipeline for a microservices architecture?",
      "Explain AWS Lambda and event-driven architecture.",
      "What are the best practices for securing cloud infrastructure?",
    ],
    hard: [
      "Design a multi-region disaster recovery strategy for a critical application.",
      "How would you architect a hybrid cloud solution for a large enterprise?",
      "Explain how you would implement a zero-downtime deployment strategy.",
      "Design a cost-optimized cloud architecture for a startup scaling from 1K to 1M users.",
    ],
  },
  'api design': {
    easy: [
      "What is REST? Explain the key principles of RESTful API design.",
      "What are HTTP methods (GET, POST, PUT, DELETE) and when to use each?",
      "Explain API versioning strategies.",
      "What is the difference between REST and GraphQL?",
    ],
    medium: [
      "How would you design an API rate limiting system?",
      "Explain OAuth 2.0 and JWT-based authentication for APIs.",
      "What are HATEOAS and Richardson Maturity Model?",
      "How do you handle API pagination for large datasets?",
    ],
    hard: [
      "Design a public API platform with developer portal, API keys, and usage analytics.",
      "How would you implement API gateway pattern for a microservices architecture?",
      "Design a real-time API using WebSockets with fallback to long polling.",
      "How would you build a backward-compatible API evolution strategy?",
    ],
  },
};

const analyticalQuestions = [
  "You discover a critical bug in production at 2 AM. Walk me through your approach to diagnose and fix it.",
  "Your team needs to choose between refactoring legacy code and building a new feature. How do you make this decision?",
  "How would you approach optimizing a system that has become slow as the user base grew 10x?",
  "Describe how you would estimate the number of servers needed for a new application launch.",
  "Your application is intermittently failing. How would you systematically troubleshoot the issue?",
  "A stakeholder wants a feature delivered in 2 weeks but your estimate is 6 weeks. How do you handle this?",
];

const managerialQuestions = [
  "How do you approach mentoring junior developers on your team?",
  "Describe a situation where you had to resolve a conflict within your team.",
  "How do you prioritize tasks when managing multiple deadlines?",
  "What strategies do you use to ensure code quality across the team?",
  "How would you handle a team member who consistently underperforms?",
  "Describe your approach to conducting effective code reviews.",
];

const closingQuestions = [
  "Do you have any questions about the role or the company?",
  "Is there anything else you'd like to share about your experience or skills?",
  "What excites you most about the opportunity to work with us?",
];

// Default questions for skills not in the bank
const defaultTechnicalQuestions = {
  easy: [
    "Explain the fundamental concepts of your area of expertise.",
    "What tools and technologies are you most proficient with?",
    "Describe a recent project where you applied your technical skills.",
    "What best practices do you follow in your daily work?",
  ],
  medium: [
    "How do you approach debugging complex issues in your domain?",
    "Describe your experience with testing methodologies in your field.",
    "How do you stay up-to-date with the latest trends in your area?",
    "Explain a challenging technical problem you solved recently.",
  ],
  hard: [
    "Design a solution for a large-scale system in your area of expertise.",
    "How would you architect a system that needs to handle 10x growth?",
    "Describe how you would implement a production monitoring strategy.",
    "How would you lead a technical initiative to modernize a legacy system?",
  ],
};

// ============================================================
// QUESTION GENERATION ENGINE
// ============================================================

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function generateQuestion(
  jobTitle: string,
  jobDescription: string,
  candidateSkills: string[],
  previousQuestions: string[],
  stage: string,
  questionNumber: number,
  totalQuestions: number
): QuestionGenResult {
  const prevSet = new Set(previousQuestions.map((q) => q.toLowerCase()));

  function findUnique(questions: string[]): string {
    const shuffled = shuffleArray(questions);
    for (const q of shuffled) {
      if (!prevSet.has(q.toLowerCase())) return q;
    }
    return shuffled[0]; // fallback
  }

  switch (stage) {
    case 'INTRO': {
      return {
        question: findUnique(introQuestions),
        category: 'INTRO',
        difficulty: 1,
      };
    }

    case 'TECHNICAL': {
      // Determine difficulty based on question progression
      const progress = questionNumber / totalQuestions;
      let diffLevel: 'easy' | 'medium' | 'hard' = 'easy';
      if (progress > 0.6) diffLevel = 'hard';
      else if (progress > 0.3) diffLevel = 'medium';

      // Find matching skill questions
      const normalizedSkills = candidateSkills.map((s) => s.toLowerCase().trim());
      let questions: string[] = [];

      for (const skill of normalizedSkills) {
        const skillBank = technicalQuestionsBySkill[skill];
        if (skillBank) {
          questions = [...questions, ...skillBank[diffLevel]];
        }
      }

      // Fallback to default if no skill-specific questions
      if (questions.length === 0) {
        questions = defaultTechnicalQuestions[diffLevel];
      }

      // Add job-context prefix for personalization
      const baseQuestion = findUnique(questions);
      const contextPrefix =
        diffLevel === 'hard'
          ? `In the context of ${jobTitle}, `
          : '';

      return {
        question: contextPrefix + baseQuestion,
        category: 'TECHNICAL',
        difficulty: diffLevel === 'easy' ? 2 : diffLevel === 'medium' ? 3 : 4,
      };
    }

    case 'ANALYTICAL': {
      return {
        question: findUnique(analyticalQuestions),
        category: 'ANALYTICAL',
        difficulty: 3,
      };
    }

    case 'MANAGERIAL': {
      return {
        question: findUnique(managerialQuestions),
        category: 'MANAGERIAL',
        difficulty: 3,
      };
    }

    case 'CLOSING': {
      return {
        question: findUnique(closingQuestions),
        category: 'CLOSING',
        difficulty: 1,
      };
    }

    default: {
      return {
        question: findUnique(introQuestions),
        category: 'INTRO',
        difficulty: 1,
      };
    }
  }
}

// ============================================================
// RESPONSE EVALUATION ENGINE
// ============================================================

// Key concepts for technical evaluation
const technicalKeywords: Record<string, string[]> = {
  javascript: ['function', 'closure', 'prototype', 'async', 'promise', 'event loop', 'scope', 'callback', 'hoisting', 'this', 'arrow function', 'module', 'variable', 'const', 'let'],
  python: ['decorator', 'generator', 'list comprehension', 'class', 'inheritance', 'GIL', 'threading', 'async', 'context manager', 'metaclass', 'dictionary', 'tuple'],
  react: ['component', 'state', 'props', 'hook', 'render', 'virtual dom', 'jsx', 'lifecycle', 'effect', 'context', 'redux', 'memo', 'callback', 'ref'],
  java: ['class', 'interface', 'abstract', 'inheritance', 'polymorphism', 'thread', 'collection', 'stream', 'annotation', 'generics', 'JVM', 'garbage collection'],
  'data structures': ['array', 'linked list', 'tree', 'graph', 'hash', 'stack', 'queue', 'heap', 'sort', 'search', 'complexity', 'O(n)', 'algorithm', 'recursion'],
  'system design': ['scalability', 'load balancer', 'cache', 'database', 'microservice', 'API', 'queue', 'partition', 'replication', 'consistency', 'availability', 'latency'],
  sql: ['query', 'join', 'index', 'normalization', 'transaction', 'ACID', 'table', 'schema', 'foreign key', 'primary key', 'aggregate', 'subquery'],
  'machine learning': ['model', 'training', 'feature', 'accuracy', 'loss', 'gradient', 'neural', 'classification', 'regression', 'overfitting', 'validation', 'dataset'],
};

const communicationIndicators = {
  good: ['for example', 'specifically', 'in other words', 'such as', 'firstly', 'secondly', 'moreover', 'furthermore', 'in conclusion', 'to summarize', 'the key point', 'importantly'],
  structure: ['.', ',', ':', ';', '-', '•', '1.', '2.', '3.'],
};

export function evaluateResponse(
  question: string,
  answer: string,
  category: string,
  candidateSkills: string[],
  jobTitle: string,
  voiceConfidence: number = 0.8 // 0-1 scale from speech recognition
): EvaluationResult {
  if (!answer || answer.trim().length === 0) {
    return {
      relevanceScore: 0,
      clarityScore: 0,
      depthScore: 0,
      correctnessScore: 0,
      totalScore: 0,
      feedback: 'No response provided. Please provide a detailed answer.',
    };
  }

  const answerLower = answer.toLowerCase();
  const wordCount = answer.split(/\s+/).filter(Boolean).length;
  const sentenceCount = answer.split(/[.!?]+/).filter(Boolean).length;

  // ---- RELEVANCE SCORE ----
  let relevanceScore = 5; // base score
  // Check if answer contains question-related keywords
  const questionWords = question.toLowerCase().split(/\s+/).filter((w) => w.length > 4);
  const relevantWordsCount = questionWords.filter((w) => answerLower.includes(w)).length;
  relevanceScore += Math.min(3, (relevantWordsCount / Math.max(1, questionWords.length)) * 5);
  
  // Penalty for very short answers
  if (wordCount < 10) relevanceScore -= 2;
  if (wordCount < 5) relevanceScore -= 2;
  // Bonus for substantial answers
  if (wordCount > 50) relevanceScore += 1;
  if (wordCount > 100) relevanceScore += 1;

  // ---- CLARITY SCORE ----
  let clarityScore = 5;
  // Check for structured response
  const hasStructure = communicationIndicators.good.some((indicator) => answerLower.includes(indicator));
  if (hasStructure) clarityScore += 2;
  // Average sentence length (too long = unclear)
  const avgSentenceLength = wordCount / Math.max(1, sentenceCount);
  if (avgSentenceLength >= 8 && avgSentenceLength <= 25) clarityScore += 1;
  if (sentenceCount >= 3) clarityScore += 1;
  // Penalize very short responses
  if (wordCount < 15) clarityScore -= 2;
  if (wordCount > 30) clarityScore += 1;
  
  // Voice clarity factor from speech recognition confidence
  if (voiceConfidence > 0) {
    if (voiceConfidence >= 0.85) clarityScore += 1.5; // Excellent voice clarity
    else if (voiceConfidence >= 0.70) clarityScore += 0.5; // Good voice clarity
    else if (voiceConfidence < 0.40) clarityScore -= 1.5; // Poor voice clarity
    else if (voiceConfidence < 0.55) clarityScore -= 0.5; // Below average clarity
  }

  // ---- DEPTH SCORE ----
  let depthScore = 4;
  if (wordCount > 30) depthScore += 1;
  if (wordCount > 60) depthScore += 1;
  if (wordCount > 100) depthScore += 1;
  if (wordCount > 150) depthScore += 1;
  if (sentenceCount > 3) depthScore += 1;
  // Check for examples
  if (answerLower.includes('example') || answerLower.includes('for instance') || answerLower.includes('such as')) depthScore += 1;

  // ---- CORRECTNESS SCORE ----
  let correctnessScore = 5;
  if (category === 'TECHNICAL') {
    // Check for technical keywords based on candidate skills
    const normalizedSkills = candidateSkills.map((s) => s.toLowerCase().trim());
    let techKeywordsFound = 0;
    let totalTechKeywords = 0;

    for (const skill of normalizedSkills) {
      const keywords = technicalKeywords[skill] || [];
      totalTechKeywords += keywords.length;
      techKeywordsFound += keywords.filter((k) => answerLower.includes(k)).length;
    }

    if (totalTechKeywords > 0) {
      const keywordRatio = techKeywordsFound / totalTechKeywords;
      correctnessScore += Math.min(4, keywordRatio * 15);
    } else {
      // No skill-specific keywords, use generic assessment
      if (wordCount > 50) correctnessScore += 2;
      if (wordCount > 100) correctnessScore += 1;
    }
  } else {
    // Non-technical questions: assess based on completeness
    if (wordCount > 30) correctnessScore += 1;
    if (wordCount > 60) correctnessScore += 2;
    if (hasStructure) correctnessScore += 1;
  }

  // Clamp all scores to 0-10
  relevanceScore = Math.max(0, Math.min(10, Math.round(relevanceScore * 10) / 10));
  clarityScore = Math.max(0, Math.min(10, Math.round(clarityScore * 10) / 10));
  depthScore = Math.max(0, Math.min(10, Math.round(depthScore * 10) / 10));
  correctnessScore = Math.max(0, Math.min(10, Math.round(correctnessScore * 10) / 10));

  const totalScore = Math.round(((relevanceScore + clarityScore + depthScore + correctnessScore) / 4) * 10) / 10;

  // Generate feedback
  const feedback = generateFeedback(relevanceScore, clarityScore, depthScore, correctnessScore, wordCount, category);

  return {
    relevanceScore,
    clarityScore,
    depthScore,
    correctnessScore,
    totalScore,
    feedback,
  };
}

function generateFeedback(
  relevance: number,
  clarity: number,
  depth: number,
  correctness: number,
  wordCount: number,
  category: string
): string {
  const parts: string[] = [];

  // Overall assessment
  const avg = (relevance + clarity + depth + correctness) / 4;
  if (avg >= 8) {
    parts.push('Excellent response! Your answer demonstrates strong understanding.');
  } else if (avg >= 6) {
    parts.push('Good response with solid coverage of the topic.');
  } else if (avg >= 4) {
    parts.push('Adequate response, but there is room for improvement.');
  } else {
    parts.push('The response needs significant improvement.');
  }

  // Specific feedback
  if (relevance < 5) parts.push('Try to address the question more directly.');
  if (clarity < 5) parts.push('Consider structuring your answer with clear points.');
  if (depth < 5) parts.push('Provide more detailed explanations and examples.');
  if (correctness < 5 && category === 'TECHNICAL') {
    parts.push('Include more technical details and domain-specific concepts.');
  }

  if (wordCount < 20) {
    parts.push('Your answer is quite brief. Elaborate more to showcase your knowledge.');
  }

  if (depth >= 7 && clarity >= 7) {
    parts.push('Great use of structured reasoning and detailed examples!');
  }

  return parts.join(' ');
}

// ============================================================
// INTERVIEW FLOW MANAGEMENT
// ============================================================

export interface InterviewPlan {
  stages: { stage: string; count: number }[];
  totalQuestions: number;
}

export function createInterviewPlan(jobTitle: string, experienceMin: number): InterviewPlan {
  const isManagerial = jobTitle.toLowerCase().includes('manager') ||
    jobTitle.toLowerCase().includes('lead') ||
    jobTitle.toLowerCase().includes('director') ||
    jobTitle.toLowerCase().includes('head') ||
    experienceMin >= 5;

  const stages = [
    { stage: 'INTRO', count: 2 },
    { stage: 'TECHNICAL', count: isManagerial ? 3 : 4 },
    { stage: 'ANALYTICAL', count: 2 },
    ...(isManagerial ? [{ stage: 'MANAGERIAL', count: 2 }] : []),
    { stage: 'CLOSING', count: 1 },
  ];

  const totalQuestions = stages.reduce((sum, s) => sum + s.count, 0);

  return { stages, totalQuestions };
}

export function getNextStage(plan: InterviewPlan, currentIndex: number): string {
  let count = 0;
  for (const stage of plan.stages) {
    count += stage.count;
    if (currentIndex < count) return stage.stage;
  }
  return 'CLOSING';
}
