/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useApp } from '../store';
import { Course, Lesson, VideoTimestamp } from '../types';
import { 
  GraduationCap, 
  BookOpen, 
  Clock, 
  Lock, 
  CheckCircle2, 
  ChevronRight, 
  X, 
  Play, 
  ArrowRight, 
  Award, 
  Info, 
  Search, 
  Globe, 
  Video, 
  ListVideo, 
  Sparkles, 
  Languages,
  RotateCcw,
  Volume2,
  Check
} from 'lucide-react';

export const Academy: React.FC = React.memo(() => {
  const { courses, completeLesson, submitQuiz, user } = useApp();
  
  // Selection states
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [lessonLang, setLessonLang] = useState<'Hindi' | 'English'>('Hindi');
  
  // Search & Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [languageFilter, setLanguageFilter] = useState<'All' | 'Hindi' | 'English'>('All');
  const [categoryFilter, setCategoryFilter] = useState<'All' | 'Basics' | 'Options' | 'Price Action' | 'Psychology'>('All');

  // Quiz states
  const [showQuiz, setShowQuiz] = useState(false);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [isQuizFinished, setIsQuizFinished] = useState(false);

  // Certificate award state
  const [showCertificate, setShowCertificate] = useState(false);

  // Video Timestamp ref/seek state
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Filtered courses
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
      alert("This is a Premium PRO Video Lesson. Please upgrade your subscription to unlock all advanced video masterclasses.");
      return;
    }
    setActiveLesson(lesson);
    setLessonLang(lesson.contentHindi ? 'Hindi' : 'English');
  };

  const handleMarkComplete = () => {
    if (selectedCourse && activeLesson) {
      completeLesson(selectedCourse.id, activeLesson.id);
      
      // Auto move to next lesson if available
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

  const seekVideoToTimestamp = (ts: VideoTimestamp) => {
    if (activeLesson?.youtubeId && iframeRef.current) {
      iframeRef.current.src = `https://www.youtube.com/embed/${activeLesson.youtubeId}?autoplay=1&start=${ts.seconds}&enablejsapi=1`;
    }
  };

  return (
    <div className="space-y-6 pb-24 max-w-5xl mx-auto w-full px-2 sm:px-4">
      {/* Certificate Award Overlay */}
      <AnimatePresence>
        {showCertificate && selectedCourse && (
          <div className="fixed inset-0 bg-[#0b0e14]/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-gradient-to-tr from-[#171b26] to-[#11141c] border border-sky-500/30 rounded-2xl p-6 text-center space-y-4 max-w-md shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <GraduationCap className="w-32 h-32 text-white" />
              </div>

              <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/30 rounded-full flex items-center justify-center mx-auto text-amber-400 animate-bounce">
                <Award className="w-7 h-7" />
              </div>

              <span className="bg-sky-500/10 text-sky-400 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-sky-500/20">
                Official Certification
              </span>

              <h3 className="text-xl font-bold text-white tracking-tight">Course Completed!</h3>
              <p className="text-xs text-gray-300 leading-relaxed">
                Congratulations, you passed the final evaluation quiz for <span className="text-sky-400 font-semibold">{selectedCourse.title}</span>!
              </p>

              <div className="border border-sky-500/20 bg-[#0b0e14] p-4 rounded-xl text-left space-y-2 relative shadow-inner">
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                  <span className="text-[9px] font-mono text-sky-400 uppercase tracking-widest">PAPER MARKET TRADING ACADEMY</span>
                  <span className="text-[9px] font-mono text-amber-400">PASSED 100%</span>
                </div>
                <span className="block text-base font-bold text-white uppercase">{user.name}</span>
                <span className="block text-[11px] text-gray-400">Certified Trading Specialist in {selectedCourse.category || 'Equity & FnO'}</span>
                <div className="flex justify-between items-center text-[9px] font-mono text-gray-500 pt-2 border-t border-white/5">
                  <span>DATE: {new Date().toLocaleDateString('en-IN')}</span>
                  <span>ID: CERT-PM-{Math.floor(1000 + Math.random() * 9000)}</span>
                </div>
              </div>

              <button
                onClick={() => setShowCertificate(false)}
                className="w-full mt-4 bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 rounded-xl text-xs transition shadow-lg flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-amber-300" /> Claim Certificate & Earn +100 XP
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Academy Container */}
      {selectedCourse ? (
        /* Single Course View */
        <div className="space-y-5">
          {/* Back Navigation */}
          <button
            onClick={() => setSelectedCourse(null)}
            className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1.5 transition bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-lg border border-white/10 w-fit"
          >
            ← Back to All Hindi & English Courses
          </button>

          {/* Course Banner Card */}
          <div className="bg-gradient-to-r from-[#171b26] to-[#0f121a] border border-white/10 rounded-2xl p-5 sm:p-6 space-y-4 relative overflow-hidden shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="bg-sky-500/10 text-sky-400 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-sky-500/20">
                  {selectedCourse.level}
                </span>
                {selectedCourse.language && (
                  <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                    <Globe className="w-3 h-3" /> {selectedCourse.language === 'Hindi' ? '🇮🇳 हिंदी (Hindi)' : '🇬🇧 English'}
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-400 font-mono flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-sky-400" /> {selectedCourse.duration}
              </span>
            </div>

            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white leading-tight">{selectedCourse.title}</h1>
              {selectedCourse.titleHindi && (
                <p className="text-xs sm:text-sm text-sky-400/90 font-medium mt-1">{selectedCourse.titleHindi}</p>
              )}
            </div>

            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed max-w-2xl font-sans">
              {selectedCourse.descriptionHindi || selectedCourse.description}
            </p>

            {/* Course Progress */}
            <div className="space-y-1.5 pt-2 border-t border-white/5">
              <div className="flex justify-between items-center text-xs text-gray-400 font-mono">
                <span>Completed Video Lessons</span>
                <span className="font-bold text-sky-400 tabular-numbers">{selectedCourse.progress}% Completed</span>
              </div>
              <div className="h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                <div className="bg-gradient-to-r from-sky-500 to-blue-500 h-full transition-all duration-500" style={{ width: `${selectedCourse.progress}%` }} />
              </div>
            </div>
          </div>

          {/* Lessons Playlist Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ListVideo className="w-4 h-4 text-sky-400" /> Course Playlist & Video Lessons
              </h3>
              <span className="text-xs text-gray-400 font-mono">{selectedCourse.lessons.length} Video Lessons</span>
            </div>

            <div className="space-y-2">
              {selectedCourse.lessons.map((lesson, idx) => {
                const isLocked = lesson.isPremium && !user.isPro;
                return (
                  <div
                    key={lesson.id}
                    onClick={() => handleLessonTap(lesson)}
                    className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                      isLocked 
                        ? 'bg-white/1 border-white/5 opacity-60 cursor-not-allowed'
                        : 'bg-[#121620] border-white/10 hover:border-sky-500/40 hover:bg-[#181d2a] cursor-pointer'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 shrink-0">
                        {lesson.isCompleted ? (
                          <div className="w-6 h-6 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full border border-white/20 flex items-center justify-center text-[10px] font-mono text-gray-400">
                            {idx + 1}
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-white">{lesson.title}</span>
                          {lesson.youtubeId && (
                            <span className="bg-red-500/10 text-red-400 text-[9px] font-bold uppercase px-1.5 py-0.5 rounded flex items-center gap-1 border border-red-500/20">
                              <Video className="w-2.5 h-2.5" /> VIDEO
                            </span>
                          )}
                        </div>
                        {lesson.titleHindi && (
                          <p className="text-xs text-sky-400/90">{lesson.titleHindi}</p>
                        )}
                        <span className="text-[11px] text-gray-400 font-mono block">{lesson.duration}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-end shrink-0">
                      {isLocked ? (
                        <span className="text-xs text-amber-400 bg-amber-500/10 px-2 py-1 rounded flex items-center gap-1 border border-amber-500/20 font-semibold">
                          <Lock className="w-3.5 h-3.5" /> Unlock PRO
                        </span>
                      ) : (
                        <button className="bg-sky-600/20 hover:bg-sky-600/40 text-sky-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition border border-sky-500/30">
                          <Play className="w-3.5 h-3.5 fill-current" /> Watch Video
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quiz Button Trigger when all lessons done or progress 100% */}
          {selectedCourse.quiz && (
            <div className="pt-2">
              <button
                onClick={startQuiz}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-3.5 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-lg"
              >
                <GraduationCap className="w-5 h-5 text-emerald-200" /> Start Course Evaluation Quiz (हिंदी / English)
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Catalog & Hub View */
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-[#171b26] via-[#121622] to-[#0f121a] border border-white/10 rounded-2xl p-5 sm:p-6 space-y-4 relative overflow-hidden shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="bg-sky-500/10 text-sky-400 text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border border-sky-500/20 flex items-center gap-1">
                    <Video className="w-3 h-3 text-sky-400" /> Video Learning Center
                  </span>
                  <span className="bg-amber-500/10 text-amber-400 text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full border border-amber-500/20">
                    🇮🇳 हिंदी स्पेशल
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Trading Academy (ट्रेडिंग एकेडमी)</h1>
                <p className="text-xs sm:text-sm text-gray-300 font-sans">
                  Learn Stock Market, Options Trading, Price Action & Technical Analysis through structured video lessons in Hindi.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0 bg-white/5 p-3 rounded-xl border border-white/10">
                <GraduationCap className="w-8 h-8 text-sky-400 shrink-0" />
                <div className="text-left">
                  <span className="text-[10px] text-gray-400 uppercase font-mono block">Courses Available</span>
                  <span className="text-base font-bold text-white">{courses.length} Video Masterclasses</span>
                </div>
              </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-white/5">
              {/* Search input */}
              <div className="relative col-span-1 sm:col-span-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search in Hindi or English..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-[#0b0e14] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-sky-500 transition"
                />
              </div>

              {/* Language filter */}
              <div className="flex items-center bg-[#0b0e14] border border-white/10 rounded-xl p-1 text-xs">
                <button
                  onClick={() => setLanguageFilter('All')}
                  className={`flex-1 py-1 px-2 rounded-lg font-medium transition ${languageFilter === 'All' ? 'bg-sky-600 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  All
                </button>
                <button
                  onClick={() => setLanguageFilter('Hindi')}
                  className={`flex-1 py-1 px-2 rounded-lg font-medium transition flex items-center justify-center gap-1 ${languageFilter === 'Hindi' ? 'bg-sky-600 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  🇮🇳 हिंदी
                </button>
                <button
                  onClick={() => setLanguageFilter('English')}
                  className={`flex-1 py-1 px-2 rounded-lg font-medium transition ${languageFilter === 'English' ? 'bg-sky-600 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  🇬🇧 English
                </button>
              </div>

              {/* Category filter */}
              <div className="flex items-center bg-[#0b0e14] border border-white/10 rounded-xl p-1 text-xs overflow-x-auto">
                <button
                  onClick={() => setCategoryFilter('All')}
                  className={`py-1 px-2 rounded-lg font-medium whitespace-nowrap transition ${categoryFilter === 'All' ? 'bg-sky-600 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  All Categories
                </button>
                <button
                  onClick={() => setCategoryFilter('Basics')}
                  className={`py-1 px-2 rounded-lg font-medium whitespace-nowrap transition ${categoryFilter === 'Basics' ? 'bg-sky-600 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  Basics
                </button>
                <button
                  onClick={() => setCategoryFilter('Options')}
                  className={`py-1 px-2 rounded-lg font-medium whitespace-nowrap transition ${categoryFilter === 'Options' ? 'bg-sky-600 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  Options
                </button>
                <button
                  onClick={() => setCategoryFilter('Price Action')}
                  className={`py-1 px-2 rounded-lg font-medium whitespace-nowrap transition ${categoryFilter === 'Price Action' ? 'bg-sky-600 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  Price Action
                </button>
              </div>
            </div>
          </div>

          {/* Courses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCourses.map(course => {
              const videoCount = course.lessons.filter(l => l.youtubeId || l.videoUrl).length;
              return (
                <div
                  key={course.id}
                  onClick={() => setSelectedCourse(course)}
                  className="bg-[#121620] border border-white/10 rounded-2xl p-5 hover:border-sky-500/50 hover:bg-[#161b28] transition cursor-pointer space-y-4 flex flex-col justify-between group shadow-lg relative overflow-hidden"
                >
                  {/* Card Header */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="bg-sky-500/10 text-sky-400 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border border-sky-500/20">
                          {course.level}
                        </span>
                        {course.language === 'Hindi' && (
                          <span className="bg-emerald-500/10 text-emerald-400 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border border-emerald-500/20">
                            🇮🇳 हिंदी
                          </span>
                        )}
                        {videoCount > 0 && (
                          <span className="bg-red-500/10 text-red-400 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border border-red-500/20 flex items-center gap-1">
                            <Video className="w-2.5 h-2.5" /> Video Course
                          </span>
                        )}
                      </div>

                      {course.isPremium && !user.isPro && (
                        <span className="bg-amber-500/10 text-amber-400 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded flex items-center gap-1 border border-amber-500/20">
                          <Lock className="w-2.5 h-2.5" /> PRO
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-white leading-tight group-hover:text-sky-400 transition">
                        {course.title}
                      </h3>
                      {course.titleHindi && (
                        <p className="text-xs text-sky-400/90 font-medium mt-0.5">{course.titleHindi}</p>
                      )}
                    </div>

                    <p className="text-xs text-gray-400 leading-relaxed font-sans line-clamp-2">
                      {course.descriptionHindi || course.description}
                    </p>
                  </div>

                  {/* Card Footer */}
                  <div className="space-y-2 pt-3 border-t border-white/5">
                    <div className="flex justify-between items-center text-[11px] text-gray-400 font-mono">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5 text-sky-400" /> {course.lessons.length} lessons ({videoCount} videos)
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-sky-400" /> {course.duration}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                        <span>Progress</span>
                        <span>{course.progress}%</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="bg-sky-500 h-full transition-all duration-300" style={{ width: `${course.progress}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredCourses.length === 0 && (
            <div className="text-center py-12 bg-white/2 rounded-2xl border border-white/5 p-6 space-y-3">
              <GraduationCap className="w-12 h-12 text-gray-500 mx-auto" />
              <p className="text-sm font-semibold text-gray-300">No courses match your search or filter.</p>
              <button
                onClick={() => { setSearchQuery(''); setLanguageFilter('All'); setCategoryFilter('All'); }}
                className="text-xs text-sky-400 hover:underline"
              >
                Reset filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Interactive Video & Lesson Player Modal */}
      <AnimatePresence>
        {activeLesson && selectedCourse && (
          <div className="fixed inset-0 bg-[#0b0e14]/95 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#121620] border border-white/10 rounded-2xl w-full max-w-3xl p-4 sm:p-6 space-y-5 shadow-2xl relative my-6 max-h-[92vh] overflow-y-auto"
            >
              {/* Top Modal Header */}
              <div className="flex justify-between items-start border-b border-white/10 pb-3 gap-2">
                <div>
                  <span className="text-[10px] font-mono text-sky-400 uppercase tracking-widest block">{selectedCourse.title}</span>
                  <h3 className="text-base sm:text-lg font-bold text-white mt-0.5">{activeLesson.title}</h3>
                  {activeLesson.titleHindi && (
                    <p className="text-xs text-sky-300">{activeLesson.titleHindi}</p>
                  )}
                </div>
                <button
                  onClick={() => setActiveLesson(null)}
                  className="p-1.5 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition shrink-0"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Video Player Frame */}
              {activeLesson.youtubeId ? (
                <div className="space-y-3">
                  <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black border border-white/10 shadow-xl">
                    <iframe
                      ref={iframeRef}
                      src={`https://www.youtube.com/embed/${activeLesson.youtubeId}?autoplay=1&enablejsapi=1&rel=0`}
                      title={activeLesson.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full border-0"
                    />
                  </div>

                  {/* Video Timestamps Bar */}
                  {activeLesson.timestamps && activeLesson.timestamps.length > 0 && (
                    <div className="space-y-1.5 bg-[#0b0e14] p-3 rounded-xl border border-white/5">
                      <span className="text-[10px] font-mono text-gray-400 uppercase tracking-wider block flex items-center gap-1">
                        <Clock className="w-3 h-3 text-sky-400" /> Key Chapter Timestamps (वीडियो चैप्टर)
                      </span>
                      <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1">
                        {activeLesson.timestamps.map((ts, i) => (
                          <button
                            key={i}
                            onClick={() => seekVideoToTimestamp(ts)}
                            className="bg-white/5 hover:bg-sky-600/30 text-gray-300 hover:text-sky-300 px-2.5 py-1 rounded-lg text-xs font-mono whitespace-nowrap transition border border-white/10 flex items-center gap-1.5"
                          >
                            <span className="text-sky-400 font-bold">{ts.time}</span>
                            <span className="text-gray-300 font-sans">{ts.title}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-[#0b0e14] p-6 rounded-xl border border-white/10 text-center space-y-2">
                  <Video className="w-8 h-8 text-sky-400 mx-auto" />
                  <p className="text-xs text-gray-300">Detailed text & interactive explanation provided for this module.</p>
                </div>
              )}

              {/* Language Switcher for Notes */}
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-sky-400" /> Lesson Transcript & Notes
                </span>

                {activeLesson.contentHindi && (
                  <div className="flex items-center bg-[#0b0e14] p-1 rounded-lg border border-white/10 text-xs">
                    <button
                      onClick={() => setLessonLang('Hindi')}
                      className={`px-2.5 py-1 rounded-md font-medium transition ${lessonLang === 'Hindi' ? 'bg-sky-600 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                      🇮🇳 हिंदी नोट्स
                    </button>
                    <button
                      onClick={() => setLessonLang('English')}
                      className={`px-2.5 py-1 rounded-md font-medium transition ${lessonLang === 'English' ? 'bg-sky-600 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                      🇬🇧 English
                    </button>
                  </div>
                )}
              </div>

              {/* Key Takeaways */}
              {activeLesson.keyTakeaways && activeLesson.keyTakeaways.length > 0 && (
                <div className="bg-sky-500/5 p-3.5 rounded-xl border border-sky-500/15 space-y-2">
                  <span className="text-[10px] font-mono text-sky-400 uppercase tracking-widest font-bold block">
                     मुख्य बिंदु (Key Takeaways)
                  </span>
                  <ul className="space-y-1.5 text-xs text-gray-200">
                    {activeLesson.keyTakeaways.map((point, pIdx) => (
                      <li key={pIdx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Text Content Panel */}
              <div className="bg-[#0b0e14] p-4 rounded-xl border border-white/5 text-xs text-gray-300 leading-relaxed space-y-3 max-h-[250px] overflow-y-auto font-sans">
                {(lessonLang === 'Hindi' && activeLesson.contentHindi ? activeLesson.contentHindi : activeLesson.content)
                  .split('\n\n')
                  .map((para, i) => {
                    if (para.startsWith('###')) {
                      return <h4 key={i} className="text-sm font-bold text-white pt-2 border-b border-white/5 pb-1">{para.replace('###', '')}</h4>;
                    }
                    if (para.startsWith('-')) {
                      return (
                        <ul key={i} className="list-disc pl-4 space-y-1">
                          {para.split('\n').map((item, j) => (
                            <li key={j} className="text-gray-300">{item.replace('-', '').trim()}</li>
                          ))}
                        </ul>
                      );
                    }
                    return <p key={i}>{para}</p>;
                  })}
              </div>

              {/* Bottom Action */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleMarkComplete}
                  className="w-full bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-bold py-3.5 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 transition shadow-lg"
                >
                  <CheckCircle2 className="w-4 h-4 text-sky-200" /> Mark Lesson Complete & Earn +20 XP
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Course Evaluation Quiz Modal */}
      <AnimatePresence>
        {showQuiz && selectedCourse?.quiz && (
          <div className="fixed inset-0 bg-[#0b0e14]/95 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#121620] border border-white/10 rounded-2xl w-full max-w-lg p-6 space-y-6 shadow-2xl"
            >
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <div>
                  <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest block">{selectedCourse.title}</span>
                  <h3 className="text-base font-bold text-white">Course Evaluation Quiz</h3>
                </div>
                <button onClick={closeQuiz} className="p-1.5 hover:bg-white/5 rounded-xl text-gray-400 hover:text-white">
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
                  <div className="space-y-2.5">
                    {selectedCourse.quiz.questions[currentQuestionIdx].options.map((opt, oIdx) => {
                      const isSelected = selectedOption === oIdx;
                      const isCorrect = selectedCourse.quiz!.questions[currentQuestionIdx].correctIndex === oIdx;
                      let colorClass = 'bg-[#0b0e14] border-white/10 hover:border-sky-500/50 hover:bg-white/5 text-gray-200';
                      
                      if (selectedOption !== null) {
                        if (isSelected) {
                          colorClass = isCorrect ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300' : 'bg-rose-500/20 border-rose-500 text-rose-300';
                        } else if (isCorrect) {
                          colorClass = 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300';
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
                    <div className="bg-sky-500/10 p-3.5 rounded-xl border border-sky-500/20 text-xs text-gray-300 font-sans leading-relaxed flex gap-2">
                      <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                      <span>{selectedCourse.quiz.questions[currentQuestionIdx].explanation}</span>
                    </div>
                  )}

                  {/* Next Step */}
                  {selectedOption !== null && (
                    <button
                      onClick={handleNextQuestion}
                      className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow-lg"
                    >
                      {currentQuestionIdx < selectedCourse.quiz.questions.length - 1 ? 'Next Question' : 'Finish Quiz Evaluation'} <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-center space-y-4 py-4">
                  <div className="w-14 h-14 bg-sky-500/10 border border-sky-500/20 rounded-full flex items-center justify-center mx-auto text-sky-400">
                    <GraduationCap className="w-7 h-7" />
                  </div>
                  <h4 className="text-lg font-bold text-white">Quiz Evaluation Completed!</h4>
                  <p className="text-xs text-gray-300">
                    You scored {quizScore} out of {selectedCourse.quiz.questions.length} questions correctly ({Math.round((quizScore / selectedCourse.quiz.questions.length) * 100)}%).
                  </p>

                  <button
                    onClick={closeQuiz}
                    className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 rounded-xl text-xs transition"
                  >
                    Return to Academy Catalog
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
