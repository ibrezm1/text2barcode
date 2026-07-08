# Barcode & QR Studio (SPA)

A highly polished, client-side Single Page Application (SPA) that lets you convert plain text, URLs, Wi-Fi networks, emails, and SMS details into barcodes and 2D QR codes. Designed with glassmorphic aesthetics and interactive custom configurations.

## Features
- **Two Generation Modes**: Dynamic switching between **2D QR Codes** and standard **1D Barcodes**.
- **Dynamic Helper Templates**: Instantly format input values for:
  - Plain Text / General Code Values
  - URLs
  - Wi-Fi Networks (WPA/WEP/Open, auto-generated formatting)
  - Pre-filled Email templates
  - Pre-filled SMS messages
- **Customizations**: Fully customizable foreground and background colors, QR sizes, correction levels, and barcode formats (EAN-13, CODE-128, UPC, etc.).
- **Live Preview & Indicators**: Instantly updates the preview as you type.
- **Export Options**: Download high-resolution PNG, print, or copy the values.
- **Local History Tracker**: Browse, restore, or clear your history of recently generated barcodes directly from `localStorage`.
- **Zero Backend**: Secure, private, runs 100% client-side. No trackers, no cookies.

---

## How to Run Locally

Since this is a quick, client-side SPA, there is no build process required. You can choose one of the following methods to view it locally:

1. **Option A (Simplest)**: Just open the `index.html` file directly in any modern web browser.
2. **Option B (Using static server)**: Run a local static server to serve the files, e.g.:
   ```bash
   npx http-server .
   # or
   python3 -m http.server
   ```
   Open the address printed in the terminal (usually `http://localhost:8080`).

---

## Deploy to GitHub Pages (github.io)

Since the app consists of pure HTML, CSS, and JS, hosting it on GitHub Pages is incredibly simple and completely free. Follow these steps:

1. **Create a GitHub repository** named `text2barcode` (or any other name).
2. **Initialize Git & Push** your files (replace the URL with your own repo):
   ```bash
   git init
   git add .
   git commit -m "Initial commit of Barcode Generator SPA"
   git branch -M main
   git remote add origin https://github.com/ibrezm1/text2barcode.git
   git push -u origin main
   ```
3. **Enable GitHub Pages**:
   - Go to your repository settings page on GitHub.
   - In the left sidebar, click **Pages** (under the "Code and automation" section).
   - Under **Build and deployment**, change the Source dropdown to **Deploy from a branch**.
   - Under **Branch**, select **main** (and `/root` as folder), then click **Save**.
4. **Access your site**: Your app will be live at `https://ibrezm1.github.io/text2barcode/` within a couple of minutes!
