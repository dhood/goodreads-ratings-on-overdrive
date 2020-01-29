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

function addGoodreadsRating(goodreadsMetaData, bookInfo, titleName, titleAuthor) {
    console.log(titleName);
    console.log(titleAuthor);
    var divId = getDivId(titleName, titleAuthor);

    // TODO(dhood): allow duplicates of title (audiobook + ebook) to each have div added.
    var divEl = document.getElementById(divId);
    if (divEl && (divEl.offsetWidth || divEl.offsetHeight || divEl.getClientRects().length)) {
        return;
    }


    // TODO(dhood): fetch actual score data.
    /*
        var imdbRatingPresent = imdbMetaData && (imdbMetaData !== 'undefined') && (imdbMetaData !== "N/A");
        var imdbVoteCount = null;
        var imdbRating = null;
        var imdbId = null;
        if (imdbRatingPresent) {
            var imdbMetaDataArr = imdbMetaData.split(":");
            imdbRating = imdbMetaDataArr[0];
            imdbVoteCount = imdbMetaDataArr[1];
            imdbId = imdbMetaDataArr[2];
        }
        var imdbHtml = 'Goodreads rating : ' + (goodreadsRatingPresent ? goodreadsRating : "N/A") + (goodreadsVoteCount ? ", Vote Count : " + goodreadsVoteCount : "");
        */
       var goodreadsHtml = 'Goodreads rating: 5';

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
    var goodreadsMetaData = "5.0:100:4000";
    window.sessionStorage.setItem(name + ":" + author, goodreadsMetaData);
    addGoodreadsRating(goodreadsMetaData, bookInfo, name, author);
    /*
    var url = "https://www.omdbapi.com/?apikey=<secret_key>&t=" + encodeURI(name)
        + "&y=" + year + "tomatoes=true";

    var xhr = new XMLHttpRequest();
    xhr.open('GET', url);
    xhr.withCredentials = true;
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onload = function () {
        if (xhr.status === 200) {
            var apiResponse = JSON.parse(xhr.responseText);
            var imdbRating = apiResponse["imdbRating"];
            var imdbVoteCount = apiResponse["imdbVotes"];
            var imdbId = apiResponse["imdbID"];
            var rottenRating = extractRottenTomatoesRating(apiResponse["Ratings"]);
            var metaScore = apiResponse["Metascore"];
            var imdbMetaData = imdbRating + ":" + imdbVoteCount + ":" + imdbId;
            window.sessionStorage.setItem(name + ":" + year, imdbMetaData);
            window.sessionStorage.setItem("metaScore:" + name + ":" + year, metaScore)
            window.sessionStorage.setItem("rotten:" + name + ":" + year, rottenRating);
            addIMDBRating(imdbMetaData, name, year);
            addRottenRating(rottenRating, name, year);
            addMetaScore(metaScore, name, year);
        }
    };
    xhr.send();
    */
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
