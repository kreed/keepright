<?php

/*
store a comment on an error instance
this is called by a form placed inside the bubble on the map
*/

require('helpers.inc.php');

$db=db_connect();

if (!get_magic_quotes_gpc()) {
	$co = htmlspecialchars(addslashes($_GET['co']));
	$st = addslashes($_GET['st']);
	$schema = addslashes($_GET['schema']);
	$id = addslashes($_GET['id']);
} else {
	$co = htmlspecialchars($_GET['co']);
	$st = $_GET['st'];
	$schema = $_GET['schema'];
	$id = $_GET['id'];
}

if ($st=="ignore_t") $st = "ignore_temporarily";

$agent=addslashes($_SERVER['HTTP_USER_AGENT']);
$ip=$_SERVER['REMOTE_ADDR'];

$params=[$schema, $id];

// move any comment into history
$stmt=$db->prepare("
	INSERT INTO $comments_historic_name
	SELECT * FROM $comments_name
	WHERE `schema`=? AND error_id=?");
$stmt->execute([$schema, $id]);

// drop old comment
$stmt=$db->prepare("
	DELETE FROM $comments_name
	WHERE `schema`=? AND error_id=?");
$stmt->execute([$schema, $id]);

// insert new comment
$stmt=$db->prepare("
	INSERT INTO $comments_name (`schema`, error_id, state, comment, ip, user_agent) VALUES (
		?, ?, ?, ?, ?, ?
	)");
$stmt->execute([$schema, $id, $st, $co, $ip, $agent]);
?>
