/**
 * Parse and format API response, handling both JSON and plain text responses
 */
const parseApiResponse = (response: any): string => {
  try {
    // If response is already a string, return it formatted
    if (typeof response === 'string') {
      return formatResponseText(response)
    }

    // If response is an object, check for common response properties in order of priority
    if (response && typeof response === 'object') {
      // Check for 'output' property first (your API format)
      if (response.output) {
        return formatResponseText(response.output)
      }

      // Check for other common properties
      if (response.aiResponse) {
        return formatResponseText(response.aiResponse)
      }

      if (response.text) {
        return formatResponseText(response.text)
      }

      if (response.message) {
        return formatResponseText(response.message)
      }

      if (response.content) {
        return formatResponseText(response.content)
      }

      // If none of the expected properties exist, stringify the whole object
      console.warn('Unexpected API response format:', response)
      return formatResponseText(JSON.stringify(response))
    }

    // Fallback: convert to string
    return formatResponseText(String(response))
  } catch (error) {
    console.error('Error parsing API response:', error)
    return 'Error parsing response. Please try again.'
  }
}

/**
 * Format response text by fixing newlines and cleaning up formatting
 */
const formatResponseText = (text: string): string => {
  if (!text) return ''

  let formatted = text

  // Remove surrounding quotes if they exist
  if (
    (formatted.startsWith('"') && formatted.endsWith('"')) ||
    (formatted.startsWith("'") && formatted.endsWith("'"))
  ) {
    formatted = formatted.slice(1, -1)
  }

  // Handle escaped newlines in various formats
  formatted = formatted.replace(/\\n/g, '\n')
  formatted = formatted.replace(/\\\\n/g, '\n')
  formatted = formatted.replace(/n\\n/g, '\n')

  // Handle escaped quotes
  formatted = formatted.replace(/\\"/g, '"')
  formatted = formatted.replace(/\\'/g, "'")

  // Handle escaped backslashes
  formatted = formatted.replace(/\\\\/g, '\\')

  // Clean up multiple consecutive newlines (max 2)
  formatted = formatted.replace(/\n{3,}/g, '\n\n')

  // Remove leading/trailing whitespace
  formatted = formatted.trim()

  return formatted
}

/**
 * Generate AI response for the email content using your n8n webhook
 *
 * @param emailContent The full email content
 * @param hasBookingRequest Whether the email contains a booking request
 * @returns Generated AI response
 */
export const generateAIResponse = async (
  emailContent: string,
  hasBookingRequest: boolean
): Promise<string> => {
  try {
    console.log('Calling n8n webhook for AI response...')

    const response = await fetch(
      'https://anandpro.app.n8n.cloud/webhook-test/e1b66b3a-f460-43fe-baf5-48376824f85b',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          emailContent,
          hasBookingRequest,
          action: 'generate'
        })
      }
    )

    if (!response.ok) {
      throw new Error(`Failed to get AI response from n8n webhook. Status: ${response.status}`)
    }

    const data = await response.json()
    console.log('Raw response from n8n:', data)

    // Parse the response to extract clean text
    const cleanResponse = parseApiResponse(data)
    console.log('Parsed response:', cleanResponse)

    return cleanResponse
  } catch (error) {
    console.error('Error generating AI response:', error)
    let errorMessage = 'Unknown error'
    if (error instanceof Error) {
      errorMessage = error.message
    } else {
      errorMessage = String(error)
    }
    throw new Error(`Failed to generate response: ${errorMessage}`)
  }
}

/**
 * Regenerate AI response based on previous response using your n8n webhook
 *
 * @param emailContent Original email content
 * @param previousResponse Previous AI-generated response
 * @param hasBookingRequest Whether the email contains a booking request
 * @returns Regenerated AI response
 */
export const regenerateResponse = async (
  emailContent: string,
  previousResponse: string,
  hasBookingRequest: boolean
): Promise<string> => {
  try {
    console.log('Calling n8n webhook for AI response regeneration...')

    const response = await fetch(
      'https://anandpro.app.n8n.cloud/webhook-test/e1b66b3a-f460-43fe-baf5-48376824f85b',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          emailContent,
          hasBookingRequest,
          previousResponse,
          action: 'regenerate'
        })
      }
    )

    if (!response.ok) {
      throw new Error(
        `Failed to regenerate AI response from n8n webhook. Status: ${response.status}`
      )
    }

    const data = await response.json()
    console.log('Raw regenerated response from n8n:', data)

    // Parse the response to extract clean text
    const cleanResponse = parseApiResponse(data)
    console.log('Parsed regenerated response:', cleanResponse)

    return cleanResponse
  } catch (error) {
    console.error('Error regenerating AI response:', error)
    let errorMessage = 'Unknown error'
    if (error instanceof Error) {
      errorMessage = error.message
    }
    throw new Error(`Failed to regenerate response: ${errorMessage}`)
  }
}
