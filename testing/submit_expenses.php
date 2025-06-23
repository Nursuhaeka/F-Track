<?php
$data = [
    'category' => $_POST['category'],  // or use $_GET or json if needed
    'amount' => $_POST['amount']
];

$options = [
    'http' => [
        'header'  => "Content-type: application/json\r\n",
        'method'  => 'POST',
        'content' => json_encode($data),
    ]
];

$context  = stream_context_create($options);
$response = file_get_contents('http://127.0.0.1:8000/push_expense', false, $context);

if ($response === FALSE) {
    echo json_encode(['status' => 'error', 'message' => 'Failed to contact Python API']);
} else {
    echo $response;
}
?>
