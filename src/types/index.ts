export interface Config {
  aiApiKey: string;
  bookingApiKey: string;
  autoReplyEnabled: boolean;
}

export interface EmailData {
  subject: string;
  body: string;
  sender: string;
}

export interface AIResponse {
  reply: string;
  isBookingRequest: boolean;
}

export interface BookingSlot {
  id: string;
  time: string;
  available: boolean;
}

export interface BookingResponse {
  slotId: string;
  time: string;
  confirmation: string;
}
