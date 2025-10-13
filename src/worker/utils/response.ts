export const errorResponse = (message: string, status = 400) => {
  return Response.json({ error: message }, { status });
};

export const preflightResponse = (
  origin: string | null | undefined,
  allowMethods: string[],
) => {
  const headers = new Headers({
    'Access-Control-Allow-Methods': allowMethods.join(', '),
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  });

  if (origin) {
    headers.set('Access-Control-Allow-Origin', origin);
  }

  return new Response(null, { status: 204, headers });
};
