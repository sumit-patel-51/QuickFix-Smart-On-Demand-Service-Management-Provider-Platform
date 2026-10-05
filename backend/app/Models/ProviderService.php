<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProviderService extends Model
{
    protected $fillable = [
        'provider_id',
        'service_id',
        'price',
        'experience',
        'service_area',
        'service_image',
        'is_active',
    ];

       protected $casts = [
        'price' => 'decimal:2',
        'is_active' => 'boolean',
    ];


    public function provider(): BelongsTo
    {
        return $this->belongsTo(Provider::class);
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }
}