import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Backpack, BookOpen, CalendarDays, Check, ChevronRight, Compass, Crown, Flame,
  Heart, Map, Plus, ScrollText, Settings, Shield, Sparkles, Sword, Trophy,
  UserRound, X, Dumbbell, GraduationCap, Moon, Coffee, Footprints, Cloud, LogOut
} from 'lucide-react'
import { supabase } from './lib/supabase'

const QUESTS = [
  { id: 1, title: 'Morning Expedition', subtitle: 'Move your body for 20+ minutes', xp: 40, gold: 12, type: 'body', stat: 'VIT' },
  { id: 2, title: 'Arcane Study', subtitle: 'Complete one focused study block', xp: 55, gold: 15, type: 'mind', stat: 'INT' },
  { id: 3, title: 'Nourish the Hero', subtitle: 'Have a balanced meal with protein', xp: 30, gold: 8, type: 'body', stat: 'VIT' },
  { id: 4, title: 'Campfire Reflection', subtitle: 'Journal for 5 minutes before bed', xp: 25, gold: 7, type: 'spirit', stat: 'SPI' },
]

const WORLDS = [
  { id:'body', name:'Verdant Wilds', desc:'Strength, movement & vitality', icon:Heart, stat:'VIT', unlockLevel:1 },
  { id:'study', name:'Grand Archive', desc:'Medical school & knowledge', icon:BookOpen, stat:'INT', unlockLevel:1 },
  { id:'spirit', name:'Astral Sanctum', desc:'Mind, spirit & reflection', icon:Sparkles, stat:'SPI', unlockLevel:10 },
  { id:'glow', name:'Hall of Radiance', desc:'Glow-up & self-care', icon:Crown, stat:'RAD', unlockLevel:5 },
  { id:'life', name:'Adventurer’s Keep', desc:'Routines & real-life systems', icon:Shield, stat:'DIS', unlockLevel:1 },
  { id:'explore', name:'Unknown Lands', desc:'Exploration & new experiences', icon:Compass, stat:'EXP', unlockLevel:15 },
]

const REWARDS = [
  {name:'Cozy Cafe Run', cost:30, icon:'☕'}, {name:'Movie Night', cost:60, icon:'🎬'},
  {name:'New Book', cost:90, icon:'📖'}, {name:'Little Treat', cost:120, icon:'🍰'}
]

const ACHIEVEMENT_INFO = {
  'main-character': {name:'Main Character Energy',icon:'🌟',desc:'Cleared every daily quest in one day.'},
  'boss-slayer': {name:'Boss Slayer',icon:'⚔️',desc:'Defeated the Knowledge Warden.'},
  'three-day-flame': {name:'Three-Day Flame',icon:'🔥',desc:'Kept a 3-day adventure streak.'},
  'week-warrior': {name:'Week Warrior',icon:'👑',desc:'Kept a 7-day adventure streak.'},
  'pr-hunter': {name:'PR Hunter',icon:'💪',desc:'Set a new strength record.'}
}



const EQUIPMENT_CATALOG = [
  {id:'ember-staff',name:'Emberwood Staff',slot:'weapon',icon:'🔥',cost:120,bonus:{INT:2},desc:'A warm staff that rewards focused study.'},
  {id:'moon-cloak',name:'Moonlit Cloak',slot:'armor',icon:'🌙',cost:140,bonus:{SPI:2},desc:'Soft armor for quiet nights and recovery.'},
  {id:'traveler-boots',name:'Traveler Boots',slot:'accessory',icon:'🥾',cost:100,bonus:{VIT:1,DIS:1},desc:'Made for walks, runs, and new roads.'},
  {id:'golden-charm',name:'Golden Charm',slot:'accessory',icon:'✨',cost:180,bonus:{RAD:2},desc:'A little radiance for the Hall of Becoming.'},
]

const QUEST_CHAINS = [
  {id:'first-chapter',title:'The First Chapter',villager:'Mira the Healer',icon:'📜',desc:'Prove that small acts of care can change the whole realm.',steps:[
    {title:'Rest at the Healer’s Shrine',task:'Take 10 intentional minutes away from schoolwork.',xp:25,gold:20},
    {title:'Carry a Kind Thought',task:'Write down one thing you handled well today.',xp:30,gold:25},
    {title:'Return to the Shrine',task:'Complete your normal bedtime wind-down.',xp:40,gold:35}
  ]},
  {id:'archive-chronicle',title:'The Lost Chronicle',villager:'Tomas the Scholar',icon:'📚',desc:'Recover a forgotten page by training your recall.',steps:[
    {title:'Find the First Page',task:'Complete 20 flashcards or practice questions.',xp:30,gold:25},
    {title:'Decode the Margin',task:'Review 5 questions you previously missed.',xp:35,gold:30},
    {title:'Seal the Chronicle',task:'Explain one difficult topic without looking at notes.',xp:50,gold:45}
  ]},
  {id:'road-beyond',title:'Road Beyond the Keep',villager:'Pip the Trainer',icon:'🧭',desc:'Open a new road by moving through the world.',steps:[
    {title:'Leave the Gate',task:'Take a 10-minute walk or movement break.',xp:25,gold:20},
    {title:'Reach the Waystone',task:'Complete a workout or 20+ minutes of movement.',xp:40,gold:35},
    {title:'Mark the Map',task:'Visit a new place or take a genuinely new route.',xp:55,gold:50}
  ]}
]

const REALM_BOSSES = [
  {id:'procrastination-wyrm',name:'The Procrastination Wyrm',icon:'🐉',stat:'DIS',unlock:1,maxHp:500,desc:'A beast that grows stronger whenever Future You is left a problem.',reward:'+120 XP · +60 gold'},
  {id:'mirror-witch',name:'The Mirror Witch',icon:'🪞',stat:'RAD',unlock:5,maxHp:650,desc:'Defeat the voice that says you must be perfect before you can feel good.',reward:'+160 XP · +80 gold'},
  {id:'fog-doubt',name:'The Fog of Doubt',icon:'🌫️',stat:'SPI',unlock:10,maxHp:800,desc:'A misty boss guarding the Astral Sanctum.',reward:'+220 XP · +100 gold'}
]

const NPC_DIALOGUE = {
  'Mira the Healer': ['You do not need to earn rest. Rest is part of the adventure.','Take care of the hero carrying all these quests.'],
  'Tomas the Scholar': ['A page studied well is worth more than ten pages skimmed.','Return to the Archive with one question you genuinely want answered.'],
  'Pip the Trainer': ['Strength is built by showing up again, not by punishing yourself.','A ten-minute walk still counts as leaving the dungeon.'],
  'Elara the Tailor': ['Prepare Future You a little gift tonight: make tomorrow easier.','Your outfit is equipment too. Wear something that makes you feel like the main character.'],
  'Rowan the Gardener': ['Feed the hero, do not negotiate with hunger all day.','A colorful plate is a small garden on the road.'],
  'Nessa the Innkeeper': ['Every adventurer needs a tavern where they can pause.','Water first, then back to the road when you are ready.']
}


const EXTRA_ACHIEVEMENTS = {
  'chain-complete': {name:'Questkeeper',icon:'📜',desc:'Completed a full multi-step quest chain.'},
  'town-builder': {name:'Founder of the Keep',icon:'🏘️',desc:'Upgraded the Adventurer Guild.'},
  'realm-slayer': {name:'Realm Slayer',icon:'🐉',desc:'Defeated a world boss.'},
  'pathfinder': {name:'Pathfinder',icon:'🧭',desc:'Discovered a new place on the realm map.'}
}

const load = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem('life-rpg-'+key)) ?? fallback } catch { return fallback }
}

export default function App() {
  const [session,setSession]=useState(null)
  const [authLoading,setAuthLoading]=useState(true)
  const [cloudHydrated,setCloudHydrated]=useState(false)
  const applyingRemoteRef=useRef(false)
  const saveTimerRef=useRef(null)
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
  const [villagerQuests,setVillagerQuests] = useState(() => load('villager-quests', {date:'',active:[],completed:[]}))
  const [town,setTown] = useState(() => load('town', {level:1,xp:0,buildings:{guild:1,tavern:1,garden:0,library:0}}))
  const [questChains,setQuestChains] = useState(() => load('quest-chains', QUEST_CHAINS.map(c=>({...c,progress:0,completed:false}))))
  const [realmBosses,setRealmBosses] = useState(() => load('realm-bosses', REALM_BOSSES.map(b=>({...b,hp:b.maxHp,defeated:false}))))
  const [equipment,setEquipment] = useState(() => load('equipment', {owned:[],equipped:{weapon:null,armor:null,accessory:null}}))
  const [discoveries,setDiscoveries] = useState(() => load('discoveries', []))
  const [selectedNpc,setSelectedNpc] = useState(null)
  const [realmTime,setRealmTime] = useState(() => new Date())


  useEffect(()=>{
    let mounted=true
    supabase.auth.getSession().then(({data})=>{if(mounted){setSession(data.session);setAuthLoading(false)}}).catch(()=>mounted&&setAuthLoading(false))
    const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,next)=>{if(mounted){setSession(next);if(!next){setCloudHydrated(false);setAuthLoading(false)}}})
    return ()=>{mounted=false;subscription.unsubscribe()}
  },[])

  const applyCloudSave=(data)=>{
    if(!data||typeof data!=='object')return
    applyingRemoteRef.current=true
    if(data.quests)setQuests(data.quests)
    if(typeof data.xp==='number')setXp(data.xp)
    if(typeof data.gold==='number')setGold(data.gold)
    if(data.routine)setRoutine(data.routine)
    if(data.grades)setGrades(data.grades)
    if(data.module)setModule(data.module)
    if(data.boss)setBoss(data.boss)
    if(data.character)setCharacter(data.character)
    if(data.statBonus)setStatBonus(data.statBonus)
    if(data.workouts)setWorkouts(data.workouts)
    if(data.daily)setDaily(data.daily)
    if(data.achievements)setAchievements(data.achievements)
    if(data.companions)setCompanions(data.companions)
    if(data.inventory)setInventory(data.inventory)
    if(data.event)setEvent(data.event)
    if(data.villagerQuests)setVillagerQuests(data.villagerQuests)
    if(data.town)setTown(data.town)
    if(data.questChains)setQuestChains(data.questChains)
    if(data.realmBosses)setRealmBosses(data.realmBosses)
    if(data.equipment)setEquipment(data.equipment)
    if(data.discoveries)setDiscoveries(data.discoveries)
  }

  useEffect(()=>{
    if(!session)return
    let cancelled=false
    ;(async()=>{
      const {data,error}=await supabase.from('game_saves').select('data').eq('user_id',session.user.id).maybeSingle()
      if(cancelled)return
      if(error){console.error(error);setCloudHydrated(true);return}
      if(data?.data)applyCloudSave(data.data)
      setCloudHydrated(true)
    })()
    return ()=>{cancelled=true}
  },[session?.user?.id])

  const cloudData={version:2,quests,xp,gold,routine,grades,module,boss,character,statBonus,workouts,daily,achievements,companions,inventory,event,villagerQuests,town,questChains,realmBosses,equipment,discoveries}

  useEffect(()=>{
    if(!session||!cloudHydrated)return
    if(applyingRemoteRef.current){applyingRemoteRef.current=false;return}
    clearTimeout(saveTimerRef.current)
    saveTimerRef.current=setTimeout(async()=>{
      const {error}=await supabase.from('game_saves').upsert({user_id:session.user.id,data:cloudData,updated_at:new Date().toISOString()},{onConflict:'user_id'})
      if(error)console.error('Cloud save failed',error)
    },400)
    return ()=>clearTimeout(saveTimerRef.current)
  },[session?.user?.id,cloudHydrated,quests,xp,gold,routine,grades,module,boss,character,statBonus,workouts,daily,achievements,companions,inventory,event,villagerQuests,town,questChains,realmBosses,equipment,discoveries])

  useEffect(()=>{
    if(!session)return
    const channel=supabase.channel('life-rpg-'+session.user.id)
      .on('postgres_changes',{event:'UPDATE',schema:'public',table:'game_saves',filter:'user_id=eq.'+session.user.id},payload=>{
        if(payload.new?.data){applyCloudSave(payload.new.data);setCloudHydrated(true)}
      }).subscribe()
    return ()=>{supabase.removeChannel(channel)}
  },[session?.user?.id])

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
  useEffect(()=>localStorage.setItem('life-rpg-villager-quests',JSON.stringify(villagerQuests)),[villagerQuests])
  useEffect(()=>localStorage.setItem('life-rpg-town',JSON.stringify(town)),[town])
  useEffect(()=>localStorage.setItem('life-rpg-quest-chains',JSON.stringify(questChains)),[questChains])
  useEffect(()=>localStorage.setItem('life-rpg-realm-bosses',JSON.stringify(realmBosses)),[realmBosses])
  useEffect(()=>localStorage.setItem('life-rpg-equipment',JSON.stringify(equipment)),[equipment])
  useEffect(()=>localStorage.setItem('life-rpg-discoveries',JSON.stringify(discoveries)),[discoveries])
  useEffect(()=>{const timer=setInterval(()=>setRealmTime(new Date()),60000);return()=>clearInterval(timer)},[])
  useEffect(()=>{const d=new Date();const today=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;const last=load('routine-date',null);if(last!==today){setRoutine(xs=>xs.map(x=>({...x,done:false,xpAwarded:false})));localStorage.setItem('life-rpg-routine-date',JSON.stringify(today))}},[])
  useEffect(()=>{const d=new Date();const today=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;if(daily.date!==today)setDaily(x=>({...x,date:today,completed:[],bonusClaimed:false}))},[daily.date])
  useEffect(()=>{
    const d=new Date(); const currentDate=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
    if(event.date===currentDate)return
    const encounters=[
      {title:'A Fox in the Moonlight',body:'A clever fox watches you from the road. It seems to recognize an adventurer.',options:[{label:'Follow it',reward:{xp:50},message:'The fox leads you to a hidden XP cache! +50 XP'},{label:'Offer food',reward:{pet:'🦊 Moss the Fox'},message:'Moss the Fox has joined your party!'}]},
      {title:'The Wandering Merchant',body:'A traveling merchant opens a mysterious chest.',options:[{label:'Trade stories',reward:{gold:40},message:'The merchant rewards your courage. +40 gold'},{label:'Study the map',reward:{item:'🗺️ Map Fragment'},message:'You discovered a map fragment!'}]},
      {title:'A Hidden Training Ground',body:'You discover an old training circle beneath the trees.',options:[{label:'Train',reward:{xp:60},message:'Your training pays off. +60 XP'},{label:'Rest here',reward:{xp:25},message:'A peaceful rest restores your spirit. +25 XP'}]}
    ]
    const e=encounters[new Date().getDate()%encounters.length]
    setEvent({...e,date:currentDate,resolved:false})
  },[event.date])

  const level=Math.floor(xp/250)+1, levelXp=xp%250, progress=levelXp/250*100
  const gearBonus=useMemo(()=>Object.values(equipment.equipped||{}).reduce((out,id)=>{const item=EQUIPMENT_CATALOG.find(x=>x.id===id);if(item)Object.entries(item.bonus).forEach(([k,v])=>out[k]=(out[k]||0)+v);return out},{}) ,[equipment.equipped])
  const townBonus=useMemo(()=>({VIT:(town.buildings.garden||0),INT:(town.buildings.library||0),SPI:(town.buildings.tavern||0)-1,RAD:0,DIS:(town.buildings.guild||0)-1}),[town.buildings])
  const stats=useMemo(()=>[
    ['VIT',7+(statBonus.VIT||0)+(gearBonus.VIT||0)+(townBonus.VIT||0),'Vitality',Heart],['INT',12+(statBonus.INT||0)+(gearBonus.INT||0)+(townBonus.INT||0),'Intelligence',BookOpen],['SPI',9+(statBonus.SPI||0)+(gearBonus.SPI||0)+(townBonus.SPI||0),'Spirit',Sparkles],
    ['RAD',6+(statBonus.RAD||0)+(gearBonus.RAD||0)+(townBonus.RAD||0),'Radiance',Crown],['DIS',8+(statBonus.DIS||0)+(gearBonus.DIS||0)+(townBonus.DIS||0),'Discipline',Shield]
  ],[statBonus,gearBonus,townBonus])
  const timeHour=realmTime.getHours(); const isNight=timeHour<7||timeHour>=19; const timeLabel=isNight?'🌙 Nightfall':'☀️ Daylight';
  const companionGoldBonus=companions.includes('🦊 Moss the Fox')?5:0
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
  const VILLAGER_QUEST_POOLS=[
    {villager:'Mira the Healer',avatar:'🧝‍♀️',offset:0,type:'spirit',variants:[
      {request:'Take a 10-minute self-care break',detail:'Step away from your work, breathe, stretch, shower, journal, or simply rest.',xp:20,gold:30},
      {request:'Do 5 minutes of quiet breathing',detail:'Find a calm corner and give your mind five uninterrupted minutes.',xp:20,gold:30},
      {request:'Take a 10-minute screen break',detail:'Put your phone away, look outside, stretch, or simply sit somewhere peaceful.',xp:20,gold:30},
      {request:'Write down one thing you are proud of',detail:'A tiny reflection for the adventurer who is doing more than she realizes.',xp:20,gold:30}
    ]},
    {villager:'Tomas the Scholar',avatar:'📚',offset:1,type:'mind',variants:[
      {request:'Complete 30 flashcards',detail:'Give your memory a proper training session in the Grand Archive.',xp:30,gold:40},
      {request:'Review 10 missed questions',detail:'Return to ten questions you got wrong and explain why the right answer wins.',xp:30,gold:40},
      {request:'Recall 5 facts without notes',detail:'Close your notes and see what your brain can retrieve from memory.',xp:25,gold:35},
      {request:'Study one topic for 15 minutes',detail:'Pick one small target and give it your full attention.',xp:30,gold:40}
    ]},
    {villager:'Pip the Trainer',avatar:'🏃',offset:2,type:'body',variants:[
      {request:'Do 50 jumping jacks',detail:'A tiny burst of movement to wake up your adventurer.',xp:20,gold:25},
      {request:'Take a 10-minute walk',detail:'Stretch your legs and let your adventurer leave the study dungeon for a moment.',xp:25,gold:30},
      {request:'Do 10 squats + 10 wall push-ups',detail:'A quick bodyweight training round—no gym required.',xp:20,gold:25},
      {request:'Stretch for 8 minutes',detail:'Loosen up your shoulders, hips, back, or legs after sitting.',xp:20,gold:25}
    ]},
    {villager:'Elara the Tailor',avatar:'🧵',offset:3,type:'life',variants:[
      {request:'Lay out tomorrow’s outfit',detail:'Make tomorrow morning easier by choosing your clothes tonight.',xp:15,gold:20},
      {request:'Pack tomorrow’s school bag',detail:'Gather what you need now so Future You can leave with ease.',xp:15,gold:20},
      {request:'Clear one small surface',detail:'Restore one desk, nightstand, or corner of your keep.',xp:15,gold:20},
      {request:'Set up tomorrow’s first task',detail:'Open the notes, questions, or materials you want to start with tomorrow.',xp:15,gold:20}
    ]},
    {villager:'Rowan the Gardener',avatar:'🌿',offset:4,type:'body',variants:[
      {request:'Eat one fruit or vegetable',detail:'Visit the market, kitchen, dining hall, or wherever your next healthy bite awaits.',xp:15,gold:20},
      {request:'Add a protein to your next meal',detail:'Choose tofu, beans, lentils, Greek yogurt, or another protein you actually enjoy.',xp:20,gold:25},
      {request:'Make your next snack more nourishing',detail:'Pair something you want with a fruit, vegetable, or protein.',xp:20,gold:25},
      {request:'Drink water before your next meal',detail:'Fill your canteen and take a few good sips before you eat.',xp:15,gold:20}
    ]},
    {villager:'Nessa the Innkeeper',avatar:'🍵',offset:5,type:'body',variants:[
      {request:'Drink two full bottles of water',detail:'Refill your canteen twice and keep your adventurer fueled.',xp:20,gold:25},
      {request:'Take a 5-minute hydration pause',detail:'Fill your bottle, drink slowly, and give yourself a moment to reset.',xp:15,gold:20},
      {request:'Refill your water bottle',detail:'A tiny tavern chore that makes the rest of the day easier.',xp:15,gold:20},
      {request:'Drink a full glass of water now',detail:'No grand quest required. Just hydrate your adventurer in this moment.',xp:15,gold:20}
    ]}
  ]
  const daySeed=Number(todayKey.replaceAll('-',''))
  const VILLAGER_QUESTS=VILLAGER_QUEST_POOLS.map((pool,poolIndex)=>{
    const variant=pool.variants[(daySeed+pool.offset+poolIndex)%pool.variants.length]
    return {...variant,villager:pool.villager,avatar:pool.avatar,type:pool.type,id:pool.villager.toLowerCase().replace(/\\s+/g,'-')+'-'+(daySeed%1000)+'-'+(pool.offset+poolIndex)}
  })
  useEffect(()=>{if(villagerQuests.date!==todayKey)setVillagerQuests({date:todayKey,active:[],completed:[]})},[villagerQuests.date,todayKey])

  function notify(message){setToast(message);window.clearTimeout(window.__lifeToast);window.__lifeToast=window.setTimeout(()=>setToast(''),2600)}
  function unlockAchievement(id){setAchievements(a=>a.includes(id)?a:[...a,id])}
  function completeDaily(id){
    if(daily.completed.includes(id))return
    const q=dailyQuests.find(x=>x.id===id);if(!q)return
    const next=[...daily.completed,id]
    const d0=new Date();d0.setDate(d0.getDate()-1);const yesterday=`${d0.getFullYear()}-${String(d0.getMonth()+1).padStart(2,'0')}-${String(d0.getDate()).padStart(2,'0')}`
    const streak=daily.lastCompletedDate===todayKey?(daily.streak||0):daily.lastCompletedDate===yesterday?(daily.streak||0)+1:1
    setDaily(d=>({...d,completed:next,streak,lastCompletedDate:todayKey}))
    if(streak>=3)unlockAchievement('three-day-flame')
    if(streak>=7)unlockAchievement('week-warrior')
    setXp(v=>v+q.xp);setGold(g=>g+q.gold+companionGoldBonus)
    if(next.length===dailyQuests.length&&!daily.bonusClaimed){setDaily(d=>({...d,bonusClaimed:true}));setXp(v=>v+100);setGold(g=>g+50);unlockAchievement('main-character');notify('DAILY ADVENTURE COMPLETE! +100 bonus XP · +50 gold')}
    else notify(`${q.title} complete! +${q.xp} XP · +${q.gold} gold · ${streak}-day streak`)
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
  function acceptVillagerQuest(id){
    if(villagerQuests.active.includes(id)||villagerQuests.completed.includes(id))return
    if(villagerQuests.active.length>=3){notify('Your quest log can hold 3 villager quests at once.');return}
    setVillagerQuests(v=>({...v,active:[...v.active,id]}));notify('Quest accepted! A villager is counting on you.')
  }
  function completeVillagerQuest(id){
    if(!villagerQuests.active.includes(id)||villagerQuests.completed.includes(id))return
    const q=VILLAGER_QUESTS.find(x=>x.id===id);if(!q)return
    setVillagerQuests(v=>({...v,active:v.active.filter(x=>x!==id),completed:[...v.completed,id]}))
    setXp(v=>v+q.xp);setGold(g=>g+q.gold);notify(`${q.villager} thanks you! +${q.xp} XP · +${q.gold} gold`)
  }

  function completeChainStep(chainId){
    const chain=questChains.find(c=>c.id===chainId); if(!chain||chain.completed)return
    const step=chain.steps[chain.progress]; if(!step)return
    const nextProgress=chain.progress+1; const finished=nextProgress>=chain.steps.length
    setQuestChains(xs=>xs.map(c=>c.id===chainId?{...c,progress:nextProgress,completed:finished}:c))
    setXp(v=>v+step.xp+(finished?75:0)); setGold(g=>g+step.gold+(finished?50:0)+companionGoldBonus)
    if(finished){setTown(t=>({...t,xp:t.xp+100}));unlockAchievement('chain-complete');notify('QUEST CHAIN COMPLETE! The realm remembers your deeds. +75 bonus XP')}
    else notify('Quest step complete! '+step.title+' · +'+step.xp+' XP')
  }
  function upgradeTown(building){
    const names={guild:'Adventurer Guild',tavern:'Moonlit Tavern',garden:'Healing Garden',library:'Grand Library'}
    const current=town.buildings[building]||0; const cost=100+(current*75)
    if(gold<cost){notify('You need '+cost+' gold to upgrade the '+names[building]+'.');return}
    setGold(g=>g-cost); setTown(t=>({...t,level:Math.max(t.level, current+2),xp:t.xp+cost,buildings:{...t.buildings,[building]:current+1}}))
    if(building==='guild'&&current===0)unlockAchievement('town-builder')
    notify(names[building]+' upgraded! The town grows around you.')
  }
  function strikeRealmBoss(id){
    const boss=realmBosses.find(b=>b.id===id); if(!boss||boss.defeated)return
    if(level<boss.unlock){notify('This boss awakens at level '+boss.unlock+'.');return}
    const statValue=stats.find(s=>s[0]===boss.stat)?.[1]||1
    const damage=Math.max(25,Math.round(statValue*8))
    const hp=Math.max(0,boss.hp-damage); const defeated=hp===0
    setRealmBosses(xs=>xs.map(b=>b.id===id?{...b,hp,defeated}:b))
    if(defeated){const reward=REALM_BOSSES.find(b=>b.id===id);setXp(v=>v+120+(boss.unlock*20));setGold(g=>g+60+(boss.unlock*10)+companionGoldBonus);unlockAchievement('realm-slayer');notify(boss.name+' defeated! '+reward.reward)}
    else notify(boss.name+' takes '+damage+' damage.')
  }
  function buyEquipment(item){
    if(equipment.owned.includes(item.id)){notify('You already own the '+item.name+'.');return}
    if(gold<item.cost){notify('Not enough gold for '+item.name+'.');return}
    setGold(g=>g-item.cost);setEquipment(e=>({...e,owned:[...e.owned,item.id]}));notify(item.name+' added to your armory.')
  }
  function equipItem(item){
    if(!equipment.owned.includes(item.id))return
    setEquipment(e=>({...e,equipped:{...e.equipped,[item.slot]:e.equipped[item.slot]===item.id?null:item.id}}))
    notify(item.name+(equipment.equipped[item.slot]===item.id?' unequipped.':' equipped!'))
  }
  function discoverRealm(id){
    if(discoveries.includes(id))return
    setDiscoveries(d=>[...d,id]);setXp(v=>v+35);setGold(g=>g+15+companionGoldBonus);unlockAchievement('pathfinder');notify('NEW DISCOVERY! +35 XP · +15 gold')
  }
  function talkToNpc(name){
    const lines=NPC_DIALOGUE[name]||[];setSelectedNpc({name,line:lines[(new Date().getDate()+name.length)%lines.length]})
  }

  function finishQuest(id){
    const q=quests.find(x=>x.id===id); if(!q||q.done)return
    setQuests(xs=>xs.map(x=>x.id===id?{...x,done:true}:x)); setXp(x=>x+q.xp); setGold(g=>g+q.gold+companionGoldBonus)
    notify(`Quest complete! +${q.xp} XP · +${q.gold} gold`)
  }
  function addQuest(e){
    e.preventDefault(); if(!newQuest.trim())return
    setQuests(xs=>[...xs,{id:Date.now(),title:newQuest.trim(),subtitle:'Custom quest from your adventurer’s journal',xp:25,gold:5,type:'custom',stat:'DIS',done:false}])
    setNewQuest('');setShowQuest(false);notify('New quest added to your journal.')
  }
  function toggleRoutine(id){const item=routine.find(x=>x.id===id);if(!item||item.active===false)return;const next=!item.done;setRoutine(xs=>xs.map(x=>x.id===id?{...x,done:next,xpAwarded:next?true:false}:x));if(next&&!item.xpAwarded){setXp(v=>v+(item.xp||20));setGold(g=>g+companionGoldBonus);notify(`Ritual complete! +${item.xp||20} XP · ${item.stat||'DIS'} strengthened`)}}
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
      setXp(v=>v+50);setGold(g=>g+15);setStatBonus(s=>({...s,VIT:(s.VIT||0)+gain}));unlockAchievement('pr-hunter')
      notify('NEW PR! '+ex.name+' at '+weight+' lb · +50 XP · +15 gold · VIT +'+gain)
    }else notify(ex.name+' logged at '+weight+' lb. Keep building.')
  }
  function addExercise(e){e.preventDefault();if(!workoutDraft.name.trim())return;setWorkouts(xs=>xs.map(w=>w.id===activeWorkout?{...w,exercises:[...w.exercises,{id:Date.now(),name:workoutDraft.name.trim(),sets:Number(workoutDraft.sets)||3,reps:Number(workoutDraft.reps)||10,weight:Number(workoutDraft.weight)||0,best:Number(workoutDraft.weight)||0}]}:w));setWorkoutDraft({name:'',sets:3,reps:10,weight:0});setShowWorkoutForm(false);notify('Exercise added to the split.')}
  function deleteExercise(workoutId,exerciseId){setWorkouts(xs=>xs.map(w=>w.id===workoutId?{...w,exercises:w.exercises.filter(e=>e.id!==exerciseId)}:w));notify('Exercise removed from the split.')}
  function buyReward(r){
    if(gold<r.cost){notify('Not enough gold yet — keep adventuring!');return}
    setGold(g=>g-r.cost);notify(`${r.name} added to your real-life reward log.`)
  }

  const nav=[
    ['dashboard','Camp',Sword],['quests','Quests',ScrollText],['planner','Routine',CalendarDays],['realm','Realm',Crown],
    ['study','Grand Archive',GraduationCap],['body','Verdant Wilds',Dumbbell],
    ['map','World Map',Map],['character','Character',UserRound],['inventory','Rewards',Backpack]
  ]

  if(authLoading)return <AuthLoadingScreen />
  if(!session)return <AuthScreen />
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
        <div className="top-actions"><div className="cloud-status"><Cloud size={13}/> <span>Cloud save</span></div><div className="currency">◈ <b>{gold}</b></div><div className="level-pill"><span>LVL</span><b>{level}</b></div><button className="signout-button" onClick={()=>supabase.auth.signOut()} title="Sign out"><LogOut size={14}/></button></div>
      </header>

      {active==='dashboard'&&<Dashboard quests={quests} stats={stats} xp={xp} progress={progress} completed={completed} finishQuest={finishQuest} setShowQuest={setShowQuest} worlds={WORLDS} setActive={setActive} character={character} dailyQuests={dailyQuests} daily={daily} dailyDone={dailyDone} completeDaily={completeDaily} event={event} resolveEvent={resolveEvent}/>}
      {active==='quests'&&<QuestPage quests={quests} finishQuest={finishQuest} setShowQuest={setShowQuest} villagerQuests={villagerQuests} villagerQuestList={VILLAGER_QUESTS} acceptVillagerQuest={acceptVillagerQuest} completeVillagerQuest={completeVillagerQuest}/>}
      {active==='planner'&&<RoutinePage routine={routine} toggleRoutine={toggleRoutine} openRoutineEditor={openRoutineEditor} openRoutineCreator={openRoutineCreator}/>}
      {active==='study'&&<StudyPage grades={grades} newGrade={newGrade} setNewGrade={setNewGrade} addGrade={addGrade} openGradeEditor={openGradeEditor} module={module} setModule={setModule} topicDraft={topicDraft} setTopicDraft={setTopicDraft} addTopic={addTopic} editingTopic={editingTopic} setEditingTopic={setEditingTopic} saveTopic={saveTopic} deleteTopic={deleteTopic} boss={boss} prepareBoss={prepareBoss} attemptBoss={attemptBoss}/>}
      {active==='body'&&<BodyPage workouts={workouts} activeWorkout={activeWorkout} setActiveWorkout={setActiveWorkout} updateExercise={updateExercise} logWorkout={logWorkout} showWorkoutForm={showWorkoutForm} setShowWorkoutForm={setShowWorkoutForm} workoutDraft={workoutDraft} setWorkoutDraft={setWorkoutDraft} addExercise={addExercise} deleteExercise={deleteExercise} setActive={setActive}/>} 
      {active==='map'&&<MapPage worlds={WORLDS} setActive={setActive} level={level}/>}
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
    <Quick icon={Flame} title="Adventure Streak" value={(daily.streak||0)+' days'} onClick={()=>setActive('inventory')}/>
  </section>

  <section className="section-head"><div><span className="eyebrow">TODAY'S JOURNAL</span><h2>Active quests</h2></div><button className="ghost" onClick={()=>setShowQuest(true)}>+ New Quest</button></section>
  <div className="quest-list">{quests.map(q=><Quest key={q.id} q={q} finishQuest={finishQuest}/>)}</div>

  <section className="lower-grid"><div className="panel stats-panel"><div className="card-heading"><span>CHARACTER STATS</span><Sparkles size={16}/></div>{stats.map(([label,value,name,Icon])=><div className="stat-line" key={label}><Icon size={16}/><b>{label}</b><span>{name}</span><strong>{value}</strong></div>)}</div>
  <div className="panel progress-panel"><div className="card-heading"><span>ADVENTURE LOG</span><Flame size={16}/></div><div className="streak"><span className="streak-number">{daily.streak||0}</span><div><b>day streak</b><span>{daily.completed.length?'The flame is alive today.':'Complete a daily quest to light the flame.'}</span></div><Flame size={30}/></div><div className="week">{['M','T','W','T','F','S','S'].map((d,i)=><div key={i} className={i<4?'done-day':''}><span>{d}</span><i>{i<4?'✓':'·'}</i></div>)}</div><div className="reward-note"><Trophy size={16}/><span><b>{completed}</b> quests completed today. Complete 2 more for the Explorer’s Bonus.</span></div></div></section>

  <section className="section-head world-head"><div><span className="eyebrow">THE REALM</span><h2>Choose your path</h2></div><button className="ghost" onClick={()=>setActive('map')}>Open Map <Map size={14}/></button></section>
  <div className="world-grid">{worlds.slice(0,3).map(w=><WorldCard key={w.id} world={w} onClick={()=>setActive(w.id==='body'?'body':w.id==='study'?'study':'planner')}/>)}</div>
 </div>
}

function AuthLoadingScreen(){return <div className="auth-screen"><div className="auth-card panel"><div className="brand-mark">✦</div><span className="eyebrow">THE REALM AWAKENS</span><h1>Loading your adventure…</h1><p>Checking your cloud save.</p></div></div>}
function AuthScreen(){
 const [mode,setMode]=useState('signin'),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[busy,setBusy]=useState(false),[message,setMessage]=useState('')
 const submit=async e=>{e.preventDefault();setBusy(true);setMessage('');try{const r=mode==='signin'?await supabase.auth.signInWithPassword({email:email.trim(),password}):await supabase.auth.signUp({email:email.trim(),password,options:{emailRedirectTo:window.location.origin}});if(r.error)setMessage(r.error.message);else if(mode==='signup'&&!r.data.session)setMessage('Account created. Check your email to confirm your account, then return here and sign in.');}catch(err){setMessage(err?.message||'Something went wrong. Please try again.')}finally{setBusy(false)}}
 return <div className="auth-screen"><div className="auth-card panel"><div className="auth-brand"><div className="brand-mark">✦</div><div><strong>Life RPG</strong><span>YOUR ADVENTURE</span></div></div><span className="eyebrow">{mode==='signin'?'WELCOME BACK, ADVENTURER':'BEGIN YOUR ADVENTURE'}</span><h1>{mode==='signin'?'Continue your quest':'Create your account'}</h1><p>Your save follows you between your phone, laptop, and browsers.</p><form onSubmit={submit}><label>Email<input type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} required/></label><label>Password<input type="password" autoComplete={mode==='signin'?'current-password':'new-password'} minLength="6" value={password} onChange={e=>setPassword(e.target.value)} required/></label>{message&&<div className="auth-message">{message}</div>}<button className="primary auth-submit" disabled={busy}>{busy?'Entering the realm…':mode==='signin'?'Enter the Realm':'Create Account'} <Sword size={16}/></button></form><button className="ghost auth-switch" onClick={()=>{setMode(mode==='signin'?'signup':'signin');setMessage('')}}>{mode==='signin'?'New adventurer? Create an account':'Already have an account? Sign in'}</button></div></div>
}

function Quick({icon:Icon,title,value,onClick}){return <button className="quick-card panel" onClick={onClick}><Icon size={19}/><span><b>{title}</b><small>{value}</small></span><ChevronRight size={15}/></button>}

function Quest({q,finishQuest}){const Icon=q.type==='body'?Heart:q.type==='mind'?BookOpen:q.type==='spirit'?Sparkles:ScrollText;return <div className={'quest-row '+(q.done?'done':'')}><button className="check" onClick={()=>finishQuest(q.id)}>{q.done?<Check size={17}/>:''}</button><div className="quest-icon"><Icon size={18}/></div><div className="quest-info"><b>{q.title}</b><span>{q.subtitle}</span></div><div className="quest-reward"><b>+{q.xp} XP</b><span>◈ {q.gold}</span></div><span className="quest-type">{q.type}</span></div>}

function QuestPage({quests,finishQuest,setShowQuest,villagerQuests,villagerQuestList,acceptVillagerQuest,completeVillagerQuest}){
 const active=villagerQuestList.filter(q=>villagerQuests.active.includes(q.id));
 return <div className="content"><PageIntro eyebrow="ADVENTURER'S JOURNAL" title="All quests" text="Turn the things you already want to do into tiny victories." action="+ New Quest" onAction={()=>setShowQuest(true)}/>
  <section className="villager-section"><div className="section-head"><div><span className="eyebrow">QUESTS FROM THE REALM</span><h2>Help the villagers</h2></div><span className="muted">Choose up to 3 at once</span></div>
   {active.length>0&&<div className="villager-active"><div className="villager-active-title">🛡️ ACTIVE VILLAGER QUESTS</div>{active.map(q=><VillagerQuestCard key={q.id} q={q} state="active" onClick={()=>completeVillagerQuest(q.id)}/>)}</div>}
   <div className="villager-grid">{villagerQuestList.map(q=><VillagerQuestCard key={q.id} q={q} state={villagerQuests.completed.includes(q.id)?'completed':villagerQuests.active.includes(q.id)?'active':'available'} onClick={()=>q&&acceptVillagerQuest(q.id)}/>)}</div>
  </section>
  <div className="section-head"><div><span className="eyebrow">ADVENTURER'S JOURNAL</span><h2>My quests</h2></div></div><div className="quest-list full">{quests.map(q=><Quest key={q.id} q={q} finishQuest={finishQuest}/>)}</div>
 </div>
}

function VillagerQuestCard({q,state,onClick}){const buttonText=state==='available'?'Accept Quest':state==='active'?'Mark Complete':'Helped Today ✓';return <div className={'villager-card panel '+state}><div className="villager-avatar">{q.avatar}</div><div className="villager-copy"><b>{q.villager}</b><strong>{q.request}</strong><small>{q.detail}</small></div><div className="villager-reward"><b>+{q.gold} ◈</b><span>+{q.xp} XP</span><button className={state==='available'?'primary':'ghost'} disabled={state!=='available'&&state!=='active'} onClick={onClick}>{buttonText}</button></div></div>}

function RoutinePage({routine,toggleRoutine,openRoutineEditor,openRoutineCreator}){const day=new Date().getDay();const due=routine.filter(x=>x.active!==false&&((x.repeat||'daily')==='daily'||((x.repeat||'daily')==='weekdays'&&day>=1&&day<=5)||((x.repeat||'daily')==='weekends'&&(day===0||day===6))));const active=routine.filter(x=>x.active!==false);const done=active.filter(x=>x.done).length;return <div className="content"><PageIntro eyebrow="ADVENTURER'S KEEP" title="Today's routine" text="Your real-life schedule becomes a questline." action="+ Add Ritual" onAction={openRoutineCreator}/><div className="routine-summary panel"><div><span className="eyebrow">DAILY PROGRESS</span><strong>{done}/{active.length}</strong><span>rituals completed · completion grants XP</span></div><div className="xp-bar"><i style={{width:(active.length?done/active.length*100:0)+'%'}}/></div></div><div className="routine-list">{routine.map(item=><div className={'routine-row panel '+(item.done?'done ':'')+(item.active===false?'inactive':'')} key={item.id}><button className="routine-main" onClick={()=>toggleRoutine(item.id)}><span className="routine-time">{item.time}</span><span className="routine-check">{item.done?<Check size={15}/>:''}</span><span className="routine-title"><b>{item.title}</b><small>{item.repeat||'daily'} · +{item.xp||20} XP · {item.stat||'DIS'}</small></span></button><button className="row-edit" onClick={()=>openRoutineEditor(item)}>Edit</button></div>)}</div></div>}

function StudyPage({grades,newGrade,setNewGrade,addGrade,openGradeEditor,module,setModule,topicDraft,setTopicDraft,addTopic,editingTopic,setEditingTopic,saveTopic,deleteTopic,boss,prepareBoss,attemptBoss}){const avg=module.topics.length?Math.round(module.topics.reduce((a,t)=>a+t.score,0)/module.topics.length):0;const weak=[...module.topics].sort((a,b)=>a.score-b.score).slice(0,3);return <div className="content"><PageIntro eyebrow="GRAND ARCHIVE" title="Medical school command center" text="Quizzes become evidence, weak topics become study quests, and exams become boss battles."/><div className="module-header panel"><div><span className="eyebrow">CURRENT MODULE</span><input className="module-name" value={module.name} onChange={e=>setModule({...module,name:e.target.value})}/></div><label>Exam date<input type="date" value={module.examDate} onChange={e=>setModule({...module,examDate:e.target.value})}/></label></div><div className="study-grid"><div className="panel mastery"><span className="eyebrow">MODULE MASTERY</span><strong>{avg}%</strong><div className="xp-bar"><i style={{width:avg+'%'}}/></div><p>{weak.length?'Weakest target: '+weak[0].name:'Add topics to build your map.'}</p><button className="primary" onClick={prepareBoss}>{boss.active&&!boss.defeated?'Boss Battle Ready':'Prepare for Boss Battle'} <Sword size={15}/></button></div><div className="panel grade-form"><span className="eyebrow">RECORD A QUIZ</span><form onSubmit={addGrade}><input placeholder="Quiz name" value={newGrade.quiz} onChange={e=>setNewGrade({...newGrade,quiz:e.target.value})}/><input type="number" min="0" max="100" placeholder="Score %" value={newGrade.score} onChange={e=>setNewGrade({...newGrade,score:e.target.value})}/><button className="primary">Record Score <Plus size={15}/></button></form></div></div>{boss.active&&<div className={'boss-panel panel '+(boss.defeated?'defeated':'')}><div><span className="eyebrow">MODULE BOSS · ATTEMPT {boss.attempts}</span><h3>{boss.defeated?'✦ KNOWLEDGE WARDEN DEFEATED':'👹 THE KNOWLEDGE WARDEN'}</h3><p>{boss.defeated?'Module cleared! Your final strike shattered the Warden.':'85%+ = critical hit · 70–84% = strong hit · below 70% = glancing blow'}</p>{!boss.defeated&&<div className="boss-hp"><span>HP {boss.hp??1000} / 1000</span><div><i style={{width:((boss.hp??1000)/10)+'%'}}/></div></div>}</div>{!boss.defeated&&<button className="primary" onClick={attemptBoss}>Face Boss <Sword size={15}/></button>}</div>}<div className="archive-section"><div className="section-head"><div><span className="eyebrow">WEAK TOPICS</span><h2>Study targets</h2></div></div><div className="topic-grid">{module.topics.map(t=><div className="topic-row panel" key={t.id}><span><b>{t.name}</b><small>{t.score<80?'Needs another pass':'Ready for review'}</small></span><strong className={t.score>=85?'great':t.score>=70?'warning':'needs'}>{t.score}%</strong><button className="row-edit" onClick={()=>{setEditingTopic(t.id);setTopicDraft({name:t.name,score:String(t.score)})}}>Edit</button></div>)}</div><form className="topic-form panel" onSubmit={editingTopic?saveTopic:addTopic}><input placeholder="Topic name" value={topicDraft.name} onChange={e=>setTopicDraft({...topicDraft,name:e.target.value})}/><input type="number" min="0" max="100" placeholder="Mastery %" value={topicDraft.score} onChange={e=>setTopicDraft({...topicDraft,score:e.target.value})}/><button className="primary">{editingTopic?'Save Topic':'Add Topic'} <Plus size={15}/></button>{editingTopic&&<button type="button" className="ghost" onClick={()=>{setEditingTopic(null);setTopicDraft({name:'',score:''})}}>Cancel</button>}</form></div><div className="archive-section"><div className="section-head"><div><span className="eyebrow">QUIZ HISTORY</span><h2>Recorded battles</h2></div></div><div className="grade-list">{grades.map(g=><div className="grade-row panel" key={g.id}><BookOpen size={17}/><span>{g.quiz}<small>{g.module}</small></span><strong className={g.score>=85?'great':g.score>=70?'warning':'needs'}>{g.score}%</strong><button className="row-edit" onClick={()=>openGradeEditor(g)}>Edit</button></div>)}</div></div></div>}

function BodyPage({workouts,activeWorkout,setActiveWorkout,updateExercise,logWorkout,showWorkoutForm,setShowWorkoutForm,workoutDraft,setWorkoutDraft,addExercise,deleteExercise,setActive}){
 const workout=workouts.find(w=>w.id===activeWorkout)||workouts[0]
 return <div className="content"><PageIntro eyebrow="VERDANT WILDS" title="Body & vitality" text="Your training ground. Track your splits, working weights, and strength PRs."/><div className="body-grid"><BodyCard icon={Footprints} title="Movement" value="20+ min quest" text="Log a walk or run" onClick={()=>setActive('quests')}/><BodyCard icon={Dumbbell} title="Training" value={workouts.length+' splits'} text="Open your workout book below" onClick={()=>document.querySelector('.workout-book')?.scrollIntoView({behavior:'smooth'})}/><BodyCard icon={Heart} title="Nourishment" value="Protein quest" text="Complete today's balanced-meal quest" onClick={()=>setActive('quests')}/><BodyCard icon={Moon} title="Recovery" value="Tonight" text="Protect your sleep" onClick={()=>setActive('planner')}/></div><section className="workout-book"><div className="section-head"><div><span className="eyebrow">TRAINING GROUNDS</span><h2>Workout splits</h2></div><span className="muted">A PR earns bonus XP</span></div><div className="split-tabs">{workouts.map(w=><button key={w.id} className={w.id===activeWorkout?'active':''} onClick={()=>setActiveWorkout(w.id)}><span>{w.icon}</span>{w.name}</button>)}</div><div className="panel workout-panel"><div className="workout-heading"><div><span className="eyebrow">TODAY'S SPLIT</span><h3>{workout?.name}</h3></div><button className="primary" onClick={()=>setShowWorkoutForm(true)}>+ Add Exercise</button></div><div className="exercise-list">{workout?.exercises.map(ex=><div className="exercise-row" key={ex.id}><div className="exercise-name"><b>{ex.name}</b><small>{ex.sets} sets × {ex.reps} reps · Best {ex.best} lb</small></div><label>Weight (lb)<input type="number" min="0" step="2.5" value={ex.weight} onChange={e=>updateExercise(workout.id,ex.id,'weight',e.target.value)}/></label><button className="primary log-set" onClick={()=>logWorkout(workout.id,ex.id)}>{Number(ex.weight)>Number(ex.best||0)?'Set PR!':'Log Set'}</button><button className="exercise-delete" onClick={()=>deleteExercise(workout.id,ex.id)}><X size={14}/></button></div>)}</div><div className="pr-note"><Trophy size={16}/><span><b>Strength rule:</b> enter the weight you actually used, then log the set. If it beats your previous best, you earn <b>+50 XP +15 gold</b> and VIT grows.</span></div></div></section>{showWorkoutForm&&<div className="modal-backdrop" onClick={()=>setShowWorkoutForm(false)}><div className="modal" onClick={e=>e.stopPropagation()}><button className="close" onClick={()=>setShowWorkoutForm(false)}><X/></button><span className="eyebrow">NEW EXERCISE</span><h2>Add to {workout?.name}</h2><form onSubmit={addExercise}><label>Exercise<input autoFocus value={workoutDraft.name} onChange={e=>setWorkoutDraft({...workoutDraft,name:e.target.value})} placeholder="e.g. Bulgarian split squat"/></label><div className="edit-grid"><label>Sets<input type="number" min="1" value={workoutDraft.sets} onChange={e=>setWorkoutDraft({...workoutDraft,sets:e.target.value})}/></label><label>Reps<input type="number" min="1" value={workoutDraft.reps} onChange={e=>setWorkoutDraft({...workoutDraft,reps:e.target.value})}/></label><label>Starting weight<input type="number" min="0" step="2.5" value={workoutDraft.weight} onChange={e=>setWorkoutDraft({...workoutDraft,weight:e.target.value})}/></label></div><button className="primary" type="submit">Add Exercise <Plus size={15}/></button></form></div></div>}<div className="gentle-note panel"><Sparkles size={18}/><span><b>The rule of the Verdant Wilds:</b> progress comes from repeatable behaviors. A normal fluctuation in weight never costs XP.</span></div></div>
}
function BodyCard({icon:Icon,title,value,text,onClick}){return <button className="body-card panel" onClick={onClick}><Icon size={24}/><span className="eyebrow">{title}</span><strong>{value}</strong><small>{text}</small><ChevronRight size={15}/></button>}

function MapPage({worlds,setActive,level}){
 const destinations={body:'body',study:'study',life:'planner',glow:'dashboard',spirit:'dashboard',explore:'dashboard'}
 return <div className="content">
  <PageIntro eyebrow="WORLD MAP" title="The Realm of Becoming" text="Choose a destination, adventurer. Click a region on the map to travel there."/>
  <div className="realm-map-wrap panel">
   <div className="map-compass">✦<span>N</span></div>
   <div className="map-title">THE REALM OF BECOMING</div>
   <div className="map-level">HERO LEVEL {level}</div>
   <div className="map-path path-one"/>
   <div className="map-path path-two"/>
   <div className="map-path path-three"/>
   <div className="map-mountain mountain-one">⌃⌃⌃</div>
   <div className="map-mountain mountain-two">⌃⌃⌃⌃</div>
   <div className="map-forest forest-one">♠♠<br/>♠♠</div>
   <div className="map-forest forest-two">♠♠♠<br/>♠♠</div>
   <div className="map-water water-one"/>
   <div className="map-lake">≈≈≈<br/>≈≈≈</div>
   <div className="map-ruins">▥<br/><span>RUINS</span></div>
   <div className="map-camp">⌂<span>YOUR CAMP</span></div>
   {worlds.map(w=>{
    const unlocked=level>=(w.unlockLevel||1)
    return <button
      key={w.id}
      className={'map-zone map-zone-'+w.id+(unlocked?'':' locked')}
      disabled={!unlocked}
      onClick={()=>unlocked&&setActive(destinations[w.id]||'dashboard')}
      title={unlocked?w.desc:'Unlock at level '+w.unlockLevel}
    >
      <span className="map-zone-icon">{w.id==='body'?'🌲':w.id==='study'?'📚':w.id==='spirit'?'🔮':w.id==='glow'?'✨':w.id==='life'?'🏰':'🧭'}</span>
      <strong>{unlocked?'': '🔒 '}{w.name}</strong>
      <small>{unlocked?w.desc:'Level '+w.unlockLevel}</small>
    </button>
   })}
   <div className="map-legend"><span><i className="legend-dot unlocked-dot"/>Unlocked</span><span><i className="legend-dot locked-dot"/>Locked</span><span>Click a region to travel</span></div>
  </div>
  <div className="map-tip panel"><Compass size={17}/><span><b>Traveler's note:</b> The shortcuts on your Camp remain the fastest route. The World Map is for exploring the realm.</span></div>
 </div>
}

function WorldCard({world,onClick,large=false,locked=false}){const Icon=world.icon;return <button className={'world-card panel '+(large?'large ':'')+(locked?'locked':'')} onClick={onClick} disabled={locked}><div className="world-art"><Icon size={large?38:28}/><span>{world.stat}</span></div><div><h3>{locked?'🔒 ':''}{world.name}</h3><p>{locked?'Unlock at level '+world.unlockLevel:world.desc}</p></div><span className="circle-btn">{locked?'🔒':<ChevronRight size={17}/>}</span></button>}

function CharacterPage({character,level,xp,stats,openCharacterEditor}){return <div className="content"><div className="character-sheet panel"><div className="sheet-avatar">{character.avatar}</div><div className="sheet-main"><span className="eyebrow">CHARACTER SHEET</span><h2>{character.name}</h2><span className="class-name">{character.className.toUpperCase()} · {character.race.toUpperCase()}</span><p>Your real-life actions shape your adventurer. PRs, quests, study wins, and routines build the stats behind the avatar.</p><div className="sheet-level"><b>Level {level}</b><div className="xp-bar"><i style={{width:(xp%250)/250*100+'%'}}/></div><span>{xp%250} / 250 XP</span></div><button className="ghost character-edit" onClick={openCharacterEditor}>Edit Character</button></div></div><div className="stat-cards">{stats.map(([label,value,name,Icon])=><div className="panel stat-card" key={label}><Icon/><span>{label}</span><strong>{value}</strong><small>{name}</small></div>)}</div><div className="panel character-rules"><span className="eyebrow">HOW YOUR HERO GROWS</span><div><b>VIT</b> workouts + strength PRs</div><div><b>INT</b> quizzes + focused study</div><div><b>SPI</b> journaling + recovery</div><div><b>DIS</b> routines completed</div><div><b>RAD</b> glow-up quests</div></div></div>}
function InventoryPage({gold,rewards,buyReward,rollMysteryChest,companions,inventory,achievements}){const earned=achievements.map(id=>ACHIEVEMENT_INFO[id]||EXTRA_ACHIEVEMENTS[id]).filter(Boolean);return <div className="content"><PageIntro eyebrow="ADVENTURER'S GUILD" title="Rewards & treasures" text="Gold buys real-life rewards. Mystery treasures, companions, and achievements make the journey fun."/><div className="reward-grid">{rewards.map(r=><div className="panel reward-card" key={r.name}><span className="reward-icon">{r.icon}</span><h3>{r.name}</h3><span>◈ {r.cost} gold</span><button className="primary" disabled={gold<r.cost} onClick={()=>buyReward(r)}>{gold<r.cost?'Need more gold':'Claim reward'}</button></div>)}<div className="panel reward-card mystery-card"><span className="reward-icon">🎁</span><h3>Mystery Chest</h3><span>◈ 100 gold</span><button className="primary" disabled={gold<100} onClick={rollMysteryChest}>Open Chest</button></div></div><section className="treasure-section"><div className="section-head"><div><span className="eyebrow">COLLECTION</span><h2>Your treasures</h2></div></div><div className="collection-grid"><div className="panel collection-card"><b>🐾 Companions</b><strong>{companions.length}</strong><small>{companions.length?companions.join(' · '):'No companion yet.'}</small></div><div className="panel collection-card"><b>🎒 Items</b><strong>{inventory.length}</strong><small>{inventory.length?inventory.join(' · '):'Your inventory is waiting.'}</small></div><div className="panel collection-card achievements-card"><b>🏆 Achievements</b><strong>{earned.length}/{Object.keys({...ACHIEVEMENT_INFO,...EXTRA_ACHIEVEMENTS}).length}</strong><div className="achievement-list">{Object.entries({...ACHIEVEMENT_INFO,...EXTRA_ACHIEVEMENTS}).map(([id,a])=><span key={id} className={achievements.includes(id)?'earned':'locked'}>{a.icon} <b>{a.name}</b><small>{achievements.includes(id)?a.desc:'Locked achievement'}</small></span>)}</div></div></div></section></div>}


function RealmPage({level,timeLabel,isNight,town,upgradeTown,questChains,completeChainStep,realmBosses,strikeRealmBoss,equipment,equipmentCatalog,buyEquipment,equipItem,companions,discoveries,discoverRealm,talkToNpc,setActive,selectedNpc,setSelectedNpc}){
 const buildings=[['guild','🏛️','Adventurer Guild','Unlocks new quests & Discipline'],['tavern','🍵','Moonlit Tavern','Rest, dialogue & Spirit'],['garden','🌿','Healing Garden','Vitality training'],['library','📚','Grand Library','Intelligence training']]
 const npcs=Object.keys(NPC_DIALOGUE)
 const places=[['moonwell','💧','Moonwell','A quiet place to reset'],['old-bridge','🌉','Old Bridge','Take a new route'],['starlit-grove','🌌','Starlit Grove','A hidden reflection spot'],['market-square','🏮','Market Square','Browse the realm']]
 return <div className="content realm-page">
  <PageIntro eyebrow="THE LIVING REALM" title="Town & Guild" text="This is your home base. Build it, meet its people, follow quest chains, gear up, and hunt the bosses beyond the walls."/>
  <div className={'realm-banner panel '+(isNight?'night':'')}><div><span className="eyebrow">{timeLabel}</span><h2>Adventurer's Keep · Level {town.level}</h2><p>The realm changes with you. Your town, companions, equipment, discoveries, and victories all persist in your save.</p></div><div className="realm-level">HERO LVL <b>{level}</b></div></div>
  <section><div className="section-head"><div><span className="eyebrow">YOUR TOWN</span><h2>Build the Keep</h2></div><span className="muted">Upgrades permanently improve your hero</span></div><div className="town-grid">{buildings.map(([id,icon,name,desc])=>{const lvl=town.buildings[id]||0;const cost=100+lvl*75;return <div className="town-building panel" key={id}><div className="town-icon">{icon}</div><div><b>{name}</b><small>{desc}</small><span>Level {lvl}</span></div><button className="primary" disabled={false} onClick={()=>upgradeTown(id)}>Upgrade · {cost} ◈</button></div>})}</div></section>
  <section className="realm-section"><div className="section-head"><div><span className="eyebrow">THE VILLAGE</span><h2>Talk to the villagers</h2></div></div><div className="npc-grid">{npcs.map(name=><button className="npc-card panel" key={name} onClick={()=>talkToNpc(name)}><span>{name.includes('Mira')?'🧝‍♀️':name.includes('Tomas')?'📚':name.includes('Pip')?'🏃':name.includes('Elara')?'🧵':name.includes('Rowan')?'🌿':'🍵'}</span><div><b>{name}</b><small>Tap to hear today's advice</small></div><ChevronRight size={15}/></button>)}</div></section>
  <section className="realm-section"><div className="section-head"><div><span className="eyebrow">QUEST CHAINS</span><h2>Stories with consequences</h2></div></div><div className="chain-grid">{questChains.map(c=>{const step=c.steps[c.progress];return <div className={'chain-card panel '+(c.completed?'completed':'')} key={c.id}><div className="chain-head"><span>{c.icon}</span><div><b>{c.title}</b><small>{c.villager}</small></div><strong>{c.completed?'✓':c.progress+'/'+c.steps.length}</strong></div><p>{c.desc}</p>{!c.completed&&step&&<><div className="chain-step"><b>{step.title}</b><small>{step.task}</small></div><button className="primary" onClick={()=>completeChainStep(c.id)}>Mark Step Complete · +{step.xp} XP</button></>}{c.completed&&<div className="chain-complete">✦ Questline complete — the story is yours now.</div>}</div>})}</div></section>
  <section className="realm-section"><div className="section-head"><div><span className="eyebrow">WORLD BOSSES</span><h2>Hunt beyond the walls</h2></div></div><div className="boss-grid">{realmBosses.map(b=>{const locked=level<b.unlock;return <div className={'realm-boss panel '+(b.defeated?'defeated':'')} key={b.id}><div className="boss-title"><span>{b.icon}</span><div><b>{b.name}</b><small>{locked?'Unlock at level '+b.unlock:b.desc}</small></div></div><div className="boss-hp"><span>{b.defeated?'DEFEATED':locked?'LOCKED':'HP '+b.hp+' / '+b.maxHp}</span><div><i style={{width:(b.defeated?0:Math.max(0,b.hp/b.maxHp*100))+'%'}}/></div></div><button className="primary" disabled={locked||b.defeated} onClick={()=>strikeRealmBoss(b.id)}>{b.defeated?'Victory Claimed':locked?'Locked':'Strike Boss'}</button></div>})}</div></section>
  <section className="realm-section"><div className="section-head"><div><span className="eyebrow">ARMORY</span><h2>Equipment that actually does something</h2></div><span className="muted">Owned gear changes your stats</span></div><div className="equipment-grid">{equipmentCatalog.map(item=>{const owned=equipment.owned.includes(item.id);const equipped=equipment.equipped[item.slot]===item.id;return <div className={'gear-card panel '+(equipped?'equipped':'')} key={item.id}><span className="gear-icon">{item.icon}</span><div><b>{item.name}</b><small>{item.desc}</small><span>{Object.entries(item.bonus).map(([k,v])=>k+' +'+v).join(' · ')}</span></div>{owned?<button className="ghost" onClick={()=>equipItem(item)}>{equipped?'Unequip':'Equip'}</button>:<button className="primary" onClick={()=>buyEquipment(item)}>Buy · {item.cost} ◈</button>}</div>})}</div></section>
  <section className="realm-section"><div className="section-head"><div><span className="eyebrow">COMPANIONS</span><h2>Your party</h2></div></div><div className="party-card panel"><div className="party-avatar">{companions.length?'🦊':'🧭'}</div><div><b>{companions.length?'Moss the Fox':'No companion yet'}</b><p>{companions.length?'Moss is curious, loyal, and finds +5 bonus gold when you complete quests.':'The fox encounter can recruit your first companion.'}</p></div></div></section>
  <section className="realm-section"><div className="section-head"><div><span className="eyebrow">EXPLORATION</span><h2>Mark new places on the map</h2></div></div><div className="discovery-grid">{places.map(([id,icon,name,desc])=>{const found=discoveries.includes(id);return <button className={'discovery-card panel '+(found?'found':'')} key={id} onClick={()=>discoverRealm(id)}><span>{icon}</span><div><b>{name}</b><small>{found?'Discovered · +35 XP claimed':desc}</small></div><strong>{found?'✓':'+ Discover'}</strong></button>})}</div><button className="ghost realm-map-button" onClick={()=>setActive('map')}><Map size={15}/> Open World Map</button></section>
  {selectedNpc&&<div className="modal-backdrop" onClick={()=>setSelectedNpc(null)}><div className="modal npc-dialog" onClick={e=>e.stopPropagation()}><button className="close" onClick={()=>setSelectedNpc(null)}><X/></button><span className="eyebrow">VILLAGER'S FIRE</span><h2>{selectedNpc.name}</h2><p>“{selectedNpc.line}”</p><button className="primary" onClick={()=>setSelectedNpc(null)}>Return to the realm</button></div></div>}
 </div>
}

function PageIntro({eyebrow,title,text,action,onAction}){return <div className="page-intro"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2><p>{text}</p></div>{action&&<button className="primary" onClick={onAction}>{action}</button>}</div>}