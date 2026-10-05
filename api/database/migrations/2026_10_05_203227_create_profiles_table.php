<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('profiles', function (Blueprint $table) {
            $table->uuid('user_id')->primary();
            $table->foreign('user_id')->references('id')->on('users')->cascadeOnDelete();
            $table->string('full_name', 150)->nullable();
            $table->string('phone_number', 20)->nullable();
            $table->string('avatar_url', 1024)->nullable();
            $table->integer('reputation_score')->default(0);
            $table->timestamps();
        });
    }
    public function down(): void { Schema::dropIfExists('profiles'); }
};
