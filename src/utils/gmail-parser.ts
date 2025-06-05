/**
 * Extract email content from Gmail page
 * This function is called from the content script
 */
export const extractEmailContent = (): string => {
  // This function is a placeholder as the actual implementation
  // is in the content script for direct DOM access
  return ''
}

/**
 * Parse sender information from email
 */
export const parseSender = (emailText: string): { name: string; email: string } => {
  // Default values
  let name = 'Sender'
  let email = ''

  // Try to extract sender info from common patterns
  const fromMatch = emailText.match(/From:\s*["']?([^"'<]+)["']?\s*(?:<([^>]+)>)?/i)
  if (fromMatch) {
    name = fromMatch[1].trim()
    email = fromMatch[2] ? fromMatch[2].trim() : ''
  }

  return { name, email }
}

/**
 * Extract subject from email content
 */
export const extractSubject = (emailText: string): string => {
  const subjectMatch = emailText.match(/Subject:\s*(.+?)(?:\r?\n|\r|$)/i)
  return subjectMatch ? subjectMatch[1].trim() : 'No Subject'
}

/**
 * Analyze email to determine its category (inquiry, follow-up, etc.)
 */
export const categorizeEmail = (content: string): string => {
  const contentLower = content.toLowerCase()

  if (
    contentLower.includes('interview') ||
    contentLower.includes('job') ||
    contentLower.includes('position') ||
    contentLower.includes('opportunity')
  ) {
    return 'job_related'
  }

  if (
    contentLower.includes('invoice') ||
    contentLower.includes('payment') ||
    contentLower.includes('billing') ||
    contentLower.includes('receipt')
  ) {
    return 'financial'
  }

  if (
    contentLower.includes('meeting') ||
    contentLower.includes('schedule') ||
    contentLower.includes('calendar') ||
    contentLower.includes('availability')
  ) {
    return 'scheduling'
  }

  if (
    contentLower.includes('question') ||
    contentLower.includes('inquiry') ||
    contentLower.includes('help') ||
    contentLower.includes('support')
  ) {
    return 'inquiry'
  }

  if (
    contentLower.includes('follow up') ||
    contentLower.includes('following up') ||
    contentLower.includes('checking in')
  ) {
    return 'follow_up'
  }

  return 'general'
}

/**
 * Advanced email content extraction utilities
 */

/**
 * Extract email metadata (sender, subject, date) from Gmail page
 */
export const extractEmailMetadata = (): {
  sender: string
  subject: string
  date: string
  recipients: string[]
} => {
  const metadata = {
    sender: '',
    subject: '',
    date: '',
    recipients: [] as string[]
  }

  try {
    // Extract sender
    const senderElement = document.querySelector('.go .g2, .hP, .yW span[email]')
    if (senderElement) {
      metadata.sender = senderElement.textContent?.trim() || ''
    }

    // Extract subject
    const subjectElement = document.querySelector('.hP, .bog, h2[data-legacy-thread-id]')
    if (subjectElement) {
      metadata.subject = subjectElement.textContent?.trim() || ''
    }

    // Extract date
    const dateElement = document.querySelector('.g3, .g2 .g3, span[title*="GMT"]')
    if (dateElement) {
      metadata.date = dateElement.getAttribute('title') || dateElement.textContent?.trim() || ''
    }

    // Extract recipients
    const recipientElements = document.querySelectorAll('.g2 span[email], .yW span[email]')
    recipientElements.forEach((el) => {
      const email = el.getAttribute('email')
      if (email && !metadata.recipients.includes(email)) {
        metadata.recipients.push(email)
      }
    })
  } catch (error) {
    console.error('Error extracting email metadata:', error)
  }

  return metadata
}

/**
 * Detect if the current page has an open email
 */
export const hasOpenEmail = (): boolean => {
  // Check for various indicators that an email is open
  const indicators = [
    '.ii.gt', // Email body
    '[data-message-id]', // Message container
    '.adn.ads', // Email thread
    '.nH .ii.gt' // Alternative email body
  ]

  return indicators.some((selector) => document.querySelector(selector) !== null)
}

/**
 * Get the email thread ID if available
 */
export const getEmailThreadId = (): string | null => {
  const threadElement = document.querySelector('[data-legacy-thread-id]')
  return threadElement?.getAttribute('data-legacy-thread-id') || null
}

/**
 * Check if the email is part of a conversation
 */
export const isConversationView = (): boolean => {
  const conversationIndicators = document.querySelectorAll('[data-message-id]')
  return conversationIndicators.length > 1
}

/**
 * Extract all email addresses mentioned in the current email
 */
export const extractEmailAddresses = (content: string): string[] => {
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g
  const matches = content.match(emailRegex)
  return matches ? [...new Set(matches)] : []
}

/**
 * Detect the language of the email content
 */
export const detectLanguage = (content: string): string => {
  // Simple language detection based on common words
  const languages = {
    english: ['the', 'and', 'you', 'that', 'was', 'for', 'are', 'with', 'his', 'they'],
    spanish: ['que', 'de', 'no', 'la', 'el', 'en', 'es', 'se', 'te', 'lo'],
    french: ['que', 'de', 'je', 'est', 'pas', 'le', 'vous', 'la', 'tu', 'il'],
    german: ['der', 'die', 'und', 'in', 'den', 'von', 'zu', 'das', 'mit', 'sich']
  }

  const contentLower = content.toLowerCase()
  let maxScore = 0
  let detectedLanguage = 'english'

  for (const [lang, words] of Object.entries(languages)) {
    const score = words.reduce((acc, word) => {
      const regex = new RegExp(`\\b${word}\\b`, 'g')
      const matches = contentLower.match(regex)
      return acc + (matches ? matches.length : 0)
    }, 0)

    if (score > maxScore) {
      maxScore = score
      detectedLanguage = lang
    }
  }

  return detectedLanguage
}

/**
 * Extract quoted text from email content
 */
export const extractQuotedText = (content: string): string => {
  // Look for common quoted text patterns
  const quotedPatterns = [
    /^>.*$/gm, // Lines starting with >
    /On .* wrote:[\s\S]*$/, // "On ... wrote:" pattern
    /-----Original Message-----[\s\S]*$/, // Forwarded message
    /From:.*?Subject:.*?\n([\s\S]*?)(?=\n\n|$)/s // Email headers with content
  ]

  for (const pattern of quotedPatterns) {
    const match = content.match(pattern)
    if (match) {
      return match[0]
    }
  }

  return ''
}

/**
 * Remove quoted text and return clean email content
 */
export const removeQuotedText = (content: string): string => {
  let cleaned = content

  // Remove quoted lines
  cleaned = cleaned.replace(/^>.*$/gm, '')

  // Remove "On ... wrote:" and everything after
  cleaned = cleaned.replace(/On .* wrote:[\s\S]*$/, '')

  // Remove forwarded message content
  cleaned = cleaned.replace(/-----Original Message-----[\s\S]*$/, '')

  // Remove email headers
  cleaned = cleaned.replace(/From:.*?Subject:.*?\n/gs, '')

  return cleaned.trim()
}
