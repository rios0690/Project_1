<?php

	ini_set('display_errors', 'On');
	error_reporting(E_ALL);

	$executionStartTime = microtime(true);

	$url='https://newsapi.org/v2/top-headlines?country=' . $_REQUEST['country'] . '&apiKey=5373f9903a794210a67fcf09260a4f42';

	$ch = curl_init();
	curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
	curl_setopt($ch, CURLOPT_URL,$url);
	curl_setopt($ch, CURLOPT_HTTPHEADER, array(
		"Content-Type: application/json",
		"User-Agent: MyAppName/1.0.0",
	));

	$result=curl_exec($ch);

	curl_close($ch);

	$decode = json_decode($result,true);
	
	$news = [];

    for ($i = 0; $i < count($decode['articles']); $i++) {
        array_push($news, $decode['articles'][$i]);
    }


	$output['status']['code'] = "200";
	$output['status']['name'] = "ok";
	$output['status']['description'] = "success";
	$output['status']['returnedIn'] = intval((microtime(true) - $executionStartTime) * 1000) . " ms";
	$output['data'] = $news;
	
	header('Content-Type: application/json; charset=UTF-8');

	echo json_encode($output); 

?>
