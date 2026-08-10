const fs = require('fs');
let code = fs.readFileSync('src/components/Academy.tsx', 'utf8');

// Add import for AILessonStudio
code = code.replace(
  "import { Course, Lesson, VideoTimestamp } from '../types';",
  "import { Course, Lesson, VideoTimestamp } from '../types';\nimport { AILessonStudio } from './AILessonStudio';"
);

// Add playerMode state inside Academy component
code = code.replace(
  "const [lessonLang, setLessonLang] = useState<'Hindi' | 'English'>('English');",
  "const [lessonLang, setLessonLang] = useState<'Hindi' | 'English'>('English');\n  const [playerMode, setPlayerMode] = useState<'ai' | 'youtube'>('ai');"
);

// In handleLessonTap, reset playerMode to 'ai'
code = code.replace(
  "setActiveLesson(lesson);",
  "setActiveLesson(lesson);\n    setPlayerMode('ai');"
);

fs.writeFileSync('src/components/Academy.tsx', code);
console.log('Patch step 1 applied');
