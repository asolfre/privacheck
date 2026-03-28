# GitHub OAuth App Setup

## 1. Create a GitHub OAuth App

- Go to **Settings > Developer settings > OAuth Apps > New OAuth App**
- Direct link: `https://github.com/settings/applications/new`

## 2. Fill in the registration form

| Field | Value |
|-------|-------|
| **Application name** | `PrivaCheck` (or whatever you want) |
| **Homepage URL** | `http://localhost:3000` (for dev) |
| **Authorization callback URL** | `http://localhost:3000/api/auth/callback/github` |

The callback URL is critical -- NextAuth expects that exact path pattern.

## 3. Get your credentials

After creating the app:

- **Client ID** is shown immediately on the app page -- that's your `GITHUB_ID`
- Click **"Generate a new client secret"** -- that's your `GITHUB_SECRET` (copy it immediately, it's only shown once)

## 4. Create `.env.local`

```env
GITHUB_ID=your_client_id_here
GITHUB_SECRET=your_client_secret_here
NEXTAUTH_SECRET=any_random_string_here
NEXTAUTH_URL=http://localhost:3000
```

To generate `NEXTAUTH_SECRET`:

```bash
openssl rand -base64 32
```

## 5. Production deployment

When deploying to production, either create a **second OAuth App** or update the existing one with your production URLs:

| Field | Value |
|-------|-------|
| **Homepage URL** | `https://privacheck.yourdomain.com` |
| **Authorization callback URL** | `https://privacheck.yourdomain.com/api/auth/callback/github` |

Update the environment variables on your hosting platform (e.g., Vercel) accordingly.
