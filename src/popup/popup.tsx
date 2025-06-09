//@ts-nocheck
'use client'
import type React from 'react'
import { useState, useEffect } from 'react'
import '../styles/popup.css'
import { generateAIResponse, regenerateResponse } from '../services/ai-service'
import { checkForBookingRequest, handleBookingRequest } from '../services/booking-service'

declare const chrome: any

interface EmailMetadata {
  sender: string
  senderEmail: string
  subject: string
  date: string
  recipients: string[]
  hasOpenEmail: boolean
  isConversation: boolean
}

interface SavedResponse {
  id: string
  emailId: string
  response: string
  timestamp: number
  metadata: EmailMetadata
}

const Popup: React.FC = () => {
  const [originalEmailContent, setOriginalEmailContent] = useState<string>('')
  const [editableEmailContent, setEditableEmailContent] = useState<string>('')
  const [emailId, setEmailId] = useState<string>('')
  const [emailMetadata, setEmailMetadata] = useState<EmailMetadata | null>(null)
  const [aiResponse, setAiResponse] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const [hasBookingRequest, setHasBookingRequest] = useState<boolean>(false)
  const [bookingDetails, setBookingDetails] = useState<any>(null)
  const [extractionStatus, setExtractionStatus] = useState<string>('Initializing...')
  const [isConnected, setIsConnected] = useState<boolean>(false)
  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [autoOpenEnabled, setAutoOpenEnabled] = useState<boolean>(true)
  const [savedResponses, setSavedResponses] = useState<SavedResponse[]>([])
  const [showSavedResponses, setShowSavedResponses] = useState<boolean>(false)
  const [retryCount, setRetryCount] = useState<number>(0)

  useEffect(() => {
    // Load settings
    loadSettings()

    // Check if we're on Gmail first
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTab = tabs[0]
      if (!activeTab.url?.includes('mail.google.com')) {
        setExtractionStatus('Please navigate to Gmail to use this extension')
        return
      }

      const activeTabId = activeTab.id
      if (activeTabId) {
        setExtractionStatus('Connecting to Gmail...')

        chrome.tabs.sendMessage(activeTabId, { action: 'getEmailContent' }, (response) => {
          if (chrome.runtime.lastError) {
            setExtractionStatus(
              'Failed to connect to Gmail. Please refresh the page and try again.'
            )
            setIsConnected(false)
            console.error('Chrome runtime error:', chrome.runtime.lastError)
            return
          }

          setIsConnected(true)

          if (response && response.emailContent && response.emailContent.trim()) {
            setOriginalEmailContent(response.emailContent)
            setEditableEmailContent(response.emailContent)
            setEmailId(response.emailId || '')
            setEmailMetadata(response.metadata)
            setExtractionStatus('Email content extracted successfully')

            // Load saved response for this email if exists
            loadSavedResponse(response.emailId)

            // Check if email contains booking request
            const bookingCheck = checkForBookingRequest(response.emailContent)
            setHasBookingRequest(bookingCheck.hasRequest)
            setBookingDetails(bookingCheck.details)
          } else {
            // If no content found but we're connected, retry a few times
            if (isConnected && retryCount < 3) {
              setExtractionStatus('Waiting for email content...')
              setRetryCount(retryCount + 1)

              // Retry after a short delay
              setTimeout(() => {
                chrome.tabs.sendMessage(
                  activeTabId,
                  { action: 'getEmailContent' },
                  (retryResponse) => {
                    if (
                      retryResponse &&
                      retryResponse.emailContent &&
                      retryResponse.emailContent.trim()
                    ) {
                      setOriginalEmailContent(retryResponse.emailContent)
                      setEditableEmailContent(retryResponse.emailContent)
                      setEmailId(retryResponse.emailId || '')
                      setEmailMetadata(retryResponse.metadata)
                      setExtractionStatus('Email content extracted successfully')

                      // Check for booking request
                      const bookingCheck = checkForBookingRequest(retryResponse.emailContent)
                      setHasBookingRequest(bookingCheck.hasRequest)
                      setBookingDetails(bookingCheck.details)

                      // Load saved response
                      loadSavedResponse(retryResponse.emailId)
                    } else {
                      setExtractionStatus('No email content found. Please open an email in Gmail.')
                    }
                  }
                )
              }, 1000)
            } else {
              setExtractionStatus('No email content found. Please open an email in Gmail.')
            }
          }
        })
      }
    })

    // Load saved responses
    loadSavedResponses()
  }, [retryCount])

  // Add a function to check if the popup was auto-opened
  useEffect(() => {
    // Check if this popup was auto-opened
    chrome.storage.local.get(['autoOpened', 'currentEmailId', 'timestamp'], (result) => {
      if (
        result.autoOpened &&
        result.currentEmailId &&
        result.timestamp &&
        Date.now() - result.timestamp < 10000 // Within last 10 seconds
      ) {
        console.log('Popup was auto-opened for email:', result.currentEmailId)

        // Clear the auto-opened flag
        chrome.storage.local.set({ autoOpened: false })

        // If we have an email ID but no content yet, try to extract it again
        if (result.currentEmailId && !originalEmailContent) {
          setExtractionStatus('Auto-opened for email. Extracting content...')

          // Small delay to ensure Gmail has fully loaded the email
          setTimeout(() => {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
              if (tabs[0]?.id) {
                chrome.tabs.sendMessage(tabs[0].id, { action: 'getEmailContent' }, (response) => {
                  if (response && response.emailContent) {
                    setOriginalEmailContent(response.emailContent)
                    setEditableEmailContent(response.emailContent)
                    setEmailId(response.emailId || '')
                    setEmailMetadata(response.metadata)
                    setExtractionStatus('Email content extracted successfully')

                    // Check for booking request
                    const bookingCheck = checkForBookingRequest(response.emailContent)
                    setHasBookingRequest(bookingCheck.hasRequest)
                    setBookingDetails(bookingCheck.details)

                    // Load saved response if exists
                    loadSavedResponse(response.emailId)
                  }
                })
              }
            })
          }, 500)
        }
      }
    })
  }, [originalEmailContent])

  const loadSettings = async () => {
    try {
      const result = await chrome.storage.sync.get(['defaultSettings'])
      if (result.defaultSettings) {
        setAutoOpenEnabled(result.defaultSettings.autoOpenEnabled ?? true)
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }

  const saveSettings = async () => {
    try {
      const result = await chrome.storage.sync.get(['defaultSettings'])
      const settings = result.defaultSettings || {}
      settings.autoOpenEnabled = autoOpenEnabled

      await chrome.storage.sync.set({ defaultSettings: settings })

      // Notify content script about auto-open setting
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: 'setAutoOpen',
            enabled: autoOpenEnabled
          })
        }
      })
    } catch (error) {
      console.error('Error saving settings:', error)
    }
  }

  const loadSavedResponse = async (currentEmailId: string) => {
    if (!currentEmailId) return

    try {
      const result = await chrome.storage.local.get([`response_${currentEmailId}`])
      if (result[`response_${currentEmailId}`]) {
        const savedResponse = result[`response_${currentEmailId}`]
        setAiResponse(savedResponse.response)
        setExtractionStatus('Loaded saved response for this email')
      }
    } catch (error) {
      console.error('Error loading saved response:', error)
    }
  }

  const saveResponse = async () => {
    if (!emailId || !aiResponse) return

    try {
      const responseData: SavedResponse = {
        id: `response_${emailId}`,
        emailId,
        response: aiResponse,
        timestamp: Date.now(),
        metadata: emailMetadata!
      }

      await chrome.storage.local.set({ [`response_${emailId}`]: responseData })
      setExtractionStatus('Response saved successfully!')

      // Refresh saved responses list
      loadSavedResponses()
    } catch (error) {
      console.error('Error saving response:', error)
      setExtractionStatus('Failed to save response')
    }
  }

  const loadSavedResponses = async () => {
    try {
      const result = await chrome.storage.local.get(null)
      const responses: SavedResponse[] = []

      for (const [key, value] of Object.entries(result)) {
        if (key.startsWith('response_') && typeof value === 'object') {
          responses.push(value as SavedResponse)
        }
      }

      // Sort by timestamp (newest first)
      responses.sort((a, b) => b.timestamp - a.timestamp)
      setSavedResponses(responses)
    } catch (error) {
      console.error('Error loading saved responses:', error)
    }
  }

  const deleteSavedResponse = async (responseId: string) => {
    try {
      await chrome.storage.local.remove([responseId])
      loadSavedResponses()

      // If this is the current email's response, clear it
      if (responseId === `response_${emailId}`) {
        setAiResponse('')
      }
    } catch (error) {
      console.error('Error deleting saved response:', error)
    }
  }

  const loadSavedResponseById = (response: SavedResponse) => {
    setAiResponse(response.response)
    setShowSavedResponses(false)
  }

  const handleGenerateResponse = async () => {
    setIsGenerating(true)
    setExtractionStatus('Generating AI response...')
    try {
      const contentToUse = isEditing ? editableEmailContent : originalEmailContent
      const response = await generateAIResponse(contentToUse, hasBookingRequest)
      setAiResponse(response)
      setExtractionStatus('Response generated successfully')
    } catch (error) {
      console.error('Error generating AI response:', error)
      setExtractionStatus('Failed to generate AI response. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRegenerateResponse = async () => {
    setIsGenerating(true)
    setExtractionStatus('Regenerating response...')
    try {
      const contentToUse = isEditing ? editableEmailContent : originalEmailContent
      const response = await regenerateResponse(contentToUse, aiResponse, hasBookingRequest)
      setAiResponse(response)
      setExtractionStatus('Response regenerated successfully')
    } catch (error) {
      console.error('Error regenerating response:', error)
      setExtractionStatus('Failed to regenerate response')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleApplyResponse = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const activeTabId = tabs[0].id
      if (activeTabId) {
        setExtractionStatus('Applying response to Gmail...')
        chrome.tabs.sendMessage(
          activeTabId,
          {
            action: 'insertResponse',
            response: aiResponse
          },
          (response) => {
            if (response && response.success) {
              setExtractionStatus('Response applied successfully!')
              // Auto-save the response when applied
              saveResponse()
            } else {
              setExtractionStatus('Failed to apply response. Please try manually.')
            }
          }
        )
      }
    })
  }

  const handleBooking = async () => {
    try {
      setExtractionStatus('Checking calendar availability...')
      const bookingResponse = await handleBookingRequest(bookingDetails)
      setAiResponse(
        aiResponse +
          "\n\n---\nI've checked my calendar and can offer the following slots:\n" +
          bookingResponse.availableSlots.join('\n') +
          '\n\nPlease let me know which one works best for you.'
      )
      setExtractionStatus('Calendar availability added to response')
    } catch (error) {
      console.error('Error handling booking:', error)
      setExtractionStatus('Failed to get calendar availability')
    }
  }

  const resetToOriginal = () => {
    setEditableEmailContent(originalEmailContent)
    setIsEditing(false)
  }

  const getStatusIcon = () => {
    if (!isConnected) return '⚠️'
    if (originalEmailContent) return '✅'
    return '📧'
  }

  const getStatusClass = () => {
    if (!isConnected) return 'error'
    if (originalEmailContent) return 'success'
    return 'warning'
  }

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString() + ' ' + new Date(timestamp).toLocaleTimeString()
  }

  return (
    <div className="popup-container">
      {/* Header */}
      <div className="header">
        <div className="header-content">
          <div className="logo">
            <span className="logo-icon">🤖</span>
            <h1>Gmail AI Assistant</h1>
          </div>
          <div className="header-actions">
            <button
              className="icon-button"
              onClick={() => setShowSavedResponses(!showSavedResponses)}
              title="Saved Responses"
            >
              📁
            </button>
            <div className="version">v1.0</div>
          </div>
        </div>
      </div>

      

      {/* Status Bar */}
      <div className="status-bar">
        <div className={`status-indicator ${getStatusClass()}`}>
          <span className="status-icon">{getStatusIcon()}</span>
          <span className="status-text">{extractionStatus}</span>
        </div>
      </div>

      {/* Saved Responses Panel */}
      {showSavedResponses && (
        <div className="saved-responses-panel">
          <div className="panel-header">
            <h3>
              <span className="icon">📁</span> Saved Responses ({savedResponses.length})
            </h3>
            <button className="close-button" onClick={() => setShowSavedResponses(false)}>
              ✕
            </button>
          </div>
          <div className="saved-responses-list">
            {savedResponses.length === 0 ? (
              <div className="no-responses">No saved responses yet</div>
            ) : (
              savedResponses.map((response) => (
                <div key={response.id} className="saved-response-item">
                  <div className="response-info">
                    <div className="response-subject">
                      {response.metadata.subject || 'No Subject'}
                    </div>
                    <div className="response-meta">
                      From: {response.metadata.sender} • {formatDate(response.timestamp)}
                    </div>
                    <div className="response-preview">{truncateText(response.response, 100)}</div>
                  </div>
                  <div className="response-actions">
                    <button className="load-button" onClick={() => loadSavedResponseById(response)}>
                      Load
                    </button>
                    <button
                      className="delete-button"
                      onClick={() => deleteSavedResponse(response.id)}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Email Information Card */}
      {emailMetadata && (
        <div className="email-info-card">
          <div className="card-header">
            <h3>
              <span className="icon">📧</span> Email Details
            </h3>
            {emailMetadata.isConversation && <span className="conversation-badge">Thread</span>}
          </div>
          <div className="email-details">
            <div className="detail-row">
              <span className="detail-label">From:</span>
              <div className="detail-value">
                <div className="sender-name">{emailMetadata.sender || 'Unknown Sender'}</div>
                {emailMetadata.senderEmail && (
                  <div className="sender-email">{emailMetadata.senderEmail}</div>
                )}
              </div>
            </div>
            <div className="detail-row">
              <span className="detail-label">Subject:</span>
              <span className="detail-value subject" title={emailMetadata.subject}>
                {emailMetadata.subject || 'No Subject'}
              </span>
            </div>
            {emailMetadata.date && (
              <div className="detail-row">
                <span className="detail-label">Date:</span>
                <span className="detail-value">{emailMetadata.date}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Email Content Section */}
      <div className="content-section">
        <div className="section-header">
          <h3>
            <span className="icon">📄</span> Email Content
          </h3>
          <div className="content-actions">
            {originalEmailContent && (
              <>
                <button
                  className={`edit-toggle ${isEditing ? 'active' : ''}`}
                  onClick={() => setIsEditing(!isEditing)}
                  title={isEditing ? 'Switch to read-only' : 'Edit content'}
                >
                  {isEditing ? '👁️ View' : '✏️ Edit'}
                </button>
                {isEditing && editableEmailContent !== originalEmailContent && (
                  <button
                    className="reset-button"
                    onClick={resetToOriginal}
                    title="Reset to original"
                  >
                    🔄 Reset
                  </button>
                )}
              </>
            )}
          </div>
        </div>
        <div className="content-box">
          {originalEmailContent ? (
            isEditing ? (
              <textarea
                className="editable-content"
                value={editableEmailContent}
                onChange={(e) => setEditableEmailContent(e.target.value)}
                placeholder="Edit the email content here..."
              />
            ) : (
              <div className="email-text">{truncateText(originalEmailContent, 500)}</div>
            )
          ) : (
            <div className="placeholder">
              <div className="placeholder-icon">📭</div>
              <div className="placeholder-text">
                {extractionStatus.includes('Error') || extractionStatus.includes('Failed')
                  ? extractionStatus
                  : 'Open an email in Gmail to extract its content'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="action-section">
        <button
          className="primary-button"
          onClick={handleGenerateResponse}
          disabled={!originalEmailContent || isGenerating}
        >
          {isGenerating ? (
            <>
              <span className="loading-spinner"></span> Generating...
            </>
          ) : (
            <>
              <span className="button-icon">✨</span> Generate AI Response
            </>
          )}
        </button>
      </div>

      {/* Booking Alert */}
      {hasBookingRequest && (
        <div className="booking-alert">
          <div className="alert-content">
            <span className="alert-icon">📅</span>
            <span className="alert-text">Scheduling request detected in this email</span>
          </div>
        </div>
      )}

      {/* AI Response Section */}
      {aiResponse && (
        <div className="response-section">
          <div className="section-header">
            <h3>
              <span className="icon">🤖</span> AI Response
            </h3>
            <div className="response-actions-header">
              <button className="save-button" onClick={saveResponse} title="Save this response">
                💾 Save
              </button>
            </div>
          </div>
          <div className="content-box response-box">
            <textarea
              className="response-text editable-response"
              value={aiResponse}
              onChange={(e) => setAiResponse(e.target.value)}
              placeholder="AI response will appear here..."
            />
          </div>

          <div className="response-actions">
            <button
              className="secondary-button"
              onClick={handleRegenerateResponse}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <span className="loading-spinner"></span> Regenerating...
                </>
              ) : (
                <>
                  <span className="button-icon">🔄</span> Regenerate
                </>
              )}
            </button>
            <button className="primary-button" onClick={handleApplyResponse}>
              <span className="button-icon">📤</span> Apply to Email
            </button>
          </div>

          {hasBookingRequest && (
            <div className="booking-section">
              <button className="booking-button" onClick={handleBooking}>
                <span className="button-icon">📅</span> Add Calendar Availability
              </button>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="footer">
        <div className="footer-text">Gmail AI Assistant • Powered by AI</div>
      </div>
    </div>
  )
}

export default Popup
