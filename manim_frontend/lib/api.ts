// API functions to communicate with the backend

interface SubmitPromptResponse {
    jobId: string
  }
  
  interface JobStatusResponse {
    status: string
    jobId: string
    created_at: string
    videoId?: number
    codeText?: string
    message?: string
  }
  
  // Backend API URL - replace with your actual backend URL
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
  
  /**
   * Submit a prompt to the backend to generate a Manim animation
   */
  export async function submitPrompt(prompt: string): Promise<SubmitPromptResponse> {
    const response = await fetch(`${API_BASE_URL}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    })
  
    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to submit prompt: ${error}`)
    }
  
    return response.json()
  }
  
  /**
   * Check the status of a job using its ID
   */
  export async function checkJobStatus(jobId: string): Promise<JobStatusResponse> {
    const response = await fetch(`${API_BASE_URL}/api/job_status/${jobId}`)
  
    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to check job status: ${error}`)
    }
    
    return response.json()
  }