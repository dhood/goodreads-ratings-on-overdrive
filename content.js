// Modify this URL if to your own CORS-anywhere server.
// See the README for details on why that is necessary.
CORS_ANYWHERE_SERVER_URL = "https://cors-anywhere-goodreads.herokuapp.com/"

// This function looks at the html of the page and extracts a list of the book infos on the page.
// It returns a NodeList of divs that contain info of individual books.
// Modify this function to work for the website on which you want to display book scores.
function getNodeListOfTitleInfos() {
    return document.querySelectorAll('.TitleInfo')
}

// This function looks at the html of a single title and extracts the name and author from its div.
// It returns the name and author strings in a list, or null if they couldn't be extracted.
// Modify this function to work for the website on which you want to display book scores.
function getTitleNameAndAuthor(titleInfoDiv) {
    var titleNameElem = titleInfoDiv.querySelector('.title-name')
    if (!titleNameElem) {
        return null
    }
    var titleName = titleNameElem.title

    var titleAuthorElem = titleInfoDiv.querySelector('.title-author a')
    if (!titleAuthorElem) {
        return null
    }
    var titleAuthor = titleAuthorElem.title
    return [titleName, titleAuthor]
}

// This function takes text summarising the review score and converts it to formatted html for
// display.
// If the title was found on Goodreads, the URL to its page can also be used.
// Modify this function to match the formatting of the website on which you want to display
// book scores.
function getFormattedReviewText(ratingText, goodreadsTitleUrl) {
    var goodreadsHtml = '<p class="title-author">' + ratingText + "</p>"

    if (goodreadsTitleUrl !== null) {
        goodreadsHtml = "<a class='secondary-hover-underline selected' " +
            "target='_blank' href='" + goodreadsTitleUrl + "'>" +
            goodreadsHtml + "</a>"
    }
    return goodreadsHtml
}

// This function attempts to create a unique ID for each item that may be on a page.
// It takes the info div of a single title and returns a string for its ID.
// There is sometimes a need to distinguish between items that share the same
// Goodreads review: ebooks and audiobooks of the same title, for example.
// This may be done by leveraging unique IDs used by the website itself, if available.
function getTitleUniqueId(titleInfoDiv) {
    var titleNameElem = titleInfoDiv.querySelector('.title-name')
    return titleNameElem.getAttribute('data-media-id');
}


// ------------------ The rest of the code should not need to be modified.

// How many review scores will be requested in parallel.
// This is limited to avoid resource limitations errors e.g. net::ERR_INSUFFICIENT_RESOURCES
MAX_PARALLEL_REQUESTS = 20
var numRequestsPending = 0

// String stored in local storage when an API request has been attemped for a title and is pending
// or has failed.
var REQUEST_ATTEMPTED_TOKEN = 'undefined'

function fetchBookInfo() {
    // Fetch the info panel for all books displayed on the current page.
    var bookList = getNodeListOfTitleInfos()
    if (bookList === null) {
        return;
    }

    // Iterate over all books on the page.
    for (let bookInfo of bookList) {

        returnValue = getTitleNameAndAuthor(bookInfo)
        if (!returnValue) {
            continue
        }
        [titleName, titleAuthor] = returnValue

        console.log("Retrieving storage for: " + titleName + " by " + titleAuthor);
        var existingGoodreadsRating = window.sessionStorage.getItem(
            getSessionStorageKey(titleName, titleAuthor));
        if ((existingGoodreadsRating !== REQUEST_ATTEMPTED_TOKEN) && (existingGoodreadsRating !== null)) {
            addGoodreadsRating(existingGoodreadsRating, bookInfo, titleName, titleAuthor);
        } else {
            makeRequestAndAddRating(bookInfo, titleName, titleAuthor)
        }
    }
};

function addGoodreadsRating(bookMetaData, bookInfo, titleName, titleAuthor) {
    console.log(titleName);
    console.log(titleAuthor);
    var divId = getDivId(bookInfo);

    // If we've already added the review score, don't do it again.
    var divEl = document.getElementById(divId);
    if (divEl && (divEl.offsetWidth || divEl.offsetHeight || divEl.getClientRects().length)) {
        return;
    }


    var ratingPresent = bookMetaData && (bookMetaData !== 'undefined') && (bookMetaData !== "N/A");
    var voteCount = null;
    var rating = null;
    var bookId = null;
    if (ratingPresent) {
        var metaDataArr = bookMetaData.split(":");
        rating = metaDataArr[0];
        voteCount = metaDataArr[1];
        bookId = metaDataArr[2];
    }
    var ratingText = rating + " stars (" + voteCount + " votes)"
    var goodreadsTitleUrl = null
    if (bookId !== null && bookId != "?") {
        goodreadsTitleUrl = "https://www.goodreads.com/book/show/" + bookId
    }

    var div = document.createElement('div')
    div.innerHTML = getFormattedReviewText(ratingText, goodreadsTitleUrl)
    div.className = 'goodreadsRating'
    div.id = divId
    bookInfo.append(div)
}

function getDivId(bookInfo) {
    return "goodreadsReview-" + getTitleUniqueId(bookInfo)
}

function getSessionStorageKey(name, author) {
  return name + ':' + author
}

function makeRequestAndAddRating(bookInfo, name, author) {

    if (numRequestsPending > MAX_PARALLEL_REQUESTS) {
        console.log("Too many requests pending already... not sending request in order to avoid net::ERR_INSUFFICIENT_RESOURCES")
        return
    }
    console.log("Making request for: " + name + " by " + author);
    // Note(dhood): cors-anywhere is used because Goodreads API doesn't support CORS header itself.
    // See: https://www.goodreads.com/topic/show/17893514-cors-access-control-allow-origin
    // cors-anywhere: https://github.com/Rob--W/cors-anywhere
    // The demo server of cors-anywhere is rate limited to 200 requests per hour, so a custom
    // server is hosted just for this extension.
    var url = CORS_ANYWHERE_SERVER_URL +
      "https://www.goodreads.com/search/index.xml?key=<API_KEY>&format=xml" +
      "&q=" + encodeURI(name) + "+" + encodeURI(author);

    var xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.withCredentials = false;
    xhr.setRequestHeader('Content-Type', 'application/xml');
    xhr.onload = function () {
        if (xhr.status === 200) {
            var apiResponse = parseXml(xhr.responseText);
            console.log(apiResponse);
            bookData = selectTopQueryMatch(apiResponse);
            window.sessionStorage.setItem(getSessionStorageKey(name, author), bookData);
            addGoodreadsRating(bookData, bookInfo, name, author);
            numRequestsPending--
        }
    };
    console.log("Sending request");
    numRequestsPending++
    // Put a temporary value in storage so additional requests are not performed while waiting for
    // a response from the first.
    window.sessionStorage.setItem(
        getSessionStorageKey(name, author), REQUEST_ATTEMPTED_TOKEN)
    xhr.send();
}

function selectTopQueryMatch(apiResponse) {
  // The API response gives multiple books (potentially).
  // We include the author name in the search query to bring the appropriate book to the top.
  // However, it prioritises book titles with the author's name in the title.
  // If we were to choose the top search result, study guides and summaries would get chosen
  // over the actual book written by the author.
  // See, for example: https://www.goodreads.com/search?q=The+Dutch+House+ann+patchett&search_type=books
  // This function tries to select the actual book.

  var goodreadsMetaData = "?:?:?";

  searchResults = apiResponse.querySelectorAll('search results work');
  if (!searchResults) {
      return goodreadsMetaData;
  }

  // Find the search result with the highest review count, as it's most likely to be the book we
  // were actually searching for.
  // Potential risk with this approach: may select the wrong book of a book series, for example,
  // if it is in the search results and has more reviews than the book searched for.

  // Alternative approach considered: search through the results in the ranking from Goodreads,
  // until one is found with the same author name.
  // That approach, however, relies on Goodreads and Overdrive using the same author name, however.
  // As a (true) example: "Richard R. George" on Goodreads is "Richard George" on Overdrive.
  var highestVoteCount = -1;
  for (let searchResult of searchResults) {
      var searchResultVoteCount = searchResult.querySelector("ratings_count").textContent;
      if (parseInt(searchResultVoteCount) > highestVoteCount) {
          var searchResultName = searchResult.querySelector("author name").textContent;
          var searchResultId = searchResult.querySelector("best_book id").textContent;
          var searchResultRating = searchResult.querySelector("average_rating").textContent;
          goodreadsMetaData = searchResultRating + ":" + searchResultVoteCount + ":" + searchResultId;
          highestVoteCount = searchResultVoteCount;
      }
  }
  return goodreadsMetaData;
}

function parseXml(xmlStr) {
   return new window.DOMParser().parseFromString(xmlStr, "text/xml");
}

// Check the page for books loaded already.
fetchBookInfo();

// Monitor the document and when changes occur, re-evaluate the book list.
// This is used to catch books that are loaded at a later point, e.g. recommendations when
// scrolling down the page, or items of a collection e.g. "New audiobook additions" which are
// loaded with a slight delay compared to the rest of the page.
if (window.sessionStorage !== "undefined") {
    console.log("Hello");
    var target = document.body;
    // create an observer instance
    var observer = new MutationObserver(function (mutations) {
        // Even though multiple mutations may have occured, we call the function once because
        // it will respond to all book titles on the page.
        window.setTimeout(fetchBookInfo, 5);
    });
    // configuration of the observer:
    var config = {
        childList: true,
        subtree: true,  // necessary because books are not added as direct children of body
        attributes: false,
        characterData: false
    };
    observer.observe(target, config);
}
