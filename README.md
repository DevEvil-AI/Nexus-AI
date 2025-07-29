# **Nexus AI**

This repository enables you to host a powerful AI backend that supports chat and image generation using **xAI/OpenAI** for conversational and reasoning AI and **FLUX** for advanced image generation. 

This guide will help you set up, configure, and use the server for your projects.

---

## **Features Not Included in This Repository**

- **Search & News Models**  
    The search and news model used in Nexus AI is not part of this repository.

- **User Usage Limits**  
 This repository does not impose any user usage limits, allowing users to chat or generate images without restrictions. This makes it an excellent choice for testing and development purposes. Additionally, a `userId` parameter has been implemented, providing a foundation for easily adding usage limit functionality if needed in the future.

- **DevEvil API Integration**  
  DevEvil API is the brain of Nexus AI and its models, its not included in this repository. This repository **utilizes publicly available APIs** for chat and image generation models.

---

### **Table of Contents**

1. [Introduction](#nexus-ai)  
2. [Features Not Included in This Repository](#features-not-included-in-this-repository)  
3. [Repository Structure](#repository-structure)  
4. [Features](#features)  
   - Chat API  
   - Reasoning API  
   - Image Generation API  
   - FTP Integration  
5. [Setup Guide](#setup-guide)  
   - [Prerequisites](#1-prerequisites)  
   - [Installation](#2-installation)  
   - [Run the Server](#3-run-the-server)  
6. [How to Use xAI Instead of OpenAI](#how-to-use-xai-instead-of-openai)  
7. [Usage](#usage)  
   - [Chat API](#chat-api)  
   - [Reasoning API](#reasoning-api)  
   - [Image Generation API](#image-generation-api)  
8. [How to Integrate in Your Project](#how-to-integrate-in-your-project)  
9. [Environment Variables](#environment-variables)  
10. [License](#license)  
11. [Support](#support)  

---

## **Repository Structure**

- **`server.js`**  
  The main server file. Handles API endpoints for chat and image generation.
  
- **`.env.example`**  
  Template for environment variables. Rename this file to `.env` and fill in your credentials.

- **`package.json`**  
  Contains project metadata and dependencies for setting up the server.

---

## **Features**

1. **Chat API**  
   A conversational AI model powered by xAI or OpenAI to generate intelligent and context-aware responses.

2. **Reasoning API**  
   A reasoning AI model powered by xAI or OpenAI that thinks longer and generates detailed and more accurate responses.

3. **Image Generation API**  
   Generate images based on user prompts using the FLUX model.

4. **FTP Integration**  
   Images are securely stored on an FTP server and accessible via a URL.

---

## **Setup Guide**

### **1. Prerequisites**
- Node.js (v14 or higher)
- npm (Node Package Manager)
- An FTP server for image storage
- API keys for:
  - Hugging Face
  - xAI/OpenAI 

---

### **2. Installation**

1. Clone this repository:
   ```bash
   git clone https://github.com/DevEvil-AI/Nexus-AI.git
   cd Nexus-AI
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Rename `.env.example` to `.env`:
   ```bash
   mv .env.example .env
   ```

4. Fill in the `.env` file with your credentials:
   ```env
   XAI_API_KEY=your_xai_api_key
   HUGGING_FACE_API_KEY=your_hugging_face_api_key
   ```

---

### **3. Run the Server**

Start the server:
```bash
node server.js
```

You should see:
```
Server is running on http://localhost:5500
```

---

### **How to Use xAI Instead of OpenAI**  

If you'd like to switch from OpenAI to xAI for your project, follow these steps:  

1. **Add `baseURL` Property**  
   In the `const openai` declaration, add `baseURL` property:  
   ```javascript
   const openai = new OpenAI({
       apiKey: process.env.OPENAI_API_KEY, // Replace with your xAI API key
       baseURL: "https://api.x.ai/v1" // Base URL for the xAI API
   });
   ```  

2. **Replace the API Key**  
   - Update the `apiKey` value to use your xAI API key.  
     ```javascript
     const openai = new OpenAI({
         apiKey: process.env.XAI_API_KEY, // Use the xAI API key from the environment variable
         baseURL: "https://api.x.ai/v1"
     });
     ```  

3. **Update the Models**  
   - Chat model: In the `chatCompletion` section for chat model, change the model to one of xAI's chat models, such as `grok-3`:  
   ```javascript
   const chatCompletion = await openai.chat.completions.create({
       model: "grok-3", // Use xAI's chat model
       messages: conversationHistory,
       max_tokens: 1024
   });
   ```  
   - Reasoning model: In the `chatCompletion` section for reasoning model, change the model to one of xAI's reasoning models, such as `grok-3-mini`:  
   ```javascript
   const chatCompletion = await openai.chat.completions.create({
        model: "grok-3-mini",
        messages: conversationHistory,
        reasoning_effort: "low"
   });
   ``` 
> [!NOTE]  
> xAI's reasoning models currently are ``grok-4``, ``grok-3-mini``, and ``grok-3-mini-fast``. Check [xAI's reasoning guide](https://docs.x.ai/docs/guides/reasoning) for more info. 


4. **Save and Test**  
   Save the changes and test your server to ensure it functions correctly with xAI.  
---

## **Usage**

### **Chat API**

**Endpoint:**  
`POST http://localhost:5500/chat`

**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Body:**
```json
{
  "userMessage": "Hello, how are you?",
  "userId": "unique_user_id"
}
```

**Response:**
```json
{
  "botResponse": "I'm great! How can I assist you today?"
}
```

---

### **Reasoning API**

**Endpoint:**  
`POST http://localhost:5500/chat`

**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Body:**
```json
{
  "userMessage": "Reason what came first, the egg or the chicken?",
  "userId": "unique_user_id"
}
```

**Response:**
```json
{
  "botResponse": "The egg came first, but it wasn’t laid by a chicken. It was laid by a bird that was almost, but not quite, a chicken." // This a summary answer, reasoning answers are detailed and long
}
```

---

### **Image Generation API**

The `/chat` endpoint also supports image generation. To generate an image, include a command like **"Create an image of a sunset over mountains"** in the `userMessage`.

**Example Request:**
```json
{
  "userMessage": "Create an image of a futuristic city at night.",
  "userId": "unique_user_id"
}
```

**Response:**
```json
{
  "botResponse": "<img class=\"ai-image\" src=\"https://your_ftp_domain/unique_image_name.png\" alt=\"Generated Image\" />"
}
```

---

## **How to Integrate in Your Project**

1. **Include the API in Your Frontend**  
   Use `fetch` or any HTTP client (e.g., Axios) to send requests to the server.

   **Example (JavaScript):**
   ```javascript
   fetch('http://localhost:5500/chat', {
       method: 'POST',
       headers: {
           'Content-Type': 'application/json',
       },
       body: JSON.stringify({
           userMessage: "Help me write a function",
           userId: "1"
       }),
   })
   .then(response => response.json())
   .then(data => console.log(data.botResponse))
   .catch(error => console.error('Error:', error));
   ```

2. **Host the Server Online**  
   Use a VPS or cloud platform like AWS, Google Cloud, or Heroku to deploy your server and make it publicly accessible.

---

## **Environment Variables**

| Variable              | Description                                      | Example Value               | API Console |
|-----------------------|--------------------------------------------------|-----------------------------| -----------------------------|
| `XAI_API_KEY`         | API key for xAI            | `xai-abc123`                |    [console.x.ai](https://console.x.ai)
| `OPENAI_API_KEY`| API key for OpenAI                         | `sk-abc123`                | [platform.openai.com](https://platform.openai.com/)
| `HUGGING_FACE_API_KEY`| API key for Hugging Face                         | `hf_abc123`                | [huggingface.co](https://huggingface.co/)



---

## **License**

This project is licensed under the MIT License. Feel free to use, modify, and distribute it.

---

## **Support**

For issues or questions, join our [Discord Community](https://dsc.gg/devevil) or open an issue in this repository.
