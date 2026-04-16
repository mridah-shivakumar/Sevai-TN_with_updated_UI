import { Router } from 'express';
import { getClaude, MODEL } from '../middleware/claudeClient.js';

const router = Router();

router.post('/extract-document', async (req, res) => {
  try {
    const { image } = req.body;
    
    if (!image) {
      return res.status(400).json({ error: 'Missing image payload' });
    }

    const claude = getClaude();
    if (!claude) {
      // Mock fallback for demo if API key isn't set
      console.warn("No Anthropic API key set. Returning mock extracted data.");
      return res.json({
        name: "Mock User",
        dob: "01/01/1980",
        idNumber: "1234-5678-9012",
        address: "123 Mock Street, Chennai"
      });
    }

    // `image` is expected to be a data URL like: "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
    const match = image.match(/^data:(image\/[a-zA-Z]*);base64,(.*)$/);
    if (!match) {
      return res.status(400).json({ error: 'Invalid Base64 image payload format' });
    }

    const mimeType = match[1];
    const base64Data = match[2];

    const systemPrompt = `You are a pure data extraction assistant. The user will provide an image of an ID document. Extract the data exactly as seen.
Your output must be a valid JSON object ONLY, with these exact keys:
- "name" (string, the person's full name)
- "dob" (string, date of birth)
- "idNumber" (string, the primary ID number on the card, such as Aadhaar, PAN, Voter ID, etc.)
- "address" (string, the most complete address found)

If a field is not found or unreadable, return null for that field.
Do not output any markdown formatting, backticks, or conversational text. Just the raw JSON object.`;

    console.log(`Extracting document data from ${mimeType}...`);

    const response = await claude.messages.create({
      model: MODEL,
      max_tokens: 500,
      temperature: 0,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mimeType,
                data: base64Data,
              }
            },
            {
              type: "text",
              text: "Extract the details as JSON."
            }
          ]
        }
      ]
    });

    const outputText = response.content
        .filter((b) => b.type === 'text')
        .map((b) => b.text)
        .join('\n')
        .trim();

    let parsedData = null;
    try {
      parsedData = JSON.parse(outputText);
    } catch (parseError) {
      console.error("Failed to parse JSON from Claude:", outputText);
      return res.status(500).json({ error: 'Failed to extract structured data' });
    }

    return res.json(parsedData);

  } catch (error) {
    console.error('Error during document extraction:', error);
    res.status(500).json({ error: 'Internal server error during extraction' });
  }
});

export default router;
