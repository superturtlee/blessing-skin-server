<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('player_telemetry', function (Blueprint $table) {
            $table->id();
            $table->string('uuid', 32)->unique()->comment('Player UUID (without dashes)');
            $table->boolean('enabled')->default(false)->comment('Telemetry enabled status');
            $table->timestamps();

            $table->index('uuid');
            $table->index('enabled');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('player_telemetry');
    }
};