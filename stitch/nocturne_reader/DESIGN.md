# Design System Strategy: The Digital Curator

This design system is crafted to transform the act of digital reading into a high-end editorial experience. Moving away from the cluttered, "utility-first" layouts of traditional reading apps, this system treats every light novel as a piece of fine art. Our goal is to create a "Digital Curator" persona—a sophisticated, quiet interface that recedes to let the cover art and the prose breathe.

By leveraging intentional asymmetry, tonal depth, and a rejection of traditional structural lines, we create an environment that feels more like a boutique gallery than a mobile application.

---

### 1. Overview & Creative North Star
**Creative North Star: The Literary Atelier**
The design system is built on the philosophy of the "Atelier"—a private workshop where art is central. We break the "template" look by using exaggerated typographic scales and overlapping elements. Instead of fitting content into rigid boxes, we allow cover art to bleed into backgrounds and typography to anchor the layout through scale rather than borders.

---

### 2. Colors & Tonal Depth
Our palette is rooted in the deep, nocturnal sophistication of midnight blues (`primary`: #171c3c) and soft, dawn-inspired accents (`secondary_fixed`: #dee1ff).

*   **The "No-Line" Rule:** To maintain a premium editorial feel, 1px solid borders are strictly prohibited for sectioning. Boundaries must be defined through background shifts. For example, a `surface_container_low` section should sit against a `surface` background to create a "zone" without a hard edge.
*   **Surface Hierarchy & Nesting:** Treat the UI as physical layers of fine paper. 
    *   Use `surface` for the base canvas.
    *   Use `surface_container_low` for secondary content areas.
    *   Use `surface_container_highest` for interactive elements that need to feel "closer" to the user.
*   **The "Glass & Gradient" Rule:** To move beyond a flat UI, use Glassmorphism for floating navigation bars or overlays. Utilize `surface` colors at 70% opacity with a 20px backdrop-blur. 
*   **Signature Textures:** For Hero sections or primary Call-to-Actions, use a subtle linear gradient transitioning from `primary` (#171c3c) to `primary_container` (#2d3252) at a 135-degree angle. This provides a "velvet" texture that flat hex codes cannot replicate.

---

### 3. Typography: The Editorial Voice
We use a high-contrast pairing to establish a hierarchy of "The Story" vs. "The Interface."

*   **The Story (notoSerif):** Used for `display` and `headline` roles. This serif typeface evokes the feeling of a physical book. Use `display-lg` for book titles in the library to create an authoritative, premium presence.
*   **The Interface (manrope):** Used for `title`, `body`, and `label` roles. This clean sans-serif ensures maximum readability for UI metadata, chapter lists, and settings.
*   **Hierarchy Note:** Use `on_surface_variant` for metadata (author names, word counts) to create a visual "recede" effect, allowing the `headline-md` book titles to remain the focal point.

---

### 4. Elevation & Depth
In this design system, depth is a matter of light and shadow, not lines and boxes.

*   **The Layering Principle:** Stacking surface tiers is the primary method of organization. A `surface_container_lowest` card placed on a `surface_container_high` background creates a natural, soft lift.
*   **Ambient Shadows:** When an element must float (e.g., a "Continue Reading" FAB), use an extra-diffused shadow. 
    *   *Shadow Property:* `0px 12px 32px rgba(27, 27, 30, 0.08)`
    *   Avoid pure black shadows; always use a low-opacity version of `on_surface` to mimic natural ambient occlusion.
*   **The "Ghost Border" Fallback:** If a container requires a boundary for accessibility, use the `outline_variant` token at 15% opacity. It should be felt, not seen.
*   **Glassmorphism:** For immersive reading settings, use semi-transparent `surface_container_highest` with a blur effect to let the cover art "glow" through the UI controls.

---

### 5. Components

#### Buttons
*   **Primary:** High-pill shape (`rounded-full`). Background uses the `primary` to `primary_container` gradient. Typography is `label-md` in `on_primary`.
*   **Secondary:** No background. Use a `ghost-border` and `primary` text.
*   **Tertiary:** Text-only using `secondary`. Reserved for low-emphasis actions like "View All."

#### Cards & Lists
*   **Cover Art Cards:** Use `xl` (1.5rem) corner radius. Forbid the use of divider lines between list items. Use 16dp of vertical white space from the spacing scale to separate chapters.
*   **The Overlap:** In the book detail view, the cover art should overlap the transition from `surface` to `surface_container`.

#### Chips
*   **Filter Chips:** Use `secondary_container` with `on_secondary_container` text. Use `md` (0.75rem) rounding to distinguish them from the fully rounded buttons.

#### Reading Progress
*   **The Fluid Bar:** Progress bars should use `tertiary_fixed` for the track and `tertiary` for the indicator. Avoid hard caps; use `rounded-full` for the progress indicator.

---

### 6. Do’s and Don’ts

**Do:**
*   **Do** use asymmetrical margins (e.g., a wider left margin for titles) to create an editorial, magazine-like feel.
*   **Do** use `notoSerif` for any text that is part of the "story" world, and `manrope` for anything "system" related.
*   **Do** prioritize the cover art’s aspect ratio. Never crop or stretch; allow the UI to wrap around the art.

**Don’t:**
*   **Don’t** use 100% opaque black for text. Use `on_surface` (#1b1b1e) to maintain a soft, premium contrast.
*   **Don’t** use standard Material Design shadows. They are too aggressive for this system’s "soft luxury" aesthetic.
*   **Don’t** use dividers or lines to separate content. If you feel the need for a line, increase the whitespace or shift the `surface-container` tier instead.
*   **Don’t** use sharp corners. This design system relies on the `lg` (1rem) and `xl` (1.5rem) tokens to feel approachable and high-end.