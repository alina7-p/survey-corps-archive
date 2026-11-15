# Final project - Survey Corps Archive (Attack on Titan fan website)

Student: Alina Ibadulla, Zhansaya Boranbaykyzy, Assem Tugelbay | SE-2540

Teacher: WEB Technologies 1 (Front End) | Gulfiya Usserbayeva

The project continues our midterm and endterm website with the same topic. It now has 7 pages.

## Pages

- `index.html` — home, walls and characters.
- `about.html` — story, military branches and commanders.
- `titans.html` — titan table, search, filters, editing and image gallery.
- `episodes.html` — season cards and episode guides.
- `characters.html` — live character database loaded from a public API.
- `signin.html` — sign-in form and account panel.
- `join.html` — registration form and downloadable fan recruit card.

### Light / dark theme
- The button in the header switches themes on every page.
- The choice is saved in `localStorage` (`sca-theme`) and applied before the page
  is drawn, so there is no flash after a reload.
- All colours are CSS variables in `css/style.css` (`:root` and `:root[data-theme="light"]`).

### Sign-in with localStorage
- `signin.html` validates display name (2–30 characters), email (RegEx) and password
  (8+ characters with a letter and a number).
- Only non-sensitive data is saved: display name, email and sign-in time (`sca-user`).
  The password is checked and discarded. There is no server, so this is a demo.
- The user stays signed in after a reload. The header shows the name and a Sign out button,
  the home page greets the user, the Enlist form is prefilled and Characters gets favourites.
- Sign out removes `sca-user`. Favourites are kept per email for the next sign-in.

### jQuery FAQ
- 7 questions on the home page (`#faq`).
- Each answer opens and closes with `.slideToggle()`; the + / − indicator and
  `aria-expanded` change with it.

### API integration
- `characters.html` and `js/characters.js` use `fetch()` to load JSON from the public
  [Jikan API v4](https://docs.api.jikan.moe/): `GET https://api.jikan.moe/v4/anime/16498/characters`
  (Attack on Titan on MyAnimeList). No API key is needed and the API supports browser (CORS) requests.
- The JSON is processed (names reordered, images and links checked, voice actors filtered)
  and drawn as cards.
- Interaction: search by character or voice actor, filter Main / Supporting / My favourites,
  sort by popularity or name, Show more, Random character, profile dialog and Refresh data.
- Error handling: timeout, network failure, rate limit (429), server errors, wrong data format
  and empty results each show a clear message and a Try again button.
  Failed requests are retried once. The last good response is saved in `localStorage`
  for 10 minutes and is also shown as a fallback, with a notice, if the API is down.
- If the API cannot be reached and nothing is saved yet, the error is shown together with a short
  built-in list of characters (`js/characters-fallback.js`, names and roles only). The request waits up to
  25 seconds because the Jikan character list can be slow.
- The API is called only from the visitor’s browser, so it works on GitHub Pages (HTTPS).

## Technologies

HTML5, CSS3, Bootstrap 5, JavaScript and jQuery 3.7.1.
Libraries, images and fonts are included locally. Only the Characters page needs the internet.


## Team responsibilities

- Assem Tugelbay — home page, shared header/footer and CSS.
- Zhansaya Boranbaikyzy — lore page, Titan table, search and gallery.
- Alina Ibadulla — episode page, registration form and responsive checks.

## Run and publish

Open `index.html` in a browser. No installation or build is needed.
Table changes, theme, sign-in and favourites are saved in this browser's `localStorage`.
The forms have no backend;
passwords and messages are not sent or saved.

- Existing repository: https://github.com/alina7-p/survey-corps-archive
- Website: https://alina7-p.github.io/survey-corps-archive/
