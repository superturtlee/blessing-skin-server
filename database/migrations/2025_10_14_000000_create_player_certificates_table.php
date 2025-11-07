<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreatePlayerCertificatesTable extends Migration
{
    public function up()
    {
        Schema::create('ygg_player_certificates', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('pid')->unique()->comment('Player ID');
            $table->text('private_key')->comment('RSA private key (PKCS8 with PKCS1 headers)');
            $table->text('public_key')->comment('RSA public key (PKCS8 with PKCS1 headers)');
            $table->text('public_key_signature')->comment('Public key signature V1');
            $table->text('public_key_signature_v2')->comment('Public key signature V2');
            $table->timestamp('expires_at')->comment('Certificate expiration time');
            $table->timestamp('refreshed_after')->comment('Time after which certificate should be refreshed');
            $table->timestamps();
            
            // 外键约束
            $table->foreign('pid')->references('pid')->on('players')->onDelete('cascade');
            
            // 索引
            $table->index('expires_at');
            $table->index('refreshed_after');
        });
    }

    public function down()
    {
        Schema::dropIfExists('ygg_player_certificates');
    }
}