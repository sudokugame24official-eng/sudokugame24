const fs = require('fs');
let content = fs.readFileSync('apps/web/components/home/HomeClient.tsx', 'utf8');

content = content.replace(/4\.9.*/, '4.9 ?" label={t("statRating")} color="text-brand-cyan" />');
content = content.replace(/.*1V1 ELO MATCHMAKING.*/, '                    <span className="text-[10px] font-black uppercase tracking-[0.15em] text-brand-gold">?? 1V1 ELO MATCHMAKING</span>');

fs.writeFileSync('apps/web/components/home/HomeClient.tsx', content, 'utf8');
