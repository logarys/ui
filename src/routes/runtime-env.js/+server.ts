function jsString(value: string): string {
  return JSON.stringify(value);
}

export function GET() {
  const publicVars = Object.entries(process.env)
    .filter(([key]) => key.startsWith('PUBLIC_'))
    .map(([key, value]) => `  ${JSON.stringify(key)}: ${jsString(value ?? '')}`)
    .join(',\n');

  const body = `window.__RUNTIME_ENV__ = {\n${publicVars}\n};\n`;

  return new Response(body, {
    headers: {
      'content-type': 'application/javascript; charset=utf-8',
      'cache-control': 'no-store'
    }
  });
}