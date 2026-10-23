"""Set canonical and social-sharing URLs from configure-pages output."""

import html
import os
from pathlib import Path
import re


base_url = os.environ["PAGES_BASE_URL"].rstrip("/")
page = Path("dist/index.html")
markup = page.read_text()
markup = re.sub(r'^[ \t]*<(?:meta property="og:(?:url|image)"[^>]*|link rel="canonical"[^>]*)>\n?', "", markup, flags=re.MULTILINE)
tags = (
    f'  <link rel="canonical" href="{html.escape(base_url + "/", quote=True)}">\n'
    f'  <meta property="og:url" content="{html.escape(base_url + "/", quote=True)}">\n'
    f'  <meta property="og:image" content="{html.escape(base_url + "/assets/posters/teaser.webp", quote=True)}">\n'
)
page.write_text(markup.replace("</head>", tags + "</head>", 1))
