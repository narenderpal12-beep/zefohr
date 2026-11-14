---
name: Brand image input
description: User requirement for the brand logo editing experience
---
Brand logo editing must use device image browsing and a visible image preview, not a logo URL input.

**Why:** The user explicitly corrected the URL-based option and requested browsing and previewing an image.

**How to apply:** Keep the brand identity editor upload-first; preserve the text-logo choice and do not reintroduce a logo URL field.

Brand logo browsing must also accept SVG files. Convert uploaded SVGs to a raster image before saving rather than persisting active SVG markup.

**Why:** The user requested SVG uploads; flattening preserves compatibility with existing image validation and avoids serving uploaded SVG code.

**How to apply:** Keep SVG input support scoped to brand uploads unless another uploader is explicitly requested.
