'use strict'
// ---- Config: set window.MINDBLOOM_API_URL before this script to change the backend address ----
const API_URL = (window.MINDBLOOM_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '')
const AXIS_MAX = 10 // visual reference axis only; no thresholds or categories are implied

// ---------- Voice parsing ----------
const W = { zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 }
function num(t) {
  const s = t.toLowerCase().replace(/,/g, ''); const m = s.match(/\d+(\.\d+)?/); let v = m ? parseFloat(m[0]) : null
  if (v === null) { let tot = 0, f = false; for (const w of s.split(/[\s-]+/)) { if (w in W) { f = true; tot += W[w] } else if (w === 'hundred' && f) tot = (tot || 1) * 100 } if (f) v = tot }
  if (/and (a )?half/.test(s) && v !== null) v += .5; else if (v === null && /\bhalf\b/.test(s)) v = .5; return v
}
const r2 = n => String(Math.round(n * 100) / 100)
function hours(t) {
  const s = t.toLowerCase()
  if (/\b(none|no time|zero|never|nothing|not at all)\b/.test(s) || /don'?t (exercise|work out)/.test(s)) return '0'
  const h = s.match(/(\d+(\.\d+)?)\s*(hours?|hrs?|h)\b/), m = s.match(/(\d+)\s*(minutes?|mins?)\b/)
  if (h || m) return r2((h ? parseFloat(h[1]) : 0) + (m ? parseInt(m[1]) / 60 : 0))
  const n = num(s); if (n === null) return null; return /minute|min\b/.test(s) ? r2(n / 60) : r2(n)
}
const pick = (t, rules) => { const s = t.toLowerCase(); for (const [o, re] of rules) if (re.test(s)) return o; return null }
const ALIAS = { 'united states': 'USA', 'united states of america': 'USA', 'us': 'USA', 'u s': 'USA', 'america': 'USA', 'usa': 'USA', 'united kingdom': 'UK', 'britain': 'UK', 'england': 'UK', 'great britain': 'UK', 'uk': 'UK' }
function country(t) {
  const s = t.toLowerCase().replace(/[.,!]/g, '').replace(/^(i\s+)?(am\s+)?(live|living|study|studying|stay|staying|from|based)?\s*(in|from|at)?\s*(the\s+)?/, '').trim()
  if (!s) return null; if (ALIAS[s]) return ALIAS[s]; return s.split(/\s+/).map(w => w[0].toUpperCase() + w.slice(1)).join(' ')
}
const integer = t => { const n = num(t); return n === null ? null : String(Math.round(n)) }
const PLATFORMS = ['Facebook', 'LinkedIn', 'Instagram', 'Snapchat', 'Twitter', 'YouTube', 'TikTok', 'LINE', 'KakaoTalk', 'VKontakte', 'WhatsApp', 'WeChat']
const COUNTRIES = ['India', 'USA', 'Canada', 'Australia', 'UK', 'Germany', 'Mexico', 'Turkey', 'France', 'Brazil', 'China', 'Japan', 'South Korea', 'Russia', 'Spain', 'Italy', 'Pakistan', 'Bangladesh', 'Nepal', 'Sri Lanka', 'Nigeria', 'South Africa', 'UAE', 'Singapore']

// Exactly the 12 fields your FastAPI model expects
const Q = [
  { key: 'age', prompt: 'How old are you?', say: 'First up, how old are you?', kind: 'number', unit: 'years', min: 10, max: 100, int: 1, parse: integer },
  { key: 'gender', prompt: 'How do you identify?', say: 'How do you identify? The model currently understands male or female.', hint: 'The current model only accepts Male or Female. We know that doesn’t describe everyone, and we’re sorry for the limitation. Pick whichever is closest for this estimate.', kind: 'choice', options: ['Female', 'Male'], parse: t => pick(t, [['Female', /\b(female|woman|girl|she)\b/], ['Male', /\b(male|man|boy|he)\b/]]) },
  { key: 'country', prompt: 'Which country do you live in?', say: 'Which country do you live in?', kind: 'text', parse: country },
  { key: 'academic_level', prompt: 'What is your current academic level?', say: 'What is your current academic level? High school, undergraduate, or graduate?', kind: 'choice', options: ['High School', 'Undergraduate', 'Graduate'], parse: t => pick(t, [['Undergraduate', /undergrad|bachelor|college|b\.?tech|\bbsc\b|\bba\b/], ['High School', /high school|secondary|school|12th|11th|10th/], ['Graduate', /graduate|master|\bmba\b|phd|doctor|postgrad/]]) },
  { key: 'most_used_platform', prompt: 'Which social media platform do you use most?', say: 'Which social media platform do you use the most?', kind: 'select', options: PLATFORMS, parse: t => pick(t, [['Instagram', /insta|\big\b/], ['YouTube', /you ?tube|\byt\b/], ['WhatsApp', /whats ?app/], ['TikTok', /tik ?tok/], ['Facebook', /facebook|\bfb\b/], ['LinkedIn', /linked ?in/], ['Snapchat', /snap/], ['Twitter', /twitter|\bx\b|tweet/], ['LINE', /\bline\b/], ['KakaoTalk', /kakao/], ['VKontakte', /vkontakte|\bvk\b/], ['WeChat', /we ?chat/]]) },
  { key: 'purpose_of_use', prompt: 'What do you mainly use social media for?', say: 'What do you mainly use social media for? Networking, education, entertainment, or news?', kind: 'choice', options: ['Networking', 'Education', 'Entertainment', 'News'], parse: t => pick(t, [['Networking', /network|connect|friends|professional|career|job/], ['Education', /educat|study|learn|course|research|class/], ['Entertainment', /entertain|fun|watch|video|game|meme|relax|scroll/], ['News', /news|current|update|headline/]]) },
  { key: 'avg_daily_usage_hours', prompt: 'About how many hours a day are you on social media?', say: 'Roughly how many hours a day do you spend on social media?', kind: 'number', unit: 'hours / day', min: 0, max: 24, step: .5, slider: 1, parse: hours },
  { key: 'daily_unlocks', prompt: 'How many times do you unlock your phone in a day?', say: 'About how many times do you unlock your phone each day?', hint: 'A rough guess is perfect. Your phone’s screen-time settings may show it.', kind: 'number', unit: 'unlocks / day', min: 0, int: 1, parse: integer },
  { key: 'study_hours', prompt: 'How many hours do you study each day?', say: 'How many hours do you study each day?', kind: 'number', unit: 'hours / day', min: 0, max: 24, step: .5, slider: 1, parse: hours },
  { key: 'physical_activity_hours', prompt: 'How much time do you spend on physical activity daily?', say: 'How much time do you spend on physical activity each day?', kind: 'number', unit: 'hours / day', min: 0, max: 24, step: .25, slider: 1, parse: hours },
  { key: 'sleep_hours_per_night', prompt: 'On average, how many hours do you sleep a night?', say: 'On average, how many hours do you sleep each night?', kind: 'number', unit: 'hours / night', min: 0, max: 24, step: .5, slider: 1, parse: hours },
  { key: 'stress_level', prompt: 'How would you describe your stress level right now?', say: 'How would you describe your current stress level? Low, medium, high, or very high?', hint: 'There’s no right answer. Just what feels true today.', kind: 'choice', options: ['Low', 'Medium', 'High', 'Very High'], parse: t => pick(t, [['Very High', /very high|extremely|severe|really high|super high|maximum|overwhelm/], ['Low', /\blow\b|barely|minimal|not (much|very|that)|little|relaxed|calm/], ['Medium', /medium|moderate|average|okay|so-so|manageable|middle|normal/], ['High', /\bhigh\b|stressed|a lot|heavy/]]) }]
const CHEER = ['Great start!', 'Thanks for sharing.', 'No judgement here.', 'You’re doing really well.', 'Nice pace!', 'Every answer helps.', 'Almost there!', 'You’re doing great.', 'Just a few more.', 'Thanks for being open.', 'So close now.', 'Last one, you’ve got this!']

function validate(q, v) {
  const s = (v ?? '').trim(); if (!s) return 'Please share an answer to continue.'
  if (q.kind === 'number') { const n = Number(s); if (!Number.isFinite(n)) return 'Please enter a number.'; if (q.int && !Number.isInteger(n)) return 'Please enter a whole number.'; if (q.min !== undefined && n < q.min) return `Please enter ${q.min} or more.`; if (q.max !== undefined && n > q.max) return `Please enter ${q.max} or less.` }
  if ((q.kind === 'choice' || q.kind === 'select') && !q.options.includes(s)) return 'Please pick one of the options.'
  if (q.kind === 'text' && s.length < 2) return 'Please enter a country name.'; return null
}
function payload() {
  const a = S.answers, n = k => Number(a[k]), g = k => String(a[k]).trim()
  return { age: n('age'), gender: g('gender'), country: g('country'), academic_level: g('academic_level'), most_used_platform: g('most_used_platform'), purpose_of_use: g('purpose_of_use'), avg_daily_usage_hours: n('avg_daily_usage_hours'), daily_unlocks: n('daily_unlocks'), study_hours: n('study_hours'), physical_activity_hours: n('physical_activity_hours'), sleep_hours_per_night: n('sleep_hours_per_night'), stress_level: g('stress_level') }
}

// ---------- Character ----------
const POSES = { wave: { R: [[215, 262], [252, 205], [262, 140]], e: 'wink', m: 'open' }, smile: { R: [[215, 262], [228, 305], [208, 335]], e: 'open', m: 'smile' }, explain: { R: [[215, 262], [258, 238], [282, 196]], e: 'open', m: 'open' }, think: { R: [[215, 262], [222, 222], [176, 200]], e: 'up', m: 'small' }, listen: { R: [[215, 262], [228, 305], [208, 335]], e: 'open', m: 'small' }, encourage: { R: [[215, 262], [255, 222], [262, 178]], e: 'open', m: 'big' }, celebrate: { R: [[215, 262], [255, 200], [266, 132]], L: [[85, 262], [45, 205], [36, 136]], e: 'happy', m: 'big' } }
const path = p => 'M' + p.map(a => a.join(' ')).join(' L')
function character(pose = 'smile', cls = '') {
  const a = POSES[pose], L = a.L || [[85, 262], [72, 305], [118, 322]], tilt = pose === 'listen' ? 6 : pose === 'think' ? -4 : 0
  const eye = (x, w) => a.e === 'happy' || w ? `<path d="M${x - 9} 138 Q${x} ${w ? 132 : 128} ${x + 9} 138" stroke="#4A2C1A" stroke-width="3.5" fill="none" stroke-linecap="round"/>` : `<g class="blink"><ellipse cx="${x}" cy="${a.e === 'up' ? 133 : 136}" rx="8" ry="10" fill="#4A2C1A"/><circle cx="${x + 2}" cy="${a.e === 'up' ? 129 : 131}" r="3" fill="#fff"/></g>`
  const mouth = { smile: '<path d="M138 168 Q150 178 162 168" stroke="#8A3B2A" stroke-width="3.5" fill="none" stroke-linecap="round"/>', open: '<path d="M136 164 Q150 188 164 164Z" fill="#8A3B2A"/>', small: '<ellipse cx="150" cy="170" rx="5" ry="4.5" fill="#8A3B2A"/>', big: '<path d="M132 162 Q150 192 168 162Z" fill="#8A3B2A"/><path d="M141 175 Q150 181 159 175" fill="#E8836F"/>' }[a.m]
  const sleeve = 'stroke="#E1B24A" stroke-width="34" stroke-linecap="round" stroke-linejoin="round" fill="none"'
  const stars = pose === 'celebrate' ? [[40, 60], [255, 70], [150, 22], [280, 150], [18, 150]].map(([x, y], i) => `<path class="float" style="animation-delay:${i * .4}s" fill="#D4AF37" d="M${x} ${y - 9}L${x + 3} ${y - 3}L${x + 9} ${y}L${x + 3} ${y + 3}L${x} ${y + 9}L${x - 3} ${y + 3}L${x - 9} ${y}L${x - 3} ${y - 3}Z"/>`).join('') : ''
  return `<svg viewBox="0 0 300 370" role="img" aria-label="MindBloom wellness buddy, ${pose}" class="char ${cls}"><ellipse cx="150" cy="360" rx="95" ry="9" fill="#CE8946" opacity=".18"/><g transform="rotate(${tilt} 150 250)">
<path d="M92 120C70 150 62 220 78 262L222 262C240 220 232 150 208 120Z" fill="#5B3420"/><path d="M70 262Q150 232 230 262L240 372L60 372Z" fill="#E1B24A"/><path d="M118 262Q150 285 182 262" stroke="#C99A33" stroke-width="8" fill="none" stroke-linecap="round"/>
<path d="M96 258L84 372" stroke="#F1E7C8" stroke-width="16" stroke-linecap="round"/><g fill="#fff">${[0, 72, 144, 216, 288].map(r => `<ellipse cx="188" cy="316" rx="6" ry="11" transform="rotate(${r} 188 322)"/>`).join('')}</g><circle cx="188" cy="322" r="5" fill="#D4AF37"/>
<path d="${path(L)}" ${sleeve}/><rect x="92" y="296" width="80" height="62" rx="6" fill="#7A8450" transform="rotate(-8 132 327)"/><rect x="98" y="302" width="68" height="6" fill="#F1E7C8" transform="rotate(-8 132 327)"/>
<g class="${pose === 'wave' ? 'sway' : ''}"><path d="${path(a.R)}" ${sleeve}/><circle cx="${a.R[2][0]}" cy="${a.R[2][1]}" r="15" fill="#F6D2B0"/></g><circle cx="${L[2][0]}" cy="${L[2][1]}" r="13" fill="#F6D2B0"/>
<rect x="136" y="214" width="28" height="36" rx="12" fill="#F6D2B0"/><circle cx="150" cy="140" r="64" fill="#F6D2B0"/><path d="M84 138C80 70 130 52 160 58C206 62 222 100 216 140C206 112 190 96 160 92C128 96 100 104 84 138Z" fill="#5B3420"/><path d="M92 70L66 56L84 86ZM92 70L72 98L86 90Z" fill="#F1E7C8"/>
${eye(126)}${eye(174, a.e === 'wink')}<path d="M114 118Q126 112 138 118M162 118Q174 112 186 118" stroke="#4A2C1A" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="112" cy="156" r="9" fill="#F4A58A" opacity=".5"/><circle cx="188" cy="156" r="9" fill="#F4A58A" opacity=".5"/>${mouth}<circle cx="86" cy="166" r="4" fill="#D4AF37"/></g>${stars}</svg>`
}
const bubble = t => `<div class="bubble">${t}</div>`
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

// ---------- State ----------
const S = { step: 'welcome', mode: 'manual', slide: 0, i: 0, answers: {}, heard: '', note: '', err: '', listening: false, status: 'loading', score: null, error: '', open: false }
const $ = s => document.querySelector(s), app = $('#app')
function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 4200) }
function go(step) { stopVoice(true); S.step = step; render(); window.scrollTo(0, 0) }

// ---------- Screens ----------
const SLIDES = [
  ['🩺', 'What is mental health?', 'Your mental health is just as important as your physical health.', 'It’s how we think, feel and cope with everyday life. It changes from day to day, and having ups and downs is completely normal.', 'explain'],
  ['🎓', 'Why it matters for students', 'New places, new people, so much at once!', 'Deadlines, exams, money and friendships often arrive together. Checking in with yourself early makes it easier to notice what helps, and to ask for support.', 'smile'],
  ['📚', 'Academic pressure and stress', 'Sometimes we focus so much on grades that we forget to check in with ourselves.', 'A little stress can help us focus. When it stays high for a long time, it can affect sleep, mood and concentration.', 'think'],
  ['🌙', 'Sleep, movement and mood', 'Small habits add up.', 'Research links regular sleep and physical activity with better mood and focus. Steady, kind routines tend to matter more than perfect ones.', 'encourage'],
  ['📱', 'Social media and daily routines', 'It’s not only about how long, but how and why.', 'Studies on social media and wellbeing give mixed results. Noticing how you feel after scrolling is a useful place to start.', 'listen']]
const brand = '<div class="brand"><span style="font-size:30px">🌼</span><div><b>MindBloom</b><small>Breathe. Reflect. Thrive.</small></div></div>'
function welcome() {
  return `<section class="screen">${brand}<div class="grid2"><div style="position:relative;text-align:center">${bubble('Hey there! I’m your wellness buddy.')}<div class="float">${character('wave')}</div></div>
<div><h1 class="hero">Your mental health matters.</h1><p class="lead">College life is exciting, but let’s be honest — sometimes it can get overwhelming too.</p><p class="lead">I’m here to help you understand your mental wellness, one little step at a time.</p>
<button class="btn big" data-act="learn" style="margin-top:14px">Let’s Begin →</button><p class="muted" style="margin-top:34px;font-size:14px">A student mental wellness project ✦ an experimental ML estimate, not a diagnosis.</p></div></div></section>`}
function learn() {
  const s = SLIDES[S.slide], last = S.slide === SLIDES.length - 1
  return `<section class="screen grid2" style="min-height:90vh"><div>${character(s[4])}</div><div><div class="dots" aria-label="Step ${S.slide + 1} of ${SLIDES.length}">${SLIDES.map((_, k) => `<i class="${k === S.slide ? 'on' : ''}"></i>`).join('')}</div>${bubble(s[2])}
<div class="card" style="margin-top:28px"><div class="icon">${s[0]}</div><h2 style="font-size:30px">${s[1]}</h2><p class="lead muted">${s[3]}</p>${last ? '<p style="font:600 21px \'Playfair Display\',serif">So, shall we take a little look at your everyday habits?</p>' : ''}</div>
<div class="row"><button class="btn ghost" data-act="lback">← Back</button><button class="btn" data-act="lnext">${last ? 'Yes, Let’s Go!' : 'Next →'}</button></div></div></section>`
}
function choose() {
  return `<section class="screen center"><div style="text-align:left"><button class="btn ghost" data-act="cback">← Back</button></div>${character('explain', 'small')}<div>${bubble('How would you like to answer today?')}</div>
<div class="modes" style="text-align:left"><div class="card"><div class="icon">🎙️</div><h2 style="font-size:30px">Let’s Talk</h2><p>Answer the questions naturally using your voice. I’ll read each one out, and you can review everything you say.</p><button class="btn" data-act="mode" data-m="voice">Start Voice Assessment</button></div>
<div class="card"><div class="icon">📋</div><h2 style="font-size:30px">I’ll Type My Answers</h2><p>Prefer answering at your own pace? Fill in the questions manually.</p><button class="btn" data-act="mode" data-m="manual">Start Assessment</button></div></div>
<p class="muted" style="font-size:14px;margin-top:20px">Both options ask the same 12 questions. Voice works in browsers that support speech recognition (Chrome, Edge).</p></section>`}
function field(q, v) {
  if (q.kind === 'select') return `<select id="inp" aria-label="${esc(q.prompt)}"><option value="">Choose one…</option>${q.options.map(o => `<option ${o === v ? 'selected' : ''}>${o}</option>`).join('')}</select>`
  if (q.kind === 'choice') return `<div class="chips" role="radiogroup" aria-label="${esc(q.prompt)}">${q.options.map(o => `<button class="chip" role="radio" aria-checked="${o === v}" data-act="pick" data-v="${o}">${o}</button>`).join('')}</div>`
  if (q.kind === 'text') return `<input id="inp" type="text" list="cl" value="${esc(v)}" placeholder="e.g. India" aria-label="${esc(q.prompt)}"><datalist id="cl">${COUNTRIES.map(c => `<option value="${c}">`).join('')}</datalist>`
  return `<div class="unit"><input id="inp" type="number" inputmode="decimal" min="${q.min ?? ''}" max="${q.max ?? ''}" step="${q.step ?? 1}" value="${esc(v)}" aria-label="${esc(q.prompt)}"><span>${q.unit}</span></div>${q.slider ? `<input id="rng" type="range" tabindex="-1" aria-hidden="true" min="${q.min}" max="16" step="${q.step}" value="${Math.min(Number(v) || 0, 16)}">` : ''}`
}
const SR = window.SpeechRecognition || window.webkitSpeechRecognition
function assess() {
  const q = Q[S.i], v = S.answers[q.key] || '', last = S.i === Q.length - 1, pct = (S.i + (validate(q, v) ? 0 : 1)) / Q.length * 100, ok = S.heard && v
  const pose = S.listening ? 'listen' : ok ? 'encourage' : ['explain', 'smile', 'think'][S.i % 3]
  const live = S.listening ? `<b>● Microphone is on. Listening…</b>` : S.heard ? `I heard: “${esc(S.heard)}”` : S.mode === 'voice' ? 'Tap the mic and answer out loud.' : 'Or tap the mic to answer by voice.'
  return `<section class="screen"><div class="meta"><span>Question ${S.i + 1} of ${Q.length}</span><button data-act="exit">Exit</button></div><div class="prog" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(pct)}"><div style="width:${pct}%"></div></div>
<div class="grid2" style="grid-template-columns:250px 1fr;margin-top:24px"><div class="center">${character(pose)}<p style="font-weight:700;color:var(--caramel);font-size:14px">${CHEER[S.i]}</p></div>
<div>${bubble(q.prompt)}<div class="card" style="margin-top:26px">${S.mode === 'voice' && !SR ? '<div class="note" style="margin:0 0 14px">Voice input isn’t supported in this browser, so please type your answers. Chrome or Edge work best for voice.</div>' : ''}
${q.hint ? `<p class="hint">${q.hint}</p>` : ''}${field(q, v)}<div class="err" role="alert">${S.err}</div>
${SR ? `<div class="voice"><div class="mic ${S.listening ? 'on' : ''}"><button data-act="mic" aria-pressed="${S.listening}" aria-label="${S.listening ? 'Stop recording' : 'Answer with your voice'}">${S.listening ? '■' : '🎙️'}</button></div><div><div class="live" id="live" aria-live="polite">${live}</div>${S.note && !S.listening ? `<div class="note">${S.note}</div>` : ''}</div></div>` : ''}</div>
<div class="row"><button class="btn ghost" data-act="aback">← Back</button><button class="btn" data-act="next">${last ? 'See my result' : ok ? 'Confirm & continue ✓' : 'Continue →'}</button></div></div></div></section>`
}
function results() {
  const p = S.status === 'done' ? payload() : null
  let body = ''
  if (S.status === 'loading') body = '<div aria-busy="true"><div class="skel" style="width:230px;height:230px;border-radius:50%"></div><div class="skel" style="height:16px;width:60%"></div><p class="muted">Asking the model…</p></div>'
  if (S.status === 'error') body = `<div role="alert"><p style="font-size:18px">${esc(S.error)}</p><div class="row" style="justify-content:center"><button class="btn line" data-act="review">← Review answers</button><button class="btn" data-act="retry">Try again</button></div></div>`
  if (S.status === 'done') {
    const C = 2 * Math.PI * 96
    body = `<div class="score" role="img" aria-label="Predicted score ${S.score.toFixed(2)}"><svg viewBox="0 0 240 240" width="260" height="260"><defs><linearGradient id="g"><stop offset="0" stop-color="#D4AF37"/><stop offset="1" stop-color="#CE8946"/></linearGradient></defs><circle cx="120" cy="120" r="96" fill="#FFFEF8" stroke="#E9E4D5" stroke-width="16"/><circle id="arc" cx="120" cy="120" r="96" fill="none" stroke="url(#g)" stroke-width="16" stroke-linecap="round" stroke-dasharray="${C}" stroke-dashoffset="${C}"/></svg><div><strong id="num">0.00</strong><span class="muted" style="font-size:14px">model estimate</span></div></div>
<h2 style="font-size:30px;margin-top:22px">Your estimated wellness score</h2><p class="muted" style="max-width:34em;margin:10px auto;line-height:1.65">This number comes from a machine learning model trained on survey data about students’ habits. It compares your answers with patterns in that data. It can’t see your whole life, so please treat it as a conversation starter rather than a verdict. The ring uses a 0–10 axis for reference only.</p>`}
  const tips = ['Notice how you feel after different kinds of screen time, and keep what leaves you feeling better.']
  if (p) { if (p.sleep_hours_per_night < 7) tips.push('Adult sleep guidance commonly suggests around 7 or more hours a night. A steady bedtime can help.'); if (p.physical_activity_hours < .5) tips.push('Even a short daily walk counts. Public health guidance for adults suggests roughly 150 minutes of moderate activity a week.'); if (p.study_hours >= 8) tips.push('Long study days go better with breaks. Try short pauses away from your screen.') }
  tips.push('Talking with a friend, family member, counsellor or doctor can help whenever things feel heavy. You don’t have to wait for a crisis.')
  const detail = p && S.open ? `<div class="detail screen"><div class="card"><h3 style="font-size:24px">What you shared</h3><dl>${Q.map(q => `<div><dt>${q.prompt}</dt><dd>${esc(p[q.key])}${q.unit ? ' ' + q.unit : ''}</dd></div>`).join('')}</dl></div><div class="card"><h3 style="font-size:24px;margin-bottom:14px">Gentle ideas to try</h3><ul style="padding-left:18px;margin:0">${tips.map(t => `<li>${t}</li>`).join('')}</ul></div></div>` : ''
  return `<section class="screen center"><div>${character(S.status === 'error' ? 'listen' : 'celebrate', 'small')}</div>${bubble(S.status === 'error' ? 'Hmm, something got in the way.' : 'Thank you for taking a moment to check in with yourself!')}
<div class="card" style="margin-top:28px">${body}</div><p class="disc">This AI-generated score is an experimental estimate based on the information provided. It is not a medical diagnosis or substitute for professional mental health support.</p>
${S.status === 'done' ? `<div style="display:flex;gap:14px;justify-content:center;flex-wrap:wrap"><button class="btn" data-act="explore" aria-expanded="${S.open}">✨ Explore My Wellness Habits</button><button class="btn line" data-act="restart">↺ Start Again</button></div>${detail}` : ''}</section>`
}

function render() {
  app.innerHTML = { welcome, learn, choose, assess, results }[S.step]();
  if (S.step === 'assess') { const i = $('#inp'); if (i && !S.heard && Q[S.i].kind !== 'select') i.focus({ preventScroll: true }) }
  if (S.step === 'results' && S.status === 'done' && !S.animated) { S.animated = true; animateScore() }
}
function animateScore() {
  const C = 2 * Math.PI * 96, t0 = performance.now(), arc = $('#arc'), num = $('#num'), reduce = matchMedia('(prefers-reduced-motion:reduce)').matches
  const f = now => { const k = reduce ? 1 : Math.min((now - t0) / 1800, 1), e = 1 - Math.pow(1 - k, 3), v = S.score * e; if (!$('#arc')) return; num.textContent = v.toFixed(2); arc.setAttribute('stroke-dashoffset', C * (1 - Math.min(v / AXIS_MAX, 1))); if (k < 1) requestAnimationFrame(f) }; requestAnimationFrame(f)
}

// ---------- Voice ----------
let rec = null
function stopVoice(abort) { if (rec) { try { abort ? rec.abort() : rec.stop() } catch { } } if ('speechSynthesis' in window) speechSynthesis.cancel(); if (abort) { S.listening = false; rec = null } }
function speakQuestion() { if (S.mode === 'voice' && 'speechSynthesis' in window) { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(Q[S.i].say); u.rate = .95; speechSynthesis.speak(u) } }
const ERR = { 'not-allowed': 'Microphone access is blocked. Allow it from the lock icon in your address bar, or type your answer instead.', 'service-not-allowed': 'Microphone access is blocked. Allow it in your browser settings, or type your answer.', 'no-speech': 'I didn’t hear anything. Tap the mic and try again.', 'audio-capture': 'I couldn’t find a microphone on this device.', network: 'Speech recognition needs an internet connection. You can type instead.' }
function startVoice() {
  if (!SR) return; if ('speechSynthesis' in window) speechSynthesis.cancel()
  const q = Q[S.i]; let all = ''; const r = new SR(); rec = r; r.lang = navigator.language || 'en-US'; r.interimResults = true; r.continuous = false
  r.onresult = e => { all = ''; for (let k = 0; k < e.results.length; k++)all += e.results[k][0].transcript; const l = $('#live'); if (l) l.innerHTML = `<b>● Listening…</b> “${esc(all)}”` }
  r.onerror = e => { if (e.error !== 'aborted') { S.err = ''; S.note = ERR[e.error] || 'Something went wrong with the microphone. You can type your answer instead.' } }
  r.onend = () => {
    if (rec !== r) return; S.listening = false; rec = null
    if (all.trim()) { S.heard = all.trim(); const p = q.parse(S.heard); if (p !== null) { S.answers[q.key] = p; S.err = ''; S.note = 'Here’s what I understood. Please check it, edit it if needed, then confirm.' } else S.note = 'I couldn’t match that to an answer. Try again, or choose it above.' }
    render()
  }
  try { r.start(); S.listening = true; S.note = ''; render() } catch { S.note = 'The microphone couldn’t start. Please try again.'; render() }
}

// ---------- API ----------
let busy = false
async function submit() {
  if (busy) return
  const bad = Q.findIndex(q => validate(q, S.answers[q.key])); if (bad >= 0) { toast('Please complete every question first.'); S.i = bad; go('assess'); return }
  busy = true; S.status = 'loading'; S.animated = false; S.open = false; go('results')
  try {
    let res; try { res = await fetch(API_URL + '/predict', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload()) }) }
      catch { throw new Error(`I couldn’t reach the prediction server at ${API_URL}. Check that FastAPI is running (uvicorn main:app --reload) and try again.`) }
    if (res.status === 422) throw new Error('The server didn’t accept one of the answers. Go back and check your entries.')
    if (!res.ok) throw new Error(`The server had a problem (status ${res.status}). Please try again in a moment.`)
    const d = await res.json(); if (typeof d.predicted_mental_health_score !== 'number') throw new Error('The server replied in an unexpected format.')
    S.score = d.predicted_mental_health_score; S.status = 'done'
  }
  catch (e) { S.error = e.message || 'Something went wrong.'; S.status = 'error'; toast(S.error) }
  finally { busy = false; render() }
}

// ---------- Events ----------
function enterQuestion() { S.heard = ''; S.note = ''; S.err = ''; render(); speakQuestion() }
function next() { const q = Q[S.i], e = validate(q, S.answers[q.key]); if (e) { S.err = e; render(); return } stopVoice(true); if (S.i === Q.length - 1) submit(); else { S.i++; enterQuestion() } }
app.addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b) return; const a = b.dataset.act
  const A = {
    learn: () => go('learn'), lnext: () => S.slide === SLIDES.length - 1 ? go('choose') : (S.slide++, render()), lback: () => S.slide ? (S.slide--, render()) : go('welcome'), cback: () => { S.slide = SLIDES.length - 1; go('learn') },
    mode: () => { S.mode = b.dataset.m; S.i = 0; S.heard = ''; S.note = ''; S.err = ''; go('assess'); speakQuestion() },
    pick: () => { S.answers[Q[S.i].key] = b.dataset.v; S.err = ''; render() }, mic: () => S.listening ? stopVoice() : startVoice(), next,
    aback: () => { stopVoice(true); if (S.i) { S.i--; enterQuestion() } else go('choose') }, exit: () => go('choose'),
    explore: () => { S.open = !S.open; S.animated = true; render() }, retry: submit, review: () => go('assess'), restart: () => { S.answers = {}; S.score = null; S.i = 0; S.slide = 0; S.animated = false; go('welcome') }
  }; A[a] && A[a]()
})
app.addEventListener('input', e => { if (S.step !== 'assess') return; const q = Q[S.i]; if (e.target.id === 'inp' || e.target.id === 'rng') { S.answers[q.key] = e.target.value; S.err = ''; if (e.target.id === 'rng') { $('#inp').value = e.target.value } else { const r = $('#rng'); if (r) r.value = Math.min(Number(e.target.value) || 0, 16) } } })
app.addEventListener('change', e => { if (S.step === 'assess' && e.target.tagName === 'SELECT') { S.answers[Q[S.i].key] = e.target.value; S.err = '' } })
app.addEventListener('keydown', e => { if (e.key === 'Enter' && S.step === 'assess' && e.target.id === 'inp') next() })
render()
