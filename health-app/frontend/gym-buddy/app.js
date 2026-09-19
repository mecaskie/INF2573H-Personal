const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const fallback = { goal: 'lose', health: [], readiness: 'steady', sleep: 7, profile: { age: 28, sex: 'female', height: 168, weight: 68, note: '' }, meals: [{ name: 'Greek yogurt + berries', calories: 270, protein: 21 }], completed: [] };
let state;
try { state = { ...fallback, ...JSON.parse(localStorage.getItem('gymBuddyDemoState')) }; } catch { state = structuredClone(fallback); }
let step = 1;
const save = () => localStorage.setItem('gymBuddyDemoState', JSON.stringify(state));
const care = () => state.health.includes('Knee sensitivity') || state.health.includes('Back care');
const recovery = () => state.readiness === 'tired' || state.readiness === 'recovering' || state.sleep < 6 || state.health.includes('Low energy');
const label = () => ({ lose: 'fat-loss', build: 'muscle-building', move: 'movement' })[state.goal];
const esc = (text) => { const d = document.createElement('div'); d.textContent = text; return d.innerHTML; };

function plan() {
  const lighter = recovery();
  const weekly = state.goal === 'build'
    ? [['Full-body strength', '45 min · Guided', 'Squat pattern, row, press, core'], ['Upper body + core', '45 min · Guided', 'Pull, push, carry, anti-rotation'], ['Lower body strength', care() ? '40 min · joint-aware' : '45 min · Guided', 'Hinge, glutes, balance, core'], ['Walk + mobility', '20–30 min · optional', 'Easy movement and recovery']]
    : state.goal === 'move'
      ? [['Mobility flow + core', '30 min · Guided', 'Breath, mobility, stability'], ['Full-body circuit', '40 min · Guided', 'Easy strength for everyday movement'], ['Zone 2 cardio', '30 min · Guided', 'Conversational pace cardio'], ['Recovery walk + stretch', '20 min · optional', 'Easy pace and gentle range']]
      : [[care() ? 'Low-impact cardio + core' : 'Full-body strength', '45 min · Guided', care() ? 'Bike or incline walk, core stability' : 'Squat pattern, press, row, core'], ['Upper body + intervals', lighter ? '30 min · lighter option' : '45 min · Guided', 'Strength intervals at a manageable pace'], [care() ? 'Mobility + glutes' : 'Lower body + cardio', '40 min · Guided', 'Glutes, balance, easy mobility'], ['Optional walk + mobility', '20–30 min · optional', 'Easy movement to round out the week']];
  const names = state.goal === 'build' ? [care() ? 'Resilient strength' : 'Progressive strength', 'MUSCLE BUILD'] : state.goal === 'move' ? ['Everyday athlete', 'MOBILITY FIRST'] : [care() ? 'Low-impact momentum' : 'Lean & strong', 'STEADY FAT LOSS'];
  return { name: names[0], tag: names[1], days: lighter ? (state.goal === 'lose' ? 2 : 3) : (state.goal === 'build' ? 4 : 3), intensity: lighter || care() ? 'LOW' : 'MODERATE', sessions: weekly };
}
function calories() {
  const p = state.profile, base = (10 * p.weight + 6.25 * p.height - 5 * p.age + (p.sex === 'male' ? 5 : p.sex === 'female' ? -161 : -78)) * 1.375;
  const adjusted = base + (state.goal === 'lose' ? -350 : state.goal === 'build' ? 220 : 0) + (recovery() ? 100 : 0);
  return Math.max(1200, Math.round(adjusted / 25) * 25);
}
function macros() { const c = calories(), protein = Math.round(state.profile.weight * (state.goal === 'build' ? 1.8 : 1.6)), fat = Math.round(c * .3 / 9); return { protein, fat, carbs: Math.round((c - protein * 4 - fat * 9) / 4) }; }
function renderOnboarding() {
  $$('.onboard-panel').forEach((panel) => panel.classList.toggle('active', +panel.dataset.step === step));
  $('#onboard-step').textContent = '0' + step + ' / 03'; $('#onboard-progress').style.width = (step / 3 * 100) + '%';
}
function renderSessions(p) {
  $('#session-list').innerHTML = p.sessions.map((item, i) => { const done = state.completed.includes(i); return '<button class="session ' + (done ? 'done' : '') + '" type="button" data-session="' + i + '"><span class="session-day">' + (done ? '✓' : 'D' + (i + 1)) + '</span><span><strong>' + item[0] + '</strong><small>' + item[1] + '</small></span><i class="session-arrow">' + (done ? 'Done' : '→') + '</i></button>'; }).join('');
}
function renderMeals() {
  const target = calories(), m = macros(), totals = state.meals.reduce((a, meal) => ({ calories: a.calories + meal.calories, protein: a.protein + meal.protein }), { calories: 0, protein: 0 });
  $('#meal-list').innerHTML = state.meals.map((meal) => '<article class="meal"><span class="meal-icon">◌</span><span><strong>' + esc(meal.name) + '</strong><small>' + meal.protein + 'g protein</small></span><b>' + meal.calories + ' kcal</b></article>').join('');
  $('#calorie-remaining').textContent = Math.max(0, target - totals.calories).toLocaleString(); $('#protein-bar').style.width = Math.min(100, totals.protein / m.protein * 100) + '%'; $('#carb-bar').style.width = '52%'; $('#fat-bar').style.width = '47%';
}
function render() {
  const p = plan(), c = calories(), m = macros(), soft = recovery(), today = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date()).toUpperCase();
  $('#date-label').textContent = today; $('#today-subtitle').textContent = 'A ' + label() + ' plan that meets you where you are today.';
  $('#sleep').value = state.sleep; $('#sleep-value').textContent = state.sleep + ' hrs'; $$('.readiness-options button').forEach((b) => b.classList.toggle('selected', b.dataset.readiness === state.readiness));
  $('#readiness-title').textContent = soft ? 'Recovery comes first today.' : 'How are you feeling?'; $('#readiness-copy').textContent = soft ? 'Your coach has softened today’s effort and added options.' : 'Your coach will adjust today’s session.';
  $('#agent-headline').textContent = soft ? 'Today calls for a recovery-aware plan' : 'Your best-fit plan is ready';
  $('#agent-summary').textContent = soft ? 'With ' + state.sleep + ' hours of sleep and your current check-in, choose a conversational effort and stop movements that hurt.' : 'I matched ' + p.name.toLowerCase() + ' to your ' + label() + ' goal' + (state.health.length ? ' and health notes.' : '.');
  $('#today-workout-title').textContent = p.sessions[0][0]; $('#today-workout-meta').textContent = p.sessions[0][1]; $('#today-workout-detail').textContent = p.sessions[0][2];
  $('#fuel-target').innerHTML = c.toLocaleString() + ' <small>kcal</small>'; $('#fuel-caption').textContent = state.goal === 'lose' ? 'A measured deficit, made to preserve strength.' : state.goal === 'build' ? 'A moderate surplus to support recovery.' : 'Steady energy for movement and recovery.';
  $('#plan-name').textContent = p.name; $('#plan-tag').textContent = p.tag; $('#plan-description').textContent = soft ? 'A lower-pressure plan with recovery built into your week.' : 'An adaptable week that builds confidence and momentum.'; $('#plan-days').textContent = p.days; $('#plan-intensity').textContent = p.intensity;
  $('#care-note').textContent = state.health.length ? 'Health-aware note: ' + state.health.join(' and ') + ' selected. Choose a pain-free range and a lower-impact option whenever needed.' : 'Health-aware note: use a controlled range and choose options that feel safe and sustainable.';
  $('#fuel-intro').textContent = 'Your daily target adjusts around your ' + label() + ' goal and your latest check-in.'; $('#calorie-target').innerHTML = c.toLocaleString() + ' <small>kcal</small>'; $('#calorie-note').textContent = soft ? 'A little extra fuel supports recovery today.' : 'A flexible guide, not a pass/fail score.';
  $('#protein-target').textContent = m.protein + 'g'; $('#carb-target').textContent = m.carbs + 'g'; $('#fat-target').textContent = m.fat + 'g'; $('#food-suggestion').textContent = soft ? 'Consider a balanced meal with protein and carbohydrates to support recovery.' : 'Include protein at your next meal to support training recovery.';
  $('#coach-welcome').textContent = 'I’m using your ' + label() + ' goal, ' + state.readiness + ' readiness, ' + state.sleep + '-hour sleep check-in' + (state.health.length ? ', and ' + state.health.join(', ') : '') + '. What would help today?';
  renderSessions(p); renderMeals(); save();
}
function show(view) { $$('.view').forEach((v) => v.classList.toggle('active', v.dataset.viewPanel === view)); $$('.bottom-nav button').forEach((b) => b.classList.toggle('active', b.dataset.view === view)); window.scrollTo({ top: 0, behavior: 'smooth' }); }
function message(text, mine) { const node = document.createElement('article'); node.className = mine ? 'user-message' : 'coach-message'; node.innerHTML = mine ? '<p>' + esc(text) + '</p>' : '<span>✦</span><p>' + esc(text) + '</p>'; $('#chat-log').append(node); node.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
function reply(question) {
  const q = question.toLowerCase();
  if (q.includes('lower') || q.includes('impact') || q.includes('swap')) return care() ? 'Try cycling or an easy incline walk for cardio; a box squat, glute bridge, or supported row for strength. Keep the range pain-free and skip movements that aggravate your concern.' : 'Swap jumping or running intervals for cycling, an incline walk, or a rowing machine at a conversational pace.';
  if (q.includes('form') || q.includes('feel')) return 'Aim for controlled repetitions—not maximum weight. You should feel working muscles and steady breathing, never sharp pain, numbness, dizziness, or pressure.';
  if (q.includes('eat') || q.includes('food')) return 'After training, a meal or snack with about 20–30g protein plus carbohydrates can support recovery. Today’s flexible target is ' + calories().toLocaleString() + ' kcal and ' + macros().protein + 'g protein.';
  if (q.includes('change') || q.includes('adjust') || q.includes('why')) return recovery() ? 'Your plan is lighter because today’s check-in shows ' + state.readiness + ' readiness and ' + state.sleep + ' hours of sleep. That is a recovery signal, not a setback.' : 'Your plan balances your goal and any selected health notes. It will adjust after each check-in.';
  return 'For your ' + label() + ' goal, focus on the next manageable action: complete the warm-up, use a controlled range, and stop if you feel pain.';
}
function workout() { const p = plan(), low = state.health.includes('Knee sensitivity'); $('#dialog-title').textContent = p.sessions[0][0]; $('#dialog-intro').textContent = recovery() ? 'Today is intentionally lighter. Keep a conversational effort and skip any painful range.' : 'Use a controlled range and leave a few reps in reserve.'; const list = low ? ['5 min easy bike or walk', 'Box squat or sit-to-stand · 3 sets', 'Supported row · 3 sets', 'Glute bridge · 3 sets', 'Breathing + easy stretch'] : ['5 min dynamic warm-up', 'Goblet squat · 3 sets', 'Dumbbell row · 3 sets', 'Incline push-up · 3 sets', 'Dead bug · 3 sets']; $('#exercise-list').innerHTML = list.map((x) => '<li>' + x + '</li>').join(''); $('#workout-dialog').showModal(); }

$$('.next-step').forEach((b) => b.addEventListener('click', () => { step = Math.min(3, step + 1); renderOnboarding(); }));
$$('.previous-step').forEach((b) => b.addEventListener('click', () => { step = Math.max(1, step - 1); renderOnboarding(); }));
$$('.goal-choice').forEach((b) => b.addEventListener('click', () => { state.goal = b.dataset.goal; $$('.goal-choice').forEach((x) => { const on = x === b; x.classList.toggle('selected', on); x.setAttribute('aria-checked', on); }); }));
$$('#health-options button').forEach((b) => b.addEventListener('click', () => { const h = b.dataset.health; state.health = state.health.includes(h) ? state.health.filter((x) => x !== h) : [...state.health, h]; b.classList.toggle('selected', state.health.includes(h)); }));
$('#finish-onboarding').addEventListener('click', () => { state.profile = { age: +$('#age').value || 28, sex: $('#sex').value, height: +$('#height').value || 168, weight: +$('#weight').value || 68, note: $('#condition-note').value.trim() }; $('#onboarding').classList.add('hidden'); $('#app').classList.remove('hidden'); render(); });
$$('.bottom-nav [data-view],.brand-button,.text-button').forEach((b) => b.addEventListener('click', () => show(b.dataset.view)));
$('#profile-button').addEventListener('click', () => { $('#app').classList.add('hidden'); $('#onboarding').classList.remove('hidden'); step = 3; renderOnboarding(); });
$$('.readiness-options button').forEach((b) => b.addEventListener('click', () => { state.readiness = b.dataset.readiness; render(); }));
$('#sleep').addEventListener('input', (e) => { state.sleep = +e.target.value; $('#sleep-value').textContent = state.sleep + ' hrs'; }); $('#sleep').addEventListener('change', render);
$('#start-workout').addEventListener('click', workout); $('#finish-workout').addEventListener('click', () => { if (!state.completed.includes(0)) state.completed.push(0); render(); });
$('#session-list').addEventListener('click', (e) => { const b = e.target.closest('[data-session]'); if (!b) return; const i = +b.dataset.session; state.completed = state.completed.includes(i) ? state.completed.filter((x) => x !== i) : [...state.completed, i]; render(); });
$('#add-meal').addEventListener('click', () => $('#meal-dialog').showModal()); $('#save-meal').addEventListener('click', () => { state.meals.push({ name: $('#meal-name').value.trim() || 'Meal', calories: +$('#meal-calories').value || 0, protein: +$('#meal-protein').value || 0 }); render(); });
$$('.prompt-grid button').forEach((b) => b.addEventListener('click', () => { const ask = { swap: 'Give me a lower-impact option', form: 'How should this session feel?', food: 'What should I eat after?', adjust: 'Why did my plan change?' }[b.dataset.prompt]; message(ask, true); message(reply(ask)); }));
$('#coach-form').addEventListener('submit', (e) => { e.preventDefault(); const input = $('#coach-input'), ask = input.value.trim(); if (!ask) return; message(ask, true); input.value = ''; message(reply(ask)); });
$('#age').value = state.profile.age; $('#sex').value = state.profile.sex; $('#height').value = state.profile.height; $('#weight').value = state.profile.weight; $('#condition-note').value = state.profile.note || ''; $$('.goal-choice').forEach((b) => b.classList.toggle('selected', b.dataset.goal === state.goal)); $$('#health-options button').forEach((b) => b.classList.toggle('selected', state.health.includes(b.dataset.health))); renderOnboarding();
if (localStorage.getItem('gymBuddyDemoState')) { $('#onboarding').classList.add('hidden'); $('#app').classList.remove('hidden'); render(); }
