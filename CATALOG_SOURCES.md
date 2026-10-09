# Real starter-catalog sources

## Metadata and covers

Open Library distinguishes a literary work from a specific edition. The catalog records use real ISBN editions and store each work's **original publication year** in `publicationYear`, so it is not confused with the later paperback edition/reprint year. ISBN-specific cover references use Open Library's Covers API format `https://covers.openlibrary.org/b/isbn/{ISBN}-M.jpg?default=false` (`M` is medium size). If the service has no image, the site falls back to a neutral book icon. Each cover and edition link opens the associated Open Library record.

Official documentation: [Books API](https://openlibrary.org/dev/docs/api/books) · [Covers API](https://openlibrary.org/dev/docs/api/covers). ISBN edition lookup pattern: `https://openlibrary.org/isbn/{ISBN}.json`.

## Verified real titles

| Title | Author | ISBN-13 | `publicationYear` | Category | Open Library edition | Independent publication source |
|---|---|---:|---:|---|---|---|
| *Pride and Prejudice* | Jane Austen | 9780141439518 | 1813 | Classic fiction · Romance | [OL3700132M](https://openlibrary.org/books/OL3700132M/Pride_and_Prejudice) | [Jane Austen's House — first edition](https://janeaustens.house/object/pride-and-prejudice-first-edition/) |
| *Frankenstein* | Mary Shelley | 9780141439471 | 1818 | Gothic fiction · Science fiction | [OL3701481M](https://openlibrary.org/books/OL3701481M) | [University of Sydney Library](https://www.library.sydney.edu.au/about/news/frankenstein) |
| *The Adventures of Sherlock Holmes* | Arthur Conan Doyle | 9780141034355 | 1892 | Classic fiction · Mystery | [OL28439082M](https://openlibrary.org/books/OL28439082M/Adventures_of_Sherlock_Holmes) | [History.com — original publication](https://www.history.com/this-day-in-history/october-14/the-adventures-of-sherlock-holmes-published) |
| *Dracula* | Bram Stoker | 9780141439846 | 1897 | Gothic fiction · Horror | [OL10416488M](https://openlibrary.org/books/OL10416488M/Dracula) | [British Library](https://www.britishlibrary.cn/en/works/dracula/) |
| *The Great Gatsby* | F. Scott Fitzgerald | 9780743273565 | 1925 | Classic fiction · Literary | [ISBN edition record](https://openlibrary.org/isbn/9780743273565.json) | [Sotheby's — first-edition guide](https://www.sothebys.com/en/articles/a-guide-to-identifying-the-great-gatsby-first-editions) |
| *The Hobbit* | J. R. R. Tolkien | 9780547928227 | 1937 | Fantasy | [OL33891995M](https://openlibrary.org/books/OL33891995M/The_Hobbit) | [Tolkien Estate — The Hobbit](https://www.tolkienestate.com/works/the-hobbit/) |

Open Library ISBN records match these ISBNs to English-language editions of the listed works and authors. The Covers API currently returns visible images for five ISBNs; `9780141034355` (*The Adventures of Sherlock Holmes*) has no image at that ISBN and uses the neutral icon fallback. The edition printing dates differ from some `publicationYear` values above; the table consistently shows each work's original year: 1813, 1818, 1892, 1897, 1925 or 1937. The Great Gatsby ISBN resolves through the Open Library ISBN API; the edition page may require human verification.

## Inventory integrity

Bibliographic metadata does not establish physical holdings. Every starter record uses `quantity: 0` and `availableQuantity: 0` until library staff confirm actual copies. A title cannot be issued until its physical stock count is recorded. The catalog seed is limited to a genuinely empty database and can be disabled with `SEED_STARTER_CATALOG=false`.
