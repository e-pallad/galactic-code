"use client"

import { track } from "@vercel/analytics"

type MissionCompleteEvent = {
  mission_title: string
  mission_type: string
  track: string
  used_focus_cycle: boolean
  leveled_up: boolean
  xp_earned: number
}

type MissionSkipEvent = {
  mission_title: string
  mission_type: string
  track: string
}

type SkillCheckEvent = {
  score: number
  passed: boolean
  perfect: boolean
  xp_earned: number
  question_count: number
}

type OnboardingEvent = {
  track: string
  daily_goal?: number
}

type OperationEvent = {
  track: string
  system_number: number
  has_repo: boolean
  has_live_url: boolean
}

type DemoEvent = Record<string, never>

export const analytics = {
  missionComplete: (props: MissionCompleteEvent) =>
    track("mission_complete", props),

  missionSkip: (props: MissionSkipEvent) =>
    track("mission_skip", props),

  skillCheckSubmit: (props: SkillCheckEvent) =>
    track("skill_check_submit", props),

  trackSelected: (props: OnboardingEvent) =>
    track("track_selected", props),

  onboardingComplete: (props: OnboardingEvent) =>
    track("onboarding_complete", props),

  operationSubmit: (props: OperationEvent) =>
    track("operation_submit", props),

  demoStarted: (_props: DemoEvent) =>
    track("demo_started"),
}
