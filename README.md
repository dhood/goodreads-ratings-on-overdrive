# Goodreads-ratings-on-overdrive

It's irritating when you have to open a new tab and search for ratings of books, while you are trying to find a new one to check out on Overdrive.
Using this extension you can see Goodreads ratings of books directly in Overdrive.

Chrome extension : _not yet published_

Firefox add-on : _not yet published_

Based off the extension `imdb-ratings-on-netflix`, available open source at [https://github.com/pawanmaurya/imdb-ratings-on-netflix](https://github.com/pawanmaurya/imdb-ratings-on-netflix).

## Limitations
### Review score cannot be found
If the review score cannot be found, '?' will be displayed instead.
The review score may not be found from Goodreads in the following scenario(s):

  - The Overdrive book title or author has additional words.
    - E.g. ["American Dirt (Oprah's Book Club)"](https://ncdl.overdrive.com/ncdl-sunnyvale/content/media/4727757) on Overdrive, but "American Dirt" on Goodreads.
    - E.g. "A Dance With Fate: A Warrior Bards Novel 2" as the title name on Overdrive but "A Dance with Fate (Warrior Bards, #2)" on Goodreads.
    - E.g. "Women Don't Owe You Pretty: The debut book from Florence Given" as the title name on Overdrive but simply "Women Don't Owe You Pretty" on Goodreads.
    - E.g. ["Switchers" by Dr. Dawn Graham](https://ncdl.overdrive.com/ncdl-sunnyvale/content/media/3728121?cid=1072642) on Overdrive, but by Dawn Graham on Goodreads.

### Showing the wrong review score
To help detecting when the incorrect review score has been retrieved, the number of votes contributing to the review score is displayed.
If a popular book has a low number of votes, you should be suspicious of the review score that was retrieved.

The wrong review score can be selected from Goodreads in the following scenario(s):

  - The Overdrive book has a subtitle that helps distinguish it from other books.
    - E.g. ["Charlie and the Chocolate Factory", subtitle "A Play"](https://goldcoast.overdrive.com/media/299552)
  on Overdrive, but "Charlie and the Chocolate Factory: A Play" on Goodreads.
  - The author's name as shown on Overdrive is more descriptive than that used by Goodreads.
    - E.g. "Trump Ph.D., Mary L." as the author on Overdrive but only "Mary L. Trump" on Goodreads, which causes a book summary to be retrieved instead.


## Developer notes
### CORS-anywhere
Because of a [limitation in the Goodreads API](https://www.goodreads.com/topic/show/17893514-cors-access-control-allow-origin),
the review requests are not sent directly to Goodreads, but instead via a third party server,
which is a private version of https://github.com/Rob--W/cors-anywhere.
If you are interested in forking this repo, you will have to do one of the following options to
use CORS-anywhere (which may not be necessary if you are making calls to APIs that support CORS).

#### Use server limited to 200 reviews per hour
The public, demo version of the CORS-anywhere server has a rate limit of 200 requests per hour.
When this limit is reached, additional review scores will not be displayed.
However, if that is enough for your application, you may get away with just using the server
provided by https://cors-anywhere.herokuapp.com/

Note that the rate limit is shared across all installations of the one extension.

#### Custom server with unlimited review rate
It is possible to get around the rate limit of the default server by hosting your own server.

  - Host your own server by clicking the "Deploy to Heroku" button on [this site](https://elements.heroku.com/buttons/asg017/cors-anywhere-observable).
  - Name your app `cors-anywhere-` followed by your name.
  When it asks for a whitelist, specify `chrome-extension://oeadohoganadfsdfadf` but replace the
  letters with your extension's ID.
  If you haven't deployed your extension yet, skip this step and come back to it after you have.
  - Modify `content.js` of the downloaded extension code to use your heroku app instead of the
default server (it is the top line of the file).
  Reload the browser extension to use the new code, if necessary.
  - If you skipped it before, go into the Heroku settings for the app and modify the whitelist
  variable to specify your chrome extension.

Now your custom extension will use your custom server, and there is no limit.

#### Request use of my server
I have my own custom server without a rate limit.
It has whitelists for my browser extensions only.
If you get stuck with the Heroku deployment, email me your extension's ID I can
consider adding it to my server's whitelist so you don't need your own (dmjhood@gmail.com).
