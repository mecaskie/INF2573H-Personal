const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const defaults = {
  goal: 'lose', health: [], readiness: 'steady', sleep: 7,
  profile: { age: 28, sex: 'female', height: 168, weight: 68, note: '' },
  meals: [{ name: 'Greek yogurt + berries', calories: 270, protein: 21 }],
  completed: []
};
let state = loadState();
let currentOnboardingStep = 1;

function loadState() {
  try { return { ...defaults, ...JSON.parse(localStorage.getItem('gymBuddyDemoState')) }; }
  catch { return structuredClone(defaults); }
}
function saveState() { localStorage.setItem('gymBuddyDemoState', JSON.stringify(state)); }
function goalLabel() { return ({ lose: 'fat-loss', build: 'muscle-building', move: 'movement' })[state.goal]; }
function hasHealth(item) { return state.health.includes(item); }
function recoveryMode() { return state.readiness === 'tired' || state.readiness === 'recovering' || state.sleep < 6 || hasHealth('Low energy'); }

function planForProfile() {
  const care = hasHealth('Knee sensitivity') || hasHealth('Back care');
  const beginner = hasHealth('New to training');
  const gentle = recoveryMode();
  if (state.goal === 'build') return {
    tag: 'MUSCLE BUILD', name: care ? 'Resilient strength' : 'Progressive strength',
    description: care ? 'Controlled, joint-considerate strength with room to progress.' : 'A repeatable strength split with recovery built in.',
    days: gentle ? 3 : beginner ? 3 : 4, intensity: gentle ? 'LOW' : 'MODERATE',
    sessions: [
      ['Full-body strength', '45 min · Guided', 'Squat pattern, row, press, core'],
      ['Upper body + core', '45 min · Guided', 'Pull, push, carry, anti-rotation'],
      ['Lower body strength', care ? '40 min · joint-aware' : '45 min · Guided', 'Hinge, split stance, glutes, core'],
      ['Walk + mobility', '20–30 min · optional', 'Easy movement and recovery']
    ]
  };
  if (state.goal === 'move') return {
    tag: 'MOBILITY FIRST', name: 'Everyday athlete', description: 'A lower-pressure blend of mobility, strength, and steady energy.',
    days: 3, intensity: gentle ? 'LOW' : 'EASY',
    sessions: [
      ['Mobility flow + core', '30 min · Guided', 'Breath, controlled mobility, stability'],
      ['Full-body circuit', '40 min · Guided', 'Easy strength for everyday movement'],
      ['Zone 2 cardio', '30 min · Guided', 'Conversational pace cardio'],
      ['Recovery walk + stretch', '20 min · optional', 'Easy pace and gentle range']
    ]
  };
  return {
    tag: 'STEADY FAT LOSS', name: care ? 'Low-impact momentum' : 'Lean & strong',
    description: care ? 'Low-impact conditioning and strength designed to protect your joints.' : 'Strength and approachable cardio to retain muscle while you lean out.',
    days: gentle ? 2 : 3, intensity: gentle || care ? 'LOW' : 'MODERATE',
    sessions: [
      [care ? 'Low-impact cardio + core' : 'Full-body strength', '45 min · Guided', care ? 'Bike or incline walk, core stability' : 'Squat pattern, press, row, core'],
      ['Upper body + intervals', gentle ? '30 min · lighter option' : '45 min · Guided', 'Strength intervals at a manageable pace'],
      [care ? 'Mobility + glutes' : 'Lower body + cardio', '40 min · Guided', care ? 'Glutes, balance, easy mobility' : 'Hinge, split stance, easy cardio'],
      ['Optional walk + mobility', '20–30 min · optional', 'Easy movement to round out the week']
    ]
  };
}

function calorieTarget() {
  const { age, height, weight, sex } = state.profile;
  const modifier = sex === 'male' ? 5 : sex === 'female' ? -161 : -78;
  let target = (10 * weight + 6.25 * height - 5 * age + modifier) * 1.375;
  if (state.goal === 'lose') target -= 350;
  if (state.goal === 'build') target += 220;
  if (recoveryMode()) target += 100;
  return Math.max(1200, Math.round(target / 25) * 25);
}

function macroTargets() {
  const calories = calorieTarget(); const weight = state.profile.weight;
  const protein = Math.round(weight * (state.goal === 'build' ? 1.8 : 1.6));
  const fat = Math.round((calories * .3) / 9); const carbs = Math.round((calories - protein * 4 - fat * 9) / 4);
  return { protein, fat, carbs };
}

function updateOnboarding() {
  $$('#onboarding .onboard-panel').forEach(panel => panel.classList.toggle('active', +panel.dataset.step === currentOnboardingStep));
  $('#onboard-step').textContent = `0${currentOnboardingStep} / 03`;
  $('#onboard-progress').style.width = `${currentOnboardingStep / 3 * 100}%`;
}

function renderSessions() {
  const plan = planForProfile();
  $('#session-list').innerHTML = plan.sessions.map(([title, meta], index) => {
    const done = state.completed.includes(index);
    return `<button class="session ${done ? 'done' : ''}" type="button" data-session="${index}"><span class="session-day">${done ? '✓' : `D${index + 1}`}</span><span><strong>${title}</strong><small>${meta}</small></span><i class="session-arrow">${done ? 'Done' : '→'}</i></button>`;
  }).join('');
}

function renderMeals() {
  const target = calorieTarget(); const macros = macroTargets();
  const totals = state.meals.reduce((total, meal) => ({ calories: total.calories + meal.calories, protein: total.protein + meal.protein }), { calories: 0, protein: 0 });
  const remaining = Math.max(0, target - totals.calories);
  $('#meal-list').innerHTML = state.meals.map(meal => `<article class="meal"><span class="meal-icon">◌</span><span><strong>${escapeHtml(meal.name)}</strong><small>${meal.protein}g protein</small></span><b>${meal.calories} kcal</b></article>`).join('') || '<p class="muted">No meals logged yet.</p>';
  $('#calorie-remaining').textContent = remaining.toLocaleString();
  $('#protein-bar').style.width = `${Math.min(100, totals.protein / macros.protein * 100)}%`;
  $('#carb-bar').style.width = '52%'; $('#fat-bar').style.width = '47%';
}

function renderApp() {
  const plan = planForProfile(); const target = calorieTarget(); const macros = macroTargets();
  const today = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date()).toUpperCase();
  $('#date-label').textContent = today;
  $('#today-subtitle').textContent = `A ${goalLabel()} plan that meets you where you are today.`;
  $('#sleep').value = state.sleep; $('#sleep-value').textContent = `${state.sleep} hrs`;
  $$('.readiness-options button').forEach(button => button.classList.toggle('selected', button.dataset.readiness === state.readiness));
  const recovery = recoveryMode();
  $('#readiness-title').textContent = recovery ? 'Recovery comes first today.' : 'How are you feeling?';
  $('#readiness-copy').textContent = recovery ? 'Your coach has softened today’s effort and added options.' : 'Your coach will adjust today’s session.';
  $('#agent-headline').textContent = recovery ? 'Today calls for a recovery-aware plan' : 'Your best-fit plan is ready';
  $('#agent-summary').textContent = recovery
    ? `With ${state.sleep} hours of sleep and your current check-in, choose a conversational effort and stop movements that hurt.`
    : `I matched ${plan.name.toLowerCase()} to your ${goalLabel()} goal${state.health.length ? ' and health notes' : ''}.`;
  $('#today-workout-title').textContent = plan.sessions[0][0]; $('#today-workout-meta').textContent = plan.sessions[0][1]; $('#today-workout-detail').textContent = plan.sessions[0][2];
  $('#fuel-target').innerHTML = `${target.toLocaleString()} <small>kcal</small>`;
  $('#fuel-caption').textContent = state.goal === 'lose' ? 'A measured deficit, made to preserve strength.' : state.goal === 'build' ? 'A moderate surplus to support recovery.' : 'Steady energy for movement and recovery.';
  $('#plan-name').textContent = plan.name; $('#plan-description').textContent = plan.description; $('#plan-tag').textContent = plan.tag; $('#plan-days').textContent = plan.days; $('#plan-intensity').textContent = plan.intensity;
  $('#care-note').textContent = state.health.length ? `Health-aware note: ${state.health.join(' and ')} selected. Choose a pain-free range and the lower-impact option whenever needed.` : 'Health-aware note: use a controlled range and choose options that feel safe and sustainable.';
  $('#fuel-intro').textContent = `Your daily target adjusts around your ${goalLabel()} goal and your latest check-in.`;
  $('#calorie-target').innerHTML = `${target.toLocaleString()} <small>kcal</small>`;
  $('#calorie-note').textContent = recovery ? 'A little extra fuel supports recovery today.' : 'A flexible guide, not a pass/fail score.';
  $('#protein-target').textContent = `${macros.protein}g`; $('#carb-target').textContent = `${macros.carbs}g`; $('#fat-target').textContent = `${macros.fat}g`;
  $('#food-suggestion').textContent = recovery ? 'Consider a balanced meal with protein and carbohydrates to support recovery.' : state.goal === 'build' ? 'Spread protein across meals to help support progressive training.' : 'Include protein at your next meal to support training recovery.';
  $('#coach-welcome').textContent = `I’m using your ${goalLabel()} goal, ${state.readiness} readiness, ${state.sleep}-hour sleep check-in${state.health.length ? `, and ${state.health.join(', ')}` : ''}. What would help today?`;
  renderSessions(); renderMeals(); saveState();
}

function showView(view) {
  $$('.view').forEach(section => section.classList.toggle('active', section.dataset.viewPanel === view));
  $$('.bottom-nav button').forEach(button => button.classList.toggle('active', button.dataset.view === view));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function escapeHtml(value) { const div = document.createElement('div'); div.textContent = value; return div.innerHTML; }

function startApp() {
  state.profile = { age: +$('#age').value || 28, sex: $('#sex').value, height: +$('#height').value || 168, weight: +$('#weight').value || 68, note: $('#condition-note').value.trim() };
  saveState(); $('#onboarding').classList.add('hidden'); $('#app').classList.remove('hidden'); renderApp();
}

function addCoachMessage(text, user = false) {
  const message = document.createElement('article'); message.className = user ? 'user-message' : 'coach-message';
  message.innerHTML = user ? `<p>${escapeHtml(text)}</p>` : `<span>✦</span><p>${escapeHtml(text)}</p>`;
  $('#chat-log').append(message); message.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function coachReply(prompt) {
  const lower = prompt.toLowerCase(); const care = hasHealth('Knee sensitivity') || hasHealth('Back care');
  if (lower.includes('lower') || lower.includes('impact') || lower.includes('swap')) return care ? 'Try a supported option today: cycling or an easy incline walk for cardio; a box squat, glute bridge, or supported row for strength. Keep the range pain-free and skip anything that aggravates your concern.' : 'For a lower-impact option, swap jumping or running intervals for cycling, an incline walk, or a rowing machine at a conversational pace. Keep the effort easy enough to speak in short sentences.';
  if (lower.includes('form') || lower.includes('feel')) return 'Aim for controlled repetitions—not maximum weight. You should feel working muscles and steady breathing, never sharp pain, numbness, dizziness, or pressure. Leave a few reps in reserve today.';
  if (lower.includes('eat') || lower.includes('food') || lower.includes('nutrition')) return `After training, a meal or snack with about 20–30g protein plus carbohydrates can support recovery. Your target today is ${calorieTarget().toLocaleString()} kcal and ${macroTargets().protein}g protein; treat these as flexible estimates.`;
  if (lower.includes('change') || lower.includes('adjust') || lower.includes('why')) return recoveryMode() ? `Your plan is lighter because today's check-in shows ${state.readiness} readiness and ${state.sleep} hours of sleep${state.health.length ? `, alongside ${state.health.join(' and ')}` : ''}. That is a recovery signal, not a setback.` : `Your plan is built for ${goalLabel()}, with ${state.health.length ? 'your selected health notes' : 'a steady recovery profile'} shaping exercise options. It will adjust after each check-in.`;
  return `For your ${goalLabel()} goal, I’d focus on the next manageable action: complete the warm-up, use a controlled range, and stop if you feel pain. If you mean a specific exercise, ask me for a lower-impact option or how it should feel.`;
}

function openWorkout() {
  const plan = planForProfile(); const [title, , detail] = plan.sessions[0];
  $('#dialog-title').textContent = title; $('#dialog-intro').textContent = recoveryMode() ? 'Today is intentionally lighter. Keep a conversational effort and skip any painful range.' : `Today’s focus: ${detail}. Use a controlled range and leave a few reps in reserve.`;
  const exercises = hasHealth('Knee sensitivity') ? ['5 min easy bike or walk', 'Box squat or sit-to-stand · 3 sets', 'Supported row · 3 sets', 'Glute bridge · 3 sets', 'Breathing + easy stretch'] : ['5 min dynamic warm-up', 'Goblet squat · 3 sets', 'Dumbbell row · 3 sets', 'Incline push-up · 3 sets', 'Dead bug · 3 sets'];
  $('#exercise-list').innerHTML = exercises.map(item => `<li>${item}</li>`).join(''); $('#workout-dialog').showModal();
}

function initEvents() {
  $$('.next-step').forEach(button => button.addEventListener('click', () => { currentOnboardingStep = Math.min(3, currentOnboardingStep + 1); updateOnboarding(); }));
  $$('.previous-step').forEach(button => button.addEventListener('click', () => { currentOnboardingStep = Math.max(1, currentOnboardingStep - 1); updateOnboarding(); }));
  $$('.goal-choice').forEach(button => button.addEventListener('click', () => { state.goal = button.dataset.goal; $$('.goal-choice').forEach(item => { const selected = item === button; item.classList.toggle('selected', selected); item.setAttribute('aria-checked', String(selected)); }); }));
  $$('#health-options button').forEach(button => button.addEventListener('click', () => { const health = button.dataset.health; state.health = hasHealth(health) ? state.health.filter(item => item !== health) : [...state.health, health]; button.classList.toggle('selected', hasHealth(health)); }));
  $('#finish-onboarding').addEventListener('click', startApp);
  $$('.bottom-nav [data-view],.brand-button,.text-button').forEach(button => button.addEventListener('click', () => showView(button.dataset.view)));
  $('#profile-button').addEventListener('click', () => { $('#app').classList.add('hidden'); $('#onboarding').classList.remove('hidden'); currentOnboardingStep = 3; updateOnboarding(); });
  $$('.readiness-options button').forEach(button => button.addEventListener('click', () => { state.readiness = button.dataset.readiness; renderApp(); }));
  $('#sleep').addEventListener('input', (event) => { state.sleep = +event.target.value; $('#sleep-value').textContent = `${state.sleep} hrs`; });
  $('#sleep').addEventListener('change', renderApp);
  $('#start-workout').addEventListener('click', openWorkout);
  $('#finish-workout').addEventListener('click', () => { if (!state.completed.includes(0)) state.completed.push(0); renderApp(); });
  $('#session-list').addEventListener('click', (event) => { const button = event.target.closest('[data-session]'); if (!button) return; const index = +button.dataset.session; state.completed = state.completed.includes(index) ? state.completed.filter(i => i !== index) : [...state.completed, index]; renderApp(); });
  $('#add-meal').addEventListener('click', () => $('#meal-dialog').showModal());
  $('#save-meal').addEventListener('click', () => { state.meals.push({ name: $('#meal-name').value.trim() || 'Meal', calories: +$('#meal-calories').value || 0, protein: +$('#meal-protein').value || 0 }); renderApp(); });
  $$('.prompt-grid button').forEach(button => button.addEventListener('click', () => { const prompts = { swap: 'Give me a lower-impact option', form: 'How should this session feel?', food: 'What should I eat after?', adjust: 'Why did my plan change?' }; const prompt = prompts[button.dataset.prompt]; addCoachMessage(prompt, true); addCoachMessage(coachReply(prompt)); }));
  $('#coach-form').addEventListener('submit', (event) => { event.preventDefault(); const input = $('#coach-input'); const prompt = input.value.trim(); if (!prompt) return; addCoachMessage(prompt, true); input.value = ''; addCoachMessage(coachReply(prompt)); });
}

function restoreProfileInputs() {
  $('#age').value = state.profile.age; $('#sex').value = state.profile.sex; $('#height').value = state.profile.height; $('#weight').value = state.profile.weight; $('#condition-note').value = state.profile.note || '';
  $$('.goal-choice').forEach(button => { const selected = button.dataset.goal === state.goal; button.classList.toggle('selected', selected); button.setAttribute('aria-checked', String(selected)); });
  $$('#health-options button').forEach(button => button.classList.toggle('selected', hasHealth(button.dataset.health)));
}

initEvents(); restoreProfileInputs(); updateOnboarding();
// Start the demo with onboarding; restoreProfileInputs retains saved answers.
