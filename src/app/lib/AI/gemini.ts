"use server"
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API });

export async function emailSummarize(email:any) {
  const prompt = `
You are an expert email summarizer. Your task is to create a concise, informative summary of the following email while preserving all key information.

EMAIL DETAILS:
From: ${email.from}
Subject: ${email.subject}
Date: ${email.date}

plainText: ${email.plainText}
htmlBody: ${email.htmlBody}

INSTRUCTIONS:
1. Create a 2-3 sentence TL;DR that captures the main purpose and key points of this email.
2. Extract any action items, requests, deadlines, or important dates mentioned.
3. Identify any attachments or links that require attention.
4. Note any emotional tone or urgency indicators.
5. Format your response using markdown:
   - **Bold** key information
   - Use bullet points for lists
   - Create sections with clear headings

Your summary should help the recipient quickly understand:
- What this email is about
- What (if anything) they need to do
- When they need to do it
- The importance/priority level

FORMAT YOUR RESPONSE LIKE THIS:
## Email Summary
[Your 2-3 sentence TL;DR here]

## Key Points
- [Important point 1]
- [Important point 2]
- [etc.]

## Action Items
- [Action 1] - **Deadline**: [date/time if applicable]
- [Action 2] - **Deadline**: [date/time if applicable]
- [etc.]

## Attachments/Links
- [List any attachments or important links]

## Priority Level
[Low/Medium/High/Urgent] - [Brief justification]
  `
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: prompt,
    config: {
      systemInstruction: "You are an AI Email Summarizer."
    }
  });
  return response.text;
}
