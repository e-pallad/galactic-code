import { db } from "@/lib/db"
import {
  tracks,
  starSystems,
  sectors,
  missions,
  skillCheckQuestions,
  exercises,
  exerciseTests,
} from "@/lib/db/schema"

// ─── helpers ────────────────────────────────────────────────────────────────

type SectorDef = {
  number: number
  theme: string
  missions: MissionDef[]
}

type MissionDef = {
  number: number
  title: string
  type: "briefing" | "training-op" | "strike-mission" | "debrief"
  durationMinutes: number
  description: string
  practicalExample?: string
  skillChecks?: { question: string; options: [string, string, string, string]; correctIndex: number; explanation: string }[]
  exercises?: { title: string; description: string; starterCode: string; solution: string; hints: string[]; tests: { description: string; code: string }[] }[]
}

type SystemDef = {
  number: number
  title: string
  description: string
  operationTitle: string
  operationDescription: string
  sectors: SectorDef[]
}

async function seedSystem(trackId: string, sys: SystemDef) {
  const [system] = await db
    .insert(starSystems)
    .values({
      trackId,
      number: sys.number,
      title: sys.title,
      description: sys.description,
      operationTitle: sys.operationTitle,
      operationDescription: sys.operationDescription,
      publishedAt: new Date(),
    })
    .onConflictDoNothing()
    .returning()

  if (!system) return

  for (const sec of sys.sectors) {
    const [sector] = await db
      .insert(sectors)
      .values({ systemId: system.id, number: sec.number, theme: sec.theme })
      .onConflictDoNothing()
      .returning()

    if (!sector) continue

    for (const m of sec.missions) {
      const [mission] = await db
        .insert(missions)
        .values({
          sectorId: sector.id,
          systemId: system.id,
          number: m.number,
          title: m.title,
          type: m.type,
          durationMinutes: m.durationMinutes,
          description: m.description,
          practicalExample: m.practicalExample,
          publishedAt: new Date(),
        })
        .onConflictDoNothing()
        .returning()

      if (!mission) continue

      if (m.skillChecks) {
        await db
          .insert(skillCheckQuestions)
          .values(
            m.skillChecks.map((q, i) => ({
              missionId: mission.id,
              question: q.question,
              options: q.options,
              correctIndex: q.correctIndex,
              explanation: q.explanation,
              displayOrder: i,
            }))
          )
          .onConflictDoNothing()
      }

      if (m.exercises) {
        for (let ei = 0; ei < m.exercises.length; ei++) {
          const ex = m.exercises[ei]
          const [exercise] = await db
            .insert(exercises)
            .values({
              missionId: mission.id,
              title: ex.title,
              description: ex.description,
              starterCode: ex.starterCode,
              solution: ex.solution,
              hints: ex.hints,
              displayOrder: ei,
            })
            .onConflictDoNothing()
            .returning()

          if (!exercise) continue

          if (ex.tests.length > 0) {
            await db
              .insert(exerciseTests)
              .values(
                ex.tests.map((t, ti) => ({
                  exerciseId: exercise.id,
                  description: t.description,
                  code: t.code,
                  displayOrder: ti,
                }))
              )
              .onConflictDoNothing()
          }
        }
      }
    }
  }
}

// ─── React Path ─────────────────────────────────────────────────────────────

const reactSystems: SystemDef[] = [
  {
    number: 1,
    title: "Alpha Centauri — React Ignition",
    description: "Cadet training begins. Learn JSX, components, props, and state — the four thrusters of every React ship.",
    operationTitle: "Build a Task Commander",
    operationDescription: "Deploy a fully functional task management app with add, complete, and delete capabilities using React state.",
    sectors: [
      {
        number: 1,
        theme: "First Contact with JSX",
        missions: [
          {
            number: 1,
            title: "JSX Transmission Received",
            type: "briefing",
            durationMinutes: 15,
            description: "JSX is the signal language of the React universe. Learn how it blends HTML markup with JavaScript logic into a single transmission.",
            practicalExample: "const Beacon = () => <h1>Galactic Code Online</h1>",
          },
          {
            number: 2,
            title: "Embedding Expressions",
            type: "training-op",
            durationMinutes: 25,
            description: "Embed JavaScript expressions inside JSX using curly braces — the universal translator between markup and logic.",
            practicalExample: "const rank = 'Cadet'; const Badge = () => <span>Rank: {rank}</span>",
            skillChecks: [
              {
                question: "Which syntax embeds a JavaScript expression inside JSX?",
                options: ["$(expression)", "{expression}", "[[expression]]", "<%expression%>"],
                correctIndex: 1,
                explanation: "Curly braces {} are the portals that let JavaScript expressions flow into JSX markup.",
              },
              {
                question: "What does JSX compile to under the hood?",
                options: ["HTML strings", "React.createElement() calls", "Virtual DOM nodes directly", "JSON objects"],
                correctIndex: 1,
                explanation: "JSX is syntactic sugar — Babel transforms it into React.createElement() calls that build the Virtual DOM.",
              },
              {
                question: "Which is valid JSX?",
                options: [
                  "<div class='panel'>content</div>",
                  "<div className='panel'>content</div>",
                  "<div class-name='panel'>content</div>",
                  "<div htmlClass='panel'>content</div>",
                ],
                correctIndex: 1,
                explanation: "JSX uses className instead of class because class is a reserved keyword in JavaScript.",
              },
            ],
            exercises: [
              {
                title: "Mission Briefing Card",
                description: "Create a MissionCard component that accepts a title and xp prop and renders them inside a div.",
                starterCode: `function MissionCard({ title, xp }) {
  // render a div with a h2 for title and a span for xp
}`,
                solution: `function MissionCard({ title, xp }) {
  return (
    <div>
      <h2>{title}</h2>
      <span>{xp} XP</span>
    </div>
  );
}`,
                hints: ["Use curly braces to embed the prop values", "Return a single parent element"],
                tests: [
                  { description: "renders the title", code: "expect(container.querySelector('h2').textContent).toBe('Intercept Signal')" },
                  { description: "renders the xp value", code: "expect(container.textContent).toContain('15 XP')" },
                ],
              },
            ],
          },
          {
            number: 3,
            title: "JSX Structural Rules",
            type: "strike-mission",
            durationMinutes: 30,
            description: "Master the laws that govern all JSX: single root elements, self-closing tags, and fragment warp gates <>...</>.",
            skillChecks: [
              {
                question: "Why must JSX have a single root element?",
                options: [
                  "Browser limitation",
                  "React.createElement returns one element — multiple roots would need an array",
                  "CSS requirement",
                  "It doesn't — you can return multiple elements freely",
                ],
                correctIndex: 1,
                explanation: "Functions return one value. React.createElement() returns one element, so JSX must have one root (or use a Fragment <>).",
              },
              {
                question: "Which is the correct Fragment shorthand?",
                options: ["<Fragment />", "<React.Fragment>", "<>...</>", "Both B and C"],
                correctIndex: 3,
                explanation: "Both <React.Fragment> and the shorthand <></> create fragments that group elements without adding DOM nodes.",
              },
            ],
          },
          {
            number: 4,
            title: "JSX Sector Debrief",
            type: "debrief",
            durationMinutes: 10,
            description: "Review the JSX transmission protocols before advancing to the Component Construction Bay.",
          },
        ],
      },
      {
        number: 2,
        theme: "Component Construction Bay",
        missions: [
          {
            number: 1,
            title: "Assembling Components",
            type: "briefing",
            durationMinutes: 15,
            description: "Components are the starships of React — self-contained, reusable units of UI. Learn to build and launch function components.",
          },
          {
            number: 2,
            title: "Props — Cargo Transfer Protocol",
            type: "training-op",
            durationMinutes: 25,
            description: "Props are the cargo pods that carry data into your components. Master passing, receiving, and destructuring props.",
            practicalExample: "function Pilot({ name, rank = 'Cadet' }) { return <p>{name} [{rank}]</p> }",
            skillChecks: [
              {
                question: "How does a parent component send data to a child?",
                options: ["Through global state", "Via props as JSX attributes", "Using the context API only", "Through the window object"],
                correctIndex: 1,
                explanation: "Props are passed as attributes in JSX: <Child name='Orion' /> makes name available as props.name inside Child.",
              },
              {
                question: "Can a component modify its own props?",
                options: ["Yes, using setState", "Yes, by direct assignment", "No — props are read-only", "Only class components can"],
                correctIndex: 2,
                explanation: "Props are immutable from the component's perspective. To change data, lift state up to a parent and pass new props down.",
              },
              {
                question: "What is prop destructuring?",
                options: [
                  "Deleting props after use",
                  "Extracting prop values into named variables in the function signature",
                  "Converting props to state",
                  "Merging multiple props objects",
                ],
                correctIndex: 1,
                explanation: "function Card({ title, xp }) destructures the props object — cleaner than function Card(props) and then props.title.",
              },
            ],
            exercises: [
              {
                title: "Pilot Profile Card",
                description: "Build a PilotCard component that takes name, rank, and xp props and displays them in a structured layout.",
                starterCode: `function PilotCard(props) {
  // destructure name, rank, xp from props
  // render: name in h2, rank in p, xp with 'XP' suffix in span
}`,
                solution: `function PilotCard({ name, rank, xp }) {
  return (
    <div>
      <h2>{name}</h2>
      <p>{rank}</p>
      <span>{xp} XP</span>
    </div>
  );
}`,
                hints: ["Destructure directly in the parameter list", "Each piece of data needs its own element"],
                tests: [
                  { description: "renders pilot name", code: "expect(container.querySelector('h2').textContent).toBe('Commander Vega')" },
                  { description: "renders rank", code: "expect(container.textContent).toContain('Navigator')" },
                ],
              },
            ],
          },
          {
            number: 3,
            title: "Component Composition",
            type: "strike-mission",
            durationMinutes: 30,
            description: "Combine small components into larger interfaces — the way a fleet is built from individual ships. Practice children props and composition patterns.",
            skillChecks: [
              {
                question: "What does the children prop represent?",
                options: [
                  "An array of child component classes",
                  "The JSX content placed between a component's opening and closing tags",
                  "Props passed from child to parent",
                  "The component's DOM children",
                ],
                correctIndex: 1,
                explanation: "<Card><p>Hello</p></Card> — the <p> becomes props.children inside Card, enabling wrapper/slot patterns.",
              },
            ],
          },
          {
            number: 4,
            title: "Components Sector Debrief",
            type: "debrief",
            durationMinutes: 10,
            description: "Consolidate your understanding of React component architecture.",
          },
        ],
      },
      {
        number: 3,
        theme: "State Command Center",
        missions: [
          {
            number: 1,
            title: "useState — Ship's Memory Core",
            type: "briefing",
            durationMinutes: 20,
            description: "useState is the memory core that allows components to remember data between renders. Learn the state initialization and update cycle.",
            practicalExample: "const [fuel, setFuel] = useState(100)",
          },
          {
            number: 2,
            title: "Event Interceptors",
            type: "training-op",
            durationMinutes: 25,
            description: "Handle user interactions — clicks, inputs, form submissions — and wire them to state updates.",
            skillChecks: [
              {
                question: "What triggers a React component to re-render?",
                options: [
                  "Any JavaScript variable change",
                  "A state update via the setter function",
                  "DOM mutations",
                  "setTimeout calls",
                ],
                correctIndex: 1,
                explanation: "Only calling the setter from useState (e.g. setCount(n+1)) schedules a re-render. Direct variable mutation is invisible to React.",
              },
              {
                question: "Which pattern correctly updates state based on previous value?",
                options: [
                  "setCount(count + 1)",
                  "setCount(prev => prev + 1)",
                  "count = count + 1",
                  "setState({ count: count + 1 })",
                ],
                correctIndex: 1,
                explanation: "The functional updater form setCount(prev => prev + 1) is safe in async batching scenarios — always use it when new state depends on old state.",
              },
              {
                question: "How do you handle an input field's value with state?",
                options: [
                  "Read it from the DOM with getElementById",
                  "Use a ref only",
                  "Set value={state} and onChange={e => setState(e.target.value)}",
                  "Use document.querySelector in useEffect",
                ],
                correctIndex: 2,
                explanation: "Controlled inputs bind their value to state and update state on change — React owns the source of truth.",
              },
            ],
            exercises: [
              {
                title: "Mission Counter",
                description: "Build a MissionCounter that tracks completed missions. Include increment and reset buttons.",
                starterCode: `import { useState } from 'react';

function MissionCounter() {
  // Add state for count
  // Add increment handler
  // Add reset handler
  return (
    <div>
      <p>Missions: {/* display count */}</p>
      <button>Complete Mission</button>
      <button>Reset</button>
    </div>
  );
}`,
                solution: `import { useState } from 'react';

function MissionCounter() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <p>Missions: {count}</p>
      <button onClick={() => setCount(prev => prev + 1)}>Complete Mission</button>
      <button onClick={() => setCount(0)}>Reset</button>
    </div>
  );
}`,
                hints: ["useState returns [value, setter]", "Use functional update form for increment"],
                tests: [
                  { description: "starts at 0", code: "expect(container.textContent).toContain('Missions: 0')" },
                  { description: "increments on click", code: "fireEvent.click(getByText('Complete Mission')); expect(container.textContent).toContain('Missions: 1')" },
                ],
              },
            ],
          },
          {
            number: 3,
            title: "State Update Patterns",
            type: "strike-mission",
            durationMinutes: 35,
            description: "Master object and array state updates — the rules for immutable state transformations that keep React's tracking intact.",
            skillChecks: [
              {
                question: "How do you correctly add an item to an array in state?",
                options: [
                  "items.push(newItem); setItems(items)",
                  "setItems([...items, newItem])",
                  "setItems(items.concat) // no call",
                  "items[items.length] = newItem; setItems(items)",
                ],
                correctIndex: 1,
                explanation: "Always create a new array. Spread ...items into a new array with the new item — never mutate the existing state array.",
              },
            ],
          },
          {
            number: 4,
            title: "State Sector Debrief",
            type: "debrief",
            durationMinutes: 10,
            description: "Seal in your state management knowledge before the Rendering Protocols sector.",
          },
        ],
      },
      {
        number: 4,
        theme: "Rendering Protocols",
        missions: [
          {
            number: 1,
            title: "Conditional Rendering",
            type: "briefing",
            durationMinutes: 20,
            description: "Render different UI based on conditions using &&, ternary operators, and if statements.",
            practicalExample: "{isLoggedIn && <Dashboard />} or {isOnline ? <Active /> : <Offline />}",
          },
          {
            number: 2,
            title: "List Rendering & Keys",
            type: "training-op",
            durationMinutes: 25,
            description: "Transform arrays into lists of elements using .map() and understand why unique keys are required by the Galactic React Accord.",
            skillChecks: [
              {
                question: "Why does React require a key prop on list items?",
                options: [
                  "For CSS targeting",
                  "To help React identify which items changed, added, or removed during reconciliation",
                  "It's optional — just a best practice",
                  "For server-side rendering only",
                ],
                correctIndex: 1,
                explanation: "Keys are React's tracking beacons. They let the diffing algorithm reuse DOM nodes efficiently instead of re-rendering everything.",
              },
              {
                question: "Which is the best key for a list of database records?",
                options: ["The array index", "Math.random()", "The record's unique database ID", "The item's title"],
                correctIndex: 2,
                explanation: "Stable, unique IDs from your database are ideal keys. Array indexes cause bugs when items reorder; random values break reconciliation.",
              },
            ],
            exercises: [
              {
                title: "Mission Roster",
                description: "Render a list of missions from an array. Each item should show the mission title and XP reward.",
                starterCode: `function MissionRoster({ missions }) {
  // Map over missions array
  // Return a ul with li items
  // Don't forget keys!
}

const missionData = [
  { id: '1', title: 'Intercept Signal', xp: 15 },
  { id: '2', title: 'Map the Sector', xp: 20 },
  { id: '3', title: 'Contact Base', xp: 15 },
];`,
                solution: `function MissionRoster({ missions }) {
  return (
    <ul>
      {missions.map(m => (
        <li key={m.id}>{m.title} — {m.xp} XP</li>
      ))}
    </ul>
  );
}`,
                hints: ["Use .map() to iterate", "The key must go on the outermost element returned from map"],
                tests: [
                  { description: "renders all missions", code: "expect(container.querySelectorAll('li').length).toBe(3)" },
                  { description: "shows mission title", code: "expect(container.textContent).toContain('Intercept Signal')" },
                ],
              },
            ],
          },
          {
            number: 3,
            title: "Rendering Strike Mission",
            type: "strike-mission",
            durationMinutes: 30,
            description: "Combine conditional and list rendering to build a dynamic mission board — show different states based on data.",
          },
          {
            number: 4,
            title: "System Alpha Debrief",
            type: "debrief",
            durationMinutes: 10,
            description: "You've cleared Alpha Centauri. Prepare for the intermediate systems.",
          },
        ],
      },
    ],
  },
  {
    number: 2,
    title: "Proxima Station — React Maneuvers",
    description: "Intermediate combat training. Master hooks, routing, and context — the weapons of a skilled React Navigator.",
    operationTitle: "Build a Space News Dashboard",
    operationDescription: "Create a multi-page dashboard that fetches live data, uses React Router for navigation, and shares state via Context.",
    sectors: [
      {
        number: 1,
        theme: "Effect Drive Systems",
        missions: [
          {
            number: 1,
            title: "useEffect — The Side Effect Engine",
            type: "briefing",
            durationMinutes: 20,
            description: "useEffect synchronizes your component with external systems: APIs, timers, subscriptions. Learn when and why side effects belong here.",
          },
          {
            number: 2,
            title: "Data Retrieval Operations",
            type: "training-op",
            durationMinutes: 30,
            description: "Fetch data from APIs inside useEffect, handle loading states, and manage errors — the full lifecycle of an async data mission.",
            practicalExample: "useEffect(() => { fetch('/api/missions').then(r => r.json()).then(setData) }, [])",
            skillChecks: [
              {
                question: "What does an empty dependency array [] in useEffect mean?",
                options: [
                  "Run on every render",
                  "Run once after mount, never again",
                  "Run when the component unmounts",
                  "Never run",
                ],
                correctIndex: 1,
                explanation: "[] means no dependencies — the effect runs once after the first render, equivalent to componentDidMount.",
              },
              {
                question: "How do you prevent memory leaks when fetching in useEffect?",
                options: [
                  "Use async/await directly in useEffect",
                  "Return a cleanup function that cancels the request or sets an ignore flag",
                  "Use setTimeout to delay the fetch",
                  "Wrap the component in Suspense",
                ],
                correctIndex: 1,
                explanation: "If the component unmounts before the fetch completes, calling setState on an unmounted component causes leaks. Return cleanup to abort or ignore.",
              },
              {
                question: "Which pattern correctly fetches data in useEffect?",
                options: [
                  "useEffect(async () => { const data = await fetch(url) }, [])",
                  "useEffect(() => { const load = async () => { const data = await fetch(url); setData(data) }; load() }, [])",
                  "async function useEffect() { await fetch(url) }",
                  "useEffect(() => fetch(url).then(setData), [])",
                ],
                correctIndex: 1,
                explanation: "Define an inner async function and call it — useEffect's callback must be synchronous (returning a cleanup function, not a Promise).",
              },
            ],
          },
          {
            number: 3,
            title: "Cleanup & Dependency Arrays",
            type: "strike-mission",
            durationMinutes: 35,
            description: "Master the dependency array rules and write proper cleanup functions. One wrong dependency can cause infinite loops or stale closures.",
            skillChecks: [
              {
                question: "What happens if you include a function in the dependency array without useCallback?",
                options: [
                  "Nothing — functions are stable references",
                  "An infinite loop — the function is recreated each render, triggering the effect again",
                  "A syntax error",
                  "The effect runs only once regardless",
                ],
                correctIndex: 1,
                explanation: "Functions are recreated on every render, making them a new reference. Without useCallback, adding them to deps causes infinite re-runs.",
              },
            ],
          },
          {
            number: 4,
            title: "Effect Drive Debrief",
            type: "debrief",
            durationMinutes: 10,
            description: "Lock in your useEffect patterns before tackling React Router.",
          },
        ],
      },
      {
        number: 2,
        theme: "Navigation Grid",
        missions: [
          {
            number: 1,
            title: "React Router Deployment",
            type: "briefing",
            durationMinutes: 20,
            description: "Install and configure React Router v6 — the navigation system for multi-page React applications.",
          },
          {
            number: 2,
            title: "Dynamic Routes & Params",
            type: "training-op",
            durationMinutes: 30,
            description: "Build routes with URL parameters like /mission/:id and read them with useParams to load specific data.",
            skillChecks: [
              {
                question: "How do you read a URL parameter in React Router v6?",
                options: [
                  "props.match.params.id",
                  "const { id } = useParams()",
                  "this.props.params.id",
                  "router.query.id",
                ],
                correctIndex: 1,
                explanation: "React Router v6 provides the useParams hook: const { id } = useParams() extracts parameters from the matched route.",
              },
              {
                question: "What component wraps the entire app to enable routing?",
                options: ["<Router>", "<BrowserRouter>", "<RouteProvider>", "<HashRouter> only"],
                correctIndex: 1,
                explanation: "<BrowserRouter> (aliased as <Router>) uses the HTML5 history API to keep URLs in sync with the rendered UI.",
              },
            ],
          },
          {
            number: 3,
            title: "Navigation & Redirects",
            type: "strike-mission",
            durationMinutes: 30,
            description: "Use <Link>, <NavLink>, useNavigate, and <Navigate> to move users through your app programmatically and declaratively.",
          },
          {
            number: 4,
            title: "Navigation Grid Debrief",
            type: "debrief",
            durationMinutes: 10,
            description: "Review React Router patterns before entering the Context Nebula.",
          },
        ],
      },
      {
        number: 3,
        theme: "Context Nebula",
        missions: [
          {
            number: 1,
            title: "Context API — Galactic Broadcast",
            type: "briefing",
            durationMinutes: 20,
            description: "The Context API lets you broadcast data to any component in the tree without threading props through every level — prop drilling eliminated.",
          },
          {
            number: 2,
            title: "useContext — Receiving the Signal",
            type: "training-op",
            durationMinutes: 25,
            description: "Create, provide, and consume context values using createContext, Provider, and useContext.",
            skillChecks: [
              {
                question: "What is prop drilling?",
                options: [
                  "Passing props to deeply nested components through many intermediate layers",
                  "Using the spread operator on props",
                  "Deleting props after use",
                  "TypeScript prop type checking",
                ],
                correctIndex: 0,
                explanation: "Prop drilling is threading a value through multiple component layers just to reach a deeply nested consumer — Context solves this.",
              },
              {
                question: "When should you NOT use Context?",
                options: [
                  "For theme data",
                  "For user authentication state",
                  "For frequently updating state like real-time cursor position",
                  "For locale/language settings",
                ],
                correctIndex: 2,
                explanation: "Every Context update re-renders all consumers. High-frequency updates (mouse position, scroll) should use local state or specialized state managers.",
              },
            ],
          },
          {
            number: 3,
            title: "Context Architecture Patterns",
            type: "strike-mission",
            durationMinutes: 35,
            description: "Build a complete auth context with login/logout, wrap the app in the Provider, and consume it across multiple components.",
          },
          {
            number: 4,
            title: "Context Nebula Debrief",
            type: "debrief",
            durationMinutes: 10,
            description: "Consolidate Context patterns before the Custom Hook Forge.",
          },
        ],
      },
      {
        number: 4,
        theme: "Custom Hook Forge",
        missions: [
          {
            number: 1,
            title: "Forging Custom Hooks",
            type: "briefing",
            durationMinutes: 25,
            description: "Custom hooks are reusable logic weapons — extract stateful patterns into functions that start with 'use' and share them across the fleet.",
          },
          {
            number: 2,
            title: "useFetch — Data Extraction Beam",
            type: "training-op",
            durationMinutes: 30,
            description: "Build a production-grade useFetch hook with loading, error, and data states that any component can use.",
            skillChecks: [
              {
                question: "What makes a function a custom hook?",
                options: [
                  "It must be a class",
                  "It starts with 'use' and may call other hooks",
                  "It's registered with React.createHook()",
                  "It accepts a ref argument",
                ],
                correctIndex: 1,
                explanation: "React identifies hooks by the 'use' prefix convention. Any function starting with 'use' that calls hooks internally is a custom hook.",
              },
              {
                question: "Can custom hooks share state between components?",
                options: [
                  "Yes — state is shared automatically",
                  "No — each component gets its own isolated state instance",
                  "Only if you use Context inside the hook",
                  "Only with useRef",
                ],
                correctIndex: 1,
                explanation: "Each component that calls a custom hook gets its own isolated state. Hooks share logic, not state. For shared state, use Context or a state manager.",
              },
            ],
            exercises: [
              {
                title: "useLocalStorage Hook",
                description: "Build a useLocalStorage hook that persists state to localStorage and syncs on mount.",
                starterCode: `import { useState, useEffect } from 'react';

function useLocalStorage(key, initialValue) {
  // Initialize state from localStorage or initialValue
  // Sync to localStorage when value changes
  // Return [value, setValue]
}`,
                solution: `import { useState, useEffect } from 'react';

function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}`,
                hints: ["Use lazy initialization in useState", "Sync in a useEffect with value as dependency"],
                tests: [
                  { description: "returns initial value", code: "const [val] = renderHook(() => useLocalStorage('key', 42)).result.current; expect(val).toBe(42)" },
                  { description: "persists to localStorage", code: "expect(localStorage.getItem('key')).toBe('42')" },
                ],
              },
            ],
          },
          {
            number: 3,
            title: "Hook Composition Strike",
            type: "strike-mission",
            durationMinutes: 35,
            description: "Compose multiple custom hooks together to build a complex feature — a real-time search with debouncing and caching.",
          },
          {
            number: 4,
            title: "Proxima Station Debrief",
            type: "debrief",
            durationMinutes: 10,
            description: "Proxima Station cleared. Prepare for Andromeda — expert territory.",
          },
        ],
      },
    ],
  },
  {
    number: 3,
    title: "Andromeda Nexus — React Mastery",
    description: "Expert command. Performance optimization, advanced state architecture, testing, and design patterns that separate engineers from commanders.",
    operationTitle: "Build a Production React Dashboard",
    operationDescription: "Architect a full dashboard with Zustand state management, React Query for data fetching, performance optimizations, and a full test suite.",
    sectors: [
      {
        number: 1,
        theme: "Performance Warp Core",
        missions: [
          {
            number: 1,
            title: "useMemo & useCallback",
            type: "briefing",
            durationMinutes: 25,
            description: "Memoization is the cloaking device against unnecessary re-renders. Learn when useMemo and useCallback deliver real gains vs. premature optimization.",
          },
          {
            number: 2,
            title: "React.memo — Component Shield",
            type: "training-op",
            durationMinutes: 30,
            description: "Wrap components with React.memo to skip re-renders when props haven't changed. Learn the shallow comparison rules and when memo doesn't help.",
            skillChecks: [
              {
                question: "When does React.memo prevent a re-render?",
                options: [
                  "Always — memoized components never re-render",
                  "When the parent re-renders but the component's props are shallowly equal to previous props",
                  "Only when state doesn't change",
                  "When the component returns null",
                ],
                correctIndex: 1,
                explanation: "React.memo does a shallow prop comparison. If all props are the same reference, the re-render is skipped. New object/array literals always fail this check.",
              },
              {
                question: "What's the danger of overusing useMemo?",
                options: [
                  "It causes infinite loops",
                  "Memoization has a cost — storing the cached value and comparing deps can be slower than just recomputing",
                  "It breaks SSR",
                  "It prevents garbage collection entirely",
                ],
                correctIndex: 1,
                explanation: "Every useMemo allocates memory and runs a deps comparison. For cheap computations, the overhead of memoization exceeds the savings.",
              },
            ],
          },
          {
            number: 3,
            title: "Code Splitting — Warp Jump",
            type: "strike-mission",
            durationMinutes: 40,
            description: "Split your bundle with React.lazy and Suspense. Measure bundle size impact and implement route-based code splitting.",
          },
          {
            number: 4,
            title: "Performance Debrief",
            type: "debrief",
            durationMinutes: 10,
            description: "Review performance optimization patterns and when to apply them.",
          },
        ],
      },
      {
        number: 2,
        theme: "State Machine Armory",
        missions: [
          {
            number: 1,
            title: "useReducer — Command Protocol",
            type: "briefing",
            durationMinutes: 25,
            description: "useReducer models state as explicit actions and transitions — essential for complex state with multiple sub-values or intricate update logic.",
            practicalExample: "const [state, dispatch] = useReducer(reducer, initialState)\ndispatch({ type: 'COMPLETE_MISSION', payload: missionId })",
          },
          {
            number: 2,
            title: "Complex State Patterns",
            type: "training-op",
            durationMinutes: 35,
            description: "Model a multi-step form, a shopping cart, and a finite state machine with useReducer and immer for immutable updates.",
            skillChecks: [
              {
                question: "When should you prefer useReducer over useState?",
                options: [
                  "For single boolean toggles",
                  "For simple string or number state",
                  "When next state depends on complex logic across multiple sub-values, or when actions span multiple state fields",
                  "For all state — useReducer is always better",
                ],
                correctIndex: 2,
                explanation: "useReducer excels when you have state machines, complex transitions, or related state that changes together. useState is simpler for independent values.",
              },
            ],
          },
          {
            number: 3,
            title: "Zustand — Fleet State Grid",
            type: "strike-mission",
            durationMinutes: 40,
            description: "Graduate to Zustand for global state management. Build a mission store with slices, selectors, and async actions.",
          },
          {
            number: 4,
            title: "State Armory Debrief",
            type: "debrief",
            durationMinutes: 10,
            description: "Consolidate your state architecture knowledge.",
          },
        ],
      },
      {
        number: 3,
        theme: "Testing Simulation Chamber",
        missions: [
          {
            number: 1,
            title: "React Testing Library — Simulation Bay",
            type: "briefing",
            durationMinutes: 25,
            description: "Test components the way users use them — by querying the DOM as a human would, not by reaching into internal implementation.",
          },
          {
            number: 2,
            title: "Testing User Interactions",
            type: "training-op",
            durationMinutes: 35,
            description: "Use userEvent to simulate realistic clicks, typing, and form submissions. Assert on UI outcomes, not implementation details.",
            skillChecks: [
              {
                question: "What is the React Testing Library philosophy?",
                options: [
                  "Test implementation details for reliability",
                  "Test the component in isolation by mocking all dependencies",
                  "Test what users see and do, not how the component works internally",
                  "Only test pure utility functions",
                ],
                correctIndex: 2,
                explanation: "RTL encourages querying by accessible roles, text content, and labels — the same signals a user relies on. This produces tests that survive refactors.",
              },
              {
                question: "Which query is preferred by RTL for finding a button?",
                options: [
                  "container.querySelector('button')",
                  "getByTestId('submit-btn')",
                  "getByRole('button', { name: /submit/i })",
                  "getByClassName('btn-primary')",
                ],
                correctIndex: 2,
                explanation: "getByRole uses ARIA semantics — it tests what assistive technology exposes, making tests accessible AND implementation-agnostic.",
              },
            ],
          },
          {
            number: 3,
            title: "Async Testing & Mocking",
            type: "strike-mission",
            durationMinutes: 40,
            description: "Test async operations, mock fetch calls with msw, and handle loading/error states in tests.",
          },
          {
            number: 4,
            title: "Testing Chamber Debrief",
            type: "debrief",
            durationMinutes: 10,
            description: "Review testing strategies and coverage goals.",
          },
        ],
      },
      {
        number: 4,
        theme: "Pattern Synthesis Lab",
        missions: [
          {
            number: 1,
            title: "Compound Components",
            type: "briefing",
            durationMinutes: 30,
            description: "Build flexible component APIs using the compound component pattern — components that share implicit state without explicit prop threading.",
          },
          {
            number: 2,
            title: "Render Props & HOCs",
            type: "training-op",
            durationMinutes: 35,
            description: "Study historical patterns — render props and higher-order components — and understand how hooks replaced them.",
            skillChecks: [
              {
                question: "What is a Higher-Order Component (HOC)?",
                options: [
                  "A component that renders inside another component",
                  "A function that takes a component and returns an enhanced version of it",
                  "A component with more than 3 props",
                  "A React class component",
                ],
                correctIndex: 1,
                explanation: "HOCs are functions: const Enhanced = withAuth(OriginalComponent). They add behavior by wrapping components — a pattern mostly replaced by hooks.",
              },
            ],
          },
          {
            number: 3,
            title: "Mastery Strike — Full Feature Build",
            type: "strike-mission",
            durationMinutes: 45,
            description: "Build a complete React feature from scratch: compound component API, custom hooks for logic, Zustand for state, tests for confidence.",
          },
          {
            number: 4,
            title: "Andromeda Nexus — Final Debrief",
            type: "debrief",
            durationMinutes: 10,
            description: "You've mastered React. Rank: Navigator. The fleet awaits your command.",
          },
        ],
      },
    ],
  },
]

// ─── Node.js Path ────────────────────────────────────────────────────────────

const nodeSystems: SystemDef[] = [
  {
    number: 1,
    title: "Tau Ceti — Node.js Ignition",
    description: "Boot up your engines. Learn Node.js architecture, the event loop, the file system, and your first HTTP server.",
    operationTitle: "Build a File-Based Task Manager CLI",
    operationDescription: "Create a command-line task manager that reads/writes tasks to a JSON file and supports add, complete, list, and delete commands.",
    sectors: [
      {
        number: 1,
        theme: "Server Core Architecture",
        missions: [
          {
            number: 1,
            title: "Node.js — The Engine Room",
            type: "briefing",
            durationMinutes: 15,
            description: "Discover what makes Node.js unique: single-threaded, non-blocking I/O, and the V8 engine running JavaScript server-side.",
          },
          {
            number: 2,
            title: "The Event Loop Explained",
            type: "training-op",
            durationMinutes: 25,
            description: "The event loop is the heartbeat of Node.js. Understand the call stack, callback queue, and how async operations actually execute.",
            skillChecks: [
              {
                question: "What does 'non-blocking I/O' mean in Node.js?",
                options: [
                  "I/O operations run synchronously on a separate thread",
                  "I/O operations are started and Node continues executing other code while waiting for the result",
                  "I/O operations are disabled",
                  "I/O only works with streams",
                ],
                correctIndex: 1,
                explanation: "Node delegates I/O (file reads, network requests) to the OS and continues processing. When the OS signals completion, the callback is queued.",
              },
              {
                question: "What phase of the event loop executes setTimeout callbacks?",
                options: ["Microtask queue", "Timers phase", "I/O callbacks phase", "Check phase"],
                correctIndex: 1,
                explanation: "The timers phase runs callbacks from setTimeout and setInterval whose delay has elapsed. Microtasks (Promises) run between phases.",
              },
              {
                question: "Which code runs first?",
                options: [
                  "setTimeout(() => console.log('A'), 0)",
                  "Promise.resolve().then(() => console.log('B'))",
                  "They run in order they appear",
                  "It's random",
                ],
                correctIndex: 1,
                explanation: "Promise microtasks are processed before the next event loop phase. 'B' logs before 'A' even though setTimeout has 0ms delay.",
              },
            ],
          },
          {
            number: 3,
            title: "Modules — the Cargo System",
            type: "strike-mission",
            durationMinutes: 30,
            description: "Master CommonJS (require/module.exports) and ES Modules (import/export). Know which to use and how package.json's 'type' field switches between them.",
            skillChecks: [
              {
                question: "What does require() return when you import a module?",
                options: [
                  "The module file as a string",
                  "The value assigned to module.exports in that file",
                  "A promise that resolves to the module",
                  "The module's source code",
                ],
                correctIndex: 1,
                explanation: "require() executes the module file and returns whatever was assigned to module.exports — an object, function, class, or any value.",
              },
            ],
          },
          {
            number: 4,
            title: "Core Architecture Debrief",
            type: "debrief",
            durationMinutes: 10,
            description: "Solidify your Node.js architecture understanding before the File System sector.",
          },
        ],
      },
      {
        number: 2,
        theme: "File System Operations",
        missions: [
          {
            number: 1,
            title: "Reading the Data Stores",
            type: "briefing",
            durationMinutes: 20,
            description: "Use fs.readFile and fs.promises.readFile to read files synchronously and asynchronously. Understand encodings and binary data.",
            practicalExample: "const data = await fs.promises.readFile('missions.json', 'utf-8')",
          },
          {
            number: 2,
            title: "Writing & Appending Files",
            type: "training-op",
            durationMinutes: 25,
            description: "Write data with fs.writeFile and append with fs.appendFile. Build atomic write patterns to prevent data corruption.",
            skillChecks: [
              {
                question: "What's the difference between fs.writeFile and fs.appendFile?",
                options: [
                  "writeFile is async, appendFile is sync",
                  "writeFile overwrites the entire file; appendFile adds to the end",
                  "appendFile creates new files; writeFile doesn't",
                  "They're identical",
                ],
                correctIndex: 1,
                explanation: "writeFile replaces all file content. appendFile adds content at the end. Use appendFile for logs; writeFile for full saves.",
              },
            ],
            exercises: [
              {
                title: "JSON Config Manager",
                description: "Write readConfig() and writeConfig() functions that read/write a JSON file, with proper error handling.",
                starterCode: `const fs = require('fs').promises;
const CONFIG_PATH = './config.json';

async function readConfig() {
  // Read CONFIG_PATH, parse JSON, return object
  // Return {} if file doesn't exist
}

async function writeConfig(config) {
  // Stringify config with 2-space indent and write to CONFIG_PATH
}`,
                solution: `const fs = require('fs').promises;
const CONFIG_PATH = './config.json';

async function readConfig() {
  try {
    const raw = await fs.readFile(CONFIG_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function writeConfig(config) {
  await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2));
}`,
                hints: ["Use try/catch for the read — file may not exist", "JSON.stringify(obj, null, 2) for pretty-printed output"],
                tests: [
                  { description: "returns {} when file missing", code: "expect(await readConfig()).toEqual({})" },
                  { description: "writes and reads back correctly", code: "await writeConfig({ key: 'val' }); expect(await readConfig()).toEqual({ key: 'val' })" },
                ],
              },
            ],
          },
          {
            number: 3,
            title: "Directory & Stream Operations",
            type: "strike-mission",
            durationMinutes: 30,
            description: "Traverse directories with readdir, create nested paths with mkdir, and stream large files with fs.createReadStream.",
          },
          {
            number: 4,
            title: "File System Debrief",
            type: "debrief",
            durationMinutes: 10,
            description: "Review file system patterns before the HTTP Launch Pad.",
          },
        ],
      },
      {
        number: 3,
        theme: "HTTP Launch Pad",
        missions: [
          {
            number: 1,
            title: "Your First HTTP Server",
            type: "briefing",
            durationMinutes: 20,
            description: "Launch an HTTP server with Node's built-in http module. Handle requests, read the URL, and send responses.",
            practicalExample: "http.createServer((req, res) => { res.end('Signal received') }).listen(3000)",
          },
          {
            number: 2,
            title: "Manual Routing",
            type: "training-op",
            durationMinutes: 25,
            description: "Parse request URLs and methods to route to different handlers — building a mini-router from scratch before meeting Express.",
            skillChecks: [
              {
                question: "How do you read the request body in a Node.js HTTP server?",
                options: [
                  "req.body",
                  "req.json()",
                  "Collect data chunks: req.on('data', chunk => ...) then req.on('end', ...)",
                  "JSON.parse(req)",
                ],
                correctIndex: 2,
                explanation: "HTTP bodies arrive as a stream of chunks. Listen to 'data' events to collect them, then process the assembled buffer on 'end'.",
              },
              {
                question: "What does res.end() vs res.write() do?",
                options: [
                  "They're identical",
                  "write() sends data without closing; end() sends optional final data and closes the connection",
                  "end() is for errors only",
                  "write() is synchronous; end() is async",
                ],
                correctIndex: 1,
                explanation: "You can call res.write() multiple times to stream data. res.end() signals that the response is complete — always required.",
              },
            ],
          },
          {
            number: 3,
            title: "HTTP Strike Mission",
            type: "strike-mission",
            durationMinutes: 35,
            description: "Build a full CRUD HTTP server from scratch — no Express — handling GET, POST, PUT, and DELETE with JSON request/response bodies.",
          },
          {
            number: 4,
            title: "HTTP Launch Pad Debrief",
            type: "debrief",
            durationMinutes: 10,
            description: "Review HTTP fundamentals. Next: NPM and the package ecosystem.",
          },
        ],
      },
      {
        number: 4,
        theme: "NPM Supply Depot",
        missions: [
          {
            number: 1,
            title: "NPM — Package Command Center",
            type: "briefing",
            durationMinutes: 15,
            description: "NPM is the supply depot for the Node.js universe. Learn install, uninstall, scripts, and the difference between dependencies and devDependencies.",
          },
          {
            number: 2,
            title: "package.json Deep Dive",
            type: "training-op",
            durationMinutes: 20,
            description: "Decode every field in package.json: scripts, engines, main, exports, and how semantic versioning controls your upgrade safety.",
            skillChecks: [
              {
                question: "What does ^ in ^1.2.3 mean in package.json?",
                options: [
                  "Exact version 1.2.3 only",
                  "Compatible with 1.2.3 — allows minor and patch updates up to <2.0.0",
                  "Any version above 1.2.3",
                  "The latest version regardless of number",
                ],
                correctIndex: 1,
                explanation: "^ (caret) allows compatible updates: minor and patch versions can increment but the major stays fixed. 1.2.3 → up to 1.9.9 is allowed.",
              },
              {
                question: "What is the purpose of package-lock.json?",
                options: [
                  "Prevents npm from running",
                  "Locks the exact resolved version of every dependency and their sub-dependencies for reproducible installs",
                  "Stores environment variables",
                  "Caches downloaded packages",
                ],
                correctIndex: 1,
                explanation: "package-lock.json ensures everyone on the team installs identical dependency trees — critical for 'works on my machine' prevention.",
              },
            ],
          },
          {
            number: 3,
            title: "Semantic Versioning Strike",
            type: "strike-mission",
            durationMinutes: 25,
            description: "Practice dependency auditing: identify vulnerable packages, update safely, and understand why version ranges matter in production.",
          },
          {
            number: 4,
            title: "Tau Ceti System Debrief",
            type: "debrief",
            durationMinutes: 10,
            description: "System 1 complete. You're ready for Kepler Station — Express territory.",
          },
        ],
      },
    ],
  },
  {
    number: 2,
    title: "Kepler Station — Express Maneuvers",
    description: "Intermediate Node.js. Build REST APIs with Express, connect to PostgreSQL, and implement JWT authentication.",
    operationTitle: "Build a REST API with Authentication",
    operationDescription: "Create a complete Express REST API with user auth (JWT), PostgreSQL persistence, input validation, and proper error handling.",
    sectors: [
      {
        number: 1,
        theme: "Express Engine Room",
        missions: [
          {
            number: 1,
            title: "Express Framework Deployment",
            type: "briefing",
            durationMinutes: 20,
            description: "Mount the Express engine. Understand how Express wraps Node's HTTP module and exposes a clean routing + middleware API.",
          },
          {
            number: 2,
            title: "Routes & Controllers",
            type: "training-op",
            durationMinutes: 30,
            description: "Organize Express routes into controllers. Build RESTful endpoints with proper HTTP methods and status codes.",
            skillChecks: [
              {
                question: "What's the correct Express route for reading a single user by ID?",
                options: [
                  "app.get('/users', handler)",
                  "app.get('/users/:id', handler)",
                  "app.fetch('/users/id', handler)",
                  "app.get('/user', { params: 'id' }, handler)",
                ],
                correctIndex: 1,
                explanation: ":id is a route parameter. Express captures it as req.params.id, allowing dynamic segments in your URL pattern.",
              },
              {
                question: "Which HTTP status code signals 'resource created successfully'?",
                options: ["200 OK", "201 Created", "204 No Content", "202 Accepted"],
                correctIndex: 1,
                explanation: "201 Created is the semantic response for successful POST requests that created a new resource. Return the created resource in the body.",
              },
            ],
          },
          {
            number: 3,
            title: "Middleware Stack",
            type: "strike-mission",
            durationMinutes: 35,
            description: "Build custom middleware for logging, JSON parsing, CORS, and error handling. Understand the req/res/next pipeline.",
            skillChecks: [
              {
                question: "What happens if middleware doesn't call next()?",
                options: [
                  "The request automatically continues",
                  "The request hangs — the next handler never executes",
                  "Express throws an error",
                  "The response is automatically sent",
                ],
                correctIndex: 1,
                explanation: "Middleware must call next() to pass control downstream. Forgetting next() leaves the client waiting indefinitely — a classic Express bug.",
              },
            ],
          },
          {
            number: 4,
            title: "Express Engine Debrief",
            type: "debrief",
            durationMinutes: 10,
            description: "Solidify Express fundamentals before the Database sector.",
          },
        ],
      },
      {
        number: 2,
        theme: "Database Warp Drive",
        missions: [
          {
            number: 1,
            title: "PostgreSQL — Data Core",
            type: "briefing",
            durationMinutes: 20,
            description: "Connect to PostgreSQL from Node.js using pg. Understand connection pools, query execution, and parameterized queries.",
          },
          {
            number: 2,
            title: "CRUD Operations",
            type: "training-op",
            durationMinutes: 30,
            description: "Build all four database operations — Create, Read, Update, Delete — with proper parameterized queries to prevent SQL injection.",
            skillChecks: [
              {
                question: "Why must you use parameterized queries?",
                options: [
                  "They're faster than string concatenation",
                  "They prevent SQL injection by separating query structure from data",
                  "They're the only way pg supports queries",
                  "They enable transactions",
                ],
                correctIndex: 1,
                explanation: "Never concatenate user input into SQL strings. Parameterized queries ($1, $2) pass data separately — the DB treats it as data, never as SQL commands.",
              },
              {
                question: "What is a connection pool?",
                options: [
                  "A list of database tables",
                  "A set of reusable database connections shared across requests, avoiding reconnect overhead",
                  "A caching layer for query results",
                  "A backup connection for failover",
                ],
                correctIndex: 1,
                explanation: "Opening a DB connection per request is slow. A pool maintains several open connections and lends them to queries — critical for throughput.",
              },
            ],
          },
          {
            number: 3,
            title: "Database Strike — Schema Design",
            type: "strike-mission",
            durationMinutes: 35,
            description: "Design a normalized schema for a missions database. Write migrations, add indexes, and implement JOIN queries.",
          },
          {
            number: 4,
            title: "Database Warp Debrief",
            type: "debrief",
            durationMinutes: 10,
            description: "Review SQL patterns before Authentication Shields.",
          },
        ],
      },
      {
        number: 3,
        theme: "Authentication Shields",
        missions: [
          {
            number: 1,
            title: "JWT — Identity Tokens",
            type: "briefing",
            durationMinutes: 20,
            description: "JSON Web Tokens are the identity cards of the galactic network. Learn JWT structure, signing, verification, and when NOT to use them.",
            practicalExample: "const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' })",
          },
          {
            number: 2,
            title: "Auth Middleware",
            type: "training-op",
            durationMinutes: 30,
            description: "Build authenticate middleware that verifies JWTs on every protected request and attaches the decoded user to req.user.",
            skillChecks: [
              {
                question: "Where should you store JWTs on the client?",
                options: [
                  "localStorage — convenient and persistent",
                  "Secure, HttpOnly cookies — protected from JavaScript access",
                  "sessionStorage — clears on tab close",
                  "In a React state variable",
                ],
                correctIndex: 1,
                explanation: "HttpOnly cookies are inaccessible to JavaScript, preventing XSS token theft. localStorage tokens are vulnerable to any XSS attack on your site.",
              },
              {
                question: "What should you check when verifying a JWT?",
                options: [
                  "Only the signature",
                  "Signature validity, expiry (exp claim), and that it was signed with your secret",
                  "Only the payload",
                  "Only the header algorithm",
                ],
                correctIndex: 1,
                explanation: "A valid JWT must have an authentic signature AND not be expired. Always let jwt.verify() check both — don't manually decode and skip verification.",
              },
            ],
          },
          {
            number: 3,
            title: "Protected Route Strike",
            type: "strike-mission",
            durationMinutes: 35,
            description: "Build a complete auth flow: register with bcrypt password hashing, login returning a JWT, and protect resource routes with middleware.",
          },
          {
            number: 4,
            title: "Authentication Shields Debrief",
            type: "debrief",
            durationMinutes: 10,
            description: "Review auth security patterns. Final sector: REST API Blueprint.",
          },
        ],
      },
      {
        number: 4,
        theme: "REST API Blueprint",
        missions: [
          {
            number: 1,
            title: "REST Design Principles",
            type: "briefing",
            durationMinutes: 20,
            description: "REST isn't magic — it's conventions. Learn resource naming, HTTP verb semantics, status codes, and HATEOAS for navigable APIs.",
          },
          {
            number: 2,
            title: "Input Validation & Error Handling",
            type: "training-op",
            durationMinutes: 30,
            description: "Validate every incoming payload with Zod or Joi, sanitize data, and build a centralized error handler that returns consistent JSON errors.",
            skillChecks: [
              {
                question: "Where should input validation happen in an Express app?",
                options: [
                  "In the database layer",
                  "At the route handler level before processing",
                  "After database writes",
                  "Only in the frontend",
                ],
                correctIndex: 1,
                explanation: "Validate at system boundaries — the moment data enters your app. Reject invalid input before it reaches business logic or the database.",
              },
            ],
          },
          {
            number: 3,
            title: "API Architecture Strike",
            type: "strike-mission",
            durationMinutes: 35,
            description: "Structure a production Express app: controllers, services, repositories, middleware layers, and proper environment configuration.",
          },
          {
            number: 4,
            title: "Kepler Station Debrief",
            type: "debrief",
            durationMinutes: 10,
            description: "Intermediate Node.js complete. Prepare for Vega Command — expert systems.",
          },
        ],
      },
    ],
  },
  {
    number: 3,
    title: "Vega Command — Node.js Mastery",
    description: "Expert engineering. Async architecture, microservices, production security, and deployment — the skills of a Systems Command Officer.",
    operationTitle: "Deploy a Production Microservice",
    operationDescription: "Build, Dockerize, and deploy a Node.js microservice with health checks, structured logging, rate limiting, and CI/CD via GitHub Actions.",
    sectors: [
      {
        number: 1,
        theme: "Async Flux Drives",
        missions: [
          {
            number: 1,
            title: "Promises — Deep Space Protocol",
            type: "briefing",
            durationMinutes: 25,
            description: "Understand the Promise state machine: pending, fulfilled, rejected. Master chaining, error propagation, and Promise combinators.",
          },
          {
            number: 2,
            title: "Async/Await Patterns",
            type: "training-op",
            durationMinutes: 35,
            description: "Write async code that reads synchronously. Master error handling, sequential vs. parallel execution, and async iteration.",
            skillChecks: [
              {
                question: "What's the difference between these two patterns?\nA: const [a, b] = [await fetch(url1), await fetch(url2)]\nB: const [a, b] = await Promise.all([fetch(url1), fetch(url2)])",
                options: [
                  "They're identical in behavior",
                  "A runs sequentially (url2 waits for url1); B runs both in parallel",
                  "B is slower because of overhead",
                  "A is the correct pattern; B is deprecated",
                ],
                correctIndex: 1,
                explanation: "Awaiting in sequence means url2's fetch doesn't start until url1 resolves. Promise.all fires both simultaneously — often 2x faster for independent requests.",
              },
              {
                question: "How do you handle errors in async/await?",
                options: [
                  ".catch() only — try/catch doesn't work with async",
                  "try/catch blocks work identically to synchronous error handling",
                  "async functions can't throw errors",
                  "Only Promise.catch() works",
                ],
                correctIndex: 1,
                explanation: "try/catch fully works with await — rejected Promises throw synchronously-equivalent errors. Both try/catch and .catch() are valid; try/catch is cleaner in async functions.",
              },
            ],
          },
          {
            number: 3,
            title: "Concurrency Patterns Strike",
            type: "strike-mission",
            durationMinutes: 40,
            description: "Implement rate-limited concurrency with p-limit, retry logic with exponential backoff, and graceful degradation for failed async operations.",
          },
          {
            number: 4,
            title: "Async Flux Debrief",
            type: "debrief",
            durationMinutes: 10,
            description: "Review async mastery before Microservices Network.",
          },
        ],
      },
      {
        number: 2,
        theme: "Microservices Network",
        missions: [
          {
            number: 1,
            title: "Microservice Architecture",
            type: "briefing",
            durationMinutes: 25,
            description: "Decompose a monolith into services. Learn the tradeoffs: independent deployability vs. network complexity, data ownership vs. joins.",
          },
          {
            number: 2,
            title: "Service Communication Patterns",
            type: "training-op",
            durationMinutes: 35,
            description: "Implement synchronous REST calls between services and asynchronous messaging with Redis pub/sub — choosing the right pattern for each use case.",
            skillChecks: [
              {
                question: "When should you use async messaging instead of synchronous HTTP between services?",
                options: [
                  "Always — async is always better",
                  "When the caller doesn't need an immediate response and you want to decouple services temporally",
                  "Only for file transfers",
                  "When HTTP is unavailable",
                ],
                correctIndex: 1,
                explanation: "Async messaging (queues, pub/sub) decouples services: the sender doesn't wait, and the receiver processes when ready. Use for emails, notifications, analytics — not for 'I need the result now' queries.",
              },
            ],
          },
          {
            number: 3,
            title: "Distributed Systems Strike",
            type: "strike-mission",
            durationMinutes: 40,
            description: "Implement an API gateway, circuit breakers, and distributed tracing across three Node.js services.",
          },
          {
            number: 4,
            title: "Microservices Debrief",
            type: "debrief",
            durationMinutes: 10,
            description: "Review distributed patterns. Final approach: Security Fortress.",
          },
        ],
      },
      {
        number: 3,
        theme: "Security Fortress",
        missions: [
          {
            number: 1,
            title: "OWASP Top 10 for Node.js",
            type: "briefing",
            durationMinutes: 25,
            description: "Study the most critical security vulnerabilities in web applications and how they manifest specifically in Node.js/Express systems.",
          },
          {
            number: 2,
            title: "Hardening Your API",
            type: "training-op",
            durationMinutes: 35,
            description: "Apply helmet.js security headers, rate limiting with express-rate-limit, CSRF protection, and secure environment variable handling.",
            skillChecks: [
              {
                question: "What does helmet.js do?",
                options: [
                  "Encrypts the request body",
                  "Sets security-relevant HTTP headers that protect against common attacks",
                  "Validates all input automatically",
                  "Implements authentication",
                ],
                correctIndex: 1,
                explanation: "helmet sets headers like Content-Security-Policy, X-Frame-Options, and HSTS — preventing XSS, clickjacking, and protocol downgrade attacks.",
              },
              {
                question: "What is a timing attack?",
                options: [
                  "An attack that slows down your server",
                  "Comparing secrets using === leaks information via response time differences between partial and full matches",
                  "A DDoS using slow requests",
                  "SQL injection through timestamp fields",
                ],
                correctIndex: 1,
                explanation: "String comparison short-circuits on first mismatch. An attacker can measure response times to deduce correct characters one by one. Use crypto.timingSafeEqual() for secret comparison.",
              },
            ],
          },
          {
            number: 3,
            title: "Security Audit Strike",
            type: "strike-mission",
            durationMinutes: 40,
            description: "Audit a vulnerable Express app: identify and fix injection vulnerabilities, insecure configurations, and missing security controls.",
          },
          {
            number: 4,
            title: "Security Fortress Debrief",
            type: "debrief",
            durationMinutes: 10,
            description: "Review security hardening before the final Production Deployment sector.",
          },
        ],
      },
      {
        number: 4,
        theme: "Production Deployment",
        missions: [
          {
            number: 1,
            title: "Docker — Container Capsule",
            type: "briefing",
            durationMinutes: 25,
            description: "Package your Node.js app into a Docker container. Write efficient Dockerfiles with multi-stage builds and minimal attack surface.",
          },
          {
            number: 2,
            title: "CI/CD Pipeline Construction",
            type: "training-op",
            durationMinutes: 30,
            description: "Build a GitHub Actions pipeline: lint, test, build Docker image, push to registry, and deploy on every merge to main.",
            skillChecks: [
              {
                question: "What is a multi-stage Docker build?",
                options: [
                  "Building on multiple servers simultaneously",
                  "Using multiple FROM instructions to separate build-time dependencies from the final runtime image",
                  "Running multiple containers at once",
                  "A Docker feature for databases only",
                ],
                correctIndex: 1,
                explanation: "Multi-stage builds install dev dependencies in a builder stage and copy only production artifacts to a clean final image — dramatically reducing image size and attack surface.",
              },
            ],
          },
          {
            number: 3,
            title: "Observability Strike",
            type: "strike-mission",
            durationMinutes: 35,
            description: "Add structured logging with Pino, expose Prometheus metrics, configure health check endpoints, and set up alerting thresholds.",
          },
          {
            number: 4,
            title: "Vega Command — Final Debrief",
            type: "debrief",
            durationMinutes: 10,
            description: "You've mastered Node.js. Rank: Systems Engineer. The server fleet is yours to command.",
          },
        ],
      },
    ],
  },
]

// ─── Next.js Path ────────────────────────────────────────────────────────────

const nextSystems: SystemDef[] = [
  {
    number: 1,
    title: "Sirius Gateway — Next.js Ignition",
    description: "Enter the Next.js dimension. Master file-based routing, Server Components, data fetching, and the App Router — your new command bridge.",
    operationTitle: "Build a Developer Blog",
    operationDescription: "Create a statically generated blog with MDX posts, dynamic routing, metadata API, and image optimization.",
    sectors: [
      {
        number: 1,
        theme: "App Router Launch Bay",
        missions: [
          {
            number: 1,
            title: "Next.js vs. React — The Upgrade",
            type: "briefing",
            durationMinutes: 15,
            description: "Next.js is React plus a production-grade framework: routing, rendering strategies, image optimization, and API routes — all wired in.",
          },
          {
            number: 2,
            title: "File-Based Routing",
            type: "training-op",
            durationMinutes: 25,
            description: "The file system is the router. Every page.tsx in app/ becomes a URL. Learn folder conventions, route groups, and parallel routes.",
            skillChecks: [
              {
                question: "How do you create a dynamic route segment in Next.js App Router?",
                options: [
                  "A folder named :slug",
                  "A folder named [slug]",
                  "A file named dynamic.tsx",
                  "export const dynamic = 'slug'",
                ],
                correctIndex: 1,
                explanation: "Wrap the segment name in square brackets: app/missions/[id]/page.tsx creates /missions/:id. Access the value via params.id in the page.",
              },
              {
                question: "What is a Route Group in Next.js?",
                options: [
                  "A group of routes that share a common prefix",
                  "A folder wrapped in parentheses that organizes routes without affecting the URL",
                  "A layout that wraps multiple pages",
                  "An array of route definitions",
                ],
                correctIndex: 1,
                explanation: "app/(marketing)/about/page.tsx creates the URL /about — the (marketing) folder is invisible to the URL. Route groups enable shared layouts without URL nesting.",
              },
              {
                question: "What file creates a shared layout for a route segment?",
                options: ["_layout.tsx", "layout.tsx", "template.tsx", "shell.tsx"],
                correctIndex: 1,
                explanation: "layout.tsx wraps all pages in its directory. It persists across navigations — state is preserved. template.tsx re-mounts on navigation.",
              },
            ],
          },
          {
            number: 3,
            title: "Layouts & Loading States",
            type: "strike-mission",
            durationMinutes: 30,
            description: "Build nested layouts, loading.tsx skeletons, and error.tsx boundaries — the three pillars of robust Next.js page architecture.",
          },
          {
            number: 4,
            title: "App Router Debrief",
            type: "debrief",
            durationMinutes: 10,
            description: "Routing fundamentals locked in. Next: Server Intelligence.",
          },
        ],
      },
      {
        number: 2,
        theme: "Server Intelligence",
        missions: [
          {
            number: 1,
            title: "Server vs. Client Components",
            type: "briefing",
            durationMinutes: 20,
            description: "The most important Next.js mental model: Server Components run only on the server (no bundle cost, direct DB access); Client Components run in the browser (interactivity, hooks).",
            practicalExample: "// Server Component — default in App Router\nasync function MissionList() {\n  const missions = await db.query.missions.findMany()\n  return <ul>{missions.map(m => <li key={m.id}>{m.title}</li>)}</ul>\n}",
          },
          {
            number: 2,
            title: "Data Fetching in Server Components",
            type: "training-op",
            durationMinutes: 30,
            description: "Fetch data directly in Server Components using async/await — no useEffect, no loading state, no API round trip from the client.",
            skillChecks: [
              {
                question: "What is the main advantage of fetching data in a Server Component?",
                options: [
                  "It uses the client's faster network",
                  "Data fetching happens on the server close to the database, the result is rendered HTML sent to the client — no client-side loading state needed",
                  "It's cached automatically forever",
                  "It works offline",
                ],
                correctIndex: 1,
                explanation: "Server Component fetches run in the datacenter next to your DB — fast, secure (no API keys exposed), and the result is pre-rendered HTML. No client JS needed for the data.",
              },
              {
                question: "Which directive makes a component a Client Component?",
                options: [
                  "export const client = true",
                  "import 'client'",
                  "'use client' at the top of the file",
                  "// @client annotation",
                ],
                correctIndex: 2,
                explanation: "'use client' at the very top of a file marks it and all its imports as Client Components — they're included in the JS bundle sent to the browser.",
              },
            ],
          },
          {
            number: 3,
            title: "Server Actions — Direct Commands",
            type: "strike-mission",
            durationMinutes: 35,
            description: "Server Actions let you call server-side code directly from client components — the end of hand-written form API routes.",
            skillChecks: [
              {
                question: "How do you define a Server Action?",
                options: [
                  "export async function action() {} in a .server.ts file",
                  "Add 'use server' directive at the top of the file or inside the function",
                  "Prefix the function name with server_",
                  "Use the @ServerAction decorator",
                ],
                correctIndex: 1,
                explanation: "'use server' in a file marks all exports as Server Actions, or inside a function body makes just that function a Server Action callable from client code.",
              },
            ],
          },
          {
            number: 4,
            title: "Server Intelligence Debrief",
            type: "debrief",
            durationMinutes: 10,
            description: "Server Component fundamentals secured. Next: rendering strategies.",
          },
        ],
      },
      {
        number: 3,
        theme: "Rendering Hyperlanes",
        missions: [
          {
            number: 1,
            title: "Static Generation — Light Speed",
            type: "briefing",
            durationMinutes: 20,
            description: "Static pages are pre-built at deploy time and served from a CDN — the fastest possible delivery. Learn when static works and how generateStaticParams unlocks dynamic static routes.",
          },
          {
            number: 2,
            title: "Dynamic Rendering & Revalidation",
            type: "training-op",
            durationMinutes: 25,
            description: "Force server-rendering with force-dynamic, or use ISR with revalidate to regenerate stale pages without a full redeploy.",
            skillChecks: [
              {
                question: "What does export const revalidate = 60 do on a page?",
                options: [
                  "Refreshes the page every 60 seconds on the client",
                  "Regenerates the static page at most once per 60 seconds when a request comes in (ISR)",
                  "Caches the page for 60 hours",
                  "Invalidates the cache every 60 requests",
                ],
                correctIndex: 1,
                explanation: "This is Incremental Static Regeneration (ISR): the page stays static until it's older than 60 seconds, then Next.js regenerates it in the background on the next request.",
              },
              {
                question: "When must a page use dynamic rendering?",
                options: [
                  "When it has images",
                  "When it reads cookies, headers, or searchParams at request time",
                  "When it imports a utility function",
                  "When it has more than 10 components",
                ],
                correctIndex: 1,
                explanation: "cookies(), headers(), and searchParams are request-time values — Next.js automatically opts the page into dynamic rendering when you access them.",
              },
            ],
          },
          {
            number: 3,
            title: "Streaming & Suspense Strike",
            type: "strike-mission",
            durationMinutes: 30,
            description: "Stream slow data with Suspense boundaries. Show instant page shells while expensive data loads in the background — progressive enhancement at the framework level.",
          },
          {
            number: 4,
            title: "Rendering Hyperlanes Debrief",
            type: "debrief",
            durationMinutes: 10,
            description: "Rendering strategies mastered. Next: Image & Metadata Ops.",
          },
        ],
      },
      {
        number: 4,
        theme: "Image & Metadata Ops",
        missions: [
          {
            number: 1,
            title: "next/image — Visual Optimization",
            type: "briefing",
            durationMinutes: 15,
            description: "next/image automatically optimizes, resizes, converts to WebP, and lazy-loads images — never serve a 4MB PNG for a 200px thumbnail again.",
          },
          {
            number: 2,
            title: "Metadata API — Mission Dossiers",
            type: "training-op",
            durationMinutes: 20,
            description: "Generate SEO-optimized metadata including Open Graph, Twitter cards, and structured data using Next.js Metadata API.",
            skillChecks: [
              {
                question: "How do you generate dynamic metadata in Next.js App Router?",
                options: [
                  "export const metadata = { title: '...' } as a const",
                  "export async function generateMetadata({ params }) { return { title: ... } }",
                  "Use next/head inside the page component",
                  "Set <meta> tags directly in the page JSX",
                ],
                correctIndex: 1,
                explanation: "generateMetadata is an async function that receives route params — enabling dynamic titles like the article name from a DB query for blog posts.",
              },
            ],
            exercises: [
              {
                title: "Dynamic Open Graph Generator",
                description: "Implement generateMetadata for a blog post page that sets title, description, and Open Graph tags from the post data.",
                starterCode: `// app/blog/[slug]/page.tsx
import { getPost } from '@/lib/blog';

// Export generateMetadata that fetches the post
// and returns title, description, and openGraph metadata
export async function generateMetadata({ params }) {
  // fetch post by slug
  // return metadata object
}

export default async function BlogPost({ params }) {
  const post = await getPost(params.slug);
  return <article>{post.content}</article>;
}`,
                solution: `import { getPost } from '@/lib/blog';

export async function generateMetadata({ params }) {
  const post = await getPost(params.slug);
  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.publishedAt,
    },
  };
}

export default async function BlogPost({ params }) {
  const post = await getPost(params.slug);
  return <article>{post.content}</article>;
}`,
                hints: ["generateMetadata receives the same params as the page", "You can reuse the same data fetch — Next.js deduplicates requests"],
                tests: [
                  { description: "returns correct title", code: "const meta = await generateMetadata({ params: { slug: 'test' } }); expect(meta.title).toBeDefined()" },
                ],
              },
            ],
          },
          {
            number: 3,
            title: "SEO & Performance Strike",
            type: "strike-mission",
            durationMinutes: 25,
            description: "Score 100 on Lighthouse: implement robots.txt, sitemap.xml via Next.js file conventions, and measure Core Web Vitals.",
          },
          {
            number: 4,
            title: "Sirius Gateway — Final Debrief",
            type: "debrief",
            durationMinutes: 10,
            description: "System 1 complete. You're ready for Rigel Platform — intermediate Next.js.",
          },
        ],
      },
    ],
  },
  {
    number: 2,
    title: "Rigel Platform — Next.js Maneuvers",
    description: "Intermediate operations. Build full-stack apps with Route Handlers, database integration, authentication, and advanced caching.",
    operationTitle: "Build a Full-Stack Task Manager",
    operationDescription: "A complete Next.js app with Clerk auth, Drizzle + Neon database, Server Actions for mutations, and optimistic UI updates.",
    sectors: [
      {
        number: 1,
        theme: "API Route Engineering",
        missions: [
          {
            number: 1,
            title: "Route Handlers — API Emitters",
            type: "briefing",
            durationMinutes: 20,
            description: "Route Handlers (route.ts files) create API endpoints in Next.js. Export named functions for each HTTP method: GET, POST, PUT, DELETE.",
            practicalExample: "// app/api/missions/route.ts\nexport async function GET() {\n  const missions = await db.query.missions.findMany()\n  return Response.json(missions)\n}",
          },
          {
            number: 2,
            title: "Request Handling & Validation",
            type: "training-op",
            durationMinutes: 30,
            description: "Read request bodies, validate with Zod, and return typed JSON responses with proper HTTP status codes.",
            skillChecks: [
              {
                question: "How do you read the JSON body in a Next.js Route Handler?",
                options: [
                  "req.body",
                  "await request.json()",
                  "JSON.parse(request.body)",
                  "request.data",
                ],
                correctIndex: 1,
                explanation: "Route Handlers use the Web Fetch API's Request object. request.json() returns a Promise with the parsed body — always await it.",
              },
              {
                question: "Which Next.js function reads the current user's auth in a Route Handler?",
                options: [
                  "getSession()",
                  "auth() from @clerk/nextjs/server",
                  "req.user",
                  "useAuth() hook",
                ],
                correctIndex: 1,
                explanation: "In server-side code (Route Handlers, Server Components, Server Actions), use auth() from @clerk/nextjs/server. Hooks like useAuth only work in Client Components.",
              },
            ],
          },
          {
            number: 3,
            title: "Middleware Interceptors",
            type: "strike-mission",
            durationMinutes: 35,
            description: "Write Next.js middleware (middleware.ts) to protect routes, redirect unauthenticated users, and add response headers before the request reaches a route.",
          },
          {
            number: 4,
            title: "API Engineering Debrief",
            type: "debrief",
            durationMinutes: 10,
            description: "API patterns locked. Next: Database Integration.",
          },
        ],
      },
      {
        number: 2,
        theme: "Database Integration",
        missions: [
          {
            number: 1,
            title: "Drizzle ORM — Schema Architect",
            type: "briefing",
            durationMinutes: 20,
            description: "Drizzle is a type-safe ORM where your schema is TypeScript first. Define tables in code, push to your DB, and get full autocomplete on every query.",
          },
          {
            number: 2,
            title: "Schema Design & Migrations",
            type: "training-op",
            durationMinutes: 30,
            description: "Design a relational schema with foreign keys, indexes, and enums in Drizzle. Push schema changes and run migrations safely.",
            skillChecks: [
              {
                question: "What does drizzle-kit push do?",
                options: [
                  "Pushes code to GitHub",
                  "Applies your Drizzle schema definition to the actual database, creating or altering tables",
                  "Generates migration SQL files only",
                  "Seeds the database with data",
                ],
                correctIndex: 1,
                explanation: "drizzle-kit push (or generate + migrate) compares your TypeScript schema to the live DB and applies the differences — the Drizzle equivalent of running migrations.",
              },
            ],
          },
          {
            number: 3,
            title: "Query Patterns Strike",
            type: "strike-mission",
            durationMinutes: 40,
            description: "Write complex Drizzle queries: JOINs with relations API, filtered selects, transactions, and pagination patterns.",
          },
          {
            number: 4,
            title: "Database Integration Debrief",
            type: "debrief",
            durationMinutes: 10,
            description: "Database mastered. Next: Authentication Protocols.",
          },
        ],
      },
      {
        number: 3,
        theme: "Authentication Protocols",
        missions: [
          {
            number: 1,
            title: "Clerk — Identity Control Tower",
            type: "briefing",
            durationMinutes: 25,
            description: "Clerk provides complete auth infrastructure: sign-up/sign-in UI, session management, webhooks, and organization management — in minutes, not weeks.",
          },
          {
            number: 2,
            title: "Protecting Routes & Server Code",
            type: "training-op",
            durationMinutes: 30,
            description: "Use Clerk middleware to protect entire route groups, auth() in Server Components, and currentUser() in Server Actions.",
            skillChecks: [
              {
                question: "What's the correct way to protect a route in Next.js with Clerk?",
                options: [
                  "Check auth in every page.tsx manually",
                  "Configure middleware.ts with Clerk's clerkMiddleware and protect routes in the matcher",
                  "Use a client-side redirect in useEffect",
                  "Add authentication to next.config.js",
                ],
                correctIndex: 1,
                explanation: "Middleware runs before any route is served. Clerk's clerkMiddleware intercepts unauthenticated requests at the edge and redirects to sign-in — the most robust approach.",
              },
            ],
          },
          {
            number: 3,
            title: "Webhook Event Processing",
            type: "strike-mission",
            durationMinutes: 35,
            description: "Handle Clerk webhook events to sync users to your database on sign-up, update profiles on changes, and clean up on deletion.",
          },
          {
            number: 4,
            title: "Authentication Debrief",
            type: "debrief",
            durationMinutes: 10,
            description: "Auth architecture complete. Final sector: Caching & Performance.",
          },
        ],
      },
      {
        number: 4,
        theme: "Caching & Performance",
        missions: [
          {
            number: 1,
            title: "Next.js Caching Architecture",
            type: "briefing",
            durationMinutes: 25,
            description: "Next.js has four caching layers: Request Memoization, Data Cache, Full Route Cache, and Router Cache. Understand what each caches and how to control them.",
          },
          {
            number: 2,
            title: "On-Demand Revalidation",
            type: "training-op",
            durationMinutes: 30,
            description: "Use revalidatePath and revalidateTag to surgically bust caches after mutations — the key to fresh data without expensive full rebuilds.",
            skillChecks: [
              {
                question: "After a Server Action mutates data, how do you update the UI?",
                options: [
                  "The page automatically re-fetches",
                  "Call revalidatePath('/dashboard') to invalidate the cache for that route",
                  "Use router.refresh() on the client",
                  "Both B and C are valid approaches",
                ],
                correctIndex: 3,
                explanation: "revalidatePath() invalidates the server cache so the next navigation gets fresh data. router.refresh() triggers a client-side refresh. Both work — use revalidatePath for server-driven, router.refresh() for client-driven.",
              },
            ],
          },
          {
            number: 3,
            title: "Streaming & Suspense Strike",
            type: "strike-mission",
            durationMinutes: 40,
            description: "Implement progressive rendering: a page shell loads instantly while slow data components stream in behind Suspense boundaries.",
          },
          {
            number: 4,
            title: "Rigel Platform Debrief",
            type: "debrief",
            durationMinutes: 10,
            description: "Intermediate Next.js complete. Prepare for Polaris Prime — expert command.",
          },
        ],
      },
    ],
  },
  {
    number: 3,
    title: "Polaris Prime — Next.js Mastery",
    description: "Expert command. Edge runtime, i18n, monorepos, and production SaaS architecture — the skills of a Warp Architect.",
    operationTitle: "Build a Production SaaS App",
    operationDescription: "Ship a complete SaaS with subscription billing (Stripe), multi-tenancy, edge middleware for geo-routing, i18n, and a Turborepo monorepo.",
    sectors: [
      {
        number: 1,
        theme: "Edge Intelligence",
        missions: [
          {
            number: 1,
            title: "Edge Runtime — Frontier Outpost",
            type: "briefing",
            durationMinutes: 25,
            description: "Edge Runtime runs your code at CDN nodes worldwide — near the user, with millisecond cold starts. Learn what's available and what's restricted.",
          },
          {
            number: 2,
            title: "Edge Middleware — Interception Grid",
            type: "training-op",
            durationMinutes: 35,
            description: "Write sophisticated middleware: A/B testing, geo-based redirects, bot detection, and JWT verification at the edge before hitting your origin.",
            skillChecks: [
              {
                question: "What CAN'T you do in Edge Runtime?",
                options: [
                  "Read request headers",
                  "Use the Node.js 'fs' module or other Node-specific APIs",
                  "Return a Response",
                  "Parse cookies",
                ],
                correctIndex: 1,
                explanation: "Edge Runtime uses the Web Platform APIs (fetch, Response, crypto) but excludes Node.js-specific APIs like fs, http, net. Use Vercel's @vercel/edge or Web Streams instead.",
              },
            ],
          },
          {
            number: 3,
            title: "Edge Function Strike",
            type: "strike-mission",
            durationMinutes: 40,
            description: "Build a complete edge middleware system: JWT auth verification at the edge, country-based content gating, and rate limiting with Upstash Redis.",
          },
          {
            number: 4,
            title: "Edge Intelligence Debrief",
            type: "debrief",
            durationMinutes: 10,
            description: "Edge mastered. Next: Deployment Galaxy.",
          },
        ],
      },
      {
        number: 2,
        theme: "Deployment Galaxy",
        missions: [
          {
            number: 1,
            title: "Vercel Deployment — Orbital Launch",
            type: "briefing",
            durationMinutes: 20,
            description: "Deploy Next.js to Vercel: preview deployments, environment variables per environment, domain configuration, and build output analysis.",
          },
          {
            number: 2,
            title: "Environment Configuration",
            type: "training-op",
            durationMinutes: 25,
            description: "Master Next.js environment variable conventions: NEXT_PUBLIC_ prefix for client exposure, per-environment overrides, and Zod validation on startup.",
            skillChecks: [
              {
                question: "Which environment variable is accessible in browser JavaScript?",
                options: [
                  "DATABASE_URL",
                  "NEXT_PUBLIC_APP_URL",
                  "All env vars are accessible everywhere",
                  "SERVER_SECRET",
                ],
                correctIndex: 1,
                explanation: "Only variables prefixed with NEXT_PUBLIC_ are included in the client bundle. Never prefix secrets — they'd be visible in browser DevTools.",
              },
            ],
          },
          {
            number: 3,
            title: "Preview & Production Strike",
            type: "strike-mission",
            durationMinutes: 30,
            description: "Configure separate preview and production environments: different databases, feature flags, and environment-specific Clerk applications.",
          },
          {
            number: 4,
            title: "Deployment Galaxy Debrief",
            type: "debrief",
            durationMinutes: 10,
            description: "Deployment patterns locked. Next: Internationalization Frontier.",
          },
        ],
      },
      {
        number: 3,
        theme: "Internationalization Frontier",
        missions: [
          {
            number: 1,
            title: "i18n Routing Setup",
            type: "briefing",
            durationMinutes: 25,
            description: "Configure locale-based routing in Next.js: /en/missions, /es/missions. Set up locale detection in middleware and locale-aware layouts.",
          },
          {
            number: 2,
            title: "Translation Systems",
            type: "training-op",
            durationMinutes: 35,
            description: "Implement translations with next-intl or react-i18next. Organize namespaces, handle pluralization, and lazy-load translation bundles.",
            skillChecks: [
              {
                question: "What is the best strategy for loading translations?",
                options: [
                  "Bundle all locales in the main JS bundle",
                  "Load only the active locale's translations and lazy-load others on demand",
                  "Fetch translations from an API on every page load",
                  "Store translations in localStorage",
                ],
                correctIndex: 1,
                explanation: "Including all locales in the bundle wastes bytes for users who only need one language. Load the active locale at build time; import others only if the user switches.",
              },
            ],
          },
          {
            number: 3,
            title: "Locale-Aware Components Strike",
            type: "strike-mission",
            durationMinutes: 40,
            description: "Build locale-aware date/number formatters, RTL layout support, and a language switcher that preserves the current route.",
          },
          {
            number: 4,
            title: "i18n Frontier Debrief",
            type: "debrief",
            durationMinutes: 10,
            description: "Internationalization complete. Final sector: Full-Stack Mastery.",
          },
        ],
      },
      {
        number: 4,
        theme: "Full-Stack Mastery",
        missions: [
          {
            number: 1,
            title: "SaaS Architecture Patterns",
            type: "briefing",
            durationMinutes: 30,
            description: "Architect a multi-tenant SaaS: organization-scoped data, subscription gates, usage metering, and the patterns that keep tenants isolated.",
          },
          {
            number: 2,
            title: "Turborepo — Fleet Formation",
            type: "training-op",
            durationMinutes: 40,
            description: "Structure a Turborepo monorepo: shared packages for UI components, utilities, and types — consumed by the Next.js app, API server, and email templates.",
            skillChecks: [
              {
                question: "What is the key benefit of a monorepo with Turborepo?",
                options: [
                  "Forces all teams to use the same tech stack",
                  "Intelligent caching of build outputs — unchanged packages reuse cached results, slashing CI time",
                  "Runs all apps in a single process",
                  "Eliminates the need for Docker",
                ],
                correctIndex: 1,
                explanation: "Turborepo's remote cache means if nothing in package A changed, its build output is pulled from cache in milliseconds instead of rebuilt — massive CI/CD speedups.",
              },
            ],
          },
          {
            number: 3,
            title: "Production Optimization Strike",
            type: "strike-mission",
            durationMinutes: 45,
            description: "Profile and optimize a full Next.js app: bundle analysis, eliminating render-blocking resources, database query optimization, and Core Web Vitals tuning.",
          },
          {
            number: 4,
            title: "Polaris Prime — Final Debrief",
            type: "debrief",
            durationMinutes: 10,
            description: "You've mastered Next.js. Rank: Warp Architect. The entire galactic network is within your reach.",
          },
        ],
      },
    ],
  },
]

// ─── Main ────────────────────────────────────────────────────────────────────

async function seed() {
  console.log("🚀 Seeding full curriculum...")

  await db.insert(tracks).values([
    {
      id: "react",
      name: "React",
      characterClass: "Reactor Pilot",
      icon: "⚛️",
      description: "Build dynamic UIs with the most popular frontend library. From JSX to advanced patterns.",
      isActive: true,
    },
    {
      id: "nodejs",
      name: "Node.js",
      characterClass: "Systems Engineer",
      icon: "🖥️",
      description: "Master server-side JavaScript. Build APIs, CLI tools, and production backend systems.",
      isActive: true,
    },
    {
      id: "nextjs",
      name: "Next.js",
      characterClass: "Warp Architect",
      icon: "🌐",
      description: "Ship full-stack React apps at warp speed. SSR, App Router, and production SaaS patterns.",
      isActive: true,
    },
  ]).onConflictDoNothing()

  console.log("✓ Tracks seeded")

  for (const sys of reactSystems) {
    await seedSystem("react", sys)
    console.log(`✓ React System ${sys.number}: ${sys.title}`)
  }

  for (const sys of nodeSystems) {
    await seedSystem("nodejs", sys)
    console.log(`✓ Node.js System ${sys.number}: ${sys.title}`)
  }

  for (const sys of nextSystems) {
    await seedSystem("nextjs", sys)
    console.log(`✓ Next.js System ${sys.number}: ${sys.title}`)
  }

  console.log("✅ Full curriculum seeded!")
  process.exit(0)
}

seed().catch(err => {
  console.error("❌ Seed failed:", err)
  process.exit(1)
})
