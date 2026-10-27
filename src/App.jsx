import { useEffect, useMemo, useState } from 'react'
import {
  Backpack, BookOpen, CalendarDays, Check, ChevronRight, Compass, Crown, Flame,
  Heart, Map, Plus, ScrollText, Settings, Shield, Sparkles, Sword, Trophy,
  UserRound, X, Dumbbell, GraduationCap, Moon, Coffee, Footprints
} from 'lucide-react'

const QUESTS = [
  { id: 1, title: 'Morning Expedition', subtitle: 'Move your body for 20+ minutes', xp: 40, gold: 12, type: 'body', stat: 'VIT' },
  { id: 2, title: 'Arcane Study', subtitle: 'Complete one focused study block', xp: 55, gold: 15, type: 'mind', stat: 'INT' },
  { id: 3, title: 'Nourish the Hero', subtitle: 'Have a balanced meal with protein', xp: 30, gold: 8, type: 'body', stat: 'VIT' },
  { id: 4, title: 'Campfire Reflection', subtitle: 'Journal for 5 minutes before bed', xp: 25, gold: 7, type: 'spirit', stat: 'SPI' },
]

const WORLDS = [
  { id:'body', name:'Verdant Wilds', desc:'Strength, movement & vitality', icon:Heart, stat:'VIT', unlocked:true },
  { id:'study', name:'Grand Archive', desc:'Medical school & knowledge', icon:BookOpen, stat:'INT', unlocked:true },
  { id:'spirit', name:'Astral Sanctum', desc:'Mind, spirit & reflection', icon:Sparkles, stat:'SPI', unlocked:true },
  { id:'glow', name:'Hall of Radiance', desc:'Glow-up & self-care', icon:Crown, stat:'RAD', unlocked:true },
  { id:'life', name:'Adventurer’s Keep', desc:'Routines & real-life systems', icon:Shield, stat:'DIS', unlocked:true },
  { id:'explore', name:'Unknown Lands', desc:'Exploration & new experiences', icon:Compass, stat:'EXP', unlocked:true },
]

const REWARDS = [
  {name:'Cozy Cafe Run', cost:30, icon:'☕'}, {name:'Movie Night', cost:60, icon:'🎬'},
  {name:'New Book', cost:90, icon:'📖'}, {name:'Little Treat', cost:120, icon:'🍰'}
]

const load = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem('life-rpg-'+key)) ?? fallback } catch { return fallback }
}

export default function App() {
  const [quests,setQuests] = useState(() => load('quests', QUESTS))
  const [xp,setXp] = useState(() => load('xp',245))
  const [gold,setGold] = useState(() => load('gold',86))
  const [active,setActive] = useState('dashboard')
  const [showQuest,setShowQuest] = useState(false)
  const [newQuest,setNewQuest] = useState('')
  const [toast,setToast] = useState('')
  const [routine,setRoutine] = useState(() => load('routine', [
    {id:1,time:'5:30 AM',title:'Wake & journal',done:false,icon:'spirit',xp:20,stat:'SPI',repeat:'daily',active:true},
    {id:2,time:'6:00 AM',title:'Deep study / MCAT',done:false,icon:'mind',xp:30,stat:'INT',repeat:'weekdays',active:true},
    {id:3,time:'8:30 AM',title:'Head to school',done:false,icon:'life',xp:10,stat:'DIS',repeat:'weekdays',active:true},
    {id:4,time:'6:30 PM',title:'Movement / gym',done:false,icon:'body',xp:25,stat:'VIT',repeat:'weekdays',active:true},
    {id:5,time:'10:00 PM',title:'Wind down & planner',done:false,icon:'spirit',xp:20,stat:'SPI',repeat:'daily',active:true},
  ]))
  const [grades,setGrades] = useState(() => load('grades', [
    {id:1,module:'Current Module',quiz:'Quiz 1',score:82},
    {id:2,module:'Current Module',quiz:'Quiz 2',score:91},
    {id:3,module:'Current Module',quiz:'Quiz 3',score:76},
  ]))
  const [newGrade,setNewGrade] = useState({quiz:'',score:''})
  const [editingGrade,setEditingGrade] = useState(null)
  const [gradeDraft,setGradeDraft] = useState({quiz:'',score:''})
  const [routineEditorMode,setRoutineEditorMode] = useState('edit')
  const [editingRoutine,setEditingRoutine] = useState(null)
  const [routineDraft,setRoutineDraft] = useState({time:'',title:'',xp:20,stat:'DIS',repeat:'daily',active:true})
  const [module,setModule] = useState(() => load('module', {
    name:'Current Module',
    examDate:'',
    topics:[
      {id:1,name:'Foundations',score:82},
      {id:2,name:'Mechanisms',score:76},
      {id:3,name:'Clinical application',score:91},
    ]
  }))
  const [topicDraft,setTopicDraft] = useState({name:'',score:''})
  const [editingTopic,setEditingTopic] = useState(null)
  const [boss,setBoss] = useState(() => load('boss', {active:false,defeated:false,attempts:0}))
  const [character,setCharacter] = useState(() => load('character', {name:'Shruti',race:'Human',className:'Wandering Mage',avatar:'🧙‍♀️',created:true}))
  const [characterEditor,setCharacterEditor] = useState(false)
  const [characterDraft,setCharacterDraft] = useState({name:'Shruti',race:'Human',className:'Wandering Mage',avatar:'🧙‍♀️'})
  const [statBonus,setStatBonus] = useState(() => load('stat-bonus', {VIT:0,INT:0,SPI:0,RAD:0,DIS:0}))
  const [workouts,setWorkouts] = useState(() => load('workouts', [
    {id:'back-bi',name:'Back + Biceps',icon:'⚔️',exercises:[{id:101,name:'Lat Pulldown',sets:3,reps:10,weight:50,best:50},{id:102,name:'Seated Cable Row',sets:3,reps:10,weight:50,best:50},{id:103,name:'Dumbbell Row',sets:3,reps:10,weight:20,best:20},{id:104,name:'Dumbbell Bicep Curl',sets:3,reps:10,weight:15,best:15}]},
    {id:'glutes',name:'Glutes',icon:'🍑',exercises:[{id:201,name:'Hip Thrust',sets:3,reps:10,weight:70,best:70},{id:202,name:'Romanian Deadlift',sets:3,reps:10,weight:50,best:50},{id:203,name:'Cable Kickback',sets:3,reps:12,weight:15,best:15},{id:204,name:'Hip Abduction',sets:3,reps:12,weight:70,best:70}]},
    {id:'legs',name:'Legs',icon:'🛡️',exercises:[{id:301,name:'Leg Press',sets:3,reps:10,weight:90,best:90},{id:302,name:'Leg Extension',sets:3,reps:10,weight:50,best:50},{id:303,name:'Leg Curl',sets:3,reps:10,weight:50,best:50},{id:304,name:'Goblet Squat',sets:3,reps:10,weight:25,best:25}]},
    {id:'push',name:'Push',icon:'✨',exercises:[{id:401,name:'Chest Press',sets:3,reps:10,weight:30,best:30},{id:402,name:'Shoulder Press',sets:3,reps:10,weight:15,best:15},{id:403,name:'Lateral Raise',sets:3,reps:12,weight:10,best:10},{id:404,name:'Tricep Pushdown',sets:3,reps:10,weight:20,best:20}]}
  ]))
  const [activeWorkout,setActiveWorkout] = useState('back-bi')
  const [workoutDraft,setWorkoutDraft] = useState({name:'',sets:3,reps:10,weight:0})
  const [showWorkoutForm,setShowWorkoutForm] = useState(false)
  const [daily,setDaily] = useState(() => load('daily', {date:'',completed:[],bonusClaimed:false}))
  const [achievements,setAchievements] = useState(() => load('achievements', []))
  const [companions,setCompanions] = useState(() => load('companions', []))
  const [inventory,setInventory] = useState(() => load('inventory', []))
  const [event,setEvent] = useState(() => load('event', {date:'',title:'',body:'',options:[],resolved:false}))

  useEffect(()=>localStorage.setItem('life-rpg-quests',JSON.stringify(quests)),[quests])
  useEffect(()=>localStorage.setItem('life-rpg-xp',JSON.stringify(xp)),[xp])
  useEffect(()=>localStorage.setItem('life-rpg-gold',JSON.stringify(gold)),[gold])
  useEffect(()=>localStorage.setItem('life-rpg-routine',JSON.stringify(routine)),[routine])
  useEffect(()=>localStorage.setItem('life-rpg-grades',JSON.stringify(grades)),[grades])
  useEffect(()=>localStorage.setItem('life-rpg-module',JSON.stringify(module)),[module])
  useEffect(()=>localStorage.setItem('life-rpg-boss',JSON.stringify(boss)),[boss])
  useEffect(()=>localStorage.setItem('life-rpg-character',JSON.stringify(character)),[character])
  useEffect(()=>localStorage.setItem('life-rpg-stat-bonus',JSON.stringify(statBonus)),[statBonus])
  useEffect(()=>localStorage.setItem('life-rpg-workouts',JSON.stringify(workouts)),[workouts])
  useEffect(()=>localStorage.setItem('life-rpg-daily',JSON.stringify(daily)),[daily])
  useEffect(()=>localStorage.setItem('life-rpg-achievements',JSON.stringify(achievements)),[achievements])
  useEffect(()=>localStorage.setItem('life-rpg-companions',JSON.stringify(companions)),[companions])
  useEffect(()=>localStorage.setItem('life-rpg-inventory',JSON.stringify(inventory)),[inventory])
  useEffect(()=>localStorage.setItem('life-rpg-event',JSON.stringify(event)),[event])
  useEffect(()=>{const d=new Date();const today=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;const last=load('routine-date',null);if(last!==today){setRoutine(xs=>xs.map(x=>({...x,done:false,xpAwarded:false})));localStorage.setItem('life-rpg-routine-date',JSON.stringify(today))}},[])

  const level=Math.floor(xp/250)+1, levelXp=xp%250, progress=levelXp/250*100
  const stats=useMemo(()=>[
    ['VIT',7+(statBonus.VIT||0),'Vitality',Heart],['INT',12+(statBonus.INT||0),'Intelligence',BookOpen],['SPI',9+(statBonus.SPI||0),'Spirit',Sparkles],
    ['RAD',6+(statBonus.RAD||0),'Radiance',Crown],['DIS',8+(statBonus.DIS||0),'Discipline',Shield]
  ],[statBonus])
  const completed=quests.filter(q=>q.done).length
  const todayKey=(()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`})()
  const dailyQuests=[
    {id:'study',title:'Enter the Grand Archive',subtitle:'Complete a focused study block',xp:35,gold:10,icon:'📜'},
    {id:'body',title:'Train in the Verdant Wilds',subtitle:'Move for 20+ minutes or complete a workout',xp:35,gold:10,icon:'⚔️'},
    {id:'ritual',title:'Tend the Adventurer',subtitle:'Complete one routine ritual',xp:25,gold:8,icon:'🕯️'},
    {id:'nourish',title:'Nourish the Hero',subtitle:'Have a balanced meal with protein',xp:25,gold:8,icon:'🥗'},
    {id:'explore',title:'Step Beyond the Keep',subtitle:'Visit somewhere new or take a new route',xp:40,gold:12,icon:'🗺️'},
    {id:'rest',title:'Rest at Camp',subtitle:'Protect a real bedtime / wind-down',xp:25,gold:8,icon:'🌙'},
  ]
  const dailyDone=dailyQuests.filter(q=>daily.completed.includes(q.id)).length

  function notify(message){setToast(message);window.clearTimeout(window.__lifeToast);window.__lifeToast=window.setTimeout(()=>setToast(''),2600)}
  function unlockAchievement(id){setAchievements(a=>a.includes(id)?a:[...a,id])}
  function completeDaily(id){
    if(daily.completed.includes(id))return
    const q=dailyQuests.find(x=>x.id===id);if(!q)return
    const next=[...daily.completed,id];setDaily(d=>({...d,completed:next}))
    setXp(v=>v+q.xp);setGold(g=>g+q.gold)
    if(next.length===dailyQuests.length&&!daily.bonusClaimed){setDaily(d=>({...d,bonusClaimed:true}));setXp(v=>v+100);setGold(g=>g+50);unlockAchievement('main-character');notify('DAILY ADVENTURE COMPLETE! +100 bonus XP · +50 gold')}
    else notify(`${q.title} complete! +${q.xp} XP · +${q.gold} gold`)
  }
  function resolveEvent(option){
    if(event.resolved)return
    const r=option.reward||{};if(r.xp)setXp(v=>v+r.xp);if(r.gold)setGold(g=>g+r.gold)
    if(r.pet)setCompanions(p=>p.includes(r.pet)?p:[...p,r.pet]);if(r.item)setInventory(i=>[...i,r.item])
    setEvent(e=>({...e,resolved:true}));notify(option.message||'The realm remembers your choice.')
  }
  function rollMysteryChest(){
    if(gold<100){notify('The Mystery Chest costs 100 gold.');return}
    setGold(g=>g-100)
    const drops=[{text:'+75 XP',reward:{xp:75}},{text:'+150 gold',reward:{gold:150}},{text:'A fox companion!',reward:{pet:'🦊 Moss the Fox'}},{text:'A rare map fragment',reward:{item:'🗺️ Map Fragment'}}]
    const d=drops[Math.floor(Math.random()*drops.length)],r=d.reward
    if(r.xp)setXp(v=>v+r.xp);if(r.gold)setGold(g=>g+r.gold);if(r.pet)setCompanions(p=>p.includes(r.pet)?p:[...p,r.pet]);if(r.item)setInventory(i=>[...i,r.item])
    notify('MYSTERY CHEST: '+d.text)
  }
  function finishQuest(id){
    const q=quests.find(x=>x.id===id); if(!q||q.done)return
    setQuests(xs=>xs.map(x=>x.id===id?{...x,done:true}:x)); setXp(x=>x+q.xp); setGold(g=>g+q.gold)
    notify(`Quest complete! +${q.xp} XP · +${q.gold} gold`)
  }
  function addQuest(e){
    e.preventDefault(); if(!newQuest.trim())return
    setQuests(xs=>[...xs,{id:Date.now(),title:newQuest.trim(),subtitle:'Custom quest from your adventurer’s journal',xp:25,gold:5,type:'custom',stat:'DIS',done:false}])
    setNewQuest('');setShowQuest(false);notify('New quest added to your journal.')
  }
  function toggleRoutine(id){const item=routine.find(x=>x.id===id);if(!item||item.active===false)return;const next=!item.done;setRoutine(xs=>xs.map(x=>x.id===id?{...x,done:next,xpAwarded:next?true:false}:x));if(next&&!item.xpAwarded){setXp(v=>v+(item.xp||20));notify(`Ritual complete! +${item.xp||20} XP · ${item.stat||'DIS'} strengthened`)}}
  function openRoutineEditor(item){setRoutineEditorMode('edit');setEditingRoutine(item.id);setRoutineDraft({time:item.time,title:item.title,xp:item.xp||20,stat:item.stat||'DIS',repeat:item.repeat||'daily',active:item.active!==false})}
  function openRoutineCreator(){setRoutineEditorMode('add');setEditingRoutine(null);setRoutineDraft({time:'',title:'',xp:20,stat:'DIS',repeat:'daily',active:true})}
  function saveRoutine(e){e.preventDefault();if(!routineDraft.time.trim()||!routineDraft.title.trim())return;const clean={time:routineDraft.time.trim(),title:routineDraft.title.trim(),xp:Number(routineDraft.xp)||20,stat:routineDraft.stat,repeat:routineDraft.repeat,active:routineDraft.active};if(routineEditorMode==='add'){setRoutine(xs=>[...xs,{id:Date.now(),...clean,done:false}]);notify('New routine quest added.')}else{setRoutine(xs=>xs.map(x=>x.id===editingRoutine?{...x,...clean}:x));notify('Routine quest updated.')}setEditingRoutine(null)}
  function deleteRoutine(id){
    setRoutine(xs=>xs.filter(x=>x.id!==id)); setEditingRoutine(null); notify('Routine quest removed.')
  }
  function addGrade(e){
    e.preventDefault(); const score=Number(newGrade.score)
    if(!newGrade.quiz||!Number.isFinite(score)||score<0||score>100)return
    setGrades(xs=>[...xs,{id:Date.now(),module:'Current Module',quiz:newGrade.quiz,score}])
    setNewGrade({quiz:'',score:''});notify('Quiz recorded in the Grand Archive.')
  }
  function openGradeEditor(g){
    setEditingGrade(g.id); setGradeDraft({quiz:g.quiz,score:String(g.score)})
  }
  function saveGrade(e){
    e.preventDefault()
    const score=Number(gradeDraft.score)
    if(!gradeDraft.quiz.trim()||!Number.isFinite(score)||score<0||score>100)return
    setGrades(xs=>xs.map(g=>g.id===editingGrade?{...g,quiz:gradeDraft.quiz.trim(),score}:g))
    setEditingGrade(null); notify('Quiz score updated.')
  }
  function deleteGrade(id){
    setGrades(xs=>xs.filter(g=>g.id!==id)); setEditingGrade(null); notify('Quiz record removed.')
  }
  function addTopic(e){e.preventDefault();if(!topicDraft.name.trim())return;setModule(m=>({...m,topics:[...m.topics,{id:Date.now(),name:topicDraft.name.trim(),score:Number(topicDraft.score)||0}]}));setTopicDraft({name:'',score:''});notify('Topic added to the Archive.')}
  function saveTopic(e){e.preventDefault();const score=Number(topicDraft.score);if(!topicDraft.name.trim()||!Number.isFinite(score)||score<0||score>100)return;setModule(m=>({...m,topics:m.topics.map(t=>t.id===editingTopic?{...t,name:topicDraft.name.trim(),score}:t)}));setEditingTopic(null);setTopicDraft({name:'',score:''});notify('Topic updated.')}
  function deleteTopic(id){setModule(m=>({...m,topics:m.topics.filter(t=>t.id!==id)}));setEditingTopic(null);setTopicDraft({name:'',score:''});notify('Topic removed.')}
  function prepareBoss(){if(!module.topics.length){notify('Add topics before facing the boss.');return}setBoss(b=>({...b,active:true,defeated:false,hp:1000}));notify('The Knowledge Warden has awakened. Your quiz scores are attacks!')}
  function attemptBoss(){
    const avg=module.topics.length?module.topics.reduce((a,t)=>a+t.score,0)/module.topics.length:0
    const damage=Math.max(10,Math.round(avg>=85?160:avg>=70?100:35))
    const hp=Math.max(0,Number(boss.hp??1000)-damage);const ready=hp===0
    setBoss(b=>({...b,attempts:b.attempts+1,hp,defeated:ready}))
    if(ready){setXp(v=>v+250);setGold(g=>g+100);unlockAchievement('boss-slayer');notify('KNOWLEDGE WARDEN DEFEATED! +250 XP · +100 gold')}
    else notify(`The Warden takes ${damage} damage. Keep studying your weakest topics.`)
  }
  function saveCharacter(e){e.preventDefault();if(!characterDraft.name.trim())return;setCharacter({...characterDraft,name:characterDraft.name.trim(),created:true});setCharacterEditor(false);notify('Character sheet updated.')}
  function openCharacterEditor(){setCharacterDraft({name:character.name,race:character.race,className:character.className,avatar:character.avatar});setCharacterEditor(true)}
  function updateExercise(workoutId,exerciseId,field,value){setWorkouts(xs=>xs.map(w=>w.id===workoutId?{...w,exercises:w.exercises.map(ex=>ex.id===exerciseId?{...ex,[field]:value}:ex)}:w))}
  function logWorkout(workoutId,exerciseId){
    const workout=workouts.find(w=>w.id===workoutId), ex=workout?.exercises.find(e=>e.id===exerciseId)
    if(!ex)return
    const weight=Number(ex.weight);if(!Number.isFinite(weight)||weight<0)return
    if(weight>Number(ex.best||0)){
      const gain=Math.max(1,Math.round((weight-Number(ex.best||0))/5))
      setWorkouts(xs=>xs.map(w=>w.id===workoutId?{...w,exercises:w.exercises.map(e=>e.id===exerciseId?{...e,best:weight}:e)}:w))
      setXp(v=>v+50);setGold(g=>g+15);setStatBonus(s=>({...s,VIT:(s.VIT||0)+gain}))
      notify('NEW PR! '+ex.name+' at '+weight+' lb · +50 XP · +15 gold')
    }else notify(ex.name+' logged at '+weight+' lb. Keep building.')
  }
  function addExercise(e){e.preventDefault();if(!workoutDraft.name.trim())return;setWorkouts(xs=>xs.map(w=>w.id===activeWorkout?{...w,exercises:[...w.exercises,{id:Date.now(),name:workoutDraft.name.trim(),sets:Number(workoutDraft.sets)||3,reps:Number(workoutDraft.reps)||10,weight:Number(workoutDraft.weight)||0,best:Number(workoutDraft.weight)||0}]}:w));setWorkoutDraft({name:'',sets:3,reps:10,weight:0});setShowWorkoutForm(false);notify('Exercise added to the split.')}
  function deleteExercise(workoutId,exerciseId){setWorkouts(xs=>xs.map(w=>w.id===workoutId?{...w,exercises:w.exercises.filter(e=>e.id!==exerciseId)}:w));notify('Exercise removed from the split.')}
  function buyReward(r){
    if(gold<r.cost){notify('Not enough gold yet — keep adventuring!');return}
    setGold(g=>g-r.cost);notify(`${r.name} added to your real-life reward log.`)
  }

  const nav=[
    ['dashboard','Camp',Sword],['quests','Quests',ScrollText],['planner','Routine',CalendarDays],
    ['study','Grand Archive',GraduationCap],['body','Verdant Wilds',Dumbbell],
    ['map','World Map',Map],['character','Character',UserRound],['inventory','Rewards',Backpack]
  ]

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark">✦</div><div><strong>Life RPG</strong><span>YOUR ADVENTURE</span></div></div>
      <div className="player-mini"><div className="avatar">🧙‍♀️</div><div><strong>Shruti</strong><span>Level {level} Adventurer</span></div></div>
      <nav>{nav.map(([id,label,Icon])=><button key={id} className={active===id?'active':''} onClick={()=>setActive(id)}><Icon size={17}/><span>{label}</span>{active===id&&<ChevronRight size={15}/>}</button>)}</nav>
      <div className="sidebar-bottom"><div className="mini-tip"><Sparkles size={16}/><div><b>Daily blessing</b><span>Small steps become legendary.</span></div></div><small>v0.2 · The Realm Expands</small></div>
    </aside>

    <main className="main">
      <header className="topbar">
        <div><span className="eyebrow">MONDAY · THE ADVENTURE CONTINUES</span><h1>{nav.find(n=>n[0]===active)?.[1]||'Camp'}</h1></div>
        <div className="top-actions"><div className="currency">◈ <b>{gold}</b></div><div className="level-pill"><span>LVL</span><b>{level}</b></div></div>
      </header>

      {active==='dashboard'&&<Dashboard quests={quests} stats={stats} xp={xp} progress={progress} completed={completed} finishQuest={finishQuest} setShowQuest={setShowQuest} worlds={WORLDS} setActive={setActive} character={character} dailyQuests={dailyQuests} daily={daily} dailyDone={dailyDone} completeDaily={completeDaily} event={event} resolveEvent={resolveEvent}/>}
      {active==='quests'&&<QuestPage quests={quests} finishQuest={finishQuest} setShowQuest={setShowQuest}/>}
      {active==='planner'&&<RoutinePage routine={routine} toggleRoutine={toggleRoutine} openRoutineEditor={openRoutineEditor} openRoutineCreator={openRoutineCreator}/>}
      {active==='study'&&<StudyPage grades={grades} newGrade={newGrade} setNewGrade={setNewGrade} addGrade={addGrade} openGradeEditor={openGradeEditor} module={module} setModule={setModule} topicDraft={topicDraft} setTopicDraft={setTopicDraft} addTopic={addTopic} editingTopic={editingTopic} setEditingTopic={setEditingTopic} saveTopic={saveTopic} deleteTopic={deleteTopic} boss={boss} prepareBoss={prepareBoss} attemptBoss={attemptBoss}/>}
      {active==='body'&&<BodyPage workouts={workouts} activeWorkout={activeWorkout} setActiveWorkout={setActiveWorkout} updateExercise={updateExercise} logWorkout={logWorkout} showWorkoutForm={showWorkoutForm} setShowWorkoutForm={setShowWorkoutForm} workoutDraft={workoutDraft} setWorkoutDraft={setWorkoutDraft} addExercise={addExercise} deleteExercise={deleteExercise} setActive={setActive}/>} 
      {active==='map'&&<MapPage worlds={WORLDS} setActive={setActive}/>}
      {active==='character'&&<CharacterPage character={character} level={level} xp={xp} stats={stats} openCharacterEditor={openCharacterEditor}/>} 
      {active==='inventory'&&<InventoryPage gold={gold} rewards={REWARDS} buyReward={buyReward} rollMysteryChest={rollMysteryChest} companions={companions} inventory={inventory} achievements={achievements}/>}
      
      {showQuest&&<div className="modal-backdrop" onClick={()=>setShowQuest(false)}><div className="modal" onClick={e=>e.stopPropagation()}><button className="close" onClick={()=>setShowQuest(false)}><X/></button><span className="eyebrow">NEW QUEST</span><h2>Add a quest to your journal</h2><form onSubmit={addQuest}><input autoFocus value={newQuest} onChange={e=>setNewQuest(e.target.value)} placeholder="e.g. Walk to class instead of taking the bus"/><button className="primary" type="submit">Accept Quest <Sword size={16}/></button></form></div></div>}
      {editingRoutine&&<div className="modal-backdrop" onClick={()=>setEditingRoutine(null)}><div className="modal" onClick={e=>e.stopPropagation()}><button className="close" onClick={()=>setEditingRoutine(null)}><X/></button><span className="eyebrow">{routineEditorMode==='add'?'NEW ROUTINE QUEST':'EDIT ROUTINE QUEST'}</span><h2>{routineEditorMode==='add'?'Add a ritual to your questline':'Change this ritual'}</h2><form onSubmit={saveRoutine}><label>Time<input autoFocus value={routineDraft.time} onChange={e=>setRoutineDraft({...routineDraft,time:e.target.value})}/></label><label>Quest<input value={routineDraft.title} onChange={e=>setRoutineDraft({...routineDraft,title:e.target.value})}/></label><div className="edit-grid"><label>XP<input type="number" min="1" value={routineDraft.xp} onChange={e=>setRoutineDraft({...routineDraft,xp:e.target.value})}/></label><label>Stat<select value={routineDraft.stat} onChange={e=>setRoutineDraft({...routineDraft,stat:e.target.value})}><option>DIS</option><option>VIT</option><option>INT</option><option>SPI</option><option>RAD</option></select></label><label>Repeats<select value={routineDraft.repeat} onChange={e=>setRoutineDraft({...routineDraft,repeat:e.target.value})}><option value="daily">Daily</option><option value="weekdays">Weekdays</option><option value="weekends">Weekends</option><option value="custom">Custom</option></select></label></div><label className="toggle-label"><input type="checkbox" checked={routineDraft.active} onChange={e=>setRoutineDraft({...routineDraft,active:e.target.checked})}/> Active ritual</label><div className="modal-actions">{routineEditorMode==='edit'&&<button className="ghost" type="button" onClick={()=>deleteRoutine(editingRoutine)}>Delete</button>}<button className="primary" type="submit">{routineEditorMode==='add'?'Add Ritual':'Save Changes'} <Check size={16}/></button></div></form></div></div>}
      {characterEditor&&<div className="modal-backdrop" onClick={()=>setCharacterEditor(false)}><div className="modal" onClick={e=>e.stopPropagation()}><button className="close" onClick={()=>setCharacterEditor(false)}><X/></button><span className="eyebrow">CHARACTER CREATION</span><h2>Shape your adventurer</h2><form onSubmit={saveCharacter}><label>Name<input autoFocus value={characterDraft.name} onChange={e=>setCharacterDraft({...characterDraft,name:e.target.value})}/></label><label>Race<select value={characterDraft.race} onChange={e=>setCharacterDraft({...characterDraft,race:e.target.value})}><option>Human</option><option>Elf</option><option>Dwarf</option><option>Halfling</option><option>Tiefling</option></select></label><label>Class<select value={characterDraft.className} onChange={e=>setCharacterDraft({...characterDraft,className:e.target.value})}><option>Wandering Mage</option><option>Warrior</option><option>Ranger</option><option>Rogue</option><option>Cleric</option></select></label><label>Avatar<select value={characterDraft.avatar} onChange={e=>setCharacterDraft({...characterDraft,avatar:e.target.value})}><option>🧙‍♀️</option><option>🧝‍♀️</option><option>🧝</option><option>🧚‍♀️</option><option>🧛‍♀️</option><option>🛡️</option></select></label><button className="primary" type="submit">Save Character <Check size={16}/></button></form></div></div>}{editingGrade&&<div className="modal-backdrop" onClick={()=>setEditingGrade(null)}><div className="modal" onClick={e=>e.stopPropagation()}><button className="close" onClick={()=>setEditingGrade(null)}><X/></button><span className="eyebrow">EDIT QUIZ RECORD</span><h2>Correct your archive</h2><form onSubmit={saveGrade}><label>Quiz name<input autoFocus value={gradeDraft.quiz} onChange={e=>setGradeDraft({...gradeDraft,quiz:e.target.value})}/></label><label>Score %<input type="number" min="0" max="100" value={gradeDraft.score} onChange={e=>setGradeDraft({...gradeDraft,score:e.target.value})}/></label><div className="modal-actions"><button className="ghost" type="button" onClick={()=>deleteGrade(editingGrade)}>Delete</button><button className="primary" type="submit">Save Score <Check size={16}/></button></div></form></div></div>}
      {toast&&<div className="toast"><Trophy size={18}/><span>{toast}</span></div>}
    </main>
  </div>
}

function Dashboard({quests,stats,xp,progress,completed,finishQuest,setShowQuest,worlds,setActive,character,dailyQuests,daily,dailyDone,completeDaily,event,resolveEvent}){

 return <div className="content">
  <section className="daily-adventure panel"><div><span className="eyebrow">TODAY'S ADVENTURE</span><h2>The Wandering Mage's Journey</h2><p>Complete real-life quests to earn XP, gold, discoveries, and level up.</p></div><div className="daily-progress"><b>{dailyDone}/{dailyQuests.length}</b><span>quests complete</span><div className="xp-bar"><i style={{width:(dailyDone/dailyQuests.length*100)+'%'}}/></div></div></section>
  <section className="daily-quests"><div className="section-head"><div><span className="eyebrow">QUESTBOARD</span><h2>Today's adventure</h2></div><span className="muted">Full clear = bonus XP</span></div><div className="daily-grid">{dailyQuests.map(q=><button key={q.id} className={'daily-quest panel '+(daily.completed.includes(q.id)?'done':'')} onClick={()=>completeDaily(q.id)}><span className="daily-icon">{q.icon}</span><span><b>{q.title}</b><small>{q.subtitle}</small></span><strong>+{q.xp}</strong>{daily.completed.includes(q.id)&&<Check size={16}/>}</button>)}</div></section>
  <section className="event-panel panel"><div><span className="eyebrow">✨ RANDOM ENCOUNTER</span><h2>{event.title||'A quiet road...'}</h2><p>{event.body||'The realm is waiting for your next discovery.'}</p></div><div className="event-options">{(event.options||[{label:'Explore',reward:{xp:25},message:'You found 25 XP!'}]).map((o,i)=><button key={i} className="ghost" disabled={event.resolved} onClick={()=>resolveEvent(o)}>{o.label}</button>)}</div></section>
  <section className="hero-grid"><div className="hero-card panel"><div className="hero-copy"><span className="eyebrow">CURRENT QUESTLINE</span><h2>Become the hero<br/><em>of your own story.</em></h2><p>Build your body, sharpen your mind, tend your spirit, and make ordinary days feel like an adventure.</p><button className="primary" onClick={()=>document.querySelector('.quest-list')?.scrollIntoView({behavior:'smooth'})}>Continue Adventure <ChevronRight size={17}/></button></div><div className="hero-orb"><div className="pixel-sun">✦</div><div className="mountain m1"/><div className="mountain m2"/></div></div>
  <div className="character-card panel"><div className="card-heading"><span>CHARACTER</span><UserRound size={16}/></div><div className="big-avatar">{character.avatar}</div><h3>{character.name}</h3><span className="class-name">{character.className.toUpperCase()}</span><div className="xp-label"><span>LEVEL {Math.floor(xp/250)+1}</span><span>{xp%250} / 250 XP</span></div><div className="xp-bar"><i style={{width:progress+'%'}}/></div><div className="stat-row">{stats.slice(0,3).map(([s,v])=><div key={s}><b>{s}</b><span>{v}</span></div>)}</div></div></section>

  <section className="quick-grid">
    <Quick icon={CalendarDays} title="Today's Routine" value="2 / 5 done" onClick={()=>setActive('planner')}/>
    <Quick icon={GraduationCap} title="Module Mastery" value="83% average" onClick={()=>setActive('study')}/>
    <Quick icon={Dumbbell} title="Body Quest" value="3 active goals" onClick={()=>setActive('body')}/>
    <Quick icon={Flame} title="Adventure Streak" value="4 days" onClick={()=>notify('Streak system is ready for your daily check-ins.')}/>
  </section>

  <section className="section-head"><div><span className="eyebrow">TODAY'S JOURNAL</span><h2>Active quests</h2></div><button className="ghost" onClick={()=>setShowQuest(true)}>+ New Quest</button></section>
  <div className="quest-list">{quests.map(q=><Quest key={q.id} q={q} finishQuest={finishQuest}/>)}</div>

  <section className="lower-grid"><div className="panel stats-panel"><div className="card-heading"><span>CHARACTER STATS</span><Sparkles size={16}/></div>{stats.map(([label,value,name,Icon])=><div className="stat-line" key={label}><Icon size={16}/><b>{label}</b><span>{name}</span><strong>{value}</strong></div>)}</div>
  <div className="panel progress-panel"><div className="card-heading"><span>ADVENTURE LOG</span><Flame size={16}/></div><div className="streak"><span className="streak-number">4</span><div><b>day streak</b><span>Keep the flame alive.</span></div><Flame size={30}/></div><div className="week">{['M','T','W','T','F','S','S'].map((d,i)=><div key={i} className={i<4?'done-day':''}><span>{d}</span><i>{i<4?'✓':'·'}</i></div>)}</div><div className="reward-note"><Trophy size={16}/><span><b>{completed}</b> quests completed today. Complete 2 more for the Explorer’s Bonus.</span></div></div></section>

  <section className="section-head world-head"><div><span className="eyebrow">THE REALM</span><h2>Choose your path</h2></div><button className="ghost" onClick={()=>setActive('map')}>Open Map <Map size={14}/></button></section>
  <div className="world-grid">{worlds.slice(0,3).map(w=><WorldCard key={w.id} world={w} onClick={()=>setActive(w.id==='body'?'body':w.id==='study'?'study':'planner')}/>)}</div>
 </div>
}

function Quick({icon:Icon,title,value,onClick}){return <button className="quick-card panel" onClick={onClick}><Icon size={19}/><span><b>{title}</b><small>{value}</small></span><ChevronRight size={15}/></button>}

function Quest({q,finishQuest}){const Icon=q.type==='body'?Heart:q.type==='mind'?BookOpen:q.type==='spirit'?Sparkles:ScrollText;return <div className={'quest-row '+(q.done?'done':'')}><button className="check" onClick={()=>finishQuest(q.id)}>{q.done?<Check size={17}/>:''}</button><div className="quest-icon"><Icon size={18}/></div><div className="quest-info"><b>{q.title}</b><span>{q.subtitle}</span></div><div className="quest-reward"><b>+{q.xp} XP</b><span>◈ {q.gold}</span></div><span className="quest-type">{q.type}</span></div>}

function QuestPage({quests,finishQuest,setShowQuest}){return <div className="content"><PageIntro eyebrow="ADVENTURER'S JOURNAL" title="All quests" text="Turn the things you already want to do into tiny victories." action="+ New Quest" onAction={()=>setShowQuest(true)}/><div className="quest-list full">{quests.map(q=><Quest key={q.id} q={q} finishQuest={finishQuest}/>)}</div></div>}

function RoutinePage({routine,toggleRoutine,openRoutineEditor,openRoutineCreator}){const day=new Date().getDay();const due=routine.filter(x=>x.active!==false&&((x.repeat||'daily')==='daily'||((x.repeat||'daily')==='weekdays'&&day>=1&&day<=5)||((x.repeat||'daily')==='weekends'&&(day===0||day===6))));const active=routine.filter(x=>x.active!==false);const done=active.filter(x=>x.done).length;return <div className="content"><PageIntro eyebrow="ADVENTURER'S KEEP" title="Today's routine" text="Your real-life schedule becomes a questline." action="+ Add Ritual" onAction={openRoutineCreator}/><div className="routine-summary panel"><div><span className="eyebrow">DAILY PROGRESS</span><strong>{done}/{active.length}</strong><span>rituals completed · completion grants XP</span></div><div className="xp-bar"><i style={{width:(active.length?done/active.length*100:0)+'%'}}/></div></div><div className="routine-list">{routine.map(item=><div className={'routine-row panel '+(item.done?'done ':'')+(item.active===false?'inactive':'')} key={item.id}><button className="routine-main" onClick={()=>toggleRoutine(item.id)}><span className="routine-time">{item.time}</span><span className="routine-check">{item.done?<Check size={15}/>:''}</span><span className="routine-title"><b>{item.title}</b><small>{item.repeat||'daily'} · +{item.xp||20} XP · {item.stat||'DIS'}</small></span></button><button className="row-edit" onClick={()=>openRoutineEditor(item)}>Edit</button></div>)}</div></div>}

function StudyPage({grades,newGrade,setNewGrade,addGrade,openGradeEditor,module,setModule,topicDraft,setTopicDraft,addTopic,editingTopic,setEditingTopic,saveTopic,deleteTopic,boss,prepareBoss,attemptBoss}){const avg=module.topics.length?Math.round(module.topics.reduce((a,t)=>a+t.score,0)/module.topics.length):0;const weak=[...module.topics].sort((a,b)=>a.score-b.score).slice(0,3);return <div className="content"><PageIntro eyebrow="GRAND ARCHIVE" title="Medical school command center" text="Quizzes become evidence, weak topics become study quests, and exams become boss battles."/><div className="module-header panel"><div><span className="eyebrow">CURRENT MODULE</span><input className="module-name" value={module.name} onChange={e=>setModule({...module,name:e.target.value})}/></div><label>Exam date<input type="date" value={module.examDate} onChange={e=>setModule({...module,examDate:e.target.value})}/></label></div><div className="study-grid"><div className="panel mastery"><span className="eyebrow">MODULE MASTERY</span><strong>{avg}%</strong><div className="xp-bar"><i style={{width:avg+'%'}}/></div><p>{weak.length?'Weakest target: '+weak[0].name:'Add topics to build your map.'}</p><button className="primary" onClick={prepareBoss}>{boss.active&&!boss.defeated?'Boss Battle Ready':'Prepare for Boss Battle'} <Sword size={15}/></button></div><div className="panel grade-form"><span className="eyebrow">RECORD A QUIZ</span><form onSubmit={addGrade}><input placeholder="Quiz name" value={newGrade.quiz} onChange={e=>setNewGrade({...newGrade,quiz:e.target.value})}/><input type="number" min="0" max="100" placeholder="Score %" value={newGrade.score} onChange={e=>setNewGrade({...newGrade,score:e.target.value})}/><button className="primary">Record Score <Plus size={15}/></button></form></div></div>{boss.active&&<div className={'boss-panel panel '+(boss.defeated?'defeated':'')}><div><span className="eyebrow">MODULE BOSS · ATTEMPT {boss.attempts}</span><h3>{boss.defeated?'✦ KNOWLEDGE WARDEN DEFEATED':'👹 THE KNOWLEDGE WARDEN'}</h3><p>{boss.defeated?'Module cleared! Your final strike shattered the Warden.':'85%+ = critical hit · 70–84% = strong hit · below 70% = glancing blow'}</p>{!boss.defeated&&<div className="boss-hp"><span>HP {boss.hp??1000} / 1000</span><div><i style={{width:((boss.hp??1000)/10)+'%'}}/></div></div>}</div>{!boss.defeated&&<button className="primary" onClick={attemptBoss}>Face Boss <Sword size={15}/></button>}</div>}<div className="archive-section"><div className="section-head"><div><span className="eyebrow">WEAK TOPICS</span><h2>Study targets</h2></div></div><div className="topic-grid">{module.topics.map(t=><div className="topic-row panel" key={t.id}><span><b>{t.name}</b><small>{t.score<80?'Needs another pass':'Ready for review'}</small></span><strong className={t.score>=85?'great':t.score>=70?'warning':'needs'}>{t.score}%</strong><button className="row-edit" onClick={()=>{setEditingTopic(t.id);setTopicDraft({name:t.name,score:String(t.score)})}}>Edit</button></div>)}</div><form className="topic-form panel" onSubmit={editingTopic?saveTopic:addTopic}><input placeholder="Topic name" value={topicDraft.name} onChange={e=>setTopicDraft({...topicDraft,name:e.target.value})}/><input type="number" min="0" max="100" placeholder="Mastery %" value={topicDraft.score} onChange={e=>setTopicDraft({...topicDraft,score:e.target.value})}/><button className="primary">{editingTopic?'Save Topic':'Add Topic'} <Plus size={15}/></button>{editingTopic&&<button type="button" className="ghost" onClick={()=>{setEditingTopic(null);setTopicDraft({name:'',score:''})}}>Cancel</button>}</form></div><div className="archive-section"><div className="section-head"><div><span className="eyebrow">QUIZ HISTORY</span><h2>Recorded battles</h2></div></div><div className="grade-list">{grades.map(g=><div className="grade-row panel" key={g.id}><BookOpen size={17}/><span>{g.quiz}<small>{g.module}</small></span><strong className={g.score>=85?'great':g.score>=70?'warning':'needs'}>{g.score}%</strong><button className="row-edit" onClick={()=>openGradeEditor(g)}>Edit</button></div>)}</div></div></div>}

function BodyPage({workouts,activeWorkout,setActiveWorkout,updateExercise,logWorkout,showWorkoutForm,setShowWorkoutForm,workoutDraft,setWorkoutDraft,addExercise,deleteExercise,setActive}){
 const workout=workouts.find(w=>w.id===activeWorkout)||workouts[0]
 return <div className="content"><PageIntro eyebrow="VERDANT WILDS" title="Body & vitality" text="Your training ground. Track your splits, working weights, and strength PRs."/><div className="body-grid"><BodyCard icon={Footprints} title="Movement" value="20+ min quest" text="Log a walk or run" onClick={()=>setActive('quests')}/><BodyCard icon={Dumbbell} title="Training" value={workouts.length+' splits'} text="Open your workout book below" onClick={()=>document.querySelector('.workout-book')?.scrollIntoView({behavior:'smooth'})}/><BodyCard icon={Heart} title="Nourishment" value="Protein quest" text="Complete today's balanced-meal quest" onClick={()=>setActive('quests')}/><BodyCard icon={Moon} title="Recovery" value="Tonight" text="Protect your sleep" onClick={()=>setActive('planner')}/></div><section className="workout-book"><div className="section-head"><div><span className="eyebrow">TRAINING GROUNDS</span><h2>Workout splits</h2></div><span className="muted">A PR earns bonus XP</span></div><div className="split-tabs">{workouts.map(w=><button key={w.id} className={w.id===activeWorkout?'active':''} onClick={()=>setActiveWorkout(w.id)}><span>{w.icon}</span>{w.name}</button>)}</div><div className="panel workout-panel"><div className="workout-heading"><div><span className="eyebrow">TODAY'S SPLIT</span><h3>{workout?.name}</h3></div><button className="primary" onClick={()=>setShowWorkoutForm(true)}>+ Add Exercise</button></div><div className="exercise-list">{workout?.exercises.map(ex=><div className="exercise-row" key={ex.id}><div className="exercise-name"><b>{ex.name}</b><small>{ex.sets} sets × {ex.reps} reps · Best {ex.best} lb</small></div><label>Weight (lb)<input type="number" min="0" step="2.5" value={ex.weight} onChange={e=>updateExercise(workout.id,ex.id,'weight',e.target.value)}/></label><button className="primary log-set" onClick={()=>logWorkout(workout.id,ex.id)}>{Number(ex.weight)>Number(ex.best||0)?'Set PR!':'Log Set'}</button><button className="exercise-delete" onClick={()=>deleteExercise(workout.id,ex.id)}><X size={14}/></button></div>)}</div><div className="pr-note"><Trophy size={16}/><span><b>Strength rule:</b> enter the weight you actually used, then log the set. If it beats your previous best, you earn <b>+50 XP +15 gold</b> and VIT grows.</span></div></div></section>{showWorkoutForm&&<div className="modal-backdrop" onClick={()=>setShowWorkoutForm(false)}><div className="modal" onClick={e=>e.stopPropagation()}><button className="close" onClick={()=>setShowWorkoutForm(false)}><X/></button><span className="eyebrow">NEW EXERCISE</span><h2>Add to {workout?.name}</h2><form onSubmit={addExercise}><label>Exercise<input autoFocus value={workoutDraft.name} onChange={e=>setWorkoutDraft({...workoutDraft,name:e.target.value})} placeholder="e.g. Bulgarian split squat"/></label><div className="edit-grid"><label>Sets<input type="number" min="1" value={workoutDraft.sets} onChange={e=>setWorkoutDraft({...workoutDraft,sets:e.target.value})}/></label><label>Reps<input type="number" min="1" value={workoutDraft.reps} onChange={e=>setWorkoutDraft({...workoutDraft,reps:e.target.value})}/></label><label>Starting weight<input type="number" min="0" step="2.5" value={workoutDraft.weight} onChange={e=>setWorkoutDraft({...workoutDraft,weight:e.target.value})}/></label></div><button className="primary" type="submit">Add Exercise <Plus size={15}/></button></form></div></div>}<div className="gentle-note panel"><Sparkles size={18}/><span><b>The rule of the Verdant Wilds:</b> progress comes from repeatable behaviors. A normal fluctuation in weight never costs XP.</span></div></div>
}
function BodyCard({icon:Icon,title,value,text,onClick}){return <button className="body-card panel" onClick={onClick}><Icon size={24}/><span className="eyebrow">{title}</span><strong>{value}</strong><small>{text}</small><ChevronRight size={15}/></button>}

function MapPage({worlds,setActive}){return <div className="content"><PageIntro eyebrow="WORLD MAP" title="The Realm of Becoming" text="Every region represents a part of the life you're building."/><div className="map-grid">{worlds.map(w=><WorldCard key={w.id} world={w} large onClick={()=>setActive(w.id==='body'?'body':w.id==='study'?'study':w.id==='life'?'planner':'dashboard')}/>)}</div></div>}

function WorldCard({world,onClick,large=false}){const Icon=world.icon;return <button className={'world-card panel '+(large?'large':'')} onClick={onClick}><div className="world-art"><Icon size={large?38:28}/><span>{world.stat}</span></div><div><h3>{world.name}</h3><p>{world.desc}</p></div><span className="circle-btn"><ChevronRight size={17}/></span></button>}

function CharacterPage({character,level,xp,stats,openCharacterEditor}){return <div className="content"><div className="character-sheet panel"><div className="sheet-avatar">{character.avatar}</div><div className="sheet-main"><span className="eyebrow">CHARACTER SHEET</span><h2>{character.name}</h2><span className="class-name">{character.className.toUpperCase()} · {character.race.toUpperCase()}</span><p>Your real-life actions shape your adventurer. PRs, quests, study wins, and routines build the stats behind the avatar.</p><div className="sheet-level"><b>Level {level}</b><div className="xp-bar"><i style={{width:(xp%250)/250*100+'%'}}/></div><span>{xp%250} / 250 XP</span></div><button className="ghost character-edit" onClick={openCharacterEditor}>Edit Character</button></div></div><div className="stat-cards">{stats.map(([label,value,name,Icon])=><div className="panel stat-card" key={label}><Icon/><span>{label}</span><strong>{value}</strong><small>{name}</small></div>)}</div><div className="panel character-rules"><span className="eyebrow">HOW YOUR HERO GROWS</span><div><b>VIT</b> workouts + strength PRs</div><div><b>INT</b> quizzes + focused study</div><div><b>SPI</b> journaling + recovery</div><div><b>DIS</b> routines completed</div><div><b>RAD</b> glow-up quests</div></div></div>}
function InventoryPage({gold,rewards,buyReward,rollMysteryChest,companions,inventory,achievements}){return <div className="content"><PageIntro eyebrow="ADVENTURER'S GUILD" title="Rewards & treasures" text="Gold buys real-life rewards. Mystery treasures and companions make the journey fun."/><div className="reward-grid">{rewards.map(r=><div className="panel reward-card" key={r.name}><span className="reward-icon">{r.icon}</span><h3>{r.name}</h3><span>◈ {r.cost} gold</span><button className="primary" disabled={gold<r.cost} onClick={()=>buyReward(r)}>{gold<r.cost?'Need more gold':'Claim reward'}</button></div>)}<div className="panel reward-card mystery-card"><span className="reward-icon">🎁</span><h3>Mystery Chest</h3><span>◈ 100 gold</span><button className="primary" disabled={gold<100} onClick={rollMysteryChest}>Open Chest</button></div></div><section className="treasure-section"><div className="section-head"><div><span className="eyebrow">COLLECTION</span><h2>Your treasures</h2></div></div><div className="collection-grid"><div className="panel collection-card"><b>🐾 Companions</b><strong>{companions.length}</strong><small>{companions.length?companions.join(' · '):'No companion yet.'}</small></div><div className="panel collection-card"><b>🎒 Items</b><strong>{inventory.length}</strong><small>{inventory.length?inventory.join(' · '):'Your inventory is waiting.'}</small></div><div className="panel collection-card"><b>🏆 Achievements</b><strong>{achievements.length}</strong><small>{achievements.length?achievements.join(' · '):'Hidden achievements await.'}</small></div></div></section></div>}

function PageIntro({eyebrow,title,text,action,onAction}){return <div className="page-intro"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2><p>{text}</p></div>{action&&<button className="primary" onClick={onAction}>{action}</button>}</div>}
