class Collection {
  constructor() {
    this.collection_div = document.createElement("div");
    this.collection_div.setAttribute("class", "collection z-depth-1");
  }

  addItem(link, title, desc) {
    let a = document.createElement("a");

    a.setAttribute("class", "collection-item z-depth-1");
    a.setAttribute("href", link);
    a.setAttribute("target", "_blank");

    let span = document.createElement("span");
    span.appendChild(document.createTextNode(title));
    span.setAttribute("class", "defWord");

    let p = document.createElement("p");
    p.appendChild(document.createTextNode(desc));
    p.setAttribute("class", "defText");

    a.appendChild(span);
    a.appendChild(p);

    this.collection_div.appendChild(a);
  }

  getCollectionElement() {
    return this.collection_div;
  }
}

class WikiReq {
  //endpoint
  //https://en.wikipedia.org/w/api.php

  //search
  //https://en.wikipedia.org/wiki/Special:ApiSandbox#action=query&format=json&origin=*&prop=info%7Cextracts&generator=search&redirects=1&inprop=url&exsentences=2&exlimit=10&exintro=1&explaintext=1&gsrsearch=camera&gsrnamespace=0&gsrlimit=10

  //random
  //https://en.wikipedia.org/wiki/Special:ApiSandbox#action=query&format=json&origin=*&prop=info%7Cextracts&generator=random&redirects=1&inprop=url&exsentences=2&exlimit=10&exintro=1&explaintext=1&grnnamespace=0&grnfilterredir=nonredirects&grnlimit=5

  constructor(
    actionType,
    format,
    origin,
    prop,
    redirects,
    inprop,
    exsentences,
    exintro,
    explaintext,
    endpoint
  ) {
    actionType = actionType === undefined ? "query" : actionType;
    format = format === undefined ? "json" : format;
    origin = origin === undefined ? "*" : origin;
    prop = prop === undefined ? "info|extracts" : prop;
    redirects = redirects === undefined ? "1" : redirects;
    inprop = inprop === undefined ? "url" : inprop;
    exsentences = exsentences === undefined ? "2" : exsentences;
    exintro = exintro === undefined ? "1" : exintro;
    explaintext = explaintext === undefined ? "1" : explaintext;

    this.endpoint =
      endpoint === undefined ? "https://en.wikipedia.org/w/api.php" : endpoint;

    this.payload = {
      action: actionType,
      format: format,
      origin: origin,
      prop: prop,
      redirects: redirects,
      inprop: inprop,
      exsentences: exsentences,
      exintro: exintro,
      explaintext: explaintext,
    };

    this.validRequest = false;
  }

  search(keyword, maxResults) {
    if (this.validRequest) {
      return null;
    }

    this.payload["generator"] = "search";
    this.payload["gsrsearch"] = keyword;
    this.payload["gsrnamespace"] = "0";
    this.payload["gsrlimit"] = maxResults < 500 ? maxResults : 500;
    let exlimit = maxResults < 20 ? maxResults : 20;
    this.payload["exlimit"] = exlimit;

    this.validRequest = true;

    return true;
  }

  random(maxResults) {
    if (this.validRequest) {
      return null;
    }

    this.payload["generator"] = "random";
    this.payload["grnnamespace"] = "0";
    this.payload["grnfilterredir"] = "nonredirects";
    this.payload["grnlimit"] = maxResults < 500 ? maxResults : 500;
    let exlimit = maxResults < 20 ? maxResults : 20;
    this.payload["exlimit"] = exlimit;

    this.validRequest = true;

    return true;
  }

  buildGETRequest() {
    if (!this.validRequest) {
      console.log("bad request");
      return null;
    }

    let queryPart = "";
    let appendAmpersand = false;

    for (let i in this.payload) {
      if (this.payload[i] == "") {
        continue;
      }
      if (appendAmpersand) {
        queryPart += "&";
      } else {
        appendAmpersand = true;
      }
      queryPart += i + "=" + this.payload[i];
    }

    let GETRequest = this.endpoint + "?" + queryPart;
    return GETRequest;
  }
}

class GetWikiResults {
  constructor(reqURL, userAgent) {
    this.reqURL = reqURL;
    let defUserAgent = {
      header: "Api-User-Agent",
      value: "chromian777 freecodecamp/v0.1",
    };
    this.userAgent = userAgent === undefined ? defUserAgent : userAgent;
  }

  reqListener() {
    let response = this.responseText;
    let searchResult = JSON.parse(response);
    //console.log(JSON.parse(response));

    if (searchResult.length === undefined) {
      let searchResultContainer = document.getElementById(
        "searchResult-container"
      );

      while (searchResultContainer.hasChildNodes()) {
        searchResultContainer.removeChild(searchResultContainer.firstChild);
      }
    }

    //let keyword = searchResult[0];
    let results = {};

    try {
      let count = 0;
      for (let i in searchResult["query"]["pages"]) {
        results[count++] = {
          title: searchResult["query"]["pages"][i]["title"],
          desc: searchResult["query"]["pages"][i]["extract"],
          link: searchResult["query"]["pages"][i]["canonicalurl"],
        };
      }
    } catch (e) {
      //remove progress bar
      document.getElementById("progressBar").style = "visibility : hidden;";

      //clear previous results, if any
      let searchResultContainer = document.getElementById(
        "searchResult-container"
      );
      while (searchResultContainer.hasChildNodes()) {
        searchResultContainer.removeChild(searchResultContainer.firstChild);
      }

      //remove info text
      document.getElementById("infoTextDiv").style = "visibility: hidden;";

      return false;
    }

    let collection = new Collection();

    for (let i in results) {
      let title = results[i]["title"];
      let desc = results[i]["desc"];
      let link = results[i]["link"];

      collection.addItem(link, title, desc);
    }

    let collectionNode = collection.getCollectionElement();

    let searchResultContainer = document.getElementById(
      "searchResult-container"
    );

    while (searchResultContainer.hasChildNodes()) {
      searchResultContainer.removeChild(searchResultContainer.firstChild);
    }

    searchResultContainer.appendChild(collectionNode);

    //info text
    document.getElementById("infoTextDiv").style = "visibility: visible;";

    //hide progess bar
    document.getElementById("progressBar").style = "visibility : hidden;";
  }

  get() {
    let progessBar = document.getElementById("progressBar");
    if (progessBar.style != "visibility : visible;") {
      progessBar.style = "visibility : visible;";
    }
    let oReq = new XMLHttpRequest();
    oReq.addEventListener("load", this.reqListener);
    oReq.open("GET", this.reqURL);
    oReq.setRequestHeader(this.userAgent["header"], this.userAgent["value"]);
    oReq.send();
  }
}

function liftSearchDiv() {
  let searchBox = document.getElementById("searchDiv");
  let tween = TweenLite.to(searchBox, 1, {
    top: "0px",
    ease: Strong.easeInOut,
  });
  tween.play();
}

let inputTimeOut = null;
let firstSearch = true;
function getSR_Input(obj) {
  let searchWord = obj.target.value;
  if (firstSearch) {
    liftSearchDiv();
    firstSearch = false;
  }

  clearTimeout(inputTimeOut);
  getSearchResults(searchWord);
}

function setSR_Button() {
  clearTimeout(inputTimeOut);
  let searchWord = document.getElementById("searchWord").value;
  getSearchResults(searchWord);
}

function getSearchResults(searchWord) {
  inputTimeOut = setTimeout(function () {
    if (searchWord !== undefined && searchWord !== "" && searchWord !== " ") {
      let wr = new WikiReq();
      if (wr.search(searchWord, 10)) {
        wrURL = wr.buildGETRequest();
        let gwr = new GetWikiResults(wrURL);
        gwr.get();
        document.getElementById("infoTextDiv").style = "visibility: hidden;";
        document.getElementById("infoText").innerHTML =
          "search for : " + searchWord;
      }
    } else {
      let searchResultContainer = document.getElementById(
        "searchResult-container"
      );
      while (searchResultContainer.hasChildNodes()) {
        searchResultContainer.removeChild(searchResultContainer.firstChild);
      }
      return false;
    }
  }, 500);
}

function getRandomArticles() {
  if (firstSearch) {
    liftSearchDiv();
    firstSearch = false;
  }
  let wr = new WikiReq();
  if (wr.random(5)) {
    wrURL = wr.buildGETRequest();
    let gwr = new GetWikiResults(wrURL);
    gwr.get();

    document.getElementById("infoTextDiv").style = "visibility: hidden;";
    document.getElementById("infoText").innerHTML =
      "some random articles for you:";
    document.getElementById("searchWord").value = "";
  }
}

//get search word as it's typed in
let searchWordNode = document.getElementById("searchWord");
searchWordNode.value = "";
searchWordNode.addEventListener("input", getSR_Input);

//get search word when button is pressed
document.getElementById("searchBtn").addEventListener("click", setSR_Button);

//get random articles when button is clicked
document
  .getElementById("randomBtn")
  .addEventListener("click", getRandomArticles);
