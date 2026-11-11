import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Backpack, BookOpen, CalendarDays, Check, ChevronLeft, ChevronRight, Compass, Crown, Flame,
  Heart, Map, Plus, ScrollText, Settings, Shield, Sparkles, Sword, Trophy,
  UserRound, X, Dumbbell, GraduationCap, Moon, Coffee, Footprints, Cloud, LogOut
} from 'lucide-react'
import { supabase } from './lib/supabase'

const EST_TIME_ZONE='America/New_York'
function getESTDateKey(date=new Date()){
  const parts=new Intl.DateTimeFormat('en-US',{timeZone:EST_TIME_ZONE,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date)
  const map=Object.fromEntries(parts.map(p=>[p.type,p.value]))
  return map.year+'-'+map.month+'-'+map.day
}

const EXPLORATION_RESET_VERSION=1
const STUDY_REWARD_TIERS=[
  {hours:10,gold:40,label:'Archive Apprentice'},
  {hours:20,gold:90,label:'Dedicated Scholar'},
  {hours:30,gold:200,label:'Grand Archivist'},
  {hours:40,gold:325,label:'Master of the Archive'}
]
const STAT_META={
  VIT:{name:'Vitality',icon:'♥',colorClass:'vit',effect:'Improves physical challenges and Verdant Wilds boss damage.'},
  INT:{name:'Intelligence',icon:'📖',colorClass:'int',effect:'Strengthens Archive battles and study rewards.'},
  SPI:{name:'Spirit',icon:'✦',colorClass:'spi',effect:'Improves recovery rewards and companion bonds.'},
  DIS:{name:'Discipline',icon:'🛡',colorClass:'dis',effect:'Improves routine rewards and daily momentum.'},
  RAD:{name:'Radiance',icon:'✧',colorClass:'rad',effect:'Unlocks the Hall of Radiance and its special rewards.'}
}
const STAT_MILESTONES=[
  {value:10,label:'Awakened',bonus:'5% passive bonus'},
  {value:20,label:'Mastered',bonus:'10% passive bonus'},
  {value:30,label:'Exalted',bonus:'15% passive bonus'}
]
const STAT_DAILY_CAP=2
const ASTRAL_RITUALS=[{id:'star-sit',icon:'🌙',title:'Sit Beneath the Stars',detail:'Spend 10 quiet minutes without a screen and let your mind settle.'},{id:'unsaid',icon:'🕯️',title:'Write What You Cannot Say',detail:'Write a few honest lines about something on your mind.'},{id:'return',icon:'🔮',title:'Return to Yourself',detail:'Take an intentional rest or recovery break without turning it into another task.'},{id:'notice',icon:'✨',title:'Notice One Thing',detail:'Pause for five minutes and deliberately notice one detail you normally rush past.'}]
const ASTRAL_SIGNS=[{id:'unknown-constellation',icon:'✦',title:'The Unknown Constellation',requirement:10,text:'A constellation appears where no star chart says it should. Its shape resembles a road bending toward the horizon.'},{id:'second-reflection',icon:'🌊',title:'The Second Reflection',requirement:15,text:'The Star Pool reflects you twice. The second figure is holding a fragment of the Shattered Atlas.'},{id:'name-in-dreams',icon:'📜',title:'Your Name in the Dream Archive',requirement:20,text:'A page appears bearing your name and tomorrow’s date. Beneath it is a sentence you have not written yet.'},{id:'celestial-gate',icon:'🚪',title:'The Celestial Gate',requirement:30,text:'Three stars align above the Sanctum. A door appears in the night sky, opening onto a road that does not belong to this world.'}]

function getWeekStartKey(date=new Date()){
  const parts=new Intl.DateTimeFormat('en-US',{timeZone:EST_TIME_ZONE,year:'numeric',month:'2-digit',day:'2-digit',weekday:'short'}).formatToParts(date)
  const map=Object.fromEntries(parts.map(p=>[p.type,p.value]))
  const d=new Date(Number(map.year),Number(map.month)-1,Number(map.day))
  const day=d.getDay(); d.setDate(d.getDate()-(day===0?6:day-1))
  return getESTDateKey(d)
}
function getWeekDateKeys(date=new Date()){
  const startKey=getWeekStartKey(date); const [y,m,d]=startKey.split('-').map(Number)
  const start=new Date(y,m-1,d)
  return Array.from({length:7},(_,i)=>{const x=new Date(start);x.setDate(start.getDate()+i);return getESTDateKey(x)})
}
function formatStudyDay(key){
  const [y,m,d]=key.split('-').map(Number)
  return new Intl.DateTimeFormat('en-US',{weekday:'short',timeZone:EST_TIME_ZONE}).format(new Date(Date.UTC(y,m-1,d,12)))
}
function getLevelRequirement(level){return 250+(Math.max(1,level)-1)*200}
function getLevelData(totalXp){
  const legacyXp=Math.max(0,Number(totalXp)||0)
  const level=Math.floor(legacyXp/250)+1
  return {level,xp:legacyXp%250}
}

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
  {name:'Cozy Cafe Run', cost:50, icon:'☕'}, {name:'Movie Night', cost:100, icon:'🎬'},
  {name:'New Book', cost:150, icon:'📖'}, {name:'Little Treat', cost:200, icon:'🍰'}
]

const ACHIEVEMENT_INFO = {
  'main-character': {name:'Main Character Energy',icon:'🌟',desc:'Cleared every daily quest in one day.'},
  'boss-slayer': {name:'Boss Slayer',icon:'⚔️',desc:'Defeated the Knowledge Warden.'},
  'three-day-flame': {name:'Three-Day Flame',icon:'🔥',desc:'Kept a 3-day adventure streak.'},
  'week-warrior': {name:'Week Warrior',icon:'👑',desc:'Kept a 7-day adventure streak.'},
  'pr-hunter': {name:'PR Hunter',icon:'💪',desc:'Set a new strength record.'}
}



const EQUIPMENT_CATALOG = [
  {id:'ember-staff',name:'Emberwood Staff',slot:'weapon',icon:'🔥',cost:120,bonus:{INT:2},requirements:{INT:15},desc:'A warm staff that rewards focused study.'},
  {id:'moon-cloak',name:'Moonlit Cloak',slot:'armor',icon:'🌙',cost:140,bonus:{SPI:2},requirements:{SPI:14},desc:'Soft armor for quiet nights and recovery.'},
  {id:'traveler-boots',name:'Traveler Boots',slot:'accessory',icon:'🥾',cost:100,bonus:{VIT:1,DIS:1},requirements:{VIT:12,DIS:12},desc:'Made for walks, runs, and new roads.'},
  {id:'golden-charm',name:'Golden Charm',slot:'accessory',icon:'✨',cost:180,bonus:{RAD:2},requirements:{RAD:14},desc:'A little radiance for the Hall of Becoming.'},
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
  'market-square': {level:10,icon:'🏮',name:'Market Square',desc:'A bustling market beyond the Keep.',reward:'Unlocks the traveling market and new equipment.'},
  'ember-library': {level:11,icon:'🔥',name:'Ember Library',desc:'A sealed library whose books glow only for persistent scholars.',reward:'Unlocks an Archive side quest and a forgotten study chamber.',statRequirement:{INT:20}},
  'glass-garden': {level:13,icon:'🌿',name:'Glass Garden',desc:'A greenhouse of impossible plants growing beneath crystal panes.',reward:'Unlocks a restorative garden route.',statRequirement:{RAD:16,SPI:12}},
  'hollow-bell-tower': {level:15,icon:'🔔',name:'Hollow Bell Tower',desc:'A tower whose bell rings only when a new road is near.',reward:'Unlocks a new clue about the Atlas.',statRequirement:{DIS:18}},
  'sunforge-terrace': {level:17,icon:'☀️',name:'Sunforge Terrace',desc:'An abandoned terrace where daylight seems to linger after sunset.',reward:'Unlocks a rare crafting and reward route.',statRequirement:{VIT:18,RAD:15}},
  'silver-marsh': {level:19,icon:'🪷',name:'Silver Marsh',desc:'A quiet wetland that appears only after the realm has changed.',reward:'Unlocks a deeper route toward the outer map.',statRequirement:{VIT:18,SPI:15}},
  'horizon-shrine': {level:22,icon:'🗿',name:'Horizon Shrine',desc:'A shrine at the edge of every known road.',reward:'A major late-Atlas discovery waits beyond it.',statRequirement:{INT:22,SPI:20}}
}

const ATLAS_CLUE_INFO = {
  '🗺️ Map Fragment': {source:'Mystery Chest',target:'Whispering Ruins',description:'A torn piece of the Atlas. It seems to point toward a buried archive.'},
  '🔑 Observatory Key': {source:'Mystery Chest',target:'Moonlit Observatory',description:'An old brass key marked with a constellation that no longer appears in the sky.'},
  '🌊 Lakeway Map': {source:'Chronicle / Observatory',target:'Sunken Causeway',description:'A silver-blue map showing a road beneath the lake.'},
  '📚 Ember Archive Seal': {source:'Quest Chain',target:'Ember Library',description:'A seal once used to open the Ember Library’s scholar gate.'},
  '🌱 Glass Garden Seed': {source:'Quest Chain',target:'Glass Garden',description:'A seed that should not be able to grow—but seems to remember a garden.'},
  '🔔 Bellkeeper’s Chime': {source:'Quest Chain',target:'Hollow Bell Tower',description:'A tiny bell whose sound is said to call hidden roads closer.'},
  '☀️ Sunforge Sigil': {source:'Quest Chain',target:'Sunforge Terrace',description:'A sun-shaped sigil from an abandoned forge route.'},
  '🪷 Silver Marsh Map': {source:'Quest Chain / Mystery Chest',target:'Silver Marsh',description:'A marsh chart whose waterways shift whenever the Atlas changes.'},
  '🗿 Horizon Seal': {source:'Chronicle',target:'Horizon Shrine',description:'A stone seal bearing the symbol of a road that ends at the horizon.'}
}

const EXPLORATION_AREAS = [
  {id:'whispering-ruins',requiredLevel:12,statRequirement:{INT:16},mastery:{stat:'INT',at:18,bonusXp:10,bonusGold:15},name:'Whispering Ruins',icon:'🏛️',description:'A half-buried archive where old roads are etched into stone.',requiredItems:['🗺️ Map Fragment','🗺️ Atlas Fragment','📜 Torn Atlas Fragment'],rewardItem:'🧭 Ruins Inscription',xp:50,gold:25,discovery:'The ruins reveal a forgotten road leading east.',npc:'Edda the Archivist',dialogue:'The stones remember a keeper who vanished before the Atlas shattered. Read the inscription aloud, and listen for the answer.',bondDialogue:{new:['Travelers rarely stay long enough to hear what the stones are saying.','The dust settles differently when someone is willing to listen.'],quest:['You returned with patience in your hands. The inscription is clearer now.','The old words were waiting for someone to give them time.'],complete:['You chose what should be remembered—and helped me preserve it. I will remember that.','The ruins feel less lonely now. Perhaps the past can trust the present after all.']},quest:{title:'Translate the fallen inscription',task:'Spend 15 focused minutes reviewing or studying something you have been putting off.',xp:35,gold:15},encounter:{title:'The Whispering Wall',body:'A line of silver writing appears between the stones. It asks what should be preserved when a story begins to fade.',choices:[{label:'Preserve the names of those who came before',item:'📜 Keeper’s Rubbing',gold:15},{label:'Preserve the road so others can find it',item:'🧭 Wayfinder Mark',gold:20}]}},
  {id:'moonlit-observatory',requiredLevel:15,statRequirement:{SPI:16},mastery:{stat:'SPI',at:18,bonusXp:10,bonusGold:15},name:'Moonlit Observatory',icon:'🔭',description:'A sealed tower that still tracks stars no longer in the sky.',requiredItems:['🔑 Observatory Key'],rewardItem:'⭐ Star Lens',xp:65,gold:30,discovery:'The Star Lens reveals a constellation pointing beneath the lake.',npc:'Orin the Nightwatcher',dialogue:'I have watched these stars for forty years. Tonight, one constellation is missing—and another is shining where the lake should be.',bondDialogue:{new:['Most visitors ask what the telescope can show them. Few ask what it has lost.','The night sky rewards a patient eye. Stay a moment.'],quest:['You noticed what most people overlook. That is the beginning of good stargazing.','The sky seems brighter tonight. Perhaps it is easier to see when someone shares the watch.'],complete:['I have kept watch alone for decades. It is good to have a fellow nightwatcher.','Whatever waits beneath the lake, I am glad you chose your own light.']},quest:{title:'Chart the missing constellation',task:'Take a 10-minute screen-free break outdoors or by a window, then return and note one thing you noticed.',xp:40,gold:20},encounter:{title:'The Unlit Telescope',body:'The telescope moves by itself and settles on a dark patch of sky. A voice asks which light you would follow.',choices:[{label:'Follow the faint star toward the lake',item:'🌊 Lakeway Map',gold:20},{label:'Follow the bright, unfamiliar flare',item:'🌠 Comet Shard',gold:25}]}},
  {id:'sunken-causeway',requiredLevel:18,statRequirement:{VIT:18},mastery:{stat:'VIT',at:20,bonusXp:15,bonusGold:20},name:'Sunken Causeway',icon:'🌊',description:'A submerged road visible only when the Atlas and lake agree.',requiredItems:['🌊 Lakeway Map'],rewardItem:'🫧 Deepwater Pearl',xp:75,gold:35,discovery:'The causeway opens a path toward the forgotten shoreline.',npc:'Mira the Ferrier',dialogue:'The water is lower than it has been in a century. The road is waiting, but it only appears to those who move with patience.',bondDialogue:{new:['The causeway is not kind to hurried feet. Let the water set the pace.','Few travelers come this far. I wondered when the road would bring someone.'],quest:['You walked with care. The shoreline remembers every gentle step.','You understand now: patience is not standing still. It is moving without forcing the river.'],complete:['You helped me guide the lantern onward. The crossing feels safer with you beside me.','When the waters rise again, you will always have a place on this shore.']},quest:{title:'Walk the old shoreline',task:'Take a gentle 15-minute walk or complete a short mobility session.',xp:45,gold:25},encounter:{title:'The Drowned Lantern',body:'A lantern glows beneath the water. Something is trying to guide travelers across the causeway.',choices:[{label:'Lift the lantern carefully',item:'🏮 Drowned Lantern',gold:25},{label:'Leave it as a guide for the next traveler',item:'🌊 Tidekeeper’s Token',gold:30}]}}
]

const EXTRA_ACHIEVEMENTS = {
  'chain-complete': {name:'Questkeeper',icon:'📜',desc:'Completed a full multi-step quest chain.'},
  'town-builder': {name:'Founder of the Keep',icon:'🏘️',desc:'Upgraded the Adventurer Guild.'},
  'realm-slayer': {name:'Realm Slayer',icon:'🐉',desc:'Defeated a world boss.'},
  'pathfinder': {name:'Pathfinder',icon:'🧭',desc:'Discovered a new place on the realm map.'}
}

const COMPANION_INFO = {
  '🦊 Moss the Fox': {icon:'🦊',name:'Moss the Fox',title:'The Lucky Scout',personality:'Mischievous, bright-eyed, and always three steps ahead.',passive:'+5 gold whenever you complete a real-life quest.'},
  '🐦 Edda’s Raven': {icon:'🐦',name:'Edda’s Raven',title:'The Archive Scribe',personality:'Quiet and observant, with an uncanny memory for unfinished pages.',passive:'+5 XP on focused study quests.'},
  '🦉 Orin’s Owl': {icon:'🦉',name:'Orin’s Owl',title:'The Nightwatcher',personality:'Calm, patient, and excellent at reminding you when rest matters.',passive:'+5 gold on rest and ritual quests.'},
  '🦦 Mira’s Otter': {icon:'🦦',name:'Mira’s Otter',title:'The River Companion',personality:'Playful and energetic, turning every walk into a tiny expedition.',passive:'+5 gold on movement and location quests.'}
}

const RELIC_INFO = {
  '✨ Keeper’s Star': {name:'Keeper’s Star',icon:'✨',stat:'SPI',statName:'Spirit',desc:'A star-shaped promise from Lyra. Attuning it permanently strengthens your Spirit.',amount:1},
  '🛡️ Atlas Ward': {name:'Atlas Ward',icon:'🛡️',stat:'DIS',statName:'Discipline',desc:'A protective mark for those who chose to guard the Atlas first.',amount:1},
  '🌊 Lakeway Map': {name:'Lakeway Map',icon:'🌊',stat:'EXP',statName:'Exploration',desc:'A map that remembers the roads you were brave enough to follow.',amount:1},
  '🧭 Wayfinder’s Compass': {name:'Wayfinder’s Compass',icon:'🧭',stat:'DIS',statName:'Discipline',desc:'A compass that points toward the road you chose to build.',amount:1},
  '🌙 Memory Lantern': {name:'Memory Lantern',icon:'🌙',stat:'SPI',statName:'Spirit',desc:'A lantern that keeps forgotten places from disappearing.',amount:1},
  '🪶 Echo Quill': {name:'Echo Quill',icon:'🪶',stat:'INT',statName:'Intelligence',desc:'A quill that writes only what you are willing to remember.',amount:1},
  '🌟 Starward Seal': {name:'Starward Seal',icon:'🌟',stat:'SPI',statName:'Spirit',desc:'A seal formed by choosing trust over a dangerous unknown.',amount:1},
  '🗝️ Keeper’s Key': {name:'Keeper’s Key',icon:'🗝️',stat:'INT',statName:'Intelligence',desc:'The key to a page the Atlas was built to forget.',amount:1},
  '📜 Keeper’s Testimony': {name:'Keeper’s Testimony',icon:'📜',stat:'INT',statName:'Intelligence',desc:'The Keeper’s truth, preserved in writing.',amount:1},
  '✒️ Cartographer’s Mark': {name:'Cartographer’s Mark',icon:'✒️',stat:'RAD',statName:'Radiance',desc:'A mark that reminds you your story belongs to you.',amount:1},
  '📖 Unwritten Page': {name:'Unwritten Page',icon:'📖',stat:'SPI',statName:'Spirit',desc:'A blank page that preserves every road you have not chosen yet.',amount:1},
  '🧭 Horizon Compass': {name:'Horizon Compass',icon:'🧭',stat:'DIS',statName:'Discipline',desc:'A compass for roads that do not exist on any map yet.',amount:1},
  '🛡️ Atlas Keeper’s Crest': {name:'Atlas Keeper’s Crest',icon:'🛡️',stat:'DIS',statName:'Discipline',desc:'A crest marking your promise to protect what has been restored.',amount:1}
}

const EXTENDED_ATLAS_SCENES = [
  {id:'horizon-signal',title:'The Signal Beyond the Horizon',chapter:4,complete:'horizon-signal-seen',body:'Three nights after the Atlas falls quiet, a new star appears above the blank edge of the map. It is not a star at all. It is a signal—three pulses, then silence. Lyra recognizes the pattern from the Keeper’s oldest notes.',choices:[
    {label:'Answer the signal with a light of your own',flags:['signal-answered'],relationship:2,reputation:1,reward:{xp:90,gold:45,item:'🔦 Signal Lantern'},chapter:4,epilogue:'Your light answers. Far beyond the map, something answers back.'},
    {label:'Record the signal and wait for another pulse',flags:['signal-recorded'],relationship:1,reputation:2,reward:{xp:90,gold:45,item:'📜 Signal Record'},chapter:4,epilogue:'You resist the urge to chase a mystery blindly. The Atlas marks your patience with a new silver road.'}]},
  {id:'city-without-roads',title:'The City Without Roads',chapter:4,complete:'city-without-roads',body:'The signal leads to a city drawn on the Atlas but absent from every ordinary map. Its gates are open. Its streets are empty. Every doorway bears the same symbol: a circle with one road deliberately erased.',choices:[
    {label:'Enter the silent city',flags:['city-entered'],relationship:1,reputation:2,reward:{xp:95,gold:50,item:'🏙️ City Seal'},chapter:4,epilogue:'Inside, you find warm lamps still burning. Someone expected travelers to return.'},
    {label:'Study the erased road from outside',flags:['city-mapped'],relationship:2,reputation:1,reward:{xp:95,gold:50,item:'🧭 Erased Road Chart'},chapter:4,epilogue:'You trace the missing road without crossing the gate. It points not inward, but underneath the city.'}]},
  {id:'empty-council',title:'The Council of Empty Chairs',chapter:4,complete:'empty-council',body:'At the center of the city stands a council chamber with twelve chairs. Eleven are empty. The twelfth has a fresh page in the Keeper’s hand: “A world is not preserved by one person.”',choices:[
    {label:'Invite the Keep to send representatives',flags:['keep-representatives'],relationship:2,reputation:3,reward:{xp:100,gold:55,item:'🏰 Council Seal'},chapter:4,epilogue:'For the first time, the mystery becomes something the whole Keep can help carry.'},
    {label:'Sit in the empty chair yourself',flags:['atlas-seat'],relationship:3,reputation:1,reward:{xp:100,gold:55,item:'🪑 Keeper’s Seat Mark'},chapter:4,epilogue:'The chair warms beneath you. A voice whispers: “Then remember that every choice has a cost.”'}]},
  {id:'under-city',title:'The Road Beneath the City',chapter:4,complete:'under-city',body:'Beneath the council chamber you find the erased road. It descends into a tunnel lined with maps of places that no longer exist. Some are beautiful. Some are warnings.',choices:[
    {label:'Follow the road into the dark',flags:['under-city-entered'],relationship:1,reputation:1,reward:{xp:105,gold:60,item:'🌑 Underroad Token'},chapter:4,epilogue:'The tunnel opens beneath a sky that is upside down.'},
    {label:'Bring a record of the lost places back to the Keep',flags:['lost-places-recorded'],relationship:2,reputation:3,reward:{xp:105,gold:60,item:'📚 Lost Places Ledger'},chapter:4,epilogue:'You refuse to let forgotten places vanish twice.'}]},
  {id:'upside-down-sky',title:'The Sky Beneath the World',chapter:5,complete:'upside-down-sky',body:'The underroad ends beneath an impossible sky. Constellations drift below your feet, and one forms the shape of the Keep. Lyra whispers that the Atlas may be a map of worlds, not one world.',choices:[
    {label:'Trust Lyra’s new theory',flags:['worlds-theory'],relationship:3,reputation:1,reward:{xp:110,gold:60,item:'🌌 Worldglass Lens'},chapter:5,epilogue:'The lens reveals another realm layered behind your own.'},
    {label:'Demand evidence before believing it',flags:['worlds-proof'],relationship:1,reputation:3,reward:{xp:110,gold:60,item:'🔬 Cartographer’s Lens'},chapter:5,epilogue:'A second moon appears in the lens. You have your proof—and a new question.'}]},
  {id:'first-door',title:'The Door With No Handle',chapter:5,complete:'first-door',body:'The Worldglass Lens reveals a door floating in the dark. Across it is one sentence: “Only a life in motion can open what a map cannot.”',choices:[
    {label:'Place your hand against the door',flags:['door-touched'],relationship:2,reputation:2,reward:{xp:115,gold:65,item:'🚪 Threshold Sigil'},chapter:5,epilogue:'The door recognizes you. Somewhere beyond it, footsteps begin.'},
    {label:'Write a question on the door',flags:['door-question'],relationship:3,reputation:2,reward:{xp:115,gold:65,item:'✒️ Questioning Quill'},chapter:5,epilogue:'Your question disappears. A reply appears: “What are you building?”'}]},
  {id:'keeper-question',title:'What Are You Building?',chapter:5,complete:'keeper-question',body:'The Atlas refuses to show another road until you answer the question with evidence. Lyra points toward the Keep.',choices:[
    {label:'Build something that helps other travelers',flags:['build-for-others'],relationship:3,reputation:3,reward:{xp:120,gold:70,item:'🛠️ Wayfarer’s Token'},chapter:5,epilogue:'The Atlas records the Keep’s growing lights. Your world is becoming part of the map.'},
    {label:'Protect a small place worth returning to',flags:['protect-home'],relationship:2,reputation:4,reward:{xp:120,gold:70,item:'🏠 Hearthstone'},chapter:5,epilogue:'A tiny golden square appears around the Keep. Home is now a destination.'}]},
  {id:'returning-road',title:'The Road That Returns',chapter:5,complete:'returning-road',body:'A road appears that loops endlessly back to the Keep. Every traveler on it carries something they thought they had lost.',choices:[
    {label:'Help the travelers find what they lost',flags:['lost-travelers'],relationship:2,reputation:4,reward:{xp:125,gold:70,item:'🧳 Traveler’s Compass'},chapter:5,epilogue:'The road shortens for every person you help.'},
    {label:'Follow the road to discover where it begins',flags:['road-origin'],relationship:3,reputation:2,reward:{xp:125,gold:70,item:'🪢 Origin Thread'},chapter:5,epilogue:'The road begins at a place that should not exist: the first page of the Atlas.'}]},
  {id:'first-page',title:'The First Page',chapter:5,complete:'first-page',body:'You reach the first page and find no throne or prophecy. You find a traveler drawing a road by hand. They look exactly like the Keeper did in the mirror.',choices:[
    {label:'Ask whether this is where the Atlas began',flags:['atlas-origin-asked'],relationship:2,reputation:2,reward:{xp:130,gold:75,item:'📖 First Page Fragment'},chapter:5,epilogue:'“The Atlas began whenever someone decided their next step mattered.”'},
    {label:'Ask who drew the first road',flags:['first-road-asked'],relationship:3,reputation:1,reward:{xp:130,gold:75,item:'✏️ First Road Pencil'},chapter:5,epilogue:'“No one owns the first road. Everyone adds to it.”'}]},
  {id:'many-keepers',title:'The Many Keepers',chapter:6,complete:'many-keepers',body:'There was never one Keeper. There have been hundreds—ordinary travelers who carried the Atlas for a while, adding roads and protecting choices.',choices:[
    {label:'Accept the tradition and join it',flags:['keeper-tradition'],relationship:3,reputation:3,reward:{xp:135,gold:80,item:'🛡️ Waykeeper Badge'},chapter:6,epilogue:'The badge bears no name. It is meant for whoever carries the Atlas today.'},
    {label:'Ask why the tradition was hidden',flags:['keeper-secret'],relationship:2,reputation:4,reward:{xp:135,gold:80,item:'🔐 Keeper Archive Key'},chapter:6,epilogue:'The answer is waiting in an archive even older than the Keep.'}]},
  {id:'archive-below',title:'The Archive Below',chapter:6,complete:'archive-below',body:'The hidden archive contains unfinished lives: plans abandoned, journeys delayed, letters never sent, books never opened. None are condemned. They are simply waiting.',choices:[
    {label:'Preserve the unfinished lives',flags:['preserve-unfinished'],relationship:2,reputation:4,reward:{xp:140,gold:80,item:'📚 Unfinished Ledger'},chapter:6,epilogue:'The archive lights up. Nothing unfinished is treated as worthless anymore.'},
    {label:'Find the lives ready to begin again',flags:['begin-again'],relationship:3,reputation:2,reward:{xp:140,gold:80,item:'🌱 Second-Chance Seed'},chapter:6,epilogue:'Several pages glow. Their roads are waiting for a traveler to return.'}]},
  {id:'false-ending',title:'The False Ending',chapter:6,complete:'false-ending',body:'At the bottom of the archive you find a page labeled THE END. Lyra laughs. “That is either very dramatic—or very suspicious.” The page is already erasing itself.',choices:[
    {label:'Tear out the false ending',flags:['ending-rejected'],relationship:3,reputation:3,reward:{xp:145,gold:85,item:'✂️ Severed Ending'},chapter:6,epilogue:'The page falls apart. The Atlas has no ending anymore.'},
    {label:'Read the ending before it disappears',flags:['ending-read'],relationship:2,reputation:4,reward:{xp:145,gold:85,item:'📜 False Ending'},chapter:6,epilogue:'It describes a world where every road is predetermined. You understand what the Atlas has been fighting.'}]},
  {id:'the-erasure',title:'The Erasure',chapter:6,complete:'the-erasure',body:'For the first time, the Atlas is attacked while you hold it. Roads vanish in real time. Lyra calls for the Keeper’s old defense, but the page refuses to respond.',choices:[
    {label:'Hold the Atlas steady and keep working',flags:['atlas-held'],relationship:3,reputation:3,reward:{xp:150,gold:90,item:'🛡️ Atlas Anchor'},chapter:6,epilogue:'The missing roads return. They were waiting for someone to refuse the erasure.'},
    {label:'Let the Atlas change and follow the new road',flags:['new-road-followed'],relationship:4,reputation:2,reward:{xp:150,gold:90,item:'🌀 Unmapped Thread'},chapter:6,epilogue:'A road appears that no Keeper has ever recorded.'}]},
  {id:'lyra-choice',title:'Lyra’s Choice',chapter:7,complete:'lyra-choice',body:'Lyra admits the Atlas once offered to erase one painful memory. She never accepted. Now the offer has returned.',choices:[
    {label:'Tell Lyra she does not have to erase anything',flags:['lyra-keeps-memory'],relationship:5,reputation:2,reward:{xp:155,gold:90,item:'💠 Memory Crystal'},chapter:7,epilogue:'Lyra closes the page. “Remembering is part of being alive.”'},
    {label:'Let Lyra decide without trying to guide her',flags:['lyra-decides'],relationship:3,reputation:4,reward:{xp:155,gold:90,item:'🌙 Moonlit Memory'},chapter:7,epilogue:'Lyra chooses for herself. The Atlas respects the choice.'}]},
  {id:'cartographers-arrive',title:'The Cartographers Arrive',chapter:7,complete:'cartographers-arrive',body:'News of the restored roads spreads. Travelers, scholars, healers, and wanderers arrive at the Keep carrying maps of their own.',choices:[
    {label:'Welcome them and share what you learned',flags:['open-cartographers'],relationship:3,reputation:5,reward:{xp:160,gold:95,item:'🗺️ Cartographers’ Charter'},chapter:7,epilogue:'The Keep becomes a meeting place for people who once traveled alone.'},
    {label:'Ask them to prove they can protect the roads',flags:['test-cartographers'],relationship:2,reputation:5,reward:{xp:160,gold:95,item:'🛡️ Roadwarden Seal'},chapter:7,epilogue:'The newcomers accept the test. A new guild may be forming.'}]},
  {id:'roadwarden-trial',title:'The Roadwarden’s Trial',chapter:7,complete:'roadwarden-trial',body:'The first trial is not a battle. A young traveler has lost confidence halfway down a difficult road. The Atlas waits to see what you protect.',choices:[
    {label:'Walk beside the traveler until they are ready',flags:['walk-beside'],relationship:3,reputation:5,reward:{xp:165,gold:100,item:'🥾 Roadwarden Boots'},chapter:7,epilogue:'The traveler finishes the road. Protection can look like simply staying.'},
    {label:'Give the traveler the map and let them choose',flags:['give-map'],relationship:4,reputation:4,reward:{xp:165,gold:100,item:'🗺️ Shared Map'},chapter:7,epilogue:'The traveler chooses a harder road—and discovers they were capable of it.'}]},
  {id:'keeper-house',title:'The Keeper House',chapter:7,complete:'keeper-house',body:'The new cartographers build a small house beside the Keep. It has a table, a kettle, shelves, and a wall where anyone may pin a road they discovered.',choices:[
    {label:'Make it a place anyone can enter',flags:['open-keeper-house'],relationship:3,reputation:6,reward:{xp:170,gold:100,item:'🗝️ Open Door Key'},chapter:7,epilogue:'The door is never locked. The Keep gains a new landmark.'},
    {label:'Make it an archive for future Keepers',flags:['keeper-archive-house'],relationship:4,reputation:5,reward:{xp:170,gold:100,item:'📚 Keeper House Ledger'},chapter:7,epilogue:'Its shelves fill with stories from travelers who never thought their journeys mattered.'}]},
  {id:'last-map',title:'The Last Map',chapter:7,complete:'last-map',body:'The Atlas reveals what looks like its final map. It shows every road you restored—and one blank circle at the center. Lyra says the circle is not a place. It is a question.',choices:[
    {label:'Ask what the question is',flags:['question-asked'],relationship:4,reputation:5,reward:{xp:175,gold:105,item:'❓ Atlas Question'},chapter:7,epilogue:'The Atlas writes: “What will you do with a world that is no longer broken?”'},
    {label:'Leave the question unanswered for now',flags:['question-kept'],relationship:5,reputation:6,reward:{xp:175,gold:105,item:'⭕ Unanswered Circle'},chapter:7,epilogue:'The circle remains blank. An unanswered question feels like freedom.'}]},
  {id:'world-after',title:'The World After',chapter:8,complete:'world-after',body:'The roads are restored. The Keep is thriving. The Atlas could close here—but it opens to a page showing your ordinary day. Lyra understands.',choices:[
    {label:'Accept that the adventure belongs in ordinary life',flags:['ordinary-adventure'],relationship:5,reputation:6,reward:{xp:180,gold:110,item:'🌟 Everyday Star'},chapter:8,epilogue:'The Atlas stops predicting your road. It simply records that you are walking it.'},
    {label:'Ask what lies beyond the restored world',flags:['beyond-world'],relationship:6,reputation:5,reward:{xp:180,gold:110,item:'🌌 Beyondworld Key'},chapter:8,epilogue:'A second atlas appears behind the first. Its cover is blank.'}]},
  {id:'second-atlas',title:'The Second Atlas',chapter:8,complete:'second-atlas',body:'The second atlas contains no roads. It contains doors. Each seems to lead to a different future, and none can be opened by gold, level, or force.',choices:[
    {label:'Open the door marked BEGIN AGAIN',flags:['begin-again-door'],relationship:5,reputation:5,reward:{xp:185,gold:115,item:'🌱 Beginning Key'},chapter:8,epilogue:'The door opens onto a sunrise. The road beyond it has not been written yet.'},
    {label:'Open the door marked KEEP GOING',flags:['keep-going-door'],relationship:6,reputation:6,reward:{xp:185,gold:115,item:'🗝️ Continuance Key'},chapter:8,epilogue:'The door opens onto a road extending beyond every border on the Atlas.'}]},
  {id:'beyond-border',title:'Beyond the Border',chapter:8,complete:'beyond-border',body:'You step beyond the final border. Nothing breaks. Nothing ends. The world simply becomes larger. The Atlas leaves its last page blank.',choices:[
    {label:'Leave the page blank and keep exploring',flags:['ever-open'],relationship:6,reputation:7,reward:{xp:200,gold:125,item:'📖 Ever-Open Page'},chapter:8,epilogue:'The Atlas becomes a living journal. There will always be another road.'},
    {label:'Write one promise for every future road',flags:['ever-promise'],relationship:7,reputation:7,reward:{xp:200,gold:125,item:'✒️ Keeper’s Promise'},chapter:8,epilogue:'You write: “I will keep choosing.” The map continues beyond the words.'}]}
];

const STORY_STAT_ROUTES={
  'atlas-introduction':{requirement:{INT:15},label:'Study the fragment until the moving roads reveal a hidden layer',flags:['atlas-stat-reading'],relationship:2,reputation:1,reward:{xp:55,gold:30,item:'🔍 Inkseer Lens'},epilogue:'The roads slow beneath your attention. You see a second layer of ink: the Atlas has been recording choices, not destinations.'},
  'observatory-lantern':{requirement:{SPI:16},label:'Sit with Lyra beneath the observatory light and listen before deciding',flags:['observatory-stat-listening'],relationship:3,reputation:1,reward:{xp:60,gold:30,item:'🌙 Listening Star'},epilogue:'You do not rush to solve the fear in Lyra’s voice. In the quiet, she notices a constellation hidden behind the missing one.'},
  'the-missing-keeper':{requirement:{DIS:18},label:'Build a careful plan before committing to a course of action',flags:['keeper-stat-plan'],relationship:2,reputation:3,reward:{xp:75,gold:40,item:'📋 Keeper’s Plan'},chapter:2,epilogue:'You turn uncertainty into a plan: protect the Atlas, preserve the clues, and leave a path open for the Keeper to return.'},
  'road-beneath-the-lake':{requirement:{VIT:18},label:'Cross the first stretch of the submerged road yourself',flags:['lake-road-stat'],relationship:2,reputation:1,reward:{xp:90,gold:45,item:'🌊 Ferrier’s Knot'},epilogue:'You move steadily through the cold water without forcing the road. The lake reveals a second staircase hidden beneath the first.'},
  'the-echo-in-the-ink':{requirement:{INT:20},label:'Study the doorway’s symbols before touching the page',flags:['echo-stat-reading'],relationship:2,reputation:2,reward:{xp:105,gold:55,item:'🪶 Annotated Echo Quill'},chapter:3,epilogue:'You recognize a pattern in the ink: the doorway is not opening into the Atlas. It is opening into the act of making one.'},
  'keeper-in-the-mirror':{requirement:{SPI:20},label:'Ask the Keeper what they are afraid to lose',flags:['keeper-stat-empathy'],relationship:3,reputation:2,reward:{xp:115,gold:60,item:'💠 Empathic Crystal'},chapter:3,epilogue:'The Keeper finally stops speaking like a legend. For one quiet moment, they speak like a tired traveler—and the truth becomes easier to hear.'},
  'page-that-knows-your-name':{requirement:{RAD:18},label:'Write your name boldly, without asking the Atlas for permission',flags:['name-stat-authored'],relationship:3,reputation:2,reward:{xp:125,gold:65,item:'✒️ Radiant Signature'},chapter:3,epilogue:'The ink glows around your name, then settles. The Atlas records not an identity it gave you, but one you chose.'},
  'the-road-you-choose':{requirement:{DIS:22},label:'Promise to keep choosing deliberately, even when no map tells you what comes next',flags:['road-stat-deliberate'],relationship:3,reputation:3,reward:{xp:140,gold:80,item:'🧭 Deliberate Compass'},chapter:4,epilogue:'The Atlas marks your promise with a steady line beyond the horizon. Discipline, it seems, can be a form of freedom.'},
  'roadwarden-trial':{requirement:{VIT:22},label:'Walk the difficult road beside the traveler and keep pace',flags:['roadwarden-stat-endurance'],relationship:4,reputation:5,reward:{xp:175,gold:105,item:'🥾 Endurance Boots'},chapter:7,epilogue:'You do not carry the traveler. You simply keep walking beside them until they find their own strength.'},
  'lyra-choice':{requirement:{SPI:25},label:'Give Lyra space to remember, then stay beside her in the silence',flags:['lyra-stat-presence'],relationship:6,reputation:3,reward:{xp:165,gold:95,item:'💠 Starlit Memory'},chapter:7,epilogue:'Lyra keeps the memory. You never needed to fix it for her; being present was enough.'},
  'last-map':{requirement:{INT:25},label:'Read the blank circle as a question hidden inside the map itself',flags:['last-map-stat-reading'],relationship:5,reputation:5,reward:{xp:185,gold:110,item:'🔎 Cartographer’s Eye'},chapter:7,epilogue:'You realize the final map is not showing where the road ends. It is asking what kind of traveler you intend to become.'},
  'world-after':{requirement:{RAD:25},label:'Choose to bring the restored world into your ordinary life',flags:['world-after-stat-radiance'],relationship:6,reputation:7,reward:{xp:190,gold:115,item:'🌟 Living-Day Star'},chapter:8,epilogue:'The Atlas records your ordinary day in gold. Becoming is not separate from living; it is what living looks like when you pay attention.'}
}

function formatStoryStatRequirement(requirements){return Object.entries(requirements||{}).map(([key,min])=>key+' '+min).join(' + ')}

function getStoryChoices(encounter,stats){
  if(!encounter)return []
  const base=[...(encounter.choices||[])]
  const route=STORY_STAT_ROUTES[encounter.id]
  if(!route)return base
  const statReady=Object.entries(route.requirement).every(([key,min])=>(stats.find(s=>s[0]===key)?.[1]||0)>=min)
  return [...base,{...route,statRoute:true,statReady}]
}

function getCampaignScene(campaign){
  const flags=new Set(campaign.flags||[])
  if(!flags.has('atlas-introduced'))return {
    id:'atlas-introduction',title:'A Map Without Roads',chapter:1,
    body:'At the edge of the Starlit Grove, Lyra waits beneath a sky that seems to have one star missing. In her hands is a fragment of an atlas: its roads move like constellations, then vanish. “The Shattered Atlas is coming apart,” she says. “And I think it remembers you.”',
    choices:[
      {label:'Trust Lyra and study the fragment',flags:['atlas-introduced','lyra-trust'],relationship:1,reputation:1,reward:{xp:40,gold:20,item:'🗺️ Atlas Fragment'},epilogue:'Lyra lets you hold the fragment. A silver road appears for one breath, pointing toward an observatory that should not exist.'},
      {label:'Keep your distance and ask what she is hiding',flags:['atlas-introduced','lyra-doubt'],relationship:0,reputation:1,reward:{xp:40,gold:20,item:'📜 Torn Atlas Fragment'},epilogue:'Lyra accepts your caution. When she turns away, you notice a second symbol beneath the ink—one she clearly hoped you would miss.'}
    ]
  }
  if(flags.has('lyra-trust')&&!flags.has('observatory-clue'))return {
    id:'observatory-lantern',title:'The Observatory’s Last Light',chapter:1,
    body:'Lyra finds you again with a brass key on a chain of blue thread. “The old observatory is sealed. I can show you the way, but I cannot promise what is waiting inside.” For the first time, she looks afraid.',
    choices:[
      {label:'Go with Lyra to the observatory',flags:['observatory-clue'],relationship:1,reputation:1,reward:{xp:45,gold:25,item:'🔑 Observatory Key'},epilogue:'Together you uncover a star chart marked with the words: THE KEEPER DID NOT LEAVE WILLINGLY.'},
      {label:'Ask Lyra to tell you everything first',flags:['lyra-questioned','observatory-clue'],relationship:0,reputation:2,reward:{xp:45,gold:25,item:'📜 Star-Scribed Note'},epilogue:'Lyra tells you the Atlas Keeper was her mentor—and that she has been searching alone for years. She seems relieved that you asked.'}
    ]
  }
  if(flags.has('lyra-doubt')&&!flags.has('shadow-symbol'))return {
    id:'ink-under-ink',title:'The Mark Beneath the Ink',chapter:1,
    body:'A folded note appears at your camp, written in Lyra’s careful hand. The torn fragment has changed overnight. A dark symbol is spreading beneath its map lines, and the stars around it have gone quiet.',
    choices:[
      {label:'Trace the strange symbol',flags:['shadow-symbol'],relationship:1,reputation:1,reward:{xp:45,gold:25,item:'🕯️ Shadow Sigil'},epilogue:'The symbol opens like an eye. A voice from somewhere far below the realm whispers: “Find the Keeper before the map finds you.”'},
      {label:'Seal the fragment away for now',flags:['shadow-symbol','lyra-cautious'],relationship:0,reputation:2,reward:{xp:45,gold:25,item:'🗝️ Sealed Atlas Note'},epilogue:'You protect the fragment instead of following its pull. Lyra respects the decision, though the dark ink continues to move.'}
    ]
  }
  if((flags.has('observatory-clue')||flags.has('shadow-symbol'))&&!flags.has('keeper-truth'))return {
    id:'the-missing-keeper',title:'The Missing Keeper',chapter:1,
    body:'Lyra returns at dusk. The clues now point to the same name: the Atlas Keeper, the last person who could mend the Shattered Atlas. “I have been chasing answers,” she says. “But I need to know whether we are trying to rescue the Keeper—or stop them.”',
    choices:[
      {label:'Help Lyra find the Keeper',flags:['keeper-truth','keeper-alliance'],relationship:1,reputation:2,reward:{xp:60,gold:35,item:'✨ Keeper’s Star'},chapter:2,epilogue:'You choose to search together. Lyra gives you a small star-shaped token: “Then we begin as allies. Whatever the truth is, we face it side by side.”'},
      {label:'Protect the Atlas before pursuing anyone',flags:['keeper-truth','keeper-caution'],relationship:0,reputation:2,reward:{xp:60,gold:35,item:'🛡️ Atlas Ward'},chapter:2,epilogue:'You insist the Atlas itself must come first. Lyra agrees, though she warns that some roads disappear while people debate which way to walk.'}
    ]
  }
  if(flags.has('keeper-truth')&&!flags.has('chapter-two-open'))return {
    id:'road-beneath-the-lake',title:'A Road Beneath the Lake',chapter:2,
    body:'The fragment grows warm whenever you pass the old lake. At night, a road appears beneath its surface, paved with pale stars. Lyra believes it leads to the first missing page of the Atlas—and to someone who knows why the Keeper vanished.',
    choices:[
      {label:'Follow the submerged road together',flags:['chapter-two-open','lake-road'],relationship:1,reputation:1,reward:{xp:75,gold:40,item:'🌊 Lakeway Map'},epilogue:'The water parts around a staircase of light. Somewhere below, a bell rings once. A new region has begun to take shape.'},
      {label:'Ask the Keep for help before descending',flags:['chapter-two-open','keep-allies'],relationship:1,reputation:2,reward:{xp:75,gold:40,item:'🏰 Keep’s Seal'},epilogue:'You bring the Keep into the mystery. The road remains hidden for now, but you will not have to face what lies below alone.'}
    ]
  }
  if(flags.has('chapter-two-open')&&!flags.has('cartographer-promise'))return {
    id:'cartographers-promise',title:'The Cartographer’s Promise',chapter:2,
    body:'Lyra appears beside your campfire, no longer carrying the fragment like a secret. “There are more pages,” she says. “And every one of them remembers a different version of this world.” She asks what kind of map you want to help restore.',
    choices:[
      {label:'Restore the roads that bring people together',flags:['cartographer-promise','world-unity'],relationship:1,reputation:2,reward:{xp:80,gold:45,item:'🧭 Wayfinder’s Compass'},epilogue:'Your promise is written into the Atlas in a line of warm gold. The realm remembers connection.'},
      {label:'Restore the forgotten places and hidden histories',flags:['cartographer-promise','world-memory'],relationship:1,reputation:1,reward:{xp:80,gold:45,item:'🌙 Memory Lantern'},epilogue:'Your promise is written into the Atlas in silver ink. The realm remembers what was nearly lost.'}
    ]
  }
  if(flags.has('cartographer-promise')&&!flags.has('echo-awakened')&&!flags.has('echo-guarded'))return {
    id:'the-echo-in-the-ink',title:'The Echo in the Ink',chapter:3,
    body:'The promise you made changes the Atlas. At the edge of the page, ink gathers into a small doorway—and from inside it comes a voice that sounds almost like your own. “A map can remember roads,” it whispers. “But only a traveler can decide where they lead.” Lyra reaches for the page, then stops. “This is new.”',
    choices:[
      {label:'Answer the voice and open the ink doorway',flags:['echo-awakened'],relationship:1,reputation:1,reward:{xp:90,gold:50,item:'🪶 Echo Quill'},chapter:3,epilogue:'The doorway opens just wide enough to reveal a room made of unfinished maps. A single quill floats in the center, waiting for someone to write.'},
      {label:'Close the Atlas and ask Lyra to stand with you',flags:['echo-guarded'],relationship:2,reputation:2,reward:{xp:90,gold:50,item:'🌟 Starward Seal'},chapter:3,epilogue:'Lyra places her hand over yours and closes the Atlas. The voice fades—but not before whispering your name. Whatever is inside now knows you are listening.'}
    ]
  }
  if((flags.has('echo-awakened')||flags.has('echo-guarded'))&&!flags.has('keeper-revealed'))return {
    id:'keeper-in-the-mirror',title:'The Keeper in the Mirror',chapter:3,
    body:'The next time the Atlas opens, it does not show a road. It shows a mirror. In its reflection stands the missing Keeper—older than the stories, exhausted, and surrounded by pages that refuse to stay still. “I did not abandon the realm,” the Keeper says. “I was trying to keep it from being rewritten.”',
    choices:[
      {label:'Ask the Keeper what they need',flags:['keeper-revealed','keeper-aid'],relationship:1,reputation:2,reward:{xp:100,gold:55,item:'🗝️ Keeper’s Key'},chapter:3,epilogue:'The Keeper points toward a locked page. “Then help me open the one place the Atlas was built to forget.”'},
      {label:'Ask why the Keeper hid the truth',flags:['keeper-revealed','keeper-questioned'],relationship:0,reputation:3,reward:{xp:100,gold:55,item:'📜 Keeper’s Testimony'},chapter:3,epilogue:'The Keeper tells you the Atlas was never meant to record one perfect world. It was built to preserve choices—and someone has been trying to erase them.'}
    ]
  }
  if(flags.has('keeper-revealed')&&!flags.has('name-on-the-page'))return {
    id:'page-that-knows-your-name',title:'The Page That Knows Your Name',chapter:3,
    body:'The locked page opens without a key. It is blank except for one line written in fresh ink: YOUR STORY DOES NOT BELONG TO THE ATLAS. Lyra looks at you. “Maybe that is the lesson. We can restore the map without letting it decide who we become.”',
    choices:[
      {label:'Write your own name beneath the warning',flags:['name-on-the-page'],relationship:2,reputation:2,reward:{xp:110,gold:60,item:'✒️ Cartographer’s Mark'},chapter:3,epilogue:'Your name does not become a destination. It becomes a promise: you will keep choosing the road instead of letting the road choose for you.'},
      {label:'Leave the page blank and protect the choice itself',flags:['name-on-the-page','blank-page'],relationship:1,reputation:3,reward:{xp:110,gold:60,item:'📖 Unwritten Page'},chapter:3,epilogue:'You leave the page untouched. The Atlas folds around the blank space like a protective hand, preserving the possibility of every road not yet taken.'}
    ]
  }
  if(flags.has('name-on-the-page')&&!flags.has('chapter-three-complete'))return {
    id:'the-road-you-choose',title:'The Road You Choose',chapter:3,
    body:'At dawn, the Atlas finally stops moving. A single road appears from the Keep, crosses the lake, and disappears beyond the edge of every known map. The Keeper’s voice reaches you one last time: “You have restored enough for now. The next part cannot be found by following clues. It must be lived.” Lyra smiles. “Then we go when you are ready.”',
    choices:[
      {label:'Promise to keep exploring with Lyra',flags:['chapter-three-complete','next-road-ready'],relationship:2,reputation:2,reward:{xp:125,gold:75,item:'🧭 Horizon Compass'},chapter:4,epilogue:'The Atlas draws a new horizon beyond the known realm. For the first time, the blank space does not feel like something missing. It feels like somewhere you can go.'},
      {label:'Promise to protect what you have restored',flags:['chapter-three-complete','atlas-keeper'],relationship:1,reputation:3,reward:{xp:125,gold:75,item:'🛡️ Atlas Keeper’s Crest'},chapter:4,epilogue:'The Atlas settles into your hands, quiet and warm. The realm is safe for now—but the new horizon is waiting whenever you choose to answer it.'}
    ]
  }

  const extendedScene=EXTENDED_ATLAS_SCENES.find(scene=>!flags.has(scene.complete));
  if(extendedScene)return {...extendedScene,choices:extendedScene.choices.map(choice=>({...choice,flags:[...(choice.flags||[]),extendedScene.complete]}))}

  return null
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
  const [journalDate,setJournalDate] = useState(() => load('journal-date', getESTDateKey()))
  const [heroProgress,setHeroProgress] = useState(() => {
    const savedLevel=load('hero-level',null), savedXp=load('hero-xp',null)
    if(Number.isInteger(savedLevel)&&typeof savedXp==='number')return {level:savedLevel,xp:Math.max(0,savedXp)}
    return getLevelData(load('xp',245))
  })
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
  const [routineDate,setRoutineDate] = useState(() => load('routine-date', ''))
  const [grades,setGrades] = useState(() => load('grades', [
    {id:1,module:'Current Module',quiz:'Quiz 1',score:82},
    {id:2,module:'Current Module',quiz:'Quiz 2',score:91},
    {id:3,module:'Current Module',quiz:'Quiz 3',score:76},
  ]))
  const [studySessions,setStudySessions] = useState(() => load('study-sessions', []))
  const [studyWeekClaims,setStudyWeekClaims] = useState(() => load('study-week-claims', {}))
  const [studyDraft,setStudyDraft] = useState({date:getESTDateKey(),minutes:'',subject:'',note:''})
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
  const [statGrowth,setStatGrowth] = useState(() => load('stat-growth', {date:'',earned:{}}))
  const [radianceState,setRadianceState] = useState(() => load('radiance-state', {date:'',completed:[]}))
  const [astralState,setAstralState] = useState(() => load('astral-state', {date:'',completed:[],signs:[],visits:0}))
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
  const [companionBonds,setCompanionBonds] = useState(() => load('companion-bonds', {}))
  const [companionUses,setCompanionUses] = useState(() => load('companion-uses', {}))
  const [inventory,setInventory] = useState(() => load('inventory', []))
  const [event,setEvent] = useState(() => load('event', {date:'',title:'',body:'',options:[],resolved:false}))
  const [villagerQuests,setVillagerQuests] = useState(() => load('villager-quests', {date:'',active:[],completed:[]}))
  const [town,setTown] = useState(() => load('town', {level:1,xp:0,buildings:{guild:1,tavern:1,garden:0,library:0}}))
  const [questChains,setQuestChains] = useState(() => load('quest-chains', QUEST_CHAINS.map(c=>({...c,progress:0,completed:false}))))
  const [realmBosses,setRealmBosses] = useState(() => load('realm-bosses', REALM_BOSSES.map(b=>({...b,hp:b.maxHp,defeated:false}))))
  const [equipment,setEquipment] = useState(() => { const saved=load('equipment', {owned:[],equipped:{}}); return {owned:Array.isArray(saved?.owned)?saved.owned:[],equipped:{weapon:null,armor:null,accessory:null,...(saved?.equipped||{})}} })
  const [discoveries,setDiscoveries] = useState(() => load('exploration-reset-version',0)<EXPLORATION_RESET_VERSION ? [] : load('discoveries', []))
  const [exploredAreas,setExploredAreas] = useState(() => load('exploration-reset-version',0)<EXPLORATION_RESET_VERSION ? [] : load('explored-areas', []))
  const [locationProgress,setLocationProgress] = useState(() => load('exploration-reset-version',0)<EXPLORATION_RESET_VERSION ? {} : load('location-progress', {}))
  const [activeLocation,setActiveLocation] = useState(null)
  const [campaign,setCampaign] = useState(() => load('campaign', {chapter:1,flags:[],choices:[],relationship:0,reputation:0,lastEncounterDate:'',lastEncounterAt:'',productivityDate:getESTDateKey(),productivity:{xp:0,quests:0}}))
  const [storyEncounter,setStoryEncounter] = useState(() => load('story-encounter', null))
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
    if(data.journalDate)setJournalDate(data.journalDate)
    if(typeof data.heroLevel==='number'){
      setHeroProgress({level:data.heroLevel,xp:typeof data.heroXp==='number'?data.heroXp:0})
    }else if(typeof data.xp==='number'){
      setHeroProgress(getLevelData(data.xp))
    }
    if(typeof data.gold==='number')setGold(data.gold)
    if(data.routine)setRoutine(data.routine)
    if(data.routineDate)setRoutineDate(data.routineDate)
    if(data.grades)setGrades(data.grades)
    if(data.module)setModule(data.module)
    if(data.boss)setBoss(data.boss)
    if(data.character)setCharacter(data.character)
    if(data.statBonus)setStatBonus(data.statBonus)
    if(data.statGrowth)setStatGrowth(data.statGrowth)
    if(data.radianceState)setRadianceState(data.radianceState)
    if(data.astralState)setAstralState(data.astralState)
    if(data.workouts)setWorkouts(data.workouts)
    if(data.daily)setDaily(data.daily)
    if(data.achievements)setAchievements(data.achievements)
    if(data.companions)setCompanions(data.companions)
    if(data.companionBonds)setCompanionBonds(data.companionBonds)
    if(data.companionUses)setCompanionUses(data.companionUses)
    if(data.inventory)setInventory(data.inventory)
    if(data.event)setEvent(data.event)
    if(data.villagerQuests)setVillagerQuests(data.villagerQuests)
    if(data.town)setTown(data.town)
    if(data.questChains)setQuestChains(data.questChains)
    if(data.realmBosses)setRealmBosses(data.realmBosses)
    if(data.equipment)setEquipment({owned:Array.isArray(data.equipment.owned)?data.equipment.owned:[],equipped:{weapon:null,armor:null,accessory:null,...(data.equipment.equipped||{})}})
    if((data.explorationResetVersion||0)<EXPLORATION_RESET_VERSION){
      setDiscoveries([]);setExploredAreas([]);setLocationProgress({})
    }else{
      if(data.discoveries)setDiscoveries(data.discoveries)
      if(data.exploredAreas)setExploredAreas(data.exploredAreas)
      if(data.locationProgress)setLocationProgress(data.locationProgress)
    }
    if(data.studySessions)setStudySessions(data.studySessions)
    if(data.studyWeekClaims)setStudyWeekClaims(data.studyWeekClaims)
    if(data.campaign)setCampaign({...data.campaign,lastEncounterAt:data.campaign.lastEncounterAt||'',productivityDate:data.campaign.productivityDate||data.campaign.lastEncounterDate||getESTDateKey()})
    if(data.storyEncounter)setStoryEncounter(data.storyEncounter)
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

  const xp=heroProgress.xp, level=heroProgress.level
  const cloudData={version:4,quests,journalDate,xp:heroProgress.xp,heroXp:heroProgress.xp,heroLevel:heroProgress.level,gold,routine,routineDate,grades,studySessions,studyWeekClaims,module,boss,character,statBonus,statGrowth,radianceState,astralState,workouts,daily,achievements,companions,companionBonds,companionUses,inventory,event,villagerQuests,town,questChains,realmBosses,equipment,discoveries,exploredAreas,locationProgress,explorationResetVersion:EXPLORATION_RESET_VERSION,campaign,storyEncounter,weightJourney}

  useEffect(()=>{
    if(!session||!cloudHydrated)return
    if(applyingRemoteRef.current){applyingRemoteRef.current=false;return}    clearTimeout(saveTimerRef.current)
    saveTimerRef.current=setTimeout(async()=>{
      const {error}=await supabase.from('game_saves').upsert({user_id:session.user.id,data:cloudData,updated_at:new Date().toISOString()},{onConflict:'user_id'})
      if(error)console.error('Cloud save failed',error)
    },400)
    return ()=>clearTimeout(saveTimerRef.current)
  },[session?.user?.id,cloudHydrated,quests,journalDate,xp,level,gold,routine,routineDate,grades,studySessions,studyWeekClaims,module,boss,character,statBonus,statGrowth,radianceState,astralState,workouts,daily,achievements,companions,companionBonds,companionUses,inventory,event,villagerQuests,town,questChains,realmBosses,equipment,discoveries,exploredAreas,locationProgress,campaign,storyEncounter,weightJourney])

  useEffect(()=>{
    if(!session)return
    const channel=supabase.channel('life-rpg-'+session.user.id)
      .on('postgres_changes',{event:'UPDATE',schema:'public',table:'game_saves',filter:'user_id=eq.'+session.user.id},payload=>{
        if(payload.new?.data){applyCloudSave(payload.new.data);setCloudHydrated(true)}
      }).subscribe()
    return ()=>{supabase.removeChannel(channel)}
  },[session?.user?.id])

  useEffect(()=>localStorage.setItem('life-rpg-quests',JSON.stringify(quests)),[quests])
  useEffect(()=>localStorage.setItem('life-rpg-journal-date',JSON.stringify(journalDate)),[journalDate])
  useEffect(()=>localStorage.setItem('life-rpg-xp',JSON.stringify(xp)),[xp])
  useEffect(()=>localStorage.setItem('life-rpg-hero-xp',JSON.stringify(xp)),[xp])
  useEffect(()=>localStorage.setItem('life-rpg-hero-level',JSON.stringify(level)),[level])
  useEffect(()=>localStorage.setItem('life-rpg-gold',JSON.stringify(gold)),[gold])
  useEffect(()=>localStorage.setItem('life-rpg-routine',JSON.stringify(routine)),[routine])
  useEffect(()=>localStorage.setItem('life-rpg-routine-date',JSON.stringify(routineDate)),[routineDate])
  useEffect(()=>localStorage.setItem('life-rpg-grades',JSON.stringify(grades)),[grades])
  useEffect(()=>localStorage.setItem('life-rpg-module',JSON.stringify(module)),[module])
  useEffect(()=>localStorage.setItem('life-rpg-boss',JSON.stringify(boss)),[boss])
  useEffect(()=>localStorage.setItem('life-rpg-character',JSON.stringify(character)),[character])
  useEffect(()=>localStorage.setItem('life-rpg-stat-bonus',JSON.stringify(statBonus)),[statBonus])
  useEffect(()=>localStorage.setItem('life-rpg-stat-growth',JSON.stringify(statGrowth)),[statGrowth])
  useEffect(()=>localStorage.setItem('life-rpg-radiance-state',JSON.stringify(radianceState)),[radianceState])
  useEffect(()=>localStorage.setItem('life-rpg-astral-state',JSON.stringify(astralState)),[astralState])
  useEffect(()=>localStorage.setItem('life-rpg-workouts',JSON.stringify(workouts)),[workouts])
  useEffect(()=>localStorage.setItem('life-rpg-weight-journey',JSON.stringify(weightJourney)),[weightJourney])
  useEffect(()=>localStorage.setItem('life-rpg-daily',JSON.stringify(daily)),[daily])
  useEffect(()=>localStorage.setItem('life-rpg-achievements',JSON.stringify(achievements)),[achievements])
  useEffect(()=>localStorage.setItem('life-rpg-companions',JSON.stringify(companions)),[companions])
  useEffect(()=>localStorage.setItem('life-rpg-companion-bonds',JSON.stringify(companionBonds)),[companionBonds])
  useEffect(()=>localStorage.setItem('life-rpg-companion-uses',JSON.stringify(companionUses)),[companionUses])
  useEffect(()=>localStorage.setItem('life-rpg-inventory',JSON.stringify(inventory)),[inventory])
  useEffect(()=>localStorage.setItem('life-rpg-event',JSON.stringify(event)),[event])
  useEffect(()=>localStorage.setItem('life-rpg-villager-quests',JSON.stringify(villagerQuests)),[villagerQuests])
  useEffect(()=>localStorage.setItem('life-rpg-town',JSON.stringify(town)),[town])
  useEffect(()=>localStorage.setItem('life-rpg-quest-chains',JSON.stringify(questChains)),[questChains])
  useEffect(()=>localStorage.setItem('life-rpg-realm-bosses',JSON.stringify(realmBosses)),[realmBosses])
  useEffect(()=>localStorage.setItem('life-rpg-equipment',JSON.stringify(equipment)),[equipment])
  useEffect(()=>localStorage.setItem('life-rpg-discoveries',JSON.stringify(discoveries)),[discoveries])
  useEffect(()=>localStorage.setItem('life-rpg-exploration-reset-version',JSON.stringify(EXPLORATION_RESET_VERSION)),[])
  useEffect(()=>localStorage.setItem('life-rpg-explored-areas',JSON.stringify(exploredAreas)),[exploredAreas])
  useEffect(()=>localStorage.setItem('life-rpg-location-progress',JSON.stringify(locationProgress)),[locationProgress])
  useEffect(()=>localStorage.setItem('life-rpg-study-sessions',JSON.stringify(studySessions)),[studySessions])
  useEffect(()=>localStorage.setItem('life-rpg-study-week-claims',JSON.stringify(studyWeekClaims)),[studyWeekClaims])
  useEffect(()=>localStorage.setItem('life-rpg-campaign',JSON.stringify(campaign)),[campaign])
  useEffect(()=>localStorage.setItem('life-rpg-story-encounter',JSON.stringify(storyEncounter)),[storyEncounter])
  useEffect(()=>{const timer=setInterval(()=>setRealmTime(new Date()),60000);return()=>clearInterval(timer)},[])
  useEffect(()=>{
    const resetRoutineAtEST=()=>{
      if(!cloudHydrated)return
      const today=getESTDateKey()
      if(routineDate!==today){
        setRoutine(xs=>xs.map(x=>({...x,done:false,xpAwarded:false})))
        setRoutineDate(today)
      }
    }
    resetRoutineAtEST()
    const timer=setInterval(resetRoutineAtEST,30000)
    return()=>clearInterval(timer)
  },[cloudHydrated,routineDate])
  useEffect(()=>{
    const resetDailyAtEST=()=>{
      const today=getESTDateKey()
      if(journalDate!==today){setJournalDate(today)}
      if(daily.date!==today)setDaily(x=>({...x,date:today,completed:[],bonusClaimed:false}))
      if(villagerQuests.date!==today)setVillagerQuests({date:today,active:[],completed:[]})
      if(statGrowth.date!==today)setStatGrowth({date:today,earned:{}})
      if(radianceState.date!==today)setRadianceState({date:today,completed:[]})
      if(astralState.date!==today)setAstralState(s=>({...s,date:today,completed:[]}))
    }
    resetDailyAtEST()
    const timer=setInterval(resetDailyAtEST,30000)
    return()=>clearInterval(timer)
  },[journalDate,daily.date,villagerQuests.date,statGrowth.date,radianceState.date,astralState.date])
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

  useEffect(()=>{
    if(storyEncounter?.resolved&&(campaign.productivity?.xp||campaign.productivity?.quests)){
      setCampaign(c=>({...c,productivity:{xp:0,quests:0}}))
    }
  },[storyEncounter?.resolved])

  useEffect(()=>{
    if(!discoveries.includes('starlit-grove'))return
    if(storyEncounter&&!storyEncounter.resolved)return
    const now=new Date()
    const today=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`
    const lastChoiceAt=campaign.lastEncounterAt?new Date(campaign.lastEncounterAt).getTime():campaign.lastEncounterDate?new Date(campaign.lastEncounterDate+'T00:00:00-05:00').getTime():0
    if(lastChoiceAt&&now.getTime()-lastChoiceAt<24*60*60*1000)return
    const scene=getCampaignScene(campaign)
    if(!scene)return
    setStoryEncounter({...scene,date:today,resolved:false})
    setCampaign(c=>({...c,lastEncounterDate:today}))
  },[discoveries,campaign.flags,campaign.lastEncounterDate,storyEncounter?.resolved])

  const levelXp=xp
  const levelNeeded=getLevelRequirement(level)
  const progress=Math.min(100,(levelXp/levelNeeded)*100)
  function addXp(amount){
    const gain=Math.max(0,Number(amount)||0)
    if(!gain)return
    setHeroProgress(prev=>{
      let nextLevel=prev.level
      let nextXp=Math.max(0,prev.xp)+gain
      let needed=getLevelRequirement(nextLevel)
      while(nextXp>=needed){
        nextXp-=needed
        nextLevel+=1
        needed=getLevelRequirement(nextLevel)
      }
      if(nextLevel>prev.level)notify('LEVEL UP! You reached Hero Level '+nextLevel+'.')
      return {level:nextLevel,xp:nextXp}
    })
  }
  const gearBonus=useMemo(()=>Object.values(equipment.equipped||{}).reduce((out,id)=>{const item=EQUIPMENT_CATALOG.find(x=>x.id===id);if(item)Object.entries(item.bonus).forEach(([k,v])=>out[k]=(out[k]||0)+v);return out},{}) ,[equipment.equipped])
  const townBonus=useMemo(()=>({VIT:(town.buildings.garden||0),INT:(town.buildings.library||0),SPI:(town.buildings.tavern||0)-1,RAD:0,DIS:(town.buildings.guild||0)-1}),[town.buildings])
  const stats=useMemo(()=>[
    ['VIT',7+(statBonus.VIT||0)+(gearBonus.VIT||0)+(townBonus.VIT||0),'Vitality',Heart],['INT',12+(statBonus.INT||0)+(gearBonus.INT||0)+(townBonus.INT||0),'Intelligence',BookOpen],['SPI',9+(statBonus.SPI||0)+(gearBonus.SPI||0)+(townBonus.SPI||0),'Spirit',Sparkles],
    ['RAD',6+(statBonus.RAD||0)+(gearBonus.RAD||0)+(townBonus.RAD||0),'Radiance',Crown],['DIS',8+(statBonus.DIS||0)+(gearBonus.DIS||0)+(townBonus.DIS||0),'Discipline',Shield]
  ],[statBonus,gearBonus,townBonus])
  const timeHour=realmTime.getHours(); const isNight=timeHour<7||timeHour>=19; const timeLabel=isNight?'🌙 Nightfall':'☀️ Daylight'; const dayLabel=realmTime.toLocaleDateString(undefined,{weekday:'long'}).toUpperCase();
  const companionGoldBonus=companions.includes('🦊 Moss the Fox')?5:0
  const companionQuestGoldBonus=(type)=>((companions.includes('🦉 Orin’s Owl')&&(type==='rest'||type==='ritual'))||(companions.includes('🦦 Mira’s Otter')&&(type==='body'||type==='location')))?5:0
  function bondCompanions(){setCompanionBonds(b=>Object.fromEntries(Object.entries(b).map(([id,v])=>[id,(v||0)+1])))}
  function callCompanion(id){
    if(!companions.includes(id))return
    const today=getESTDateKey()
    if(companionUses[id]===today){notify('That companion has already helped today.');return}
    setCompanionUses(u=>({...u,[id]:today}))
    if(id==='🦊 Moss the Fox')setGold(g=>g+15)
    if(id==='🐦 Edda’s Raven')addXp(20)
    if(id==='🦉 Orin’s Owl')setGold(g=>g+20)
    if(id==='🦦 Mira’s Otter')addXp(20)
    setCompanionBonds(b=>({...b,[id]:(b[id]||0)+2}))
    notify((COMPANION_INFO[id]?.name||'Companion')+' used its special ability!')
  }
  const completed=quests.filter(q=>q.done).length
  const todayKey=getESTDateKey()
  const dailyQuests=[
    {id:'study',title:'Enter the Grand Archive',subtitle:'Complete a focused study block',xp:35,gold:10,icon:'📜',stat:'INT'},
    {id:'body',title:'Train in the Verdant Wilds',subtitle:'Move for 20+ minutes or complete a workout',xp:35,gold:10,icon:'⚔️',stat:'VIT'},
    {id:'ritual',title:'Tend the Adventurer',subtitle:'Complete one routine ritual',xp:25,gold:8,icon:'🕯️',stat:'DIS'},
    {id:'nourish',title:'Nourish the Hero',subtitle:'Have a balanced meal with protein',xp:25,gold:8,icon:'🥗',stat:'VIT'},
    {id:'explore',title:'Step Beyond the Keep',subtitle:'Visit somewhere new or take a new route',xp:40,gold:12,icon:'🗺️',stat:'SPI'},
    {id:'rest',title:'Rest at Camp',subtitle:'Protect a real bedtime / wind-down',xp:25,gold:8,icon:'🌙',stat:'SPI'},
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
  function recordProductivityProgress(xp,completedQuests=0){
    setCampaign(c=>({...c,productivity:{xp:(c.productivity?.xp||0)+Math.max(0,xp||0),quests:(c.productivity?.quests||0)+Math.max(0,completedQuests)}}))
  }
  function statValue(key){return stats.find(s=>s[0]===key)?.[1]||0}
  function meetsStatRequirement(requirements){const entries=Object.entries(requirements||{});return entries.length>0&&entries.every(([key,min])=>statValue(key)>=min)}
  function formatStatRequirement(requirements){return Object.entries(requirements||{}).map(([key,min])=>key+' '+min).join(' + ')}
  function statPassive(key){
    const value=statValue(key)
    if(value>=30)return 0.15
    if(value>=20)return 0.10
    if(value>=10)return 0.05
    return 0
  }
  function grantStat(key,amount=1){
    if(!STAT_META[key]||amount<=0)return 0
    const today=getESTDateKey()
    setStatGrowth(current=>{
      const base=current.date===today?current:{date:today,earned:{}}
      const already=Number(base.earned?.[key]||0)
      const room=Math.max(0,STAT_DAILY_CAP-already)
      const granted=Math.min(room,Math.max(0,Math.round(amount)))
      if(!granted)return base
      setStatBonus(s=>({...s,[key]:(s[key]||0)+granted}))
      return {...base,earned:{...base.earned,[key]:already+granted}}
    })
    return Math.min(STAT_DAILY_CAP,Math.max(0,Math.round(amount)))
  }
  function rewardXp(amount,key){
    const bonus=key?statPassive(key):0
    addXp(Math.round(Math.max(0,Number(amount)||0)*(1+bonus)))
  }
  function completeDaily(id){
    if(daily.completed.includes(id))return
    const q=dailyQuests.find(x=>x.id===id);if(!q)return
    const next=[...daily.completed,id]
    const d0=new Date(Date.now()-24*60*60*1000);const yesterday=getESTDateKey(d0)
    const streak=daily.lastCompletedDate===todayKey?(daily.streak||0):daily.lastCompletedDate===yesterday?(daily.streak||0)+1:1
    setDaily(d=>({...d,completed:next,streak,lastCompletedDate:todayKey}))
    if(streak>=3)unlockAchievement('three-day-flame')
    if(streak>=7)unlockAchievement('week-warrior')
    rewardXp(q.xp,q.stat);recordProductivityProgress(q.xp,1);grantStat(q.stat);setGold(g=>g+Math.round(q.gold*(1+statPassive(q.stat)))+companionGoldBonus)
    if(next.length===dailyQuests.length&&!daily.bonusClaimed){setDaily(d=>({...d,bonusClaimed:true}));addXp(100);recordProductivityProgress(100);setGold(g=>g+50);unlockAchievement('main-character');notify('DAILY ADVENTURE COMPLETE! +100 bonus XP · +50 gold')}
    else notify(`${q.title} complete! +${q.xp} XP · +${q.gold} gold · ${streak}-day streak`)
  }
  function resolveEvent(option){
    if(event.resolved)return
    const r=option.reward||{};if(r.xp)addXp(r.xp);if(r.gold)setGold(g=>g+r.gold)
    if(r.pet)setCompanions(p=>p.includes(r.pet)?p:[...p,r.pet]);if(r.item)setInventory(i=>[...i,r.item])
    setEvent(e=>({...e,resolved:true}));notify(option.message||'The realm remembers your choice.')
  }
  function resolveStoryChoice(choice){
    if(!storyEncounter||storyEncounter.resolved)return
    if(choice.statRequirement){const statReady=Object.entries(choice.statRequirement).every(([key,min])=>statValue(key)>=min);if(!statReady){notify('This path requires '+formatStoryStatRequirement(choice.statRequirement)+'.');return}}
    const earned=campaign.productivity||{xp:0,quests:0}
    if((earned.xp||0)<100||(earned.quests||0)<3){notify('The Atlas is sealed. Earn 100 productivity XP and complete 3 quests to choose your path.');return}
    const reward=choice.reward||{}
    if(reward.xp)addXp(reward.xp)
    if(reward.gold)setGold(g=>g+reward.gold)
    if(reward.item)setInventory(items=>items.includes(reward.item)?items:[...items,reward.item])
    setCampaign(c=>({
      ...c,
      chapter:Math.max(c.chapter||1,choice.chapter||c.chapter||1),
      flags:[...new Set([...(c.flags||[]),...(choice.flags||[])])],
      choices:[...(c.choices||[]),{scene:storyEncounter.id,title:storyEncounter.title,choice:choice.label,date:storyEncounter.date}],
      relationship:(c.relationship||0)+(choice.relationship||0),
      reputation:(c.reputation||0)+(choice.reputation||0),
      productivity:{xp:0,quests:0},
      lastEncounterAt:new Date().toISOString(),
      lastEncounterDate:getESTDateKey()
    }))
    setStoryEncounter(e=>({...e,resolved:true,selectedChoice:choice.label,epilogue:choice.epilogue||'The realm remembers what you chose.'}))
    notify('The Atlas remembers your choice. '+(reward.xp?'+'+reward.xp+' XP ':'')+(reward.gold?'+'+reward.gold+' gold':''))
  }
  function rollMysteryChest(){
    if(gold<100){notify('The Mystery Chest costs 100 gold.');return}
    setGold(g=>g-100)
    const drops=[{text:'+75 XP',reward:{xp:75}},{text:'+150 gold',reward:{gold:150}},{text:'A fox companion!',reward:{pet:'🦊 Moss the Fox'}},{text:'A rare map fragment',reward:{item:'🗺️ Map Fragment'}},{text:'An old brass key',reward:{item:'🔑 Observatory Key'}}]
    const d=drops[Math.floor(Math.random()*drops.length)],r=d.reward
    if(r.xp)addXp(r.xp);if(r.gold)setGold(g=>g+r.gold);if(r.pet)setCompanions(p=>p.includes(r.pet)?p:[...p,r.pet]);if(r.item)setInventory(i=>[...i,r.item])
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
    const villagerStat=({mind:'INT',spirit:'SPI',body:'VIT',life:'DIS'}[q.type]||'DIS');rewardXp(q.xp,villagerStat);grantStat(villagerStat);setGold(g=>g+Math.round(q.gold*(1+statPassive(villagerStat))));notify(`${q.villager}: ${VILLAGER_COMPLETE_DIALOGUE[q.villager]||'Well done, adventurer.'} · +${q.xp} XP · +${q.gold} gold`)
  }

  function completeChainStep(chainId){
    const chain=questChains.find(c=>c.id===chainId); if(!chain||chain.completed)return
    const step=chain.steps[chain.progress]; if(!step)return
    const nextProgress=chain.progress+1; const finished=nextProgress>=chain.steps.length
    setQuestChains(xs=>xs.map(c=>c.id===chainId?{...c,progress:nextProgress,completed:finished}:c))
    addXp(step.xp+(finished?75:0)); setGold(g=>g+step.gold+(finished?50:0)+companionGoldBonus)
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
    const damage=Math.max(25,Math.round(statValue*8*(1+statPassive(boss.stat))))
    const hp=Math.max(0,boss.hp-damage); const defeated=hp===0
    setRealmBosses(xs=>xs.map(b=>b.id===id?{...b,hp,defeated}:b))
    if(defeated){const reward=REALM_BOSSES.find(b=>b.id===id);addXp(120+(boss.unlock*20));setGold(g=>g+60+(boss.unlock*10)+companionGoldBonus);unlockAchievement('realm-slayer');notify(boss.name+' defeated! '+reward.reward)}
    else notify(boss.name+' takes '+damage+' damage.')
  }
  function buyEquipment(item){
    if(equipment.owned.includes(item.id)){notify('You already own the '+item.name+'.');return}
    if(!meetsStatRequirement(item.requirements)){notify(item.name+' requires '+formatStatRequirement(item.requirements)+'.');return}
    if(gold<item.cost){notify('Not enough gold for '+item.name+'.');return}
    setGold(g=>g-item.cost);setEquipment(e=>({...e,owned:[...e.owned,item.id]}));notify(item.name+' added to your armory.')
  }
  function equipItem(item){
    if(!equipment.owned.includes(item.id))return
    if(!meetsStatRequirement(item.requirements)){notify(item.name+' requires '+formatStatRequirement(item.requirements)+'.');return}
    const wasEquipped=equipment.equipped[item.slot]===item.id
    setEquipment(e=>({...e,equipped:{...e.equipped,[item.slot]:wasEquipped?null:item.id}}))
    notify(item.name+(wasEquipped?' unequipped.':' equipped!'))
  }
  function discoverRealm(id){
    if(discoveries.includes(id))return
    const place=DISCOVERY_INFO[id]
    if(!place)return
    const statReady=meetsStatRequirement(place.statRequirement)
    if(level<place.level&&!statReady){notify(place.name+' requires Hero Level '+place.level+' or '+formatStatRequirement(place.statRequirement)+'.');return}
    const bonus=statReady?10:0
    setDiscoveries(d=>[...d,id]);addXp(35+bonus);setGold(g=>g+15+bonus+companionGoldBonus);unlockAchievement('pathfinder');notify('NEW DISCOVERY! '+place.name+' · +'+(35+bonus)+' XP · +'+(15+bonus)+' gold'+(statReady?' · stat route':'') )
  }
  function finishExplorationArea(areaId,progress){
    const area=EXPLORATION_AREAS.find(x=>x.id===areaId)
    if(!area||!progress?.questDone||progress.encounterChoice===undefined||progress.discoveryClaimed)return
    setLocationProgress(p=>({...p,[areaId]:{...(p[areaId]||{}),discoveryClaimed:true}}))
    if(progress.clueItem){
      const mastery=area.mastery&&statValue(area.mastery.stat)>=area.mastery.at?area.mastery:{bonusXp:0,bonusGold:0}
      setInventory(items=>{const index=items.indexOf(progress.clueItem);const without=index>=0?items.filter((_,i)=>i!==index):items;return without.includes(area.rewardItem)?without:[...without,area.rewardItem]})
      addXp(area.xp+(mastery.bonusXp||0));setGold(g=>g+area.gold+(mastery.bonusGold||0)+companionGoldBonus);unlockAchievement('pathfinder');bondCompanions()
      const companionReward=areaId==='whispering-ruins'?'🐦 Edda’s Raven':areaId==='moonlit-observatory'?'🦉 Orin’s Owl':areaId==='sunken-causeway'?'🦦 Mira’s Otter':null
      if(companionReward)setCompanions(items=>items.includes(companionReward)?items:[...items,companionReward])
      notify(area.name+' fully explored! Clue used · +'+(area.xp+(mastery.bonusXp||0))+' XP · +'+(area.gold+(mastery.bonusGold||0))+' gold · '+area.rewardItem+(mastery.bonusXp||mastery.bonusGold?' · stat mastery bonus':'') )
    }else{
      notify(area.name+' fully explored! Your path is complete.')
    }
  }
  function exploreArea(id){
    if(exploredAreas.includes(id))return
    const area=EXPLORATION_AREAS.find(x=>x.id===id)
    if(!area)return
    if(level<(area.requiredLevel||1)&&!meetsStatRequirement(area.statRequirement)){notify(area.name+' is sealed until Hero Level '+area.requiredLevel+' or '+formatStatRequirement(area.statRequirement)+'.');return}
    const key=area.requiredItems.find(item=>inventory.includes(item))
    if(!key){notify('You need a map clue to explore '+area.name+'. Check your Hero inventory.');return}
    setExploredAreas(xs=>[...xs,id])
    setLocationProgress(p=>({...p,[id]:{...(p[id]||{}),clueItem:key}}))
    setActiveLocation(id)
    notify(area.name+' discovered! Your clue is held until you complete the local quest and choose a path.')
  }
  function completeLocationQuest(areaId){
    const area=EXPLORATION_AREAS.find(x=>x.id===areaId)
    const progress=locationProgress[areaId]||{}
    if(!area||!exploredAreas.includes(areaId)||progress.questDone)return
    const next={...progress,questDone:true}
    setLocationProgress(p=>({...p,[areaId]:next}))
    const locationStat=areaId==='whispering-ruins'?'INT':areaId==='moonlit-observatory'?'SPI':'VIT'
    rewardXp(area.quest.xp,locationStat);grantStat(locationStat);setGold(g=>g+Math.round(area.quest.gold*(1+statPassive(locationStat)))+companionGoldBonus+companionQuestGoldBonus('location'));bondCompanions()
    recordProductivityProgress(area.quest.xp,1)
    notify('Location quest complete! +'+area.quest.xp+' XP · +'+area.quest.gold+' gold')
    finishExplorationArea(areaId,next)
  }
  function resolveLocationEncounter(areaId,choiceIndex){
    const area=EXPLORATION_AREAS.find(x=>x.id===areaId)
    const progress=locationProgress[areaId]||{}
    if(!area||!exploredAreas.includes(areaId)||progress.encounterChoice!==undefined)return
    const choice=area.encounter.choices[choiceIndex]
    if(!choice)return
    const next={...progress,encounterChoice:choiceIndex}
    setLocationProgress(p=>({...p,[areaId]:next}))
    setInventory(items=>items.includes(choice.item)?items:[...items,choice.item])
    setGold(g=>g+choice.gold+companionGoldBonus)
    notify('Encounter resolved: '+choice.item+' · +'+choice.gold+' gold')
    finishExplorationArea(areaId,next)
  }
  function talkToNpc(name){
    const lines=NPC_DIALOGUE[name]||[];setSelectedNpc({name,line:lines[(new Date().getDate()+name.length)%lines.length]})
  }

  function finishQuest(id){
    const q=quests.find(x=>x.id===id); if(!q||q.done)return
    setQuests(xs=>xs.filter(x=>x.id!==id))
    rewardXp(q.xp+(companions.includes('🐦 Edda’s Raven')?5:0),q.stat);recordProductivityProgress(q.xp,1);grantStat(q.stat||'DIS');setGold(g=>g+Math.round(q.gold*(1+statPassive(q.stat||'DIS')))+companionGoldBonus);bondCompanions()
    notify(`Journal quest complete! +${q.xp} XP · +${q.gold} gold`)
  }
  function addQuest(e){
    e.preventDefault(); if(!newQuest.trim())return
    setQuests(xs=>[...xs,{id:Date.now(),title:newQuest.trim(),subtitle:'Custom quest from your adventurer’s journal',xp:25,gold:5,type:'custom',stat:'DIS',done:false}])
    setNewQuest('');setShowQuest(false);notify('New quest added to your journal.')
  }
  function toggleRoutine(id){const item=routine.find(x=>x.id===id);if(!item||item.active===false)return;const next=!item.done;setRoutine(xs=>xs.map(x=>x.id===id?{...x,done:next,xpAwarded:x.xpAwarded||next}:x));if(next&&!item.xpAwarded){rewardXp((item.xp||20),item.stat||'DIS');recordProductivityProgress(item.xp||20);grantStat(item.stat||'DIS');setGold(g=>g+Math.round(5*(1+statPassive(item.stat||'DIS')))+companionGoldBonus);notify(`Ritual complete! +${item.xp||20} XP · ${item.stat||'DIS'} strengthened`)}}
  function openRoutineEditor(item){setRoutineEditorMode('edit');setEditingRoutine(item.id);setRoutineDraft({time:item.time,title:item.title,xp:item.xp||20,stat:item.stat||'DIS',repeat:item.repeat||'daily',active:item.active!==false})}
  function openRoutineCreator(){setRoutineEditorMode('add');setEditingRoutine(null);setRoutineDraft({time:'',title:'',xp:20,stat:'DIS',repeat:'daily',active:true})}
  function saveRoutine(e){e.preventDefault();if(!routineDraft.time.trim()||!routineDraft.title.trim())return;const clean={time:routineDraft.time.trim(),title:routineDraft.title.trim(),xp:Number(routineDraft.xp)||20,stat:routineDraft.stat,repeat:routineDraft.repeat,active:routineDraft.active};if(routineEditorMode==='add'){setRoutine(xs=>[...xs,{id:Date.now(),...clean,done:false}]);notify('New routine quest added.')}else{setRoutine(xs=>xs.map(x=>x.id===editingRoutine?{...x,...clean}:x));notify('Routine quest updated.')}setEditingRoutine(null)}
  function deleteRoutine(id){
    setRoutine(xs=>xs.filter(x=>x.id!==id)); setEditingRoutine(null); notify('Routine quest removed.')
  }
  function addGrade(e){
    e.preventDefault(); const score=Number(newGrade.score)
    if(!newGrade.quiz||!Number.isFinite(score)||score<0||score>100)return
    setGrades(xs=>[...xs,{id:Date.now(),module:module.name||'Current Module',quiz:newGrade.quiz,score}])
    setNewGrade({quiz:'',score:''});notify('Quiz recorded in the Grand Archive.')
  }
  function addStudySession(e){
    e.preventDefault()
    const minutes=Math.round(Number(studyDraft.minutes))
    if(!Number.isFinite(minutes)||minutes<10||minutes>1440)return
    const date=studyDraft.date||getESTDateKey()
    const session={id:Date.now(),date,minutes,subject:studyDraft.subject.trim()||'Independent study',note:studyDraft.note.trim()}
    const weekKey=getWeekStartKey(new Date(date+'T12:00:00'))
    const before=studySessions.filter(x=>getWeekStartKey(new Date(x.date+'T12:00:00'))===weekKey).reduce((sum,x)=>sum+Number(x.minutes||0),0)
    const after=before+minutes
    setStudySessions(xs=>[...xs,session])
    setStudyDraft({date:getESTDateKey(),minutes:'',subject:'',note:''})
    STUDY_REWARD_TIERS.forEach(tier=>{
      if(before/60<tier.hours&&after/60>=tier.hours&&!studyWeekClaims[weekKey+'-'+tier.hours]){
        setGold(g=>g+tier.gold)
        setStudyWeekClaims(c=>({...c,[weekKey+'-'+tier.hours]:true}))
        notify('WEEKLY STUDY REWARD: '+tier.label+' · +'+tier.gold+' gold!')
      }
    })
    notify('Study session recorded · '+(minutes/60).toFixed(minutes%60?1:0)+' hr')
  }
  function deleteStudySession(id){
    setStudySessions(xs=>xs.filter(x=>x.id!==id))
    notify('Study session removed.')
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
  function prepareBoss(){if(!grades.length){notify('Record at least one quiz before facing the boss.');return}setBoss(b=>({...b,active:true,defeated:false,hp:1000}));notify('The Knowledge Warden has awakened. Your quiz scores are attacks!')}
  function attemptBoss(){
    const relevantGrades=grades.filter(g=>g.module===module.name||g.module==='Current Module')
    const sourceGrades=relevantGrades.length?relevantGrades:grades
    const avg=sourceGrades.length?sourceGrades.reduce((a,g)=>a+Number(g.score||0),0)/sourceGrades.length:0
    const damage=Math.max(10,Math.round((avg>=85?160:avg>=70?100:35)*(1+statPassive('INT'))))
    const hp=Math.max(0,Number(boss.hp??1000)-damage);const ready=hp===0
    setBoss(b=>({...b,attempts:b.attempts+1,hp,defeated:ready}))
    if(ready){addXp(250);setGold(g=>g+100);unlockAchievement('boss-slayer');notify('KNOWLEDGE WARDEN DEFEATED! +250 XP · +100 gold')}
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
      rewardXp(50,'VIT');setGold(g=>g+Math.round(15*(1+statPassive('VIT'))));grantStat('VIT',gain);unlockAchievement('pr-hunter')
      notify('NEW PR! '+ex.name+' at '+weight+' lb · +50 XP · +15 gold · VIT +'+gain)
    }else notify(ex.name+' logged at '+weight+' lb. Keep building.')
  }
  function addExercise(e){e.preventDefault();if(!workoutDraft.name.trim())return;setWorkouts(xs=>xs.map(w=>w.id===activeWorkout?{...w,exercises:[...w.exercises,{id:Date.now(),name:workoutDraft.name.trim(),sets:Number(workoutDraft.sets)||3,reps:Number(workoutDraft.reps)||10,weight:Number(workoutDraft.weight)||0,best:Number(workoutDraft.weight)||0}]}:w));setWorkoutDraft({name:'',sets:3,reps:10,weight:0});setShowWorkoutForm(false);notify('Exercise added to the split.')}
  function deleteExercise(workoutId,exerciseId){setWorkouts(xs=>xs.map(w=>w.id===workoutId?{...w,exercises:w.exercises.filter(e=>e.id!==exerciseId)}:w));notify('Exercise removed from the split.')}
  function completeRadianceTask(id){
    const tasks=[
      {id:'morning-glow',title:'Prepare the Hero'},
      {id:'space-glow',title:'Restore the Keep'},
      {id:'joy-glow',title:'Choose Something Beautiful'}
    ]
    const task=tasks.find(x=>x.id===id)
    if(!task||radianceState.completed.includes(id))return
    setRadianceState(s=>({...s,completed:[...s.completed,id]}))
    grantStat('RAD')
    setGold(g=>g+Math.round(10*(1+statPassive('RAD'))))
    notify(task.title+' complete · RAD strengthened · +10 gold')
  }
  function completeAstralRitual(id){const ritual=ASTRAL_RITUALS.find(x=>x.id===id);if(!ritual||astralState.completed.includes(id))return;setAstralState(s=>({...s,completed:[...s.completed,id],visits:(s.visits||0)+1}));grantStat('SPI');setGold(g=>g+Math.round(8*(1+statPassive('SPI'))));notify(ritual.title+' complete · SPI strengthened · +8 gold')}
  function buyReward(r){
    if(gold<r.cost){notify('Not enough gold yet — keep adventuring!');return}
    setGold(g=>g-r.cost);notify(`${r.name} added to your real-life reward log.`)
  }
  function attuneRelic(item){
    const relic=RELIC_INFO[item]
    if(!relic||!inventory.includes(item))return
    setInventory(items=>{
      const index=items.indexOf(item)
      return index<0?items:items.filter((_,i)=>i!==index)
    })
    setStatBonus(b=>({...b,[relic.stat]:(b[relic.stat]||0)+relic.amount}))
    notify(relic.name+' attuned! +'+relic.amount+' '+relic.statName+' permanently.')
  }


  const nav=[
    ['dashboard','Camp',Sword],['quests','Quests',ScrollText],['planner','Routine',CalendarDays],['map','World',Map],['story','Chronicle',BookOpen],
    ['study','Grand Archive',GraduationCap],['body','Verdant Wilds',Dumbbell],['astral','Astral Sanctum',Sparkles],['radiance','Hall of Radiance',Crown],['hero','Hero',UserRound]
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
        <div><span className="eyebrow">{dayLabel} · {timeLabel} · THE ADVENTURE CONTINUES</span><h1>{nav.find(n=>n[0]===active)?.[1]||(active==='radiance'?'Hall of Radiance':'Camp')}</h1></div>
        <div className="top-actions"><div className="cloud-status"><Cloud size={13}/> <span>Cloud save</span></div><div className="currency">◈ <b>{gold}</b></div><div className="level-pill"><span>LVL</span><b>{level}</b></div><button className="signout-button" onClick={()=>supabase.auth.signOut()} title="Sign out"><LogOut size={14}/></button></div>
      </header>

      {active==='dashboard'&&<Dashboard quests={quests} stats={stats} xp={xp} gold={gold} progress={progress} completed={completed} finishQuest={finishQuest} setShowQuest={setShowQuest} worlds={WORLDS} setActive={setActive} dailyQuests={dailyQuests} daily={daily} dailyDone={dailyDone} completeDaily={completeDaily}/>}
      {active==='quests'&&<QuestPage quests={quests} finishQuest={finishQuest} setShowQuest={setShowQuest} villagerQuests={villagerQuests} villagerQuestList={VILLAGER_QUESTS} acceptVillagerQuest={acceptVillagerQuest} completeVillagerQuest={completeVillagerQuest} townLevel={town.level} talkToNpc={talkToNpc} selectedNpc={selectedNpc} setSelectedNpc={setSelectedNpc} gold={gold} questChains={questChains} completeChainStep={completeChainStep}/>}
      {active==='planner'&&<RoutinePage routine={routine} toggleRoutine={toggleRoutine} openRoutineEditor={openRoutineEditor} openRoutineCreator={openRoutineCreator}/>}
      {active==='story'&&<StoryPage campaign={campaign} storyEncounter={storyEncounter} resolveStoryChoice={resolveStoryChoice} setActive={setActive}/>}
      {active==='study'&&<StudyPage grades={grades} newGrade={newGrade} setNewGrade={setNewGrade} addGrade={addGrade} openGradeEditor={openGradeEditor} module={module} setModule={setModule} boss={boss} prepareBoss={prepareBoss} attemptBoss={attemptBoss} studySessions={studySessions} studyDraft={studyDraft} setStudyDraft={setStudyDraft} addStudySession={addStudySession} deleteStudySession={deleteStudySession} stats={stats} setActive={setActive}/>}
      {active==='body'&&<BodyPage workouts={workouts} activeWorkout={activeWorkout} setActiveWorkout={setActiveWorkout} updateExercise={updateExercise} logWorkout={logWorkout} showWorkoutForm={showWorkoutForm} setShowWorkoutForm={setShowWorkoutForm} workoutDraft={workoutDraft} setWorkoutDraft={setWorkoutDraft} addExercise={addExercise} deleteExercise={deleteExercise} setActive={setActive} weightJourney={weightJourney} setWeightJourney={setWeightJourney} stats={stats}/>} 
      {active==='radiance'&&<RadiancePage radianceState={radianceState} stats={stats} completeRadianceTask={completeRadianceTask} setActive={setActive}/>}
      {active==='astral'&&<AstralPage astralState={astralState} stats={stats} completeAstralRitual={completeAstralRitual} setActive={setActive} setAstralState={setAstralState}/>}
      {active==='map'&&<RealmPage level={level} stats={stats} timeLabel={timeLabel} isNight={isNight} town={town} upgradeTown={upgradeTown} questChains={questChains} completeChainStep={completeChainStep} realmBosses={realmBosses} strikeRealmBoss={strikeRealmBoss} equipment={equipment} equipmentCatalog={EQUIPMENT_CATALOG} buyEquipment={buyEquipment} equipItem={equipItem} companions={companions} discoveries={discoveries} discoverRealm={discoverRealm} setActive={setActive} inventory={inventory} exploredAreas={exploredAreas} exploreArea={exploreArea} activeLocation={activeLocation} setActiveLocation={setActiveLocation} locationProgress={locationProgress} completeLocationQuest={completeLocationQuest} resolveLocationEncounter={resolveLocationEncounter}/>} 
      {active==='hero'&&<HeroPage character={character} level={level} xp={xp} gold={gold} stats={stats} openCharacterEditor={openCharacterEditor} rewards={REWARDS} buyReward={buyReward} rollMysteryChest={rollMysteryChest} companions={companions} inventory={inventory} achievements={achievements} attuneRelic={attuneRelic} companionBonds={companionBonds} companionUses={companionUses} callCompanion={callCompanion}/>} />
      
      {showQuest&&<div className="modal-backdrop" onClick={()=>setShowQuest(false)}><div className="modal" onClick={e=>e.stopPropagation()}><button className="close" onClick={()=>setShowQuest(false)}><X/></button><span className="eyebrow">NEW QUEST</span><h2>Add a quest to your journal</h2><form onSubmit={addQuest}><input autoFocus value={newQuest} onChange={e=>setNewQuest(e.target.value)} placeholder="e.g. Walk to class instead of taking the bus"/><button className="primary" type="submit">Accept Quest <Sword size={16}/></button></form></div></div>}
      {(routineEditorMode==='add'||editingRoutine)&&<div className="modal-backdrop" onClick={()=>setEditingRoutine(null)}><div className="modal" onClick={e=>e.stopPropagation()}><button className="close" onClick={()=>setEditingRoutine(null)}><X/></button><span className="eyebrow">{routineEditorMode==='add'?'NEW ROUTINE QUEST':'EDIT ROUTINE QUEST'}</span><h2>{routineEditorMode==='add'?'Add a ritual to your questline':'Change this ritual'}</h2><form onSubmit={saveRoutine}><label>Time<input autoFocus value={routineDraft.time} onChange={e=>setRoutineDraft({...routineDraft,time:e.target.value})}/></label><label>Quest<input value={routineDraft.title} onChange={e=>setRoutineDraft({...routineDraft,title:e.target.value})}/></label><div className="edit-grid"><label>XP<input type="number" min="1" value={routineDraft.xp} onChange={e=>setRoutineDraft({...routineDraft,xp:e.target.value})}/></label><label>Stat<select value={routineDraft.stat} onChange={e=>setRoutineDraft({...routineDraft,stat:e.target.value})}><option>DIS</option><option>VIT</option><option>INT</option><option>SPI</option><option>RAD</option></select></label><label>Repeats<select value={routineDraft.repeat} onChange={e=>setRoutineDraft({...routineDraft,repeat:e.target.value})}><option value="daily">Daily</option><option value="weekdays">Weekdays</option><option value="weekends">Weekends</option><option value="custom">Custom</option></select></label></div><label className="toggle-label"><input type="checkbox" checked={routineDraft.active} onChange={e=>setRoutineDraft({...routineDraft,active:e.target.checked})}/> Active ritual</label><div className="modal-actions">{routineEditorMode==='edit'&&<button className="ghost" type="button" onClick={()=>deleteRoutine(editingRoutine)}>Delete</button>}<button className="primary" type="submit">{routineEditorMode==='add'?'Add Ritual':'Save Changes'} <Check size={16}/></button></div></form></div></div>}
      {characterEditor&&<div className="modal-backdrop" onClick={()=>setCharacterEditor(false)}><div className="modal" onClick={e=>e.stopPropagation()}><button className="close" onClick={()=>setCharacterEditor(false)}><X/></button><span className="eyebrow">CHARACTER CREATION</span><h2>Shape your adventurer</h2><form onSubmit={saveCharacter}><label>Name<input autoFocus value={characterDraft.name} onChange={e=>setCharacterDraft({...characterDraft,name:e.target.value})}/></label><label>Race<select value={characterDraft.race} onChange={e=>setCharacterDraft({...characterDraft,race:e.target.value})}><option>Human</option><option>Elf</option><option>Dwarf</option><option>Halfling</option><option>Tiefling</option></select></label><label>Class<select value={characterDraft.className} onChange={e=>setCharacterDraft({...characterDraft,className:e.target.value})}><option>Wandering Mage</option><option>Warrior</option><option>Ranger</option><option>Rogue</option><option>Cleric</option></select></label><label>Avatar<select value={characterDraft.avatar} onChange={e=>setCharacterDraft({...characterDraft,avatar:e.target.value})}><option>🧙‍♀️</option><option>🧝‍♀️</option><option>🧝</option><option>🧚‍♀️</option><option>🧛‍♀️</option><option>🛡️</option></select></label><button className="primary" type="submit">Save Character <Check size={16}/></button></form></div></div>}{editingGrade&&<div className="modal-backdrop" onClick={()=>setEditingGrade(null)}><div className="modal" onClick={e=>e.stopPropagation()}><button className="close" onClick={()=>setEditingGrade(null)}><X/></button><span className="eyebrow">EDIT QUIZ RECORD</span><h2>Correct your archive</h2><form onSubmit={saveGrade}><label>Quiz name<input autoFocus value={gradeDraft.quiz} onChange={e=>setGradeDraft({...gradeDraft,quiz:e.target.value})}/></label><label>Score %<input type="number" min="0" max="100" value={gradeDraft.score} onChange={e=>setGradeDraft({...gradeDraft,score:e.target.value})}/></label><div className="modal-actions"><button className="ghost" type="button" onClick={()=>deleteGrade(editingGrade)}>Delete</button><button className="primary" type="submit">Save Score <Check size={16}/></button></div></form></div></div>}
      {toast&&<div className="toast"><Trophy size={18}/><span>{toast}</span></div>}
    </main>
  </div>
}

function Dashboard({quests,stats,xp,gold,progress,completed,finishQuest,setShowQuest,worlds,setActive,dailyQuests,daily,dailyDone,completeDaily}){

 return <div className="content">
  <section className="daily-adventure panel"><div><span className="eyebrow">TODAY'S ADVENTURE</span><h2>The Wandering Mage's Journey</h2><p>Complete real-life quests to earn XP, gold, discoveries, and level up.</p></div><div className="daily-progress"><b>{dailyDone}/{dailyQuests.length}</b><span>quests complete</span><div className="xp-bar"><i style={{width:(dailyDone/dailyQuests.length*100)+'%'}}/></div></div></section>
  <section className="daily-quests"><div className="section-head"><div><span className="eyebrow">QUESTBOARD</span><h2>Today's adventure</h2></div><span className="muted">Full clear = bonus XP</span></div><div className="daily-grid">{dailyQuests.map(q=>{const done=daily.completed.includes(q.id);return <button key={q.id} className={'daily-quest panel '+(done?'done':'')} onClick={()=>!done&&completeDaily(q.id)} disabled={done}><span className="daily-icon">{done?<Check size={18}/>:q.icon}</span><span><b>{q.title}</b><small>{done?'Completed · returns at midnight':q.subtitle}</small></span><strong>{done?'✓': '+'+q.xp}</strong></button>})}</div></section>
  <section className="quick-grid camp-shortcuts">
    <Quick icon={CalendarDays} title="Routine" value="Manage your daily rituals" onClick={()=>setActive('planner')}/>
    <Quick icon={BookOpen} title="Chronicle" value="Continue the Shattered Atlas" onClick={()=>setActive('story')}/>
    <Quick icon={Map} title="World Map" value="Visit discovered places" onClick={()=>setActive('map')}/>
  </section>

  <section className="section-head"><div><span className="eyebrow">TODAY'S JOURNAL</span><h2>Active quests</h2></div><button className="ghost" onClick={()=>setShowQuest(true)}>+ New Quest</button></section>
  <div className="quest-list">{quests.map(q=><Quest key={q.id} q={q} finishQuest={finishQuest}/>)}</div>

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

function QuestPage({quests,finishQuest,setShowQuest,villagerQuests,villagerQuestList,acceptVillagerQuest,completeVillagerQuest,townLevel,talkToNpc,selectedNpc,setSelectedNpc,gold,questChains,completeChainStep}){
 const unlockedNames=Object.entries(NPC_UNLOCKS).filter(([,cfg])=>townLevel>=cfg.level).map(([name])=>name)
 const unlocked=villagerQuestList.filter(q=>unlockedNames.includes(q.villager))
 const active=unlocked.filter(q=>villagerQuests.active.includes(q.id))
 const locked=Object.entries(NPC_UNLOCKS).filter(([,cfg])=>townLevel<cfg.level)
 return <div className="content"><PageIntro eyebrow="ADVENTURER'S JOURNAL" title="All quests" text="Turn the things you already want to do into tiny victories." action="+ New Quest" onAction={()=>setShowQuest(true)}/>
  <div className="quest-resource-strip panel"><span>YOUR PURSE</span><strong>◈ {gold}</strong><small>Earn gold by helping villagers, completing quests, exploring, and leveling up.</small></div>
  <section className="villager-section"><div className="section-head"><div><span className="eyebrow">QUESTS FROM THE REALM</span><h2>Help the villagers</h2></div><span className="muted">Choose up to 3 at once</span></div>
   {active.length>0&&<div className="villager-active"><div className="villager-active-title">🛡️ ACTIVE VILLAGER QUESTS</div>{active.map(q=><VillagerQuestCard key={q.id} q={q} state="active" onClick={()=>completeVillagerQuest(q.id)}/>)}</div>}
   <div className="villager-grid">{unlocked.map(q=><VillagerQuestCard key={q.id} q={q} state={villagerQuests.completed.includes(q.id)?'completed':villagerQuests.active.includes(q.id)?'active':'available'} onClick={()=>q&&acceptVillagerQuest(q.id)} onTalk={()=>talkToNpc(q.villager)} />)}</div>
   {locked.length>0&&<div className="locked-villagers"><div className="section-head"><div><span className="eyebrow">PEOPLE YOU HAVE YET TO MEET</span><h3>Expand the Keep to find them</h3></div></div><div className="locked-villager-grid">{locked.map(([name,cfg])=><div className="locked-villager panel" key={name}><span>?</span><div><b>Unknown Villager</b><small>{cfg.role} · Unlocks at Keep Level {cfg.level}</small></div><em>🔒</em></div>)}</div></div>}
  </section>
  <section className="quest-chains-section"><div className="section-head"><div><span className="eyebrow">STORYLINES</span><h2>Quest Chains</h2><p className="muted">Help recurring characters through multi-step stories. Complete every chapter to earn a special title, bonus rewards, and a permanent place in the realm’s history.</p></div></div><div className="quest-chain-grid">{questChains.map(chain=>{const step=chain.steps[chain.progress];const done=chain.completed;return <div className={'quest-chain-card panel '+(done?'completed':'')} key={chain.id}><div className="quest-chain-head"><span className="chain-icon">{chain.icon}</span><div><b>{chain.title}</b><small>{chain.villager}</small></div><strong>{done?'✓':(chain.progress+1)+'/'+chain.steps.length}</strong></div><p>{chain.desc}</p>{done?<div className="chain-complete-line">🏆 {chain.completion}<small>{chain.completeLine}</small></div>:<div className="chain-step"><span className="eyebrow">CURRENT CHAPTER</span><h3>{step.title}</h3><p>{step.task}</p><div className="npc-reward-line">Reward: <b>+{step.xp} XP</b> · <b>+{step.gold} ◈</b></div><button className="primary" onClick={()=>completeChainStep(chain.id)}>Complete Chapter</button></div>}</div>})}</div></section>
  <div className="section-head"><div><span className="eyebrow">ADVENTURER'S JOURNAL</span><h2>My quests</h2><p className="muted">Your daily personal quest list. Add anything you need to get done; unfinished journal quests reset at midnight Eastern.</p></div></div><div className="quest-list full">{quests.length?quests.map(q=><Quest key={q.id} q={q} finishQuest={finishQuest}/>):<div className="empty-quest panel"><ScrollText size={20}/><span><b>Your journal is empty.</b><small>Add your first personal quest above.</small></span></div>}</div>
  {selectedNpc&&<div className="modal-backdrop" onClick={()=>setSelectedNpc(null)}><div className="modal npc-dialog" onClick={e=>e.stopPropagation()}><button className="close" onClick={()=>setSelectedNpc(null)}><X/></button><span className="eyebrow">VILLAGER · ADVENTURER'S KEEP</span><h2>{selectedNpc.name}</h2><div className="npc-speech">“{selectedNpc.line}”</div>{(()=>{const q=unlocked.find(x=>x.villager===selectedNpc.name);if(!q)return <p className="npc-response">The villager smiles. “Come back tomorrow; I may have another request.”</p>;const activeQ=villagerQuests.active.includes(q.id);const doneQ=villagerQuests.completed.includes(q.id);return <div className="npc-request"><span className="eyebrow">{doneQ?'QUEST COMPLETE':activeQ?'QUEST IN PROGRESS':'NEW QUEST'}</span><h3>{q.request}</h3><p>{q.detail}</p><div className="npc-reward-line">Reward: <b>+{q.xp} XP</b> · <b>+{q.gold} ◈</b></div>{!doneQ&&!activeQ&&<button className="primary" onClick={()=>{acceptVillagerQuest(q.id);setSelectedNpc(null)}}>Accept Quest</button>}{activeQ&&<button className="primary" onClick={()=>{completeVillagerQuest(q.id);setSelectedNpc(null)}}>Mark Quest Complete</button>}{doneQ&&<><div className="npc-speech npc-complete">“{VILLAGER_COMPLETE_DIALOGUE[selectedNpc.name]||'Well done, adventurer.'}”</div><button className="ghost" onClick={()=>setSelectedNpc(null)}>Come back tomorrow</button></>}</div>})()}</div></div>}
 </div>
}
function VillagerQuestCard({q,state,onClick,onTalk}){const buttonText=state==='available'?'Accept Quest':state==='active'?'Mark Complete':'Helped Today ✓';return <div className={'villager-card panel '+state}><button className="villager-talk" onClick={(e)=>{e.stopPropagation();onTalk?.()}}>{q.avatar}</button><div className="villager-copy"><b>{q.villager}</b><strong>{q.request}</strong><small>{q.detail}</small></div><div className="villager-reward"><b>+{q.gold} ◈</b><span>+{q.xp} XP</span><button className={state==='available'?'primary':'ghost'} disabled={state!=='available'&&state!=='active'} onClick={onClick}>{buttonText}</button></div></div>}

function RoutinePage({routine,toggleRoutine,openRoutineEditor,openRoutineCreator}){const day=new Date().getDay();const due=routine.filter(x=>x.active!==false&&((x.repeat||'daily')==='daily'||((x.repeat||'daily')==='weekdays'&&day>=1&&day<=5)||((x.repeat||'daily')==='weekends'&&(day===0||day===6))));const active=routine.filter(x=>x.active!==false);const done=active.filter(x=>x.done).length;return <div className="content"><PageIntro eyebrow="ADVENTURER'S KEEP" title="Today's routine" text="Your real-life schedule becomes a questline." action="+ Add Ritual" onAction={openRoutineCreator}/><div className="routine-summary panel"><div><span className="eyebrow">DAILY PROGRESS</span><strong>{done}/{active.length}</strong><span>rituals completed · completion grants XP</span></div><div className="xp-bar"><i style={{width:(active.length?done/active.length*100:0)+'%'}}/></div></div><div className="routine-list">{routine.map(item=><div className={'routine-row panel '+(item.done?'done ':'')+(item.active===false?'inactive':'')} key={item.id}><button className="routine-main" onClick={()=>toggleRoutine(item.id)}><span className="routine-time">{item.time}</span><span className="routine-check">{item.done?<Check size={15}/>:''}</span><span className="routine-title"><b>{item.title}</b><small>{item.repeat||'daily'} · +{item.xp||20} XP · {item.stat||'DIS'}</small></span></button><button className="row-edit" onClick={()=>openRoutineEditor(item)}>Edit</button></div>)}</div></div>}

function StudyPage({grades,newGrade,setNewGrade,addGrade,openGradeEditor,module,setModule,boss,prepareBoss,attemptBoss,studySessions,studyDraft,setStudyDraft,addStudySession,deleteStudySession,stats,setActive}){
 const relevantGrades=grades.filter(g=>g.module===module.name||g.module==='Current Module')
 const quizScores=relevantGrades.length?relevantGrades:grades
 const quizAvg=quizScores.length?Math.round(quizScores.reduce((sum,g)=>sum+Number(g.score||0),0)/quizScores.length):0
 const latestQuiz=quizScores.length?quizScores[quizScores.length-1]:null
 const weekKeys=getWeekDateKeys(); const weekStart=weekKeys[0]
 const weekSessions=studySessions.filter(x=>weekKeys.includes(x.date))
 const totalMinutes=weekSessions.reduce((sum,x)=>sum+Number(x.minutes||0),0)
 const totalHours=totalMinutes/60
 const maxDay=Math.max(60,...weekKeys.map(k=>weekSessions.filter(x=>x.date===k).reduce((sum,x)=>sum+Number(x.minutes||0),0)))
 const rewardStatus=STUDY_REWARD_TIERS.map(t=>({tier:t,reached:totalHours>=t.hours}))
 const fmtHours=(m)=>{const h=Math.floor(m/60),min=m%60;return min?(h+'h '+min+'m'):h+'h'}
 return <div className="content archive-page">
  <button className="ghost location-back" onClick={()=>setActive('map')}><ChevronLeft size={16}/> Back to World Map</button>
  <PageIntro eyebrow="GRAND ARCHIVE" title="Medical school command center" text="Quizzes become evidence, focused study becomes a real record, and exams become boss battles."/>
  <section className="radiance-hero archive-hero panel"><div><span className="eyebrow">INTELLIGENCE</span><h2>Current Intelligence · {stats?.find(s=>s[0]==='INT')?.[1]||0}</h2><p>The Archive records focused learning, recall, and the steady work of turning information into knowledge.</p></div><div className="radiance-orb archive-orb"><BookOpen size={30} strokeWidth={1.4}/><small>INT</small></div></section>
  <div className="module-header panel"><div><span className="eyebrow">CURRENT MODULE</span><input className="module-name" value={module.name} onChange={e=>setModule({...module,name:e.target.value})}/></div><label>Exam date<input type="date" value={module.examDate} onChange={e=>setModule({...module,examDate:e.target.value})}/></label></div>
  <div className="study-grid"><div className="panel grade-form"><span className="eyebrow">RECORD A QUIZ</span><form onSubmit={addGrade}><input placeholder="Quiz name" value={newGrade.quiz} onChange={e=>setNewGrade({...newGrade,quiz:e.target.value})}/><input type="number" min="0" max="100" placeholder="Score %" value={newGrade.score} onChange={e=>setNewGrade({...newGrade,score:e.target.value})}/><button className="primary">Record Score <Plus size={15}/></button></form></div><div className="panel mastery"><span className="eyebrow">QUIZ TARGET</span><strong>{quizAvg}%</strong><div className="xp-bar"><i style={{width:quizAvg+'%'}}/></div><p>{latestQuiz?latestQuiz.quiz+' · '+latestQuiz.score+'%':'Record a quiz to charge the Warden.'}</p><button className="primary" onClick={prepareBoss} disabled={!quizScores.length}>{boss.active&&!boss.defeated?'Boss Battle Ready':'Prepare for Boss Battle'} <Sword size={15}/></button></div></div>
  {boss.active&&<div className={'boss-panel panel '+(boss.defeated?'defeated':'')}><div><span className="eyebrow">QUIZ-POWERED BOSS · ATTEMPT {boss.attempts}</span><h3>{boss.defeated?'✦ KNOWLEDGE WARDEN DEFEATED':'👹 THE KNOWLEDGE WARDEN'}</h3><p>{boss.defeated?'Module cleared! Your final strike shattered the Warden.':'Your recorded quiz average is '+quizAvg+'%. 85%+ = critical hit · 70–84% = strong hit · below 70% = glancing blow.'}</p>{!boss.defeated&&<div className="boss-hp"><span>HP {boss.hp??1000} / 1000</span><div><i style={{width:((boss.hp??1000)/10)+'%'}}/></div></div>}</div>{!boss.defeated&&<button className="primary" onClick={attemptBoss}>Face Boss <Sword size={15}/></button>}</div>}
  <div className="archive-section study-tracker"><div className="section-head"><div><span className="eyebrow">WEEKLY STUDY LOG</span><h2>Study sessions</h2><p className="muted">Track the real time you spend studying. The week resets every Monday.</p></div><div className="study-week-total"><b>{totalHours.toFixed(1)}h</b><small>this week</small></div></div>
   <form className="study-session-form panel" onSubmit={addStudySession}><label>Date<input type="date" value={studyDraft.date} onChange={e=>setStudyDraft({...studyDraft,date:e.target.value})}/></label><label>Minutes<input type="number" min="10" max="1440" step="5" placeholder="60" value={studyDraft.minutes} onChange={e=>setStudyDraft({...studyDraft,minutes:e.target.value})}/></label><label>What did you study?<input placeholder="Anatomy · bugs · practice questions..." value={studyDraft.subject} onChange={e=>setStudyDraft({...studyDraft,subject:e.target.value})}/></label><label>Note <span className="muted">(optional)</span><input placeholder="Optional note" value={studyDraft.note} onChange={e=>setStudyDraft({...studyDraft,note:e.target.value})}/></label><button className="primary">Log Session <Plus size={15}/></button></form>
   <div className="study-week-grid">{weekKeys.map(key=>{const mins=weekSessions.filter(x=>x.date===key).reduce((sum,x)=>sum+Number(x.minutes||0),0);return <div className="study-day" key={key}><b>{formatStudyDay(key)}</b><div className="study-day-bar"><i style={{height:Math.max(4,Math.round((mins/maxDay)*100))+'%'}}/></div><strong>{fmtHours(mins)}</strong></div>})}</div>
   <div className="study-reward-track"><div className="section-head"><div><span className="eyebrow">WEEKLY SCHOLARSHIP</span><h3>Study more, earn more</h3><p className="muted">Gold rewards are awarded once when you cross each weekly milestone.</p></div></div><div className="study-reward-grid">{rewardStatus.map(({tier,reached})=><div className={'study-reward panel '+(reached?'reached':'')} key={tier.hours}><span>{reached?'✓':'◈'}</span><div><b>{tier.hours} hours</b><small>+{tier.gold} gold · {tier.label}</small></div></div>)}</div></div>
   {weekSessions.length>0&&<div className="study-session-list">{[...weekSessions].sort((a,b)=>b.id-a.id).map(session=><div className="study-session-row panel" key={session.id}><div><b>{session.subject}</b><small>{session.date}{session.note?' · '+session.note:''}</small></div><strong>{fmtHours(Number(session.minutes||0))}</strong><button type="button" className="row-edit" onClick={()=>deleteStudySession(session.id)}>Remove</button></div>)}</div>}
  </div>
  <div className="archive-section"><div className="section-head"><div><span className="eyebrow">QUIZ HISTORY</span><h2>Recorded battles</h2></div></div><div className="grade-list">{grades.map(g=><div className="grade-row panel" key={g.id}><BookOpen size={17}/><span>{g.quiz}<small>{g.module}</small></span><strong className={g.score>=85?'great':g.score>=70?'warning':'needs'}>{g.score}%</strong><button className="row-edit" onClick={()=>openGradeEditor(g)}>Edit</button></div>)}</div></div>

 </div>
}
function BodyPage({workouts,activeWorkout,setActiveWorkout,updateExercise,logWorkout,showWorkoutForm,setShowWorkoutForm,workoutDraft,setWorkoutDraft,addExercise,deleteExercise,setActive,weightJourney,setWeightJourney,stats}){
 const workout=workouts.find(w=>w.id===activeWorkout)||workouts[0]
 const latest=weightJourney.logs[weightJourney.logs.length-1]
 const current=latest?.weight||''
 const start=Number(weightJourney.startWeight)
 const lost=start&&current?Math.max(0,start-Number(current)):0
 const milestone=Math.min(20,Math.floor(lost/5)*5)
 const nextMilestone=Math.min(20,milestone+5)
 const updateMeal=(key,value)=>setWeightJourney(w=>({...w,mealPlan:{...w.mealPlan,[key]:value}}))
 const toggleMeal=(key)=>setWeightJourney(w=>({...w,mealDone:{...w.mealDone,[key]:!w.mealDone[key]}}))
 const logWeight=()=>{const value=Number(document.getElementById('weight-log-input')?.value);if(!value)return;setWeightJourney(w=>({...w,logs:[...w.logs,{date:getESTDateKey(),weight:value}]}));const el=document.getElementById('weight-log-input');if(el)el.value=''}
 return <div className="content wilds-page">
  <button className="ghost location-back" onClick={()=>setActive('map')}><ChevronLeft size={16}/> Back to World Map</button>
  <PageIntro eyebrow="VERDANT WILDS" title="Body & vitality" text="Train, nourish yourself, and track your journey toward your next 5-pound milestone."/>
  <section className="radiance-hero wilds-hero panel"><div><span className="eyebrow">VITALITY</span><h2>Current Vitality · {stats?.find(s=>s[0]==='VIT')?.[1]||0}</h2><p>The Wilds record movement, strength, nourishment, and the repeatable habits that keep your body ready for the road.</p></div><div className="radiance-orb wilds-orb"><Heart size={30} strokeWidth={1.4}/><small>VIT</small></div></section>
  <section className="weight-journey panel"><div className="journey-heading"><div><span className="eyebrow">THE WEIGHT-LOSS JOURNEY</span><h2>20 pounds · 5 pounds at a time</h2><p>Track your trend without letting the scale decide your worth. Weight changes never remove XP.</p></div><span className="journey-badge">STEP {milestone/5+1} / 5</span></div>
   <div className="journey-setup"><label>Starting weight<input type="number" min="1" step=".1" value={weightJourney.startWeight} onChange={e=>setWeightJourney(w=>({...w,startWeight:e.target.value}))}/></label><label>Latest weight<input id="weight-log-input" type="number" min="1" step=".1" placeholder="Log today"/></label><button className="primary" onClick={logWeight}>Log Weight</button></div>
   <div className="milestone-track">{[5,10,15,20].map(n=><div key={n} className={'milestone '+(lost>=n?'reached':'')+(lost<n&&lost>=n-5?' current':'')}><span>−{n}</span><small>{lost>=n?'✓ reached':n===20?'Final goal':'Milestone'}</small></div>)}</div>
   <div className="journey-stats"><div><span>Progress</span><b>{lost?lost.toFixed(1):'0'} lb</b><small>lost</small></div><div><span>Next milestone</span><b>{nextMilestone===milestone?'Goal':nextMilestone+' lb'}</b><small>at a time</small></div><div><span>Check-ins</span><b>{weightJourney.logs.length}</b><small>logged</small></div></div>
  </section>
  <section className="meal-planner panel"><div className="section-head"><div><span className="eyebrow">TODAY'S PROVISIONS</span><h2>Plan your meals</h2></div><span className="muted">{Object.values(weightJourney.mealDone).filter(Boolean).length}/4 checked</span></div><p className="meal-intro">Decide what you're eating before the day gets busy. This is about staying on track, not eating perfectly.</p><div className="meal-grid">{[['breakfast','Breakfast','☀️'],['lunch','Lunch','🥗'],['dinner','Dinner','🌙'],['snack','Planned snack','🍎']].map(([key,label,icon])=><div className={'meal-row '+(weightJourney.mealDone[key]?'done':'')} key={key}><button className="meal-check" onClick={()=>toggleMeal(key)}>{weightJourney.mealDone[key]?'✓':icon}</button><div><b>{label}</b><input value={weightJourney.mealPlan[key]} onChange={e=>updateMeal(key,e.target.value)} placeholder="What are you planning?"/></div></div>)}</div></section>
  <div className="body-grid"><BodyCard icon={Footprints} title="Movement" value="20+ min quest" text="Log a walk or run" onClick={()=>setActive('quests')}/><BodyCard icon={Dumbbell} title="Training" value={workouts.length+' splits'} text="Open your workout book below" onClick={()=>document.querySelector('.workout-book')?.scrollIntoView({behavior:'smooth'})}/><BodyCard icon={Heart} title="Nourishment" value="Protein quest" text="Complete today's balanced-meal quest" onClick={()=>document.querySelector('.meal-planner')?.scrollIntoView({behavior:'smooth'})}/><BodyCard icon={Moon} title="Recovery" value="Tonight" text="Protect your sleep" onClick={()=>setActive('planner')}/></div>
  <section className="workout-book"><div className="section-head"><div><span className="eyebrow">TRAINING GROUNDS</span><h2>Workout splits</h2></div><span className="muted">A PR earns bonus XP</span></div><div className="split-tabs">{workouts.map(w=><button key={w.id} className={w.id===activeWorkout?'active':''} onClick={()=>setActiveWorkout(w.id)}><span>{w.icon}</span>{w.name}</button>)}</div><div className="panel workout-panel"><div className="workout-heading"><div><span className="eyebrow">TODAY'S SPLIT</span><h3>{workout?.name}</h3></div><button className="primary" onClick={()=>setShowWorkoutForm(true)}>+ Add Exercise</button></div><div className="exercise-list">{workout?.exercises.map(ex=><div className="exercise-row" key={ex.id}><div className="exercise-name"><b>{ex.name}</b><small>{ex.sets} sets × {ex.reps} reps · Best {ex.best} lb</small></div><label>Weight (lb)<input type="number" min="0" step="2.5" value={ex.weight} onChange={e=>updateExercise(workout.id,ex.id,'weight',e.target.value)}/></label><button className="primary log-set" onClick={()=>logWorkout(workout.id,ex.id)}>{Number(ex.weight)>Number(ex.best||0)?'Set PR!':'Log Set'}</button><button className="exercise-delete" onClick={()=>deleteExercise(workout.id,ex.id)}><X size={14}/></button></div>)}</div><div className="pr-note"><Trophy size={16}/><span><b>Strength rule:</b> enter the weight you actually used, then log the set. If it beats your previous best, you earn <b>+50 XP +15 gold</b> and VIT grows.</span></div></div></section>
  {showWorkoutForm&&<div className="modal-backdrop" onClick={()=>setShowWorkoutForm(false)}><div className="modal" onClick={e=>e.stopPropagation()}><button className="close" onClick={()=>setShowWorkoutForm(false)}><X/></button><span className="eyebrow">NEW EXERCISE</span><h2>Add to {workout?.name}</h2><form onSubmit={addExercise}><label>Exercise<input autoFocus value={workoutDraft.name} onChange={e=>setWorkoutDraft({...workoutDraft,name:e.target.value})} placeholder="e.g. Bulgarian split squat"/></label><div className="edit-grid"><label>Sets<input type="number" min="1" value={workoutDraft.sets} onChange={e=>setWorkoutDraft({...workoutDraft,sets:e.target.value})}/></label><label>Reps<input type="number" min="1" value={workoutDraft.reps} onChange={e=>setWorkoutDraft({...workoutDraft,reps:e.target.value})}/></label><label>Starting weight<input type="number" min="0" step="2.5" value={workoutDraft.weight} onChange={e=>setWorkoutDraft({...workoutDraft,weight:e.target.value})}/></label></div><button className="primary" type="submit">Add Exercise <Plus size={15}/></button></form></div></div>}
  <div className="gentle-note panel"><Sparkles size={18}/><span><b>The rule of the Verdant Wilds:</b> progress comes from repeatable behaviors. A normal fluctuation in weight never costs XP.</span></div>
 </div>
}

function BodyCard({icon:Icon,title,value,text,onClick}){return <button className="body-card panel" onClick={onClick}><Icon size={24}/><span className="eyebrow">{title}</span><strong>{value}</strong><small>{text}</small><ChevronRight size={15}/></button>}

function MapPage({worlds,setActive,level,inventory,exploredAreas,exploreArea,activeLocation,setActiveLocation,locationProgress,completeLocationQuest,resolveLocationEncounter}){
 const destinations={body:'body',study:'study',life:'planner',glow:'radiance',spirit:'dashboard',explore:'dashboard'}
 const currentArea=EXPLORATION_AREAS.find(a=>a.id===activeLocation)
 if(currentArea&&exploredAreas.includes(currentArea.id))return <LocationPage area={currentArea} progress={locationProgress[currentArea.id]||{}} onBack={()=>setActiveLocation(null)} onQuest={()=>completeLocationQuest(currentArea.id)} onEncounter={i=>resolveLocationEncounter(currentArea.id,i)}/>
 return <div className="content">
  <PageIntro eyebrow="WORLD MAP" title="The Realm of Becoming" text="Choose a destination, adventurer. Click a region on the map to travel there."/>
  <div className="realm-map-wrap panel">
   <div className="map-compass">✦<span>N</span></div>
   <div className="map-title">THE REALM OF BECOMING</div>
   <div className="map-level">HERO LEVEL {level}</div>
   <div className="map-river river-main"/>
   <div className="map-cliff cliff-east"/>
   <div className="map-cliff cliff-north"/>
   <div className="map-field field-one"/><div className="map-field field-two"/><div className="map-field field-three"/>
   <div className="map-path path-one"/><div className="map-path path-two"/><div className="map-path path-three"/>
   <div className="pixel-forest forest-one"><i/><i/><i/><i/><i/></div>
   <div className="pixel-forest forest-two"><i/><i/><i/><i/><i/></div>
   <div className="pixel-forest forest-three"><i/><i/><i/></div>
   <div className="pixel-mountains mountain-one"><i/><i/><i/></div>
   <div className="pixel-mountains mountain-two"><i/><i/><i/><i/></div>
   <div className="pixel-village"><span className="village-banner">ADVENTURER'S KEEP</span><i/><i/><i/><i/><i/><i/><i/><i/></div>
   <div className="pixel-market"><i/><span>MARKET</span></div>
   <div className="pixel-ruins"><i/><i/><span>OLD RUINS</span></div>
   <div className="pixel-camp"><i/><span>YOUR CAMP</span></div>
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
  <div className="map-tip panel"><Compass size={17}/><span><b>Traveler's note:</b> The atlas is incomplete. Find map clues in chests and story encounters, then spend them to open permanent paths.</span></div>
  <section className="exploration-section">
   <div className="section-head"><div><span className="eyebrow">BEYOND THE KNOWN ROADS</span><h2>Hidden places</h2><p className="muted">Your clue is held while you explore. It is only used when you finish the local quest and choose a path.</p></div></div>
   <div className="exploration-grid">{EXPLORATION_AREAS.map(area=>{const explored=exploredAreas.includes(area.id);const key=area.requiredItems.find(item=>inventory.includes(item));return <article className={'exploration-card panel '+(explored?'explored':'')} key={area.id}><div className="exploration-icon">{explored?'✓':area.icon}</div><div className="exploration-copy"><b>{area.name}</b><p>{explored?area.discovery:area.description}</p><small>{explored?'DISCOVERED · '+area.rewardItem:key?'CLUE FOUND · '+key:'NEEDS '+area.requiredItems.map(x=>x.replace(/^\S+\s/, '')).join(' OR ')}</small></div><button className={explored?'ghost':'primary'} disabled={explored?!!locationProgress[area.id]?.discoveryClaimed:!key} onClick={()=>explored?setActiveLocation(area.id):exploreArea(area.id)}>{explored?(locationProgress[area.id]?.discoveryClaimed?'Complete':'Continue') :key?'Explore':'Find clue'}</button></article>})}</div>
  </section>
 </div>
}

function LocationPage({area,progress,onBack,onQuest,onEncounter}){
 const [lineIndex,setLineIndex]=useState(0)
 const resolved=progress.encounterChoice!==undefined
 const selected=resolved?area.encounter.choices[progress.encounterChoice]:null
 const bond=(progress.questDone?1:0)+(resolved?1:0)
 const bondStage=bond>=2?'complete':bond===1?'quest':'new'
 const bondLines=area.bondDialogue?.[bondStage]||[area.dialogue]
 const currentLine=bondLines[lineIndex%bondLines.length]
 const bondLabel=bond===2?'Trusted ally':bond===1?'Growing trust':'New acquaintance'
 return <div className="content location-page">
  <button className="ghost location-back" onClick={onBack}><ChevronLeft size={16}/> Back to World Map</button>
  <section className="location-hero panel">
   <div className={`location-scene scene-${area.id}`} role="img" aria-label={area.name + ' pixel-art environment'}>
    <span className="scene-stars"/><span className="scene-moon"/><span className="scene-ground"/><span className="scene-landmark"/>
   </div>
   <div className="location-heading"><span className="eyebrow">DISCOVERED LOCATION</span><h1>{area.name}</h1><p>{area.discovery}</p><span className="location-npc">✦ {area.npc} is here</span></div>
  </section>
  <section className="location-section panel"><div className="location-bond-head"><div className="location-npc-heading"><div className={`npc-portrait npc-${area.id}`} role="img" aria-label={area.npc + ' pixel-art portrait'}><span/></div><div><span className="eyebrow">A LOCAL VOICE</span><h2>{area.npc}</h2></div></div><span className="location-bond-label">{bondLabel} · {bond}/2</span></div><div className="location-bond-track"><i style={{width:(bond/2*100)+'%'}}/></div><p className="location-dialogue">“{currentLine}”</p><button className="ghost location-talk" onClick={()=>setLineIndex(i=>i+1)}>Talk with {area.npc.split(' ')[0]} again</button><small className="location-note">Your bond grows as you complete the local quest and make your choice. Conversations are always free.</small></section>
  <section className="location-section panel"><span className="eyebrow">LOCAL QUEST</span><h2>{area.quest.title}</h2><p>{area.quest.task}</p><div className="location-reward">Reward: <b>+{area.quest.xp} XP</b> · <b>+{area.quest.gold} gold</b></div>{progress.questDone?<div className="location-complete">✓ Quest completed. The Atlas remembers your effort.</div>:<button className="primary" onClick={onQuest}>I completed this real-life task</button>}<small className="location-note">This is a real-world activity. Completing it counts toward your productivity progress for the Chronicle.</small></section>
  <section className="location-section panel"><span className="eyebrow">STORY ENCOUNTER</span><h2>{area.encounter.title}</h2><p>{area.encounter.body}</p>{resolved?<div className="location-complete">✦ You chose: {selected.label}<br/>Collected: {selected.item}</div>:<div className="location-choices">{area.encounter.choices.map((choice,i)=><button className="ghost" key={choice.label} onClick={()=>onEncounter(i)}>{choice.label}<small>Gain {choice.item} · +{choice.gold} gold</small></button>)}</div>}</section>
 </div>
}

function WorldCard({world,onClick,large=false,locked=false}){const Icon=world.icon;return <button className={'world-card panel '+(large?'large ':'')+(locked?'locked':'')} onClick={onClick} disabled={locked}><div className="world-art"><Icon size={large?38:28}/><span>{world.stat}</span></div><div><h3>{locked?'🔒 ':''}{world.name}</h3><p>{locked?'Unlock at level '+world.unlockLevel:world.desc}</p></div><span className="circle-btn">{locked?'🔒':<ChevronRight size={17}/>}</span></button>}

function getHeroIdentity(stats){
 const values=Object.fromEntries(stats.map(s=>[s[0],s[1]]))
 const pairs=[
  {keys:['INT','DIS'],title:'Scholar',desc:'A deliberate learner who turns knowledge into consistent action.',threshold:16},
  {keys:['VIT','DIS'],title:'Trailblazer',desc:'A steadfast adventurer who thrives by moving forward.',threshold:16},
  {keys:['RAD','SPI'],title:'Radiant',desc:'A reflective hero who turns care and self-expression into strength.',threshold:16},
  {keys:['SPI','INT'],title:'Seeker',desc:'A curious traveler drawn toward hidden meaning and quiet mysteries.',threshold:16}
 ]
 const hybrid=pairs.find(p=>p.keys.every(k=>values[k]>=p.threshold))
 if(hybrid)return hybrid
 const highest=Object.entries(values).sort((a,b)=>b[1]-a[1])[0]?.[0]||'DIS'
 const solo={
  VIT:{title:'Wayfarer',desc:'Your strength is built through movement and endurance.'},
  INT:{title:'Scholar',desc:'Your strength is built through learning and curiosity.'},
  SPI:{title:'Listener',desc:'Your strength is built through reflection and recovery.'},
  DIS:{title:'Steadfast',desc:'Your strength is built through consistency and follow-through.'},
  RAD:{title:'Polished',desc:'Your strength is built through self-care and personal expression.'}
 }
 return solo[highest]
}
function getStatTitle(stat,value){
 const tiers={
  VIT:[[30,'Ironheart'],[20,'Trailblazer'],[10,'Wayfarer']],
  INT:[[30,'Lorekeeper'],[20,'Archivist'],[10,'Scholar']],
  SPI:[[30,'Soulkeeper'],[20,'Stargazer'],[10,'Listener']],
  DIS:[[30,'Iron Will'],[20,'Oathkeeper'],[10,'Steadfast']],
  RAD:[[30,'Luminary'],[20,'Radiant'],[10,'Polished']]
 }
 return (tiers[stat]||[]).find(([min])=>value>=min)?.[1]||'Awakening'
}

function CharacterPage({character,level,xp,gold,stats,openCharacterEditor}){
 const identity=getHeroIdentity(stats)
 const strongest=stats.map(s=>({stat:s[0],value:s[1]})).sort((a,b)=>b.value-a.value)[0]
 return <div className="hero-character-section">
  <div className="character-sheet panel"><div className="sheet-avatar">{character.avatar}</div><div className="sheet-main"><span className="eyebrow">CHARACTER SHEET</span><h2>{character.name}</h2><span className="class-name">{character.className.toUpperCase()} · {character.race.toUpperCase()}</span><div className="hero-identity"><span className="identity-badge">✦ {identity.title}</span><p>{identity.desc}</p></div><p>Your real-life actions shape your adventurer. PRs, quests, study wins, and routines build the stats behind the avatar.</p><div className="sheet-level"><b>Level {level}</b><div className="xp-bar"><i style={{width:Math.min(100,(Math.max(0,xp)/getLevelRequirement(level))*100)+'%'}}/></div><span>{xp} / {getLevelRequirement(level)} XP</span><strong className="sheet-gold">◈ {gold} gold</strong></div><button className="ghost character-edit" onClick={openCharacterEditor}>Edit Character</button></div></div>
  <div className="stat-cards">{stats.map(([label,value,name,Icon])=><div className="panel stat-card" key={label}><Icon/><span>{label}</span><strong>{value}</strong><small>{name} · {getStatTitle(label,value)}</small></div>)}</div>
  <div className="panel character-rules"><span className="eyebrow">YOUR CURRENT BUILD</span><div><b>IDENTITY</b> {identity.title} · {identity.desc}</div><div><b>STRONGEST STAT</b> {strongest.stat} · {getStatTitle(strongest.stat,strongest.value)}</div><div><b>VIT</b> workouts + strength PRs</div><div><b>INT</b> quizzes + focused study</div><div><b>SPI</b> journaling + recovery</div><div><b>DIS</b> routines completed</div><div><b>RAD</b> self-care + personal development</div><small>Your identity is derived from your build and can evolve as your stats change.</small></div>
 </div>
}
function AstralPage({astralState,stats,completeAstralRitual,setActive,setAstralState}){
 const spi=stats.find(s=>s[0]==='SPI')?.[1]||0
 const found=new Set(astralState.signs||[])
 const next=ASTRAL_SIGNS.find(x=>spi>=x.requirement&&!found.has(x.id))
 const gate=spi>=30&&found.size>=3
 function reveal(){if(!next)return;setAstralState(s=>({...s,signs:[...new Set([...(s.signs||[]),next.id])]}));notify('ASTRAL SIGN DISCOVERED · '+next.title)}
 const milestones=[{value:10,title:'First Listening',reward:'The Sanctum begins revealing hidden signs.'},{value:20,title:'Deep Listener',reward:'Rare reflections and alternate story paths begin to appear.'},{value:30,title:'Star-Seeker',reward:'The Celestial Gate can open after three signs are recorded.'}]
 return <div className="content radiance-page astral-page">
  <button className="ghost location-back" onClick={()=>setActive('map')}><ChevronLeft size={16}/> Back to World Map</button>
  <PageIntro eyebrow="ASTRAL SANCTUM" title="Where the quiet roads begin" text="A sanctuary for reflection, recovery, and mysteries that cannot be found by moving faster."/>
  <section className="radiance-hero astral-hero panel"><div><span className="eyebrow">SPIRIT</span><h2>Current Spirit · {spi}</h2><p>The Sanctum records moments when you stop long enough to notice what is underneath the noise.</p></div><div className="radiance-orb astral-orb"><Moon size={28} strokeWidth={1.3}/><small>SPI</small></div></section>
  <section className="radiance-section astral-section"><div className="section-head"><div><span className="eyebrow">TODAY'S RITUALS</span><h2>Four ways to tend the inner road</h2><p className="muted">Each can be completed once per day. They strengthen Spirit without becoming another XP grind.</p></div></div><div className="radiance-task-grid astral-ritual-grid">{ASTRAL_RITUALS.map(r=>{const done=astralState.completed.includes(r.id);return <article className={'panel radiance-task astral-ritual '+(done?'done':'')} key={r.id}><span className="radiance-task-icon astral-icon">{r.icon}</span><div><b>{r.title}</b><p>{r.detail}</p><small>{done?'Completed today':'Reward · +1 SPI if the daily cap allows · +8 gold'}</small></div><button className="primary" disabled={done} onClick={()=>completeAstralRitual(r.id)}>{done?'Tended':'Tend'}</button></article>})}</div></section>
  <section className="radiance-section astral-section"><div className="section-head"><div><span className="eyebrow">ASTRAL SIGNS</span><h2>Read what the Sanctum reveals</h2><p className="muted">Spirit milestones expose clues. You decide when to record them.</p></div></div><div className="radiance-task-grid astral-sign-grid">{ASTRAL_SIGNS.map(s=>{const has=found.has(s.id),ready=spi>=s.requirement;return <article className={'panel radiance-task astral-sign '+(has?'found ':'')+(ready?'ready':'')} key={s.id}><span className="radiance-task-icon astral-sign-icon">{has?s.icon:ready?'✦':'◇'}</span><div><b>{has?s.title:ready?'A sign is waiting':'A distant constellation'}</b><p>{has?s.text:ready?'The Sanctum has noticed something. Record it when you are ready.':'Reach SPI '+s.requirement+' to see what appears here.'}</p><small>{has?'RECORDED · SPI '+s.requirement:ready?'READY TO REVEAL':'SEALED'}</small></div>{ready&&!has&&<button className="ghost" onClick={reveal}>Reveal</button>}</article>})}</div></section>
  <section className="radiance-section astral-section"><div className="section-head"><div><span className="eyebrow">SANCTUM MILESTONES</span><h2>What your Spirit builds toward</h2></div></div><div className="radiance-milestones astral-milestones">{milestones.map(m=><div className={'panel radiance-milestone astral-milestone '+(spi>=m.value?'reached':'')} key={m.value}><span>{spi>=m.value?'✦':'◇'}</span><div><b>SPI {m.value} · {m.title}</b><small>{m.reward}</small></div></div>)}</div></section>
  <section className={'astral-gate panel '+(gate?'open':'')}><div><span className="eyebrow">THE CELESTIAL GATE</span><h2>{gate?'The night road is open.':'A door that does not belong to this world'}</h2><p>{gate?'Three signs have gathered around you. The Gate is now waiting for you.':'The Gate requires SPI 30 and three recorded Astral Signs. It is a long-term mystery, not another daily task.'}</p></div><div className="gate-progress"><b>{Math.min(spi,30)} / 30 SPI</b><small>{Math.min(found.size,3)} / 3 signs</small></div></section>
  <div className="map-tip panel"><Sparkles size={17}/><span><b>The Sanctum keeps secrets:</b> Spirit can now open alternate Atlas choices, reveal clues, and eventually lead beyond the known world.</span></div>
 </div>
}
function RadiancePage({radianceState,stats,completeRadianceTask,setActive}){
 const rad=stats.find(s=>s[0]==='RAD')?.[1]||0
 const tasks=[
  {id:'morning-glow',icon:'🪞',title:'Prepare the Hero',detail:'Do one small grooming or getting-ready ritual that makes you feel put together.'},
  {id:'space-glow',icon:'🕯️',title:'Restore the Keep',detail:'Reset one small personal space so Future You inherits a calmer room or desk.'},
  {id:'joy-glow',icon:'🌷',title:'Choose Something Beautiful',detail:'Spend 10 intentional minutes on something that makes you feel like yourself—music, art, outfit planning, a walk, or connection.'}
 ]
 const milestones=[{value:10,title:'The First Light',reward:'Unlock the Hall’s daily Radiance offerings.'},{value:20,title:'Radiant Adventurer',reward:'Future cosmetic and social rewards begin to appear.'},{value:30,title:'Luminary',reward:'Unlocks a special Radiance route in the world.'}]
 return <div className="content radiance-page">
  <button className="ghost location-back" onClick={()=>setActive('map')}><ChevronLeft size={16}/> Back to World Map</button>
  <PageIntro eyebrow="HALL OF RADIANCE" title="A place to become visible to yourself" text="Radiance is not perfection. It is the practice of caring for yourself, your surroundings, and the parts of life that make you feel like you."/>
  <section className="radiance-hero panel"><div><span className="eyebrow">RADIANCE</span><h2>Current Radiance · {rad}</h2><p>The Hall records small acts of self-respect. They do not need to be productive to count.</p></div><div className="radiance-orb"><Sparkles size={28} strokeWidth={1.3}/><small>RAD</small></div></section>
  <section className="radiance-section"><div className="section-head"><div><span className="eyebrow">TODAY'S OFFERINGS</span><h2>Three ways to tend your light</h2><p className="muted">Each offering can be completed once per day. No XP grind—just a small stat reward and a little gold.</p></div></div><div className="radiance-task-grid">{tasks.map(task=>{const done=radianceState.completed.includes(task.id);return <article className={'panel radiance-task '+(done?'done':'')} key={task.id}><span className="radiance-task-icon">{task.icon}</span><div><b>{task.title}</b><p>{task.detail}</p><small>{done?'Completed today':'Reward · +1 RAD if the daily cap allows · +10 gold'}</small></div><button className="primary" disabled={done} onClick={()=>completeRadianceTask(task.id)}>{done?'Tended':'Tend'}</button></article>})}</div></section>
  <section className="radiance-section"><div className="section-head"><div><span className="eyebrow">HALL MILESTONES</span><h2>What your Radiance builds toward</h2></div></div><div className="radiance-milestones">{milestones.map(m=><div className={'panel radiance-milestone '+(rad>=m.value?'reached':'')} key={m.value}><span>{rad>=m.value?'✦':'◇'}</span><div><b>RAD {m.value} · {m.title}</b><small>{m.reward}</small></div></div>)}</div></section>
  <div className="map-tip panel"><Crown size={17}/><span><b>The Hall's future:</b> later phases can turn Radiance into cosmetics, social encounters, special titles, and story choices without making appearance or self-care a requirement for the main Atlas.</span></div>
 </div>
}

function HeroPage({character,level,xp,gold,stats,openCharacterEditor,rewards,buyReward,rollMysteryChest,companions,inventory,achievements,attuneRelic,companionBonds,companionUses,callCompanion}){
 return <div className="content hero-page"><PageIntro eyebrow="YOUR ADVENTURER" title="The Hero's Hall" text="Your character, growing strengths, treasures, companions, and real-life rewards—all in one place."/><CharacterPage character={character} level={level} xp={xp} gold={gold} stats={stats} openCharacterEditor={openCharacterEditor}/><InventoryPage gold={gold} rewards={rewards} buyReward={buyReward} rollMysteryChest={rollMysteryChest} companions={companions} inventory={inventory} achievements={achievements} attuneRelic={attuneRelic} companionBonds={companionBonds} companionUses={companionUses} callCompanion={callCompanion}/></div>
}

function InventoryPage({gold,rewards,buyReward,rollMysteryChest,companions,inventory,achievements,attuneRelic,companionBonds,companionUses,callCompanion}){const relics=[...new Set(inventory.filter(item=>RELIC_INFO[item]))];const earned=achievements.map(id=>ACHIEVEMENT_INFO[id]||EXTRA_ACHIEVEMENTS[id]).filter(Boolean);return <div className="hero-inventory-section"><PageIntro eyebrow="ADVENTURER'S GUILD" title="Rewards & treasures" text="Gold buys real-life rewards. Mystery treasures, companions, and achievements make the journey fun."/><div className="reward-grid">{rewards.map(r=><div className="panel reward-card" key={r.name}><span className="reward-icon">{r.icon}</span><h3>{r.name}</h3><span>◈ {r.cost} gold</span><button className="primary" disabled={gold<r.cost} onClick={()=>buyReward(r)}>{gold<r.cost?'Need more gold':'Claim reward'}</button></div>)}<div className="panel reward-card mystery-card"><span className="reward-icon">🎁</span><h3>Mystery Chest</h3><span>◈ 100 gold</span><button className="primary" disabled={gold<100} onClick={rollMysteryChest}>Open Chest</button></div></div><section className="treasure-section"><div className="section-head"><div><span className="eyebrow">COLLECTION</span><h2>Your treasures</h2></div></div><div className="collection-grid"><div className="panel collection-card companion-collection"><b>🐾 Companions</b><strong>{companions.length}</strong><small>{companions.length?'Your companions are growing alongside you.':'No companion yet.'}</small>{companions.map(id=>{const info=COMPANION_INFO[id];if(!info)return null;const used=companionUses[id]===getESTDateKey();return <div className="companion-mini" key={id}><span>{info.icon}</span><div><b>{info.name}</b><small>{info.title} · Bond {companionBonds[id]||0}</small><p>{info.personality}</p><em>{info.passive}</em><button className="secondary" disabled={used} onClick={()=>callCompanion(id)}>{used?'Used today':'Call companion'}</button></div></div>})}</div><div className="panel collection-card"><b>🎒 Items</b><strong>{inventory.length}</strong><small>{inventory.length?inventory.join(' · '):'Your inventory is waiting.'}</small></div><div className="panel collection-card achievements-card"><b>🏆 Achievements</b><strong>{earned.length}/{Object.keys({...ACHIEVEMENT_INFO,...EXTRA_ACHIEVEMENTS}).length}</strong><div className="achievement-list">{Object.entries({...ACHIEVEMENT_INFO,...EXTRA_ACHIEVEMENTS}).map(([id,a])=><span key={id} className={achievements.includes(id)?'earned':'locked'}>{a.icon} <b>{a.name}</b><small>{achievements.includes(id)?a.desc:'Locked achievement'}</small></span>)}</div></div></div></section><section className="relic-section"><div className="section-head"><div><span className="eyebrow">ATTUNEMENT</span><h2>Relics with a purpose</h2><p className="muted">Some story treasures can be attuned instead of merely collected. Each one becomes a permanent part of your hero.</p></div></div><div className="relic-grid">{relics.length?relics.map(item=>{const relic=RELIC_INFO[item];return <article className="panel relic-card" key={item}><div className="relic-icon">{relic.icon}</div><div><b>{relic.name}</b><p>{relic.desc}</p><small>+{relic.amount} {relic.statName}</small></div><button className="primary" onClick={()=>attuneRelic(item)}>Attune</button></article>}):<div className="panel relic-empty">Story relics will appear here as the Atlas entrusts them to you.</div>}</div></section></div>}


function RealmPage({level,stats,timeLabel,isNight,town,upgradeTown,questChains,completeChainStep,realmBosses,strikeRealmBoss,equipment,equipmentCatalog,buyEquipment,equipItem,companions,discoveries,discoverRealm,setActive,inventory,exploredAreas,exploreArea,activeLocation,setActiveLocation,locationProgress,completeLocationQuest,resolveLocationEncounter}){
 const statValue=key=>stats.find(s=>s[0]===key)?.[1]||0
 const meetsStatRequirement=requirements=>{const entries=Object.entries(requirements||{});return entries.length>0&&entries.every(([key,min])=>statValue(key)>=min)}
 const formatStatRequirement=requirements=>Object.entries(requirements||{}).map(([key,min])=>key+' '+min).join(' + ')
 const buildings=[['guild','🏛️','Adventurer Guild','Unlocks new quests & Discipline'],['tavern','🍵','Moonlit Tavern','Rest, dialogue & Spirit'],['garden','🌿','Healing Garden','Vitality training'],['library','📚','Grand Library','Intelligence training']]
 const places=Object.entries(DISCOVERY_INFO)
 const currentArea=EXPLORATION_AREAS.find(a=>a.id===activeLocation)
 if(currentArea&&exploredAreas.includes(currentArea.id))return <LocationPage area={currentArea} progress={locationProgress[currentArea.id]||{}} onBack={()=>setActiveLocation(null)} onQuest={()=>completeLocationQuest(currentArea.id)} onEncounter={i=>resolveLocationEncounter(currentArea.id,i)}/>
 return <div className="content realm-page">
  <PageIntro eyebrow="THE LIVING WORLD" title="The Realm of Becoming" text="One living map for your entire adventure. The Keep, familiar regions, discoveries, hidden locations, and future roads all belong to the same world."/>
  <div className={'realm-banner panel '+(isNight?'night':'')}><div><span className="eyebrow">{timeLabel}</span><h2>Adventurer's Keep · Level {town.level}</h2><p>The realm changes with you. New places appear on the Atlas as you discover them, and hidden roads remain here for the rest of the journey.</p></div><div className="realm-level">HERO LVL <b>{level}</b></div></div>
  <section className="realm-section world-atlas-section">
   <div className="section-head"><div><span className="eyebrow">THE WORLD ATLAS</span><h2>Every road leads somewhere</h2><p className="muted">Known regions are always here. Discoveries and hidden places are added to the map as you find them.</p></div></div>
   <div className="realm-map-wrap panel">
    <div className="map-compass">✦<span>N</span></div><div className="map-title">THE REALM OF BECOMING</div><div className="map-level">HERO LEVEL {level}</div>
    <div className="map-river river-main"/><div className="map-cliff cliff-east"/><div className="map-cliff cliff-north"/>
    <div className="map-field field-one"/><div className="map-field field-two"/><div className="map-field field-three"/>
    <div className="map-path path-one"/><div className="map-path path-two"/><div className="map-path path-three"/>
    <div className="pixel-forest forest-one"><i/><i/><i/><i/><i/></div><div className="pixel-forest forest-two"><i/><i/><i/><i/><i/></div><div className="pixel-forest forest-three"><i/><i/><i/></div>
    <div className="pixel-mountains mountain-one"><i/><i/><i/></div><div className="pixel-mountains mountain-two"><i/><i/><i/><i/></div>
    <div className="pixel-village"><span className="village-banner">ADVENTURER'S KEEP</span><i/><i/><i/><i/><i/><i/><i/><i/></div><div className="pixel-market"><i/><span>MARKET</span></div><div className="pixel-ruins"><i/><i/><span>OLD RUINS</span></div><div className="pixel-camp"><i/><span>YOUR CAMP</span></div>
    {WORLDS.map(w=>{const unlocked=level>=(w.unlockLevel||1);const destinations={body:'body',study:'study',life:'planner',glow:'radiance',spirit:'astral',explore:'map'};return <button key={w.id} className={'map-zone map-zone-'+w.id+(unlocked?'':' locked')} disabled={!unlocked} onClick={()=>unlocked&&setActive(destinations[w.id]||'dashboard')} title={unlocked?w.desc:'Unlock at level '+w.unlockLevel}><span className="map-zone-icon">{w.id==='body'?'🌲':w.id==='study'?'📚':w.id==='spirit'?'🔮':w.id==='glow'?'✨':w.id==='life'?'🏰':'🧭'}</span><strong>{unlocked?'':'🔒 '}{w.name}</strong><small>{unlocked?w.desc:'Level '+w.unlockLevel}</small></button>})}
    {places.map(([id,place],index)=>{const found=discoveries.includes(id);const statReady=meetsStatRequirement(place.statRequirement);const locked=level<place.level&&!statReady&&!found;const positions=[{left:'13%',top:'59%'},{left:'86%',top:'25%'},{left:'72%',top:'67%'},{left:'30%',top:'77%'},{left:'48%',top:'18%'},{left:'18%',top:'37%'},{left:'79%',top:'43%'},{left:'54%',top:'78%'},{left:'36%',top:'55%'},{left:'88%',top:'55%'}];const pos=positions[index]||{left:(20+((index*17)%65))+'%',top:(20+((index*23)%58))+'%'};return <button key={id} className={'map-discovery-marker '+(found?'found':'')+(locked?' locked':'')} style={pos} disabled={locked||found} onClick={()=>discoverRealm(id)} title={found?place.name:statReady?'Discover '+place.name+' via '+formatStatRequirement(place.statRequirement):'Discover '+place.name}><span>{locked?'🔒':place.icon}</span><b>{place.name}</b><small>{found?'Discovered':'Lv '+place.level}</small></button>})}
    {EXPLORATION_AREAS.map((area,index)=>{const explored=exploredAreas.includes(area.id);const key=area.requiredItems.find(item=>inventory.includes(item));const statReady=meetsStatRequirement(area.statRequirement);const sealed=level<(area.requiredLevel||1)&&!statReady;const positions=[{left:'23%',top:'30%'},{left:'61%',top:'36%'},{left:'86%',top:'70%'},{left:'16%',top:'78%'},{left:'73%',top:'16%'},{left:'43%',top:'88%'}];const pos=positions[index]||{left:(15+((index*19)%70))+'%',top:(20+((index*29)%62))+'%'};return <button key={area.id} className={'map-exploration-marker '+(explored&&!sealed?'found':'')+((sealed||(!explored&&!key))?'locked':'')} style={pos} disabled={sealed||(!explored&&!key)} onClick={()=>explored?setActiveLocation(area.id):exploreArea(area.id)} title={sealed?area.name+' · unlocks at level '+area.requiredLevel+' or '+formatStatRequirement(area.statRequirement):explored?'Enter '+area.name:key?'Explore '+area.name:'Find clue for '+area.name}><span>{sealed?'🔒':explored?'✓':key?'❔':'🔒'}</span><b>{area.name}</b><small>{sealed?'Lv '+area.requiredLevel+' / '+formatStatRequirement(area.statRequirement):explored?'Enter':key?'Clue found':'Hidden'}</small></button>})}
    <div className="map-legend"><span><i className="legend-dot unlocked-dot"/>Known</span><span><i className="legend-dot locked-dot"/>Locked</span><span>New discoveries appear here permanently</span></div>
   </div>
   <div className="map-tip panel"><Compass size={17}/><span><b>The Atlas grows with you:</b> discoveries are permanent, hidden locations appear when you find their clues, and future map entries can be added without changing the map system.</span></div>
  </section>
  <section><div className="section-head"><div><span className="eyebrow">YOUR TOWN</span><h2>Build the Keep</h2></div><span className="muted">Upgrades permanently improve your hero</span></div><div className="town-grid">{buildings.map(([id,icon,name,desc])=>{const lvl=town.buildings[id]||0;const cost=100+lvl*75;return <div className="town-building panel" key={id}><div className="town-icon">{icon}</div><div><b>{name}</b><small>{desc}</small><span>Level {lvl}</span></div><button className="primary" onClick={()=>upgradeTown(id)}>Upgrade · {cost} ◈</button></div>})}</div></section>
  <section className="realm-section"><div className="section-head"><div><span className="eyebrow">DISCOVERIES</span><h2>Places you have found</h2><p className="muted">These landmarks are part of the world now. Future discoveries will automatically join this list.</p></div></div><div className="discovery-grid">{places.map(([id,place])=>{const found=discoveries.includes(id);const statReady=meetsStatRequirement(place.statRequirement);const locked=level<place.level&&!statReady&&!found;return <button className={'discovery-card panel '+(found?'found ':'')+(locked?'locked':'')} key={id} disabled={locked||found} onClick={()=>discoverRealm(id)}><span>{locked?'🔒':place.icon}</span><div><b>{place.name}</b><small>{found?place.reward:locked?'Requires Hero Level '+place.level+' or '+formatStatRequirement(place.statRequirement):statReady&&place.statRequirement?'Stat route available · '+formatStatRequirement(place.statRequirement):place.desc}</small></div><strong>{found?'✓':locked?'LVL '+place.level:'+ Discover'}</strong></button>})}</div></section>
  <section className="exploration-section"><div className="section-head"><div><span className="eyebrow">BEYOND THE KNOWN ROADS</span><h2>Hidden places</h2><p className="muted">Clues are held while you explore. A place becomes permanently marked when you finish both its real-life quest and its story encounter.</p></div></div><div className="exploration-grid">{EXPLORATION_AREAS.map(area=>{const explored=exploredAreas.includes(area.id);const key=area.requiredItems.find(item=>inventory.includes(item));const statReady=meetsStatRequirement(area.statRequirement);const sealed=level<(area.requiredLevel||1)&&!statReady;return <article className={'exploration-card panel '+(explored&&!sealed?'explored':'')} key={area.id}><div className="exploration-icon">{sealed?'🔒':explored?'✓':area.icon}</div><div className="exploration-copy"><b>{area.name}</b><p>{sealed?'The Atlas has sealed this road again. It will return when you reach Hero Level '+area.requiredLevel+' or '+formatStatRequirement(area.statRequirement)+'.':explored?area.discovery:area.description}</p><small>{sealed?'SEALED · LV '+area.requiredLevel+' OR '+formatStatRequirement(area.statRequirement):explored?'DISCOVERED · '+area.rewardItem:key?'CLUE FOUND · '+key:'NEEDS '+area.requiredItems.map(x=>x.replace(/^\S+\s/,'')).join(' OR ')}</small></div><button className={explored?'ghost':'primary'} disabled={sealed||(explored?!!locationProgress[area.id]?.discoveryClaimed:!key)} onClick={()=>explored?setActiveLocation(area.id):exploreArea(area.id)}>{sealed?'Sealed':explored?(locationProgress[area.id]?.discoveryClaimed?'Complete':'Continue'):key?'Explore':'Find clue'}</button></article>})}</div></section>
  {discoveries.includes('starlit-grove')&&<section className="realm-section discovered-npc panel"><div className="section-head"><div><span className="eyebrow">NEW ARRIVAL</span><h2>Lyra the Stargazer</h2><p>Finding the Starlit Grove brought a new face to the realm.</p></div><span className="npc-avatar">🌌</span></div><div className="npc-speech">“{NPC_DIALOGUE['Lyra the Stargazer'][0]}”</div></section>}
  {discoveries.includes('market-square')&&<section className="realm-section"><div className="section-head"><div><span className="eyebrow">MARKET SQUARE · UNLOCKED</span><h2>Traveling Market</h2><p className="muted">New gear becomes available after you discover the market.</p></div></div><div className="equipment-grid">{equipmentCatalog.map(item=>{const owned=equipment.owned.includes(item.id);const equipped=equipment.equipped[item.slot]===item.id;return <div className="panel equipment-card" key={item.id}><span className="reward-icon">{item.icon}</span><h3>{item.name}</h3><p>{item.desc}</p><small>+{Object.entries(item.bonus).map(([k,v])=>v+' '+k).join(' · ')}</small><small>{item.requirements?'Requires '+formatStatRequirement(item.requirements):'No stat requirement'}</small>{owned?<button className="ghost" onClick={()=>equipItem(item)}>{equipped?'Unequip':'Equip'}</button>:<button className="primary" disabled={!meetsStatRequirement(item.requirements)||gold<item.cost} onClick={()=>buyEquipment(item)}>{!meetsStatRequirement(item.requirements)?'Need '+formatStatRequirement(item.requirements):'Buy · '+item.cost+' ◈'}</button>}</div>})}</div></section>}
 </div>
}

function StoryPage({campaign,storyEncounter,resolveStoryChoice,setActive,villagerQuests,stats}){
 const completedVillagers=[...new Set((villagerQuests?.completed||[]).map(id=>{const m=id.match(/^(mira-the-healer|tomas-the-scholar|pip-the-trainer|elara-the-tailor|rowan-the-gardener|nessa-the-innkeeper)-/);return m?m[1]:null}).filter(Boolean))]
 const villagerNames={'mira-the-healer':'Mira the Healer','tomas-the-scholar':'Tomas the Scholar','pip-the-trainer':'Pip the Trainer','elara-the-tailor':'Elara the Tailor','rowan-the-gardener':'Rowan the Gardener','nessa-the-innkeeper':'Nessa the Innkeeper'}
 const villagerWhispers={'mira-the-healer':'Mira quietly reminds Lyra that no road is worth walking if the traveler breaks along the way.','tomas-the-scholar':'Tomas has started copying Atlas symbols into his Chronicle, convinced the missing roads may be a language rather than a map.','pip-the-trainer':'Pip has been repairing the old trail markers. He swears the roads are stretching when no one is looking.','elara-the-tailor':'Elara has begun sewing tiny silver road-lines into travelers’ satchels, calling it “practical preparation.”','rowan-the-gardener':'Rowan has noticed unfamiliar flowers along the old roads and is saving their seeds for the Keep.','nessa-the-innkeeper':'Nessa keeps hearing travelers mention the same impossible places in her tavern, so she has started a list behind the counter.'}
 const villagerWhisper=completedVillagers.length?villagerWhispers[completedVillagers[completedVillagers.length-1]]:''
 const currentVillagerNames=completedVillagers.map(id=>villagerNames[id]).join(', ')

 const choices=[...(campaign.choices||[])].reverse()
 const chapterNames={1:'The Missing Keeper',2:'Roads Beneath the Stars',3:'The Keeper’s Echo',4:'The Horizon Beyond',5:'The World Behind the Map',6:'The Many Keepers',7:'The Roadwarden’s Era',8:'The Living Atlas'}
 const earned=campaign.productivity||{xp:0,quests:0}
 const xpProgress=Math.min(100,(earned.xp||0))
 const questProgress=Math.min(100,((earned.quests||0)/3)*100)
 const unlocked=(earned.xp||0)>=100&&(earned.quests||0)>=3
 const displayChoices=getStoryChoices(storyEncounter,stats||[])
 return <div className="content realm-page">
  <PageIntro eyebrow="CAMPAIGN JOURNAL" title="The Shattered Atlas" text="An enchanted atlas is breaking apart. Its roads, memories, and hidden places are disappearing—and Lyra the Stargazer believes you can help uncover why."/>
  <div className="realm-banner panel"><div><span className="eyebrow">CURRENT CHAPTER</span><h2>Chapter {campaign.chapter||1} · {chapterNames[campaign.chapter||1]||'Beyond the Known Atlas'}</h2><p>Every decision is remembered. Your path shapes Lyra’s trust, the Keep’s reputation, and which clues the Atlas reveals next.</p></div><div className="realm-level">✦ <b>{campaign.relationship||0}</b><small>Lyra bond</small></div></div>
  <div className="stat-cards">
   <div className="panel stat-card"><Sparkles/><span>LYRA BOND</span><strong>{campaign.relationship||0}</strong><small>Trust built through choices</small></div>
   <div className="panel stat-card"><Crown/><span>KEEP REPUTATION</span><strong>{campaign.reputation||0}</strong><small>How the realm sees your actions</small></div>
   <div className="panel stat-card"><Map/><span>STORY CHOICES</span><strong>{choices.length}</strong><small>Decisions preserved in your journal</small></div>
  </div>
  <section className="realm-section">
   <div className="section-head"><div><span className="eyebrow">CURRENT ENCOUNTER</span><h2>{storyEncounter?storyEncounter.title:'The stars are quiet… for now'}</h2></div><span className="muted">{storyEncounter?'Lyra may return after a little time':'Unlock the Starlit Grove to begin Lyra’s campaign'}</span></div>
   {storyEncounter?<div className="panel quest-chain-card"><p>{storyEncounter.body}</p>{villagerWhisper&&<div className="story-villager-whisper"><span className="eyebrow">FROM THE KEEP</span><p>{villagerWhisper}</p><small>{currentVillagerNames} has become part of the Atlas’s wider story.</small></div>}{storyEncounter.resolved?<div className="chain-complete-line"><b>✦ {storyEncounter.selectedChoice}</b><small>{storyEncounter.epilogue}</small></div>:<><div className="story-requirements"><span className="eyebrow">YOUR PROGRESS UNLOCKS THE STORY</span><h3>{unlocked?'The Atlas recognizes your efforts':'The Atlas is waiting for proof of your efforts'}</h3><p>Earn {earned.xp||0}/100 productivity XP and complete {earned.quests||0}/3 quests. Both goals are required.</p><div className="xp-bar"><i style={{width:xpProgress+'%'}}/></div><small>{Math.max(0,100-(earned.xp||0))} XP remaining · {Math.max(0,3-(earned.quests||0))} quests remaining</small><div className="xp-bar"><i style={{width:questProgress+'%'}}/></div><small>Only XP from completed journal quests, daily quests, and routines counts. Story rewards, discoveries, and random encounters do not count.</small></div>{displayChoices.map((choice,i)=>{const statLocked=choice.statRequirement&&!choice.statReady;return <div className={'chain-step '+(choice.statRoute?'story-stat-route':'')} key={i}><h3>{choice.statRoute?'✦ ':''}{choice.label}</h3>{choice.statRoute&&<span className="story-stat-badge">{statLocked?'Requires ':'Unlocked · '}{formatStoryStatRequirement(choice.statRequirement)}</span>}<p>Reward: +{choice.reward?.xp||0} XP · +{choice.reward?.gold||0} gold{choice.reward?.item?' · '+choice.reward.item:''}</p><button className="primary" disabled={!unlocked||statLocked} onClick={()=>resolveStoryChoice(choice)}>{!unlocked?'Complete your goals to unlock':statLocked?'Grow your stats to unlock':choice.statRoute?'Take the stat path':'Choose this path'}</button></div>})}</>}</div>:<div className="panel quest-chain-card"><p>Lyra’s story begins once you discover the Starlit Grove. After that, she will return with new clues every few days. Unresolved encounters stay available until you make your choice.</p><button className="ghost" onClick={()=>setActive('map')}>Visit the Realm</button></div>}
  </section>
  <section className="quest-chains-section"><div className="section-head"><div><span className="eyebrow">THE PATH YOU HAVE CHOSEN</span><h2>Campaign journal</h2></div></div>
   {choices.length?choices.map((entry,i)=><div className="panel chain-step" key={entry.date+'-'+i}><span className="eyebrow">{entry.date} · {entry.title}</span><h3>{entry.choice}</h3></div>):<div className="panel quest-chain-card"><p>Your first decision is waiting in the Starlit Grove.</p></div>}
  </section>
  <div className="map-tip panel"><Compass size={17}/><span><b>Campaign rule:</b> choices can open different clues and relationships, but no single decision permanently blocks the main story.</span></div>
 </div>
}

function PageIntro({eyebrow,title,text,action,onAction}){return <div className="page-intro"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2><p>{text}</p></div>{action&&<button className="primary" onClick={onAction}>{action}</button>}</div>}