import {
  Config,
  EmailData,
  AIResponse,
  BookingSlot,
  BookingResponse,
} from "../types";
import { generateAIReply, getAvailableSlots, bookSlot } from "../utils/api";

// Load configuration
async function getConfig(): Promise<Config> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(
      ["aiApiKey", "bookingApiKey", "autoReplyEnabled"],
      (data) => {
        resolve({
          aiApiKey: data.aiApiKey || "",
          bookingApiKey: data.bookingApiKey || "",
          autoReplyEnabled: data.autoReplyEnabled !== false,
        });
      }
    );
  });
}

// Handle incoming messages
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
  if (message.action !== "processEmail") return;

  const config = await getConfig();
  if (!config.autoReplyEnabled || !config.aiApiKey) return;

  const emailData: EmailData = message.emailData;

  try {
    // Generate AI reply
    const aiResponse: AIResponse = await generateAIReply(
      config.aiApiKey,
      emailData
    );
    let reply = aiResponse.reply;

    // Handle booking request
    if (aiResponse.isBookingRequest && config.bookingApiKey) {
      const slots: BookingSlot[] = await getAvailableSlots(
        config.bookingApiKey
      );
      const availableSlot = slots.find((slot) => slot.available);

      if (availableSlot) {
        const booking: BookingResponse = await bookSlot(
          config.bookingApiKey,
          availableSlot.id
        );
        reply += `\n\nBooking Confirmation: Slot booked for ${booking.time}. Confirmation: ${booking.confirmation}`;
      } else {
        reply +=
          "\n\nNo available slots found. Please suggest an alternative time.";
      }
    }

    // Send reply back to content script
    chrome.tabs.sendMessage(sender.tab!.id!, { action: "sendReply", reply });
  } catch (error) {
    console.error("Background error:", error);
  }
});
