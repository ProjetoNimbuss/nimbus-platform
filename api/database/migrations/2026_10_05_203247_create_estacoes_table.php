<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('estacoes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('nome');
            $table->decimal('latitude', 10, 8);
            $table->decimal('longitude', 11, 8);
            $table->string('tipo'); // pluviometrica, fluviometrica
            $table->string('status'); // operacional, inativa
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('estacoes'); }
};
