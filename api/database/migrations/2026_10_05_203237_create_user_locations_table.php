<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('user_locations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('name', 100)->nullable();
            $table->geometry('location', subtype: 'point', srid: 4326);
            $table->string('address', 255)->nullable(); // Conversão de coordenadas para endereço
            $table->integer('alert_radius_meters')->default(5000);
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('user_locations'); }
};
