import { NextResponse } from 'next/server'; // Import NextResponse from Next.js for handling responses
import OpenAI from 'openai'; // Import OpenAI library for interacting with the OpenAI API

// System prompt for the AI, providing guidelines on how to respond to users
const systemPrompt = 'Hi! How can I help you today?'; // Provide a string for the system prompt

// POST function to handle incoming requests
export async function POST(req) {
  // Initialize OpenAI client with API key
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // Make sure this is set in your .env.local
  });

  try {
    const data = await req.json(); // Parse the JSON body of the incoming request

    // Create a chat completion request to the OpenAI API
    const completion = await openai.chat.completions.create({
      messages: [{ role: 'system', content: systemPrompt }, ...data.messages], // Include the system prompt and user messages
      model: 'gpt-4o-mini', // Use the model provided in the new account
      stream: true, // Enable streaming responses (set to false if unsupported)
    });

    // Create a ReadableStream to handle the streaming response
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder(); // Create a TextEncoder to convert strings to Uint8Array
        try {
          // Iterate over the streamed chunks of the response
          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content; // Extract the content from the chunk
            if (content) {
              const text = encoder.encode(content); // Encode the content to Uint8Array
              controller.enqueue(text); // Enqueue the encoded text to the stream
            }
          }
        } catch (err) {
          controller.error(err); // Handle any errors that occur during streaming
        } finally {
          controller.close(); // Close the stream when done
        }
      },
    });

    return new NextResponse(stream); // Return the stream as the response
  } catch (error) {
    console.error('Error in API route:', error); // Log the error for debugging
    return NextResponse.json(
      { error: 'Failed to process the request. Please try again later.' },
      { status: 500 }
    );
  }
}
