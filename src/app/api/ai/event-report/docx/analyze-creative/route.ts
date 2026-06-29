import { NextResponse } from 'next/server'
import { geminiVisionModel } from '@/lib/ai'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { creativeImage, eventTitle, eventDescription, organizingDepartment } = body

    if (!creativeImage) {
      return NextResponse.json({ error: 'No creative image provided' }, { status: 400 })
    }

    const aiPrompt = `You are assisting in extracting information from an event poster/creative to help fill out an Event/Activity Report.

Event Title: "${eventTitle}"
Event Description: "${eventDescription || 'Not provided'}"
Department: "${organizingDepartment || 'Not provided'}"

Analyze the attached poster and extract information for the following fields. Each should be 1-3 formal sentences (or just the names for guests/judges) suitable for a college event report. Do NOT use markdown formatting. Use plain text only.

Respond STRICTLY as a JSON object with these keys:
{
  "expectedOutcome": "...",
  "chiefGuest": "...",
  "judgesDetail": "...",
  "rulesAndRegulations": "...",
  "targetAudience": "..."
}

Field descriptions:
- expectedOutcome: What the organizers expected participants to gain from this event. If not explicitly stated, infer a professional outcome based on the event theme.
- targetAudience: Specific target audience mentioned (e.g. "BBA & MBA students", "Fresher students", etc). If none, return 'None'.
- chiefGuest: Names and designations of any chief guests or speakers mentioned in the creative. If none, return 'None'.
- judgesDetail: Names and designations of any judges mentioned in the creative. If none, return 'None'.
- rulesAndRegulations: General rules mentioned in the creative (e.g., deadlines, fees, team size). If none, return 'None'.

Return ONLY the JSON, no other text.`

    const imagePart = {
      inlineData: {
        data: creativeImage.base64,
        mimeType: creativeImage.mimeType
      }
    }

    const result = await Promise.race([
      geminiVisionModel.generateContent([aiPrompt, imagePart]),
      new Promise<any>((_, reject) => setTimeout(() => reject(new Error('AI generation timed out (60s)')), 60000))
    ])

    const text = result.response.text().trim()
    const match = text.match(/\{[\s\S]*\}/)
    
    if (match) {
      const parsed = JSON.parse(match[0])
      return NextResponse.json(parsed)
    } else {
      throw new Error('Failed to parse AI response as JSON')
    }

  } catch (error: any) {
    console.error('Creative analysis failed:', error)
    return NextResponse.json({ error: error.message || 'Failed to analyze creative' }, { status: 500 })
  }
}
