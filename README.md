# Goodreads-ratings-on-overdrive

It's irritating when you have to open a new tab and search for ratings of books, while you are trying to find a new one to check out on Overdrive.
Using this extension you can see Goodreads ratings of books directly in Overdrive.

Chrome extension : _not yet published_

Firefox add-on : _not yet published_

Based off the extension `imdb-ratings-on-netflix`, available open source at [https://github.com/pawanmaurya/imdb-ratings-on-netflix](https://github.com/pawanmaurya/imdb-ratings-on-netflix).

## Limitations
### Review score cannot be found
The review score may not be found from Goodreads in the following scenario(s):

  - The Overdrive book title has additional words.
    - E.g. ["American Dirt (Oprah's Book Club)"](https://ncdl.overdrive.com/ncdl-sunnyvale/content/media/4727757) on Overdrive, but "American Dirt" on Goodreads.

### Showing the wrong review score
The wrong review score can be selected from Goodreads in the following scenario(s):

  - The Overdrive book has a subtitle that helps distinguish it from other books.
    - E.g. ["Charlie and the Chocolate Factory", subtitle "A Play"](https://goldcoast.overdrive.com/media/299552)
  on Overdrive, but "Charlie and the Chocolate Factory: A Play" on Goodreads.
