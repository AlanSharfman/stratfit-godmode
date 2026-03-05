import { create } from "zustand"
import type { KpiKey } from "@/domain/intelligence/kpiZoneMapping"

export interface Participant {
  id: string
  name: string
  color: string
  currentPage: string
  lastSeen: number
  cursor?: { x: number; y: number }
}

export interface SharedEvent {
  type: "scenario_applied" | "kpi_focused" | "page_navigated" | "cursor_moved" | "participant_joined" | "participant_left"
  participantId: string
  payload: Record<string, unknown>
  timestamp: number
}

interface CollaborationState {
  sessionId: string | null
  myId: string
  myName: string
  participants: Map<string, Participant>
  isConnected: boolean
  events: SharedEvent[]

  startSession: (name: string) => void
  endSession: () => void
  broadcastEvent: (event: Omit<SharedEvent, "participantId" | "timestamp">) => void
  updateCursor: (x: number, y: number) => void
  navigateTo: (page: string) => void
}

const CHANNEL_NAME = "stratfit-collab"
const COLORS = ["#22d3ee", "#a78bfa", "#f472b6", "#34d399", "#fbbf24", "#fb923c", "#60a5fa"]

function genId() { return Math.random().toString(36).slice(2, 10) }

let channel: BroadcastChannel | null = null

export const useCollaborationStore = create<CollaborationState>((set, get) => ({
  sessionId: null,
  myId: genId(),
  myName: "",
  participants: new Map(),
  isConnected: false,
  events: [],

  startSession: (name: string) => {
    const state = get()
    const sessionId = genId()

    if (channel) channel.close()
    channel = new BroadcastChannel(CHANNEL_NAME)

    const me: Participant = {
      id: state.myId,
      name,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      currentPage: window.location.pathname,
      lastSeen: Date.now(),
    }

    channel.onmessage = (e) => {
      const evt = e.data as SharedEvent
      set((s) => {
        const events = [...s.events.slice(-100), evt]
        const participants = new Map(s.participants)

        if (evt.type === "participant_joined") {
          participants.set(evt.participantId, evt.payload as unknown as Participant)
        } else if (evt.type === "participant_left") {
          participants.delete(evt.participantId)
        } else if (evt.type === "cursor_moved") {
          const p = participants.get(evt.participantId)
          if (p) participants.set(evt.participantId, { ...p, cursor: evt.payload as { x: number; y: number }, lastSeen: Date.now() })
        } else if (evt.type === "page_navigated") {
          const p = participants.get(evt.participantId)
          if (p) participants.set(evt.participantId, { ...p, currentPage: evt.payload.page as string, lastSeen: Date.now() })
        }

        return { events, participants }
      })
    }

    channel.postMessage({
      type: "participant_joined",
      participantId: state.myId,
      payload: me,
      timestamp: Date.now(),
    })

    set({ sessionId, myName: name, isConnected: true, participants: new Map([[state.myId, me]]) })
  },

  endSession: () => {
    const state = get()
    if (channel) {
      channel.postMessage({
        type: "participant_left",
        participantId: state.myId,
        payload: {},
        timestamp: Date.now(),
      })
      channel.close()
      channel = null
    }
    set({ sessionId: null, isConnected: false, participants: new Map(), events: [] })
  },

  broadcastEvent: (event) => {
    const state = get()
    if (!channel || !state.isConnected) return
    const full: SharedEvent = { ...event, participantId: state.myId, timestamp: Date.now() }
    channel.postMessage(full)
    set((s) => ({ events: [...s.events.slice(-100), full] }))
  },

  updateCursor: (x, y) => {
    const state = get()
    if (!channel || !state.isConnected) return
    channel.postMessage({
      type: "cursor_moved",
      participantId: state.myId,
      payload: { x, y },
      timestamp: Date.now(),
    })
  },

  navigateTo: (page) => {
    get().broadcastEvent({ type: "page_navigated", payload: { page } })
  },
}))
