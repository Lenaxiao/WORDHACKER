<?php
  /*
    Name: Sijia Xiao (Lena)
    Date: Nov. 27, 2018
    Section: CSE 154 AE
    This guess.php web service allows users to fetch alphabet and definition
    data with GET parameters.
    Detail:
      Required GET parameter:
        - alphabet
      Optional GET parameters:
        - difficulty
        - vocabulary
      Example:
        - alphabet=a
        - difficulty=easy
        - vocabulary=true
      Output Format:
        txt (does not provide whole vocabulary) or JSON (just for vocabulary)

              ~~~~~~~~~~~~~~~~~
            /                  \    |- - - -|
          /    ( * )            \   |  +  | |
        /                        \  |_____| |
       +____________________________________|
  */

  error_reporting(E_ALL);  /* set up error reporting */
  ini_set('display_errors', 1);  /* set up error reporting */
  header("Content-type: text/plain");  /* print in plain text (default) */

  /**
   * Returns a PDO object connected to the words database, otherwise throw a
   * PDOException if an error occurs.
   * @return {object}
   */
  function get_PDO() {
    $host =  "localhost";
    $port = "8889"; # Make sure this matches your server (e.g. MAMP) port
    $user = "root";
    $password = "root";
    $dbname = "words";

    $ds = "mysql:host={$host}:{$port};dbname={$dbname};charset=utf8";

    try {
      $db = new PDO($ds, $user, $password);
      $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
      return $db;
    } catch (PDOException $ex) {
      handle_error("Can not connect to the database. Please try again later.", $ex);
    }
  }

  $db = get_PDO();

  /*
   * check if alphabet is set. If it is set, get vocabulary or a word, otherwise,
   * print 400 error message.
   */
  if (!isset($_GET['alphabet'])) {
    handle_error("Error: Please pass an alphabet as a parameter.");
  } else {
    return checkVocabulary($_GET['alphabet'], $db);
  }

  /**
   * check if vocabulary is set. if it is set to 'true', get vocabulary of that
   * alphabet, otherwise get a word with that alphabet.
   * @param {string} $alphabet - alphabet from user
   * @param {object} $db - PDO object
   * @return {string}
   */
  function checkVocabulary($alphabet, $db) {
    if (isset($_GET['vocabulary']) && $_GET['vocabulary'] === 'true') {
      return getVocabulary($alphabet, $db);
    } else {
      return getAWord($alphabet, $db);
    }
  }

  /**
   * return a word with that alphabet if the alphabet is legal, throws a 400 error
   * message otherwise.
   * @param {string} $alphabet - alphabet from user
   * @param {object} $db - PDO object
   * @return {string} - a random word and its definition
   */
  function getAWord($alphabet, $db) {
    $legal = legalAlphabet($alphabet);
    if ($legal) {
      return searchWord($alphabet, $db);
    } else {
      handle_error("Error: Please pass a valid alphabet (a-z or random).");
    }
  }

  /**
   * return the vocabulary of that alphabet and print it out in the web.
   * @param {string} $alphabet - alphabet from user
   * @param {object} $db - PDO object
   * @return {string} $vocabulary
   */
  function getVocabulary($alphabet, $db) {
    $vocabulary = searchThisVocabulary($alphabet, $db);
    header("Content-type: application/json");
    print($vocabulary);
    return $vocabulary;
  }

  /**
   * return a vocabulary that contains all words with that alphabet as first
   * letter. push the words into a new array associated with that alphabet.
   * throws an error if it fails.
   * @param {string} $keyword - alphabet
   * @param {object} $db - PDO object
   * @return {string} $words - vocabulary in JSON format
   */
  function searchThisVocabulary($alphabet, $db) {
    try {
      $qry = "SELECT word FROM Words WHERE word LIKE CONCAT(:alphabet, '%');";
      $param = array("alphabet" => $alphabet);
      $rows = fetchData($db, $qry, $param);
      $dic = [];
      $dic[$alphabet] = [];
      foreach ($rows as $row) {
        array_push($dic[$alphabet], $row['word']);
      }
      return json_encode($dic);
    } catch (PDOException $ex) {
      handle_error("Cannot query the database", $ex);
    }
  }

  /**
   * return true if the alphabet is legal, return false otherwise.
   * @param {string} $alphabet - parameter
   * @param {boolean} alphabet is legal or not
   */
  function legalAlphabet($alphabet) {
    $lower = strtolower($alphabet);
    if ($lower >= 'a' && $lower <= 'z' || $lower === 'random') {
      return true;
    }
    return false;
  }

  /**
   * search a random word in the directory started with that alphabet.
   * @param {string} $alphabet - parameter
   * @param {object} $db - PDO object
   * @return {string} - word and its definition as a string
   */
  function searchWord($alphabet, $db) {
    $line = "";
    if ($alphabet === 'random') {
      $line = getGlobalRandomWord($db);
    } else if (!isset($_GET['difficulty'])){
      $line = randSameAlphabetWord($alphabet, $db);
    } else {
      $line = randSameAlphabetDifficultyWord($alphabet, $_GET['difficulty'], $db);
    }
    print($line);
    return $line;
  }

  /**
   * return a random word and its definition, throws an PDOException otherwise.
   * @param {object} $db - PDO object
   * @return {string}
   */
  function getGlobalRandomWord($db) {
    try {
      $rows = $db->query("SELECT word, definition From Words;");
      return randomizer($rows);
    } catch (PDOException $ex) {
      handle_error("Cannot query database", $ex);
    }
  }

  /**
   * return a random word which takes target alphabet as the first letter
   * and its definition , throws an PDOException otherwise.
   * @param {object} $db - PDO object
   * @param {strign} $alphabet
   * @return {string}
   */
  function randSameAlphabetWord($alphabet, $db) {
    try {
      $qry = "SELECT word, definition FROM Words WHERE word LIKE CONCAT(:alphabet, '%');";
      $param = array("alphabet" => $alphabet);
      $rows = fetchData($db, $qry, $param);
      return randomizer($rows);
    } catch (PDOException $ex) {
      handle_error("Cannot query database", $ex);
    }
  }

  /**
   * return a random word with target difficulty which also takes target alphabet
   * as the first letter and its definition , throws an PDOException otherwise.
   * @param {object} $db - PDO object
   * @param {strign} $alphabet
   * @param {string} $difficulty
   * @return {string}
   */
  function randSameAlphabetDifficultyWord($alphabet, $difficulty, $db) {
    try {
      $qry = "SELECT word, definition FROM Words ";
      $qry .= "WHERE difficulty=:difficulty AND word LIKE CONCAT(:alphabet, '%');";
      $params = array("difficulty" => $difficulty, "alphabet" => $alphabet);
      $rows = fetchData($db, $qry, $params);
      return randomizer($rows);
    } catch (PDOException $ex) {
      handle_error("Cannot query database", $ex);
    }
  }

  /**
   * query the database and fetch all data that matches the condition.
   * @param {object} $db - PDO object
   * @param {string} $qry - sql query
   * @param {array} $param
   * @return {object} - a PDO object
   */
  function fetchData($db, $qry, $param) {
    $stmt = $db->prepare($qry);
    $stmt->execute($param);
    $rows = $stmt->fetchAll();
    return $rows;
  }

  /**
   * return a random word and its definition.
   * @param {object} $rows - a PDO object
   * @return {string}
   */
  function randomizer($rows) {
    $words = array();
    foreach ($rows as $row) {
      array_push($words, $row['word'].':'.$row['definition']);
    }
    if (empty($words)) {
      handle_error("Error: No vocabulary starts with this alphabet! Please try another.");
    } else {
      return $words[array_rand($words)];
    }
  }

  /**
   * Prints out a plain text 400 error given $msg. If given the second error,
   * (PDOException) print out the details of that message as well.
   * @param {string} $error - error message to printed out.
   */
  function handle_error($msg, $ex=NULL) {
    header("HTTP/1.1 400 Invalid Request");
    header("Content-type: text/plain");
    print ("{$msg}\n");
    if ($ex) {
      print ("Error details: $ex \n");
    }
  }
?>
