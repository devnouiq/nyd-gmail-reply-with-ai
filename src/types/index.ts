export interface EmailData {
  subject: string
  sender: string
  content: string
  timestamp: string
  messageId?: string
}

export interface AIResponse {
  response: string
  confidence: number
  requiresBooking: boolean
  suggestedSlots?: BookingSlot[]
}

export interface BookingSlot {
  id: string
  date: string
  time: string
  duration: number
  available: boolean
  title?: string
}

export interface ExtensionSettings {
  aiApiKey: string
  bookingApiUrl: string
  autoReplyEnabled: boolean
  responseTemplate: string
  bookingEnabled: boolean
  defaultDuration: number
  responseStyle: 'professional' | 'friendly' | 'casual' | 'formal'
  responseLength: 'short' | 'medium' | 'long'
  includeSignature: boolean
  processingDelay: number
  debugMode: boolean
  notificationsEnabled: boolean
}

export interface BookingRequest {
  emailId: string
  slotId: string
  requestedDate?: string
  requestedTime?: string
  duration?: number
  purpose: string
  attendeeEmail: string
}

export interface DailyStats {
  emailsProcessed: number
  responsesGenerated: number
  slotsBooked: number
  date: string
}

export interface ChromeMessage {
  type: string
  data?: any
  emailData?: EmailData
  bookingRequest?: BookingRequest
  date?: string
}

export interface ChromeResponse {
  success: boolean
  data?: any
  error?: string
}
