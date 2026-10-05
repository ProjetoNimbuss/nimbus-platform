<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('leituras', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('estacao_id')->constrained('estacoes')->cascadeOnDelete();
            $table->timestamp('data_hora');
            $table->decimal('precipitacao_mm', 8, 2)->nullable();
            $table->decimal('nivel_rio_m', 8, 2)->nullable();
            $table->decimal('temperatura_c', 8, 2)->nullable();
            $table->decimal('umidade_relativa', 8, 2)->nullable();
            $table->timestamps();
            
            // Otimização recomendada no spike
            $table->index(['estacao_id', 'data_hora']);
        });
    }
    public function down(): void { Schema::dropIfExists('leituras'); }
};
