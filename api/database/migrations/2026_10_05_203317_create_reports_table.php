<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('reports', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('tipo'); // alagamento, deslizamento
            $table->text('descricao')->nullable();
            $table->decimal('latitude', 10, 8);
            $table->decimal('longitude', 11, 8);
            $table->string('endereco', 255)->nullable();
            $table->string('status')->default('pendente'); // pendente, verificado, descartado
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('reports'); }
};
