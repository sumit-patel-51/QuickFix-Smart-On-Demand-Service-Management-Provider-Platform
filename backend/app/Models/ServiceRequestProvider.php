<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ServiceRequestProvider extends Model
{
    protected $fillable = ['service_request_id', 'provider_id', 'status',];
    public function serviceRequest(): BelongsTo
    {
        return $this->belongsTo(ServiceRequest::class);
    }
    public function provider(): BelongsTo
    {
        return $this->belongsTo(Provider::class);
    }
}
