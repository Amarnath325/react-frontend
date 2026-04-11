<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Add CORS headers directly in route
Route::options('/{any}', function () {
    return response('', 200)
        ->header('Access-Control-Allow-Origin', 'http://localhost:5173')
        ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        ->header('Access-Control-Allow-Credentials', 'true');
})->where('any', '.*');

Route::get('/test', function () {
    return response()->json([
        'message' => 'Laravel backend is working!',
        'status' => 'success'
    ])->header('Access-Control-Allow-Origin', 'http://localhost:5173');
});
