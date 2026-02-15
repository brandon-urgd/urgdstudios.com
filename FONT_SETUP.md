# Font and Asset Setup Instructions

## Status

✅ **Logo and Favicon**: Already copied from Broadcast repo
- `site/assets/logo.svg` — Copied
- `site/assets/favicon.svg` — Copied

⚠️ **Archivo Fonts**: Need WOFF2 conversion

## Required Font Files

The design system requires two Archivo font files in WOFF2 format:
- `Archivo-SemiBold.woff2` (weight: 600)
- `Archivo-Bold.woff2` (weight: 700)

## Option 1: Convert from Existing TTF Files

Source files exist in:
```
/Users/brandon/Documents/Projects/urgd/urgd_library/branding/fonts/Archivo/static/
- Archivo-SemiBold.ttf
- Archivo-Bold.ttf
```

Convert to WOFF2 using one of these methods:

### Method A: Google Fonts Webfonts Helper
1. Visit https://gwfh.mranftl.com/fonts/archivo
2. Select weights: 600 (SemiBold), 700 (Bold)
3. Download WOFF2 files
4. Place in `site/fonts/`

### Method B: Font Squirrel Webfont Generator
1. Visit https://www.fontsquirrel.com/tools/webfont-generator
2. Upload `Archivo-SemiBold.ttf` and `Archivo-Bold.ttf`
3. Select "Optimal" preset
4. Check "WOFF2" only
5. Download and extract
6. Rename and place in `site/fonts/`

### Method C: Command-line (if woff2 tools installed)
```bash
cd /Users/brandon/Documents/Projects/urgd/urgd_library/branding/fonts/Archivo/static/
woff2_compress Archivo-SemiBold.ttf
woff2_compress Archivo-Bold.ttf
cp Archivo-SemiBold.woff2 /Users/brandon/Documents/Projects/urgd/urgd_repositories/urgdstudios.com/site/fonts/
cp Archivo-Bold.woff2 /Users/brandon/Documents/Projects/urgd/urgd_repositories/urgdstudios.com/site/fonts/
```

## Option 2: Download from Google Fonts

Archivo is available on Google Fonts. You can download WOFF2 files directly:
1. Visit https://fonts.google.com/specimen/Archivo
2. Click "Download family"
3. Extract and convert to WOFF2 (if needed)
4. Place in `site/fonts/`

## Verification

After adding fonts, verify at these paths:
- `site/fonts/Archivo-SemiBold.woff2`
- `site/fonts/Archivo-Bold.woff2`

The stylesheet (`site/styles/global.css`) is already configured to reference these paths.
