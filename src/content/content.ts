import { EmailData } from "../types";

// Function to extract email data from Gmail DOM
function getEmailData(): EmailData | null {
  const subjectEl = document.querySelector("h2.hP");
  const bodyEl = document.querySelector(".a3s.aiL");
  const senderEl = document.querySelector(".gD");

  if (!subjectEl || !bodyEl || !senderEl) return null;

  return {
    subject: subjectEl.textContent || "",
    body: bodyEl.textContent || "",
    sender: senderEl.textContent || "",
  };
}

// Function to simulate typing and sending a reply
function sendReply(reply: string): void {
  const replyButton = document.querySelector(".ams.bkH") as HTMLElement;
  if (!replyButton) return;

  replyButton.click();

  setTimeout(() => {
    const replyBox = document.querySelector(
      ".Am.aO9.Al"
    ) as HTMLTextAreaElement;
    if (replyBox) {
      replyBox.value = reply;
      replyBox.dispatchEvent(new Event("input", { bubbles: true }));

      const sendButton = document.querySelector(
        ".T-I.J-J5-Ji.aoO.v7"
      ) as HTMLElement;
      if (sendButton) sendButton.click();
    }
  }, 500);
}

// Listen for email open
let lastEmail: string | null = null;
function checkEmail() {
  const emailData = getEmailData();
  if (emailData && emailData.body !== lastEmail) {
    lastEmail = emailData.body;
    chrome.runtime.sendMessage({ action: "processEmail", emailData });
  }
}

// Observe DOM changes to detect email open
const observer = new MutationObserver(checkEmail);
observer.observe(document.body, { childList: true, subtree: true });

// Handle messages from background script
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "sendReply" && message.reply) {
    sendReply(message.reply);
  }
});
