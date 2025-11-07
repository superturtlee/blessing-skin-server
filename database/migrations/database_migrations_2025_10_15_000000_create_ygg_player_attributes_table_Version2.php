<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('ygg_player_attributes', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('pid')->unique()->comment('玩家 pid（players.pid）');
            $table->boolean('multiplayer_server_enabled')->default(true)->comment('是否允许加入第三方服务器');
            $table->boolean('online_chat_enabled')->default(true)->comment('是否允许在线聊天');
            $table->timestamps();

            $table->index('pid');
        });
    }

    public function down()
    {
        Schema::dropIfExists('ygg_player_attributes');
    }
};