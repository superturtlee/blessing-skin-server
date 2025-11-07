<?php

namespace App\Http\Controllers;

use App\Models\AbuseReport;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AbuseReportsController extends Controller
{
    // GET /admin/reports/yggdrasilreports/all
    public function getAllReports(): JsonResponse
    {
        $reports = AbuseReport::orderByDesc('id')->get();

        // 直接返回 JSON（浏览器可另存为）
        return response()->json(
            $reports,
            200,
            [],
            JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE
        );
    }

    // DELETE /admin/reports/yggdrasilreports/all
    public function deleteAllReports(): JsonResponse
    {
        $deleted = AbuseReport::query();
        AbuseReport::truncate();
        return response()->json([
            'deleted' => $deleted,
        ]);
    }

    // GET /admin/reports/yggdrasilreports/{reportuuid}
    public function getReport(string $reportuuid): JsonResponse
    {
        $report = AbuseReport::where('report_id', $reportuuid)->first();

        if (!$report) {
            return response()->json([
                'error' => 'NotFound',
                'errorMessage' => 'Report not found',
            ], 404);
        }

        return response()->json(
            $report,
            200,
            [],
            JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE
        );
    }

    // DELETE /admin/reports/yggdrasilreports/{reportuuid}
    public function deleteReport(string $reportuuid): JsonResponse
    {
        $deleted = AbuseReport::where('report_id', $reportuuid)->delete();

        if ($deleted === 0) {
            return response()->json([
                'error' => 'NotFound',
                'errorMessage' => 'Report not found',
            ], 404);
        }

        return response()->json(['deleted' => $deleted]);
    }

    // GET /admin/reports/yggdrasilreports/profile/{reportuuid}
    // 注意：此处的 {reportuuid} 为“举报者的 profile_uuid”
    public function getProfileReport(string $reportuuid): JsonResponse
    {
        $reports = AbuseReport::where('profile_uuid', $reportuuid)->orderByDesc('id')->get();

        if ($reports->isEmpty()) {
            return response()->json([
                'error' => 'NotFound',
                'errorMessage' => 'No reports for this profile_uuid',
            ], 404);
        }

        return response()->json(
            $reports,
            200,
            [],
            JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE
        );
    }

    // DELETE /admin/reports/yggdrasilreports/profile/{reportuuid}
    // 注意：此处的 {reportuuid} 为“举报者的 profile_uuid”
    public function deleteProfileReport(string $reportuuid): JsonResponse
    {
        $deleted = AbuseReport::where('profile_uuid', $reportuuid)->delete();

        if ($deleted === 0) {
            return response()->json([
                'error' => 'NotFound',
                'errorMessage' => 'No reports for this profile_uuid',
            ], 404);
        }

        return response()->json(['deleted' => $deleted]);
    }
}