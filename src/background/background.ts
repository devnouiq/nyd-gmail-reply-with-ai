// Background script for Gmail AI Responder Chrome Extension
//@ts-nocheck
// chrome types are provided by @types/chrome
// Background script for Gmail AI Responder Chrome Extension

// Declare chrome as a global variable to satisfy the linter
declare const chrome: any

chrome.runtime.onInstalled.addListener(() => {
  console.log("Gmail AI Responder extension installed")

  // Initialize default settings
  chrome.storage.sync.get(["defaultSettings"], (result) => {
    if (!result.defaultSettings) {
      chrome.storage.sync.set({
        defaultSettings: {
          aiResponseEnabled: true,
          bookingEnabled: true,
          autoOpenEnabled: true,
          // Any other default settings here
        },
      })
    }
  })

  // Set rules for when to enable the extension icon
  chrome.declarativeContent.onPageChanged.removeRules(undefined, () => {
    chrome.declarativeContent.onPageChanged.addRules([
      {
        conditions: [
          new chrome.declarativeContent.PageStateMatcher({
            pageUrl: { hostEquals: "mail.google.com" },
          }),
        ],
        actions: [new chrome.declarativeContent.ShowPageAction()],
      },
    ])
  })
})

// Listen for actions that need background processing
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "makeAIAPICall") {
    // This would handle the API call in a production extension
    // For security purposes, API calls should be made from the background script
    // rather than content scripts or popup
    makeAPICall(request.data)
      .then((response) => sendResponse({ success: true, response }))
      .catch((error) => sendResponse({ success: false, error: error.message }))

    return true // Indicates that we will send a response asynchronously
  } else if (request.action === "openPopup") {
    // Auto-open popup when new email is detected
    if (request.forceOpen) {
      // This is a direct request to open the popup
      console.log("Force opening popup")

      // Try to open the popup
      try {
        chrome.action
          .openPopup()
          .then(() => console.log("Popup opened successfully via action.openPopup"))
          .catch((error) => {
            console.log("Direct popup open failed:", error)

            // Set badge to draw attention
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
              if (tabs[0]?.id) {
                chrome.action.setBadgeText({ text: "📧", tabId: tabs[0].id })
                chrome.action.setBadgeBackgroundColor({ color: "#4285f4", tabId: tabs[0].id })
              }
            })
          })
      } catch (error) {
        console.error("Error trying to open popup:", error)
      }
    } else {
      handleAutoOpenPopup(request.emailId, sender.tab?.id)
    }
    sendResponse({ success: true })
    return true
  }
})

/**
 * Handle auto-opening popup when new email is detected
 */
async function handleAutoOpenPopup(emailId: string, tabId?: number) {
  try {
    console.log("Attempting to auto-open popup for email:", emailId)

    // Check if auto-open is enabled
    const settings = await chrome.storage.sync.get(["defaultSettings"])
    if (!settings.defaultSettings?.autoOpenEnabled) {
      console.log("Auto-open is disabled in settings")
      return
    }

    // Store the current email ID for the popup to use
    await chrome.storage.local.set({
      currentEmailId: emailId,
      autoOpened: true,
      timestamp: Date.now(),
    })

    // Try to open the popup
    if (tabId) {
      try {
        console.log("Attempting to open popup via chrome.action.openPopup")
        await chrome.action.openPopup()
        console.log("Popup opened successfully")
      } catch (error) {
        console.log("Could not open popup directly:", error)

        // Set badge as fallback
        chrome.action.setBadgeText({ text: "📧", tabId })
        chrome.action.setBadgeBackgroundColor({ color: "#4285f4", tabId })
      }
    }
  } catch (error) {
    console.error("Error in handleAutoOpenPopup:", error)
  }
}

/**
 * Make an API call to the AI service
 * This is a placeholder for actual API implementation
 */
async function makeAPICall(data: any): Promise<any> {
  // In a production extension, this would be an actual API call
  // with proper authentication, error handling, etc.
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        result: "This is a simulated API response",
        timestamp: new Date().toISOString(),
      })
    }, 1000)
  })
}

// Clear badge when popup is opened
chrome.action.onClicked.addListener((tab) => {
  if (tab.id) {
    chrome.action.setBadgeText({ text: "", tabId: tab.id })
  }
})
