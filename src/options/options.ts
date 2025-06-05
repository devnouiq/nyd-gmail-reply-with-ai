//@ts-nocheck
// Initialize connection with Gmail page
;(() => {
  console.log('Gmail AI Responder content script loaded')

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getEmailContent') {
      const emailContent = extractEmailContent()
      sendResponse({ emailContent })
      return true
    } else if (request.action === 'insertResponse') {
      insertResponseToReplyBox(request.response)
      sendResponse({ success: true })
      return true
    }
  })

  /**
   * Extract the content of the currently opened email in Gmail
   */
  function extractEmailContent(): string {
    try {
      // Gmail email content is typically in a div with role="main"
      const mainContent = document.querySelector('div[role="main"]')
      if (!mainContent) return ''

      // Find the email body element - this selector might need adjustment
      // based on Gmail's current DOM structure
      const emailBody = mainContent.querySelector('.a3s')

      if (emailBody) {
        // Clean up and return the text content
        return cleanEmailContent(emailBody.textContent || '')
      }

      return ''
    } catch (error) {
      console.error('Error extracting email content:', error)
      return ''
    }
  }

  /**
   * Clean up the extracted email content
   */
  function cleanEmailContent(content: string): string {
    if (!content) return ''

    // Remove excessive whitespace
    let cleaned = content.trim().replace(/\n{3,}/g, '\n\n')

    // Remove common email footer patterns
    cleaned = cleaned.replace(/On .* wrote:[\s\S]*$/, '')

    // Remove email signature patterns (common patterns)
    const signaturePatterns = [
      /--[\s\S]*$/, // Simple signature divider
      /Best regards,[\s\S]*$/, // Common closing
      /Thanks[,&][\s\S]*$/, // Common closing
      /Sincerely,[\s\S]*$/ // Common closing
    ]

    for (const pattern of signaturePatterns) {
      if (pattern.test(cleaned)) {
        cleaned = cleaned.replace(pattern, '').trim()
      }
    }

    return cleaned
  }

  /**
   * Insert the AI-generated response into Gmail's reply box
   */
  function insertResponseToReplyBox(response: string): void {
    try {
      // Find the reply box - this selector might need adjustment
      // based on Gmail's current DOM structure
      const replyBox = document.querySelector('div[role="textbox"][aria-label*="Body"]')

      if (replyBox) {
        // Clear existing content and insert response
        replyBox.innerHTML = response.replace(/\n/g, '<br>')

        // Trigger input event to ensure Gmail recognizes the change
        const inputEvent = new Event('input', { bubbles: true })
        replyBox.dispatchEvent(inputEvent)
      } else {
        // If reply box not found, try to find and click the reply button
        const replyButton =
          document.querySelector('span[role="link"][data-tooltip="Reply"]') ||
          document.querySelector('span[role="link"][data-tooltip*="Reply"]')

        if (replyButton && replyButton instanceof HTMLElement) {
          replyButton.click()

          // Wait for the reply box to appear
          setTimeout(() => {
            const newReplyBox = document.querySelector('div[role="textbox"][aria-label*="Body"]')
            if (newReplyBox) {
              newReplyBox.innerHTML = response.replace(/\n/g, '<br>')

              // Trigger input event
              const inputEvent = new Event('input', { bubbles: true })
              newReplyBox.dispatchEvent(inputEvent)
            }
          }, 500)
        }
      }
    } catch (error) {
      console.error('Error inserting response:', error)
      alert('Failed to insert response. Please try again.')
    }
  }
})()
