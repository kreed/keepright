<?php

require('webconfig.inc.php');

// open db connection using settings in webconfig.inc.php
function db_connect() {
	global $db_dsn, $db_user, $db_pass, $db_opts;
	return new PDO($db_dsn, $db_user, $db_pass, $db_opts);
}

// execute $sql using database link $db
// echo debug messages if $debug is set
function query($sql, $db, $debug=true) {
	if ($debug) {
		echo "\n\n" . rtrim(preg_replace('/(\s)\s+/', '$1', $sql)) . "\n";
		$starttime=microtime(true);
	}

	try {
		$result=$db->query($link, $sql, MYSQLI_USE_RESULT);
	} catch (PDOException $e) {
		$message  = 'Invalid query: ' . $e->getMessage() . "\n";
		$message .= 'Whole query: ' . $sql . "\n";
		$message .= 'Query result: ' . $result . "\n";
		echo($message);
	}

	if ($debug) echo format_time(microtime(true)-$starttime) ."\n";
	return $result;
}


// gets a time value in seconds and writes it in s, min, h
// according to its amount
function format_time($t) {
	if ($t<60) {
		return sprintf("%01.2fs", $t);						// seconds
	} elseif ($t<3600) {
		return sprintf("%01.0fm %01.0fs", floor($t/60), $t % 60);		// minutes
	} else
		return sprintf("%01.0fh %01.0fm", floor($t/3600), ($t % 3600)/60);	// hours
}


// return the date of last site update (depending on db parameter)
function get_updated_date($schema) {
	return content("updated_$schema");
}


// return content of file if file exists
function content($filename) {
	if (file_exists($filename))
		return trim(file_get_contents($filename));
	else
		return '';
}


// select all error types where sub-types exist
// return the list of error types and their names
function get_subtyped_error_types($db, $ch) {
	global $error_types_name;

	$subtyped_array = array();
	$subtyped_names_array = array();

	$sql = "SELECT 10*floor(et1.error_type/10) AS error_type, error_name
		FROM $error_types_name et1
		WHERE EXISTS (
			SELECT error_type
			FROM $error_types_name et2
			WHERE et2.error_type BETWEEN et1.error_type+1 AND et1.error_type+9
		)
		AND et1.error_type MOD 10 = 0";
	foreach ($db->query($sql) as $row) {
		$subtyped_array[] = $row['error_type'];
		$subtyped_names_array[$row['error_type']] = $row['error_name'];
	}

	// add criteria for selecting error types
	$error_types=explode(',', addslashes($ch));
	$nonsubtyped='0';
	$subtyped='0';
	//print_r($subtyped_errors);
	// split list of error types into subtyped an non-subtyped ones
	foreach ($error_types as $error_type) {

		if (is_numeric($error_type)) {
			if (in_array(10*floor($error_type/10), $subtyped_array))
				$subtyped.=", $error_type";
			else
				$nonsubtyped.=", $error_type";
		}
	}

	return array($subtyped, $nonsubtyped, $subtyped_array, $subtyped_names_array);
}


// check out which schemas to query for given area.
// and return a UNION query with an arbitrary WHERE part.
// for querying just a point (lat/lon) specify top==bottom and left==right
function error_view_subquery($db, $left, $top, $right, $bottom, $where='TRUE'){
	// lookup the schemas that have to be queried for the given coordinates
	$error_view='';

	$sql = "SELECT `schema` AS s
		FROM `schemata`
		WHERE `left_padded`<=$right/1e7 AND `right_padded`>=$left/1e7
		AND `top_padded`>=$bottom/1e7 AND `bottom_padded`<=$top/1e7";
	foreach ($db->query($sql) as $row) {
		$error_view.=' SELECT * FROM error_view_' . $row['s'] .
			" WHERE $where UNION ALL " ;
	}
	return substr($error_view, 0, -11);
}



function find_schema($db, $lat, $lon) {
	$sql = "SELECT `schema` AS s
		FROM `schemata`
		WHERE `left`<=$lon/1e7 AND `right`>=$lon/1e7
			AND `top`>=$lat/1e7 AND `bottom`<=$lat/1e7
		LIMIT 1";
	foreach ($db->query($sql) as $row) {
		return $row['s'];
	}
	return '0';
}


// render a select list for user interface language selection
function language_selector() {
	global $locale;

	echo '<select name="lang" onchange="setLang(document.myform.lang.value); submit();">';

	$languages=array('cs', 'da', 'de', 'es', 'en', 'et', 'fa', 'fi', 'fr', 'hu', 'it', 'lt', 'nb', 'nl', 'pl', 'pt_BR', 'ru', 'sl', 'sv', 'uk');

	foreach ($languages as $lang) {
		echo "<option value='$lang' " . ($locale==$lang ? 'selected' : '') . ">$lang</option>";
	}
	echo '</select>';
}


// print out announcements for the web landing page
// parameter $show_archived_entries (0|1) selects current or archived entries
function announcements($db, $show_archived_entries) {
	$sql = "SELECT subject, body, COALESCE( txt1, '') AS txt1,
			COALESCE( txt2, '') AS txt2, COALESCE( txt3, '') AS txt3
		FROM announce
		WHERE visible<>0 AND archived=" . $show_archived_entries . "
		ORDER BY ID DESC";

	foreach ($db->query($sql) as $row) {
		$body=strtr(T_gettext($row['body']),
			array(	'$1'=>T_gettext($row['txt1']),
				'$2'=>T_gettext($row['txt2']),
				'$3'=>T_gettext($row['txt3'])
			)
		);

		echo '<h4>' . T_gettext($row['subject']) . "</h4><p>$body</p>\n";
	}
}
?>
