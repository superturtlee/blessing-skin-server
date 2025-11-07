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
        Schema::table('player_telemetry', function (Blueprint $table) {
            $table->boolean('optional_telemetry')->default(false)->after('enabled')->comment('Optional telemetry enabled status');
            $table->index('optional_telemetry');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('player_telemetry', function (Blueprint $table) {
            $table->dropIndex(['optional_telemetry']);
            $table->dropColumn('optional_telemetry');
        });
    }
};