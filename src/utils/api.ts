import { EmailData, AIResponse, BookingSlot, BookingResponse } from "../types";

export async function generateAIReply(
  apiKey: string,
  email: EmailData
): Promise<AIResponse> {
  try {
    const response = await fetch("https://api.x.ai/generate-response", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: `Generate a professional reply for the following email:\nSubject: ${email.subject}\nFrom: ${email.sender}\nBody: ${email.body}\n\nDetect if the email is requesting a booking slot.`,
        maxTokens: 200,
      }),
    });

    if (!response.ok) throw new Error("AI API request failed");
    const data = await response.json();
    return {
      reply: data.reply,
      isBookingRequest: data.isBookingRequest || false,
    };
  } catch (error) {
    console.error("AI API error:", error);
    throw error;
  }
}

export async function getAvailableSlots(
  apiKey: string
): Promise<BookingSlot[]> {
  try {
    const response = await fetch("https://api.booking.com/get-slots", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) throw new Error("Booking API request failed");
    return await response.json();
  } catch (error) {
    console.error("Booking API error:", error);
    throw error;
  }
}

export async function bookSlot(
  apiKey: string,
  slotId: string
): Promise<BookingResponse> {
  try {
    const response = await fetch("https://api.booking.com/book-slot", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ slotId }),
    });

    if (!response.ok) throw new Error("Booking API request failed");
    return await response.json();
  } catch (error) {
    console.error("Booking API error:", error);
    throw error;
  }
}
