import { describe, it, expect } from "vitest"
import { readJson } from "@/lib/http"

const req = (body: string) => new Request("http://test.local", { method: "POST", body })

describe("readJson", () => {
  it("parses a JSON body", async () => {
    expect(await readJson(req('{"a":1}'))).toEqual({ a: 1 })
  })

  it("returns undefined for a malformed or empty body", async () => {
    expect(await readJson(req("{nope"))).toBeUndefined()
    expect(await readJson(req(""))).toBeUndefined()
  })
})
