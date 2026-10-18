export interface StarMapNode {
  id: string
  type: "topic" | "subtopic"
  label: string
  children?: StarMapNode[]
}

export interface StarMapData {
  slug: string
  title: string
  description: string
  nodes: StarMapNode[]
}

export async function getStarMap(slug: string): Promise<StarMapData | null> {
  // The slug becomes part of an import path: only plain file names get through.
  if (!/^[a-z0-9-]+$/.test(slug)) return null
  try {
    const data = await import(`@/content/star-maps/${slug}.json`, { with: { type: "json" } }) as { default: StarMapData }
    return data.default
  } catch {
    return null
  }
}

export function findStarMapNode(nodes: StarMapNode[], id: string): StarMapNode | null {
  for (const node of nodes) {
    if (node.id === id) return node
    const inChild = node.children ? findStarMapNode(node.children, id) : null
    if (inChild) return inChild
  }
  return null
}
