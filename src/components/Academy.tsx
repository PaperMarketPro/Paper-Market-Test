/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useMainApp } from '../store';
import { Course, Lesson } from '../types';
import { AILessonStudio } from './AILessonStudio';
import { 
  GraduationCap, 
  BookOpen, 
  Clock, 
  Lock, 
  CheckCircle2, 
  X, 
  ArrowRight, 
  Award, 
  Info, 
  Search, 
  Sparkles, 
  Check
} from 'lucide-react';

export const Academy: React.FC = React.memo(() => {
  const { courses, completeLesson, submitQuiz, user } = useMainApp();
  
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [lessonLang, setLessonLang] = useState<'Hindi' | 'English'>('English');
  const [proBannerMessage, setProBannerMessage] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [languageFilter, setLanguageFilter] = useState<'All' | 'Hindi' | 'English'>('All');
  const [categoryFilter, setCategoryFilter] = useState<'All' | 'Basics' | 'Options' | 'Price Action' | 'Psychology'>('All');

  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [isQuizFinished, setIsQuizFinished] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);

  const filteredCourses = useMemo(() => {
    return courses.filter(course => {
      const matchesLang = languageFilter === 'All' || course.language === languageFilter;
      const matchesCat = categoryFilter === 'All' || course.category === categoryFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        course.title.toLowerCase().includes(q) ||
        (course.titleHindi && course.titleHindi.toLowerCase().includes(q)) ||
        course.description.toLowerCase().includes(q) ||
        course.lessons.some(l => l.title.toLowerCase().includes(q) || (l.titleHindi && l.titleHindi.toLowerCase().includes(q)));
      
      return matchesLang && matchesCat && matchesSearch;
    });
  }, [courses, languageFilter, categoryFilter, searchQuery]);

  const handleLessonTap = (lesson: Lesson) => {
    if (lesson.isPremium && !user.isPro) {
      setProBannerMessage('This is a Pro lesson. Upgrade in your Profile settings to unlock all advanced lessons.');
      setTimeout(() => setProBannerMessage(null), 4500);
      return;
    }
    setActiveLesson(lesson);
    setLessonLang(lesson.contentHindi ? 'Hindi' : 'English');
  };

  const handleMarkComplete = () => {
    if (selectedCourse && activeLesson) {
      completeLesson(selectedCourse.id, activeLesson.id);
      
      const currentIdx = selectedCourse.lessons.findIndex(l => l.id === activeLesson.id);
      if (currentIdx !== -1 && currentIdx < selectedCourse.lessons.length - 1) {
        const next = selectedCourse.lessons[currentIdx + 1];
        if (!next.isPremium || user.isPro) {
          setActiveLesson(next);
          setLessonLang(next.contentHindi ? 'Hindi' : 'English');
          return;
        }
      }
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
    if (selectedOption !== null) return;
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

  return (
    <div className="space-y-6 pb-20 max-w-5xl mx-auto w-full">
      {/* Pro Notice Banner */}
      <AnimatePresence>
        {proBannerMessage && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-amber-500/10 border border-amber-500/30 text-amber-300 px-4 py-3 rounded-xl text-xs flex items-center justify-between gap-2"
          >
            <span>{proBannerMessage}</span>
            <button onClick={() => setProBannerMessage(null)} className="text-amber-300 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Certificate Modal */}
      <AnimatePresence>
        {showCertificate && selectedCourse && (
          <div className="fixed inset-0 bg-[#0b0e14]/90 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#121620] border border-sky-500/30 rounded-2xl p-6 text-center space-y-4 max-w-md w-full shadow-xl"
            >
              <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center mx-auto text-amber-400">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Course Completed!</h3>
              <p className="text-xs text-gray-300">
                You passed the quiz for <span className="text-sky-400 font-semibold">{selectedCourse.title}</span>.
              </p>
              <div className="border border-white/10 bg-[#0b0e14] p-4 rounded-xl text-left space-y-1.5">
                <span className="text-[10px] font-mono text-sky-400 block">CERTIFICATE OF COMPLETION</span>
                <span className="block text-sm font-bold text-white">{user.name}</span>
                <span className="block text-xs text-gray-400">{selectedCourse.title}</span>
              </div>
              <button
                type="button"
                onClick={() => setShowCertificate(false)}
                className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-2.5 rounded-xl text-xs transition"
              >
                Claim +100 XP
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {selectedCourse ? (
        /* Single Course View */
        <div className="space-y-5">
          <button
            type="button"
            onClick={() => setSelectedCourse(null)}
            className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1.5 transition bg-white/5 hover:bg-white/10 px-3 py-2 rounded-xl border border-white/10 w-fit"
          >
            ← Back to Courses
          </button>

          {/* Course Summary Header */}
          <div className="bg-white dark:bg-[#121620] border border-slate-200 dark:border-white/10 rounded-2xl p-5 space-y-3 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-gray-400">
              <span>
                {selectedCourse.level} · {selectedCourse.category || 'Trading'}
                {selectedCourse.language ? ` · ${selectedCourse.language}` : ''}
              </span>
              <span className="font-mono flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-sky-400" /> {selectedCourse.duration}
              </span>
            </div>

            <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">{selectedCourse.title}</h1>
            <p className="text-xs text-slate-600 dark:text-gray-300 leading-relaxed">{selectedCourse.description}</p>

            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs text-slate-500 dark:text-gray-400 font-mono">
                <span>Progress</span>
                <span className="font-bold text-sky-400">{selectedCourse.progress}%</span>
              </div>
              <div className="h-2 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                <div className="bg-sky-500 h-full transition-all duration-300" style={{ width: `${selectedCourse.progress}%` }} />
              </div>
            </div>
          </div>

          {/* Lessons List */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold uppercase font-mono tracking-wider text-slate-500 dark:text-gray-400">
              Lessons ({selectedCourse.lessons.length})
            </h3>

            <div className="space-y-2">
              {selectedCourse.lessons.map((lesson, idx) => {
                const isLocked = lesson.isPremium && !user.isPro;
                return (
                  <div
                    key={lesson.id}
                    onClick={() => handleLessonTap(lesson)}
                    className={`p-4 rounded-xl border flex items-center justify-between gap-3 transition ${
                      isLocked 
                        ? 'bg-slate-50 dark:bg-white/2 border-slate-200 dark:border-white/5 opacity-60 cursor-not-allowed'
                        : 'bg-white dark:bg-[#121620] border-slate-200 dark:border-white/10 hover:border-sky-500/40 cursor-pointer'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {lesson.isCompleted ? (
                        <div className="w-6 h-6 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full border border-slate-300 dark:border-white/20 flex items-center justify-center text-xs font-mono text-slate-500 dark:text-gray-400 shrink-0">
                          {idx + 1}
                        </div>
                      )}
                      <div className="min-w-0">
                        <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white block truncate">
                          {lesson.title}
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-gray-400 font-mono">
                          {lesson.duration}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {isLocked ? (
                        <span className="text-xs text-amber-400 flex items-center gap-1 font-semibold">
                          <Lock className="w-3.5 h-3.5" /> Pro
                        </span>
                      ) : (
                        <span className="text-xs text-sky-400 font-semibold flex items-center gap-1">
                          Open <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {selectedCourse.quiz && (
            <button
              type="button"
              onClick={startQuiz}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-sm"
            >
              <GraduationCap className="w-4 h-4" /> Take Course Quiz
            </button>
          )}
        </div>
      ) : (
        /* Course Catalog View */
        <div className="space-y-5">
          <div className="bg-white dark:bg-[#121620] border border-slate-200 dark:border-white/10 rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Trading Academy</h1>
                <p className="text-xs text-slate-500 dark:text-gray-400">
                  Learn market basics, price action, options, and risk management with interactive lessons.
                </p>
              </div>
              <span className="text-xs font-mono text-sky-400 shrink-0">{courses.length} Courses</span>
            </div>

            {/* Clean Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-2 border-t border-slate-100 dark:border-white/5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0b0e14] border border-slate-200 dark:border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder-gray-500 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex items-center gap-1 bg-slate-50 dark:bg-[#0b0e14] border border-slate-200 dark:border-white/10 rounded-xl p-1 text-xs overflow-x-auto">
                {(['All', 'Basics', 'Options', 'Price Action', 'Psychology'] as const).map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoryFilter(cat)}
                    className={`py-1 px-2.5 rounded-lg font-medium whitespace-nowrap transition ${
                      categoryFilter === cat
                        ? 'bg-sky-600 text-white'
                        : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1 bg-slate-50 dark:bg-[#0b0e14] border border-slate-200 dark:border-white/10 rounded-xl p-1 text-xs shrink-0">
                {(['All', 'English', 'Hindi'] as const).map(lang => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setLanguageFilter(lang)}
                    className={`py-1 px-2.5 rounded-lg font-medium transition ${
                      languageFilter === lang
                        ? 'bg-sky-600 text-white'
                        : 'text-slate-500 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {lang === 'Hindi' ? 'हिंदी' : lang}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Courses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCourses.map(course => (
              <div
                key={course.id}
                onClick={() => setSelectedCourse(course)}
                className="bg-white dark:bg-[#121620] border border-slate-200 dark:border-white/10 rounded-2xl p-5 hover:border-sky-500/50 transition cursor-pointer flex flex-col justify-between gap-4 shadow-sm group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-gray-400">
                    <span>
                      {course.level} · {course.category}
                      {course.language === 'Hindi' ? ' · हिंदी' : ''}
                    </span>
                    {course.isPremium && !user.isPro && (
                      <span className="text-amber-400 font-semibold flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Pro
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-sky-400 transition">
                    {course.title}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-gray-400 leading-relaxed line-clamp-2">
                    {course.description}
                  </p>
                </div>

                <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-white/5">
                  <div className="flex justify-between items-center text-xs text-slate-500 dark:text-gray-400 font-mono">
                    <span>{course.lessons.length} Lessons</span>
                    <span>{course.progress}% Complete</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                    <div className="bg-sky-500 h-full transition-all duration-300" style={{ width: `${course.progress}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredCourses.length === 0 && (
            <div className="text-center py-12 bg-white dark:bg-[#121620] rounded-2xl border border-slate-200 dark:border-white/5 p-6 space-y-2">
              <p className="text-xs text-gray-400">No courses match your filter.</p>
              <button
                type="button"
                onClick={() => { setSearchQuery(''); setLanguageFilter('All'); setCategoryFilter('All'); }}
                className="text-xs text-sky-400 hover:underline font-semibold"
              >
                Reset filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Clean Unified Lesson Modal (No Duplicate Transcripts or Stacked Boxes) */}
      <AnimatePresence>
        {activeLesson && selectedCourse && (
          <div className="fixed inset-0 bg-[#0b0e14]/90 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="bg-[#121620] border border-white/10 rounded-2xl w-full max-w-2xl p-4 sm:p-6 space-y-4 shadow-2xl my-auto max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-start border-b border-white/10 pb-3 gap-3">
                <div>
                  <span className="text-[11px] font-mono text-sky-400 block">{selectedCourse.title}</span>
                  <h3 className="text-base sm:text-lg font-bold text-white mt-0.5">{activeLesson.title}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveLesson(null)}
                  className="p-1.5 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Unified Lesson Studio (Notes, Single Interactive Tool, Quiz) */}
              <AILessonStudio
                lesson={activeLesson}
                course={selectedCourse}
                lang={lessonLang}
                onLanguageChange={setLessonLang}
                onCompleteLesson={handleMarkComplete}
              />

              {/* Single Clean Complete Button */}
              <div className="pt-2 border-t border-white/10 flex justify-end">
                <button
                  type="button"
                  onClick={handleMarkComplete}
                  className="w-full sm:w-auto bg-sky-600 hover:bg-sky-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow"
                >
                  <CheckCircle2 className="w-4 h-4" /> Mark Complete (+20 XP)
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Course Quiz Modal */}
      <AnimatePresence>
        {showQuiz && selectedCourse?.quiz && (
          <div className="fixed inset-0 bg-[#0b0e14]/90 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#121620] border border-white/10 rounded-2xl w-full max-w-lg p-5 sm:p-6 space-y-5 shadow-xl"
            >
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <div>
                  <span className="text-[10px] font-mono text-emerald-400 uppercase block">{selectedCourse.title}</span>
                  <h3 className="text-base font-bold text-white">Course Quiz</h3>
                </div>
                <button onClick={() => setShowQuiz(false)} className="p-1.5 hover:bg-white/5 rounded-xl text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {!isQuizFinished ? (
                <div className="space-y-4">
                  <div className="flex justify-between text-xs text-gray-400 font-mono">
                    <span>Question {currentQuestionIdx + 1} of {selectedCourse.quiz.questions.length}</span>
                    <span>Score: {quizScore}</span>
                  </div>

                  <h4 className="text-sm font-bold text-white leading-relaxed">
                    {selectedCourse.quiz.questions[currentQuestionIdx].question}
                  </h4>

                  <div className="space-y-2">
                    {selectedCourse.quiz.questions[currentQuestionIdx].options.map((opt, oIdx) => {
                      const isSelected = selectedOption === oIdx;
                      const isCorrect = selectedCourse.quiz!.questions[currentQuestionIdx].correctIndex === oIdx;
                      let colorClass = 'bg-[#0b0e14] border-white/10 hover:border-sky-500/50 text-gray-200';
                      
                      if (selectedOption !== null) {
                        if (isSelected) {
                          colorClass = isCorrect ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' : 'bg-rose-500/20 border-rose-500 text-rose-300';
                        } else if (isCorrect) {
                          colorClass = 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300';
                        }
                      }

                      return (
                        <button
                          key={oIdx}
                          type="button"
                          onClick={() => handleOptionSelect(oIdx)}
                          className={`w-full text-left p-3 rounded-xl border text-xs transition font-medium ${colorClass}`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>

                  {selectedOption !== null && (
                    <div className="bg-sky-500/10 p-3 rounded-xl border border-sky-500/20 text-xs text-gray-300 flex gap-2">
                      <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                      <span>{selectedCourse.quiz.questions[currentQuestionIdx].explanation}</span>
                    </div>
                  )}

                  {selectedOption !== null && (
                    <button
                      type="button"
                      onClick={handleNextQuestion}
                      className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
                    >
                      {currentQuestionIdx < selectedCourse.quiz.questions.length - 1 ? 'Next Question' : 'Finish Quiz'} <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-center space-y-4 py-4">
                  <GraduationCap className="w-10 h-10 text-sky-400 mx-auto" />
                  <h4 className="text-base font-bold text-white">Quiz Complete!</h4>
                  <p className="text-xs text-gray-300">
                    You scored {quizScore} / {selectedCourse.quiz.questions.length} ({Math.round((quizScore / selectedCourse.quiz.questions.length) * 100)}%).
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowQuiz(false)}
                    className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-2.5 rounded-xl text-xs transition"
                  >
                    Done
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
});
