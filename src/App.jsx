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
  {id:'first-chapter',title:'Mira’s Healing Path',villager:'Mira the Healer',icon:'📜',desc:'A gentle three-part story about learning that caring for yourself is part of becoming a stronger adventurer.',completion:'Healer’s Blessing',completeLine:'You came back to the shrine three times, and each time you chose to care for yourself. That is a kind of strength no sword can teach.',steps:[
    {title:'I · Rest at the Shrine',task:'Take 10 intentional minutes away from schoolwork.',xp:25,gold:20},
    {title:'II · Carry a Kind Thought',task:'Write down one thing you handled well today.',xp:30,gold:25},
    {title:'III · Return to the Shrine',task:'Complete your normal bedtime wind-down.',xp:40,gold:35}
  ]},
  {id:'archive-chronicle',title:'The Lost Chronicle',villager:'Tomas the Scholar',icon:'📚',desc:'Help Tomas reconstruct a missing chapter by sharpening your recall.',completion:'Scholar’s Mark',completeLine:'Excellent work, adventurer. The Chronicle is whole again—and your memory grows sharper with it.',steps:[
    {title:'I · Find the First Page',task:'Complete 20 flashcards or practice questions.',xp:30,gold:25},
    {title:'II · Decode the Margin',task:'Review 5 questions you previously missed.',xp:35,gold:30},
    {title:'III · Seal the Chronicle',task:'Explain one difficult topic without looking at notes.',xp:50,gold:45}
  ]},
  {id:'road-beyond',title:'Pip’s Road to Strength',villager:'Pip the Trainer',icon:'🧭',desc:'Train your body and prove that consistency, not punishment, moves the adventurer forward.',completion:'Trailblazer’s Boon',completeLine:'You kept showing up. That is what makes a body stronger—and an adventurer harder to stop.',steps:[
    {title:'I · Leave the Gate',task:'Take a 10-minute walk or movement break.',xp:25,gold:20},
    {title:'II · Reach the Waystone',task:'Complete a workout or 20+ minutes of movement.',xp:40,gold:35},
    {title:'III · Mark the Map',task:'Visit a new place or take a genuinely new route.',xp:55,gold:50}
  ]},
  {id:'tailor-preparations',title:'Elara’s Preparations',villager:'Elara the Tailor',icon:'🧵',desc:'Turn preparation into equipment for the days ahead.',completion:'Prepared Adventurer',completeLine:'Look at you. Future You has been waiting for this kind of preparation. Consider yourself properly equipped.',steps:[
    {title:'I · Lay Out the Armor',task:'Lay out tomorrow’s outfit before bed.',xp:20,gold:20},
    {title:'II · Pack the Satchel',task:'Pack your school bag for tomorrow.',xp:25,gold:25},
    {title:'III · Set the First Task',task:'Choose and prepare tomorrow’s first study task.',xp:35,gold:35}
  ]},
  {id:'pathfinder-journal',title:'The Pathfinder’s Journal',villager:'Lyra the Stargazer',icon:'🌌',desc:'A hidden route opens only when you start paying attention to the world around you.',completion:'Pathfinder’s Star',completeLine:'You are learning to notice the world instead of simply passing through it. Keep your eyes open—the next road may already be there.',steps:[
    {title:'I · Leave the Familiar Road',task:'Take a genuinely new route today.',xp:25,gold:20},
    {title:'II · Find Something New',task:'Visit a place you have never visited before.',xp:40,gold:30},
    {title:'III · Mark the Discovery',task:'Record one new place, trail, café, library, park, or landmark you discovered.',xp:55,gold:45}
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
  'Nessa the Innkeeper': ['Every adventurer needs a tavern where they can pause.','Water first, then back to the road when you are ready.'],
  'Lyra the Stargazer': ['The stars are not a map until you learn how to read them.','The Grove only reveals itself to travelers who have earned their way beyond the familiar roads.']
}
const VILLAGER_COMPLETE_DIALOGUE = {
  'Mira the Healer':'Excellent, adventurer. You remembered that the hero carrying all these quests deserves care too.',
  'Tomas the Scholar':'Excellent work, adventurer. Your memory grows sharper with every page you recover.',
  'Pip the Trainer':'That is how strength is built: one honest effort, then another. I am proud of you.',
  'Elara the Tailor':'Perfect. Future You just received a very useful gift.',
  'Rowan the Gardener':'Well tended, adventurer. A nourished hero can travel much farther.',
  'Nessa the Innkeeper':'There we are. Hydrated, rested, and ready for whatever road comes next.'
}
const NPC_UNLOCKS = {
  'Mira the Healer': {level:1,role:'Healer',icon:'🧝‍♀️'},
  'Tomas the Scholar': {level:2,role:'Scholar',icon:'📚'},
  'Pip the Trainer': {level:3,role:'Trainer',icon:'🏃'},
  'Elara the Tailor': {level:4,role:'Tailor',icon:'🧵'},
  'Rowan the Gardener': {level:5,role:'Gardener',icon:'🌿'},
  'Nessa the Innkeeper': {level:6,role:'Innkeeper',icon:'🍵'}
}



const DISCOVERY_INFO = {
  'moonwell': {level:3,icon:'💧',name:'Moonwell',desc:'A quiet place to reset.',reward:'Unlocks the Moonwell recovery stop.'},
  'old-bridge': {level:5,icon:'🌉',name:'Old Bridge',desc:'A forgotten crossing beyond the familiar road.',reward:'Unlocks a new route on the realm map.'},
  'starlit-grove': {level:7,icon:'🌌',name:'Starlit Grove',desc:'A hidden reflection spot beneath an open sky.',reward:'Introduces Lyra, the Stargazer.'},
  'market-square': {level:10,icon:'🏮',name:'Market Square',desc:'A bustling market beyond the Keep.',reward:'Unlocks the traveling market and new equipment.'}
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
  const [quests,setQuests] = useState(() => load('quests', []).filter(q=>![1,2,3,4].includes(q.id)))
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
  const [weightJourney,setWeightJourney] = useState(() => load('weight-journey', {startWeight:'',goalLoss:20,logs:[],mealPlan:{breakfast:'',lunch:'',dinner:'',snack:''},mealDone:{breakfast:false,lunch:false,dinner:false,snack:false}}))
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
    if(data.quests)setQuests(data.quests.filter(q=>![1,2,3,4].includes(q.id)))
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
    if(data.weightJourney)setWeightJourney(data.weightJourney)
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

  const cloudData={version:2,quests,xp,gold,routine,grades,module,boss,character,statBonus,workouts,daily,achievements,companions,inventory,event,villagerQuests,town,questChains,realmBosses,equipment,discoveries,weightJourney}

  useEffect(()=>{
    if(!session||!cloudHydrated)return
    if(applyingRemoteRef.current){applyingRemoteRef.current=false;return}    clearTimeout(saveTimerRef.current)
    saveTimerRef.current=setTimeout(async()=>{
      const {error}=await supabase.from('game_saves').upsert({user_id:session.user.id,data:cloudData,updated_at:new Date().toISOString()},{onConflict:'user_id'})
      if(error)console.error('Cloud save failed',error)
    },400)
    return ()=>clearTimeout(saveTimerRef.current)
  },[session?.user?.id,cloudHydrated,quests,xp,gold,routine,grades,module,boss,character,statBonus,workouts,daily,achievements,companions,inventory,event,villagerQuests,town,questChains,realmBosses,equipment,discoveries,weightJourney])

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
  useEffect(()=>localStorage.setItem('life-rpg-weight-journey',JSON.stringify(weightJourney)),[weightJourney])
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
    const d=new Date()
    const currentDate=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
    const encounterSlot=d.getHours()>=12?'pm':'am'
    const encounterKey=`${currentDate}-${encounterSlot}`
    if(event.date===encounterKey)return
    const encounters=[
      {title:'A Fox in the Moonlight',body:'A clever fox watches you from the road. It seems to recognize an adventurer.',options:[{label:'Follow it',reward:{xp:50},message:'The fox leads you to a hidden XP cache! +50 XP'},{label:'Offer food',reward:{pet:'🦊 Moss the Fox'},message:'Moss the Fox has joined your party!'}]},
      {title:'The Wandering Merchant',body:'A traveling merchant opens a mysterious chest.',options:[{label:'Trade stories',reward:{gold:40},message:'The merchant rewards your courage. +40 gold'},{label:'Study the map',reward:{item:'🗺️ Map Fragment'},message:'You discovered a map fragment!'}]},
      {title:'A Hidden Training Ground',body:'You discover an old training circle beneath the trees.',options:[{label:'Train',reward:{xp:60},message:'Your training pays off. +60 XP'},{label:'Rest here',reward:{xp:25},message:'A peaceful rest restores your spirit. +25 XP'}]}
    ]
    const slotIndex=encounterSlot==='pm'?1:0
    const e=encounters[(d.getDate()+slotIndex)%encounters.length]
    setEvent({...e,date:encounterKey,resolved:false})
  },[event.date])

  const level=Math.floor(xp/250)+1, levelXp=xp%250, progress=levelXp/250*100
  const gearBonus=useMemo(()=>Object.values(equipment.equipped||{}).reduce((out,id)=>{const item=EQUIPMENT_CATALOG.find(x=>x.id===id);if(item)Object.entries(item.bonus).forEach(([k,v])=>out[k]=(out[k]||0)+v);return out},{}) ,[equipment.equipped])
  const townBonus=useMemo(()=>({VIT:(town.buildings.garden||0),INT:(town.buildings.library||0),SPI:(town.buildings.tavern||0)-1,RAD:0,DIS:(town.buildings.guild||0)-1}),[town.buildings])
  const stats=useMemo(()=>[
    ['VIT',7+(statBonus.VIT||0)+(gearBonus.VIT||0)+(townBonus.VIT||0),'Vitality',Heart],['INT',12+(statBonus.INT||0)+(gearBonus.INT||0)+(townBonus.INT||0),'Intelligence',BookOpen],['SPI',9+(statBonus.SPI||0)+(gearBonus.SPI||0)+(townBonus.SPI||0),'Spirit',Sparkles],
    ['RAD',6+(statBonus.RAD||0)+(gearBonus.RAD||0)+(townBonus.RAD||0),'Radiance',Crown],['DIS',8+(statBonus.DIS||0)+(gearBonus.DIS||0)+(townBonus.DIS||0),'Discipline',Shield]
  ],[statBonus,gearBonus,townBonus])
  const timeHour=realmTime.getHours(); const isNight=timeHour<7||timeHour>=19; const timeLabel=isNight?'🌙 Nightfall':'☀️ Daylight'; const dayLabel=realmTime.toLocaleDateString(undefined,{weekday:'long'}).toUpperCase();
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
    setXp(v=>v+q.xp);setGold(g=>g+q.gold);notify(`${q.villager}: ${VILLAGER_COMPLETE_DIALOGUE[q.villager]||'Well done, adventurer.'} · +${q.xp} XP · +${q.gold} gold`)
  }

  function completeChainStep(chainId){
    const chain=questChains.find(c=>c.id===chainId); if(!chain||chain.completed)return
    const step=chain.steps[chain.progress]; if(!step)return
    const nextProgress=chain.progress+1; const finished=nextProgress>=chain.steps.length
    setQuestChains(xs=>xs.map(c=>c.id===chainId?{...c,progress:nextProgress,completed:finished}:c))
    setXp(v=>v+step.xp+(finished?75:0)); setGold(g=>g+step.gold+(finished?50:0)+companionGoldBonus)
    if(finished){setTown(t=>({...t,xp:t.xp+100}));unlockAchievement('chain-complete');notify('QUEST CHAIN COMPLETE! '+(chain.completion||'The realm remembers your deeds.')+' · +75 bonus XP · +50 gold')}
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
    const place=DISCOVERY_INFO[id]
    if(!place)return
    if(level<place.level){notify(place.name+' reveals itself at hero level '+place.level+'. Keep adventuring!');return}
    setDiscoveries(d=>[...d,id]);setXp(v=>v+35);setGold(g=>g+15+companionGoldBonus);unlockAchievement('pathfinder');notify('NEW DISCOVERY! '+place.name+' · +35 XP · +15 gold')
  }
  function talkToNpc(name){
    const lines=NPC_DIALOGUE[name]||[];setSelectedNpc({name,line:lines[(new Date().getDate()+name.length)%lines.length]})
  }

  function finishQuest(id){
    const q=quests.find(x=>x.id===id); if(!q||q.done)return
    setQuests(xs=>xs.filter(x=>x.id!==id))
    setXp(x=>x+q.xp); setGold(g=>g+q.gold+companionGoldBonus)
    notify(`Journal quest complete! +${q.xp} XP · +${q.gold} gold`)
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