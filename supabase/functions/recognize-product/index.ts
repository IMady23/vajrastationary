// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'

const GEMINI_PROMPT_V3_1 = `You are an expert stationery and xerox shop AI recognition assistant.
Analyze ONLY the stationery product held closest to the center of the camera frame.
IGNORE the background, shelves, people, hands, and shop environment.
Return strictly a JSON object with NO markdown formatting, containing a "predictions" array of up to 3 possible matches ordered by confidence (highest first).
Each item MUST have:
- "name": full specific product name (e.g. "Flair Creative Move Mechanical Pencil 0.7mm")
- "brand": brand name or "Unknown" (e.g. "Flair", "Reynolds", "Classmate", "Cello", "Camlin", "Faber-Castell")
- "category": one of ["Pens", "Pencils", "Notebooks", "Books", "Files", "Paper", "Art Supplies", "Craft Materials", "Printing", "Xerox", "Office Supplies", "Others"]
- "confidence": number between 0.00 and 1.00

Never estimate or return price, stock, or shelf location. Return JSON only.`

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { imageBase64, mimeType = 'image/jpeg' } = await req.json()
    if (!imageBase64) {
      return new Response(JSON.stringify({ error: 'EMPTY_IMAGE', message: 'No image provided' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY')
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: 'API_KEY_MISSING',
          message: 'GEMINI_API_KEY secret is not configured in Supabase Edge environment.',
        }),
        {
          status: 503,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: GEMINI_PROMPT_V3_1 },
              {
                inline_data: {
                  mime_type: mimeType,
                  data: imageBase64,
                },
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          response_mime_type: 'application/json',
        },
      }),
    })

    const json = await response.json()
    if (!response.ok) {
      return new Response(JSON.stringify({ error: 'GEMINI_API_ERROR', details: json }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const textResponse = json?.candidates?.[0]?.content?.parts?.[0]?.text
    if (textResponse) {
      const parsed = JSON.parse(textResponse)
      return new Response(
        JSON.stringify({
          predictions: parsed.predictions || [],
          meta: {
            gemini_version: 'gemini-1.5-flash',
            prompt_version: 'v3.1-stationery-focus',
            engine_version: '3.2.0',
          },
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    return new Response(
      JSON.stringify({
        predictions: [],
        error: 'PARSE_ERROR',
        raw: json,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (err: any) {
    return new Response(JSON.stringify({ error: 'SERVER_ERROR', message: err?.message || String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
