const fs = require('fs');

let headerContent = fs.readFileSync('apps/web/components/Header.tsx', 'utf8');

// Replace the TCHAT button to be simple
const chatBtnRegex = /<m\.button[\s\S]*?<MessageSquare className="w-4 h-4" \/>\s*\{t\("liveChat"\)\}[\s\S]*?<\/m\.button>/m;
const chatBtnReplacement = `<m.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-5 py-2 rounded-full font-bold text-[13px] uppercase tracking-wider text-white bg-white/10 hover:bg-white/20 transition-colors border border-white/20 flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" /> TCHAT
                </m.button>`;
headerContent = headerContent.replace(chatBtnRegex, chatBtnReplacement);

// Replace the PLAY button to be simple
const playBtnRegex = /<m\.button[\s\S]*?<span className="relative z-10">? \{t\("play"\)\}<\/span>[\s\S]*?<\/m\.button>/m;
const playBtnReplacement = `<m.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-2 rounded-full font-black text-[13px] uppercase tracking-wider text-white bg-brand-orange hover:bg-brand-orange-light transition-colors shadow-lg shadow-brand-orange/30 flex items-center gap-2"
                >
                  JOUER
                </m.button>`;
headerContent = headerContent.replace(playBtnRegex, playBtnReplacement);

// In case the emoji was mangled in the file:
const playBtnRegexFallback = /<m\.button[\s\S]*?\{t\("play"\)\}[\s\S]*?<\/m\.button>/m;
if(!headerContent.includes('JOUER</m.button>')) {
   headerContent = headerContent.replace(playBtnRegexFallback, playBtnReplacement);
}

fs.writeFileSync('apps/web/components/Header.tsx', headerContent);
