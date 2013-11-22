<?php
/*

Martijn's Interface

query number of errors per error_type

*/

require('helpers.inc.php');

$db=db_connect();
$db->query("SET SESSION wait_timeout=60");

// parameter one: error type
$ch = $_GET['ch'];
if (!$ch) $ch='';

$list=explode(',', $ch);
$error_types='0';
foreach($list as $type) $error_types.="," . (1*$type);



// build SQL for fetching error counts
$sql="SELECT COALESCE(SUM(error_count), 0) AS c";
$sql.=" FROM error_counts e";
$sql.=" WHERE error_type IN ($error_types)";

foreach ($db->query($sql) as $row) {
	echo $row['c'];
}

?>
