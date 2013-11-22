<?php

require('helpers.inc.php');

$db=db_connect();
$db->query("SET SESSION wait_timeout=60");

?>
<!DOCTYPE html>
<html>
<head>
<title>keep right!</title>
<link rel="stylesheet" href="http://cdn.leafletjs.com/leaflet-0.7/leaflet.css" />
<link rel="stylesheet" href="style.css">
<script src="http://cdn.leafletjs.com/leaflet-0.7/leaflet.js"></script>
<script src="keepright-min.js"></script>
</head>

<body>

<div id="outline">
<form name="myform" action="#" onsubmit="checkbox_click(); return false">

<a href="<?php echo $path; ?>"><img src="keepright.png" height=80 alt="keep-right logo"></a>&nbsp;
<?php

language_selector();

// echo checkboxes for error types
$subgroup_counter=0;
$error_types=array();
$subtypes = array();

$sql = "SELECT error_type, error_name, error_class, hidden
	FROM $error_types_name
	ORDER BY error_class, error_type";

foreach ($db->query($sql) as $row) {
	$et = $row['error_type'];
	$main_type=10*floor($et/10);

	if ($row['hidden'] == 0) {
		if ($et == $main_type) {	// not a subtype of an error
			$error_types[$main_type]=array($row['error_class'], $row['error_name']);

		} else {			// subtype of an error
			$subtypes[$main_type][$et]=$row['error_name'];
		}
	}
}

$class='';
$class_counter=1;
echo '<div>';
foreach ($error_types as $et=>$e) {

	if ($class!=$e[0]) {
		if ($class_counter != 1) echo "</ul></div><div>";

		mkcheckbox(-$class_counter, $e[0] . 's', true);
		echo "<ul>";

		$class=$e[0];
		$class_counter++;
	}

	echo "<li>";
	$has_subtypes = is_array($subtypes[$et]);
	if ($has_subtypes) $subgroup_counter++;

	mkcheckbox($et, $e[1], $has_subtypes, $class);

	if ($has_subtypes) {
		echo "<ul>";
		foreach ($subtypes[$et] as $st=>$sn) {
			echo "<li>";
			mkcheckbox($st, $sn);
			echo "</li>";
		}
		echo '</ul>';
	}

	echo "</li>";
}

// draws a checkbox with icon and label for a given error type and error name
function mkcheckbox($et, $en, $tristate=false, $class='error') {
	if ($tristate) {
		// tristate checkboxes get a special hidden checkbox to expand their children
		echo "<input type='checkbox' id='tree$et' name='tree$et'";
		if ($et < 0) echo " checked";
		echo "><label for='tree$et'></label>";
	}

	if ($et >= 0) {
		$img="img/zap" . 10*floor($et/10) . ".png"; // e.g. use icon 190 for types 191-199
		echo "\n\t<img height=12 src='$img' alt='error marker $et'>\n\t";
	}

	if ($tristate) {
		$name="tristate$et";
		echo "<input type='checkbox' id='$name' name='$name' onclick='javascript:tristate_click(this)'";
	} else {
		$name="ch$et";
		echo "<input type='checkbox' id='$name' name='$name' onclick='javascript:checkbox_click()'";
	}

	echo ">\n\t<label for='$name'>" . T_gettext($en) . "</label>\n";
}

echo "</ul></div>";

echo "
<input type='checkbox' id='show_ign' name='show_ign' value='1' onclick='javascript:checkbox_click();' " . ($show_ign ? 'checked="checked"' : '') . "><label for='show_ign'>" . T_gettext('show ignored errors') . "</label><br>

<input type='checkbox' id='show_tmpign' name='show_tmpign' value='1' onclick='javascript:checkbox_click();' " . ($show_tmpign ? 'checked="checked"' : '') . "><label for='show_tmpign'>" . T_gettext('show temp. ignored errors') . "</label><br>

<div>
<label for='userfilter'>" . T_gettext('Filter:') . "</label>
<input size='12' type='text' placeholder='" . T_gettext('user') . "' name='userfilter' id='userfilter'>
<input type='button' value='" . T_gettext('apply') . "' onClick='javascript:checkbox_click()'>
</div>


<a id='editierlink' target='_blank' href='#'>" . T_gettext('Open current map view on openstreetmap.org') . "</a><br>
<a id='rsslink' href='export.php'>RSS</a> <a id='gpxlink' href='export.php'>GPX</a>


<div>";
printf(T_gettext('You will see up to %d error markers starting in the center of the map. Please allow a few seconds for the error markers to appear after panning.'), $max_error_count);
echo '<br>';
printf(T_gettext('Site updated at %s'), '<span id="update_date"></span>');

echo "<br></div>
</form></div>
";


// the map goes in here:
echo '<div id="map"></div>';


// this is a hidden iframe into which the JOSM-Link is called (remote control plugin)
// it is also used as target for the comment-update forms
echo '<iframe style="display:none" id="hiddenIframe" name="hiddenIframe"></iframe>';

?>

<script>
var default_latlon=<?php echo $default_latlon ?>;
var default_zoom=<?php echo $default_zoom ?>;
<?php

// these text snippets are used in keepright.js:createErrorMarker(), where the error popup is created
$txt=array(
	'txt4'=>'edit in',
	'txt5'=>'JOSM',
	'txt6'=>'JOSM must be running and JOSM\'s remote control plugin must be enabled for this to work!',
	'txt7'=>'OSM.org',
	'txt8'=>'keep this error open',
	'txt9'=>'ignore temporarily (error corrected)',
	'txt10'=>'ignore (false-positive)',
	'txt11'=>'save',
	'txt12'=>'cancel',
	'txt13'=>'please click on the icon to fixate the bubble',
	'txt14'=>'link to here: error #',
	'txt15'=>'last edit of this'
);

foreach ($txt as $k=>$v) {
	echo "var $k=\"" . T_gettext($v) . "\";\n";
}

$highlight_error='';

$schema=$_GET['schema'];
$error_id=$_GET['error'];
if ($schema && $error_id) {
	$lat=0;
	$lon=0;

	$schema=preg_replace("/[^A-Za-z0-9 ]/", '', $schema);
	$stmt=$db->prepare("SELECT lat, lon, error_type FROM error_view_$schema WHERE error_id = ? LIMIT 1;");
	$stmt->execute([$error_id]);
	foreach ($stmt as $row) {
		$lat=$row['lat'] / 10e6;
		$lon=$row['lon'] / 10e6;
		$zoom=17;
		$error_type=$row['error_type'];
	}

	if ($lat && $lon) {
		$highlight_error="{schema: '$schema', error_id: $error_id, latlon: [$lat, $lon], zoom: $zoom, error_type: $error_type}";
	}
}

echo "init($highlight_error);\n";
?>
</script>
</body>
</html>
