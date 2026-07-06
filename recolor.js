import fs from 'fs';
let content = fs.readFileSync('src/pages/AppPage.tsx', 'utf8');

content = content.replace(/text-\[#00E5FF\]/g, 'text-[#a020f0]');
content = content.replace(/bg-\[#00E5FF\]/g, 'bg-[#a020f0]');
content = content.replace(/border-\[#00E5FF\]/g, 'border-[#a020f0]');
content = content.replace(/from-\[#00E5FF\]/g, 'from-[#a020f0]');
content = content.replace(/hover:bg-\[#00cce6\]/g, 'hover:bg-[#a020f0]/80');

content = content.replace(/text-\[#7B2FFF\]/g, 'text-[#a020f0]');
content = content.replace(/bg-\[#7B2FFF\]/g, 'bg-[#a020f0]');
content = content.replace(/border-\[#7B2FFF\]/g, 'border-[#a020f0]');
content = content.replace(/from-\[#7B2FFF\]/g, 'from-[#a020f0]');

content = content.replace(/text-\[#FF1744\]/g, 'text-white/30');
content = content.replace(/decoration-\[#FF1744\]/g, 'decoration-white/30');
content = content.replace(/bg-\[#FF1744\]/g, 'bg-white/10');

content = content.replace(/text-emerald-400/g, 'text-[#a020f0]');
content = content.replace(/text-emerald-500/g, 'text-[#a020f0]');
content = content.replace(/border-emerald-500/g, 'border-[#a020f0]');
content = content.replace(/bg-emerald-500/g, 'bg-[#a020f0]');

content = content.replace(/text-amber-500/g, 'text-[#a020f0]');
content = content.replace(/border-amber-500/g, 'border-[#a020f0]');
content = content.replace(/bg-amber-500/g, 'bg-[#a020f0]');

content = content.replace(/rgba\(255,23,68/g, 'rgba(255,255,255');
content = content.replace(/rgba\(123,47,255/g, 'rgba(160,32,240');

content = content.replace(/#FFD600/g, '#a020f0');
content = content.replace(/to-orange-500/g, 'to-[#111111]');
content = content.replace(/text-red-400/g, 'text-white/50');
content = content.replace(/from-red-400/g, 'from-white/10');
content = content.replace(/bg-red-500/g, 'bg-white/5');
content = content.replace(/border-red-500/g, 'border-white/5');

fs.writeFileSync('src/pages/AppPage.tsx', content);
console.log('Harmonized colors.');
