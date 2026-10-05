<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('alertas', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('estacao_id')->constrained('estacoes')->cascadeOnDelete();
            $table->string('tipo'); // chuva_forte, nivel_rio
            $table->string('nivel'); // baixo, medio, alto, critico
            $table->text('mensagem');
            $table->timestamp('data_emissao');
            $table->string('status'); // ativo, resolvido
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('alertas'); }
};
