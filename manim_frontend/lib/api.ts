"use client";

interface SubmitPromptResponse {
  jobUuid: string;  // Only need this for tracking
}
interface JobStatusResponse {
  status: string
  jobId: string
  created_at: string
  videoId?: number
  codeText?: string
  error_message?: string
  // progress?: number
}

export interface Video {
  id: string
  jobId: string
  title: string
  associatedCode: string
  createdAt: string
}

export interface VideoResponse {
  videos: Video[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

// Backend API URL - updated to match your Express backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

export async function submitPrompt(prompt: string, token: string): Promise<SubmitPromptResponse> {
  const response = await fetch(`${API_BASE_URL}/api/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    body: JSON.stringify({
      prompt,
      config: {
        quality: 'medium',
        duration: 10
      }
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to submit prompt: ${error.error || error.message || 'Unknown error'}`);
  }
  
  return response.json();
}

export async function checkJobStatus(jobUuid: string, token: string): Promise<JobStatusResponse> {
  console.log(jobUuid)
  const response = await fetch(`${API_BASE_URL}/api/status/${jobUuid}`, { // ✅ Fixed endpoint
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`, // ✅ Now using the token
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to check job status: ${error.error || error.message || 'Unknown error'}`);
  }


  return response.json();
}

// Get presigned URL for video download using video ID
export async function getPresignedVideoUrl(videoId: number, token: string) {
  const response = await fetch(`${API_BASE_URL}/api/video/${videoId}/download`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
    },
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to get download URL: ${error.error || error.message || 'Unknown error'}`);
  }
  
  return response.json();
}



export const getUserVideos = async (limit = 10, offset = 0, token: string): Promise<VideoResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/videos?limit=${limit}&offset=${offset}`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    credentials: "include", // Include cookies for authentication
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch videos: ${response.statusText}`)
  }

  return response.json()
}
