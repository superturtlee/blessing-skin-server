<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use InvalidArgumentException;

class UserBlocklist extends Model
{
    protected $table = 'user_blocklist';

    protected $fillable = [
        'uid',
        'uuid',
    ];

    /**
     * 规范化 UUID：去连字符、转小写，并校验为 32 位十六进制。
     */
    public static function normalizeUuid(string $uuid): string
    {
        $u = strtolower(str_replace('-', '', trim($uuid)));
        if (!preg_match('/^[0-9a-f]{32}$/', $u)) {
            throw new InvalidArgumentException('Invalid UUID format.');
        }
        return $u;
    }

    /**
     * 添加到用户的 blocklist（若已存在则直接返回该记录）。
     */
    public static function addBlocklist(int $uid, string $uuid): self
    {
        $u = self::normalizeUuid($uuid);

        // 使用 firstOrCreate 避免重复插入
        return self::firstOrCreate(
            ['uid' => $uid, 'uuid' => $u],
            ['uid' => $uid, 'uuid' => $u],
        );
    }

    /**
     * 从用户的 blocklist 删除指定 UUID。
     * 返回删除的行数（0 或 1）。
     */
    public static function removeBlocklist(int $uid, string $uuid): int
    {
        $u = self::normalizeUuid($uuid);

        return self::where('uid', $uid)
            ->where('uuid', $u)
            ->delete();
    }

    /**
     * 清空用户的 blocklist。
     * 返回删除的行数。
     */
    public static function clearBlocklist(int $uid): int
    {
        return self::where('uid', $uid)->delete();
    }

    /**
     * 查询用户的 blocklist，返回 UUID 字符串数组（无连字符、小写）。
     */
    public static function queryblocklist(int $uid): array
    {
        return self::where('uid', $uid)
            ->orderBy('id', 'asc')
            ->pluck('uuid')
            ->all();
    }

    /**
     * 判断某 UUID 是否在用户的 blocklist 中。
     */
    public static function isBlocked(int $uid, string $uuid): bool
    {
        $u = self::normalizeUuid($uuid);

        return self::where('uid', $uid)
            ->where('uuid', $u)
            ->exists();
    }

    /**
     * 返回 Eloquent 集合（如果后续需要携带时间戳等更多信息）。
     */
    public static function listRecords(int $uid): Collection
    {
        return self::where('uid', $uid)
            ->orderBy('id', 'asc')
            ->get(['id', 'uid', 'uuid', 'created_at', 'updated_at']);
    }
}