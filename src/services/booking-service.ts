/**
 * Check if the email contains a booking or scheduling request
 *
 * @param emailContent The full email content
 * @returns Object indicating if a booking request was detected and details
 */
export const checkForBookingRequest = (
  emailContent: string
): { hasRequest: boolean; details: any } => {
  const contentLower = emailContent.toLowerCase()

  // Check for booking-related keywords
  const bookingKeywords = [
    'schedule a meeting',
    'book a time',
    'appointment',
    'available for a call',
    'chat soon',
    'meet with you',
    'schedule time',
    'when are you free',
    'availability',
    'your calendar'
  ]

  const hasRequest = bookingKeywords.some((keyword) => contentLower.includes(keyword.toLowerCase()))

  // Extract possible date/time information
  let details = null

  if (hasRequest) {
    details = extractBookingDetails(emailContent)
  }

  return { hasRequest, details }
}

/**
 * Extract booking details from the email content
 */
const extractBookingDetails = (emailContent: string): any => {
  // This is a simple implementation - a production version would use
  // more sophisticated NLP or regex patterns for date/time extraction

  const details = {
    proposedDates: [] as string[],
    duration: null as number | null,
    purpose: '',
    timezone: 'UTC'
  }

  // Try to extract dates using simple patterns
  // This is not comprehensive but provides a starting point

  // Look for date patterns like "Tuesday", "next week", "June 15th"
  const datePatterns = [
    /(?:on|for|this|next)\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday)/gi,
    /(?:on|for)\s+(\d{1,2}(?:st|nd|rd|th)?\s+(?:of\s+)?(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec))/gi,
    /(?:on|for)\s+(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)/gi
  ]

  // Extract dates
  for (const pattern of datePatterns) {
    let match
    while ((match = pattern.exec(emailContent)) !== null) {
      if (match[1] && !details.proposedDates.includes(match[1])) {
        details.proposedDates.push(match[1])
      }
    }
  }

  // Try to extract duration
  const durationMatch = emailContent.match(/(\d{1,2})\s*(?:hour|hr|minute|min)s?/i)
  if (durationMatch) {
    details.duration = Number.parseInt(durationMatch[1], 10)
  }

  // Try to extract purpose
  const purposePatterns = [
    /(?:to discuss|about|regarding|for a)\s+([^.,;]+)/i,
    /(?:meeting|call|chat)\s+(?:about|regarding|on)\s+([^.,;]+)/i
  ]

  for (const pattern of purposePatterns) {
    const match = emailContent.match(pattern)
    if (match && match[1]) {
      details.purpose = match[1].trim()
      break
    }
  }

  // Try to extract timezone
  const timezoneMatch = emailContent.match(
    /(?:timezone|time zone|tz):\s*([A-Za-z]+(?:\/[A-Za-z_]+)?)/i
  )
  if (timezoneMatch && timezoneMatch[1]) {
    details.timezone = timezoneMatch[1]
  }

  return details
}

/**
 * Handle a booking request by calling an API to check calendar availability
 *
 * @param bookingDetails Details extracted from the email
 * @returns Response with available slots
 */
export const handleBookingRequest = async (
  bookingDetails: any
): Promise<{ success: boolean; availableSlots: string[] }> => {
  try {
    // In a real implementation, this would call your booking API
    // For now, we'll simulate it
    return await simulateBookingAPI(bookingDetails)
  } catch (error) {
    console.error('Error handling booking request:', error)
    throw new Error('Failed to handle booking request')
  }
}

/**
 * Simulate a booking API call
 * This would be replaced with an actual API call in production
 */
const simulateBookingAPI = async (
  bookingDetails: any
): Promise<{ success: boolean; availableSlots: string[] }> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Generate some fake available slots
      const currentDate = new Date()
      const availableSlots = [
        `Tomorrow at ${10 + Math.floor(Math.random() * 4)}:00 AM`,
        `Tomorrow at ${1 + Math.floor(Math.random() * 3)}:30 PM`,
        `${getDayName(currentDate.getDay() + 2)} at ${9 + Math.floor(Math.random() * 3)}:00 AM`,
        `${getDayName(currentDate.getDay() + 2)} at ${2 + Math.floor(Math.random() * 3)}:00 PM`,
        `${getDayName(currentDate.getDay() + 3)} at ${10 + Math.floor(Math.random() * 6)}:00 AM`
      ]

      resolve({
        success: true,
        availableSlots
      })
    }, 1000)
  })
}

/**
 * Helper function to get the day name from day index
 */
const getDayName = (dayIndex: number): string => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  return days[dayIndex % 7]
}
