
import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Path to the assetlinks.json file in the public directory
    const filePath = path.join(process.cwd(), 'public', 'assetlinks.json');
    
    // Read the file content
    const fileContents = await fs.readFile(filePath, 'utf8');
    
    // Parse it to ensure it's valid JSON
    const jsonContents = JSON.parse(fileContents);

    // Return the content with the correct Content-Type header
    return NextResponse.json(jsonContents);
  } catch (error) {
    console.error('Could not read assetlinks.json:', error);
    return new NextResponse('Not Found', { status: 404 });
  }
}
