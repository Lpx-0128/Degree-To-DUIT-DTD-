import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: NextRequest) {
  try {
    const { fileData, mimeType, dreamRole, schema, systemInstruction } = await req.json();

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: 'Gemini API key not configured on server' }, { status: 500 });
    }

    const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const result = await genAI.models.generateContent({
      model: "gemini-1.5-pro",
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType,
                data: fileData
              }
            },
            {
              text: `Analyze this document according to the system instructions.\n\nUser's Dream Role: ${dreamRole || 'Not specified, assume a high-growth role based on their profile.'}`
            }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
        temperature: 0.2,
        systemInstruction,
      },
    });

    const text = result.text;
    if (!text) {
      throw new Error('Gemination failed to return text');
    }
    
    return NextResponse.json(JSON.parse(text));
  } catch (error: any) {
    console.error('AI Analysis Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to analyze document' }, { status: 500 });
  }
}
