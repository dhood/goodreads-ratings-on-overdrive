// Inject the config file, which sets this application's API key
var s = document.createElement('script');  // Script that will be run in the DOM.
s.src = chrome.runtime.getURL('config.js');
s.onload = function() {
    goodreadsApiKey = window.sessionStorage.getItem("goodreadsApiKey");
    // Remove the script element after the script has been loaded (cleanup).
    this.remove();
};
(document.head || document.documentElement).appendChild(s);


function fetchBookInfo() {
    // Fetch the info panel for all books displayed on the current page.
    var bookList = document.querySelectorAll('.InfoPanel');
    if (bookList === null) {
        return;
    }

    // Iterate over all books on the page.
    for (let bookInfo of bookList) {

        var titleNameElem = bookInfo.querySelector('.title-name')
        if (!titleNameElem) {
            break;
        }
        var titleName = titleNameElem.title;

        var titleAuthorElem = bookInfo.querySelector('.title-author a')
        if (!titleAuthorElem) {
            break;
        }
        var titleAuthor = titleAuthorElem.title;

        console.log("Retrieving storage for: " + titleName + " by " + titleAuthor);
        var existingGoodreadsRating = window.sessionStorage.getItem(titleName + ":" + titleAuthor);
        if ((existingGoodreadsRating !== "undefined") && (existingGoodreadsRating !== null)) {
            addGoodreadsRating(existingGoodreadsRating, bookInfo, titleName, titleAuthor);
        } else {
            makeRequestAndAddRating(bookInfo, titleName, titleAuthor)
        }
    }
};

function addGoodreadsRating(bookMetaData, bookInfo, titleName, titleAuthor) {
    console.log(titleName);
    console.log(titleAuthor);
    var divId = getDivId(titleName, titleAuthor);

    // TODO(dhood): allow duplicates of title (audiobook + ebook) to each have div added.
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
    var goodreadsHtml = 'Goodreads rating : ' + (ratingPresent ? rating : "N/A") + (voteCount ? ", Vote Count : " + voteCount : "");

       /*
        if (goodreadsId !== null) {
            goodreadsHtml = "<a target='_blank' href='https://www.goodreads.com/book/show" + goodreadsId + "'>" + goodreadsHtml + "</a>";
        }
        */

        var div = document.createElement('div');
        div.innerHTML = goodreadsHtml;
        div.className = 'goodreadsRating';
        div.id = divId;
        bookInfo.append(div);
}

function getDivId(name, author) {
    console.log(name);
    console.log(author);
    name = name.replace(/[^a-z0-9\s]/gi, '');
    name = name.replace(/ /g, '');
    author = author.replace(/[^a-z0-9\s]/gi, '');
    author = author.replace(/ /g, '');
    return "aaa" + name + "_" + author;
}

function makeRequestAndAddRating(bookInfo, name, author) {

    console.log("Making request for: " + name + " by " + author);
    // Note(dhood): cors-anywhere is used because Goodreads API doesn't support CORS header itself.
    // See: https://www.goodreads.com/topic/show/17893514-cors-access-control-allow-origin
    var url = "https://cors-anywhere.herokuapp.com/" +
      "https://www.goodreads.com/search/index.xml?key=" + goodreadsApiKey + "&format=xml" +
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
            window.sessionStorage.setItem(name + ":" + author, bookData);
            addGoodreadsRating(bookData, bookInfo, name, author);
        }
    };
    console.log("Sending request");
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
  // until one is found without the author in the title.
  // That approach, however, relies on 1) Goodreads and Overdrive using the same author name, and
  // 2) the most appropriate response definitely not containing the author name.
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

fetchBookInfo(); // one to kick it off
if (window.sessionStorage !== "undefined") {
    console.log("Hello");
    var target = document.body;
    // create an observer instance
    var observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
            window.setTimeout(fetchBookInfo, 5);
        });
    });
    // configuration of the observer:
    var config = {
        attributes: true,
        childList: true,
        characterData: true
    };
    observer.observe(target, config);
}
