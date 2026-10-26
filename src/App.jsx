import { useMemo, useState } from 'react'
import {
  Backpack, BookOpen, Check, ChevronRight, CircleHelp, Compass, Crown,
  Flame, Heart, Map, ScrollText, Shield, Sparkles, Sword, Trophy, UserRound, X
} from 'lucide-react'

const initialQuests = [
  { id: 1, title: 'Morning Expedition', subtitle: 'Move your body for 20+ minutes', xp: 40, gold: 12, type: 'body', done: false },
  { id: 2, title: 'Arcane Study', subtitle: 'Complete one focused study block', xp: 55, gold: 15, type: 'mind', done: true },
  { id: 3, title: 'Nourish the Hero', subtitle: 'Have a balanced meal with protein', xp: 30, gold: 8, type: 'body', done: false },
  { id: 4, title: 'Campfire Reflection', subtitle: 'Journal for 5 minutes before bed', xp: 25, gold: 7, type: 'spirit', done: false },
]

const worlds = [
  { name: 'Verdant Wilds', desc: 'Strength, movement & vitality', icon: Heart, stat: 'VIT', locked: false },
  { name: 'Grand Archive', desc: 'Medical school & knowledge', icon: BookOpen, stat: 'INT', locked: false },
  { name: 'Astral Sanctum', desc: 'Mind, spirit & reflection', icon: Sparkles, stat: 'SPI', locked: false },
  { name: 'Hall of Radiance', desc: 'Glow-up & self-care', icon: Crown, stat: 'RAD', locked: true },
  { name: 'Adventurer’s Keep', desc: 'Routines & real-life systems', icon: Shield, stat: 'DIS', locked: true },
  { name: 'Unknown Lands', desc: 'Exploration & new experiences', icon: Compass, stat: 'EXP', locked: true },
]

function App() {
  const [quests, setQuests] = useState(initialQuests)
  const [xp, setXp] = useState(245)
  const [gold, setGold] = useState(86)
  const [active, setActive] = useState('dashboard')
  const [showQuest, setShowQuest] = useState(false)
  const [newQuest, setNewQuest] = useState('')
  const [toast, setToast] = useState('')

  const level = Math.floor(xp / 250) + 1
  const currentLevelXp = xp % 250
  const progress = (currentLevelXp / 250) * 100
  const completed = quests.filter(q => q.done).length

  const stats = useMemo(() => [
    ['VIT', 7, 'Vitality', Heart],
    ['INT', 12, 'Intelligence', BookOpen],
    ['SPI', 9, 'Spirit', Sparkles],
    ['RAD', 6, 'Radiance', Crown],
    ['DIS', 8, 'Discipline', Shield],
  ], [])

  function finishQuest(id) {
    const quest = quests.find(q => q.id === id)
    if (!quest || quest.done) return
    setQuests(qs => qs.map(q => q.id === id ? { ...q, done: true } : q))
    setXp(v => v + quest.xp)
    setGold(v => v + quest.gold)
    setToast('Quest complete! +' + quest.xp + ' XP · +' + quest.gold + ' gold')
    setTimeout(() => setToast(''), 2600)
  }

  function addQuest(e) {
    e.preventDefault()
    if (!newQuest.trim()) return
    setQuests(q => [...q, {
      id: Date.now(), title: newQuest.trim(), subtitle: 'A custom quest from your adventurer’s journal',
      xp: 25, gold: 5, type: 'custom', done: false
    }])
    setNewQuest('')
    setShowQuest(false)
  }

  const nav = [
    ['dashboard', 'Camp', Sword],
    ['quests', 'Quests', ScrollText],
    ['map', 'World Map', Map],
    ['character', 'Character', UserRound],
    ['inventory', 'Inventory', Backpack],
  ]

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark">✦</div><div><strong>Life RPG</strong><span>YOUR ADVENTURE</span></div></div>
        <div className="player-mini">
          <div className="avatar">🧙‍♀️</div>
          <div><strong>Shruti</strong><span>Level {level} Adventurer</span></div>
        </div>
        <nav>{nav.map(([id, label, Icon]) =>
          <button key={id} className={active === id ? 'active' : ''} onClick={() => setActive(id)}>
            <Icon size={17}/><span>{label}</span>{active === id && <ChevronRight size={15}/>}
          </button>
        )}</nav>
        <div className="sidebar-bottom"><div className="mini-tip"><Sparkles size={16}/><div><b>Daily blessing</b><span>Small steps become legendary.</span></div></div><small>v0.1 · The First Chapter</small></div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div><span className="eyebrow">MONDAY · THE ADVENTURE BEGINS</span><h1>{active === 'dashboard' ? 'Welcome back, Adventurer.' : nav.find(n => n[0] === active)?.[1]}</h1></div>
          <div className="top-actions"><div className="currency">◈ <b>{gold}</b></div><div className="level-pill"><span>LVL</span><b>{level}</b></div></div>
        </header>

        {active === 'dashboard' && <Dashboard quests={quests} stats={stats} xp={xp} progress={progress} completed={completed} finishQuest={finishQuest} setShowQuest={setShowQuest} worlds={worlds} />}
        {active === 'quests' && <QuestPage quests={quests} finishQuest={finishQuest} setShowQuest={setShowQuest} />}
        {active === 'map' && <MapPage worlds={worlds} />}
        {active === 'character' && <CharacterPage level={level} xp={xp} stats={stats} />}
        {active === 'inventory' && <InventoryPage gold={gold} />}

        {showQuest && <div className="modal-backdrop" onClick={() => setShowQuest(false)}><div className="modal" onClick={e => e.stopPropagation()}><button className="close" onClick={() => setShowQuest(false)}><X/></button><span className="eyebrow">NEW QUEST</span><h2>Add a quest to your journal</h2><form onSubmit={addQuest}><input autoFocus value={newQuest} onChange={e => setNewQuest(e.target.value)} placeholder="e.g. Walk to class instead of taking the bus" /><button className="primary" type="submit">Accept Quest <Sword size={16}/></button></form></div></div>}
        {toast && <div className="toast"><Trophy size={18}/><span>{toast}</span></div>}
      </main>
    </div>
  )
}

function Dashboard({ quests, stats, xp, progress, completed, finishQuest, setShowQuest, worlds }) {
  return <div className="content">
    <section className="hero-grid">
      <div className="hero-card panel">
        <div className="hero-copy"><span className="eyebrow">CURRENT QUESTLINE</span><h2>Become the hero<br/><em>of your own story.</em></h2><p>Build your body, sharpen your mind, tend your spirit, and make ordinary days feel like an adventure.</p><button className="primary" onClick={() => document.querySelector('.quest-list')?.scrollIntoView({behavior:'smooth'})}>Continue Adventure <ChevronRight size={17}/></button></div>
        <div className="hero-orb"><div className="pixel-sun">✦</div><div className="mountain m1"/><div className="mountain m2"/></div>
      </div>
      <div className="character-card panel"><div className="card-heading"><span>CHARACTER</span><UserRound size={16}/></div><div className="big-avatar">🧙‍♀️</div><h3>Shruti</h3><span className="class-name">WANDERING MAGE</span><div className="xp-label"><span>LEVEL {Math.floor(xp/250)+1}</span><span>{xp % 250} / 250 XP</span></div><div className="xp-bar"><i style={{width: progress+'%'}}/></div><div className="stat-row">{stats.slice(0,3).map(([s,v]) => <div key={s}><b>{s}</b><span>{v}</span></div>)}</div></div>
    </section>

    <section className="section-head"><div><span className="eyebrow">TODAY'S JOURNAL</span><h2>Active quests</h2></div><button className="ghost" onClick={() => setShowQuest(true)}>+ New Quest</button></section>
    <div className="quest-list">{quests.map(q => <Quest key={q.id} q={q} finishQuest={finishQuest}/>)}</div>

    <section className="lower-grid">
      <div className="panel stats-panel"><div className="card-heading"><span>CHARACTER STATS</span><Sparkles size={16}/></div>{stats.map(([label,value,name,Icon]) => <div className="stat-line" key={label}><Icon size={16}/><b>{label}</b><span>{name}</span><strong>{value}</strong></div>)}</div>
      <div className="panel progress-panel"><div className="card-heading"><span>ADVENTURE LOG</span><Flame size={16}/></div><div className="streak"><span className="streak-number">4</span><div><b>day streak</b><span>Keep the flame alive.</span></div><Flame size={30}/></div><div className="week">{['M','T','W','T','F','S','S'].map((d,i)=><div key={i} className={i < 4 ? 'done-day' : ''}><span>{d}</span><i>{i < 4 ? '✓' : '·'}</i></div>)}</div><div className="reward-note"><Trophy size={16}/><span>Complete 2 more quests today to earn the <b>Explorer’s Bonus</b>.</span></div></div>
    </section>

    <section className="section-head world-head"><div><span className="eyebrow">THE REALM</span><h2>Choose your path</h2></div><span className="muted">More regions unlock as you grow.</span></section>
    <div className="world-grid">{worlds.map(w => <WorldCard key={w.name} world={w}/>)}</div>
  </div>
}

function Quest({q, finishQuest}) {
  const Icon = q.type === 'body' ? Heart : q.type === 'mind' ? BookOpen : q.type === 'spirit' ? Sparkles : ScrollText
  return <div className={'quest-row '+(q.done?'done':'')}><button className="check" onClick={() => finishQuest(q.id)}>{q.done ? <Check size={17}/> : ''}</button><div className="quest-icon"><Icon size={18}/></div><div className="quest-info"><b>{q.title}</b><span>{q.subtitle}</span></div><div className="quest-reward"><b>+{q.xp} XP</b><span>◈ {q.gold}</span></div><span className="quest-type">{q.type}</span></div>
}

function QuestPage({quests, finishQuest, setShowQuest}) {
  return <div className="content"><div className="page-intro"><div><span className="eyebrow">ADVENTURER'S JOURNAL</span><h2>All quests</h2><p>Turn the things you already want to do into tiny victories.</p></div><button className="primary" onClick={() => setShowQuest(true)}>+ New Quest</button></div><div className="quest-list full">{quests.map(q => <Quest key={q.id} q={q} finishQuest={finishQuest}/>)}</div></div>
}

function MapPage({worlds}) {
  return <div className="content"><div className="page-intro"><div><span className="eyebrow">WORLD MAP</span><h2>The Realm of Becoming</h2><p>Every region represents a part of the life you're building.</p></div></div><div className="map-grid">{worlds.map(w => <WorldCard key={w.name} world={w} large/>)}</div></div>
}

function WorldCard({world, large=false}) {
  const Icon = world.icon
  return <div className={'world-card panel '+(world.locked?'locked ':'')+(large?'large':'')}><div className="world-art"><Icon size={large?38:28}/><span>{world.stat}</span></div><div><h3>{world.name}</h3><p>{world.desc}</p></div>{world.locked ? <span className="lock">LOCKED</span> : <button className="circle-btn"><ChevronRight size={17}/></button>}</div>
}

function CharacterPage({level,xp,stats}) {
  return <div className="content"><div className="character-sheet panel"><div className="sheet-avatar">🧙‍♀️</div><div className="sheet-main"><span className="eyebrow">CHARACTER SHEET</span><h2>Shruti</h2><span className="class-name">WANDERING MAGE · HUMAN</span><p>Your character grows when you take care of the person behind the avatar.</p><div className="sheet-level"><b>Level {level}</b><div className="xp-bar"><i style={{width: ((xp%250)/250)*100+'%'}}/></div><span>{xp%250} / 250 XP</span></div></div></div><div className="stat-cards">{stats.map(([label,value,name,Icon])=><div className="panel stat-card" key={label}><Icon/><span>{label}</span><strong>{value}</strong><small>{name}</small></div>)}</div></div>
}

function InventoryPage({gold}) {
  const rewards = [{name:'Cozy Cafe Run',cost:30,icon:'☕'}, {name:'Movie Night',cost:60,icon:'🎬'}, {name:'New Book',cost:90,icon:'📖'}, {name:'Little Treat',cost:120,icon:'🍰'}]
  return <div className="content"><div className="page-intro"><div><span className="eyebrow">REWARD SHOP</span><h2>Spend your hard-earned gold</h2><p>Rewards are for enjoying life, not for earning permission to rest.</p></div><div className="currency large-currency">◈ <b>{gold}</b></div></div><div className="reward-grid">{rewards.map(r=><div className="panel reward-card" key={r.name}><span className="reward-icon">{r.icon}</span><h3>{r.name}</h3><span>◈ {r.cost} gold</span><button className="ghost">Save for later</button></div>)}</div></div>
}

export default App
