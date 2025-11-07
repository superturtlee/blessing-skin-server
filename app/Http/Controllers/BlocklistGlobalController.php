<?php

namespace App\Http\Controllers;

use App\Models\UserBlocklist;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BlocklistGlobalController extends Controller
{
    //not really attributes, but whatever
    //toggle if the player is blocked in the system blocklist (uid 0)
    public function toggleblocked(string $uuid): JsonResponse
    {
        $systemblocklist = UserBlocklist::queryBlocklist(0);
        if (in_array($uuid, $systemblocklist)) {
            UserBlocklist::removeBlocklist(0, $uuid);
            return response()->json([
                'uuid'=>$uuid,
                'blocked' => false,
            ]);
        }
        UserBlocklist::addBlocklist(0, $uuid);
        return response()->json([
            'uuid'=>$uuid,
            'blocked' => true,
        ]);
    }
    public function getblocked(string $uuid): JsonResponse
    {
        $systemblocklist = UserBlocklist::queryBlocklist(0);
        return response()->json([
            'uuid'=>$uuid,
            'blocked' => in_array($uuid, $systemblocklist),
        ]);
    }
    public function getallblocked(): JsonResponse
    {
        $blocklist = UserBlocklist::queryBlocklist(0);
        return response()->json([
            'blocklist' => $blocklist,
        ]);
    }
    public function clearallblocked(): JsonResponse
    {
        $deleted = UserBlocklist::clearBlocklist(0);
        return response()->json([
            'deleted' => $deleted,
        ]);
    }

}