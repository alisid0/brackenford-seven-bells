// Writes shared/game-data.json: the numbers both versions of the game read, taken from src/game.js and src/config.json
// so that the web game stays the one place they are set. Run: node tools/export-data.mjs
// The Unity project copies this file into its StreamingAssets (see unity/README.md).
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
const root=join(dirname(fileURLToPath(import.meta.url)),'..'),src=readFileSync(join(root,'src/game.js'),'utf8');
// the text of a "const NAME=<literal>" up to the end of the literal, by matching brackets
function literal(name){
 const at=src.indexOf('const '+name+'=');if(at<0)throw new Error('no const '+name);
 let i=at+('const '+name+'=').length,depth=0,quote=null;const start=i;
 for(;i<src.length;i++){const c=src[i];
  if(quote){if(c==='\\')i++;else if(c===quote)quote=null;continue;}
  if(c==="'"||c==='"'||c==='`'){quote=c;continue;}
  if(c==='['||c==='{'||c==='(')depth++;else if(c===']'||c==='}'||c===')'){depth--;if(depth===0){i++;break;}}
  else if(depth===0&&(c===','||c===';'))break;
 }
 return new Function('return '+src.slice(start,i))();
}
// "a,b,NAME=<literal>" inside a longer const line
function inline(name){
 const m=src.match(new RegExp('[ ,]'+name+'=(\\{[^;]*?\\}|\\[[^;]*?\\]|[-.\\d]+)[,;]'));if(!m)throw new Error('no '+name);return new Function('return '+m[1])();
}
const config=JSON.parse(readFileSync(join(root,'src/config.json'),'utf8'));
const stages=literal('ALL_STAGES').map((s,i)=>({id:i+1,name:s.name,arrows:s.arrows,wind:s.wind||[0,0],
 targets:(s.marks||[]).map(m=>({along:m[0],right:m[1]||0,size:m[2],slide:m[3]?{reach:m[3][0],rate:m[3][1]}:null,pop:m[4]?{up:m[4][0],down:m[4][1],offset:m[4][2]}:null})),
 shades:s.spirits||[],grass:s.grass||[]}));
const yard=literal('YARD'),lane=literal('LANE'),ribbon=literal('RIBBON');
const data={
 note:'Written by tools/export-data.mjs from src/game.js. Do not edit by hand; change the web game and run the tool.',
 units:'metres, seconds; along = down the lane from the shooting line, right = to the archer\'s right',
 title:config.title,releaseOrder:config.order,
 bow:{arrowSpeed:62,gravity:7,note:'full-draw launch speed in m/s and the game\'s own gravity in m/s2 (not 9.81); wind pushes sideways at 1.4 x wind m/s2'},
 target:{centreHeight:'0.75 + 0.72 * size',outerDiameter:'1.36 * size'},
 scoring:{rings:[{within:.1,points:100},{within:.23,points:80},{within:.37,points:60},{within:.5,points:40},{within:9,points:20}],ringsNote:'distance from the centre in target units (multiply by its size for metres); copied by hand from rangeHit in src/game.js, as are the bow numbers above',points:'round((ring + distance to the archer in m) x streak bonus x perfect release)',starAt:literal('STAR_AT'),shadeValue:inline('SPIRIT'),streakBonus:'x min(2, 1 + 0.1 * (streak - 1))',perfectRelease:1.25},
 lane,place:{name:'Willowbank Range',practiceBell:{along:22,right:12.5,tone:523}},
 arrows:literal('ARROW_RULE'),ribbons:ribbon,
 bellWatch:{...literal('WATCH_RULE'),...literal('WATCH_BELL')},
 stages};
mkdirSync(join(root,'shared'),{recursive:true});
writeFileSync(join(root,'shared/game-data.json'),JSON.stringify(data,null,1));
console.log('wrote shared/game-data.json:',stages.length,'stages,',Object.keys(ribbon).length,'ribbons');
void yard;
