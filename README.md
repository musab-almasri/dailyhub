# DailyHub — Android To-Do List, Notes & Personal Calendar

A self-contained HTML5/CSS3/JS mobile application pre-configured with **Capacitor** and **GitHub Actions** to automatically compile into an installable **Android APK**.

## Features Included
1. **To-Do List**: Add, edit, delete, complete, and filter tasks by status (`All`, `Pending`, `Completed`, `High Priority`) with due dates and priority badges.
2. **Notes Workspace**: Create, edit, delete, color-code, and instant-search rich text notes.
3. **Personal Calendar**: Navigate months, select any date, add custom color-coded events with times and descriptions, and view tasks due on that date.
4. **Offline Persistence & Backup**: Saves automatically to `localStorage` on your Android device and includes one-tap JSON backup export + Dark Mode.

---

## Method 1: Build the APK Automatically on GitHub (No Android Studio Needed)
1. Unzip this folder and upload all files (including the hidden `.github` folder) to a new **GitHub Repository**.
2. Go to the **Actions** tab in your GitHub repository.
3. The **Build Android APK** workflow will run automatically on push (or click **Run workflow**).
4. Once finished (~2 minutes), download **DailyHub-Android-APK** (`app-debug.apk`) from the **Artifacts** section at the bottom of the workflow summary page and install it on your Android phone.

---

## Method 2: Convert via Website / Cloud Builder (VoltBuilder / WebIntoApp)
- **WebIntoApp / HopWeb / AppsGeyser**: Upload the `www/` folder (or `www/index.html` zip) directly.
- **PhoneGap / VoltBuilder**: Upload the root project zip.

---

## Method 3: Build Locally with Android Studio
```bash
npm install
npx cap add android
npx cap sync android
npx cap open android
```
Then inside Android Studio, click **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
