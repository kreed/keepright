<?php


/*

-------------------------------------
-- addr:full without split-out addr: tags
-------------------------------------

addr:full can be difficult to parse in software. This check finds objects
with addr:full but no addr:housenumber/addr:housename tag.

*/


$tables = array('node'=>'node_tags', 'way'=>'way_tags', 'relation'=>'relation_tags');

// this loop will execute similar queries for all three *_tags tables
foreach ($tables as $object_type=>$table) {


	// find objects that have addr:full but no addr:housenumber or addr:housename
	query("
		INSERT INTO _tmp_errors(error_type, object_type, object_id, msgid, txt1, last_checked)
		SELECT $error_type, '$object_type', {$object_type}_id, 'This $1 has addr:full but no addr:housenumber or addr:housename. It would be nice if split-out address tags were added so that software can parse the address more easily.', '$object_type', NOW()

		FROM $table tags
		WHERE k='addr:full' AND NOT EXISTS(
			SELECT t.{$object_type}_id
			FROM $table t
			WHERE t.{$object_type}_id=tags.{$object_type}_id AND
			(t.k='addr:housenumber' OR t.k='addr:housename')
		)
		GROUP BY {$object_type}_id
	", $db1);

}

?>
