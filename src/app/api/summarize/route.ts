import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export const maxDuration = 60; // Max duration for Vercel deployment (if hobby plan is capable, limit to 60 or less)

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    if (!text) {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 });
    }

    // Extract Bearer token if provided by frontend
    const authHeader = request.headers.get('authorization');
    const customApiKey = authHeader?.startsWith('Bearer ') 
      ? authHeader.split('Bearer ')[1] 
      : null;

    const rawApiKey = customApiKey || process.env.GEMINI_API_KEY;
    const apiKey = rawApiKey?.trim();

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key is missing. Please set it in settings or .env.local' }, 
        { status: 401 }
      );
    }

    const ai = new GoogleGenAI({ apiKey });

    const systemPrompt = `You are a world-class smart notes summarizer. Your goal is to process the user's notes and return a high-quality summary and a list of important keywords.
    
Return a raw JSON object (without markdown wrappers like \`\`\`json) with the following structure:
{
  "summary": "Your clear, concise, and highly readable summary (use formatting like bullet points or paragraphs sparingly but effectively).",
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4"]
}

The summary should preserve the main ideas and crucial details of the text. Keep the keywords to 5-8 highly relevant terms.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: text,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        temperature: 0.5,
      }
    });

    const completionStr = response.text || '{}';
    let result;
    
    try {
      result = JSON.parse(completionStr);
    } catch (e) {
      // Fallback if parsing fails
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    return NextResponse.json({
      summary: result.summary || 'No summary generated.',
      keywords: result.keywords || []
    });

  } catch (error: any) {
    console.error('Summarize error:', error);
    return NextResponse.json(
      { error: error?.message || 'An error occurred during summarization' }, 
      { status: 500 }
    );
  }
}
