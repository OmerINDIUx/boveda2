import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const token = request.cookies.get('holocron_token')?.value;

  if (!token) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const upstream = await fetch(`${API_URL}/documents/${id}/content`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: 'No fue posible obtener el contenido del documento' },
        { status: upstream.status }
      );
    }

    const buffer = await upstream.arrayBuffer();
    const contentType = upstream.headers.get('Content-Type') ?? 'application/octet-stream';
    const contentDisposition = upstream.headers.get('Content-Disposition') ?? 'inline';

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': contentDisposition,
        'Content-Length': String(buffer.byteLength),
        'Cache-Control': 'private, no-cache',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Error al obtener el contenido del documento' },
      { status: 500 }
    );
  }
}
