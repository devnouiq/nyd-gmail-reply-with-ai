import { Config } from "../types";

// Load saved configuration
document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.sync.get(
    ["aiApiKey", "bookingApiKey", "autoReplyEnabled"],
    (data) => {
      (document.getElementById("aiApiKey") as HTMLInputElement).value =
        data.aiApiKey || "";
      (document.getElementById("bookingApiKey") as HTMLInputElement).value =
        data.bookingApiKey || "";
      (
        document.getElementById("autoReplyEnabled") as HTMLInputElement
      ).checked = data.autoReplyEnabled !== false;
    }
  );

  // Save configuration
  document.getElementById("saveBtn")?.addEventListener("click", () => {
    const config: Config = {
      aiApiKey: (document.getElementById("aiApiKey") as HTMLInputElement).value,
      bookingApiKey: (
        document.getElementById("bookingApiKey") as HTMLInputElement
      ).value,
      autoReplyEnabled: (
        document.getElementById("autoReplyEnabled") as HTMLInputElement
      ).checked,
    };

    chrome.storage.sync.set(config, () => {
      const status = document.getElementById("status")!;
      status.textContent = "Settings saved!";
      setTimeout(() => (status.textContent = ""), 2000);
    });
  });
});
