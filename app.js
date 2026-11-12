'use strict';
const $ = id => document.getElementById(id);
const KEY = 'paso-a-paso-semana15-v1';
let course, state = {drafts:{}, hints:{}, passed:{}, results:{}, selected:'bases', exercise:null};
let moduleId, exerciseId, busy = false, storageOK = true;
const esc = text => String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const exercises = () => course.exercises.filter(e => e.module === moduleId);
const current = () => course.exercises.find(e => e.id === exerciseId);
const draft = e => Object.hasOwn(state.drafts, e.id) ? state.drafts[e.id] : e.starter;
const solved = e => state.passed[e.id] === draft(e);

function save() {
  state.selected = moduleId;
  state.exercise = exerciseId;
  try { localStorage.setItem(KEY, JSON.stringify(state)); $('save-status').textContent = '● Guardado local'; }
  catch { storageOK = false; $('save-status').textContent = 'Sin espacio para guardar · descarga tu avance'; }
}

function renderNav() {
  $('modules').innerHTML = course.modules.map((m,i) => {
    const all = course.exercises.filter(e => e.module === m.id), done = all.filter(solved).length;
    return `<button class="module-button ${m.id===moduleId?'active':''}" data-module="${m.id}" ${m.id===moduleId?'aria-current="step"':''}><span class="module-index">${String(i+1).padStart(2,'0')}</span><span><b>${esc(m.title)}</b><small>${done} de ${all.length} ejercicios</small></span>${done===all.length?'<span class="done">✓</span>':''}</button>`;
  }).join('');
  const done = course.exercises.filter(solved).length;
  $('total-done').textContent = `${done} resueltos`;
  $('total-count').textContent = `de ${course.exercises.length}`;
  $('overall-progress').max = course.exercises.length;
  $('overall-progress').value = done;
  $('overall-progress').setAttribute('aria-label', `${done} de ${course.exercises.length} ejercicios resueltos`);
}

function showTab(tab) {
  const isLesson = tab==='lesson';
  $('lesson').hidden = !isLesson;
  $('practice').hidden = isLesson;
  $('lesson-tab').setAttribute('aria-selected', String(isLesson));
  $('practice-tab').setAttribute('aria-selected', String(!isLesson));
  state.tab = tab;
  save();
}

function selectModule(id, first=false) {
  moduleId = id;
  const m = course.modules.find(m => m.id === id), index = course.modules.indexOf(m);
  $('module-kicker').textContent = `SET ${String(index+1).padStart(2,'0')} / ${String(course.modules.length).padStart(2,'0')}`;
  $('module-title').textContent = m.title;
  $('module-subtitle').textContent = m.subtitle;
  $('module-time').textContent = `◷ ${m.time}`;
  $('set-count').textContent = exercises().length;
  $('lesson-text').innerHTML = m.lesson.map(([title,text],i) => `<section class="lesson-item"><span>${i+1}</span><div><h2>${esc(title)}</h2><p>${esc(text)}</p></div></section>`).join('');
  $('lesson-example').textContent = m.example;
  $('takeaway').textContent = m.takeaway;
  const savedExercise = first && exercises().some(e=>e.id===state.exercise) ? state.exercise : exercises()[0].id;
  const savedTab = first && state.tab==='practice' ? 'practice' : 'lesson';
  selectExercise(savedExercise, false);
  showTab(savedTab);
  renderNav();
}

function renderChips() {
  $('exercise-list').innerHTML = exercises().map((e,i)=>`<button class="exercise-chip ${e.id===exerciseId?'active':''} ${solved(e)?'complete':''}" data-exercise="${e.id}" title="${esc(e.title)}" ${e.id===exerciseId?'aria-current="step"':''}>${solved(e)?'✓ ':''}${String(i+1).padStart(2,'0')} · ${esc(e.level)}</button>`).join('');
}

function lineNumbers() {
  $('line-numbers').textContent = Array.from({length:$('editor').value.split('\n').length},(_,i)=>i+1).join('\n');
  $('line-numbers').scrollTop = $('editor').scrollTop;
}

function selectExercise(id, practice=true) {
  exerciseId = id;
  const e=current(), index=exercises().findIndex(x=>x.id===id);
  $('exercise-number').textContent = `EJERCICIO ${index+1} DE ${exercises().length}`;
  $('level').textContent = e.level;
  $('exercise-title').textContent = e.title;
  $('problem').textContent = e.problem;
  $('sample-input').textContent = e.tests[0].input;
  $('sample-output').textContent = e.tests[0].expected;
  $('editor').value = draft(e);
  lineNumbers();
  $('solution-box').hidden = true;
  $('solution-box').open = false;
  $('solution-code').textContent = e.solution;
  $('solution-why').textContent = e.why;
  $('solution').textContent = 'Ver solución explicada';
  renderHints();
  renderChips();
  renderResults(state.results[id]?.code===draft(e) ? state.results[id].results : null);
  const overallIndex = course.exercises.indexOf(e);
  $('previous').disabled = overallIndex===0;
  $('next').textContent = overallIndex===course.exercises.length-1 ? 'Volver a la ruta ✓' : index===exercises().length-1 ? 'Siguiente set →' : 'Siguiente ejercicio →';
  if(practice) showTab('practice');
  save();
}

function renderHints() {
  const e=current(), count=state.hints[e.id]||0;
  $('hints').innerHTML = e.hints.slice(0,count).map((h,i)=>`<div class="hint-card"><strong>Pista ${i+1}.</strong> ${esc(h)}</div>`).join('');
  $('hint').disabled = count>=e.hints.length;
  $('hint').textContent = count===0?'↳ Necesito una pista':count<e.hints.length?'↳ Una pista más':'Ya tienes las dos pistas';
}

function renderResults(results) {
  const e=current();
  $('test-bar').innerHTML = e.tests.map((_,i)=>`<button data-case="${i}" class="${results?results[i].status:''}" title="Caso ${i+1}${results?' · '+{pass:'Correcto',fail:'Salida distinta',error:'Error al ejecutar'}[results[i].status]:': pendiente'}" aria-label="Caso ${i+1}${results?' '+results[i].status:' pendiente'}"></button>`).join('');
  if(!results){
    $('results-summary').textContent = 'Todavía sin ejecutar';
    $('results').innerHTML = '<p class="empty-state">Tu primera barra verde empieza con un intento.<br>Ejecuta tu código para ver qué pasa en cada caso.</p>';
    $('encouragement').textContent = 'Si algo falla, tienes información para el siguiente intento.';
    return;
  }
  const passed=results.filter(r=>r.status==='pass').length;
  $('results-summary').textContent = `${passed} / ${results.length} correctos`;
  $('encouragement').textContent = passed===results.length ? '¡Barra completa! Antes de avanzar, explica con tus palabras por qué funciona.' : 'Mira el primer caso que falla. Cambia una cosa y vuelve a probar.';
  let opened=false;
  $('results').innerHTML = results.map((r,i)=>{
    const open=!opened && r.status!=='pass'; if(open) opened=true;
    const label={pass:'✓ Correcto',fail:'× Salida distinta',error:'! Error al ejecutar'}[r.status];
    return `<details class="case-detail" id="case-${i}" ${open?'open':''}><summary><span>Caso ${i+1} · ${r.seconds}s</span><span class="status-badge ${r.status}">${label}</span></summary><p>${esc(r.message)}</p><label>ENTRADA</label><pre>${esc(r.input||'(vacía)')}</pre><label>ESPERADO</label><pre>${esc(r.expected||'(sin salida)')}</pre><label>TU SALIDA</label><pre>${esc(r.actual||'(sin salida)')}</pre>${r.stderr&&r.message!==r.stderr?`<label>DETALLE DE PYTHON</label><pre>${esc(r.stderr)}</pre>`:''}</details>`;
  }).join('');
}

async function run() {
  if(busy) return;
  const e=current(), code=$('editor').value;
  state.drafts[e.id]=code; save();
  busy=true;
  $('run').disabled=true; $('run').textContent='Evaluando…';
  document.body.classList.add('busy');
  $('results-summary').textContent='Python está ejecutando tus casos…';
  try {
    const body = await runInBrowser(e, code, message => { if(exerciseId===e.id) $('results-summary').textContent=message; });
    state.results[e.id]={code,results:body.results};
    if(body.results.every(r=>r.status==='pass')) state.passed[e.id]=code;
    else delete state.passed[e.id];
    save(); renderNav(); renderChips();
    if(exerciseId===e.id && $('editor').value===code) renderResults(body.results);
  } catch(error) {
    if(exerciseId===e.id){
      $('results-summary').textContent='No se pudo evaluar';
      $('results').innerHTML=`<p class="empty-state">${esc(error.message)}<br>Comprueba tu conexión y vuelve a intentar. La primera ejecución descarga Python y las bibliotecas necesarias. Tu código permanece aquí.</p>`;
    }
  } finally {
    busy=false; $('run').disabled=false; $('run').textContent='▶ Ejecutar casos'; document.body.classList.remove('busy');
  }
}

function changed() {
  state.drafts[exerciseId]=$('editor').value;
  lineNumbers(); save(); renderNav(); renderChips(); renderResults(null);
}

function navigate(offset) {
  const index=course.exercises.indexOf(current()), e=course.exercises[index+offset];
  if(!e){ showTab('lesson'); return; }
  if(e.module!==moduleId){selectModule(e.module); if(offset<0) selectExercise(e.id);}
  else selectExercise(e.id);
}

async function init() {
  try {
    const response=await fetch('./course.json');
    if(!response.ok) throw new Error('No se pudo cargar el curso.');
    course=await response.json();
    try {
      const saved=JSON.parse(localStorage.getItem(KEY)||'null');
      if(saved && typeof saved==='object') for(const key of Object.keys(state).concat('tab')) if(saved[key]!==undefined) state[key]=saved[key];
      for(const key of ['drafts','hints','passed','results']) if(!state[key]||typeof state[key]!=='object') state[key]={};
    } catch {storageOK=false;}
    selectModule(course.modules.some(m=>m.id===state.selected)?state.selected:'bases', true);
    $('loading').hidden=true; $('workspace').hidden=false;
  } catch(error){$('loading').textContent=error.message+' Recarga la página y comprueba tu conexión.';return;}

  $('modules').addEventListener('click',event=>{const b=event.target.closest('[data-module]');if(b)selectModule(b.dataset.module);});
  $('exercise-list').addEventListener('click',event=>{const b=event.target.closest('[data-exercise]');if(b)selectExercise(b.dataset.exercise);});
  $('lesson-tab').onclick=()=>showTab('lesson');
  $('practice-tab').onclick=()=>showTab('practice');
  for(const id of ['lesson-tab','practice-tab']) $(id).addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();const next=id==='lesson-tab'?'practice':'lesson';showTab(next);$(next+'-tab').focus();}});
  $('start-practice').onclick=()=>{showTab('practice');$('exercise-title').scrollIntoView({block:'start',behavior:'smooth'});};
  $('hint').onclick=()=>{state.hints[exerciseId]=(state.hints[exerciseId]||0)+1;renderHints();save();};
  $('solution').onclick=()=>{const box=$('solution-box');box.hidden=!box.hidden;box.open=!box.hidden;$('solution').textContent=box.hidden?'Ver solución explicada':'Ocultar solución';};
  $('reset').onclick=()=>{if(confirm('¿Reiniciar este ejercicio? Se restaurará la plantilla y se borrarán sus pistas abiertas y resultados.')){delete state.results[exerciseId];delete state.passed[exerciseId];delete state.hints[exerciseId];$('editor').value=current().starter;$('solution-box').hidden=true;$('solution-box').open=false;$('solution').textContent='Ver solución explicada';changed();renderHints();}};
  $('run').onclick=run;
  $('editor').addEventListener('input',changed);
  $('editor').addEventListener('scroll',()=>{$('line-numbers').scrollTop=$('editor').scrollTop;});
  $('editor').addEventListener('keydown',event=>{
    const editor=$('editor'), start=editor.selectionStart, end=editor.selectionEnd;
    if((event.ctrlKey||event.metaKey)&&event.key==='Enter'){event.preventDefault();run();return;}
    if(event.key==='Tab'){
      event.preventDefault();
      if(start!==end){
        const lineStart=editor.value.lastIndexOf('\n',start-1)+1;
        const block=editor.value.slice(lineStart,end);
        const replacement=block.split('\n').map(line=>event.shiftKey?line.replace(/^ {1,4}/,''):'    '+line).join('\n');
        editor.setRangeText(replacement,lineStart,end,'select');
      } else if(event.shiftKey){
        const before=editor.value.slice(0,start), match=before.match(/ {1,4}$/);
        if(match) editor.setRangeText('',start-match[0].length,start,'end');
      } else editor.setRangeText('    ',start,end,'end');
      changed();
    }
    if(event.key==='Enter'&&!event.ctrlKey&&!event.metaKey){
      event.preventDefault();
      const line=editor.value.slice(0,start).split('\n').pop();
      const indent=line.match(/^ */)[0]+(line.trimEnd().endsWith(':')?'    ':'');
      editor.setRangeText('\n'+indent,start,end,'end');changed();
    }
  });
  $('previous').onclick=()=>navigate(-1);
  $('next').onclick=()=>navigate(1);
  $('test-bar').onclick=event=>{const b=event.target.closest('[data-case]');if(b){const detail=$('case-'+b.dataset.case);if(detail){detail.open=true;detail.scrollIntoView({behavior:'smooth',block:'nearest'});}}};

  $('import-progress').onclick=()=>$('import-file').click();
  $('import-file').onchange=async()=>{
    const file=$('import-file').files[0]; if(!file)return;
    try {
      if(file.size>5_000_000)throw new Error('El respaldo es demasiado grande.');
      const backup=JSON.parse(await file.text());
      if(backup.course!=='semana15'||!backup.state||typeof backup.state!=='object')throw new Error('No es un respaldo de esta práctica.');
      if(busy)throw new Error('Espera a que termine la ejecución antes de importar.');
      const incoming=backup.state, restored={drafts:{},hints:{},passed:{},results:{},selected:'bases',exercise:null};
      for(const exercise of course.exercises){
        const id=exercise.id;
        if(typeof incoming.drafts?.[id]==='string'&&incoming.drafts[id].length<=50_000)restored.drafts[id]=incoming.drafts[id];
        if(Number.isInteger(incoming.hints?.[id]))restored.hints[id]=Math.max(0,Math.min(2,incoming.hints[id]));
        if(typeof incoming.passed?.[id]==='string'&&incoming.passed[id]===restored.drafts[id])restored.passed[id]=incoming.passed[id];
      }
      if(course.modules.some(m=>m.id===incoming.selected))restored.selected=incoming.selected;
      if(course.exercises.some(e=>e.id===incoming.exercise))restored.exercise=incoming.exercise;
      if(!confirm('¿Cargar este respaldo? Reemplazará el avance guardado en este navegador. Descarga tu avance actual antes si quieres conservarlo.'))return;
      state=restored; selectModule(state.selected,true); save();
      $('import-status').textContent='Código y progreso cargados. Ejecuta los casos para ver sus resultados actualizados.';
    } catch(error){$('import-status').textContent=error.message;}
    finally{$('import-file').value='';}
  };

  $('export').onclick=()=>{
    const blob=new Blob([JSON.stringify({course:'semana15',exported:new Date().toISOString(),state},null,2)],{type:'application/json'});
    const link=document.createElement('a'), url=URL.createObjectURL(blob);link.href=url;link.download='mi-avance-semana15.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
}
init();
