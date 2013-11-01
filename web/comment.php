<?php

/*
store a comment on an error instance
this is called by a form placed inside the bubble on the map
*/

require('webconfig.inc.php');
require('helpers.inc.php');

$db1=mysqli_connect($db_host, $db_user, $db_pass, $db_name);

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

function param_query($link, $sql, $param) {
	$stmt=mysqli_prepare($link, $sql);
	mysqli_stmt_bind_param($stmt, 's', $param);
	mysqli_stmt_execute($stmt);
}

if (is_numeric($id) && $schema) {

	// move any comment into history
	param_query($db1, "
		INSERT INTO $comments_historic_name
		SELECT * FROM $comments_name
		WHERE `schema`=? AND error_id=$id
	", $schema);

	// drop old comment
	param_query($db1, "
		DELETE FROM $comments_name
		WHERE `schema`=? AND error_id=$id
	", $schema);
	// insert new comment
	param_query($db1, "
		INSERT INTO $comments_name (`schema`, error_id, state, comment, ip, user_agent) VALUES (
			?, $id, '$st', '$co', '$ip', '$agent'
		)
	", $schema);
}

mysqli_close($db1);
?>
