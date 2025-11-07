<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('user_blocklist', function (Blueprint $table) {
            $table->id();
            // 与 users.uid 对应（Blessing 使用 uid 作为主键）
            $table->unsignedInteger('uid')->comment('User UID');
            // 统一存储为 32 位无连字符小写十六进制 UUID
            $table->char('uuid', 32)->comment('Blocked profile UUID (no hyphen, lowercase)');
            $table->timestamps();

            $table->unique(['uid', 'uuid'], 'user_blocklist_uid_uuid_unique');
            $table->index('uid', 'user_blocklist_uid_idx');

            // 若你的 DB/表结构允许外键，可打开下面两行；否则保持注释
            // $table->foreign('uid')
            //       ->references('uid')->on('users')
            //       ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_blocklist');
    }
};