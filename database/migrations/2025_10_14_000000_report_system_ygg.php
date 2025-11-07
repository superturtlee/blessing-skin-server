<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('abuse_reports', function (Blueprint $table) {
            $table->id();
            $table->uuid('report_id')->unique()->comment('举报UUID');
            $table->string('profile_uuid', 36)->comment('举报者profile uuid');
            $table->integer('version');
            $table->string('report_type')->nullable();
            $table->json('report')->comment('原始举报内容');
            $table->string('client_version')->nullable();
            $table->string('locale')->nullable();
            $table->string('third_party_address')->nullable();
            $table->string('realm_id')->nullable();
            $table->integer('realm_slot_id')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('abuse_reports');
    }
};