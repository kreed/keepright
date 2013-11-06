<?php

// Generates schemas for web schemata and error_types tables from data in config.php/error_types.php/schemas.php/~/.keepright
// Usage: php createWebSchemas.php > schema.sql

require('helpers.php');
require('../config/config.php');

echo "DROP TABLE IF EXISTS `schemata`;
CREATE TABLE `schemata` (
  `left` double NOT NULL,
  `right` double NOT NULL,
  `top` double NOT NULL,
  `bottom` double NOT NULL,
  `left_padded` double NOT NULL,
  `right_padded` double NOT NULL,
  `top_padded` double NOT NULL,
  `bottom_padded` double NOT NULL,
  `schema` varchar(6) NOT NULL,
  PRIMARY KEY (`schema`),
  KEY `leftright_padded` (`left_padded`,`right_padded`),
  KEY `topbottom_padded` (`top_padded`,`bottom_padded`),
  KEY `leftright` (`left`,`right`),
  KEY `topbottom` (`top`,`bottom`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;
INSERT INTO `schemata` VALUES ";

$comma=false;
foreach ($schemas as $k => $v) {
	if ($comma) echo ','; else $comma=true;

	$pad=get_bbox($k);
	echo "({$v['left']},{$v['right']},{$v['top']},{$v['bottom']},{$pad['left']},{$pad['right']},{$pad['top']},{$pad['bottom']},'$k')";
}

echo ";
UNLOCK TABLES;
";

echo "DROP TABLE IF EXISTS error_types;
CREATE TABLE `error_types` (
  `error_type` int(11) NOT NULL,
  `error_name` varchar(100) NOT NULL,
  `error_description` text NOT NULL,
  `error_class` varchar(255) NOT NULL DEFAULT 'error',
  `hidden` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`error_type`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
INSERT INTO error_types VALUES ";

$comma=false;
foreach ($error_types as $k => $v) {
	if ($v['enabled']) {
		if ($comma) echo ','; else $comma=true;

		echo "($k,'{$v['name']}',\"{$v['description']}\",'${v['class']}',0)";
		if (array_key_exists('subtype', $v)) {
			foreach ($v['subtype'] as $ks => $vs) {
				echo ",($ks,'$vs',\"{$v['description']}\",'{$v['class']}',0)";
			}
		}
	}
}

echo ";
UNLOCK TABLES;
";


?>
