# CacaoGrade AI UI

This is a front-end prototype for:
CacaoGrade AI: A Computer Vision-Based Web System for Cacao Bean Fermentation Stage Classification and Quality Assessment.

## Included
- Landing page
- Cacao-themed brown/cream/violet/gold design
- Fermentation stage cards
- Login and registration modal
- Cacao image upload/preview
- Animated demo analysis result
- Developers modal for 3 developers
- Responsive/mobile layout
- Local cacao images supplied in the conversation

## Run
Open `index.html` in a browser.

## Django integration
Move:
- index.html -> templates/
- style.css -> static/css/
- script.js -> static/js/
- images -> static/images/

Then change asset paths to Django `{% static %}` paths and connect the forms to Django views/URLs.
