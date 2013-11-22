<?php
/*

Martijn's Interface

Choose just one single error from around the planet
output data about that error as GeoJSON

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

// pick a schema randomly
$schema=$schemanames[array_rand($schemanames)];



// build SQL for fetching errors
$sql="SELECT e.object_type, e.object_id, e.lat/1e7 as la, e.lon/1e7 as lo";
$sql.=" FROM error_view_$schema e LEFT JOIN $comments_name c USING (`schema`, error_id)";
$sql.=" WHERE (c.state IS NULL OR c.state NOT IN ('ignore', 'ignore_temporarily'))";
$sql.=" AND error_type IN ($error_types)";
$sql.=' ORDER BY RAND()';
$sql.=' LIMIT 1';


//echo "$sql\n";


// build a GeoJSON Feature Collection with a null geometry (because we don't
// have the linestrings here) and include the error fields in the properties section
echo '{"type": "FeatureCollection", "features": [';

foreach ($db->query($sql) as $row) {
	echo '{ ';
	echo '"geometry": {"type": "Point", ';
	echo '"coordinates": [' . $row['lo'] . ', '. $row['la'] . ']},';


	echo '"type": "Feature", ';
	echo '"properties": {';

	echo '"id": ' . $row['object_id'] . ', ';
	echo '"object_type": "' . $row['object_type'] . '"';
	echo '}, "id": null }';
}

echo '] }';

?>
