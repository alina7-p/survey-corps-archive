# Survey Corps Archive

Attack on Titan fan website for the Web Technologies endterm project.
Group: SE-2540. Team: Assem Tugelbay, Zhansaya Boranbaikyzy, Alina Ibadulla.

The project continues our midterm website with the same topic. It now has seven pages.

## Pages

- `index.html` — home, walls and characters.
- `about.html` — story, military branches and commanders.
- `titans.html` — Titan table, search, filters, editing and image gallery.
- `episodes.html` — season cards and episode guides.
- `characters.html` — live character database loaded from a public API.
- `signin.html` — sign-in form and account panel.
- `join.html` — registration form and downloadable fan recruit card.

## Endterm features

- Required name, email, password, confirmation and message fields.
- Email check with RegEx, live error messages and a password strength meter.
- Case-insensitive live search combined with status category buttons.
- A table rendered from JavaScript data: add, view, edit and delete records.
  Records are saved in `localStorage` and a button restores the original nine.
- A styled confirmation dialog before deleting or restoring records.
- A Bootstrap gallery with a lightbox, Previous/Next buttons and keyboard arrows.
- jQuery `fadeIn()` and `fadeOut()` for the image viewer.
- Simpler shared CSS and responsive layouts for desktop, tablet and mobile.

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
- Seven questions on the home page (`#faq`).
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
Main files: `css/style.css` and `js/script.js`.

## Team responsibilities

The division of pages follows the midterm project:

- Assem Tugelbay — home page, shared header/footer and CSS.
- Zhansaya Boranbaikyzy — lore page, Titan table, search and gallery.
- Alina Ibadulla — episode page, registration form and responsive checks.

## Run and publish

Open `index.html` in a browser. No installation or build is needed.
Table changes, theme, sign-in and favourites are saved in this browser's `localStorage`.
The characters page needs an internet connection for the API. The forms have no backend;
passwords and messages are not sent or saved.

- Existing repository: https://github.com/asemtygelbaeva-byte/survey-corps-archive
- Website: https://asemtygelbaeva-byte.github.io/survey-corps-archive/

To publish this update, replace the files in the existing repository and keep
GitHub Pages enabled. These links are from the midterm project; this local
archive does not update the online version automatically.

## Credits

Images and references are listed in [ASSET_SOURCES.md](ASSET_SOURCES.md).
Character data comes from the [Jikan API](https://jikan.moe/) (unofficial MyAnimeList API).
Attack on Titan belongs to its original rights holders. This is an unofficial student project.
Bootstrap and jQuery use the MIT license; fonts include their OFL license files.
