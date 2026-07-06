/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../store';
import { Course, Lesson } from '../types';
import { GraduationCap, BookOpen, Clock, Lock, CheckCircle2, ChevronRight, X, Play, ArrowRight, Award, Star, Info } from 'lucide-react';

export const Academy: React.FC = () => {
  const { courses, completeLesson, submitQuiz, user } = useApp();
  
  // Selection states
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  
  // Quiz states
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [isQuizFinished, setIsQuizFinished] = useState(false);

  // Certificate award state
  const [showCertificate, setShowCertificate] = useState(false);

  const handleLessonTap = (lesson: Lesson) => {
    // Check premium locks
    if (lesson.isPremium && !user.isPro) {
      // Trigger upgrade message / lock info
      return;
    }
    setActiveLesson(lesson);
  };

  const handleMarkComplete = () => {
    if (selectedCourse && activeLesson) {
      completeLesson(selectedCourse.id, activeLesson.id);
      setActiveLesson(null);
    }
  };

  const startQuiz = () => {
    if (!selectedCourse?.quiz) return;
    setShowQuiz(true);
    setCurrentQuestionIdx(0);
    setSelectedOption(null);
    setQuizScore(0);
    setIsQuizFinished(false);
  };

  const handleOptionSelect = (idx: number) => {
    if (selectedOption !== null) return; // Answer locked
    setSelectedOption(idx);
    const correct = selectedCourse?.quiz?.questions[currentQuestionIdx].correctIndex === idx;
    if (correct) {
      setQuizScore(prev => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    if (!selectedCourse?.quiz) return;
    setSelectedOption(null);
    if (currentQuestionIdx < selectedCourse.quiz.questions.length - 1) {
      setCurrentQuestionIdx(p => p + 1);
    } else {
      setIsQuizFinished(true);
      const percentageScore = Math.round((quizScore / selectedCourse.quiz.questions.length) * 100);
      submitQuiz(selectedCourse.id, percentageScore);
      if (percentageScore === 100) {
        setShowCertificate(true);
      }
    }
  };

  const closeQuiz = () => {
    setShowQuiz(false);
  };

  return (
    <div className="space-y-6 pb-24 max-w-lg mx-auto">
      {/* Dynamic Certificate Award overlay */}
      <AnimatePresence>
        {showCertificate && (
          <div className="fixed inset-0 bg-[#0b0e14]/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-gradient-to-tr from-[#171b26] to-[#11141c] border border-sky-500/20 rounded-2xl p-6 text-center space-y-4 max-w-sm shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <GraduationCap className="w-24 h-24 text-white" />
              </div>

              <div className="w-12 h-12 bg-sky-500/10 border border-sky-500/20 rounded-full flex items-center justify-center mx-auto text-sky-400 animate-bounce">
                <Award className="w-6 h-6" />
              </div>

              <h3 className="text-lg font-bold text-white tracking-tight">Course Completed!</h3>
              <p className="text-xs text-gray-400">
                Congratulations, you scored 100% in the evaluation quiz! You are awarded the official **Paper Market Certificate of Completion**.
              </p>

              <div className="border border-white/5 bg-[#0b0e14] p-4 rounded-xl text-left space-y-1 mt-4 relative">
                <span className="text-[8px] font-mono text-sky-400 uppercase tracking-widest block">Paper Market Certificate</span>
                <span className="block text-sm font-bold text-white uppercase">{user.name}</span>
                <span className="block text-[10px] text-gray-400">Authorized evaluator for Option pricing models.</span>
                <span className="block text-[9px] font-mono text-gray-500 mt-2 text-right">ID: pm-cert-9812</span>
              </div>

              <button
                onClick={() => setShowCertificate(false)}
                className="w-full mt-4 bg-sky-600 hover:bg-sky-500 text-white font-bold py-2.5 rounded-xl text-xs transition"
              >
                Claim Certificate & +100 XP
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Primary Course Detail view OR catalog view */}
      {selectedCourse ? (
        <div className="space-y-4">
          {/* Back to Catalog */}
          <button
            onClick={() => setSelectedCourse(null)}
            className="text-xs text-sky-500 hover:text-sky-400 font-medium flex items-center gap-1"
          >
            ← Back to Course Catalog
          </button>

          {/* Banner */}
          <div className="bg-white/2 border border-white/5 rounded-2xl p-5 space-y-2">
            <div className="flex justify-between items-start">
              <span className="bg-sky-500/10 text-sky-400 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full">
                {selectedCourse.level}
              </span>
              <span className="text-xs text-gray-400 font-mono flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> {selectedCourse.duration}
              </span>
            </div>
            <h2 className="text-lg font-display font-bold text-white leading-tight">{selectedCourse.title}</h2>
            <p className="text-xs text-gray-400 font-sans leading-relaxed">{selectedCourse.description}</p>

            {/* Course Progress Bar */}
            <div className="space-y-1.5 pt-3">
              <div className="flex justify-between items-center text-[10px] text-gray-400">
                <span>Completed Lessons progress</span>
                <span className="font-bold text-white tabular-numbers">{selectedCourse.progress}%</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div className="bg-sky-500 h-full transition-all duration-300" style={{ width: `${selectedCourse.progress}%` }} />
              </div>
            </div>
          </div>

          {/* Lessons List completions */}
          <div className="space-y-2">
            <span className="text-xs font-mono text-gray-500 uppercase tracking-widest block">Lessons List</span>
            {selectedCourse.lessons.map(lesson => {
              const isLocked = lesson.isPremium && !user.isPro;
              return (
                <div
                  key={lesson.id}
                  onClick={() => handleLessonTap(lesson)}
                  className={`p-4 rounded-xl border flex justify-between items-center transition ${
                    isLocked 
                      ? 'bg-white/1 border-white/5 opacity-50 cursor-not-allowed'
                      : 'bg-white/2 border-white/5 hover:bg-white/4 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {lesson.isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <div className="w-5 h-5 rounded-full border border-white/20" />
                    )}
                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold text-white block">{lesson.title}</span>
                      <span className="text-[10px] text-gray-400 font-mono block">{lesson.duration}</span>
                    </div>
                  </div>

                  <div>
                    {isLocked ? (
                      <Lock className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quiz Button Trigger */}
          {selectedCourse.progress === 100 && selectedCourse.quiz && (
            <button
              onClick={startQuiz}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
            >
              <GraduationCap className="w-5 h-5" /> Start Course Quiz evaluation
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-1.5 mb-2">
            <GraduationCap className="w-5 h-5 text-sky-500" />
            <h2 className="text-base font-bold text-white">Academy Learning Hub</h2>
          </div>

          {/* Catalog list */}
          <div className="space-y-3">
            {courses.map(course => (
              <div
                key={course.id}
                onClick={() => setSelectedCourse(course)}
                className="bg-white/2 border border-white/5 rounded-2xl p-4 hover:bg-white/4 transition cursor-pointer space-y-3 relative overflow-hidden"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-0.5">
                    <span className="bg-sky-500/10 text-sky-400 text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full">
                      {course.level}
                    </span>
                    <h3 className="text-sm font-bold text-white leading-tight mt-1">{course.title}</h3>
                  </div>
                  {course.isPremium && !user.isPro && (
                    <span className="bg-amber-500/10 text-amber-500 text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded flex items-center gap-0.5">
                      <Lock className="w-2.5 h-2.5" /> PRO
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 leading-relaxed max-w-sm font-sans">{course.description}</p>
                
                <div className="flex justify-between items-center text-[10px] text-gray-500 font-mono pt-2 border-t border-white/5">
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5" /> {course.lessons.length} lessons
                  </span>
                  <span className="text-gray-400 font-bold tabular-numbers">Progress: {course.progress}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Slide Interactive Lesson Player Modal */}
      <AnimatePresence>
        {activeLesson && selectedCourse && (
          <div className="fixed inset-0 bg-[#0b0e14]/90 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="bg-[#11141c] border border-white/10 rounded-2xl w-full max-w-lg p-6 space-y-6 shadow-2xl relative my-8"
            >
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-[9px] font-mono text-sky-400 uppercase tracking-widest block">{selectedCourse.title}</span>
                  <h3 className="text-sm font-bold text-white mt-0.5">{activeLesson.title}</h3>
                </div>
                <button onClick={() => setActiveLesson(null)} className="p-1 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Lesson Text Panel with customized mock-MD styling */}
              <div className="bg-[#0b0e14] p-4 rounded-xl border border-white/5 text-xs text-gray-300 leading-relaxed space-y-4 max-h-[300px] overflow-y-auto font-sans">
                {activeLesson.content.split('\n\n').map((para, i) => {
                  if (para.startsWith('###')) {
                    return <h4 key={i} className="text-sm font-bold text-white pt-2 border-b border-white/5 pb-1">{para.replace('###', '')}</h4>;
                  }
                  if (para.startsWith('-')) {
                    return (
                      <ul key={i} className="list-disc pl-4 space-y-1">
                        {para.split('\n').map((item, j) => (
                          <li key={j} className="text-gray-400">{item.replace('-', '').trim()}</li>
                        ))}
                      </ul>
                    );
                  }
                  return <p key={i}>{para}</p>;
                })}
              </div>

              {/* Completed button trigger */}
              <button
                type="button"
                onClick={handleMarkComplete}
                className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
              >
                Mark Lesson Complete & Earn +20 XP
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* End of Module Multiple choice quiz evaluation overlay */}
      <AnimatePresence>
        {showQuiz && selectedCourse?.quiz && (
          <div className="fixed inset-0 bg-[#0b0e14]/95 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#11141c] border border-white/10 rounded-2xl w-full max-w-md p-6 space-y-6 shadow-2xl"
            >
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-[9px] font-mono text-emerald-400 uppercase tracking-widest block">{selectedCourse.title}</span>
                  <h3 className="text-sm font-bold text-white">Evaluation Quiz</h3>
                </div>
                <button onClick={closeQuiz} className="p-1 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {!isQuizFinished ? (
                <div className="space-y-4">
                  <div className="flex justify-between text-xs text-gray-400 font-mono">
                    <span>Question {currentQuestionIdx + 1} of {selectedCourse.quiz.questions.length}</span>
                    <span>Score: {quizScore}</span>
                  </div>

                  {/* Question Title */}
                  <h4 className="text-sm font-bold text-white leading-relaxed font-sans">
                    {selectedCourse.quiz.questions[currentQuestionIdx].question}
                  </h4>

                  {/* Options List */}
                  <div className="space-y-2">
                    {selectedCourse.quiz.questions[currentQuestionIdx].options.map((opt, oIdx) => {
                      const isSelected = selectedOption === oIdx;
                      const isCorrect = selectedCourse.quiz!.questions[currentQuestionIdx].correctIndex === oIdx;
                      let colorClass = 'bg-white/2 border-white/5 hover:bg-white/4';
                      
                      if (selectedOption !== null) {
                        if (isSelected) {
                          colorClass = isCorrect ? 'bg-bull/15 border-bull text-bull' : 'bg-bear/15 border-bear text-bear';
                        } else if (isCorrect) {
                          colorClass = 'bg-bull/10 border-bull text-bull'; // Highlight correct answer
                        }
                      }

                      return (
                        <div
                          key={oIdx}
                          onClick={() => handleOptionSelect(oIdx)}
                          className={`p-3.5 rounded-xl border text-xs cursor-pointer transition font-medium ${colorClass}`}
                        >
                          {opt}
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation card */}
                  {selectedOption !== null && (
                    <div className="bg-sky-500/5 p-3 rounded-xl border border-sky-500/10 text-[11px] text-gray-400 font-sans leading-relaxed flex gap-1.5">
                      <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                      <span>{selectedCourse.quiz.questions[currentQuestionIdx].explanation}</span>
                    </div>
                  )}

                  {/* Next Step */}
                  {selectedOption !== null && (
                    <button
                      onClick={handleNextQuestion}
                      className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1 transition"
                    >
                      {currentQuestionIdx < selectedCourse.quiz.questions.length - 1 ? 'Next Question' : 'Finish Quiz'} <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <div className="w-12 h-12 bg-sky-500/10 border border-sky-500/20 rounded-full flex items-center justify-center mx-auto text-sky-400">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <h4 className="text-base font-bold text-white">Quiz Completed!</h4>
                  <p className="text-xs text-gray-400">
                    You scored {quizScore} out of {selectedCourse.quiz.questions.length} questions correctly.
                  </p>

                  <button
                    onClick={closeQuiz}
                    className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-2.5 rounded-xl text-xs transition"
                  >
                    Return to Academy catalog
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
