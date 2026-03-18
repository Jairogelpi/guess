export type ActionError = {
  code: string
  message: string
}

export function errorResponse(code: string, message: string, status = 400): Response {
  const body: ActionError = { code, message }
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export function okResponse(data: unknown): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}
