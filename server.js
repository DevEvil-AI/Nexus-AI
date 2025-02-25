// Import required modules
const express = require('express'); // Framework for building web servers
const {
  HfInference
} = require('@huggingface/inference'); // Hugging Face inference API
const bodyParser = require('body-parser'); // Middleware to parse request bodies
const cors = require('cors'); // Middleware to handle Cross-Origin Resource Sharing
const fetch = require('node-fetch'); // HTTP client for making API requests
const ftp = require('basic-ftp'); // FTP client for file uploads
const {
  Readable
} = require('stream'); // Stream utilities for handling buffers
require("dotenv").config(); // Load environment variables from .env file
const OpenAI = require("openai"); // OpenAI client for interacting with xAI
const {
  env
} = require('process'); // Access environment variables

// Initialize the Express app
const app = express();
const PORT = 5500; // Port number for the server

// Allowed origins for CORS
const allowedOrigins = ['http://localhost', 'https://example.com'];

// Middleware to handle CORS
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

// Handle preflight OPTIONS requests
app.options('*', (req, res) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.sendStatus(200);
});

// Parse incoming JSON requests
app.use(express.json());

// API endpoint for the FLUX image generation model
const fluxModelAPI = "https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-dev";

// OpenAI xAI configuration
const openai = new OpenAI({
  apiKey: process.env.XAI_API_KEY, // API key for authentication
  baseURL: "https://api.x.ai/v1", // Base URL for the xAI API
});

// FTP configuration for image uploads
const ftpConfig = {
  host: '', // FTP server hostname
  user: '', // FTP username
  password: '', // FTP password
  port: '', // FTP port
  secure: true // Enable secure FTP
};

// Store user conversation history
const userConversations = {};

// Chat endpoint to handle user messages
app.post('/chat', async (req, res) => {
  const {
    userMessage,
    userId
  } = req.body; // Extract user message and ID

  // Validate input
  if (!userMessage || !userId) {
    return res.status(400).json({
      error: 'No user message or user ID provided'
    });
  }

  // Initialize conversation history for new users
  if (!userConversations[userId]) {
    userConversations[userId] = [{
      role: "system",
      content: `You are an AI assistant developed and powered by DevEvil Universe` // Give AI instructions
    }];
  }

  const conversationHistory = userConversations[userId]; // Retrieve conversation history

  try {
    let botResponse = ''; // Initialize bot response

    // Add user message to conversation history
    conversationHistory.push({
      role: 'user',
      content: userMessage
    });

    // Check if the message is a request for image generation
    const lowerCaseMessage = userMessage.toLowerCase();
    if (lowerCaseMessage.startsWith('create an image') || lowerCaseMessage.startsWith('imagine') || lowerCaseMessage.startsWith('generate an image')) {
      const prompt = userMessage.replace(/create an image|imagine|generate an image/i, '').trim();
      const imageUrl = await generateImage(prompt, userId); // Generate image

      // Prepare bot response with the generated image or an error message
      botResponse = imageUrl ? `<img class="ai-image" src="${imageUrl}" alt="Generated Image" />` :
        `<div class='error'>Oops! Something went wrong. <br> Please try again, and if the issue persists, feel free to reach out to us for support. Join our Discord community at <a href="https://dsc.gg/devevil">https://dsc.gg/devevil</a> to report the problem, and we'll get it sorted out as soon as possible!</div>`;
    } else {
      // Generate chat response using xAI
      const chatCompletion = await openai.chat.completions.create({
        model: "grok-2-1212", // Chat model
        messages: conversationHistory,
        temperature: 0, // Adjusts response randomness
        max_tokens: 1024 // Maximum response length
      });

      botResponse += chatCompletion.choices[0].message.content || ''; // Extract response content
    }

    // Add bot response to conversation history
    conversationHistory.push({
      role: 'assistant',
      content: botResponse
    });

    // Send response to the user
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

// Function to generate an image
async function generateImage(prompt, userId) {
  const controller = new AbortController(); // Abort controller for timeout
  const timeout = setTimeout(() => {
    controller.abort(); // Abort the request after timeout
  }, 10000);

  try {
    // Send request to the FLUX model API
    const response = await fetch(fluxModelAPI, {
      headers: {
        Authorization: `Bearer ${process.env.HUGGING_FACE_API_KEY}`,
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({
        inputs: prompt
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout); // Clear timeout after response

    const arrayBuffer = await response.arrayBuffer(); // Get response as buffer
    const buffer = Buffer.from(arrayBuffer);
    const imageName = `${userId}-${Date.now()}-${prompt}.png`; // Generate unique image name

    // Create a readable stream from the buffer
    const readableStream = new Readable();
    readableStream.push(buffer);
    readableStream.push(null);

    // Upload image to FTP server
    const ftpClient = new ftp.Client();
    try {
      await ftpClient.access(ftpConfig);
      await ftpClient.uploadFrom(readableStream, `/${imageName}`);
    } catch (err) {
      console.error('FTP upload error:', err);
      return null;
    } finally {
      ftpClient.close(); // Close FTP connection
    }

    return `https://[your_domain]/${imageName}`; // Return image URL
  } catch (error) {
    console.error('Error generating image:', error);
    return null;
  }
}

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
