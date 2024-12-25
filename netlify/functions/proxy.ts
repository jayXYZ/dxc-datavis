import { Handler } from '@netlify/functions'

const API_URL = 'https://mtg-data.fly.dev'

export const handler: Handler = async (event) => {
  // Get the path and query parameters from the request
  const path = event.path.replace('/.netlify/functions/proxy', '')
  const queryString = event.queryStringParameters 
    ? '?' + new URLSearchParams(event.queryStringParameters).toString() 
    : ''

  try {
    // Forward the request to the API
    const response = await fetch(`${API_URL}${path}${queryString}`)
    const data = await response.json()

    // Return the response with CORS headers
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      },
      body: JSON.stringify(data),
    }
  } catch (error) {
    console.error('Proxy error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch data' }),
    }
  }
} 