
import { Quiz } from "@/types/quiz";

export const sampleQuiz: Quiz = {
  id: "1",
  title: "Web Development Fundamentals",
  description: "Test your knowledge of web development basics",
  questions: [
    {
      id: "q1",
      type: "MCQ",
      text: "What does HTML stand for?",
      choices: [
        { id: "a", text: "Hyper Text Markup Language" },
        { id: "b", text: "High Tech Modern Language" },
        { id: "c", text: "Hyper Transfer Markup Language" },
        { id: "d", text: "Hybrid Text Makeup Language" },
      ],
      correctAnswer: "a",
      explanation: "HTML (Hyper Text Markup Language) is the standard markup language for creating web pages.",
    },
    {
      id: "q2",
      type: "MCQ",
      text: "Which of these is a CSS preprocessor?",
      choices: [
        { id: "a", text: "SASS" },
        { id: "b", text: "Java" },
        { id: "c", text: "Python" },
        { id: "d", text: "Ruby" },
      ],
      correctAnswer: "a",
      explanation: "SASS (Syntactically Awesome Style Sheets) is a CSS preprocessor that extends CSS functionality.",
    },
    {
      id: "q3",
      type: "MCQ",
      text: "Which of these is NOT a JavaScript framework?",
      choices: [
        { id: "a", text: "React" },
        { id: "b", text: "Angular" },
        { id: "c", text: "Python" },
        { id: "d", text: "Vue" },
      ],
      correctAnswer: "c",
      explanation: "Python is a programming language, not a JavaScript framework. React, Angular, and Vue are all JavaScript frameworks.",
    },
    {
      id: "q5",
      type: "MCQ",
      text: "Which of these is NOT a JavaScript framework?",
      choices: [
        { id: "a", text: "React" },
        { id: "b", text: "Angular" },
        { id: "c", text: "Python" },
        { id: "d", text: "Vue" },
      ],
      correctAnswer: "c",
      explanation: "Python is a programming language, not a JavaScript framework. React, Angular, and Vue are all JavaScript frameworks.",
    },
    {
      id: "q4",
      type: "MCQ",
      text: "Which of these is NOT a JavaScript framework?",
      choices: [
        { id: "a", text: "React" },
        { id: "b", text: "Angular" },
        { id: "c", text: "Python" },
        { id: "d", text: "Vue" },
      ],
      correctAnswer: "c",
      explanation: "Python is a programming language, not a JavaScript framework. React, Angular, and Vue are all JavaScript frameworks.",
    },
    {
      id: "q5",
      type: "MCQ",
      text: "Which of these is NOT a JavaScript framework?",
      choices: [
        { id: "a", text: "React" },
        { id: "b", text: "Angular" },
        { id: "c", text: "Python" },
        { id: "d", text: "Vue" },
      ],
      correctAnswer: "c",
      explanation: "Python is a programming language, not a JavaScript framework. React, Angular, and Vue are all JavaScript frameworks.",
    },
  ],
  settings: {
    timeLimit: 600,
    shuffleQuestions: false
  },
};
