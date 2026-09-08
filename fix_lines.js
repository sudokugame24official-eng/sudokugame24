const fs = require('fs');
let lines = fs.readFileSync('apps/web/components/home/HomeClient.tsx', 'utf8').split('\n');

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('StatBadge') && lines[i].includes('statRating')) {
    lines[i] = '              <StatBadge value="4.9 \\u2605" label={t("statRating")} color="text-brand-cyan" />';
  }
  if (lines[i].includes('eloMatchmaking')) {
    lines[i] = '                      <span>\\u2694\\uFE0F {t("eloMatchmaking")}</span>';
  }
}

fs.writeFileSync('apps/web/components/home/HomeClient.tsx', lines.join('\n'), 'utf8');
