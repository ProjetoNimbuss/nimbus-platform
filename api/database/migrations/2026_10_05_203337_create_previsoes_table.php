<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('previsoes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('cidade');
            $table->string('estado');
            $table->date('data_previsao');
            $table->string('condicao');
            $table->decimal('temperatura_min', 5, 2);
            $table->decimal('temperatura_max', 5, 2);
            $table->decimal('probabilidade_chuva', 5, 2)->nullable();
            $table->decimal('volume_chuva_mm', 8, 2)->nullable();
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('previsoes'); }
};
