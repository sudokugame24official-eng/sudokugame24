// Environment constants for the Frontend application

// API URL (Backend HTTP server)
// Uses the NEXT_PUBLIC_API_URL environment variable, defaults to localhost for local development
export const API_URL = 
  (typeof window !== "undefined" && window.location.hostname !== "localhost" && (!process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_URL.includes("localhost")))
    ? "/api"
    : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001");

// WebSockets URL (Backend WS server)
// Uses the NEXT_PUBLIC_WS_URL if defined, otherwise defaults to the API_URL (since they usually run on the same server)
export const WS_URL = process.env.NEXT_PUBLIC_WS_URL || API_URL;
