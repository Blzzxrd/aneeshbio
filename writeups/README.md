# Cybersecurity Writeups

Put `.docx` files in this folder.

When the site is hosted on GitHub Pages from a public repository, `writeups.html`
will automatically list and render the `.docx` files in this folder.

For local testing outside GitHub Pages, add file names to `manifest.json` like:

```json
[
  {
    "name": "example-writeup.docx",
    "path": "writeups/example-writeup.docx"
  }
]
```
