<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ServiceRequest extends Model
{
    protected $fillable = [
        'customer_id',
        'provider_id',
        'service_id',
        'address',
        'latitude',
        'longitude',
        'problem_description',
        'request_type',
        'scheduled_at',
        'status',
        // Price fields
        'provider_service_price',
        'extra_charges',
        'extra_charges_reason',
        'final_price',
        'price_status',
    ];

    protected $casts = [
        'scheduled_at' => 'datetime',
        'latitude' => 'decimal:7',
        'longitude' => 'decimal:7',

        // Price fields
        'provider_service_price' => 'decimal:2',
        'extra_charges' => 'decimal:2',
        'final_price' => 'decimal:2',
    ];

    /*
    |--------------------------------------------------------------------------
    | Customer
    |--------------------------------------------------------------------------
    */

    public function customer(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'customer_id'
        );
    }


    /*
    |--------------------------------------------------------------------------
    | Provider
    |--------------------------------------------------------------------------
    */

    public function provider(): BelongsTo
    {
        return $this->belongsTo(
            Provider::class,
            'provider_id'
        );
    }


    /*
    |--------------------------------------------------------------------------
    | Service
    |--------------------------------------------------------------------------
    */

    public function service(): BelongsTo
    {
        return $this->belongsTo(
            Service::class,
            'service_id'
        );
    }

    public function requestProviders(): HasMany
    {
        return $this->hasMany(ServiceRequestProvider::class);
    }

    //review
    public function reviews(): HasMany
    {
        return $this->hasMany(
            Review::class,
            'service_request_id'
        );
    }
}