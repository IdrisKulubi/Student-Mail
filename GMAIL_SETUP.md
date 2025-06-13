# Gmail Integration Setup Guide

This guide will help you configure Gmail API access for your StudentHub app to fetch emails from users' Gmail accounts.

## Prerequisites

- Google Cloud Console account
- Supabase project with Google OAuth configured
- Expo development environment

## Step 1: Google Cloud Console Setup

### 1.1 Create/Configure Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Gmail API:
   - Go to "APIs & Services" > "Library"
   - Search for "Gmail API"
   - Click "Enable"

### 1.2 Configure OAuth Consent Screen

1. Go to "APIs & Services" > "OAuth consent screen"
2. Choose "External" user type (unless you have Google Workspace)
3. Fill in the required information:
   - App name: "StudentHub" (or your app name)
   - User support email: Your email
   - Developer contact information: Your email
4. Add scopes:
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.modify`
   - `openid`
   - `email`
   - `profile`
5. Add test users (during development)

### 1.3 Create OAuth 2.0 Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Add authorized redirect URIs:
   - `https://your-project-ref.supabase.co/auth/v1/callback`
   - Replace `your-project-ref` with your actual Supabase project reference
5. Note down the Client ID and Client Secret

## Step 2: Supabase Configuration

### 2.1 Configure Google OAuth Provider

1. Go to your Supabase Dashboard
2. Navigate to "Authentication" > "Providers"
3. Enable Google provider
4. Add your Google OAuth credentials:
   - Client ID: From Google Cloud Console
   - Client Secret: From Google Cloud Console
5. Add the required scopes in the "Additional Scopes" field:
   ```
   https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.modify
   ```

### 2.2 Update Environment Variables

Create a `.env` file in your project root (if it doesn't exist) and add:

```env
# Supabase Configuration (you should already have these)
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Google OAuth Configuration (add these new ones)
EXPO_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
EXPO_PUBLIC_GOOGLE_CLIENT_SECRET=your-google-client-secret
```

**Important:** 
- Replace `your-project-ref` with your actual Supabase project reference
- Replace the Google credentials with your actual values from Google Cloud Console
- Add `.env` to your `.gitignore` file to keep credentials secure

## Step 3: Test the Integration

### 3.1 Test OAuth Flow

1. Start your Expo development server:
   ```bash
   npm start
   ```

2. Sign in with Google - you should see permission requests for Gmail access

3. Check the browser console for any OAuth-related errors

### 3.2 Test Gmail Sync

1. In the app, go to the Emails tab
2. Tap the "Sync Gmail" button
3. Check the console logs for sync progress
4. Verify that school-relevant emails appear in the list

## Step 4: Production Deployment

### 4.1 Update OAuth Consent Screen

1. In Google Cloud Console, update your OAuth consent screen
2. Change from "Testing" to "In production" status
3. Submit for verification if required (for apps with sensitive scopes)

### 4.2 Update Redirect URIs

1. Add your production Supabase URL to authorized redirect URIs
2. Update environment variables for production

## Troubleshooting

### Common Issues

1. **"Access blocked" error**
   - Ensure OAuth consent screen is properly configured
   - Add test users during development
   - Check that all required scopes are added

2. **"Invalid redirect URI" error**
   - Verify redirect URI in Google Cloud Console matches Supabase callback URL
   - Check for typos in the URL

3. **"Insufficient permissions" error**
   - Ensure Gmail API is enabled in Google Cloud Console
   - Verify scopes are correctly configured in Supabase

4. **No emails syncing**
   - Check console logs for API errors
   - Verify user has granted Gmail permissions
   - Ensure emails meet the "school-relevant" criteria

### Debug Steps

1. Check browser developer tools for OAuth errors
2. Review Expo/React Native logs for API errors
3. Test Gmail API access directly in Google Cloud Console
4. Verify Supabase Auth logs for OAuth issues

## Security Considerations

1. **Environment Variables**: Never commit `.env` files to version control
2. **Scopes**: Only request necessary Gmail permissions
3. **Data Storage**: Store minimal email data, respect user privacy
4. **Token Management**: Tokens are handled automatically by Supabase Auth

## Email Filtering Logic

The app automatically filters emails to show only school-relevant content based on:

- **Sender domains**: `.edu`, `university`, `college`, `school`
- **Keywords**: Academic terms, course-related words, financial aid, etc.
- **Categories**: Automatically categorizes into Events, Jobs, Finance, Class, Other

You can customize the filtering logic in `lib/gmailService.ts` in the `isSchoolRelevant()` and `categorizeEmail()` methods.

## Next Steps

After successful setup:

1. Test with multiple user accounts
2. Monitor API usage in Google Cloud Console
3. Consider implementing email caching strategies
4. Add AI-powered email summarization
5. Implement push notifications for important emails

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review Google Cloud Console and Supabase logs
3. Ensure all environment variables are correctly set
4. Test OAuth flow in isolation 