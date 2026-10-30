# Suffah Grammar School — GitHub Pages

A static website with no build step or external dependencies.

## Publish

Unzip and upload all contents to your GitHub repository root, preserving the assets folder. In Settings → Pages, deploy from your main branch and / (root). All asset references are relative.

## Edit

- index.html: page content and contact links.
- styles.css: responsive white, navy and blue design.
- script.js: mobile menu and footer year.
- assets/: compressed WebP logo and photographs.

## Photographs and speed

The four selected original photos are DSC04217.JPG (classroom teaching), IMG_0239.jpeg (digital learning), IMG_0197.jpeg (written work) and DSC04195.JPG (attentive classroom learning). The originals remain unchanged. The website uses WebP variants at 480, 800 and 1200 pixels wide, with responsive srcset and sizes attributes, lazy loading and asynchronous decoding. The logo is a small lossless WebP. Metadata is omitted from web exports.

Only selected images and size variants are included. The Google Maps iframe loads lazily; its network traffic is separate from the site image sizes.

Facebook: https://www.facebook.com/731927980005603
Instagram: https://www.instagram.com/suffahgrammar
Phone: +92 339 887 7886
Email: contact@suffahgrammar.com
Google Maps: https://maps.app.goo.gl/nrNajizDr9tdLnMu7

The embedded map matches the school listing at 30.2402944, 66.9877105.

The visual direction takes inspiration from Oak National Academy’s Who We Are page. Illustrations and implementation are original; copy is specific to Suffah. Cambridge pathway describes progression towards O Levels and IGCSEs, not accreditation.


## Enquiries and retained pages

The homepage links to apply.html, contact.html and blog.html. All share styles.css, script.js, the school crest and favicon assets. contact.html uses contact.js to open an email draft; it does not claim server-side delivery. Admissions retain the existing Formspree endpoint. Email delivery and the Formspree account must be checked by the school. No WhatsApp service is advertised on the main school pages until account access is confirmed. Admissions use relative start-term choices to avoid expired dates.

## School journal

- `blog.html`, `blog.css`, `blog.js`: responsive journal, search/type filters, date sorting, load-more and full-page article reader. Article links use `blog.html?post=<stable-file-id>`. Legacy title hashes still open matching stories.
- `news-core.js`: shared content parser, safe Markdown renderer and display helpers. Raw HTML in Markdown is displayed as text. Headings, emphasis, links, images, lists, blockquotes and fenced code are supported.
- The page embeds the existing published content, so visitors see stories immediately without waiting for GitHub. It checks the repository tree in the background, reuses unchanged content and loads new/edited Markdown from this website, with timeouts and a retry option. If refresh fails, the embedded stories remain readable.
- Keep using the existing editor collections: `_posts`, `_announcements`, `_galleries`, `_newsletters`. Real YAML lists, image captions and newsletter sections are supported. The existing editor authentication is unchanged. Drafts, future-dated posts and galleries without photos are excluded from the journal. Notices older than 90 days are clearly archived.
- After editing content, run `node scripts/build-news-snapshot.cjs` from the repository and commit `blog.html` alongside the Markdown files to refresh the embedded fallback and no-JavaScript view. New posts still appear through the background refresh without running this command. When removing a published post, rebuild the snapshot too so it is also removed from the offline fallback.
- Vendored dependency: js-yaml 4.1.1 (MIT), from https://github.com/nodeca/js-yaml/tree/4.1.1; license in `vendor/js-yaml.LICENSE.txt`. There are no CDN font or script requests on the journal.
