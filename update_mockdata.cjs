const fs = require('fs');
let code = fs.readFileSync('src/mockData.ts', 'utf8');

// Replace YouTube IDs
code = code.replace(/youtubeId:\s*'Xn7KewMRE7U'/g, "youtubeId: 'p7HKvqRI_Bo'");
code = code.replace(/videoUrl:\s*'https:\/\/www.youtube.com\/watch\?v=Xn7KewMRE7U'/g, "videoUrl: 'https://www.youtube.com/watch?v=p7HKvqRI_Bo'");

code = code.replace(/youtubeId:\s*'1-J_S_fV9Xo'/g, "youtubeId: 'yN7y1p50lY8'");
code = code.replace(/videoUrl:\s*'https:\/\/www.youtube.com\/watch\?v=1-J_S_fV9Xo'/g, "videoUrl: 'https://www.youtube.com/watch?v=yN7y1p50lY8'");

code = code.replace(/youtubeId:\s*'9o9Z_S4W4jM'/g, "youtubeId: 'gFS_5XG1Lmg'");
code = code.replace(/videoUrl:\s*'https:\/\/www.youtube.com\/watch\?v=9o9Z_S4W4jM'/g, "videoUrl: 'https://www.youtube.com/watch?v=gFS_5XG1Lmg'");

code = code.replace(/youtubeId:\s*'S_KqIq3u6v8'/g, "youtubeId: '3UIT2d4_2sI'");
code = code.replace(/videoUrl:\s*'https:\/\/www.youtube.com\/watch\?v=S_KqIq3u6v8'/g, "videoUrl: 'https://www.youtube.com/watch?v=3UIT2d4_2sI'");

code = code.replace(/youtubeId:\s*'u_sL8E7X3_o'/g, "youtubeId: '2v-s8W2W01M'");
code = code.replace(/videoUrl:\s*'https:\/\/www.youtube.com\/watch\?v=u_sL8E7X3_o'/g, "videoUrl: 'https://www.youtube.com/watch?v=2v-s8W2W01M'");

code = code.replace(/youtubeId:\s*'eXW7R9Nq3kE'/g, "youtubeId: '3UIT2d4_2sI'");
code = code.replace(/videoUrl:\s*'https:\/\/www.youtube.com\/watch\?v=eXW7R9Nq3kE'/g, "videoUrl: 'https://www.youtube.com/watch?v=3UIT2d4_2sI'");

code = code.replace(/youtubeId:\s*'Hk9sZq9x9-k'/g, "youtubeId: 'yN7y1p50lY8'");
code = code.replace(/videoUrl:\s*'https:\/\/www.youtube.com\/watch\?v=Hk9sZq9x9-k'/g, "videoUrl: 'https://www.youtube.com/watch?v=yN7y1p50lY8'");

code = code.replace(/youtubeId:\s*'z1_P4X8m4qA'/g, "youtubeId: 'J8m3T5gC11s'");
code = code.replace(/videoUrl:\s*'https:\/\/www.youtube.com\/watch\?v=z1_P4X8m4qA'/g, "videoUrl: 'https://www.youtube.com/watch?v=J8m3T5gC11s'");

code = code.replace(/youtubeId:\s*'7kXqX8M2x9I'/g, "youtubeId: 'gFS_5XG1Lmg'");
code = code.replace(/videoUrl:\s*'https:\/\/www.youtube.com\/watch\?v=7kXqX8M2x9I'/g, "videoUrl: 'https://www.youtube.com/watch?v=gFS_5XG1Lmg'");

code = code.replace(/youtubeId:\s*'9k3P2qX_s9Y'/g, "youtubeId: 'p7HKvqRI_Bo'");
code = code.replace(/videoUrl:\s*'https:\/\/www.youtube.com\/watch\?v=9k3P2qX_s9Y'/g, "videoUrl: 'https://www.youtube.com/watch?v=p7HKvqRI_Bo'");

code = code.replace(/youtubeId:\s*'Xm7P2qX_s9Z'/g, "youtubeId: 'yN7y1p50lY8'");
code = code.replace(/videoUrl:\s*'https:\/\/www.youtube.com\/watch\?v=Xm7P2qX_s9Z'/g, "videoUrl: 'https://www.youtube.com/watch?v=yN7y1p50lY8'");

fs.writeFileSync('src/mockData.ts', code);
console.log('Successfully updated YouTube IDs in mockData.ts');
