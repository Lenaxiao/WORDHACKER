/*
  Name: Sijia Xiao (Lena)
  Date: Nov. 14, 2018
  Section: CSE 154 AE
  This javascript file allows user to start a guessing game either
  randomly or featured. User can input alphabet and difficulty level.
  During the game, user can check their answer or ask for a hint.

            ~~~~~~~~~~~~~~~~~
          /                  \    |- - - -|
        /    ( * )            \   |  +  | |
      /                        \  |_____| |
     +____________________________________|
*/
(function(){
  "use strict";

  window.addEventListener('load', init);

  let word = "";
  let random = true;

  /**
   * add click events to all buttons.
  */
  function init() {
    $('featured').addEventListener('click', showBoard);
    $('random').addEventListener('click', rememberRandomState);
    $('check').addEventListener('click', checkAnswer);
    $('start-btn').addEventListener('click', rememberRandomState);
    $('hint').addEventListener('click', giveHint);
    $('word-list').addEventListener('click', fetchVocabulary);
  }

  /**
   * toggle the board for user inputs after clicking the featured button.
  */
  function showBoard() {
    $('param-board').classList.toggle('hidden');
    $('start-btn').classList.toggle('hidden');
    $('word-list').classList.toggle('hidden');
  }

  /**
   * remenber current random state for later usage unless user choose a different
   * state.
  */
  function rememberRandomState() {
    random = true;
    if (this.id !== 'random') {
      random = false;
    }
    searchQuestion();
  }

  /**
   * generate url for data fetching based on current random state.
   * display answer checking button and hint button.
  */
  function searchQuestion() {
    $('check').classList.remove('hidden');
    $('hint').classList.remove('hidden');
    removeAll();
    let url = 'guess.php';
    if (random) {
      url += '?alphabet=random';
    } else {
      let difficulty = $('difficulty').value;
      let alphabet = qs('input[name=alphabet]').value;
      url += '?alphabet=' + alphabet + '&difficulty=' + difficulty;
    }
    fetchData(url);
  }

  /**
   * fetch plain text data from server. Display error if not success.
   * @param {string} url - url for query
  */
  function fetchData(url) {
    fetch(url)
      .then(checkStatus)
      .then(textSplit)
      .then(makeGuessBoard)
      .catch(handleError);
  }

  /**
   * split text message return from the server and split the string.
   * @param {string} text - plain text response
   * @return {array} split the response into array
  */
  function textSplit(text) {
    return text.split(':');
  }

  /**
   * unfreeze checking button and hint button. Display word and definition to
   * designate area. freeze the first letter if current state is non-random.
   * @param {array} array - array contains word and definition information.
  */
  function makeGuessBoard(array) {
    $('check').disabled = false;
    $('hint').disabled = false;
    word = array[0].toLowerCase();
    $('definition').innerText = array[1];
    displayLetters();
    if (!random) {
      freezeFirstLetter();
    }
    autoFill();
  }

  /**
   * create new element for each letter of word and display them in word card.
  */
  function displayLetters() {
    for (let i = 0; i < word.length; i++) {
      let letter = create('input');
      letter.setAttribute("type", "text");
      letter.setAttribute("maxlength", "1");
      $('letters').appendChild(letter);
    }
  }

  /**
   * freeze first letter if user input an alphabet.
  */
  function freezeFirstLetter() {
    let input = qs('input[name=alphabet]').value;
    if (input !== '') {
      let firstLetter = $('letters').children[0];
      firstLetter.value = input.toUpperCase();
      freezeLetter(firstLetter);
    }
  }

  /**
   * add keyboard event for each letter. If user type a letter in, the cursor
   * will automatically move to the next letter. If user hit delete in keyboard,
   * cursor will automatically move to the previous letter.
  */
  function autoFill() {
    let child = $('letters').children;
    for (let i = 0; i < word.length; i++) {
      child[i].addEventListener('keyup', function() {
        if (this.value.length === this.maxLength && i < word.length - 1) {
          child[i + 1].focus();
        }
        if (event.keyCode === 8 && this.value.length === 0) {
          child[i - 1].focus();
        }
      });
    }
  }

  /**
   * remove all the information in the card area. And initialize word as null.
  */
  function removeAll() {
    $('letters').innerHTML = "";
    $('definition').innerText = "";
    word = "";
  }

  /**
   * If user completes the letters of a word and the letters matches the correct
   * one, the letter will be unchangable, otherwise, it will be deleted.
   * if all letter in the word are correct, move to the next problem after 3s.
  */
  function checkAnswer() {
    if (checkMissingLetter()) {
      let letters = $('letters').children;
      let count = word.length;
      for (let i = 0; i < letters.length; i++) {
        if (word[i] === letters[i].value.toLowerCase()) {
          count--;
          freezeLetter(letters[i]);
        } else {
          letters[i].value = "";
        }
      }
      if (count === 0) {
        setTimeout(searchQuestion, 3000);
      }
    }
  }

  /**
   * freeze letters and change its border border.
   * @param {object} node - object for a letter.
  */
  function freezeLetter(node) {
    node.style.border = 'none';
    node.disabled = true;
  }

  /**
   * if user did not complete the word, user will be reminded by changed border
   * of that missing letter for 2s.
   * @return {boolean} - return true if user complete the word.
  */
  function checkMissingLetter() {
    let letters = $('letters').children;
    let complete = true;
    for (let i = 0; i < letters.length; i++) {
      if (letters[i].value === '') {
        complete = false;
        letters[i].style.borderColor = '#F25652';
        setTimeout(function(){
          letters[i].style.borderColor = 'black';
        }, 2000);
      }
    }
    return complete;
  }

  /**
   * set hint limit of 60%. If user hit the hint button and the current count
   * of correct letters is less than 60%, it will provide random correct letter
   * and display it into the card. Otherwise, user will be alert with a info.
  */
  function giveHint() {
    let count = limitHintNumber();
    if (count <= Math.floor(0.6 * (word.length))) {
      let letters = $('letters').children;
      let hintOn = true;
      while(hintOn) {
        let rand = Math.floor(Math.random() * letters.length);
        if (!letters[rand].disabled) {
          letters[rand].value = word[rand];
          freezeLetter(letters[rand]);
          hintOn = false;
        }
      }
    } else {
      alert('Sorry, we can only give you hints up to 60% of the word. :(');
    }
  }

  /**
   * count for letters that is correct.
   * @return {integer} count for letters that is correct.
  */
  function limitHintNumber() {
    let count = 0;
    let letters = $('letters').children;
    for (let i = 0; i < letters.length; i++) {
      if (letters[i].disabled) {
        count++;
      }
    }
    return count;
  }

  /**
   * fetch vocabulary data from server if alphabet is not in the current session
   * storage, otherwise get data from session storage.
  */
  function fetchVocabulary() {
    let alphabet = qs('input[name=alphabet]').value.toLowerCase();
    if (!sessionStorage.getItem(alphabet)) {
      let url = "guess.php?vocabulary=true&alphabet=" + alphabet;
      fetchVocabularyData(url);
    } else {
      let vocabulary = sessionStorage.getItem(alphabet);
      vocabulary = vocabulary.split(',');
      displayVocabulary(alphabet, vocabulary);
    }
  }

  /**
   * fetch data from that this url. Display error in console if not succeed.
   * @param {string} url - data source.
  */
  function fetchVocabularyData(url) {
    fetch(url)
      .then(checkStatus)
      .then(JSON.parse)
      .then(storage)
      .catch(handleError);
  }

  /**
   * store vocabulary of that alphabet to session storage.
   * @param {string} info - JSON-based info
  */
  function storage(info) {
    let alphabet = qs('input[name=alphabet]').value.toLowerCase();
    let vocabulary = info[alphabet];
    displayVocabulary(alphabet, vocabulary);
    sessionStorage.setItem(alphabet, vocabulary);
  }

  /**
   * create new element for vocabulary and display it below word card.
   * @param {string} alphabet - alphabet for user input
   * @param {vocabulary} vocabulary - vocabulary associated with current alphabet
  */
  function displayVocabulary(alphabet, vocabulary) {
    $('vocabulary').classList.toggle('hidden');
    $('vocabulary').innerText = "";
    let vocClass = create('ul');
    vocClass.innerText = alphabet;
    for (let i = 0; i < vocabulary.length; i++) {
      let voc = create('li');
      voc.innerText = vocabulary[i];
      vocClass.appendChild(voc);
    }
    $('vocabulary').appendChild(vocClass);
  }

  /**
   * if server returns error, print error information to the card.
   * and freeze answer checking and hint buttons.
  */
  function handleError() {
    removeAll();
    $('letters').innerText = 'Cannot find the vocabulary!';
    $('check').disabled = true;
    $('hint').disabled = true;
  }

  /* ==============================  Helper Functions ============================== */
  /**
   * Helper function to return the response's result text if successful, otherwise
   * returns the rejected Promise result with an error status and corresponding text
   * @param {object} response - response to check for success/error
   * @return {object} - valid result text if response was successful, otherwise rejected
   *                    Promise result
   */
  function checkStatus(response) {
    if (response.status >= 200 && response.status < 300 || response.status == 0) {
      return response.text();
    } else {
      return Promise.reject(new Error(response.status + ": " + response.statusText));
    }
  }

  /**
   * Return the element that has been created
   * @param {string} el - element type to be created
   * @return {object} new element
  */
  function create(el) {
    return document.createElement(el);
  }

  /**
   * Return the element that has the ID attribute with the specified value.
   * @param {string} id - element id
   * @return {object} DOM object associated with id
  */
  function $(id) {
    return document.getElementById(id);
  }

  /**
   * Return the element that has the class name or tag.
   * @param {string} name - element class name or tag.
   * @return {object} object that has such class name or tag.
  */
  function qs(name) {
    return document.querySelector(name);
  }
})();
