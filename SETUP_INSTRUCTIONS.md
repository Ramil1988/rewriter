# Setup Instructions for OpenAI Integration

## Problem Fixed
The CORS error you were experiencing was caused by trying to call the OpenAI API directly from the browser. This is blocked by OpenAI's CORS policy and would also expose your API key to the public.

## Solution
We've implemented a serverless backend using Netlify Functions that:
- Keeps your API key secure on the server-side
- Avoids CORS issues
- Works seamlessly with your Netlify deployment

## Setup Steps

### 1. Set Environment Variable on Netlify

Go to your Netlify dashboard:
1. Navigate to **Site settings** > **Environment variables**
2. Add a new environment variable:
   - **Key**: `OPENAI_API_KEY`
   - **Value**: Your OpenAI API key (get it from https://platform.openai.com/api-keys)
3. Click **Save**

### 2. Deploy to Netlify

After setting the environment variable, deploy your site:

```bash
git add .
git commit -m "Add Netlify Functions for OpenAI API integration"
git push
```

Netlify will automatically:
- Build your React app
- Deploy the Netlify Function
- Make the function available at `/.netlify/functions/openai`

### 3. Local Development (Optional)

If you want to test locally:

1. Install Netlify CLI:
```bash
npm install -g netlify-cli
```

2. Create a `.env` file in the root directory:
```bash
OPENAI_API_KEY=your_openai_api_key_here
```

3. Run the development server:
```bash
netlify dev
```

This will:
- Start your React app
- Start the Netlify Functions locally
- Connect everything together

### 4. Remove Old Config File

You can now safely delete the `config.local.js` file since the API key is stored securely as an environment variable:

```bash
git rm src/config.local.js
```

## What Changed

### Files Created:
- `netlify/functions/openai.js` - Serverless function that proxies requests to OpenAI API
- `.env.example` - Example environment variables file
- `SETUP_INSTRUCTIONS.md` - This file

### Files Modified:
- `src/App.js` - Updated to call Netlify Function instead of OpenAI API directly
- `netlify.toml` - Added functions configuration and fixed base directory
- `package.json` - Added node-fetch dependency

## How It Works

1. User interacts with the frontend (React app)
2. Frontend calls `/.netlify/functions/openai` with the prompt
3. Netlify Function receives the request
4. Function calls OpenAI API with your secure API key
5. Function returns the response to the frontend
6. Frontend displays the result to the user

## Security Notes

- Your API key is never exposed to the browser
- The API key is stored securely in Netlify's environment variables
- All requests go through your backend function
- CORS issues are completely avoided

## Troubleshooting

If you encounter issues:

1. Check that `OPENAI_API_KEY` is set in Netlify environment variables
2. Verify the function deployed successfully in Netlify's Functions tab
3. Check the Netlify Function logs for errors
4. Make sure you've deployed after setting the environment variable
