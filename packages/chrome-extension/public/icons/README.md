# Extension Icons

Place the following PNG icons in this directory:
- `icon16.png` - 16x16 pixels
- `icon48.png` - 48x48 pixels  
- `icon128.png` - 128x128 pixels

You can generate these from the SVG files using any image editor or online converter.

Quick generation with ImageMagick (if installed):
```bash
for size in 16 48 128; do
  convert -background none -size ${size}x${size} icon${size}.svg icon${size}.png
done
```

Or use an online tool like https://cloudconvert.com/svg-to-png
