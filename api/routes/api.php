<?php

use Illuminate\Support\Facades\Route;

// Rotas da API (prefixo /api aplicado automaticamente pelo Laravel).

Route::get('/health', fn () => response()->json(['status' => 'ok']));
