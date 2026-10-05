<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('alertas_externos', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('orgao_emissor'); // INMET, Defesa Civil
            $table->string('severidade');
            $table->string('tipo_alerta');
            $table->text('descricao');
            $table->timestamp('inicio');
            $table->timestamp('fim');
            $table->string('link_oficial', 1024)->nullable();
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('alertas_externos'); }
};
