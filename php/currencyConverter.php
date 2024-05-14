<?php


	ini_set('display_errors', 'On');
	error_reporting(E_ALL);

	$executionStartTime = microtime(true);

	$url ='https://openexchangerates.org/api/latest.json?app_id=a9e4c3d459a545fb9fbcd7d8a694bca0&prettyprint=false&show_alternative=false';

    $ch = curl_init();
	curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
	curl_setopt($ch, CURLOPT_URL,$url);

	$result=curl_exec($ch);

	curl_close($ch);

	$decode = json_decode($result,true);	

	$money;
    foreach ($decode['rates'] as $key => $value) {
        if ($key ==  $_REQUEST['currencyIso']) {
            $money = $value;
            break;
        }
    }
	$output['status']['code'] = "200";
	$output['status']['name'] = "ok";
	$output['status']['description'] = "success";
	$output['status']['returnedIn'] = intval((microtime(true) - $executionStartTime) * 1000) . " ms";
	$output['data'] = $money;
	
	header('Content-Type: application/json; charset=UTF-8');

	echo json_encode($output); 

?>