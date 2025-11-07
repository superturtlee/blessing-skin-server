<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PlayerAttributes extends Model
{
    protected $table = 'ygg_player_attributes';

    protected $fillable = [
        'pid',
        'multiplayer_server_enabled',
        'online_chat_enabled',
    ];

    protected $casts = [
        'multiplayer_server_enabled' => 'boolean',
        'online_chat_enabled' => 'boolean',
    ];

    // 默认值（不存在记录时用于初始化）
    public const DEFAULTS = [
        'multiplayer_server_enabled' => true,
        'online_chat_enabled' => true,
    ];

    /**
     * 确保指定 pid 的记录存在，不存在则以默认值创建
     */
    public static function getAttr(int $pid): self
    {
        return static::firstOrCreate(
            ['pid' => $pid],
            self::DEFAULTS
        );
    }
}