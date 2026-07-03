// Runs every browser-runnable exercise's reference solution against its own
// stored tests, replicating the Sandpack harness in components/exercises/
// exercise-runner.tsx (same injected globals, same `Component` default import).
// Guards against shipping an exercise whose solution can't pass its tests.
//
// Runs in the node environment with a hand-rolled JSDOM: vitest's jsdom
// environment swaps in jsdom's TextEncoder/Uint8Array realm, which breaks
// esbuild's runtime invariant check.
import { describe, test, expect, afterEach } from "vitest"
import { transformSync } from "esbuild"
import { JSDOM } from "jsdom"
import * as React from "react"
import * as jsxRuntime from "react/jsx-runtime"
import { reactSystems, nodeSystems, nextSystems } from "../curriculum-data"

const dom = new JSDOM("<!doctype html><html><body></body></html>", { url: "http://localhost/" })
const g = globalThis as Record<string, unknown>
g.window = dom.window
g.document = dom.window.document
Object.defineProperty(globalThis, "navigator", { value: dom.window.navigator, configurable: true })
g.localStorage = dom.window.localStorage
g.IS_REACT_ACT_ENVIRONMENT = true

// Import RTL only after the DOM globals exist.
const RTL = await import("@testing-library/react")

// Mirrors isBrowserRunnable in components/exercises/exercise-runner.tsx —
// kept inline so this Node test doesn't import a "use client" Sandpack module.
function isBrowserRunnable(code: string): boolean {
  return !/require\(|from ["']@\/|["']fs["']|process\./.test(code)
}

function sandboxRequire(id: string): unknown {
  if (id === "react") return React
  if (id === "react/jsx-runtime") return jsxRuntime
  throw new Error(`Exercise imports a module the sandbox doesn't provide: ${id}`)
}

function evalSolution(source: string): unknown {
  const { code } = transformSync(source, { loader: "jsx", format: "cjs", jsx: "automatic" })
  const moduleObj = { exports: {} as Record<string, unknown> }
  new Function("require", "module", "exports", code)(sandboxRequire, moduleObj, moduleObj.exports)
  return moduleObj.exports.default ?? moduleObj.exports
}

async function runTestBody(body: string, Component: unknown): Promise<void> {
  const wrapped = `exports.run = function () {\n${body}\n};`
  const { code } = transformSync(wrapped, { loader: "jsx", format: "cjs", jsx: "automatic" })
  const moduleObj = { exports: {} as { run?: () => unknown } }
  new Function(
    "require", "module", "exports", "Component", "expect",
    "render", "fireEvent", "screen", "renderHook", "act", "cleanup", "within",
    code
  )(
    sandboxRequire, moduleObj, moduleObj.exports, Component, expect,
    RTL.render, RTL.fireEvent, RTL.screen, RTL.renderHook, RTL.act, RTL.cleanup, RTL.within
  )
  await moduleObj.exports.run!()
}

const allSystems = [
  ...reactSystems.map(s => ({ track: "react", sys: s })),
  ...nodeSystems.map(s => ({ track: "nodejs", sys: s })),
  ...nextSystems.map(s => ({ track: "nextjs", sys: s })),
]

for (const { track, sys } of allSystems) {
  for (const sec of sys.sectors) {
    for (const m of sec.missions) {
      for (const ex of m.exercises ?? []) {
        if (!isBrowserRunnable(ex.starterCode) || ex.tests.length === 0) continue
        describe(`${track} / ${m.title} / ${ex.title}`, () => {
          afterEach(() => RTL.cleanup())
          for (const t of ex.tests) {
            test(t.description, async () => {
              const Component = evalSolution(ex.solution)
              await runTestBody(t.code, Component)
            })
          }
        })
      }
    }
  }
}
