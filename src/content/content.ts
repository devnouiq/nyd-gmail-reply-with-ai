//@ts-nocheck
// Declare chrome variable to avoid linting error
// Declare chrome variable to avoid linting error
declare const chrome: any

// Initialize connection with Gmail page
;(() => {
  console.log("Gmail AI Responder content script loaded")

  let currentEmailId: string | null = null
  let autoOpenEnabled = true
  let emailCheckInterval: NodeJS.Timeout | null = null
  let floatingButton: HTMLElement | null = null
  let isObserving = false

  // Start monitoring for email changes
  startEmailMonitoring()

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getEmailContent") {
      const emailContent = extractEmailContent()
      const metadata = extractEmailMetadata()
      const emailId = getEmailId()

      sendResponse({
        emailContent,
        emailId,
        metadata: {
          sender: metadata.sender,
          senderEmail: metadata.senderEmail,
          subject: metadata.subject,
          date: metadata.date,
          recipients: metadata.recipients,
          hasOpenEmail: hasOpenEmail(),
          isConversation: isConversationView(),
        },
      })
      return true
    } else if (request.action === "insertResponse") {
      const success = insertResponseToReplyBox(request.response)
      sendResponse({ success })
      return true
    } else if (request.action === "setAutoOpen") {
      autoOpenEnabled = request.enabled
      sendResponse({ success: true })
      return true
    }
  })

  // Inject styles for our custom UI elements
  injectStyles()

  // Create a floating button that will always be visible when an email is open
  function createFloatingButton() {
    console.log("Creating floating button")

    // Remove existing button if any
    removeFloatingButton()

    // Create the button
    floatingButton = document.createElement("div")
    floatingButton.id = "gmail-ai-floating-button"
    floatingButton.innerHTML = `
      <div class="gmail-ai-button-icon">🤖</div>
      <div class="gmail-ai-button-tooltip">AI Assistant</div>
    `

    // Add click handler
    floatingButton.addEventListener("click", () => {
      // Try to open the extension popup
      chrome.runtime.sendMessage({ action: "openPopup", forceOpen: true })
      console.log("Floating button clicked, opening popup")
    })

    // Add to page
    document.body.appendChild(floatingButton)
    console.log("Floating button added to page")
  }

  // Remove the floating button
  function removeFloatingButton() {
    if (floatingButton && floatingButton.parentNode) {
      floatingButton.parentNode.removeChild(floatingButton)
      floatingButton = null
      console.log("Floating button removed")
    }
  }

  // Inject CSS styles for our custom elements
  function injectStyles() {
    const styleId = "gmail-ai-assistant-styles"

    // Check if styles are already injected
    if (document.getElementById(styleId)) {
      return
    }

    const styleElement = document.createElement("style")
    styleElement.id = styleId
    styleElement.textContent = `
      /* Floating Button */
      #gmail-ai-floating-button {
        position: fixed;
        bottom: 30px;
        right: 30px;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: #1a73e8;
        color: white;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 999999;
        transition: all 0.3s ease;
        animation: gmail-ai-pulse 2s infinite;
      }

      #gmail-ai-floating-button:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 12px rgba(0, 0, 0, 0.4);
        animation: none;
      }

      .gmail-ai-button-icon {
        font-size: 28px;
      }

      .gmail-ai-button-tooltip {
        position: absolute;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 5px 10px;
        border-radius: 4px;
        font-size: 12px;
        white-space: nowrap;
        top: -30px;
        opacity: 0;
        transition: opacity 0.3s;
        pointer-events: none;
      }

      #gmail-ai-floating-button:hover .gmail-ai-button-tooltip {
        opacity: 1;
      }

      /* Animations */
      @keyframes gmail-ai-pulse {
        0% {
          box-shadow: 0 0 0 0 rgba(26, 115, 232, 0.7);
        }
        70% {
          box-shadow: 0 0 0 10px rgba(26, 115, 232, 0);
        }
        100% {
          box-shadow: 0 0 0 0 rgba(26, 115, 232, 0);
        }
      }
    `
    document.head.appendChild(styleElement)
    console.log("Styles injected")
  }

  // Improve the email monitoring function with MutationObserver
  function startEmailMonitoring() {
    console.log("Starting email monitoring")

    // Create a MutationObserver to detect DOM changes
    if (!isObserving) {
      const observer = new MutationObserver((mutations) => {
        // Check if we need to look for emails
        checkForOpenEmail()
      })

      // Start observing the document with the configured parameters
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["class", "style", "aria-expanded"],
      })

      isObserving = true
      console.log("MutationObserver started")
    }

    // Also use interval as a backup method
    if (!emailCheckInterval) {
      emailCheckInterval = setInterval(checkForOpenEmail, 1000)
      console.log("Email check interval started")
    }

    // Initial check
    setTimeout(checkForOpenEmail, 500)

    // Also check when URL changes (Gmail is a SPA)
    window.addEventListener("hashchange", () => {
      console.log("URL changed, checking for email")
      setTimeout(checkForOpenEmail, 500)
    })
  }

  // Function to check if an email is open
  function checkForOpenEmail() {
    const newEmailId = getEmailId()
    const hasEmail = hasOpenEmail()

    // Debug logging
    console.log("Email check:", { newEmailId, currentEmailId, hasEmail, floatingButtonExists: !!floatingButton })

    // Show or hide the floating button based on whether an email is open
    if (hasEmail) {
      if (!floatingButton) {
        createFloatingButton()
      }
    } else if (floatingButton) {
      removeFloatingButton()
    }

    // Update current email ID
    if (newEmailId !== currentEmailId) {
      currentEmailId = newEmailId
      console.log("Email ID updated:", currentEmailId)
    }
  }

  /**
   * Get unique email identifier with improved detection
   */
  function getEmailId(): string | null {
    try {
      // Try to get message ID from Gmail's data attributes
      const messageElement = document.querySelector("[data-message-id]")
      if (messageElement) {
        return messageElement.getAttribute("data-message-id")
      }

      // Try to get thread ID
      const threadElement = document.querySelector("[data-legacy-thread-id]")
      if (threadElement) {
        return threadElement.getAttribute("data-legacy-thread-id")
      }

      // Try to get ID from URL
      const url = window.location.href
      const threadMatch = url.match(/\/#inbox\/([a-zA-Z0-9]+)/)
      if (threadMatch && threadMatch[1]) {
        return threadMatch[1]
      }

      // Check for email view in URL
      const emailViewMatch = url.match(/\/([a-zA-Z0-9]+)(?:\?|$)/)
      if (emailViewMatch && emailViewMatch[1] && emailViewMatch[1].length > 5) {
        return emailViewMatch[1]
      }

      // Fallback: create ID from subject and sender
      const metadata = extractEmailMetadata()
      if (metadata.subject && (metadata.sender || metadata.senderEmail)) {
        const idBase = metadata.subject + (metadata.senderEmail || metadata.sender)
        return btoa(idBase)
          .replace(/[^a-zA-Z0-9]/g, "")
          .substring(0, 20)
      }

      // Last resort: timestamp-based ID
      if (document.querySelector(".h7") || document.querySelector(".ii.gt")) {
        return `email_${Date.now()}`
      }

      return null
    } catch (error) {
      console.error("Error getting email ID:", error)
      return null
    }
  }

  /**
   * Improved function to check if an email is open
   */
  function hasOpenEmail(): boolean {
    try {
      // More comprehensive selectors to detect open emails
      const indicators = [
        ".ii.gt", // Email body
        "[data-message-id]", // Message container
        ".adn.ads", // Email thread
        ".nH .ii.gt", // Alternative email body
        ".a3s.aiL", // Common email content container
        ".h7", // Email subject in view
        ".gE.iv.gt", // Another email container class
        ".gs .g3", // Date indicator in an open email
      ]

      // Check if any of these selectors exist
      const hasEmailElement = indicators.some((selector) => document.querySelector(selector) !== null)

      // Additional check: look for specific email structure
      const hasEmailStructure = document.querySelector(".nH .if") !== null && document.querySelector(".nH .iY") !== null

      // Check URL for email view
      const urlIndicatesEmail =
        window.location.hash.includes("/") &&
        (window.location.hash.includes("#inbox/") ||
          window.location.hash.includes("#all/") ||
          window.location.hash.includes("#sent/"))

      // Check if we have a subject line visible
      const hasSubject = document.querySelector(".hP") !== null

      // Combined check
      const result = (hasEmailElement || hasEmailStructure) && (urlIndicatesEmail || hasSubject)

      return result
    } catch (error) {
      console.error("Error checking for open email:", error)
      return false
    }
  }

  /**
   * Extract the content of the currently opened email in Gmail
   */
  function extractEmailContent(): string {
    try {
      console.log("Attempting to extract email content...")

      // Multiple strategies to find email content in Gmail
      const emailContent =
        extractFromConversationView() || extractFromSingleEmailView() || extractFromAlternativeSelectors() || ""

      if (emailContent) {
        console.log("Email content extracted successfully")
        return cleanEmailContent(emailContent)
      }

      console.log("No email content found")
      return ""
    } catch (error) {
      console.error("Error extracting email content:", error)
      return ""
    }
  }

  /**
   * Extract content from Gmail conversation view (most common)
   */
  function extractFromConversationView(): string {
    // Look for the most recent email in a conversation
    const emailBodies = document.querySelectorAll("div[data-message-id] .ii.gt div")

    if (emailBodies.length > 0) {
      // Get the last (most recent) email in the conversation
      const lastEmail = emailBodies[emailBodies.length - 1]
      return htmlToText(lastEmail.innerHTML)
    }

    // Alternative selector for conversation view
    const conversationEmails = document.querySelectorAll(".adn.ads .ii.gt")
    if (conversationEmails.length > 0) {
      const lastEmail = conversationEmails[conversationEmails.length - 1]
      return htmlToText(lastEmail.innerHTML)
    }

    return ""
  }

  /**
   * Extract content from single email view
   */
  function extractFromSingleEmailView(): string {
    // Single email view selectors
    const selectors = [".ii.gt div", ".a3s.aiL", ".ii.gt .a3s", "[data-message-id] .ii.gt", ".adn.ads .ii.gt"]

    for (const selector of selectors) {
      const element = document.querySelector(selector)
      if (element && element.innerHTML.trim()) {
        return htmlToText(element.innerHTML)
      }
    }

    return ""
  }

  /**
   * Try alternative selectors as fallback
   */
  function extractFromAlternativeSelectors(): string {
    // Fallback selectors for different Gmail layouts
    const fallbackSelectors = [
      '[role="main"] .ii.gt',
      '[role="main"] .a3s',
      ".nH .ii.gt div",
      ".adn .ii.gt",
      "[data-legacy-thread-id] .ii.gt",
    ]

    for (const selector of fallbackSelectors) {
      const elements = document.querySelectorAll(selector)
      if (elements.length > 0) {
        // Get the last element (most recent email)
        const lastElement = elements[elements.length - 1]
        const content = htmlToText(lastElement.innerHTML)
        if (content.trim().length > 10) {
          // Ensure we have meaningful content
          return content
        }
      }
    }

    // Last resort: try to get any text content from the main area
    const mainContent = document.querySelector('[role="main"]')
    if (mainContent) {
      const allText = htmlToText(mainContent.innerHTML)
      // Try to extract just the email body part
      return extractEmailBodyFromFullPage(allText)
    }

    return ""
  }

  /**
   * Convert HTML content to clean text
   */
  function htmlToText(html: string): string {
    if (!html) return ""

    // Create a temporary div to parse HTML
    const tempDiv = document.createElement("div")
    tempDiv.innerHTML = html

    // Remove script and style elements
    const scripts = tempDiv.querySelectorAll("script, style, noscript")
    scripts.forEach((el) => el.remove())

    // Remove Gmail-specific elements that aren't part of the email content
    const gmailElements = tempDiv.querySelectorAll(
      ".gmail_quote, .gmail_extra, .moz-cite-prefix, .yahoo_quoted, " +
        ".AppleMailSignature, .BodyFragment, .PlainText, " +
        '[data-smartmail="gmail_signature"]',
    )
    gmailElements.forEach((el) => el.remove())

    // Convert common HTML elements to text equivalents
    // Handle line breaks
    const brs = tempDiv.querySelectorAll("br")
    brs.forEach((br) => br.replaceWith("\n"))

    // Handle paragraphs
    const paragraphs = tempDiv.querySelectorAll("p")
    paragraphs.forEach((p) => {
      p.insertAdjacentText("afterend", "\n\n")
    })

    // Handle divs (treat as line breaks)
    const divs = tempDiv.querySelectorAll("div")
    divs.forEach((div) => {
      if (div.children.length === 0) {
        // Only if it's a text-only div
        div.insertAdjacentText("afterend", "\n")
      }
    })

    // Handle lists
    const listItems = tempDiv.querySelectorAll("li")
    listItems.forEach((li) => {
      li.insertAdjacentText("beforebegin", "• ")
      li.insertAdjacentText("afterend", "\n")
    })

    // Get the text content
    let text = tempDiv.textContent || tempDiv.innerText || ""

    // Clean up the text
    text = text
      .replace(/\n{3,}/g, "\n\n") // Replace multiple newlines with double newlines
      .replace(/[ \t]+/g, " ") // Replace multiple spaces/tabs with single space
      .replace(/\n /g, "\n") // Remove spaces at the beginning of lines
      .trim()

    return text
  }

  /**
   * Extract email body from full page text (last resort method)
   */
  function extractEmailBodyFromFullPage(fullText: string): string {
    // Try to find patterns that indicate the start of email content
    const emailStartPatterns = [
      /From:.*?\n(.*?)(?=\n\n|\nOn\s+.*?wrote:|\n--|\nSent from|\nGet Outlook)/s,
      /Subject:.*?\n\n(.*?)(?=\n\n|\nOn\s+.*?wrote:|\n--|\nSent from)/s,
      /To:.*?\n\n(.*?)(?=\n\n|\nOn\s+.*?wrote:|\n--|\nSent from)/s,
    ]

    for (const pattern of emailStartPatterns) {
      const match = fullText.match(pattern)
      if (match && match[1] && match[1].trim().length > 20) {
        return match[1].trim()
      }
    }

    // If no patterns match, try to get the first substantial paragraph
    const lines = fullText.split("\n")
    let emailContent = ""
    let foundContent = false

    for (const line of lines) {
      const trimmedLine = line.trim()

      // Skip empty lines and common Gmail UI elements
      if (
        !trimmedLine ||
        trimmedLine.includes("Gmail") ||
        trimmedLine.includes("Inbox") ||
        trimmedLine.includes("Compose") ||
        trimmedLine.length < 3
      ) {
        continue
      }

      // Start collecting content after we find a substantial line
      if (!foundContent && trimmedLine.length > 10) {
        foundContent = true
      }

      if (foundContent) {
        emailContent += trimmedLine + "\n"

        // Stop if we hit common email ending patterns
        if (
          trimmedLine.includes("--") ||
          trimmedLine.includes("Sent from") ||
          trimmedLine.includes("Best regards") ||
          trimmedLine.includes("Thank you")
        ) {
          break
        }
      }
    }

    return emailContent.trim()
  }

  /**
   * Clean up the extracted email content
   */
  function cleanEmailContent(content: string): string {
    if (!content) return ""

    let cleaned = content.trim()

    // Remove quoted text (replies/forwards)
    cleaned = cleaned.replace(/^>.*$/gm, "") // Remove lines starting with >
    cleaned = cleaned.replace(/On .* wrote:[\s\S]*$/, "") // Remove "On ... wrote:" and everything after
    cleaned = cleaned.replace(/From:.*?Sent:.*?\n/gs, "") // Remove email headers
    cleaned = cleaned.replace(/-----Original Message-----[\s\S]*$/, "") // Remove forwarded content

    // Remove common email signatures
    const signaturePatterns = [
      /--[\s\S]*$/, // Signature separator
      /Best regards?,[\s\S]*$/i,
      /Thanks?,[\s\S]*$/i,
      /Sincerely,[\s\S]*$/i,
      /Regards,[\s\S]*$/i,
      /Sent from my .*$/i,
      /Get Outlook for .*$/i,
      /This email was sent from .*$/i,
    ]

    for (const pattern of signaturePatterns) {
      const beforeLength = cleaned.length
      cleaned = cleaned.replace(pattern, "").trim()
      // If we removed a significant portion, we probably got the signature
      if (beforeLength - cleaned.length > 50) {
        break
      }
    }

    // Clean up whitespace
    cleaned = cleaned
      .replace(/\n{3,}/g, "\n\n") // Max 2 consecutive newlines
      .replace(/[ \t]+/g, " ") // Multiple spaces to single space
      .replace(/\n /g, "\n") // Remove spaces at line start
      .trim()

    return cleaned
  }

  /**
   * Insert the AI-generated response into Gmail's reply box
   */
  function insertResponseToReplyBox(response: string): boolean {
    try {
      console.log("Attempting to insert response into reply box...")

      // Try to find existing reply box first
      let replyBox = findReplyBox()

      if (replyBox) {
        insertIntoReplyBox(replyBox, response)
        console.log("Response inserted successfully")
        return true
      }

      // If no reply box found, try to open reply
      const replyButton = findReplyButton()
      if (replyButton) {
        console.log("Opening reply box...")
        replyButton.click()

        // Wait for reply box to appear
        setTimeout(() => {
          replyBox = findReplyBox()
          if (replyBox) {
            insertIntoReplyBox(replyBox, response)
            console.log("Response inserted after opening reply")
          } else {
            console.error("Reply box still not found after clicking reply")
          }
        }, 1000)
        return true
      } else {
        console.error("Could not find reply button")
        return false
      }
    } catch (error) {
      console.error("Error inserting response:", error)
      return false
    }
  }

  /**
   * Find the reply box element
   */
  function findReplyBox(): HTMLElement | null {
    const selectors = [
      'div[role="textbox"][aria-label*="Message Body"]',
      'div[role="textbox"][aria-label*="Body"]',
      'div[contenteditable="true"][aria-label*="Message Body"]',
      'div[contenteditable="true"][aria-label*="Body"]',
      ".Am.Al.editable",
      '.editable[role="textbox"]',
      'div[contenteditable="true"].Am',
      'div[g_editable="true"]',
    ]

    for (const selector of selectors) {
      const element = document.querySelector(selector) as HTMLElement
      if (element && element.isContentEditable) {
        return element
      }
    }

    return null
  }

  /**
   * Find the reply button
   */
  function findReplyButton(): HTMLElement | null {
    const selectors = [
      'span[role="link"][data-tooltip="Reply"]',
      'span[role="link"][data-tooltip*="Reply"]',
      'div[role="button"][aria-label*="Reply"]',
      'span[role="button"][data-tooltip="Reply"]',
      '.ams[role="button"]', // Gmail reply button class
      '[data-tooltip="Reply to all"]',
    ]

    for (const selector of selectors) {
      const element = document.querySelector(selector) as HTMLElement
      if (element) {
        return element
      }
    }

    // Try to find by text content
    const buttons = document.querySelectorAll('span[role="link"], div[role="button"]')
    for (const button of buttons) {
      if (button.textContent?.toLowerCase().includes("reply")) {
        return button as HTMLElement
      }
    }

    return null
  }

  /**
   * Insert content into the reply box
   */
  function insertIntoReplyBox(replyBox: HTMLElement, response: string): void {
    // Clear existing content
    replyBox.innerHTML = ""

    // Convert newlines to HTML breaks for proper display
    const htmlResponse = response.replace(/\n/g, "<br>")

    // Insert the response
    replyBox.innerHTML = htmlResponse

    // Set focus to the reply box
    replyBox.focus()

    // Trigger events to ensure Gmail recognizes the change
    const events = ["input", "change", "keyup", "paste"]
    events.forEach((eventType) => {
      const event = new Event(eventType, { bubbles: true, cancelable: true })
      replyBox.dispatchEvent(event)
    })

    // Also trigger a more specific input event
    const inputEvent = new InputEvent("input", {
      bubbles: true,
      cancelable: true,
      inputType: "insertText",
      data: response,
    })
    replyBox.dispatchEvent(inputEvent)
  }

  function extractEmailMetadata() {
    const metadata = {
      sender: "",
      senderEmail: "",
      subject: "",
      date: "",
      recipients: [] as string[],
    }

    try {
      // Extract sender name and email
      const senderSelectors = [
        ".go .g2 span[email]", // Sender with email attribute
        ".hP span[email]", // Alternative sender
        ".yW span[email]", // Another sender format
        ".qu .go span[email]", // Quoted sender
      ]

      for (const selector of senderSelectors) {
        const element = document.querySelector(selector)
        if (element) {
          metadata.senderEmail = element.getAttribute("email") || ""
          metadata.sender = element.textContent?.trim() || ""
          if (metadata.sender || metadata.senderEmail) break
        }
      }

      // If no email found, try to extract just the name
      if (!metadata.sender) {
        const nameSelectors = [".go .g2", ".hP", ".yW span", ".qu .go span"]
        for (const selector of nameSelectors) {
          const element = document.querySelector(selector)
          if (element && element.textContent?.trim()) {
            metadata.sender = element.textContent.trim()
            break
          }
        }
      }

      // Extract subject
      const subjectSelectors = [
        ".hP", // Main subject
        ".bog", // Alternative subject
        "h2[data-legacy-thread-id]", // Thread subject
        ".ha h2", // Another subject format
        "[data-legacy-thread-id] h2", // Legacy thread subject
      ]

      for (const selector of subjectSelectors) {
        const element = document.querySelector(selector)
        if (element && element.textContent?.trim()) {
          metadata.subject = element.textContent.trim()
          break
        }
      }

      // Extract date
      const dateSelectors = [
        ".g3", // Main date
        ".g2 .g3", // Alternative date
        'span[title*="GMT"]', // Date with GMT
        ".qu .g3", // Quoted date
        'span[title*="UTC"]', // Date with UTC
      ]

      for (const selector of dateSelectors) {
        const element = document.querySelector(selector)
        if (element) {
          metadata.date = element.getAttribute("title") || element.textContent?.trim() || ""
          if (metadata.date) {
            // Format the date nicely
            try {
              const date = new Date(metadata.date)
              if (!isNaN(date.getTime())) {
                metadata.date = date.toLocaleDateString() + " " + date.toLocaleTimeString()
              }
            } catch (e) {
              // Keep original date string if parsing fails
            }
            break
          }
        }
      }

      // Extract recipients (To field)
      const recipientSelectors = [
        ".g2 span[email]", // Recipients with email
        ".yW span[email]", // Alternative recipients
        'span[data-hovercard-id*="@"]', // Email hover cards
      ]

      const recipientEmails = new Set<string>()
      for (const selector of recipientSelectors) {
        const elements = document.querySelectorAll(selector)
        elements.forEach((el) => {
          const email = el.getAttribute("email") || el.getAttribute("data-hovercard-id")
          if (email && email.includes("@") && email !== metadata.senderEmail) {
            recipientEmails.add(email)
          }
        })
      }
      metadata.recipients = Array.from(recipientEmails)
    } catch (error) {
      console.error("Error extracting email metadata:", error)
    }

    return metadata
  }

  function isConversationView(): boolean {
    const conversationIndicators = document.querySelectorAll("[data-message-id]")
    return conversationIndicators.length > 1
  }

  // Cleanup on page unload
  window.addEventListener("beforeunload", () => {
    if (emailCheckInterval) {
      clearInterval(emailCheckInterval)
    }
  })
})()
