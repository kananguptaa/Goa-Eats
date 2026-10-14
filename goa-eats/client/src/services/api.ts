export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await fetch('http://localhost:3001/api/health')
    return response.ok
  } catch {
    return false
  }
}
