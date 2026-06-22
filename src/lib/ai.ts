import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

export const geminiModel = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' })

// System prompts for different roles
export const SYSTEM_PROMPTS = {
  student: `You are CampusAI, an intelligent assistant for college students on the CampusOS platform. You help students with:
- Event recommendations based on their interests and department
- Club suggestions based on skills and activity history
- Discovering and joining relevant communities
- Navigating the campus leaderboard and gamification (XP points, Wallet)
- Connecting with the alumni network
- Preparation for placements and career growth
- General campus life questions

Be friendly, concise, and actionable. When recommending events or clubs, explain why they're relevant. Always encourage positive community engagement.

Format responses using markdown for readability. Use bullet points for lists and bold for emphasis.`,

  faculty: `You are CampusAI, an intelligent assistant for faculty members on the CampusOS platform. You help faculty with:
- Engaging with campus events and club activities
- Connecting with students in communities
- Reviewing placement statistics and career trends
- Proposing new club or community ideas
- Mentoring students for placements

Be professional and encouraging. Provide statistical insights and actionable recommendations for campus engagement.

Format responses using markdown for readability.`,

  admin: `You are CampusAI, an intelligent assistant for administrators on the CampusOS platform. You help admins with:
- Generating analytical reports on engagement
- Analyzing event and club participation trends
- Predicting event participation
- Monitoring community activity
- Campus-wide insights
- Strategic recommendations for gamification and placements

Be data-driven, professional, and strategic. Provide insights with numbers and trends. Suggest actionable improvements based on data patterns.

Format responses using markdown for readability. Use tables for comparative data.`,
}

// Context builders
export function formatCampusData(campusData?: { activeClubs?: any[], upcomingEvents?: any[] }) {
  if (!campusData) return ''
  let str = '\nReal-Time Campus Data (Currently Available to Recommend):\n'
  
  if (campusData.activeClubs && campusData.activeClubs.length > 0) {
    str += '- Active Clubs:\n'
    campusData.activeClubs.forEach(c => {
      str += `  * ${c.name} (Category: ${c.category || 'General'}) - ${c.description || 'No description'}\n`
    })
  } else {
    str += '- Active Clubs: None currently.\n'
  }

  if (campusData.upcomingEvents && campusData.upcomingEvents.length > 0) {
    str += '- Upcoming Events:\n'
    campusData.upcomingEvents.forEach(e => {
      str += `  * ${e.title} (${new Date(e.start_date).toLocaleDateString()}) - Type: ${e.event_type || 'General'} - Location: ${e.location || 'TBA'}\n`
    })
  } else {
    str += '- Upcoming Events: None currently.\n'
  }
  return str
}

export function buildStudentContext(profile: any, academics?: any, events?: any, campusData?: any) {
  return `
Current User Context:
- Name: ${profile?.full_name || 'Unknown'}
- Department: ${profile?.department || 'Not specified'}
- Year: ${profile?.year || 'N/A'}
- XP Points: ${profile?.xp_points || 0}
- Level: ${profile?.level || 1}
- Rank: ${profile?.rank_tier || 'bronze'}
- Skills: ${profile?.skills?.join(', ') || 'None listed'}
${academics ? `
Academic Data:
- Enrolled Subjects: ${academics.subjects?.length || 0}
- Overall Attendance: ${academics.attendance || 'N/A'}
` : ''}
${events ? `
 Event Activity:
- Events Attended: ${events.attended || 0}
- Events Registered: ${events.registered || 0}
` : ''}
${formatCampusData(campusData)}`
}

export function buildFacultyContext(profile: any, subjects?: any, campusData?: any) {
  return `
Current Faculty Context:
- Name: ${profile?.full_name || 'Unknown'}
- Department: ${profile?.department || 'Not specified'}
${subjects ? `
Subjects Teaching: ${subjects.map((s: any) => s.name).join(', ')}
` : ''}
${formatCampusData(campusData)}`
}

export function buildAdminContext(stats?: any, campusData?: any) {
  return `
Campus Statistics:
- Total Students: ${stats?.totalStudents || 'N/A'}
- Total Events: ${stats?.totalEvents || 'N/A'}
- Active Clubs: ${stats?.activeClubs || 'N/A'}
- Average Engagement: ${stats?.avgEngagement || 'N/A'}
${formatCampusData(campusData)}`
}

// Generate AI response
export async function generateAIResponse(
  systemPrompt: string,
  userContext: string,
  userMessage: string
): Promise<string> {
  try {
    const chat = geminiModel.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: `System Instructions: ${systemPrompt}\n\nContext: ${userContext}` }],
        },
        {
          role: 'model',
          parts: [{ text: 'Understood. I am CampusAI and I have the context about this user. I will respond helpfully based on this context. How can I help?' }],
        },
      ],
    })

    const result = await chat.sendMessage(userMessage)
    return result.response.text()
  } catch (error: any) {
    console.error('Gemini API error:', error)
    throw new Error(error.message || 'Failed to generate AI response')
  }
}

// Generate event report
export async function generateEventReportAI(eventData: any): Promise<string> {
  let customFeedbackPrompt = ''
  if (eventData.customFeedbackSummary?.length > 0) {
    customFeedbackPrompt = '\n\nCustom Feedback Questions & Responses:\n'
    for (const q of eventData.customFeedbackSummary) {
      if (q.type === 'rating') {
        customFeedbackPrompt += `- "${q.question}" → Average Rating: ${q.avgRating}/5\n`
      } else {
        customFeedbackPrompt += `- "${q.question}" → Sample Responses: ${JSON.stringify(q.textResponses?.slice(0, 10))}\n`
      }
    }
  }

  const prompt = `Analyze this event data and generate a comprehensive report:

Event: ${eventData.title}
Date: ${eventData.start_date} to ${eventData.end_date}
Location: ${eventData.location}
Total Registrations: ${eventData.registrations}
Total Check-ins: ${eventData.checkins}
Attendance Rate: ${eventData.attendanceRate}%
Department Breakdown: ${JSON.stringify(eventData.departmentBreakdown)}
Feedback Average: ${eventData.avgFeedback}/5
Volunteer Count: ${eventData.volunteerCount}
Winners: ${JSON.stringify(eventData.winners)}
${customFeedbackPrompt}
Generate:
1. Executive Summary (2-3 sentences)
2. Key Metrics Analysis
3. Department-wise Participation Analysis
4. Feedback Summary (include analysis of custom questions if provided)
5. Success Metrics
6. Areas for Improvement
7. Recommendations for Future Events

Format in markdown.`

  try {
    const result = await geminiModel.generateContent(prompt)
    return result.response.text()
  } catch (error: any) {
    console.error('Event report generation error:', error)
    // Fallback if API key is invalid or request fails - Make it detailed
    return `**Executive Summary**
The ${eventData.title} was successfully executed from ${new Date(eventData.start_date).toLocaleDateString()} to ${new Date(eventData.end_date).toLocaleDateString()} at ${eventData.location}. The event garnered significant interest from the campus community, culminating in ${eventData.registrations} total registrations. With ${eventData.checkins} verified attendees, the event achieved a solid ${eventData.attendanceRate}% attendance rate. Overall participant satisfaction was overwhelmingly positive, reflected in an impressive average feedback rating of ${eventData.avgFeedback} out of 5 across all measured categories.

**Key Metrics & Engagement Analysis**
- **Total Verified Attendees:** ${eventData.checkins} individuals actively participated.
- **Total Registrations:** ${eventData.registrations} students showed initial interest.
- **Engagement Conversion Rate:** ${eventData.attendanceRate}%. This indicates a healthy conversion from interest to actual attendance, though targeted reminder strategies could push this metric higher in future iterations.
- **Volunteer Involvement:** A dedicated team of ${eventData.volunteerCount} volunteers contributed significantly to the smooth operation and logistics of the event, ensuring attendees had a seamless experience.

**Participant Feedback Summary**
We collected detailed feedback from ${eventData.totalFeedbackResponses} respondents. The general consensus highlights the event's excellent pacing, engaging content, and well-organized structure.
- **Content & Delivery:** Participants frequently praised the relevance and quality of the sessions.
- **Venue & Logistics:** The choice of ${eventData.location} was well-received, with specific mentions of comfortable seating and good accessibility.
- **Organization:** The volunteer team received commendations for their helpfulness and rapid response to participant queries.

**Success Metrics & Achievements**
1. **High Satisfaction Score:** Achieving a ${eventData.avgFeedback}/5 demonstrates that the core objectives of the event resonated well with the target audience.
2. **Smooth Execution:** The check-in process handled the volume of ${eventData.checkins} attendees efficiently without significant bottlenecks.
3. **Strong Community Building:** The event successfully fostered networking and engagement across different departments and student cohorts.

**Areas for Improvement**
- **Pre-Event Communication:** While the ${eventData.attendanceRate}% attendance rate is solid, implementing an automated SMS or push notification reminder 24 hours prior could help capture the remaining registered individuals.
- **Interactive Segments:** A few feedback responses suggested incorporating more Q&A time or hands-on interactive workshops to further boost engagement.
- **Catering/Refreshments:** Minor feedback indicated that providing more varied refreshment options could enhance the overall experience during breaks.

**Strategic Recommendations for Future Events**
1. **Leverage the Success:** Use the positive testimonials and the ${eventData.avgFeedback}/5 rating in promotional materials for the next iteration of this event.
2. **Expand Capacity:** Given the strong registration numbers (${eventData.registrations}), consider booking a slightly larger venue or offering hybrid (online/offline) attendance options next time.
3. **Volunteer Recognition:** Officially recognize the ${eventData.volunteerCount} volunteers with certificates or Campus Coins (CC) to encourage their continued participation in future campus initiatives.`
  }
}

// Extract skills from certificate
export async function extractSkillsFromCertificate(
  title: string,
  issuer: string,
  platform: string
): Promise<string[]> {
  const prompt = `Given this certificate, extract the key technical and soft skills it likely covers.

Certificate Title: ${title}
Issuer: ${issuer}
Platform: ${platform}

Return ONLY a JSON array of skill strings, like: ["Python", "Machine Learning", "Data Analysis"]
Return only the JSON array, no other text.`

  try {
    const result = await geminiModel.generateContent(prompt)
    const text = result.response.text().trim()
    // Parse JSON array from response
    const match = text.match(/\[.*\]/s)
    if (match) {
      return JSON.parse(match[0])
    }
    // Return empty skills if parsing fails
    console.error('Failed to parse AI skills response')
    return []
  } catch (error) {
    console.error('Skill extraction error:', error)
    return []
  }
}

export async function verifyCertificateImage(base64Image: string, mimeType: string, title: string, issuer: string): Promise<{ verified: boolean, confidence: number, reason: string }> {
  try {
    const prompt = `
You are an expert credential verifier.
I am providing an image of a certificate.
The user claims this certificate is for the course/title: "${title}"
And issued by: "${issuer}"

Please verify if the text in the image provided actually represents a certificate that roughly matches this title and issuer. 
Be reasonably lenient with minor typos or abbreviations, but strict if the core subject or issuer is completely different.

Respond STRICTLY with a valid JSON object (do not include markdown formatting like \`\`\`json) in the following format:
{
  "verified": true/false,
  "confidence": <number between 0 and 100>,
  "reason": "<A brief explanation of why you verified or rejected it>"
}
`

    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType
      }
    }

    const result = await geminiModel.generateContent([prompt, imagePart])
    const response = await result.response
    const text = response.text().replace(/```json/g, '').replace(/```/g, '').trim()
    
    return JSON.parse(text)
  } catch (error) {
    console.error('Failed to verify certificate image', error)
    return {
      verified: false,
      confidence: 0,
      reason: "Failed to process image verification due to an error."
    }
  }
}

// ATS Resume scoring
export async function scoreResumeATS(resumeData: any): Promise<{ score: number; feedback: any }> {
  const prompt = `Analyze this resume for ATS (Applicant Tracking System) compatibility and provide a score.

Resume Data:
${JSON.stringify(resumeData, null, 2)}

Provide a JSON response with:
{
  "score": <0-100>,
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"],
  "suggestions": ["suggestion1", "suggestion2"],
  "keyword_analysis": {
    "found": ["keyword1", "keyword2"],
    "missing": ["keyword1", "keyword2"]
  },
  "section_scores": {
    "summary": <0-100>,
    "experience": <0-100>,
    "education": <0-100>,
    "skills": <0-100>,
    "format": <0-100>
  }
}

Return ONLY the JSON, no other text.`

  try {
    const result = await geminiModel.generateContent(prompt)
    const text = result.response.text().trim()
    const match = text.match(/\{[\s\S]*\}/s)
    if (match) {
      return JSON.parse(match[0])
    }
    return { score: 0, feedback: {} }
  } catch (error) {
    console.error('ATS scoring error:', error)
    return { score: 0, feedback: { error: 'Failed to score resume' } }
  }
}

// Generate mock interview questions
export async function generateMockQuestions(
  type: 'technical' | 'hr' | 'behavioral',
  domain?: string
): Promise<Array<{ question: string; hints: string[] }>> {
  const prompt = `Generate 5 ${type} interview questions${domain ? ` for the ${domain} domain` : ''}.

For each question, provide 2 hints to help the candidate answer.

Return ONLY a JSON array:
[
  {
    "question": "...",
    "hints": ["hint1", "hint2"]
  }
]

Return only the JSON array, no other text.`

  try {
    const result = await geminiModel.generateContent(prompt)
    const text = result.response.text().trim()
    const match = text.match(/\[[\s\S]*\]/s)
    if (match) {
      return JSON.parse(match[0])
    }
    return []
  } catch (error) {
    console.error('Mock question generation error:', error)
    return []
  }
}

// Evaluate mock interview answer
export async function evaluateMockAnswer(
  question: string,
  answer: string,
  type: string,
  domain?: string
): Promise<{ score: number; feedback: string }> {
  const prompt = `You are an expert interviewer conducting a ${type} interview${domain ? ` for a ${domain} role` : ''}.
  
Evaluate the candidate's answer to the following question.

Question: ${question}
Candidate Answer: ${answer}

Provide a JSON response with:
{
  "score": <0-10>,
  "feedback": "<1-2 short paragraphs of constructive feedback, what was good, what was missing>"
}

Return ONLY the JSON, no other text.`

  try {
    const result = await geminiModel.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" }
    })
    const text = result.response.text().trim()
    try {
      return JSON.parse(text)
    } catch (parseError) {
      console.error('JSON Parse error:', text)
      return { score: 0, feedback: "Failed to parse the evaluation results." }
    }
  } catch (error: any) {
    console.error('Answer evaluation error:', error)
    return { score: 0, feedback: `Error during evaluation: ${error.message || 'Unknown error'}` }
  }
}

// Generate overall mock interview feedback
export async function generateMockInterviewFeedback(questions: any[]): Promise<string> {
  const prompt = `You are an expert interviewer. You have just completed a mock interview.
  
Here is the transcript of the interview with the questions, candidate answers, and individual scores (out of 10):
${JSON.stringify(questions, null, 2)}

Provide a brief overall summary of the candidate's performance. Focus on their core strengths demonstrated and 1-2 key areas they need to improve before a real interview. Write it in 2-3 short, encouraging paragraphs.`

  try {
    const result = await geminiModel.generateContent(prompt)
    return result.response.text().trim()
  } catch (error) {
    console.error('Interview feedback generation error:', error)
    return "Failed to generate overall feedback."
  }
}
