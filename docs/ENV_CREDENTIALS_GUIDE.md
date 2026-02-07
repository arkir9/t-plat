# How to Get Each .env Variable

Step-by-step instructions to obtain every placeholder in `backend/.env`.

---

## Already set (no action needed)

- **Server**: `NODE_ENV`, `PORT`, `API_PREFIX`, `API_URL` — fine for local dev.
- **Database**: Update `DB_PASSWORD` only if your PostgreSQL user uses a different password. Create DB: `createdb t_plat`.

**Verify database connection:** After starting the backend, open `http://localhost:3000/api/health`. If the response includes `"database": { "status": "up" }`, the app is connected and data (e.g. registration, login) is stored in PostgreSQL. Registration and login data are persisted in the `users` and `refresh_tokens` tables.
- **JWT**: Your file already has JWT secrets; keep them. For production, generate new ones (see below).
- **M-Pesa**: Your file has sandbox-style values. If they work with Safaricom Daraja sandbox, keep them. Otherwise get your own (see below).
- **App / Security**: `FRONTEND_URL`, `CORS_ORIGIN`, `REDIS_URL` — adjust if your ports or Redis URL differ.

---

## 1. Stripe (card payments)

**URL:** https://dashboard.stripe.com/

1. Sign up or log in.
2. **Secret key & public key**
   - Go to **Developers → API keys**.
   - Copy **Publishable key** → `STRIPE_PUBLIC_KEY` (starts with `pk_test_` or `pk_live_`).
   - Copy **Secret key** → `STRIPE_SECRET_KEY` (starts with `sk_test_` or `sk_live_`).
   - Use **Test mode** (toggle top-right) for development.
3. **Webhook secret** (for payment confirmations)
   - Go to **Developers → Webhooks**.
   - **Add endpoint**: URL = `https://your-domain.com/api/payments/stripe/webhook` (for local dev you can use a tunnel like ngrok, or leave placeholder until you deploy).
   - Select events, e.g. `payment_intent.succeeded`, `payment_intent.payment_failed`.
   - After creating, open the webhook → **Reveal** signing secret → copy to `STRIPE_WEBHOOK_SECRET` (starts with `whsec_`).
   - For local only: you can leave `STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret_here` until you add a real webhook.

**In .env:**
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## 2. M-Pesa (Safaricom Daraja – Kenya)

**URL:** https://developer.safaricom.co.ke/

Your .env already has values that look like sandbox. If you need your own:

1. Register at the link above and create an app.
2. **Consumer key & secret**
   - In your app’s details you’ll see **Consumer Key** and **Consumer Secret**.
   - Put them in `MPESA_CONSUMER_KEY` and `MPESA_CONSUMER_SECRET`.
3. **Shortcode & passkey**
   - Sandbox: often **Shortcode** `174379` and a provided **Passkey** in the API docs.
   - Production: use your till/paybill shortcode and the passkey Safaricom gives you.
4. **Callback URL**
   - Must be a public HTTPS URL that Safaricom can call. For local dev use a tunnel (e.g. ngrok) and set `MPESA_CALLBACK_URL` to that URL + `/api/payments/mpesa/callback`.

**In .env (if replacing placeholders):**
```env
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_SHORTCODE=174379
MPESA_PASSKEY=your_passkey
MPESA_ENVIRONMENT=sandbox
MPESA_CALLBACK_URL=https://your-public-url/api/payments/mpesa/callback
```

---

## 3. Cloudinary (image storage)

**URL:** https://cloudinary.com/ (sign up free)

1. After login, open the **Dashboard**.
2. You’ll see:
   - **Cloud name** → `CLOUDINARY_CLOUD_NAME`
   - **API Key** → `CLOUDINARY_API_KEY`
   - **API Secret** → **Reveal** and copy → `CLOUDINARY_API_SECRET`

**In .env:**
```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=your_api_secret
```

---

## 4. SendGrid (email)

**URL:** https://signup.sendgrid.com/

1. Create an account and verify your email.
2. **API key**
   - **Settings → API Keys → Create API Key**.
   - Name it (e.g. “T-Plat”), choose **Restricted** or **Full**.
   - Copy the key once (it won’t show again) → `SMTP_PASSWORD`.
3. **Sender**
   - **Settings → Sender Authentication**: verify a domain or single sender.
   - Use that sender email for `EMAIL_FROM` (e.g. `noreply@yourdomain.com`).

**In .env:**
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=verified-sender@yourdomain.com
EMAIL_NAME=T-Plat
```

---

## 5. Firebase (push notifications)

**URL:** https://console.firebase.google.com/

1. Create a project (or use existing).
2. **Project ID**
   - Project settings (gear) → **General** → **Project ID** → `FIREBASE_PROJECT_ID`.
3. **Service account (for backend)**
   - **Project settings → Service accounts**.
   - **Generate new private key** → download JSON.
   - In the JSON:
     - `project_id` → `FIREBASE_PROJECT_ID`
     - `client_email` → `FIREBASE_CLIENT_EMAIL`
     - `private_key` → `FIREBASE_PRIVATE_KEY` (keep the full key including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`; in .env you can use `\n` for newlines inside double quotes).

**In .env:**
```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
```

---

## 6. Google Maps API

**URL:** https://console.cloud.google.com/

1. Create or select a project.
2. **Enable APIs**
   - **APIs & Services → Library** → enable **Maps SDK for Android**, **Maps SDK for iOS**, and **Geocoding API** (or others you use).
3. **Create key**
   - **APIs & Services → Credentials → Create credentials → API key**.
   - Restrict the key by API and (optional) by app/HTTP referrer to reduce abuse.
   - Copy the key → `GOOGLE_MAPS_API_KEY`.

**In .env:**
```env
GOOGLE_MAPS_API_KEY=AIzaSy...
```

---

## 7. Twilio (SMS – optional)

**URL:** https://www.twilio.com/try-twilio

1. Sign up; you get a trial account with credit.
2. **Account SID & Auth Token**
   - **Console (dashboard)** → **Account SID** and **Auth Token** (click to reveal).
   - → `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`.
3. **Phone number**
   - **Phone Numbers → Manage → Buy a number** (or use trial number).
   - Use that number for `TWILIO_PHONE_NUMBER` (e.g. `+1234567890`).

**In .env:**
```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

---

## 8. JWT secrets (if you want to regenerate)

Your .env already has JWT values. For a new environment or production, generate new secrets:

```bash
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('base64'))"
node -e "console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(32).toString('base64'))"
```

Put the printed values into `JWT_SECRET` and `JWT_REFRESH_SECRET`.

---

## Google & Apple Sign-In (backend)

For **Continue with Google / Apple** in the app, the backend needs:

- **`GOOGLE_CLIENT_ID`** – Same OAuth 2.0 Client ID the mobile app uses for Google Sign-In (Web client ID if using expo-auth-session, or the iOS/Android client ID that issues the id_token). Get it from [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials → your OAuth 2.0 Client ID.
- **`APPLE_CLIENT_ID`** (optional) – Your app’s **Services ID** or **Bundle ID** for Apple Sign-In. Used to validate the Apple identity token audience. From [Apple Developer](https://developer.apple.com) → Certificates, Identifiers & Profiles → Identifiers.

Add to `backend/.env`:

```env
GOOGLE_CLIENT_ID=your_google_oauth_client_id
APPLE_CLIENT_ID=com.yourapp.bundleid
```

---

### How to get Google Client ID

**URL:** https://console.cloud.google.com/

1. **Create or select a project**
   - Use the project dropdown at the top. Create a new project (e.g. “T-Plat”) or pick an existing one.

2. **Enable the Google+ API / People API (if required)**
   - Go to **APIs & Services → Library**.
   - Search for **Google+ API** or **Google People API** and enable it if you use profile data. For “Sign in with Google” (OpenID Connect) the **OAuth consent screen** is required; the People API is optional.

3. **Configure the OAuth consent screen**
   - Go to **APIs & Services → OAuth consent screen**.
   - Choose **External** (or Internal for a Google Workspace–only app).
   - Fill in **App name**, **User support email**, and **Developer contact email**. Save.

4. **Create OAuth 2.0 credentials**
   - Go to **APIs & Services → Credentials**.
   - Click **Create credentials → OAuth client ID**.
   - If asked, set **Application type**:
     - For the **backend** (NestJS verifying the token): you can use the same **Web application** client.
     - For the **Expo app** (expo-auth-session): you need a **Web application** client (Expo uses a redirect flow that returns an authorization code; the backend or token endpoint uses the client secret if you exchange the code server-side, but in your flow the app exchanges the code and gets the **id_token**).
   - **Web application**
     - Name it (e.g. “T-Plat Web”).
     - Under **Authorized redirect URIs** add:
       - For Expo: e.g. `https://auth.expo.io/@your-expo-username/your-app-slug` or the custom scheme your app uses (Expo will show the redirect URI in the dev client; you can also use `exp://...` for development). Run the app once and check the redirect URI printed in the terminal, or use `expo-auth-session`’s `makeRedirectUri()` and add that value here.
     - Click **Create**. Copy the **Client ID** (long string ending in `.apps.googleusercontent.com`).
   - Use this **Client ID** for:
     - **Backend** `GOOGLE_CLIENT_ID` in `backend/.env`.
     - **Mobile** `EXPO_PUBLIC_GOOGLE_CLIENT_ID` in the Expo app (same value).

5. **Optional: separate iOS/Android clients**
   - You can create **iOS** or **Android** OAuth clients and use their Client IDs for native SDKs. For **expo-auth-session** with a Web client and redirect flow, the **Web application** Client ID above is what you use in the app and backend.

**In backend `.env` and mobile env:**

```env
GOOGLE_CLIENT_ID=123456789-xxxx.apps.googleusercontent.com
```

In the mobile app (e.g. `mobile/.env` or `app.config.js`):

```env
EXPO_PUBLIC_GOOGLE_CLIENT_ID=123456789-xxxx.apps.googleusercontent.com
```

(Same value as backend.)

---

### How to get Apple Client ID (Sign in with Apple)

**URL:** https://developer.apple.com/account/

1. **Enroll in Apple Developer Program** (required for Sign in with Apple in production)
   - Go to [Apple Developer](https://developer.apple.com) and sign in. You need a paid membership ($99/year) to create App IDs and Services IDs.

2. **Create an App ID** (for your iOS app)
   - Go to **Certificates, Identifiers & Profiles → Identifiers**.
   - Click **+** and choose **App IDs**.
   - Select **App**, click Continue. Choose **App** again.
   - Description: e.g. “T-Plat”. Bundle ID: **Explicit**, e.g. `com.yourcompany.tplat`.
   - Under **Capabilities**, enable **Sign in with Apple**. Click Continue, then Register.

3. **Create a Services ID** (used as Apple Client ID for token validation)
   - In **Identifiers**, click **+** and choose **Services IDs**.
   - Description: e.g. “T-Plat Sign in with Apple”. Identifier: e.g. `com.yourcompany.tplat.signin` (this will be your **Apple Client ID**).
   - Check **Sign in with Apple**, click **Configure**.
   - **Primary App ID**: select the App ID you created (e.g. `com.yourcompany.tplat`).
   - **Domains and Subdomains**: your backend domain (e.g. `api.yourapp.com`). For local dev you can leave blank or use a tunnel hostname.
   - **Return URLs**: e.g. `https://api.yourapp.com/auth/apple/callback` (or your backend callback URL if you use one). For the Expo app flow where the app gets the identity token directly, you may not need a web callback; Apple still often requires a Services ID for some configurations.
   - Save, then Register.

4. **Use the Services ID as `APPLE_CLIENT_ID`**
   - The **Identifier** you set for the Services ID (e.g. `com.yourcompany.tplat.signin`) is the value for **`APPLE_CLIENT_ID`** in your backend.
   - Alternatively, some backends validate the token’s audience against the app’s **Bundle ID** (the App ID). If your backend code expects the Bundle ID, use the App ID (e.g. `com.yourcompany.tplat`) as **`APPLE_CLIENT_ID`**. Check your backend’s Apple token verification: it usually accepts either the Services ID or the Bundle ID as the audience.

**In backend `.env`:**

```env
APPLE_CLIENT_ID=com.yourcompany.tplat.signin
```

(or your App Bundle ID if that’s what the backend validates against.)

5. **Enable Sign in with Apple in Xcode**
   - Open the iOS project (e.g. `ios/` in Expo or the native project). In **Signing & Capabilities**, add **Sign in with Apple**.

**Summary**

| What            | Where to get it |
|-----------------|-----------------|
| Google Client ID| Google Cloud Console → APIs & Services → Credentials → Create OAuth client ID (Web application). Use the same Client ID in backend and in `EXPO_PUBLIC_GOOGLE_CLIENT_ID`. |
| Apple Client ID | Apple Developer → Identifiers → Services ID (identifier) or App ID (bundle ID). Put in backend `APPLE_CLIENT_ID`. |

---

## Summary table

| Variable(s) | Where to get it |
|-------------|------------------|
| `DB_*` | Your local PostgreSQL (or host provider). |
| `JWT_*` | Already in .env; or generate with the commands above. |
| `STRIPE_*` | Stripe Dashboard → API keys + Webhooks. |
| `MPESA_*` | Safaricom Developer (Daraja); your .env may already have sandbox values. |
| `CLOUDINARY_*` | Cloudinary Dashboard. |
| `SMTP_PASSWORD`, `EMAIL_FROM` | SendGrid → API key + Sender authentication. |
| `FIREBASE_*` | Firebase Console → Project settings → Service account JSON. |
| `GOOGLE_MAPS_API_KEY` | Google Cloud Console → APIs & Credentials. |
| `GOOGLE_CLIENT_ID` | Google Cloud Console → Credentials → OAuth 2.0 Client ID (Web application). Same value as `EXPO_PUBLIC_GOOGLE_CLIENT_ID` in mobile. |
| `APPLE_CLIENT_ID` | Apple Developer → Identifiers → Services ID or App ID (Bundle ID). |
| `TWILIO_*` | Twilio Console (optional). |

After you obtain each value, paste it into `backend/.env` in place of the corresponding placeholder. Do not commit `.env` to git.
