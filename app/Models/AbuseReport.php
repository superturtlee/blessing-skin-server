<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AbuseReport extends Model
{
    protected $table = 'abuse_reports';

    protected $fillable = [
        'report_id',
        'profile_uuid',
        'version',
        'report_type',
        'report',
        'client_version',
        'locale',
        'third_party_address',
        'realm_id',
        'realm_slot_id',
    ];

    protected $casts = [
        'report' => 'array',
        'version' => 'integer',
        'realm_slot_id' => 'integer',
    ];
}