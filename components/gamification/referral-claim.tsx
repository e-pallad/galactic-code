"use client"

import { useEffect } from "react"

export function ReferralClaim() {
  useEffect(() => {
    fetch("/api/referral/claim", { method: "POST" }).catch(() => {})
  }, [])
  return null
}
