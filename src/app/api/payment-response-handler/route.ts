import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const encResp = formData.get('encResp');

  if (!encResp || typeof encResp !== 'string') {
    return NextResponse.json({ error: 'Missing encResp' }, { status: 400 });
  }

  // Forward to your internal API
  const backendFormData = new FormData();
  backendFormData.append('encResp', encResp);

  try {
    const res = await fetch('https://api.sanzadinternational.in/api/V1/payment/payment-status-update', {
      method: 'POST',
      body: backendFormData,
    });

    if (!res.ok) {
      return NextResponse.redirect('https://sanzadinternational.in/payment-failed');
    }

    const json = await res.json();
    const redirectUrl = json?.redirectUrl || 'https://sanzadinternational.in/thank-you';

    // Return HTML with meta redirect (because we can't use window.location in API route)
    return new NextResponse(
      `
      <html>
        <head><meta http-equiv="refresh" content="0;url=${redirectUrl}" /></head>
        <body>
          <p>Redirecting to payment result...</p>
        </body>
      </html>
    `,
      {
        status: 200,
        headers: {
          'Content-Type': 'text/html',
        },
      }
    );
  } catch (error) {
    return NextResponse.redirect('https://sanzadinternational.in/payment-failed');
  }
}

export function GET() {
  return new NextResponse('Method Not Allowed', { status: 405 });
}
