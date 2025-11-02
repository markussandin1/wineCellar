# Testing Label Scan Agent (V2)

## Prerequisites

1. Make sure you have a valid OpenAI API key in `.env.local`:
   ```
   OPENAI_API_KEY=sk-...
   ```

2. Have a wine label image ready (JPG or PNG format)

## How to Test

### Step 1: Run the test script

```bash
npm run test:label-scan <path-to-image>
```

### Examples:

If you have a wine label image in your Downloads folder:
```bash
npm run test:label-scan ~/Downloads/wine-label.jpg
```

If you want to test with a specific image:
```bash
npm run test:label-scan ./test-images/barolo.jpg
```

## What the Test Does

1. Reads the image file
2. Converts it to base64
3. Calls the Label Scan Agent (V2)
4. Uses OpenAI Vision API to extract wine information
5. Displays all extracted data:
   - Wine name, producer, vintage
   - Wine type, country, region
   - Primary grape variety
   - Estimated price (in EUR)
   - Confidence levels
   - Performance metrics (tokens, latency)

## Expected Output

```
🍷 Testing Label Scan Agent V2

Image path: ./test-images/barolo.jpg
---

Reading image from: /path/to/wineCellar/test-images/barolo.jpg
Image size: 145 KB
MIME type: image/jpeg

🔄 Calling OpenAI Vision API...

✅ Agent execution completed!

📊 Results:
---
Success: true

🍷 Extracted Wine Information:
  Wine Name: Barolo
  Producer: Paolo Scavino
  Vintage: 2018
  Wine Type: red
  Country: Italy
  Region: Piedmont
  Sub-Region: Barolo DOCG
  Primary Grape: Nebbiolo

💰 Estimated Price:
  Amount: €45
  Confidence: 75%
  Reasoning: Mid-range Barolo producer with good reputation

📈 Metadata:
  Overall Confidence: 92%
  Model: gpt-5-mini
  Tokens Used: 650
  API Latency: 2340ms
  Total Time: 2345ms

---
✨ Test completed!
```

## Tips

- Use clear, well-lit photos of wine labels
- Make sure the label text is readable
- JPEG files work best for photos
- PNG files work for screenshots
- The script automatically detects the image format

## Troubleshooting

**Error: "OpenAI API key not configured"**
- Make sure `.env.local` has `OPENAI_API_KEY` set

**Error: "ENOENT: no such file or directory"**
- Check that the image path is correct
- Use absolute paths or paths relative to project root

**Error: "Failed to extract text from OpenAI response"**
- The image might be too blurry or unclear
- Try with a different, clearer image

## Next Steps

Once you've verified the agent works:
1. Test with multiple different wine labels
2. Verify accuracy of extracted information
3. Compare with V1 results (if available)
4. Note any issues or improvements needed
