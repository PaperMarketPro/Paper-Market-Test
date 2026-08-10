const fs = require('fs');
let code = fs.readFileSync('src/components/Academy.tsx', 'utf8');

const targetStr = `              {/* Video Player Frame */}
              {activeLesson.youtubeId ? (`;

const replaceStr = `              {/* Mode Selector Tabs */}
              <div className="flex items-center gap-2 bg-[#0b0e14] p-1.5 rounded-xl border border-white/10 text-xs font-medium">
                <button
                  onClick={() => setPlayerMode('ai')}
                  className={\`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition \${
                    playerMode === 'ai'
                      ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white font-bold shadow-md'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }\`}
                >
                  <Sparkles className="w-4 h-4 text-sky-300" />
                  <span>🤖 AI Interactive Studio & Voiceover</span>
                </button>
                <button
                  onClick={() => setPlayerMode('youtube')}
                  className={\`flex-1 py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition \${
                    playerMode === 'youtube'
                      ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white font-bold shadow-md'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }\`}
                >
                  <Video className="w-4 h-4 text-red-300" />
                  <span>🎥 YouTube Video Masterclass</span>
                </button>
              </div>

              {/* Player Body depending on mode */}
              {playerMode === 'ai' ? (
                <AILessonStudio
                  lesson={activeLesson}
                  course={selectedCourse}
                  lang={lessonLang}
                  onCompleteLesson={handleMarkComplete}
                />
              ) : activeLesson.youtubeId ? (`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, replaceStr);
  fs.writeFileSync('src/components/Academy.tsx', code);
  console.log('Patch step 2 applied successfully');
} else {
  console.log('Target string not found');
}
