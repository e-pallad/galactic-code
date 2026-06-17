"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { RarityBadge } from "@/components/armory/rarity-badge"

interface LootItem {
  id: string
  name: string
  icon: string
  rarity: string
}

interface LootRevealModalProps {
  open: boolean
  onClose: () => void
  lootItems: LootItem[]
  creditsEarned: number
  xpEarned: number
  entityName: string
}

export function LootRevealModal({ open, onClose, lootItems, creditsEarned, xpEarned, entityName }: LootRevealModalProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="bg-[#0d1520] border-[#1e2d3d]">
        <DialogHeader>
          <DialogTitle className="text-[#f59e0b] font-heading">Victory!</DialogTitle>
        </DialogHeader>
        <p className="text-[#94a3b8] text-sm">{entityName} has been defeated!</p>
        <div className="grid grid-cols-2 gap-3 my-3">
          <div className="rounded-lg bg-[#080C14] p-3 text-center">
            <p className="text-xl font-bold text-[#f59e0b] font-mono">⟁ {creditsEarned}</p>
            <p className="text-xs text-[#94a3b8]">Credits Earned</p>
          </div>
          <div className="rounded-lg bg-[#080C14] p-3 text-center">
            <p className="text-xl font-bold text-[#06B6D4] font-mono">+{xpEarned} XP</p>
            <p className="text-xs text-[#94a3b8]">Experience</p>
          </div>
        </div>
        {lootItems.length > 0 ? (
          <div>
            <p className="text-sm font-medium text-[#e2e8f0] mb-2">Loot Drops</p>
            <div className="space-y-2">
              {lootItems.map((item) => (
                <div key={item.id} className="flex items-center gap-3 rounded-lg bg-[#080C14] p-2">
                  <span className="text-xl">{item.icon}</span>
                  <span className="text-sm text-[#e2e8f0]">{item.name}</span>
                  <RarityBadge rarity={item.rarity} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-xs text-[#94a3b8]">No loot dropped this time.</p>
        )}
        <Button className="w-full mt-2" onClick={onClose}>Continue</Button>
      </DialogContent>
    </Dialog>
  )
}
