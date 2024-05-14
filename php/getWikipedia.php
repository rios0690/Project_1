<?php

$url ="http://api.geonames.org/findNearbyWikipediaJSON?username=carferrio&lat=" . $_REQUEST['lat'] . "&lng=" . $_REQUEST['lng'];
$executionStartTime = microtime(true);
$ch = curl_init();
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_URL,$url);

$result=curl_exec($ch);

curl_close($ch);


$decode = json_decode($result,true);

$wikipedia = [];

    for ($i = 0; $i < count($decode['geonames']); $i++) {
        array_push($wikipedia, $decode['geonames'][$i]);
    }

$output['status']['code'] = "200";
$output['status']['name'] = "ok";
$output['status']['description'] = "success";
$output['status']['returnedIn'] = intval((microtime(true) - $executionStartTime) * 1000) . " ms";
$output['data'] = $wikipedia;

header('Content-Type: application/json; charset=UTF-8');

echo json_encode($output);
?>
