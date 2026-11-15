 'use strict';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const TYPES=['multiple','multianswer','truefalse','blanks','markwords'];
const blank=(type='multiple')=>({id:crypto.randomUUID(),type,text:'',options:['','','',''],correct:0,corrects:[],instructions:'',shuffle:true,feedback:''});
let quiz={title:'',description:'',feedbackMode:'immediate',questions:[blank()]};
function syncMeta(){quiz.title=$('quizTitle').value;quiz.description=$('quizDescription').value;quiz.feedbackMode=$('feedbackMode').value}
function markedParts(text){return String(text||'').split(/(\*[^*\n]+\*)/g).filter(Boolean).map(s=>({value:s.startsWith('*')&&s.endsWith('*')?s.slice(1,-1):s,correct:s.startsWith('*')&&s.endsWith('*')}))}
function renderEditor(){
 $('quizTitle').value=quiz.title;$('quizDescription').value=quiz.description;
 const host=$('questionList');host.replaceChildren();if(!quiz.questions.length)host.innerHTML='<div class="empty">No questions yet. Add one to begin.</div>';
 quiz.questions.forEach((q,i)=>{
  const el=document.createElement('article');el.className='question';
  el.innerHTML=`<div class="question-head"><h3>Question ${i+1}</h3><div class="actions"><button class="secondary" data-action="up" ${i===0?'disabled':''}>↑</button><button class="secondary" data-action="down" ${i===quiz.questions.length-1?'disabled':''}>↓</button><button class="secondary danger" data-action="delete">Delete</button></div></div><label>Question type</label><select data-field="type"><option value="multiple" ${q.type==='multiple'?'selected':''}>Multiple choice (one answer)</option><option value="multianswer" ${q.type==='multianswer'?'selected':''}>Multiple answers (checkboxes)</option><option value="truefalse" ${q.type==='truefalse'?'selected':''}>True / False</option><option value="blanks" ${q.type==='blanks'?'selected':''}>Fill in the blanks</option><option value="markwords" ${q.type==='markwords'?'selected':''}>Mark the words (click text)</option></select><label>Instructions (optional)</label><textarea rows="2" data-field="instructions" placeholder="e.g. Click the incorrect Boolean operator.">${esc(q.instructions||'')}</textarea><label>${q.type==='blanks'?'Sentence with blanks':q.type==='markwords'?'Text to mark':'Question text'}</label><textarea rows="3" data-field="text" placeholder="${q.type==='blanks'?'The Boolean operator *AND* narrows a search.':q.type==='markwords'?'diabetes AND hypertension *OR* exercise':'Enter your question'}">${esc(q.text)}</textarea><div class="question-help"></div><div class="answer-editor"></div><div class="shuffle-editor"></div><label>Feedback / explanation (optional)</label><textarea rows="2" data-field="feedback" placeholder="Explain the correct answer">${esc(q.feedback)}</textarea>`;
  const help=el.querySelector('.question-help'), answers=el.querySelector('.answer-editor');
  if(['multiple','multianswer'].includes(q.type)){const wrap=el.querySelector('.shuffle-editor');wrap.innerHTML='<label class="check-setting"><input type="checkbox" data-shuffle> Randomize answer order for students</label>';const cb=wrap.querySelector('input');cb.checked=q.shuffle!==false;cb.addEventListener('change',()=>q.shuffle=cb.checked)}
  if(q.type==='blanks')help.textContent='Put *asterisks* around each correct answer. Example: The Boolean operator *AND* narrows a search. Alternatives: *AND|and* (case-insensitive by default).';
  if(q.type==='markwords')help.textContent='Put *asterisks* around the correct word or phrase. Example: diabetes AND hypertension *OR* exercise. Enter directions in Instructions above.';
  if(['multiple','multianswer','truefalse'].includes(q.type)){
   const multi=q.type==='multianswer';
   const label=document.createElement('label');label.textContent=multi?'Answers (check every correct answer)':'Answers (select the correct answer)';answers.append(label);
   (q.type==='truefalse'?['True','False']:q.options).forEach((v,j)=>{
    const r=document.createElement('div');r.className='option-row';
    r.innerHTML=`<input type="${multi?'checkbox':'radio'}" ${multi?(q.corrects||[]).includes(j)?'checked':'':q.correct===j?'checked':''} name="correct-${q.id}" aria-label="Mark answer ${j+1} correct"><input type="text" value="${esc(v)}" aria-label="Answer ${j+1}" ${q.type==='truefalse'?'disabled':''} placeholder="Answer ${j+1}">`;
    r.querySelector('input[type=checkbox],input[type=radio]').addEventListener('change',e=>{if(multi){const s=new Set(q.corrects||[]);e.target.checked?s.add(j):s.delete(j);q.corrects=[...s].sort()}else q.correct=j});
    if(q.type!=='truefalse')r.querySelector('input[type=text]').addEventListener('input',e=>q.options[j]=e.target.value);
    answers.append(r);
   });
  }
  el.querySelectorAll('[data-field]').forEach(node=>node.addEventListener('input',e=>{const field=e.target.dataset.field;if(field==='type'){syncQuestionFields();q.type=e.target.value;q.correct=0;q.corrects=[];renderEditor()}else q[field]=e.target.value}));
  el.querySelectorAll('[data-action]').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.action==='delete')quiz.questions.splice(i,1);else{const j=i+(b.dataset.action==='up'?-1:1);[quiz.questions[i],quiz.questions[j]]=[quiz.questions[j],quiz.questions[i]]}renderEditor()}));host.append(el);
 });
}
function syncQuestionFields(){document.querySelectorAll('#questionList .question').forEach((el,i)=>{const q=quiz.questions[i];if(!q)return;['instructions','text','feedback'].forEach(field=>{const node=el.querySelector('[data-field="'+field+'"]');if(node)q[field]=node.value})})}
function valid(){syncQuestionFields();syncMeta();quiz.feedbackMode=$('feedbackMode').value;if(!quiz.title.trim()){alert('Please enter a quiz title.');return false}if(!quiz.questions.length){alert('Add at least one question.');return false}
 for(let i=0;i<quiz.questions.length;i++){const q=quiz.questions[i],parts=markedParts(q.text);
  if(!q.text.trim()){alert('Enter the text for question '+(i+1));return false}
  if(['multiple','multianswer'].includes(q.type)&&(!Array.isArray(q.options)||q.options.length!==4||q.options.some(x=>!x.trim()))){alert('Complete all four answers for question '+(i+1));return false}
  if(q.type==='multianswer'&&!(q.corrects||[]).length){alert('Select at least one correct answer for question '+(i+1));return false}
  if(['blanks','markwords'].includes(q.type)&&!parts.some(p=>p.correct)){alert('Put *asterisks* around at least one correct answer in question '+(i+1));return false}
  if(q.type==='markwords'&&!parts.some(p=>!p.correct&&p.value.trim())){alert('Question '+(i+1)+' needs at least one unmarked word to choose from.');return false}
 }return true}
// This function is embedded, unchanged, into exported standalone HTML.
function runStudent(root,data){
 const E=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const parts=text=>String(text||'').split(/(\*[^*\n]+\*)/g).filter(Boolean).map(s=>({value:s.startsWith('*')&&s.endsWith('*')?s.slice(1,-1):s,correct:s.startsWith('*')&&s.endsWith('*')}));
 const tokenize=text=>parts(text).flatMap(p=>p.correct?[{value:p.value,correct:true,clickable:true}]:((p.value.match(/\s+|[\p{L}\p{N}_-]+|[^\p{L}\p{N}_\s-]+/gu)||[]).map(t=>({value:t,correct:false,clickable:/[\p{L}\p{N}]/u.test(t)}))));
 const shuffle=arr=>{for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]]}return arr};
 const mode=['immediate','perquestion','end'].includes(data.feedbackMode)?data.feedbackMode:'end';
 let markup='<h2>'+E(data.title)+'</h2><p>'+E(data.description)+'</p><form id="studentForm">';
 data.questions.forEach((q,i)=>{
  markup+='<section class="student-question" data-question="'+i+'"><fieldset><legend>'+(i+1)+'. '+E(q.instructions||(q.type==='markwords'?'Select the correct word or phrase.':q.type==='blanks'?'Complete the missing word or phrase.':q.text||'Complete the activity'))+'</legend>';
  if(q.type==='blanks'){
   let j=0;markup+='<div class="blank-text">'+parts(q.text).map(t=>t.correct?'<input class="inline-answer" type="text" name="q'+i+'b'+j+++'" aria-label="Blank '+j+'" autocomplete="off">':E(t.value)).join('')+'</div>';
  }else if(q.type==='markwords'){
   const ts=tokenize(q.text);markup+='<div class="mark-words">'+ts.map((t,j)=>t.clickable?'<button type="button" class="mark-token" data-q="'+i+'" data-token="'+j+'" aria-pressed="false">'+E(t.value)+'</button>':E(t.value)).join('')+'</div>';
  }else{
   const options=q.type==='truefalse'?['True','False']:q.options;
   const order=options.map((_,j)=>j);if(q.type!=='truefalse'&&q.shuffle!==false)shuffle(order);
   markup+='<div class="student-options">'+order.map(j=>'<label class="student-option"><input type="'+(q.type==='multianswer'?'checkbox':'radio')+'" name="q'+i+'" value="'+j+'"> '+E(options[j])+'</label>').join('')+'</div>';
  }
  markup+='</fieldset><div class="feedback" id="feedback'+i+'" hidden aria-live="polite"></div>';
  if(mode==='perquestion'||(mode==='immediate'&&!['multiple','truefalse'].includes(q.type)))markup+='<button type="button" class="check-question secondary" data-check="'+i+'">Check answer</button>';
  markup+='</section>';
 });
 markup+='<div class="preview-actions">'+(mode==='end'?'<button type="submit">Check answers</button>':'')+'<button type="button" class="secondary" id="retryQuiz">Try again</button></div><div id="quizResult" class="result" hidden aria-live="polite"></div></form>';
 root.innerHTML=markup;const form=root.querySelector('#studentForm');const checked=new Map();
 const evaluate=i=>{
  const q=data.questions[i];let ok=false,answer='';
  // Never grade an unanswered question, including an accidental Check answer click.
  const section=root.querySelector('[data-question="'+i+'"]');
  const hasResponse=q.type==='blanks'?[...section.querySelectorAll('.inline-answer')].some(x=>x.value.trim()):q.type==='markwords'?[...section.querySelectorAll('.mark-token')].some(x=>x.getAttribute('aria-pressed')==='true'):!!section.querySelector('input[name="q'+i+'"]:checked');
  if(!hasResponse){const fb=root.querySelector('#feedback'+i);fb.hidden=false;fb.innerHTML='<span class="feedback-detail">Choose an answer before checking.</span>';return;}
  if(q.type==='blanks'){
   const ps=parts(q.text).filter(p=>p.correct);ok=ps.every((p,j)=>{const input=form.elements.namedItem('q'+i+'b'+j);const value=(input?.value||'').trim().toLocaleLowerCase();return !!value&&p.value.split('|').some(a=>a.trim().toLocaleLowerCase()===value)});answer=ps.map(p=>p.value.split('|')[0]).join(', ');
  }else if(q.type==='markwords'){
   const ts=tokenize(q.text);const buttons=[...root.querySelectorAll('.mark-token[data-q="'+i+'"]')];ok=buttons.every(b=>(b.getAttribute('aria-pressed')==='true')===ts[Number(b.dataset.token)].correct);answer=ts.filter(p=>p.correct).map(p=>p.value).join(', ');
  }else if(q.type==='multianswer'){
   const selected=[...form.querySelectorAll('input[name="q'+i+'"]:checked')].map(x=>Number(x.value)).sort((a,b)=>a-b);const expected=[...(q.corrects||[])].sort((a,b)=>a-b);ok=selected.length===expected.length&&selected.every((v,j)=>v===expected[j]);answer=expected.map(j=>q.options[j]).join(', ');
  }else{
   const picked=form.querySelector('input[name="q'+i+'"]:checked');ok=!!picked&&Number(picked.value)===q.correct;answer=q.type==='truefalse'?['True','False'][q.correct]:q.options[q.correct];
  }
  checked.set(i,ok);const fb=root.querySelector('#feedback'+i);fb.hidden=false;
  fb.innerHTML='<strong class="feedback-status '+(ok?'correct':'incorrect')+'">'+(ok?'Correct answer: ':'Incorrect. Correct answer: ')+E(answer)+'</strong>'+(q.feedback?'<span class="feedback-detail">'+E(q.feedback)+'</span>':'');
  section.querySelectorAll('.student-option').forEach(label=>{const input=label.querySelector('input');const correct=q.type==='multianswer'?(q.corrects||[]).includes(Number(input.value)):Number(input.value)===q.correct;label.classList.toggle('answer-right',correct);label.classList.toggle('answer-wrong',input.checked&&!correct)});
  section.querySelectorAll('.mark-token').forEach(button=>{const t=tokenize(q.text)[Number(button.dataset.token)];button.classList.toggle('answer-right',t.correct);button.classList.toggle('answer-wrong',button.getAttribute('aria-pressed')==='true'&&!t.correct)});
  section.querySelectorAll('input, .mark-token, .check-question').forEach(control=>control.disabled=true);
  if(checked.size===data.questions.length){const result=root.querySelector('#quizResult');const score=[...checked.values()].filter(Boolean).length;result.hidden=false;result.textContent='Score: '+score+' / '+data.questions.length+' ('+Math.round(score/data.questions.length*100)+'%)'};
 };
 root.querySelectorAll('.mark-token').forEach(b=>b.addEventListener('click',()=>{b.setAttribute('aria-pressed',b.getAttribute('aria-pressed')==='true'?'false':'true')}));
 root.querySelectorAll('.check-question').forEach(b=>b.addEventListener('click',()=>evaluate(Number(b.dataset.check))));
 if(mode==='immediate')data.questions.forEach((q,i)=>{if(['multiple','truefalse'].includes(q.type))root.querySelectorAll('input[name="q'+i+'"]').forEach(input=>input.addEventListener('change',()=>evaluate(i)))});
 form.addEventListener('submit',event=>{event.preventDefault();data.questions.forEach((_,i)=>{if(!checked.has(i))evaluate(i)})});
 root.querySelector('#retryQuiz').addEventListener('click',()=>runStudent(root,data));
}
function download(name,contents,type){const url=URL.createObjectURL(new Blob([contents],{type}));const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function slug(s){return s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,60)||'quiz'}
function exportedHtml(data){
 const safeJson=JSON.stringify(data).replace(/</g,'\\u003c').replace(/>/g,'\\u003e').replace(/&/g,'\\u0026').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
 const css=`[hidden]{display:none!important}body{font:16px system-ui,Arial,sans-serif;max-width:760px;margin:30px auto;padding:20px;color:#30263c;background:#faf7fc;line-height:1.7}h1,h2{color:#35204f}.student-question{border-bottom:1px solid #e4dbea;padding:22px 0}fieldset{border:0;padding:0;margin:0}legend{font-weight:750;font-size:1.12rem;margin-bottom:14px}.student-option{display:block;padding:10px;border-radius:7px;cursor:pointer;margin:4px 0}.student-option input{accent-color:#7040a0}.student-option.answer-right{background:#e5f6e9;color:#12632e}.student-option.answer-wrong{background:#fde9ec;color:#9e2030}button{background:#7040a0;color:white;border:0;border-radius:7px;padding:10px 16px;margin:8px 8px 8px 0;cursor:pointer;font:inherit}button.secondary{background:#f0e6f8;color:#35204f;border:1px solid #d6b9e8}button:disabled{cursor:default;opacity:.8}.feedback{margin:12px 0}.feedback-status{font-weight:800;font-size:1.28rem;line-height:1.4;display:block}.feedback-status.correct{color:#16733c}.feedback-status.incorrect{color:#b42332}.feedback-detail{display:block;color:#553c6e;margin-top:5px}.result{background:#f0e6f8;padding:12px;margin-top:16px;border-radius:8px;font-weight:700}footer{margin-top:40px;color:#667;font-size:13px}a{color:#7040a0}.inline-answer{width:135px;max-width:100%;font:inherit;padding:7px;border:1px solid #cfc0dc;border-radius:6px;margin:4px}.blank-text,.mark-words{line-height:2.5}.mark-token{display:inline;border:0;border-radius:4px;background:#f0e6f8;color:#35204f;padding:2px 4px;margin:0 1px;font:inherit;line-height:2;box-decoration-break:clone}.mark-token[aria-pressed=true]{background:#7040a0;color:white}.mark-token.answer-right{background:#d5f2df;color:#12632e}.mark-token.answer-wrong{background:#f8dce2;color:#9e2030}.preview-actions{margin-top:20px}`;
 return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+esc(data.title)+'</title><style>'+css+'</style></head><body><main id="app"></main><footer>Created with FettyTools by <a href="https://jasonfetty.com" target="_blank" rel="noopener">Jason Fetty</a></footer><script type="application/json" id="quizData">'+safeJson+'</script><script>('+runStudent.toString()+')(document.getElementById("app"),JSON.parse(document.getElementById("quizData").textContent));<\\/script></body></html>'.replace('<\\/script>','</script>');
}
$('quizTitle').addEventListener('input',syncMeta);$('quizDescription').addEventListener('input',syncMeta);
$('addQuestion').addEventListener('click',()=>{syncMeta();quiz.questions.push(blank());renderEditor()});
$('newQuiz').addEventListener('click',()=>{if(confirm('Start a new quiz? Save your current quiz first if you want to keep it.')){quiz={title:'',description:'',feedbackMode:'immediate',questions:[blank()]};renderEditor();$('feedbackMode').value='immediate';showTab('edit')}});
$('saveBtn').addEventListener('click',()=>{syncQuestionFields();syncMeta();download(slug(quiz.title||'untitled')+'.json',JSON.stringify(quiz,null,2),'application/json')});
$('loadBtn').addEventListener('click',()=>$('loadFile').click());
$('loadFile').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;try{const obj=JSON.parse(await file.text());if(typeof obj.title!=='string'||typeof obj.description!=='string'||!Array.isArray(obj.questions)||obj.questions.some(q=>!TYPES.includes(q.type)||typeof q.text!=='string'||!Array.isArray(q.options)||q.options.length!==4||!q.options.every(x=>typeof x==='string')||!Number.isInteger(q.correct)||q.correct<0||q.correct>3||typeof q.feedback!=='string'||(q.type==='multianswer'&&(!Array.isArray(q.corrects)||q.corrects.some(n=>!Number.isInteger(n)||n<0||n>3)))))throw Error('Not a compatible quiz file');quiz={title:obj.title,description:obj.description,feedbackMode:obj.feedbackMode||'immediate',questions:obj.questions.map(q=>({...q,id:crypto.randomUUID(),instructions:q.instructions||'',shuffle:q.shuffle!==false,corrects:q.corrects||[]}))};renderEditor();$('feedbackMode').value=quiz.feedbackMode;showTab('edit')}catch(err){alert('Could not open quiz: '+err.message)}e.target.value=''});
function showTab(name){document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('active',t.dataset.tab===name));['edit','preview','publish','embed'].forEach(id=>$(id).hidden=id!==name);if(name==='preview'){if(!valid()){showTab('edit');return}runStudent($('previewContent'),quiz)}}
document.querySelectorAll('.tab').forEach(b=>b.addEventListener('click',()=>showTab(b.dataset.tab)));
$('exportBtn').addEventListener('click',()=>{if(valid())download(slug(quiz.title)+'.html',exportedHtml(quiz),'text/html')});
function updateEmbed(){const input=$('hostedUrl').value.trim(),box=$('embedCode');if(!input){box.value='';$('embedStatus').textContent='';return}try{const u=new URL(input);if(u.protocol!=='https:')throw Error('HTTPS required');const url=u.href.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');box.value='<iframe src="'+url+'" title="Interactive quiz" width="100%" height="650" style="border:0" loading="lazy"></iframe>';$('embedStatus').textContent=''}catch(e){box.value='';$('embedStatus').textContent='Enter a valid public HTTPS URL.'}}
$('hostedUrl').addEventListener('input',updateEmbed);
$('copyEmbed').addEventListener('click',async()=>{updateEmbed();if(!$('embedCode').value)return;try{await navigator.clipboard.writeText($('embedCode').value);$('embedStatus').textContent='Copied!'}catch(e){$('embedCode').focus();$('embedCode').select();$('embedStatus').textContent='Select the code and press Ctrl+C to copy.'}});
renderEditor();
