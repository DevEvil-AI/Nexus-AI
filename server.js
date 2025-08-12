const express = require('express');
const {
  HfInference
} = require('@huggingface/inference');
const bodyParser = require('body-parser');
const cors = require('cors');
const fetch = require('node-fetch');
const ftp = require('basic-ftp');
const {
  Readable
} = require('stream');
require("dotenv").config();
const OpenAI = require("openai");
const {
  env
} = require('process');


const app = express();
const PORT = 5500;


const allowedOrigins = ['http://localhost', 'https://example.com'];


app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});


app.options('*', (req, res) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.sendStatus(200);
});


app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.XAI_API_KEY
});


const ftpConfig = {
  host: '',
  user: '',
  password: '',
  port: '',
  secure: true
};


const userConversations = {};


app.post('/chat', async (req, res) => {
  const {
    userMessage,
    userId
  } = req.body;


  if (!userMessage || !userId) {
    return res.status(400).json({
      error: 'No user message or user ID provided'
    });
  }


  if (!userConversations[userId]) {
    userConversations[userId] = [{
      role: "system",
      content: `You are an AI assistant that helps users with their needs and questions` // A system prompt and instructions for the AI
    }];
  }

  const conversationHistory = userConversations[userId];

  try {
    let botResponse = '';


    conversationHistory.push({
      role: 'user',
      content: userMessage
    });


    const lowerCaseMessage = userMessage.toLowerCase();

    // Image Generation
    if (lowerCaseMessage.startsWith('create an image') || lowerCaseMessage.startsWith('imagine') || lowerCaseMessage.startsWith('generate an image')) {
      const prompt = userMessage.replace(/create an image|imagine|generate an image/i, '').trim();
      const imageUrl = await generateImage(prompt, userId);


      botResponse = imageUrl ? `<img class="ai-image" src="${imageUrl}" alt="Generated Image" />` : `Oops! Something went wrong. Please try again, and if the issue persists.`;
    }
    // Reasoning, You can change the way it works and triggers, this is just how it works
    else if (lowerCaseMessage.startsWith('reason')) {

      const chatCompletion = await openai.chat.completions.create({
        model: "o3-mini",
        messages: conversationHistory,
        reasoning_effort: "low"
      });

      botResponse += chatCompletion.choices[0].message.content || '';

      conversationHistory.push({
        role: 'assistant',
        content: botResponse
      });
    }
    // Chatting
    else {

      const chatCompletion = await openai.chat.completions.create({
        model: "gpt-5",
        messages: conversationHistory,
        temperature: 1,
        max_completion_tokens: 2048,
        reasoning_effort: "low"
      });

      botResponse += chatCompletion.choices[0].message.content || '';
    }


    conversationHistory.push({
      role: 'assistant',
      content: botResponse
    });


    res.json({
      botResponse
    });
  } catch (error) {
    console.error('Error communicating with API:', error);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});


async function generateImage(prompt, userId) {
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, 60000);

  try {
    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      throw new Error('Invalid or empty prompt provided for image generation.');
    }

    const response = await fetch('https://router.huggingface.co/together/v1/images/generations', {
      headers: {
        Authorization: `Bearer ${process.env.HUGGING_FACE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({
        prompt: prompt,
        response_format: 'base64',
        model: 'black-forest-labs/FLUX.1-Krea-dev',
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unable to read error response body');
      console.error('Image generation API error:', {
        status: response.status,
        statusText: response.statusText,
        responseBody: errorText,
        prompt,
        userId,
      });
      throw new Error(`Failed to fetch image from API: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    if (!result.data || !result.data[0] || !result.data[0].b64_json) {
      console.error('Invalid API response format:', {
        response: result,
        prompt,
        userId,
      });
      throw new Error('Invalid API response: Missing base64 image data.');
    }

    const base64Data = result.data[0].b64_json;
    const buffer = Buffer.from(base64Data, 'base64');

    const imageName = `${userId}-${Date.now()}-${prompt.replace(/[^a-zA-Z0-9]/g, '_')}.png`;

    const readableStream = new Readable();
    readableStream.push(buffer);
    readableStream.push(null);

    const ftpClient = new ftp.Client();
    try {
      await ftpClient.access(ftpConfig);
      await ftpClient.uploadFrom(readableStream, `/${imageName}`);
    } catch (err) {
      console.error('FTP upload error:', {
        error: err.message,
        imageName,
        userId,
      });
      throw new Error(`FTP upload failed: ${err.message}`);
    } finally {
      ftpClient.close();
    }

    // Change "[your_domain]" to the domain of your FTP where images are hosted on
    return `https://[your_domain]/${imageName}`;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('Image generation timed out:', {
        prompt,
        userId,
        timeout: '60 seconds',
      });
      throw new Error('Image generation request timed out after 60 seconds.');
    }

    console.error('Error generating image:', {
      error: error.message,
      prompt,
      userId,
      stack: error.stack,
    });
    return null;
  }
}

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
