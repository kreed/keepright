<!DOCTYPE HTML>
<html>
  <head>
    <title>data consistency checks for OSM</title>
    <script type="text/javascript" src="keepright.js"></script>
  </head>
  <body>
<a href="/"><img border=0 src="keepright.png" alt="keep-right logo"></a>
data consistency checks for <a href="http://www.openstreetmap.org">OSM</a><hr>

<h2>historic logs</h2>

<?php
require('helpers.inc.php');
echo '<form name="myform" method="get" action="' . $_SERVER['PHP_SELF'] . '">';
echo '<div style="position:absolute; top:70px; right:10px;">'; language_selector(); echo '</div>';
echo "</form>";

echo '<br><br>';


// fetch announcements from db
$db=db_connect();
$db->query("SET SESSION wait_timeout=60");
announcements($db1, 1);

?>
</body>
</html>
