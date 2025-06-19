import { NextRequest, NextResponse } from 'next/server';
// Import your actual file-fetching logic as needed

export async function GET(req: NextRequest) {
  try {
    // TODO: Replace with your actual logic to get files
    const files: any[] = []; // Example placeholder

    // Convert BigInt to string for JSON serialization
    const serializedFiles = files.map((file: any) => ({
      ...file,
      size: file.size ? file.size.toString() : undefined,
    }));

    return NextResponse.json({ files: serializedFiles }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 });
  }
}
