// 物理音シミュレーターと積み上げタワーで共通に使う部分
// （データの場所・材質の判定・音の合成）

/* =========================================================
   0. データの場所（Hugging Face から直接読み込む）
   ========================================================= */
export const HF = 'https://huggingface.co/datasets/codepawl/scanned-objects-glb/resolve/main/';
export const glbUrl   = id => `${HF}objects/${encodeURIComponent(id)}/${encodeURIComponent(id)}.glb`;
export const thumbUrl = id => `${HF}thumbs/${encodeURIComponent(id)}.webp`;

/* =========================================================
   1. 材質テーブル
   density : 実効密度 kg/m³（中空の物体は低め）
   rest/fric : 反発係数 / 摩擦係数（2つの物がぶつかると、反発係数は小さい方が使われる）
   hard  : 硬さ 0〜1
   f0    : 基準周波数（大きさ0.12mのとき。大きい物ほど低くなる）
   modes : [周波数比, 相対振幅]   decay: 余韻(秒)  ring: 共鳴の強さ  noise: 接触ノイズの強さ
   ========================================================= */
export const MAT = {
  metal:    {label:'金属',     density:1200, rest:.2 , fric:.4, hard:1.0,  f0:950,  modes:[[1,1],[2.76,.6],[5.40,.4],[8.93,.25]], decay:.9,  ring:1.0, noise:.35},
  ceramic:  {label:'陶器',     density:750, rest:.15, fric:.5, hard:.9,   f0:1400, modes:[[1,1],[2.32,.55],[4.25,.35],[6.63,.2]], decay:.35, ring:.9,  noise:.45},
  glass:    {label:'ガラス',   density:650, rest:.2 ,  fric:.35,hard:.95,  f0:1900, modes:[[1,1],[2.61,.6],[4.92,.4],[7.6,.25]],  decay:.6,  ring:.9,  noise:.35},
  wood:     {label:'木',       density:600, rest:.35, fric:.55,hard:.6,   f0:520,  modes:[[1,1],[2.57,.45],[4.2,.2]],            decay:.12, ring:.8,  noise:.6},
  plastic:  {label:'プラスチック',density:200,rest:.3,fric:.45,hard:.5,   f0:720,  modes:[[1,1],[2.3,.4],[3.9,.2]],              decay:.07, ring:.6,  noise:.6},
  hardplastic:{label:'硬いプラスチック・機器',density:500,rest:.25,fric:.45,hard:.75,f0:1100,modes:[[1,1],[2.45,.5],[4.3,.3]],   decay:.1,  ring:.75, noise:.55},
  shoe:     {label:'靴',       density:350, rest:.15,  fric:.85,hard:.35,  f0:190,  modes:[[1,1],[2.3,.3]],                       decay:.06, ring:.4,  noise:.8},
  rubber:   {label:'ゴム',     density:900, rest:.5 ,  fric:.9, hard:.15,  f0:220,  modes:[[1,1],[1.8,.3]],                       decay:.05, ring:.4,  noise:.7},
  cardboard:{label:'紙・段ボール',density:150,rest:.08,fric:.6, hard:.25,  f0:260,  modes:[[1,1],[2.1,.3]],                       decay:.045,ring:.35, noise:.9},
  fabric:   {label:'布',       density:280, rest:.03,  fric:.8, hard:.1,   f0:160,  modes:[[1,1]],                                decay:.03, ring:.2,  noise:.9},
};
export const FLOOR = {
  woodfloor:{label:'木の床',     color:0x8a6a4a, rest:.4 , fric:.55, hard:.6,  f0:170, modes:[[1,1],[2.4,.4],[3.9,.2]], decay:.14, ring:.7,  noise:.5},
  concrete: {label:'コンクリート',color:0x8c8f93, rest:.45, fric:.7,  hard:1.0, f0:120, modes:[[1,1],[3.1,.2]],          decay:.04, ring:.25, noise:1.0},
  carpet:   {label:'カーペット', color:0x6b3b3b, rest:.05, fric:1.0, hard:.05, f0:90,  modes:[[1,1]],                   decay:.02, ring:.1,  noise:.5},
};

export const OVERRIDES = {
  // 'オブジェクトID': { mat:'metal', mass:0.35 },   ← 個別に材質や質量(kg)を決めたいときはここに書く
};
// 材質の決め方：①OVERRIDES（個別指定） → ②RULES（名前とブランド。上から順に最初に当たったもの） → ③カテゴリの既定値
// 靴（category: shoe）は靴専用のルールで判定する
export const SHOE_RULES = [
  [/\b(sandals?|thong|flip.?flops?|slides?)\b|\bcrocs\b/i, 'rubber'],   // サンダル・クロックス：ゴムのペタッという音
  [/\bugg\b|slipper|moccasin|\bsock/i, 'fabric'],                          // ムートン・スリッパ：ほぼ無音
];
export const RULES = [
  // ── 素材名を含むが、別の物を指す名前（先に除外）
  [/gun ?metal/i, 'hardplastic'],                                              // 色の名前
  [/hair (dryer|straightener)|straightener/i, 'hardplastic'],                  // "Ceramic Hair Straightener"
  [/\bmunchkin\b|\bhefty\b|kotobuki/i, 'plastic'],                             // "Arm Hammer Diaper Pail…" など
  [/sea to summit/i, 'rubber'],                                                 // シリコンの折りたたみボウル
  [/dixie|\bpaper\b(?! mario)|parchment|google cardboard/i, 'cardboard'],
  // ── 素材名がはっきり書いてある
  [/\bporcelain\b|\bceramic\b|stoneware|terra ?cotta|\bglazed\b|corningware/i, 'ceramic'],
  [/\bplastic\b/i, 'plastic'],
  [/stainless|cast iron|\bbrass\b|alumin(i)?um|\bmetal\b|\biron\b/i, 'metal'],
  [/\bfelt\b|\bplush\b|teddy|fabric|towels?\b|dishtowel|washcloth|bath sheet|thinsulate|\bfoam\b|sootheze/i, 'fabric'],
  [/\bwood(en|an)?\b|bamboo|sushi mat|bookend|cutlery block|\bblocks?\b|woven|wicker|\bbasket\b|honey dipper/i, 'wood'],
  [/\bgloves?\b/i, 'fabric'],                                                   // ゴム手袋もぐにゃっとして跳ねない
  [/\brubber\b|silicone|antislip|teething|\bkong\b|squirtin/i, 'rubber'],
  // ── ブランド（ほぼ全部が同じ素材）
  [/plantoys|melissa|granimals/i, 'wood'],                                      // 木のおもちゃ
  [/ecoforms/i, 'hardplastic'],                                                  // 植物繊維を固めた鉢
  [/jarrow|twinlab|perricone|marc anthony|phillips|just for men/i, 'plastic'],  // ボトル・容器入り
  [/wildkin|olive kids|jansport|embark/i, 'fabric'],                            // 布のバッグ・ランチボックス
  // ── 物の種類
  [/\bglass\b|instant coffee|\bsyrup\b|\btonic\b|light bulbs?/i, 'glass'],
  [/\b(fry ?pan|frypan|cake pan|bundt pan|pan set)\b|can opener|\bhammer\b|screwdriver|scissors|\bclamp\b|\bbell\b|toaster|pressure cooker|herring|hard drive|\bhdd\b|wall mount|alarm clock/i, 'metal'],
  [/\bmug\b|\bplates?\b|ramekin|teapot|pitcher|casserole|butter dish|\bsaucer\b|\bbowl\b|soap dish|spoon rest|utensil holder|\b(flower|orchid|electric) pot\b|planter/i, 'ceramic'],
  [/\[dvd\]|\bdvd\b|\bdiscs?\b|\[(nintendo|wii)[^\]]*\]|\bds game\b/i, 'plastic'],                       // ディスク・ゲームソフトのケース
  [/nintendo 64|super nintendo|game boy|\b[23]ds\b|keyboard|\bmouse\b(?! mat)|router|headset|speaker|cartridges?|toner|motherboard|tablet|notebook|\byoga\b|camera|\blens\b|\busb\b|portable drive|storage|flashlight|toothbrush|\br7\b|simon swipe|paint maker|coffeemaker|labelworks/i, 'hardplastic'],
  [/mouse mat|drying mat|armband|\bbib\b|\bhat\b|\bpads?\b|tampons|liners|sponges|snack bags|neck rest/i, 'fabric'],
  [/\bcable\b|\bcord\b|activity tracker|\btape\b/i, 'rubber'],
  [/\bcans\b|\b12 ?(pk|ct|pack)\b|pepsi|fresca|k-cups?|advent calendar|creationary|\bbook\b|eat to live|crayons|chalk|\bbox\b|cereal|crackers|candy|snacks|music studio|\bloops\b|subscription|instax|label|model magic|card game|card & invitation|cocoa|coffee/i, 'cardboard'],
  [/bottles?|supplements?|capsules?|\bcaps\b|caplets|probiotic|softener|laxative|liquid|serum|cream|lotion|cleanser|moisturizer|conditioner|treatment|\boil\b|whey|protein|powder|canister|sparkling water/i, 'plastic'],
];
export const CATEGORY_MAT = {
  'shoe':'shoe', 'clothing':'fabric', 'bag':'fabric',
  'toy':'plastic', 'household':'plastic', 'electronics':'hardplastic', 'health and beauty':'plastic',
  'baby gear':'plastic', 'other':'plastic', 'bottles and cups':'plastic',
  'kitchen':'plastic', 'food and drink':'cardboard', 'board game':'cardboard', 'media':'plastic',
};
export function decideMat(id, name, category, brand){
  if (OVERRIDES[id]?.mat) return {mat: OVERRIDES[id].mat, why: '個別指定'};
  const text = `${name} ${brand || ''}`;
  const cat = (category || '').toLowerCase();
  const rules = cat === 'shoe' ? SHOE_RULES : RULES;
  for (const [re, mat] of rules){
    const m = text.match(re);
    if (m) return {mat, why: `名前「${m[0]}」`};
  }
  // 靴カテゴリ以外に紛れ込んだ靴
  if (cat !== 'shoe' && /\b(shoe|boot|sneaker)s?\b/i.test(text)) return {mat:'shoe', why:'名前（靴）'};
  return {mat: CATEGORY_MAT[cat] || 'plastic', why: `カテゴリ「${category || '-'}」`};
}

/* =========================================================
   4. データセットの読み込み（メタデータ・凸包）
   ========================================================= */
let HULLS = null;         // collision_hulls.json（構造に依存しないよう緩く読む）

const num = v => (typeof v === 'number' && isFinite(v)) ? v : undefined;
// metadata.jsonl を読み込んで {id,name,category,brand,size,mass} の配列を返す
export async function loadMetadata(){
  const res = await fetch(HF + 'metadata.jsonl');
  if (!res.ok) throw new Error('metadata ' + res.status);
  const text = await res.text();
  return text.split('\n').filter(l=>l.trim()).map(l=>{
    const r = JSON.parse(l);
    const id = r.id ?? r.object_id ?? r.name;
    const dims = (Array.isArray(r.size_metres) ? r.size_metres : [r.width_m, r.height_m, r.depth_m]).filter(x=>num(x)!==undefined);
    return {
      id, name: r.name ?? id, category: r.category ?? r.shelf_category ?? '', brand: r.brand ?? '',
      size: dims.length ? Math.max(...dims) : undefined,
      mass: num(r.mass_estimate_kg) ?? num(r.mass_kg) ?? num(r.mass),
      tris: num(r.triangles),
    };
  }).filter(m=>m.id);
}
export async function loadHulls(){
  try {
    const res = await fetch(HF + 'collision_hulls.json');
    if (res.ok) HULLS = await res.json();
  } catch(e) { console.warn('hulls', e); }
}
function flatPts(p){
  if (!p || !p.length) return null;
  return new Float32Array(typeof p[0] === 'number' ? p : p.flat());
}
export function hullFor(id){
  if (!HULLS) return null;
  const list = Array.isArray(HULLS) ? HULLS : Array.isArray(HULLS.objects) ? HULLS.objects : Array.isArray(HULLS.hulls) ? HULLS.hulls : null;
  let e = list ? list.find(x=>x.id===id || x.name===id) : (HULLS[id] ?? HULLS.objects?.[id] ?? HULLS.hulls?.[id]);
  if (!e) return null;
  if (Array.isArray(e)) return {points: flatPts(e)};
  return {points: flatPts(e.points ?? e.hull ?? e.vertices ?? e.verts), mass: num(e.mass_estimate_kg) ?? num(e.mass_kg)};
}

/* =========================================================
   音（Web Audio・モーダル合成）
   ========================================================= */
let actx = null, master = null, noiseBuf = null, voices = 0;
const MAX_VOICES = 32;
export function initAudio(){
  actx = new (window.AudioContext||window.webkitAudioContext)();
  const comp = actx.createDynamicsCompressor();
  comp.threshold.value = -14; comp.ratio.value = 6;
  master = actx.createGain(); master.gain.value = .9;
  master.connect(comp).connect(actx.destination);
  noiseBuf = actx.createBuffer(1, actx.sampleRate, actx.sampleRate);
  const d = noiseBuf.getChannelData(0); for (let i=0;i<d.length;i++) d[i] = Math.random()*2-1;
  return actx.resume();
}
export const clamp = (x,a,b)=>Math.min(b,Math.max(a,x));

// 靴が全体の約25%あり、一様ランダムだと出すぎるので重みを下げる（未指定のカテゴリは1）
export const CATEGORY_WEIGHT = { shoe: 0.25 };
export function pickWeighted(list){
  const w = it => CATEGORY_WEIGHT[it.category] ?? 1;
  let total = 0;
  for(const it of list) total += w(it);
  let r = Math.random()*total;
  for(const it of list){ r -= w(it); if(r < 0) return it; }
  return list[list.length-1];
}
const track = node => { voices++; node.onended = ()=>voices--; };

// 1つの物体（または床）の「鳴り」を発音
export function ring(mat, size, amp, strikerHard, pan){
  if (!actx || voices > MAX_VOICES || amp < .002) return;
  const t = actx.currentTime;
  const out = actx.createStereoPanner(); out.pan.value = pan; out.connect(master);
  const f0 = clamp(mat.f0 * Math.pow(.12/size, .8), 45, 6000);
  const contact = Math.min(mat.hard, strikerHard);          // 柔らかい方が接触の質を決める
  const bright = .2 + .8*strikerHard;                         // 柔らかい相手だと高次モードが出にくい
  const lenScale = clamp(size/.12, .5, 2.2);
  mat.modes.forEach(([r,a],i)=>{
    const f = f0*r*(1+(Math.random()-.5)*.03);
    if (f > 15000) return;
    const peak = amp*a*mat.ring*Math.pow(bright,i);
    if (peak < .001) return;
    const dec = mat.decay*lenScale/(1+i*.6);
    const o = actx.createOscillator(); o.frequency.value = f;
    const g = actx.createGain();
    g.gain.setValueAtTime(.0001,t);
    g.gain.exponentialRampToValueAtTime(peak, t+.002);
    g.gain.exponentialRampToValueAtTime(.0001, t+dec);
    o.connect(g).connect(out); o.start(t); o.stop(t+dec+.05); track(o);
  });
  const n = actx.createBufferSource(); n.buffer = noiseBuf;
  const lp = actx.createBiquadFilter(); lp.type='lowpass';
  lp.frequency.value = 180 + 9000*Math.pow(contact,1.5);
  const ng = actx.createGain();
  const nd = .012 + .07*(1-contact);
  ng.gain.setValueAtTime(Math.max(.0002, amp*mat.noise*.8), t);
  ng.gain.exponentialRampToValueAtTime(.0001, t+nd);
  n.connect(lp).connect(ng).connect(out);
  n.start(t, Math.random()*.8); n.stop(t+nd+.02); track(n);
}

